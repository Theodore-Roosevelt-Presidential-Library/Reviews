# TRPL Visitor Reviews

Monitoring, sentiment tracking, and response triage for public reviews of the Theodore
Roosevelt Presidential Library.

**Dashboard:** https://reviews.labs.trlibrary.com

Everything here is built from reviews that are already public. Review text is stored
verbatim, and nothing in this repo is ever fabricated — an unknown value is `null`.

---

## How it works

```
 GitHub Actions (daily, 6am Central)
   │
   ├─ git pull --rebase          never hand-merge generated files
   ├─ collect.py                 Apify → normalise → merge into data/reviews.json
   ├─ analyze.py                 themes + sentiment (model, or keyword rules)
   ├─ derive.py                  windows, deltas, theme movement, triage, brief
   ├─ validate.py                refuse to ship unparseable data
   └─ commit data/
   │
   └─→ calls the deploy workflow ──→ static dashboard
```

**The deploy is called, not triggered.** A push made with `GITHUB_TOKEN` deliberately does
not fire other workflows, so the daily data commit would never start the Pages `push`
trigger. The collect workflow calls `pages.yml` directly via `workflow_call` instead. It
runs even when collection finds nothing new, which is what recovers the site if a bad
deploy went out.

No server and no database. The dashboard is one HTML file that reads generated JSON, so
every number on screen is also a line in git history — you can diff any two days.

Collection is incremental. Each source is asked only for reviews newer than the newest one
already stored, with a three-day overlap so late or edited reviews aren't missed.

**Replies are detected by re-reading, not by marking.** When someone replies on Google or
TripAdvisor, the scraper returns that reply alongside the review and `responded` flips on
the stored record. Nobody has to tick a box. But a strictly incremental pull never
revisits older reviews, so a reply posted today to a three-week-old review would never be
seen — and the response queue would keep nagging the team about work they had already
done. Once every 7 days the collector therefore reaches back 120 days (`reply_refresh` in
`config.json`) purely to catch those. Force it any time with
`python3 collector/collect.py --refresh-replies`.

---

## Setup

### 1. Repository secrets

Settings → Secrets and variables → Actions → New repository secret. A local `.env` is for
your machine only — Actions cannot see it, so every key must exist in both places.

| Secret | Required | Where to get it |
|---|---|---|
| `APIFY_TOKEN` | yes | apify.com → Settings → Integrations → API token |
| `OPENAI_KEY` | yes | platform.openai.com → API keys. Name matches the local `.env`. |
| `GEMINI_API_KEY` | no | Only if `analysis.provider` is switched back to `gemini` |

Apify's free tier includes $5/month in credits and needs no card. At roughly $0.60 per 1,000
reviews, daily incremental runs cost a small fraction of that.

**The model provider is OpenAI**, pinned to `gpt-4.1-mini-2025-04-14`. Classification is
about 6K input tokens a day, so ongoing cost is a couple of dollars a year. Reclassifying
all 335 reviews from scratch cost a few cents.

**Add a payment method, not just credit.** Credit alone leaves the account on free-tier
rate limits — 50 requests per day, which the initial backfill exhausted. Daily incremental
runs need only one or two requests so this does not bite in normal operation, but a full
re-classification will stop halfway. `--upgrade` makes that resumable; a payment method
makes it unnecessary.

Verify before relying on it:

```bash
OPENAI_KEY=... python3 collector/analyze.py --check
```

That sends a real one-word completion — not a catalogue lookup, which passed for a retired
Gemini model that then 404'd on every batch. The same check runs as its own workflow step
before any classification.

**Switching provider** is a `config.json` edit under `analysis`, no code change:

| Provider | Settings |
|---|---|
| OpenAI | `provider: openai`, `base_url: https://api.openai.com/v1`, `api_key_env: OPENAI_KEY` |
| Gemini | `provider: gemini`, `api_key_env: GEMINI_API_KEY` — auth key from AI Studio, not the Cloud Console |
| Groq / OpenRouter | `provider: openai_compatible` plus that vendor's `base_url` |
| Ollama, in Actions | `provider: ollama`, `base_url: http://localhost:11434/v1` — see the "Analyse with a local model" workflow |
| Off | `provider: rules` — deterministic keyword classification, honestly labelled |

### 2. Pages

Settings → Pages → Source: **GitHub Actions**. The custom domain comes from `CNAME`.
Add a DNS `CNAME` record pointing `reviews.labs.trlibrary.com` at the Pages host.

