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


def check_entity(slug, docs):
    """Shape checks on the files the dashboard cannot render without, for one entity.

    An entity with no reviews yet is not an error — a listing can exist before anyone has
    reviewed it, and a newly added business is in exactly that state until the first
    collection lands. What *is* an error is a reviews file whose totals disagree with its
    metrics file, because the dashboard would then publish a number nothing supports.
    """
    base = f"data/{slug}"
    reviews = docs.get(f"{base}/reviews.json")
    if reviews is None:
        return fail(f"{base}/reviews.json is missing")
    rows = reviews.get("reviews")
    if not isinstance(rows, list):
        return fail(f"{base}/reviews.json has no reviews array")

    ids = [r.get("id") for r in rows]
    if len(set(ids)) != len(ids):
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        return fail(f"duplicate review ids in {base}/reviews.json: {', '.join(dupes[:5])}")
    if any(not r.get("id") or not r.get("source") for r in rows):
        return fail(f"a review in {base}/reviews.json is missing id or source")

    if not rows:
        print(f"  note  {slug}: no reviews collected yet — skipping metrics checks")
        return 0

    metrics = docs.get(f"{base}/derived/metrics.json")
    if metrics is None:
        return fail(f"{base}/derived/metrics.json is missing")
    for key in ("all_time", "windows", "triage", "series", "sources", "briefs"):
        if key not in metrics:
            return fail(f"{base}/derived/metrics.json is missing '{key}' — the dashboard reads it")

    if metrics["all_time"].get("count") != len(rows):
        return fail(f"{base}: metrics.json counts {metrics['all_time'].get('count')} reviews "
                    f"but reviews.json holds {len(rows)}. Re-run collector/derive.py "
                    f"--entity {slug}.")

    print(f"  ok    {slug}: {len(rows)} reviews, {len(metrics['triage'])} in triage")
    return 0


def main():
    errors = 0
    docs = {}

    slugs = list(json.loads((ROOT / "config.json").read_text())["entities"].keys())

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

    print(f"\nChecking {len(slugs)} entit{'y' if len(slugs) == 1 else 'ies'}")
    for slug in slugs:
        errors += check_entity(slug, docs)

    # A stray file directly under data/ is almost always a script that still writes to the
    # pre-multi-entity path, which would publish one business's numbers under another's tab.
    strays = [p.name for p in DATA.glob("*.json") if p.name != "entities.json"]
    if strays:
        return fail(f"unexpected file(s) directly under data/: {', '.join(strays)}. "
                    f"Entity data belongs in data/<slug>/.")

    if errors:
        print(f"\n{errors} entity check(s) failed", file=sys.stderr)
        return 1

    print("\nAll good.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
