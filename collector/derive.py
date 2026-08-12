#!/usr/bin/env python3
"""
Compute everything the dashboard reads: rolling windows, deltas, theme trends,
the triage queue, and a daily series for charting.

The browser could do this, but doing it here means the numbers on screen are the same
numbers in git history — every run leaves an auditable record of what we believed.

    python3 collector/derive.py
"""

from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone

from brief import build as build_brief
from common import CONFIG, DERIVED, load_reviews, write_json

TRIAGE = CONFIG["triage"]
WINDOWS = CONFIG["windows"]


def to_date(s):
    try:
        return date.fromisoformat((s or "")[:10])
    except ValueError:
        return None


def window_stats(reviews, start, end):
    rows = [r for r in reviews
            if (d := to_date(r.get("date"))) and start <= d <= end]
    rated = [r["rating"] for r in rows if r.get("rating")]
    dist = Counter(rated)
    sentiments = Counter(r.get("sentiment") for r in rows if r.get("sentiment"))
    themes = Counter(t for r in rows for t in (r.get("themes") or []))

    return {
        "count": len(rows),
        "rated_count": len(rated),
        "average": round(sum(rated) / len(rated), 2) if rated else None,
        "distribution": {str(s): dist.get(s, 0) for s in range(1, 6)},
        "pct_5_star": round(100 * dist.get(5, 0) / len(rated), 1) if rated else None,
        "pct_low": round(100 * (dist.get(1, 0) + dist.get(2, 0) + dist.get(3, 0))
                         / len(rated), 1) if rated else None,
        "by_source": dict(Counter(r["source"] for r in rows)),
        "sentiment": dict(sentiments),
        "themes": dict(themes.most_common()),
        "unanswered": sum(1 for r in rows if not r.get("responded")),
    }


def delta(current, prior):
    """Change vs the immediately preceding window of the same length."""
    out = {}
    for key in ("count", "average", "pct_5_star", "pct_low"):
        c, p = current.get(key), prior.get(key)
        if c is None or p is None:
            out[key] = None
        else:
            out[key] = round(c - p, 2)
    return out


def theme_movement(current, prior, min_mentions=2):
    """Themes rising or falling between two windows, as share of reviews.

    Share rather than raw count, so a busy month doesn't make every theme look like
    it's growing.
    """
    moves = []
    keys = set(current["themes"]) | set(prior["themes"])
    for t in keys:
        c_n, p_n = current["themes"].get(t, 0), prior["themes"].get(t, 0)
        if max(c_n, p_n) < min_mentions:
            continue
        c_share = 100 * c_n / current["count"] if current["count"] else 0
        p_share = 100 * p_n / prior["count"] if prior["count"] else 0
        moves.append({
            "theme": t, "current": c_n, "prior": p_n,
            "current_share": round(c_share, 1), "prior_share": round(p_share, 1),
            "change": round(c_share - p_share, 1),
        })
    moves.sort(key=lambda m: -abs(m["change"]))
    return moves


OPENED = CONFIG["entity"].get("opened")


def is_pre_opening(r):
    """True if the review predates public opening day.

    Not the same as illegitimate. The Library ran press, donor, and Founding Member
    previews before July 4, and most of these reviews describe real visits. Only the
    low-rated ones are worth a human look, and even then the question is 'did this
    person actually come to a preview?' — not an automatic removal request.
    """
    if not OPENED:
        return False
    d = to_date(r.get("date"))
    return bool(d and d < date.fromisoformat(OPENED))


def triage(reviews, today_):
    """Anything needing a human, ordered by how overdue it is."""
    sla = TRIAGE["response_sla_days"]
    queue = []
    for r in reviews:
        if r.get("responded") or is_pre_opening(r):
            continue
        rating = r.get("rating")
        sentiment = r.get("sentiment")
        if rating is None and r.get("recommends") is False:
            # A "doesn't recommend" carries no stars but is unambiguously negative.
            tier, due = "negative", sla["negative"]
        elif rating is not None and rating <= TRIAGE["critical_rating_at_or_below"]:
            tier, due = "critical", sla["critical"]
        elif rating is not None and rating <= TRIAGE["needs_response_at_or_below"]:
            tier, due = "negative", sla["negative"]
        elif sentiment in ("positive_with_criticism", "mixed"):
            tier, due = "positive_with_criticism", sla["positive_with_criticism"]
        else:
            continue

        d = to_date(r.get("date"))
        age = (today_ - d).days if d else None
        queue.append({
            "id": r["id"], "source": r["source"], "date": r.get("date"),
            "rating": rating, "recommends": r.get("recommends"),
            "author": r.get("author"), "title": r.get("title"),
            "text": r.get("text"), "themes": r.get("themes") or [],
            "sentiment": sentiment, "url": r.get("url"),
            "tier": tier, "sla_days": due, "age_days": age,
            "overdue_by": (age - due) if age is not None else None,
        })
    order = {"critical": 0, "negative": 1, "positive_with_criticism": 2}
    queue.sort(key=lambda q: (order[q["tier"]], -(q["overdue_by"] or 0)))
    return queue