### 3. First run

Actions → **Collect reviews** → Run workflow → check **full** to pull complete history.
Subsequent scheduled runs are incremental.

---

## Layout

```
config.json                    sources, actor IDs, SLAs, window sizes
collector/
  common.py                    paths, config, the record contract
  collect.py                   Apify fetch + normalise + merge
  analyze.py                   themes/sentiment/summary, rules fallback
  derive.py                    windows, deltas, triage, chart series
  brief.py                     the executive summary shown at the top of the dashboard
  validate.py                  pre-commit gate: parseable JSON, no conflict markers
  llm.py                       model providers behind one interface, with preflight
data/
  reviews.json                 the dataset
  derived/metrics.json         everything the dashboard reads
  derived/summary.json         narrative summary
  snapshots/                   dated aggregates, one per run
site/
  index.html                   the dashboard shell
  embed.template.js            source of the public quote widget
  embed.js                     generated — quotes baked in, do not edit
  widget.html                  layout preview and copy-paste snippets
  assets/css/main.css          TRPL tokens, shared with the Marketing Dashboard
  assets/js/app.js             tabs, filters, thread, reply drafting
  assets/img/logo.png          brand mark (from the Dashboard repo)
  pullquotes.py                chooses the public quote excerpts, builds embed.js
docs/
  RESPONSE-PLAYBOOK.md         tiers, SLAs, voice, templates
  SCHEMA.md                    record format and theme vocabulary
```

## Running locally

```bash
export APIFY_TOKEN=...
python3 collector/collect.py --dry-run     # fetch and report, write nothing
python3 collector/analyze.py --no-model    # keyword rules, no network
python3 collector/derive.py

cd site && python3 -m http.server 8000     # needs data/ copied in, see pages.yml
```

---

## Sources

| Source | Method | Status |
|---|---|---|
| Google | Apify `compass/google-maps-reviews-scraper` | Active |
| TripAdvisor | Apify `maxcopell/tripadvisor-reviews` | Active |
| Yelp | Apify `tri_angle/yelp-review-scraper` | Active |
| Facebook | Apify `apify/facebook-reviews-scraper` | Active — empty until visitors leave recommendations |

**TripAdvisor required a one-time approval**, granted August 12, 2026. That actor requests
full read/write access to the Apify account and Apify makes an account owner approve it by
hand. If the account is ever rotated or recreated, this must be re-approved or every run
returns `403 full-permission-actor-not-approved`.

**Facebook Recommendations were switched on 2026-08-12.** Before that the Page setting
"Allow others to view and leave reviews on your Page?" was off, and the Page returned nothing
to any scraper — the Reviews tab did not exist. It is now live and empty, and will fill as
visitors leave recommendations.

Two things to know about the data. Recommendations are yes/no, not stars, so records carry
`recommends` (true/false) and leave `rating` null — they never enter the star distribution,
and a "doesn't recommend" routes into the response queue as negative. And per Facebook's own
warning on that setting, **reviews are public, influence the Page rating, and cannot be
deleted**. The rating and all existing reviews can be hidden again by switching the setting
back off, but individual reviews cannot be removed.

**What is generated vs. what is written.**

| Piece | Where it comes from |
|---|---|
| Theme vocabulary | `data/themes.json`. 39 hand-authored labels, plus any the pipeline promoted on its own. Fixed within a run; grows between runs. See below. |
| Theme + sentiment + tone per review | The model. All 335 reviews carry `analysis_source: "model"`; check `classified_by` in `summary.json` for the split on any run. |
| "What visitors are saying" narrative | The model, one per window (7/30/60/90). Shown with its provenance printed underneath. |
| Executive brief wording | Hand-written sentence templates in `brief.py`. |
| Every figure — counts, averages, deltas, rankings | Counted from the data. Never generated. |

The dashboard states this distinction on the page itself, under the narrative. On a
presidential library's site a reader should be able to tell which sentences a machine
wrote and which came from counting.

**Tone** is a −2..+2 integer read from the review text, independent of the star rating.
Five steps only, displayed as a position on a track with a word — never a number. It is
display-only: not a filter, and it feeds no headline figure or the response queue. Where
the model is unavailable, tone stays `null` rather than being derived from the stars,
which would just be the star rating in disguise.

**How much it adapts.** Tested by injecting synthetic reviews and re-running the pipeline:

