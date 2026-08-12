#!/usr/bin/env python3
"""
Pull reviews from each configured source via Apify and merge them into data/reviews.json.

Incremental by default: each source is asked only for reviews newer than the newest one
already stored, which keeps Apify credit use near zero on daily runs.

    python3 collector/collect.py                  # incremental, all enabled sources
    python3 collector/collect.py --full           # ignore stored dates, re-pull everything
    python3 collector/collect.py --source google
    python3 collector/collect.py --dry-run        # fetch and report, write nothing

Requires APIFY_TOKEN in the environment.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import date, timedelta

from common import (CONFIG, SNAPSHOTS, blank_record, load_reviews, make_id,
                    parse_date, save_reviews, today, write_json)

APIFY_BASE = "https://api.apify.com/v2"
# Re-pull a short overlap window so late-posted or edited reviews aren't missed.
OVERLAP_DAYS = 3


class ApifyError(RuntimeError):
    """An Apify API error carrying the response body, which is where the reason lives."""

    def __init__(self, status, body, url):
        self.status, self.body, self.url = status, body, url
        detail = ""
        try:
            err = json.loads(body).get("error", {})
            detail = f"{err.get('type', '?')}: {err.get('message', '')}".strip()
        except (ValueError, AttributeError):
            detail = (body or "")[:400]
        super().__init__(f"HTTP {status} — {detail}")


def http_json(url, payload=None, method="GET", token=None, timeout=120):
    headers = {"Accept": "application/json"}
    data = None
    if payload is not None:
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        # Apify puts the actual reason in the body. Losing it makes every failure
        # look identical, which is how we spent a run guessing at a 403.
        raise ApifyError(exc.code, exc.read().decode("utf-8", "replace"), url) from None


def run_actor(actor, payload, token, poll_seconds=10, timeout_seconds=1800):
    """Start an actor run, wait for it to finish, return its dataset items."""
    try:
        start = http_json(f"{APIFY_BASE}/acts/{actor}/runs", payload, "POST", token)["data"]
    except ApifyError as exc:
        if exc.status == 403:
            raise ApifyError(exc.status, exc.body, exc.url) from None
        raise
    run_id, dataset_id = start["id"], start["defaultDatasetId"]
    print(f"    run {run_id} started", flush=True)

    waited = 0
    while waited < timeout_seconds:
        time.sleep(poll_seconds)
        waited += poll_seconds
        run = http_json(f"{APIFY_BASE}/actor-runs/{run_id}", token=token)["data"]
        status = run["status"]
        if status in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
            break
        print(f"    ...{status} ({waited}s)", flush=True)
    else:
        raise TimeoutError(f"actor {actor} still running after {timeout_seconds}s")

    if status != "SUCCEEDED":
        msg = (run.get("statusMessage") or "").strip()
        raise RuntimeError(
            f"actor {actor} finished as {status}"
            + (f" — {msg}" if msg else "")
            + f". Log: https://console.apify.com/actors/runs/{run_id}")

    items = http_json(f"{APIFY_BASE}/datasets/{dataset_id}/items?clean=true&format=json",
                      token=token)
    print(f"    {len(items)} items returned", flush=True)
    return items


def first_of(item, *keys):
    """Return the first non-empty value among the given keys."""
    for k in keys:
        v = item.get(k)
        if v not in (None, "", [], {}):
            return v
    return None


def normalise(item, source):
    """Map one Apify item onto the stored review contract.

    Actor output shapes drift over time, so every field is looked up across the
    plausible key names and falls back to None. A record that has no text and no
    rating is dropped by the caller rather than stored as a hollow row.
    """
    rating = first_of(item, "stars", "rating", "reviewRating", "score")
    try:
        rating = int(round(float(rating))) if rating is not None else None
    except (TypeError, ValueError):
        rating = None
    if rating is not None and not 1 <= rating <= 5:
        rating = None

    # Prefer exact timestamps over relative strings like "4 days ago". Google supplies
    # both; publishedAtDate is the one that can sit on a timeline.
    date_str = parse_date(first_of(
        item, "publishedAtDate", "publishedDate", "date", "reviewDate",
        "createdAt", "time", "publishAt",
    ))

    author = first_of(item, "reviewerName", "name", "userName", "user", "author")
    if isinstance(author, dict):
        author = first_of(author, "name", "username", "displayName")
    author = str(author).strip() if author else None

    text = first_of(item, "text", "review", "reviewText", "comment", "body", "snippet") or ""
    if isinstance(text, dict):
        text = first_of(text, "text", "value") or ""
    text = str(text).strip()

    owner_reply = first_of(item, "responseFromOwnerText", "ownerResponse",
                           "responseFromOwner", "reply")
    if isinstance(owner_reply, dict):
        owner_reply = first_of(owner_reply, "text", "body")

    location = first_of(item, "reviewerLocation", "userLocation", "location", "city")
    if isinstance(location, dict):
        location = first_of(location, "name", "text")

    # Platform review ids are stable across runs; an author+date slug is not (two
    # reviews by one name on one day would collide, and a shifting date renames the row).
    platform_id = first_of(item, "reviewId", "id", "reviewID")
    if platform_id:
        digest = hashlib.sha1(str(platform_id).encode()).hexdigest()[:8]
        review_id = f"{source}-{(date_str or 'undated')[:10]}-{digest}"
    else:
        review_id = make_id(source, date_str, author or "anon")

    return blank_record(
        id=review_id,
        platform_id=str(platform_id) if platform_id else None,
        source=source,
        date=date_str,
        visit_period=(parse_date(first_of(item, "travelDate", "visitDate")) or "")[:7] or None,
        rating=rating,
        author=author,
        author_location=str(location) if location else None,
        trip_type=(str(first_of(item, "tripType", "travelType") or "").lower() or None),
        title=first_of(item, "title", "reviewTitle"),
        text=text,
        responded=bool(owner_reply),
        response_text=str(owner_reply) if owner_reply else None,
        url=first_of(item, "reviewUrl", "url", "directUrl"),
    )


def newest_stored_date(reviews, source):
    """Newest stored date for a source, considering only day-precision values.

    Some sources (notably Google) hand back relative dates like "a month ago", which we
    store at month precision as "2026-07". Those cannot seed an incremental window —
    feeding one to date.fromisoformat raises, and even if it parsed, a month-precision
    date would silently skip up to 30 days of reviews.
    """
    usable = []
    for r in reviews:
        if r.get("source") != source:
            continue
        d = r.get("date") or ""
        if len(d) != 10:
            continue
        try:
            date.fromisoformat(d)
        except ValueError:
            continue
        usable.append(d)
    return max(usable) if usable else None


def build_input(source_key, cfg, since):
    payload = dict(cfg.get("input") or {})
    payload["startUrls"] = [{"url": cfg["listing_url"]}]
    field = cfg.get("incremental_field")
    if field and since:
        payload[field] = since
    return payload


def collect_source(source_key, cfg, existing, token, full=False):
    supports_incremental = bool(cfg.get("incremental_field"))
    since = None
    if not full and supports_incremental:
        newest = newest_stored_date(existing, source_key)
        if newest:
            since = (date.fromisoformat(newest) - timedelta(days=OVERLAP_DAYS)).isoformat()

    if since:
        mode = f"incremental since {since}"
    elif supports_incremental:
        mode = "full (no usable stored date to resume from)"
    else:
        mode = "full (source has no incremental filter)"
    print(f"  {cfg['label']}: {mode}", flush=True)

    payload = build_input(source_key, cfg, since)
    items = run_actor(cfg["apify_actor"], payload, token)

    records, skipped = [], 0
    for item in items:
        rec = normalise(item, source_key)
        # A row with neither text nor a rating carries no information.
        if not rec["text"] and rec["rating"] is None:
            skipped += 1
            continue
        records.append(rec)

    if not items:
        # A clean run that returns nothing is not success — it usually means the input
        # was shaped wrong. Say so loudly instead of reporting "0 new" and moving on.
        print(f"  !! {cfg['label']}: actor succeeded but returned 0 items. "
              f"Input sent: {json.dumps(payload)}", file=sys.stderr, flush=True)
    elif skipped:
        print(f"    {skipped} item(s) skipped as empty", flush=True)
    return records


def fingerprint(rec):
    """Identity of a review independent of how it was collected.

    The baseline dataset was captured by hand, so those rows carry slug ids and, for
    Google, month-precision dates. When an actor returns the same review with a platform
    id and an exact timestamp, the two must collapse into one row rather than both
    surviving as near-duplicates.
    """
    text = re.sub(r"[^a-z0-9]+", "", (rec.get("text") or "").lower())[:120]
    if not text:
        return None
    return (rec.get("source"), text)


def merge(existing, incoming):
    """Merge on id, then on content fingerprint. Incoming wins on owner replies,
    on filling empty fields, and on date precision."""
    by_id = {r["id"]: r for r in existing}

    # Collapse hand-seeded rows into their collected equivalents.
    incoming_fps = {fingerprint(r): r for r in incoming if fingerprint(r)}
    superseded = 0
    for rid, old in list(by_id.items()):
        fp = fingerprint(old)
        if not fp or fp not in incoming_fps:
            continue
        new = incoming_fps[fp]
        if new["id"] == rid:
            continue
        # Carry across analysis already done, then drop the older row.
        new.setdefault("themes", old.get("themes") or [])
        if not new.get("themes"):
            new["themes"] = old.get("themes") or []
        new["sentiment"] = new.get("sentiment") or old.get("sentiment")
        del by_id[rid]
        superseded += 1
    if superseded:
        print(f"  {superseded} hand-seeded row(s) superseded by collected data", flush=True)

    added = updated = 0
    for rec in incoming:
        prior = by_id.get(rec["id"])
        if not prior:
            by_id[rec["id"]] = rec
            added += 1
            continue
        changed = False
        # An owner reply appearing is the update that matters most.
        if rec.get("responded") and not prior.get("responded"):
            prior["responded"] = True
            prior["response_text"] = rec.get("response_text")
            changed = True
        for field in ("text", "rating", "title", "author_location", "url", "visit_period"):
            if not prior.get(field) and rec.get(field):
                prior[field] = rec[field]
                changed = True
        # Never overwrite analysis already attached to a stored review.
        updated += 1 if changed else 0
    return list(by_id.values()), added, updated


def snapshot(reviews):
    """Record per-source aggregates computed from stored rows."""
    out = {"snapshot_date": today(), "computed_from": "stored reviews", "platforms": {}}
    for key, cfg in CONFIG["sources"].items():
        rows = [r for r in reviews if r.get("source") == key and r.get("rating")]
        if not rows:
            continue
        dist = {str(s): sum(1 for r in rows if r["rating"] == s) for s in range(1, 6)}
        out["platforms"][key] = {
            "label": cfg["label"],
            "review_count": len(rows),
            "rating_computed": round(sum(r["rating"] for r in rows) / len(rows), 2),
            "distribution": dist,
        }
    write_json(SNAPSHOTS / f"{today()}-metrics.json", out)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", help="collect a single source key")
    ap.add_argument("--full", action="store_true", help="ignore stored dates")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    token = os.environ.get("APIFY_TOKEN")
    if not token:
        sys.exit("APIFY_TOKEN is not set. Add it as a repository secret.")

    doc = load_reviews()
    existing = doc["reviews"]

    targets = {k: v for k, v in CONFIG["sources"].items()
               if v.get("enabled") and v.get("apify_actor")}
    if args.source:
        targets = {k: v for k, v in targets.items() if k == args.source}
        if not targets:
            sys.exit(f"No enabled source named {args.source!r}")

    incoming, failures = [], []
    for key, cfg in targets.items():
        try:
            incoming.extend(collect_source(key, cfg, existing, token, args.full))
        except Exception as exc:  # one bad source must not lose the others
            print(f"  !! {cfg['label']} failed: {exc}", file=sys.stderr)
            failures.append(key)

    merged, added, updated = merge(existing, incoming)
    print(f"\n{added} new, {updated} updated, {len(merged)} total")

    if args.dry_run:
        print("dry run — nothing written")
        return 0

    doc["reviews"] = merged
    save_reviews(doc)
    snapshot(merged)

    if failures and not added:
        # Nothing gained and something broke: make the run visibly red.
        print(f"all collection failed for: {', '.join(failures)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
