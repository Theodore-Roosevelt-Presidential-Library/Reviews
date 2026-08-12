"""
Build the executive brief that sits at the top of the dashboard.

Three questions, in the order a CCMO asks them:

    What's happening?      volume and rating direction
    How are people reacting?  what they praise, and what divides them
    What could we do better?  the fixable complaints, ranked by how often they cost stars

The prose is assembled from the data, not from a language model, so it is available on
every run and can never invent a number. `analyze.py` may add a model-written paragraph
alongside it; this is the floor, not the ceiling.

Deliberately says nothing about individual reviewers. Naming a member of the public in a
headline summary is both unkind and legally careless, and a ranked list of named critics
is not something a presidential library should publish.
"""

from collections import Counter

# Themes that describe something the Library controls and could change. Used to separate
# "here is what to fix" from "here is what people liked".
ACTIONABLE = {
    "walkup_expectations": "walk-up visitors arriving without tickets",
    "timed_entry": "confusion about timed entry",
    "sellouts": "dates selling out before visitors plan",
    "queues": "queues at entry",
    "crowding": "crowding inside the galleries",
    "capacity": "capacity pressure",
    "parking": "parking capacity",
    "wayfinding_signage": "wayfinding and signage",
    "accessibility": "accessible parking and routes",
    "security_screening": "the screening process",
    "restrooms": "restroom capacity",
    "water_availability": "water availability",
    "staff_training": "front-line staff knowledge",
    "retail_pricing": "museum store pricing",
    "food_beverage": "the food offer",
    "ticket_pricing": "ticket pricing",
    "age_tiers": "where the adult ticket age begins",
    "ai_criticism": "the reaction against the AI experience",
    "data_privacy": "discomfort with giving a name, email and photo at entry",
    "visitor_flow": "how visitors move through the galleries",
}

PRAISE = {
    "interactive_exhibits": "the interactive exhibits",
    "architecture": "the building",
    "landscape": "the setting",
    "boardwalk_trails": "the walking paths",
    "rooftop": "the rooftop",
    "staff": "the staff",
    "families": "how well it works for families",
    "value_for_money": "value for the ticket price",
    "conservation_message": "the conservation story",
    "peer_comparison": "how it compares to other presidential libraries",
}


def _plural(n, singular, plural=None):
    return singular if n == 1 else (plural or singular + "s")


def _direction(delta, up="up", down="down", flat="flat"):
    if delta is None:
        return flat
    if delta > 0.005:
        return up
    if delta < -0.005:
        return down
    return flat


