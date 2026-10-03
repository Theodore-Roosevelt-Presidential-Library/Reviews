#!/usr/bin/env python3
"""
Choose the passages worth putting on trlibrary.com, and build the embeddable widget.

This is the only part of the pipeline whose output faces the public on the Library's own
site, so it is the strictest. Two rules hold it together:

**Every excerpt is a verbatim substring of the stored review.** The model chooses where a
quote starts and stops; it never writes one. Anything that doesn't match its source
character-for-character after whitespace normalisation is discarded, not repaired. A
presidential library that tidies a visitor's grammar into quotation marks has published a
fabricated quote, and the standard we hold TR's words to is the standard these get.

**The widget ships as JavaScript with the quotes already inside it.** A script tag has no
same-origin restriction, so www.trlibrary.com embedding from reviews.labs.trlibrary.com needs
no CORS headers, no fetch, and has no failure mode where the block renders empty. One
request, no flash of nothing.

    python3 collector/pullquotes.py            # refresh the pool and rebuild embed.js
    python3 collector/pullquotes.py --dry-run  # show what would be chosen
    python3 collector/pullquotes.py --rebuild  # rebuild embed.js from the stored pool only
"""

import argparse
import json
import re
import sys
import unicodedata
from datetime import date, timedelta

import llm
from common import (CONFIG, DATA, ENTITY, ROOT, load_reviews, theme_labels, today,
                    write_json)

VOCAB = theme_labels()

Q = CONFIG.get("pullquotes", {})
POOL_PATH = DATA / "pullquotes.json"

MIN_LEN, MAX_LEN = 60, 220


def norm(text: str) -> str:
    """Collapse whitespace and unify quote characters for comparison only.

    Never used to alter what gets published — only to decide whether the model's excerpt is
    genuinely present in the source. Scrapers hand back curly quotes where the original had
    straight ones, and that difference must not be mistaken for a rewrite.
    """
    text = unicodedata.normalize("NFKC", text or "")
    text = (text.replace("‘", "'").replace("’", "'")
                .replace("“", '"').replace("”", '"')
                .replace("–", "-").replace("—", "-"))
    return re.sub(r"\s+", " ", text).strip()


def verify(excerpt: str, source: str):
    """Is this excerpt really in that review? Returns (ok, reason-or-cleaned-quote).

    Case-sensitive, with exactly one allowance: the model may capitalise the first letter
    when the excerpt starts mid-sentence. That is ordinary editorial practice, it changes
    no word, and rejecting it would throw away good quotes for nothing.

    The allowance is written down here because it used to be accidental. `norm()` folded
    case, so the comparison was case-insensitive everywhere while the module docstring
    promised character-for-character — and a quote shipped to trlibrary.com reading "The AI
    interactive spots were amazing" where the reviewer had written "the". Harmless in
    itself; the problem was that the gate was quietly weaker than its contract, which is
    the one thing a verbatim check cannot afford to be. A bounded, deliberate exception is
    safe. An unbounded one that nobody chose is not.
    """
    if not excerpt or not source:
        return False, "empty"
    clean = excerpt.strip().strip('"“”').strip()
    clean = re.sub(r"^\.{3}|^…", "", clean)
    clean = re.sub(r"\.{3}$|…$", "", clean).strip()
    if not (MIN_LEN <= len(clean) <= MAX_LEN):
        return False, f"length {len(clean)} outside {MIN_LEN}-{MAX_LEN}"

    n_src = norm(source)
    if norm(clean) in n_src:
        return True, clean

    # The single allowance: same text, first letter lowercased back to the source's.
    if clean[:1].isupper():
        lowered = clean[0].lower() + clean[1:]
        if norm(lowered) in n_src:
            # Publish the capitalised form — it reads as a sentence and the word is
            # unchanged — but only now that it has been proved identical otherwise.
            return True, clean

    return False, "not a verbatim substring of the review"


