#!/usr/bin/env python3
"""
Classify unanalysed reviews (themes + sentiment) and write a narrative summary.

Runs on GitHub Models, authenticated with the GITHUB_TOKEN already present in Actions.
Free tier caps input at ~8K tokens per request, so reviews go up in small batches.

If the model is unavailable, unreachable, or returns something unusable, the run falls
back to keyword rules and keeps going. A broken model must never cost us a day of data.

    python3 collector/analyze.py              # only reviews missing analysis
    python3 collector/analyze.py --all        # re-analyse everything
    python3 collector/analyze.py --no-model   # rules only, no network
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

from common import CONFIG, DERIVED, load_reviews, save_reviews, today, write_json

A = CONFIG["analysis"]

THEMES = [
    "interactive_exhibits", "interpretation", "historical_balance", "guided_tours",
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


def rules_sentiment(rating, text):
    if rating is None:
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


def call_model(batch, token, model, endpoint):
    payload = {
        "model": model,
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(
                [{"id": r["id"], "rating": r.get("rating"),
                  "text": (r.get("text") or "")[:1200]} for r in batch])},
        ],
    }
    req = urllib.request.Request(
        endpoint, data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {token}",
                 "Content-Type": "application/json",
                 "Accept": "application/json"},
        method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        body = json.loads(resp.read().decode())
    content = body["choices"][0]["message"]["content"]
    parsed = json.loads(content)
    results = parsed.get("results", parsed if isinstance(parsed, list) else [])
    return {r["id"]: r for r in results if isinstance(r, dict) and r.get("id")}


def apply_analysis(review, result):
    """Accept only values that pass validation. Anything else falls back to rules."""
    themes = [t for t in (result.get("themes") or []) if t in THEMES][:5]
    sentiment = result.get("sentiment")
    if sentiment not in SENTIMENTS:
        sentiment = None
    review["themes"] = themes or rules_classify(review.get("text"))
    review["sentiment"] = sentiment or rules_sentiment(review.get("rating"), review.get("text"))
    review["analysis_source"] = "model" if (themes and sentiment) else "rules"


def summarise(reviews, token, model, endpoint):
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
    payload = {"model": model, "temperature": 0.2,
               "messages": [{"role": "user", "content": prompt}]}
    req = urllib.request.Request(
        endpoint, data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode())["choices"][0]["message"]["content"].strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true", help="re-analyse every review")
    ap.add_argument("--no-model", action="store_true", help="rules only, no network calls")
    args = ap.parse_args()

    doc = load_reviews()
    reviews = doc["reviews"]

    pending = reviews if args.all else [
        r for r in reviews if not r.get("themes") or not r.get("sentiment")]
    print(f"{len(pending)} review(s) to analyse")

    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GITHUB_MODELS_TOKEN")
    use_model = bool(token) and not args.no_model
    if not use_model and pending:
        print("no model token available — using keyword rules")

    model, endpoint, size = A["model"], A["endpoint"], A["batch_size"]
    model_ok = use_model

    for i in range(0, len(pending), size):
        batch = pending[i:i + size]
        results = {}
        if model_ok:
            try:
                results = call_model(batch, token, model, endpoint)
            except (urllib.error.HTTPError, urllib.error.URLError,
                    json.JSONDecodeError, KeyError, TimeoutError) as exc:
                print(f"  model call failed ({exc}) — rules from here on", file=sys.stderr)
                model_ok = False
        for r in batch:
            apply_analysis(r, results.get(r["id"], {}))
        print(f"  {min(i + size, len(pending))}/{len(pending)}")

    save_reviews(doc)

    summary = None
    if model_ok:
        try:
            summary = summarise(reviews, token, model, endpoint)
        except Exception as exc:
            print(f"  summary generation failed: {exc}", file=sys.stderr)

    write_json(DERIVED / "summary.json", {
        "generated": today(),
        "text": summary,
        "generated_by": "github_models" if summary else None,
    })
    print("done" + ("" if summary else " (no narrative summary this run)"))


if __name__ == "__main__":
    main()
