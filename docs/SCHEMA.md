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
| `recommends` | boolean\|null | no | Facebook only. `rating` stays `null` — a Recommendation is not a star count and must never be converted into one. |
| `author` | string | yes | As displayed. Public display names only — no emails, no attempts to identify people. |
| `author_location` | string\|null | yes | As displayed |
| `trip_type` | string\|null | no | `family` \| `couples` \| `friends` \| `solo` \| `business` |
| `title` | string\|null | yes | TripAdvisor has titles; Google and Yelp do not |
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
