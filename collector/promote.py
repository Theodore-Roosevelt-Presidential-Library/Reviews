#!/usr/bin/env python3
"""
Grow the theme vocabulary from what visitors actually say.

`analyze.py` labels each review from a fixed list and, separately, names anything
substantive the list has no word for (`unmatched`). This script watches those suggestions
and promotes one into the real vocabulary once visitors have raised it enough times, far
enough apart, to be a pattern rather than a coincidence.

Three rules make automatic promotion safe enough to run unattended:

1. **A promotion re-labels the entire corpus.** A theme added today that only applies to
   reviews analysed from today onward would start at zero and show explosive growth in its
   first period — a fake trend, and the exact failure the fixed list exists to prevent. The
   caller re-runs `analyze.py --all` whenever this script promotes something.
2. **Provenance is permanent.** Auto-added themes carry `source: "auto"`, the date, the
   evidence that promoted them, and the raw phrases they were built from. Nothing a machine
   coined can be mistaken for something a person wrote.
3. **One at a time, slowly.** At most one promotion per run, and only for a subject seen in
   several separate reviews spread over weeks. The vocabulary cannot lurch.

    python3 collector/promote.py            # promote if anything qualifies
    python3 collector/promote.py --dry-run  # report only
    python3 collector/promote.py --report   # show every candidate and its distance to the bar
"""

import argparse
import json
import re
import sys
from collections import defaultdict
from datetime import date

from common import CONFIG, THEMES_PATH, load_reviews, load_vocabulary, today, write_json

V = CONFIG.get("vocabulary", {})

# Words that describe the *shape* of a complaint rather than its subject. Two labels that
# share only one of these are not about the same thing: "dog policy" and "weapon policy"
# are unrelated, and clustering them would invent a theme nobody raised.
GENERIC = {
    "policy", "policies", "service", "services", "issue", "issues", "problem", "problems",
    "availability", "access", "experience", "area", "areas", "option", "options", "lack",
    "quality", "info", "information", "time", "times", "thing", "things", "level", "levels",
    "concern", "concerns", "general", "overall", "visitor", "visitors", "guest", "guests",
}

STEM_SUFFIXES = ("ies", "es", "s", "ing", "ed")


def stem(word: str) -> str:
    """Crude suffix stripping so 'shuttles' and 'shuttle' cluster.

    Deliberately not a real stemmer. This only has to make two visitor-facing phrases meet;
    a wrong stem costs a missed cluster, which the next review re-raises anyway.
    """
    if word == "ies" or len(word) < 5:
        return word
    for suffix in STEM_SUFFIXES:
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            return word[: -len(suffix)] + ("y" if suffix == "ies" else "")
    return word


def tokens(label: str) -> set:
    """The distinctive words in a label — what it's actually about."""
    return {stem(w) for w in re.findall(r"[a-z]{3,}", (label or "").lower())} - GENERIC