def display_author(name: str) -> str:
    """First name plus last initial.

    These are real people who wrote a review, not a testimonial they agreed to give. The
    platform shows a full name; a marketing block on the Library's own site does not need to.
    """
    parts = [p for p in re.split(r"\s+", (name or "").strip()) if p]
    if not parts:
        return "A visitor"
    if len(parts) == 1:
        return parts[0][:24]
    return f"{parts[0][:20]} {parts[-1][0].upper()}."


# Deterministic screen, applied before anything reaches the model critic. Prompt rules are
# guidance; a model that ignores one leaves no trace. These patterns are the classes of
# failure actually observed in testing, and they fail closed.
#
# The concession clause is the dangerous one. "Outstanding, even if I might have a few
# quibbles with the museum's interpretations of TR's career" was selected as a promotional
# quote — a criticism, on the subject the response playbook routes to Tier 1, on the
# Library's own homepage. A five-star rating does not mean five-star sentences.
HEDGE = [
    r"\beven if\b", r"\balthough\b", r"\bthough\b", r"\bhowever\b", r"\bquibbl",
    r"\bdownside\b", r"\bdrawback\b", r"\bcomplain", r"\bunfortunately\b",
    r"\bwish (they|it|there|we)\b", r"\bwould have (been|liked|preferred)\b",
    r"\bcould have been\b", r"\bonly (issue|problem|negative|thing)\b",
    r"\bnot (great|perfect|worth|much)\b", r"\ba (bit|little) (disappoint|underwhelm|much)",
    r"\bexpensive\b", r"\bpricey\b", r"\boverpriced\b", r"\btoo (many|much|long|crowded)\b",
    r"\bmissed\b", r"\blacking\b", r"\blacked\b", r"\bshould have\b",
]

# Subjects that must never appear in a promotional excerpt, whatever the sentiment.
OFF_LIMITS = [
    r"\bemail\b", r"\bsign ?up\b", r"\bregist", r"\bpersonal (info|data)\b",
    r"\byour (name|photo|face)\b", r"\bwrist ?band\b.{0,30}\b(enter|scan|give)\b",
    r"\b(covid|pandemic|opening (day|week)|grand opening|soft open)",
    r"\b(free|\$\d|price|ticket price|admission (is|was))\b",
]


def screen(quote):
    """Reject on pattern before spending a model call. Returns a reason or None."""
    q = " " + quote.lower() + " "
    for pat in HEDGE:
        if re.search(pat, q):
            return f"hedge/criticism: {re.search(pat, q).group(0).strip()}"
    for pat in OFF_LIMITS:
        if re.search(pat, q):
            return f"off-limits subject: {re.search(pat, q).group(0).strip()}"
    return None


CRITIC = """You are the final check before a customer quote is published on {possessive}
own website as promotional copy.

Reject the quote if ANY of these is true:
- It contains criticism, reservation, hedging, or a concession, however mild or polite.
- It contains a spelling error, typo, or grammatical mistake. It will be published exactly
  as written, so anything needing a [sic] is a rejection.
{critic_extra_rejects}
- It reads as generic praise that could describe any business of this kind anywhere.
- It would not make a stranger more likely to {action}.
- It names a staff member or another visitor.
- It cannot be understood without the rest of the review.

Be strict. Rejecting a usable quote costs nothing; publishing a bad one goes on
{stakes}. When uncertain, reject.

Reply with JSON: {"results":[{"id":"...","publish":true|false,"reason":"..."}]}"""