| Change | Does it adapt? |
|---|---|
| Volume or rating shifts | Fully. Headline, deltas, every figure track automatically. |
| More reviews about a theme it already knows | Fully. Ranking reorders, the lead complaint changes. |
| A complaint it has no theme for | **Yes, over weeks.** It surfaces under "Not in our vocabulary" immediately, and becomes a real theme once enough visitors raise it. |
| A complaint that matches the *wrong* theme | **No, and no warning.** Keyword rules cannot detect their own false positives. |

That last row is the real limit. In testing, 30 reviews about a broken elevator matched the
`architecture` regex on the word "building" — a wrong label with no signal that it was wrong.
Reading low-rated reviews directly, weekly, is not optional.

### How the theme vocabulary grows

The list has to be stable to be useful. "Crowding up 19 points" only means something if
`crowding` meant the same thing last month, and a model inventing labels freely produces
`parking`, `car park`, and `parking lot` as three lines that each look small. Stable labels
are what make a trend line a trend line.

But a frozen list cannot find the next problem. Two of the busiest themes here,
`interpretation` (45 reviews) and `historical_balance` (17), exist only because they were
guessed at the start. Had they not been, sixty-two reviews arguing about how the Library
tells TR's story would have been invisible.

So the vocabulary is fixed **within** a run and grows **between** runs, on evidence:

1. `analyze.py` labels each review from `data/themes.json` and separately names anything
   substantive the list has no word for, stored as `unmatched`.
2. `promote.py` clusters those suggestions and promotes one when it clears the bar in
   `config.json > vocabulary` — currently **3 separate reviews spread over at least 14 days**,
   at most **one promotion per run**.
3. A promotion triggers `analyze.py --all`, re-labelling every review.
4. The commit message names what was added.

**Step 3 is the one that matters.** A theme applied only to reviews labelled from today
onward would start at zero and show explosive growth in its first period — a trend that
never happened. Re-labelling the whole corpus gives a new theme the same real history every
other theme has. Past `reanalyse_max_reviews` (2,000) that re-label stops being cheap, so
`promote.py` reports instead of acting and the promotion becomes a manual call.

**Clustering, because the model does not repeat itself.** The same complaint came back as
"explicit singing" one day and "explicit music" the next; counting raw strings would leave a
real recurring subject at one mention forever. Labels join when they share a distinctive
word, ignoring generic ones — so `dog policy` and `weapon policy` stay apart, while
`shuttles` and `shuttle service` merge. It over-clusters occasionally: `winter weather` and
`weather heat` both keep "weather" and merge, though they are opposite complaints. That is
the cheaper error. A missed pattern is silent; a bad merge is on screen, records the phrases
it was built from, and is undone by deleting a line from `themes.json`.

**Everything auto-added says so.** Each carries `source: "auto"`, the date, the evidence
review IDs, and the raw phrases behind it, and wears an `AUTO` badge on the dashboard. A
label a machine coined should never be mistakable for one a person chose — the wording ends
up in board reports.

**The theme table caps at 20** for the selected period, with the rest one click away. The
vocabulary has no ceiling now, and without a cap a long tail of two-mention themes would
eventually own the page.

Because the list is capped, **the sort decides what gets hidden**, so it sits on the card as
a control rather than in `derive.py`. The default is **Most mentioned**; what falls off is
then genuinely small. **Biggest movers** is one click away and re-sorts by change in share,
which is worth watching for a theme doubling quietly.

`derive.py` originally sorted only by movement, and the cap made that actively misleading:
`ai_criticism` sat at 27 mentions and rank 21 — cut from a card titled "Themes", and the most
reputationally significant theme in the dataset — while `value_for_money` showed at rank 10
with zero mentions in the period, purely because it had fallen. A capped list ordered by
volatility hides exactly the things a capped list should keep.

One column to read carefully: **Share change** is change in a theme's share of all reviews,
not in its raw count. In a busier month a theme can gain mentions and still lose share —
`interactive_exhibits` went 40 to 84 mentions and −2.1 points at the same time.

**To undo one:** delete its entry from `data/themes.json` and run `analyze.py --all`. To turn
the whole mechanism off: `vocabulary.auto_promote: false`.

**A note on rate limits.** A promotion day costs a full re-classification — roughly 21 API
requests on top of the usual handful. That fits inside OpenAI's 50-per-day free tier only
just. Adding a payment method removes the risk of a re-label stopping halfway.

