#!/usr/bin/env python3
"""
Gate on the data directory. Runs before anything is committed or deployed.

This exists because a git merge conflict was once committed straight into
data/derived/metrics.json and published. The dashboard is a static page reading that
file, so a single stray "<<<<<<< HEAD" takes the whole site down with nothing but a
JSON parse error to show for it. Cheap check, expensive failure.

    python3 collector/validate.py

Exits non-zero on the first problem, so a workflow step fails loudly.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

CONFLICT = re.compile(r"^(<{7} |={7}$|>{7} )", re.MULTILINE)


def fail(msg):
    print(f"  FAIL  {msg}", file=sys.stderr)
    return 1


def check_file(path):
    rel = path.relative_to(ROOT)
    raw = path.read_text(encoding="utf-8")

    hits = CONFLICT.findall(raw)
    if hits:
        line = raw[:CONFLICT.search(raw).start()].count("\n") + 1
        return fail(f"{rel}: git conflict markers, first at line {line}. "
                    f"Resolve, then regenerate with collector/derive.py.")

    try:
        doc = json.loads(raw)
    except json.JSONDecodeError as exc:
        return fail(f"{rel}: invalid JSON — {exc}")

    print(f"  ok    {rel}")
    return 0, doc


def main():
    errors = 0
    docs = {}

    files = sorted(DATA.rglob("*.json"))
    if not files:
        return fail("no JSON files under data/ — did collection run?")

    print(f"Checking {len(files)} file(s) under data/")
    for path in files:
        result = check_file(path)
        if result == 1:
            errors += 1
        else:
            docs[path.relative_to(ROOT).as_posix()] = result[1]

    if errors:
        print(f"\n{errors} file(s) failed", file=sys.stderr)
        return 1

    # Shape checks on the two files the dashboard cannot render without.
    reviews = docs.get("data/reviews.json")
    if reviews is None:
        return fail("data/reviews.json is missing")
    rows = reviews.get("reviews")
    if not isinstance(rows, list) or not rows:
        return fail("data/reviews.json has no reviews array")

    ids = [r.get("id") for r in rows]
    if len(set(ids)) != len(ids):
        return fail("duplicate review ids in data/reviews.json")
    if any(not r.get("id") or not r.get("source") for r in rows):
        return fail("a review is missing id or source")

    metrics = docs.get("data/derived/metrics.json")
    if metrics is None:
        return fail("data/derived/metrics.json is missing")
    for key in ("all_time", "windows", "triage", "series", "sources", "briefs"):
        if key not in metrics:
            return fail(f"metrics.json is missing '{key}' — the dashboard reads it")

    # The two files are generated from each other; if they disagree, derive.py did not
    # run after the last collection and the dashboard would show stale totals.
    if metrics["all_time"].get("count") != len(rows):
        return fail(f"metrics.json counts {metrics['all_time'].get('count')} reviews but "
                    f"reviews.json holds {len(rows)}. Re-run collector/derive.py.")

    print(f"\nAll good — {len(rows)} reviews, {len(metrics['triage'])} in triage.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