def critique(picked, client, batch_size=15):
    """Adversarial second pass. Only quotes that survive both screens ship."""
    kept, cut = [], []
    for i in range(0, len(picked), batch_size):
        batch = picked[i:i + batch_size]
        user = json.dumps([{"id": q["id"], "quote": q["quote"]} for q in batch],
                          ensure_ascii=False)
        try:
            verdicts = {v["id"]: v for v in
                        json.loads(client.complete(CRITIC, user, json_mode=True))["results"]}
        except Exception as exc:                      # noqa: BLE001
            # A critic that cannot be reached must not wave everything through.
            print(f"  critic batch failed, holding back {len(batch)}: {exc}", flush=True)
            cut += [dict(q, cut_reason="critic unavailable") for q in batch]
            continue
        for q in batch:
            v = verdicts.get(q["id"])
            if v and v.get("publish"):
                kept.append(q)
            else:
                cut.append(dict(q, cut_reason=(v or {}).get("reason", "no verdict")))
    return kept, cut


SYSTEM = """You select pull quotes for {possessive} website. The business is {business}.

Your job: from each review, find the ONE passage most likely to {goal}. Not the most
flattering passage — the most persuasive one.

What makes a passage work:
- It shows something specific. {specifics}
- It answers a hesitation a prospective customer actually has: {hesitations}.
- It sounds like a person talking, not a brochure. Slight informality is good.
- It stands alone. A reader seeing only this sentence understands it.

What to reject:
- Generic praise: "amazing", "a must see", "10/10", "highly recommend" with nothing attached.
- Anything needing the rest of the review to make sense ("this was the best part").
- Logistics, prices, hours, opening-week references, or anything that will date.
- Passages naming staff, or mentioning other visitors.
- Anything with a complaint in it, however mild.
{extra_rejects}
- Passages containing a misspelling or obvious typo. It has to be published exactly as
  written, so a passage that needs fixing is a passage to skip.
- Passages that begin mid-thought with "Also", "And", "But", "Plus", "It also".
- Procedural description of how a feature works. We want the reaction, not the mechanism.

Rules:
- Copy the passage EXACTLY as written, character for character. Do not fix spelling,
  grammar, capitalisation or punctuation. Do not join sentences that were not adjacent.
  If it is not worth quoting as written, return null for that review.
- 60 to 220 characters. You may start and end mid-review but not mid-word.
- Return null rather than forcing a weak quote. Most reviews should return null.

Also return:

- "draw": the single reason this quote would move someone to visit, as two or three
  lowercase words, e.g. "worth the drive", "kids stayed engaged", "the badlands view".

- "topics": which subjects THE QUOTED PASSAGE ITSELF is about, chosen only from the list
  below. Judge the passage alone, not the review around it. If the review praises the cafe
  but your chosen passage is about the exhibits, the passage is about the exhibits and the
  cafe must not appear. Return an empty array rather than reaching. These decide which page
  of the website the quote appears on, so a wrong one puts a quote about children's
  exhibits on the restaurant page.
  Choose from: {vocab}

Vary what you choose. If a review praises several things, prefer the one {avoid_assumed}.

Reply with JSON:
{"results":[{"id":"...","quote":"..." or null,"draw":"..." or null,"topics":[...]}]}"""
def _voice(template):
    """Fill the entity's voice into a prompt.

    The prompts used to name the Library outright. Pointed at the restaurant, the critic
    rejected every candidate for being "about food and a cafe, not the Theodore Roosevelt
    Presidential Library" — reasoning correctly from a brief that described the wrong
    business. The per-entity text lives in config.json > entities.<slug>.voice.
    """
    V = CONFIG.get("voice") or {}
    out = template.replace("{vocab}", ", ".join(VOCAB))
    for key in ("business", "possessive", "goal", "action", "stakes",
                "specifics", "hesitations", "avoid_assumed"):
        out = out.replace("{" + key + "}", V.get(key) or "")
    for key in ("extra_rejects", "critic_extra_rejects"):
        lines = V.get(key) or []
        block = "\n".join("- " + re.sub(r"\s+", " ", x).strip() for x in lines)
        out = out.replace("{" + key + "}", block)
    return out


SYSTEM = _voice(SYSTEM)
CRITIC = _voice(CRITIC)


