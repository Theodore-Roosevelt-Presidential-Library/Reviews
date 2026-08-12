# Review Record Schema

`data/reviews.json` holds one array, `reviews`. Every entry is one review from one platform.

## Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `{source}-{YYYY-MM-DD}-{author-slug}`. Stable — never renumber. |
| `source` | string | yes | `google` \| `tripadvisor` \| `yelp` \| `facebook` |
| `date` | string | yes | Date the review was written, `YYYY-MM-DD`. Google often gives only relative dates ("a month ago") — use `YYYY-MM` and set `date_precision`. |
| `date_precision` | string | no | Only when `date` is approximate, e.g. `relative_a_month_ago` |
| `visit_period` | string | no | `YYYY-MM` of the visit, when the platform reports it |
| `rating` | number\|null | yes | 1–5. `null` for Facebook recommendations. |
| `tone` | integer\|null | no | −2..+2, how the text reads, from the model. `null` when rules classified the review — never derived from the star rating. |
| `analysis_source` | string | no | `model` or `rules`. Says who classified this row. |
| `recommends` | boolean\|null | no | Facebook only. `rating` stays `null` — a Recommendation is not a star count and must never be converted into one. |
| `author` | string | yes | As displayed. Public display names only — no emails, no attempts to identify people. |
| `author_location` | string\|null | yes | As displayed |
| `trip_type` | string\|null | no | `family` \| `couples` \| `friends` \| `solo` \| `business` |
| `title` | string\|null | yes | TripAdvisor only. Google and Yelp reviews have no titles — if a source returns the venue name here, it is discarded. |
| `text` | string | yes | **Verbatim.** No cleanup of spelling or grammar. |
| `text_complete` | boolean | no | `false` when the platform truncated the visible text |
| `themes` | array | yes | Controlled vocabulary below |
| `sentiment` | string | yes | `positive` \| `positive_with_criticism` \| `mixed` \| `negative` |
| `responded` | boolean | yes | Has TRPL replied publicly |
| `response_text` | string\|null | yes | The reply, verbatim |

## Theme vocabulary

Keep this list tight. A theme earns its place when it could drive a decision.

**Experience**
`interactive_exhibits` · `ai_criticism` · `data_privacy` · `interpretation` · `historical_balance` · `guided_tours` ·
`visitor_flow` · `dwell_time` · `families` · `peer_comparison` · `conservation_message`

**Building and grounds**
`architecture` · `landscape` · `rooftop` · `boardwalk_trails` · `grounds_conduct`

**Operations**
`crowding` · `capacity` · `queues` · `timed_entry` · `sellouts` · `walkup_expectations` ·
`parking` · `wayfinding_signage` · `accessibility` · `security_screening` · `restrooms` ·
`water_availability` · `staff` · `staff_training`

**Commerce**
`ticket_pricing` · `age_tiers` · `value_for_money` · `retail` · `retail_pricing` · `food_beverage`

**Audience**
`drive_market` · `international_visitor` · `media_driven_awareness`

Adding a theme: add it here first, then use it. Do not create one-off themes — a theme that
appears once tells you nothing on a trend line.

## Sentiment

`positive_with_criticism` is deliberately separate from `mixed`. A five-star review that
flags the gift shop pricing is a happy visitor with a specific operational note; a three-star
review is a different signal. Collapsing them hides the most actionable feedback the Library
gets — the people who loved it and still told us what to fix.

## Rules

- **Verbatim text.** Never paraphrase, correct, or shorten a review.
- **Never fabricate.** Unknown field → `null`. Never a plausible guess.
- **Public data only.** Display names as shown. No cross-referencing reviewers, no compiling
  profiles, no contact details.
- **Aggregates come from the platform, not from the rows.** Record the platform's own
  displayed rating and count in the snapshot file. Where a computed average differs from the
  displayed one, keep both — the gap is itself worth knowing.

## `unmatched`

`string | null`. A short lowercase phrase naming a subject the review raises that no theme in
`THEMES` covers — set by the model, `null` from the keyword fallback, which cannot notice what
it was never taught.

It is **not a theme**. It is never counted, never trended, never filterable, and never enters
`themes`. `derive.py` groups these into `metrics.json > proposed_themes`, and `promote.py` turns one
into a real theme once enough separate reviews raise it over enough time. Promotion always
re-labels the whole corpus, so the vocabulary is never split across two eras.

## `data/themes.json`

The controlled vocabulary, as data rather than code so it can change without a deploy.

```json
{"label": "parking", "source": "authored"}
{"label": "shuttle_service", "source": "auto", "promoted_on": "2026-08-12",
 "promoted_from": ["shuttle service", "shuttles"], "reviews_at_promotion": 3,
 "span_days": 21, "evidence": ["google-2026-08-04-...", "..."]}
```

`source` is `authored` (written by a person) or `auto` (promoted by `promote.py`). Auto
entries keep their evidence permanently: what was raised, when, how often, and in whose
words. Removing one is deleting the object and re-running `analyze.py --all`.
