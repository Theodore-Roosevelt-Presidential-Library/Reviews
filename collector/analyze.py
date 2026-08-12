#!/usr/bin/env python3
"""
Classify unanalysed reviews (themes + sentiment) and write a narrative summary.

The provider is configuration (see config.json > analysis), not code. Before any batch
is sent, `probe()` confirms the endpoint answers and the configured model is in the
catalogue — GitHub Models was retired underneath this project and the silent fallback hid
it for days, so a dead provider now announces itself on the first run.

If the model is unavailable or returns something unusable, the run falls back to keyword
rules and keeps going, but records that it did so. A broken model must not cost a day of
data, and must not be able to masquerade as a working one.

    python3 collector/analyze.py              # only reviews missing analysis
    python3 collector/analyze.py --all        # re-analyse everything
    python3 collector/analyze.py --no-model   # rules only, no network
    python3 collector/analyze.py --check      # preflight the provider and exit
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

import llm
from common import CONFIG, DERIVED, load_reviews, save_reviews, today, write_json

A = CONFIG["analysis"]

THEMES = [
    "interactive_exhibits", "ai_criticism", "data_privacy",
    "interpretation", "historical_balance", "guided_tours",
    "visitor_flow", "dwell_time", "families", "peer_comparison", "conservation_message",
    "architecture", "landscape", "rooftop", "boardwalk_trails", "grounds_conduct",
    "crowding", "capacity", "queues", "timed_entry", "sellouts", "walkup_expectations",
    "parking", "wayfinding_signage", "accessibility", "security_screening", "restrooms",
    "water_availability", "staff", "staff_training",
    "ticket_pricing", "age_tiers", "value_for_money", "retail", "retail_pricing",
    "food_beverage", "drive_market", "international_visitor", "media_driven_awareness",
]

SENTIMENTS = ["positive", "positive_with_criticism", "mixed", "negative"]

# Keyword fallback. Deliberately conservative — it is better to miss a theme than to
# assert one that isn't there.
RULES = {
    "parking": [r"\bparking\b", r"\bparked\b", r"\bparking lot\b"],
    "wayfinding_signage": [r"\bsignage\b", r"\bsigns?\b", r"\bhard to find\b"],
    "accessibility": [r"\bhandicap\b", r"\bwheelchair\b", r"\baccessib", r"\bmobility\b"],
    "crowding": [r"\bcrowd", r"\bpacked\b", r"\bbusy\b", r"\bbottleneck"],
    "queues": [r"\bline\b", r"\blines\b", r"\bwait(ed|ing)?\b", r"\bqueue"],
    "timed_entry": [r"\btime slot\b", r"\btimed entry\b", r"\breserv", r"\bin advance\b"],
    "sellouts": [r"\bsold out\b", r"\bsell(ing)? out\b"],
    "retail_pricing": [r"\bgift shop\b.{0,40}\b(pricey|overpriced|expensive)",
                       r"\b(pricey|overpriced|expensive)\b.{0,40}\bgift shop\b",
                       r"\bsouvenirs? were pricey\b"],
    "retail": [r"\bgift ?shop\b", r"\bsouvenir", r"\bstore\b"],
    "food_beverage": [r"\brestaurant\b", r"\bcafe\b", r"\bfood\b", r"\blunch\b", r"\beat\b"],
    "water_availability": [r"\bwater fountain\b", r"\bwater bottle\b", r"\bwater\b.{0,20}\bavailable\b"],
    "restrooms": [r"\brestroom", r"\bbathroom"],
    "staff": [r"\bstaff\b", r"\bemployee", r"\bfriendly\b"],
    "interactive_exhibits": [r"\binteractive\b", r"\bexhibit", r"\bwrist ?band\b",
                             r"\bbracelet\b", r"\bA\.?I\.?\b", r"\bhands.on\b"],
    # The AI experience is the most polarising thing in the building. Praise for it lands
    # under interactive_exhibits; this catches the objections, which are a distinct signal
    # and were previously invisible in the theme counts.
    "ai_criticism": [r"\bai slop\b", r"\bslop\b", r"\bgenerated\b.{0,25}\b(fake|creepy|cheap)\b",
                     r"\b(too much|overuse|over-use|overly reliant|reliance on)\b.{0,15}\bai\b",
                     r"\bai\b.{0,25}\b(disappointing|unnecessary|gimmick|off.?putting|cheapen)",
                     r"\bnot\b.{0,15}\breal artifacts?\b"],
    "data_privacy": [r"\bpersonal info", r"\bprivacy\b", r"\bmy (photo|picture|face)\b.{0,40}\b(taken|stored|used)\b",
                     r"\b(entering|give|provide|hand over)\b.{0,20}\b(email|personal information)\b",
                     r"\bfacial recognition\b", r"\bdata\b.{0,20}\b(collect|kept|stored)\b"],
    "architecture": [r"\barchitect", r"\bbuilding\b", r"\bdesign(ed)?\b"],
    "landscape": [r"\bbadlands\b", r"\bviews?\b", r"\blandscape\b", r"\bscenery\b"],
    "boardwalk_trails": [r"\bwalking paths?\b", r"\btrails?\b", r"\bboardwalk\b"],
    "rooftop": [r"\broof(top)?\b"],
    "families": [r"\bkids?\b", r"\bchildren\b", r"\bfamil", r"\bteen"],
    "dwell_time": [r"\b\d+\s*(\+)?\s*hours?\b"],
    "value_for_money": [r"\bworth (it|every|the)\b", r"\bvalue\b", r"\breasonable\b"],
    "ticket_pricing": [r"\badmission\b", r"\bticket price\b", r"\$\d+"],
    "security_screening": [r"\bsecurity\b", r"\bscanner\b"],
    "guided_tours": [r"\btour\b", r"\bguide[ds]?\b"],
    "peer_comparison": [r"\bbest museum\b", r"\bother (presidential )?librar", r"\bcompared to\b"],
    "conservation_message": [r"\bconservation\b", r"\bnational parks?\b", r"\bantiquities\b"],
}

SYSTEM_PROMPT = f"""You label visitor reviews for a presidential library.