def choose(reviews, client, batch_size=12):
    """Ask the model for one excerpt per review, then verify each against its source."""
    picked, rejected = [], []
    by_id = {r["id"]: r for r in reviews}

    for i in range(0, len(reviews), batch_size):
        batch = reviews[i:i + batch_size]
        payload = [{"id": r["id"], "review": (r.get("text") or "")[:1500]} for r in batch]
        user = ("Select one pull quote from each review, or null.\n\n"
                + json.dumps(payload, ensure_ascii=False))
        try:
            raw = client.complete(SYSTEM, user, json_mode=True)
            results = json.loads(raw).get("results", [])
        except Exception as exc:                      # noqa: BLE001
            print(f"  batch {i // batch_size + 1} failed: {exc}", flush=True)
            continue

        for item in results:
            src = by_id.get(item.get("id"))
            if not src or not item.get("quote"):
                continue
            ok, result = verify(item["quote"], src.get("text"))
            if not ok:
                # Kept and reported, never silently dropped. A model that starts inventing
                # quotes must be visible in the run log, not just absent from the output.
                rejected.append({"id": item["id"], "reason": result,
                                 "offered": item["quote"][:160]})
                continue
            flagged = screen(result)
            if flagged:
                rejected.append({"id": item["id"], "reason": flagged,
                                 "offered": result[:160]})
                continue
            picked.append({
                "id": src["id"],
                "quote": result,
                "draw": (item.get("draw") or "").strip().lower()[:40] or None,
                # Topics describe THE EXCERPT, not the review it came from. Using the
                # review's themes put two quotes about children's exhibits on the Where to
                # Eat page: their reviews mentioned the cafe in a sentence nobody quoted.
                # A page-targeted quote that isn't about the page is worse than a random one,
                # because it looks deliberate.
                "themes": [t for t in (item.get("topics") or []) if t in VOCAB][:5],
                "review_themes": src.get("themes") or [],
                "author": display_author(src.get("author")),
                "source": src["source"],
                "date": src.get("date"),
                "rating": src.get("rating"),
                "url": src.get("url"),
            })
        print(f"  {min(i + batch_size, len(reviews))}/{len(reviews)}", flush=True)

    return picked, rejected


def eligible(reviews):
    """Reviews worth even considering.

    Five stars only, recent enough to still describe the building people will walk into, and
    long enough to contain a passage rather than be one.
    """
    horizon = (date.today() - timedelta(days=Q.get("max_age_days", 540))).isoformat()
    opened = CONFIG["entity"].get("opened") or "0000-00-00"
    out = []
    for r in reviews:
        if r.get("rating") != 5 or not r.get("text"):
            continue
        d = (r.get("date") or "")[:10]
        # Pre-opening previews described a building that was not finished. They are honest
        # reviews and they stay in the dataset, but they do not belong in a visitation ad.
        if not d or d < opened or d < horizon:
            continue
        if len(r["text"]) < MIN_LEN + 20:
            continue
        out.append(r)
    out.sort(key=lambda r: r.get("date") or "", reverse=True)
    return out