def daily_series(reviews, days=180):
    """Per-day counts and a 30-day trailing average, for the trend chart."""
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=days)
    by_day = defaultdict(list)
    for r in reviews:
        d = to_date(r.get("date"))
        if d and start <= d <= end and r.get("rating"):
            by_day[d].append(r["rating"])

    series, cursor = [], start
    while cursor <= end:
        ratings = by_day.get(cursor, [])
        trail = [x for d2, rs in by_day.items()
                 if cursor - timedelta(days=30) <= d2 <= cursor for x in rs]
        series.append({
            "date": cursor.isoformat(),
            "count": len(ratings),
            "average": round(sum(ratings) / len(ratings), 2) if ratings else None,
            "trailing_30_average": round(sum(trail) / len(trail), 2) if trail else None,
            "trailing_30_count": len(trail),
        })
        cursor += timedelta(days=1)
    return series


def main():
    doc = load_reviews()
    reviews = doc["reviews"]
    today_ = datetime.now(timezone.utc).date()

    windows = {}
    for n in WINDOWS:
        cur_start = today_ - timedelta(days=n - 1)
        prior_end = cur_start - timedelta(days=1)
        prior_start = prior_end - timedelta(days=n - 1)

        current = window_stats(reviews, cur_start, today_)
        prior = window_stats(reviews, prior_start, prior_end)
        windows[str(n)] = {
            "days": n,
            "range": [cur_start.isoformat(), today_.isoformat()],
            "prior_range": [prior_start.isoformat(), prior_end.isoformat()],
            "current": current,
            "prior": prior,
            "delta": delta(current, prior),
            "theme_movement": theme_movement(current, prior),
        }

    # Reviews without a usable day-precision date can't sit on a timeline. They still
    # count toward all-time totals, but they are invisible to every window — so say so
    # rather than let the two figures quietly disagree.
    undated = [{"id": r["id"], "source": r["source"], "date": r.get("date")}
               for r in reviews if not to_date(r.get("date"))]

    rated_all = [r["rating"] for r in reviews if r.get("rating")]
    payload = {
        "generated": today_.isoformat(),
        "entity": CONFIG["entity"]["name"],
        "excluded_from_windows": {
            "count": len(undated),
            "reason": "date is not day-precision, so the review cannot be placed in a window",
            "reviews": undated,
        },
        "all_time": {
            "count": len(reviews),
            "rated_count": len(rated_all),
            "average": round(sum(rated_all) / len(rated_all), 2) if rated_all else None,
            "distribution": {str(s): sum(1 for x in rated_all if x == s)
                             for s in range(1, 6)},
            "by_source": dict(Counter(r["source"] for r in reviews)),
            "unanswered": sum(1 for r in reviews if not r.get("responded")),
        },
        "sources": {k: {"label": v["label"], "reply_url": v.get("reply_url"),
                        "listing_url": v.get("listing_url")}
                    for k, v in CONFIG["sources"].items()},
        "pre_opening": {
            "opened": OPENED,
            "note": "Dated before public opening. Most are press, donor, and Founding "
                    "Member preview visits and are entirely legitimate. Only the "
                    "low-rated ones below are worth a human look.",
            "count": sum(1 for r in reviews if is_pre_opening(r)),
            "average": (lambda rs: round(sum(rs) / len(rs), 2) if rs else None)(
                [r["rating"] for r in reviews if is_pre_opening(r) and r.get("rating")]),
            "needs_review": [{"id": r["id"], "source": r["source"], "date": r.get("date"),
                              "rating": r.get("rating"), "author": r.get("author"),
                              "text": r.get("text"), "url": r.get("url")}
                             for r in sorted((x for x in reviews if is_pre_opening(x)
                                              and (x.get("rating") or 5) <= 3),
                                             key=lambda x: x.get("date") or "")],
        },
        "windows": windows,
        "triage": (queue := triage(reviews, today_)),
        "series": daily_series(reviews),
        "sla": TRIAGE["response_sla_days"],
    }

    # One brief per window, so switching the window switches the narrative with it.
    payload["briefs"] = {
        str(nn): build_brief(reviews, windows, queue, payload["pre_opening"], str(nn))
        for nn in WINDOWS
    }

    write_json(DERIVED / "metrics.json", payload)
    q = payload["triage"]
    print(f"metrics.json written — {len(reviews)} reviews, "
          f"{len(q)} in triage, "
          f"{sum(1 for x in q if (x['overdue_by'] or 0) > 0)} overdue")


if __name__ == "__main__":
    main()