For each review return:
- "themes": 1-5 values chosen ONLY from this list: {", ".join(THEMES)}
- "sentiment": exactly one of {", ".join(SENTIMENTS)}

Sentiment definitions:
- positive: praise, no meaningful complaint
- positive_with_criticism: clearly liked it AND named something specific to fix
- mixed: genuinely divided, or praise materially offset by criticism
- negative: dissatisfied overall

Never invent a theme that is not in the list. If nothing fits, return an empty theme array.
Reply with a JSON object: {{"results": [{{"id": "...", "themes": [...], "sentiment": "..."}}]}}
Return one entry per review, in the order given."""


def rules_classify(text):
    text_l = (text or "").lower()
    themes = [t for t, pats in RULES.items()
              if any(re.search(p, text_l, re.I) for p in pats)]
    return themes[:5]


def rules_sentiment(rating, text, recommends=None):
    if rating is None:
        # Facebook Recommendations are yes/no. Without this, every Facebook record
        # would come back with no sentiment and quietly vanish from the queue.
        if recommends is True:
            return "positive"
        if recommends is False:
            return "negative"
        return None
    if rating <= 2:
        return "negative"
    if rating == 3:
        return "mixed"
    negatives = [r"\bbut\b", r"\bunfortunately\b", r"\bonly negative\b", r"\boverpriced\b",
                 r"\btoo small\b", r"\bneed(s)? (to|more)\b", r"\bwish\b", r"\bshould\b"]
    if any(re.search(p, (text or "").lower()) for p in negatives):
        return "positive_with_criticism"
    return "positive"


def call_model(batch, client):
    """One classification batch. Returns {review_id: {themes, sentiment}}."""
    user = json.dumps([{"id": r["id"], "rating": r.get("rating"),
                        "text": (r.get("text") or "")[:1200]} for r in batch])
    content = client.complete(SYSTEM_PROMPT, user, json_mode=True)
    parsed = json.loads(content)
    results = parsed.get("results", parsed if isinstance(parsed, list) else [])
    return {r["id"]: r for r in results if isinstance(r, dict) and r.get("id")}


def apply_analysis(review, result, answered=False):
    """Apply a model result, falling back to rules only where the model gave nothing.

    `answered` means the model returned a record for this review — which is different
    from returning themes. The prompt explicitly permits an empty theme array when
    nothing in the vocabulary fits, and that is a signal worth keeping: it is how a
    genuinely new complaint becomes visible. Treating "no themes" as a failure and
    overwriting it with keyword guesses destroys the only early warning we have that the
    vocabulary has a gap.
    """
    themes = [t for t in (result.get("themes") or []) if t in THEMES][:5]
    sentiment = result.get("sentiment")
    if sentiment not in SENTIMENTS:
        sentiment = None

    if answered and sentiment:
        review["themes"] = themes          # may legitimately be []
        review["sentiment"] = sentiment
        review["analysis_source"] = "model"
        return

    review["themes"] = themes or rules_classify(review.get("text"))
    review["sentiment"] = sentiment or rules_sentiment(
        review.get("rating"), review.get("text"), review.get("recommends"))
    review["analysis_source"] = "rules"


def summarise(reviews, client):
    """One short narrative paragraph over the last 30 days of reviews."""
    from common import days_ago
    recent = [r for r in reviews
              if (days_ago(r.get("date")) is not None and days_ago(r.get("date")) <= 30)]
    if not recent:
        return None
    rated = [r["rating"] for r in recent if r.get("rating")]
    avg = round(sum(rated) / len(rated), 2) if rated else None
    lows = [r for r in recent if r.get("rating") and r["rating"] <= 3]

    facts = {
        "review_count": len(recent),
        "average_rating": avg,
        "critical_count": len(lows),
        "critical_reviews": [{"rating": r["rating"], "source": r["source"],
                              "text": (r.get("text") or "")[:600]} for r in lows[:6]],
        "theme_counts": {t: sum(1 for r in recent if t in (r.get("themes") or []))
                         for t in THEMES},
    }
    facts["theme_counts"] = {k: v for k, v in
                             sorted(facts["theme_counts"].items(),
                                    key=lambda kv: -kv[1])[:12] if v}

    prompt = (
        "Write 3-5 sentences summarising the last 30 days of visitor reviews for the "
        "Theodore Roosevelt Presidential Library, for the Library's communications team.\n\n"
        "Rules: use only the data given. Never invent a number or a quote. Be specific and "
        "plain-spoken — no marketing language, no words like 'world-class' or "
        "'transformative'. Lead with what changed or what needs attention, not with praise. "
        "Write in plain prose, no headings or bullets.\n\n"
        f"Data:\n{json.dumps(facts, indent=1)}"
    )
    return client.complete(None, prompt, temperature=0.2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true", help="re-analyse every review")
    ap.add_argument("--upgrade", action="store_true",
                    help="re-analyse anything the model has not classified yet (resumable)")
    ap.add_argument("--limit", type=int, help="stop after N reviews this run")
    ap.add_argument("--no-model", action="store_true", help="rules only, no network")
    ap.add_argument("--check", action="store_true",
                    help="preflight the configured provider and exit")
    ap.add_argument("--models", action="store_true",
                    help="list model ids this project can actually call, and exit")
    args = ap.parse_args()

    client, why = (None, "disabled by --no-model") if args.no_model else llm.build(A)

    # Preflight. Cheap, and the only thing standing between a retired endpoint and weeks
    # of regex output wearing a model's name.
    status, reason = "used", None
    if client:
        ok, detail = client.probe()
        print(f"provider: {A.get('provider')} · {A.get('model')} — {detail}", flush=True)
        if not ok:
            client, status, reason = None, "failed", detail
    else:
        status, reason = ("disabled" if args.no_model else "unavailable"), why
        print(f"provider unavailable: {why}", flush=True)

    if args.models:
        target = client or llm.build(A)[0]
        if not target or not hasattr(target, "list_models"):
            print("no usable provider to query", file=sys.stderr)
            return 1
        for m in target.list_models():
            print("  " + m)
        return 0

    if args.check:
        return 0 if client else 1

    doc = load_reviews()
    reviews = doc["reviews"]
    if args.all:
        pending = list(reviews)
    elif args.upgrade:
        # Anything not already model-classified. Lets a long backfill run in slices —
        # each invocation picks up where the last one stopped.
        pending = [r for r in reviews if r.get("analysis_source") != "model"]
    else:
        pending = [r for r in reviews
                   if not r.get("themes") or not r.get("sentiment")]
    if args.limit:
        pending = pending[:args.limit]
    print(f"{len(pending)} review(s) to analyse", flush=True)

    size = A.get("batch_size", 8)
    for i in range(0, len(pending), size):
        batch = pending[i:i + size]
        results = {}
        if client:
            try:
                results = call_model(batch, client)
            except (llm.ProviderError, json.JSONDecodeError, KeyError, TimeoutError) as exc:
                reason = str(exc)
                print(f"  !! model call failed — {reason}", file=sys.stderr, flush=True)
                client, status = None, "failed"
        for r in batch:
            apply_analysis(r, results.get(r["id"], {}), answered=r["id"] in results)
        # Save after every batch. A long backfill that dies at review 300 should not
        # throw away the first 299.
        save_reviews(doc)
        print(f"  {min(i + size, len(pending))}/{len(pending)}", flush=True)

    save_reviews(doc)

    summary = None
    if client:
        try:
            summary = summarise(reviews, client)
        except Exception as exc:
            reason = reason or str(exc)
            print(f"  summary generation failed: {exc}", file=sys.stderr, flush=True)

    from collections import Counter
    sources = Counter(r.get("analysis_source") for r in reviews)
    write_json(DERIVED / "summary.json", {
        "generated": today(),
        "text": summary,
        "generated_by": f"{A.get('provider')}:{A.get('model')}" if summary else None,
        "provider": A.get("provider"),
        "model": A.get("model"),
        "model_status": status,
        "model_error": reason,
        "classified_by": {k or "carried_over": v for k, v in sources.items()},
    })

    print(f"\nanalysis source: {dict(sources)}")
    if status != "used":
        print(f"MODEL NOT USED — status={status}" + (f", reason={reason}" if reason else "")
              + "\nThemes and sentiment came from keyword rules. Supported, but not the "
                "model path — fix the provider or set analysis.provider to 'rules'.",
              file=sys.stderr, flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