def build(reviews, windows, triage, pre_opening, window="30"):
    """Return the brief as structured data plus rendered prose."""
    w = windows.get(window) or {}
    cur, prior, delta = w.get("current", {}), w.get("prior", {}), w.get("delta", {})
    n, avg = cur.get("count", 0), cur.get("average")

    if not n:
        return {
            "window": window,
            "headline": "No reviews in this window",
            "paragraphs": ["Nothing has come in over this period. Widen the window, or "
                           "check that collection ran."],
            "actions": [],
        }

    # ---- what's happening -------------------------------------------------
    vol_delta = delta.get("count")
    avg_delta = delta.get("average")
    low_pct = cur.get("pct_low")

    if avg is not None and avg >= 4.7:
        headline = f"Ratings holding at {avg} across {n} {_plural(n, 'review')}"
    elif avg is not None and avg >= 4.3:
        headline = f"Ratings easing to {avg} across {n} {_plural(n, 'review')}"
    else:
        headline = f"Ratings at {avg} across {n} {_plural(n, 'review')} — worth attention"

    vol_phrase = {
        "up": f"up {abs(vol_delta)} on the previous {window} days",
        "down": f"down {abs(vol_delta)} on the previous {window} days",
        "flat": "level with the previous period",
    }[_direction(vol_delta)] if vol_delta is not None else "with no prior period to compare"

    rating_phrase = {
        "up": f"The average is up {abs(avg_delta)}.",
        "down": f"The average is down {abs(avg_delta)}.",
        "flat": "The average is essentially unchanged.",
    }[_direction(avg_delta)] if avg_delta is not None else ""

    para_happening = (
        f"{n} {_plural(n, 'review')} in the last {window} days, {vol_phrase}. "
        f"{rating_phrase} "
        f"{low_pct}% rated three stars or below."
    ).replace("  ", " ").strip()

    # ---- how people are reacting -----------------------------------------
    themes = cur.get("themes", {}) or {}
    praised = [(PRAISE[t], c) for t, c in themes.items() if t in PRAISE]
    praised.sort(key=lambda x: -x[1])
    top_praise = [p for p, _ in praised[:3]]

    if len(top_praise) >= 2:
        praise_str = ", ".join(top_praise[:-1]) + " and " + top_praise[-1]
    elif top_praise:
        praise_str = top_praise[0]
    else:
        praise_str = "the visit overall"

    # A theme is divisive when it shows up in both the praise and the complaints.
    low_reviews = [r for r in reviews
                   if r.get("rating") and r["rating"] <= 3
                   and r.get("date", "") >= (w.get("range") or ["", ""])[0]]
    low_themes = Counter(t for r in low_reviews for t in (r.get("themes") or []))

    para_reaction = f"Visitors are consistently praising {praise_str}."
    k = low_themes.get("ai_criticism", 0)
    ai_all_time = sum(1 for r in reviews
                      if "ai_criticism" in (r.get("themes") or []))
    if k >= 2:
        para_reaction += (
            f" The AI experience is the sharpest split in the feedback: it is the most "
            f"praised feature in the building and the named reason for {k} low "
            f"{_plural(k, 'rating')} in this window."
        )
    elif k == 1 or ai_all_time:
        # Real but low-volume. Say so precisely rather than inflating it — this theme
        # matters because of who tends to raise it, not because of how often.
        para_reaction += (
            f" The AI experience continues to divide a small minority: {ai_all_time} "
            f"{_plural(ai_all_time, 'review')} to date name it as the reason for a low "
            f"rating, against heavy praise for the same feature. Low volume, but it is the "
            f"most likely subject of a critical feature story."
        )

    # ---- what we could do better -----------------------------------------
    ranked = [(ACTIONABLE[t], c) for t, c in low_themes.items() if t in ACTIONABLE]
    ranked.sort(key=lambda x: -x[1])
    actions = [{"issue": label, "mentions": c} for label, c in ranked[:4]]

    unanswered = len(triage)
    overdue = sum(1 for t in triage if (t.get("overdue_by") or 0) > 0)

    if actions:
        lead = actions[0]
        rest = [a["issue"] for a in actions[1:3]]
        para_better = (
            f"The complaints that cost us stars cluster tightly. The most frequent is "
            f"{lead['issue']} ({lead['mentions']} {_plural(lead['mentions'], 'mention')})"
        )
        if rest:
            para_better += ", followed by " + " and ".join(rest)
        para_better += (
            ". These are operational and messaging fixes rather than problems with the "
            "experience itself, which is the better problem to have."
        )
    else:
        para_better = ("No complaint appears often enough in this window to form a pattern "
                       "worth acting on.")

    if unanswered:
        para_better += (
            f" Separately, {unanswered} {_plural(unanswered, 'review')} {_plural(unanswered, 'is', 'are')} "
            f"waiting on a reply and {overdue} {_plural(overdue, 'is', 'are')} past our own "
            f"service level."
        )

    # ---- context note, no names ------------------------------------------
    notes = []
    pre_n = (pre_opening or {}).get("count") or 0
    if pre_n:
        pre_avg = pre_opening.get("average")
        notes.append(
            f"{pre_n} {_plural(pre_n, 'review')} predate public opening, averaging {pre_avg}. "
            "These are press, donor and Founding Member previews. They count toward "
            "all-time figures but are held out of the response queue."
        )

    return {
        "window": window,
        "headline": headline,
        "paragraphs": [para_happening, para_reaction, para_better],
        "actions": actions,
        "notes": notes,
        "stats": {
            "count": n, "average": avg, "count_delta": vol_delta,
            "average_delta": avg_delta, "pct_low": low_pct,
            "unanswered": unanswered, "overdue": overdue,
        },
    }