def build_embed(pool):
    """Write the entity's embed bundle with the quotes already inside it.

    One file per business, named by config (entities.<slug>.embed). The Library's stays
    `embed.js` deliberately: that exact filename is already in a script tag on
    trlibrary.com, and renaming it to match a tidier scheme would blank the quote block
    on the live homepage the moment this deploys. A consistent naming convention is not
    worth breaking a page in production for.
    """
    template = (ROOT / "site" / "embed.template.js").read_text()
    quotes = [{k: q.get(k) for k in
               ("quote", "draw", "author", "source", "date", "url", "themes")}
              for q in pool["quotes"]]
    js = template.replace("/*__QUOTES__*/[]",
                          json.dumps(quotes, ensure_ascii=False, separators=(",", ":")))
    js = js.replace("/*__TOPICS__*/{}",
                    json.dumps({k: v for k, v in Q.get("topics", {}).items()
                                if not k.startswith("_")},
                               ensure_ascii=False, separators=(",", ":")))
    js = js.replace("__GENERATED__", pool["generated"])
    name = CONFIG.get("embed") or f"embed-{ENTITY}.js"
    out = ROOT / "site" / name
    out.write_text(js)
    print(f"{name} written — {len(quotes)} quotes, {len(js) // 1024}KB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--entity", default=None,
                    help="which business to work on; see config.json > entities")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--rebuild", action="store_true",
                    help="rebuild embed.js from the stored pool, no model calls")
    ap.add_argument("--limit", type=int, default=Q.get("consider", 60))
    args = ap.parse_args()

    if args.rebuild:
        if not POOL_PATH.exists():
            print(f"no stored pool at {POOL_PATH.relative_to(ROOT)} — nothing to rebuild")
            return 0
        build_embed(json.loads(POOL_PATH.read_text()))
        return 0

    reviews = load_reviews()["reviews"]
    # `generated` matters: build_embed stamps it into the bundle. A newly added business has
    # no pool file at all, and without the date here the first run died on a KeyError — in a
    # step marked continue-on-error, so the failure was swallowed and only showed up later
    # as a missing embed file.
    pool = (json.loads(POOL_PATH.read_text()) if POOL_PATH.exists()
            else {"generated": today(), "quotes": []})
    pool.setdefault("generated", today())
    pool.setdefault("quotes", [])
    have = {q["id"] for q in pool.get("quotes", [])}

    candidates = [r for r in eligible(reviews) if r["id"] not in have][:args.limit]
    print(f"{len(candidates)} new candidates from {len(reviews)} reviews")
    if not candidates:
        build_embed(pool)
        return 0

    client = llm.build(CONFIG["analysis"])
    client = client[0] if isinstance(client, tuple) else client
    picked, rejected = choose(candidates, client)
    print(f"\nselected {len(picked)}, rejected {len(rejected)} on verification and screening")
    for r in rejected[:6]:
        print(f"  ! {r['reason']}: {r['offered'][:80]}")

    picked, cut = critique(picked, client)
    print(f"\ncritic passed {len(picked)}, cut {len(cut)}")
    for c in cut[:6]:
        print(f"  x {c['cut_reason'][:70]}: {c['quote'][:70]}")

    if args.dry_run:
        for q in picked[:12]:
            print(f'\n  "{q["quote"]}"\n    — {q["author"]}, {q["source"]} · {q["draw"]}')
        return 0

    quotes = pool.get("quotes", []) + picked
    # Newest first, so the rotation leans on what the building is like now.
    quotes.sort(key=lambda q: q.get("date") or "", reverse=True)
    # Then thin out repetition. Left alone the model picks the interactive exhibits nearly
    # every time — they are genuinely the most-praised thing here — and a rotation of eight
    # quotes all saying the same thing reads as one quote shown eight times. Cap each draw
    # so the widget shows the range of reasons people give for being glad they came.
    cap, seen, spread = Q.get("max_per_draw", 3), {}, []
    for q in quotes:
        key = (q.get("draw") or "").strip() or q["id"]
        if seen.get(key, 0) >= cap:
            continue
        seen[key] = seen.get(key, 0) + 1
        spread.append(q)
    quotes = spread
    write_json(POOL_PATH, {
        "generated": today(),
        "note": "Curated pull quotes for the public widget. Every quote is a verbatim "
                "substring of the review it came from — see collector/pullquotes.py. "
                "Remove one by deleting its object and running --rebuild.",
        "rejected_last_run": rejected,
        "cut_by_critic_last_run": [{"quote": c["quote"], "reason": c["cut_reason"]}
                                   for c in cut],
        "quotes": quotes[:Q.get("pool_size", 40)],
    })
    print(f"pool now {min(len(quotes), Q.get('pool_size', 40))} quotes")
    build_embed(json.loads(POOL_PATH.read_text()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