def cluster(labels: dict) -> list:
    """Group suggestions that name the same subject in different words.

    The model does not phrase things identically between runs: the same complaint came back
    as "explicit singing" one day and "explicit music" the next. Counting raw strings would
    let a real, recurring subject sit forever at one mention each.

    Two labels join if they share any distinctive word. That over-clusters occasionally
    ("winter weather" and "weather heat" both keep 'weather'), which is why a promotion
    records the phrases it was built from — a wrong merge is visible and reversible, and it
    is the cheaper error: a missed pattern is silent, a bad one is on screen.
    """
    groups = []  # list of [set_of_tokens, {label: [review, ...]}]
    for label, rows in sorted(labels.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        tok = tokens(label)
        if not tok:
            continue
        hit = next((g for g in groups if g[0] & tok), None)
        if hit:
            hit[0] |= tok
            hit[1][label] = rows
        else:
            groups.append([set(tok), {label: rows}])
    return groups


def canonical(phrases) -> str:
    """The label a cluster gets: its most-used phrase, as a theme-shaped slug.

    The visitors' own framing, not a synthesised one. `shuttle service` becomes
    `shuttle_service`, which sits beside `guided_tours` and `water_availability` without
    looking foreign.
    """
    best = max(phrases.items(), key=lambda kv: (len(kv[1]), -len(kv[0])))[0]
    return re.sub(r"\s+", "_", best.strip())[:32]


def candidates(reviews, vocab):
    """Every cluster of uncovered subjects, with the facts that decide promotion."""
    known = {t["label"] for t in vocab["themes"]}
    known_tokens = {frozenset(tokens(label.replace("_", " "))) for label in known}

    by_label = defaultdict(list)
    for r in reviews:
        if r.get("unmatched"):
            by_label[r["unmatched"]].append(r)

    out = []
    for toks, phrases in cluster(by_label):
        rows = [r for rs in phrases.values() for r in rs]
        ids = {r["id"] for r in rows}
        dates = sorted(d for d in (r.get("date") for r in rows) if d)
        span = 0
        if len(dates) > 1:
            span = (date.fromisoformat(dates[-1][:10]) - date.fromisoformat(dates[0][:10])).days
        slug = canonical(phrases)
        # Don't promote a second word for something already covered.
        duplicate = slug in known or any(toks & kt for kt in known_tokens)
        out.append({
            "label": slug,
            "phrases": sorted(phrases, key=lambda p: -len(phrases[p])),
            "reviews": len(ids),
            "span_days": span,
            "first_seen": dates[0] if dates else None,
            "last_seen": dates[-1] if dates else None,
            "evidence": sorted(ids)[:10],
            "duplicate_of_existing": duplicate,
        })
    out.sort(key=lambda c: (-c["reviews"], -c["span_days"]))
    return out


def qualifies(c):
    """Whether a candidate clears the bar, and why not if it doesn't."""
    if c["duplicate_of_existing"]:
        return False, "already covered by an existing theme"
    if c["reviews"] < V.get("min_reviews", 3):
        return False, f"{c['reviews']} of {V.get('min_reviews', 3)} reviews"
    if c["span_days"] < V.get("min_span_days", 14):
        return False, (f"raised over {c['span_days']} days, needs "
                       f"{V.get('min_span_days', 14)} — could still be one bad weekend")
    return True, "clears the bar"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="report, change nothing")
    ap.add_argument("--report", action="store_true", help="show every candidate and exit")
    args = ap.parse_args()

    reviews = load_reviews()["reviews"]
    vocab = load_vocabulary()
    cands = candidates(reviews, vocab)

    if args.report or args.dry_run:
        if not cands:
            print("no uncovered subjects suggested yet")
        for c in cands:
            ok, why = qualifies(c)
            print(f"  [{'PROMOTE' if ok else '  hold '}] {c['label']:<28} "
                  f"{c['reviews']}x over {c['span_days']}d — {why}")
            print(f"              phrases: {', '.join(c['phrases'])}")
        if args.report:
            return 0

    if not V.get("auto_promote", False):
        print("auto-promotion is off (config.json > vocabulary.auto_promote)")
        return 0

    # A full re-label is the price of an honest trend line. Above a certain corpus size that
    # stops being a few cents and a few minutes, so past the ceiling this only reports.
    ceiling = V.get("reanalyse_max_reviews", 2000)
    if len(reviews) > ceiling:
        print(f"corpus is {len(reviews)} reviews, over the {ceiling} re-analysis ceiling — "
              "reporting candidates only, promote by hand")
        return 0

    ready = [c for c in cands if qualifies(c)[0]][: V.get("max_per_run", 1)]
    if not ready:
        print("nothing qualifies for promotion")
        return 0

    for c in ready:
        vocab["themes"].append({
            "label": c["label"],
            "source": "auto",
            "promoted_on": today(),
            "promoted_from": c["phrases"],
            "reviews_at_promotion": c["reviews"],
            "span_days": c["span_days"],
            "evidence": c["evidence"],
        })
        print(f"promoted: {c['label']} ({c['reviews']} reviews over {c['span_days']} days, "
              f"from {', '.join(c['phrases'])})")

    if args.dry_run:
        print("dry run — themes.json not written")
        return 0

    write_json(THEMES_PATH, vocab)
    # The caller checks this file to decide whether a full re-label is needed. A promotion
    # that doesn't re-label the corpus is worse than no promotion at all.
    (THEMES_PATH.parent / ".promoted").write_text(
        json.dumps([c["label"] for c in ready]) + "\n")
    print(f"themes.json now has {len(vocab['themes'])} themes — "
          "re-run analyze.py --all so the whole corpus uses the new vocabulary")
    return 10  # distinct exit code: "promoted, re-analysis required"


if __name__ == "__main__":
    sys.exit(main())