**On providers.** This project ran on GitHub Models until that product was retired on
July 30, 2026. The endpoint began returning `410 github_models_retirement_brownout`, the
fallback swallowed it, and the pipeline produced pure regex output under a model's name
for several days without complaint. Two guards came out of that:

- `collector/llm.py` puts the provider behind an interface. Switching vendors is a
  `config.json` edit, not a rewrite. An OpenAI-compatible client is already there for
  OpenAI, Groq, or OpenRouter.
- `analyze.py --check` probes the endpoint and confirms the model is in the catalogue,
  and runs as its own workflow step. A dead provider now fails the run on day one.

`summary.json` records `provider`, `model`, `model_status`, `model_error`, and a
`classified_by` breakdown every run. If the model path is ever switched off deliberately,
set `analysis.provider` to `"rules"` so the config says what is true — deterministic and
auditable is a legitimate choice, silently pretending to be a model is not.

**Google is on a bridge.** Apify is a stopgap while the Google Business Profile API access
request is pending. That API is free, returns complete history, and — unlike any scraper —
can post replies. Swapping to it is a change to `collect.py` and `config.json`, nothing more.
Setup steps are in the TRPL working folder under `reviews/HOW-TO-COLLECT.md`.

---

## The public quote widget

A rotating block of visitor quotes for **www.trlibrary.com**. Preview every layout at
[/widget.html](https://reviews.labs.trlibrary.com/widget.html).

```html
<div data-trpl-quotes data-layout="banner"></div>
<script src="https://reviews.labs.trlibrary.com/embed.js" async></script>
```

Four layouts — `banner`, `card`, `wall`, `inline` — each reading the background it was
dropped onto and choosing light or dark text from its luminance, so the same snippet works
on white, cream, brand red or near-black. The accent is contrast-checked against that
background and falls back to the text colour if it would drop below 3:1, which is what the
brand-red block needs.

**Targeting a page topic.** `data-topic="outdoors"` makes a block lead with quotes about that
subject. Topic names live in `config.json > pullquotes.topics` and map onto the same controlled
theme vocabulary the dashboard uses, so retargeting a page is a config edit. Several are
allowed: `data-topic="families,exhibits"`.

**A topic ranks, it never filters to nothing.** On-topic quotes come first, the rest fill the
block. Hard filtering would leave the Shopping page showing one quote in a three-column grid,
which reads as broken rather than targeted.

**Topics describe the excerpt, not the review.** This is the part that matters. The first
version ranked on the source review's themes and put two quotes about children's exhibits on
the Where to Eat page — both reviews mentioned the cafe in a sentence nobody quoted. Worse, a
quote reading *"The AI photos were so amusing"* carried `ai_criticism` from elsewhere in its
review. A targeted quote that isn't about the page is worse than a random one, because it looks
deliberate. The model now tags the passage alone, and `review_themes` is kept on the record for
reference but never used for ranking.

`/widget.html` prints a live coverage table — how many quotes each topic has, and which pages
it suits. As of the current pool: `exhibits`, `architecture`, `families` and `visit` have 8 of
14 each; `outdoors`, `hiking` and `landscape` have 6; and `tours`, `shopping`, `eat`, `tickets`,
`membership` and `accessibility` have **none yet**. Those will fill as reviews arrive — the pool
holds 60 — but until they do, those pages get an untargeted block, so check the table first.

**Forcing a text colour: use `data-text`.** `data-text="white"` gives white text and gold
stars; `data-text="dark"` gives near-black. It names the text, so there is nothing to get
backwards. `data-theme` still works but names the *background* — `data-theme="dark"` means a
dark block and therefore white text. That got read the other way round on the homepage, where
`data-theme="light"` was set by someone wanting light-coloured text and produced near-black on
a dark section.

Worth knowing why detection didn't catch it: on that section **no ancestor within fourteen
levels paints a background at all** — not a colour, not an image. Whatever makes the area dark
sits somewhere the widget can't reach from its own subtree, so it falls through to white and
chooses dark text. Auto-detection handles colour blocks and photo backgrounds; it cannot
handle a background that isn't on an ancestor. When in doubt, state it.

**Rotating layouts reserve a fixed height.** On load the widget renders every quote into a
hidden probe inside the same container, takes the tallest, and pins the stage to it — so a
one-line quote and a five-line quote occupy the same box and the rotation never moves the
page. Measured rather than estimated from character counts, because the answer changes with
the font, the column width and the viewport; it re-measures on resize and again once
Source Serif 4 has actually loaded, since measuring in the fallback font comes up short by a
line on narrow screens. Verified at 0.00 cumulative layout shift across a full rotation
cycle. Short quotes are centred in the reserved space. Opt out with `data-height="auto"`.

**The quotes are compiled into `embed.js`, not fetched.** A script tag has no same-origin
restriction, so there are no CORS headers to configure between the two domains, no fetch to
fail, and no state where the block renders empty. One request.

**Three gates stand between a review and the homepage.** Selection is a model call, and a
model asked politely not to pick something will sometimes pick it anyway — so the rules that
matter are enforced in code:

1. **Verbatim check.** Every excerpt must appear character-for-character in its source
   review after whitespace normalisation. Anything that doesn't is discarded and logged,
   never repaired. The model chooses where a quote starts and stops; it never writes one.
2. **Deterministic screen.** Regex rejection for concessions and hedges (`even if`,
   `although`, `only issue`, `would have liked`) and for off-limits subjects — registration,
   email, photographs of visitors, prices, opening dates. Testing produced
   *"outstanding, even if I might have a few quibbles with the museum's interpretations of
   TR's career"* as a promotional quote: a criticism, on the subject the response playbook
   routes to Tier 1, headed for the Library's own homepage. **A five-star rating does not
   mean five-star sentences.**
3. **Adversarial critic.** A second model pass instructed to reject on any criticism, typo,
   or generic praise. It catches what regex can't — it cut *"Great used of historical
   artifacts"* and *"The building is vet cool architecture"* for spelling. If the critic is
   unreachable, its batch is held back rather than waved through.

Of 60 candidates, 15 failed screening and 12 more were cut by the critic, leaving 18. That
ratio is intentional. Rejecting a usable quote costs nothing.

`data/pullquotes.json` is the pool, and it records what was rejected and why on the last run.
To remove a quote, delete its object and run `pullquotes.py --rebuild`. Quotes are capped at
three per `draw` so the rotation shows the range of reasons people are glad they came rather
than the same reason eight times.

Only five-star reviews dated after public opening are eligible; preview-visit reviews
describe a building that wasn't finished. Attribution is first name plus last initial and the
platform — these are people who wrote a review, not testimonial subjects who agreed to be
quoted in marketing.

**Before this goes live on www.trlibrary.com**, confirm that excerpting review text is
consistent with each platform's current terms. I was unable to verify Google's, TripAdvisor's
or Yelp's terms in this session and will not guess at them. Yelp is historically the most
restrictive and contributes one quote; dropping it is a one-line filter in `eligible()`.

---

## Known limits

**Review counts drift by one or two.** Google's listing showed 307 reviews; the actor
returns 306. Platform-displayed totals include ratings the review feed doesn't always
surface, and reviews get deleted. Treat the platform's own number as the headline and ours
as the analysable set — `data/snapshots/` keeps both.

**Pre-opening reviews.** Twenty reviews predate the July 4 public opening. Most are preview
visits and legitimate; the dashboard reports them separately and only flags the low-rated
ones. They are excluded from the response queue but counted everywhere else.

**Google reviews have no titles.** The Maps actor returns the *place* name in a `title`
field, which if taken at face value stamps "Theodore Roosevelt Presidential Library" across
every Google review. The normaliser rejects any title matching the entity name.

**Never hand-merge `data/`.** Everything in `data/derived/` is a pure function of
`data/reviews.json`. On a conflict, take either side, then run `collector/derive.py` to
regenerate and `collector/validate.py` to confirm. A conflict resolved by hand once put
`<<<<<<< HEAD` inside `metrics.json`; it committed cleanly, deployed, and took the whole
dashboard down with a JSON parse error. `validate.py` now blocks that in both workflows.

**Actor output drift.** Apify actors change their output shape without notice. The normaliser
checks several plausible key names per field and falls back to `null`, so a rename degrades a
field rather than corrupting the dataset. If a field goes empty across a whole run, that's the
first thing to check.

**This site is public.** The repo is public and GitHub Pages serves everything in it, so the
triage queue and negative reviews are publicly visible. That was a deliberate call — the
underlying reviews are public already. `robots.txt` disallows crawling and the page is marked
`noindex`, which discourages search engines but stops nobody who has the URL.
