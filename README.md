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
   ├─ analyze.py                 GitHub Models → themes + sentiment + summary
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

---

## Setup

### 1. Repository secret

| Secret | Where to get it |
|---|---|
| `APIFY_TOKEN` | apify.com → Settings → Integrations → API token |

Apify's free tier includes $5/month in credits and needs no card. At roughly $0.60 per 1,000
reviews, daily incremental runs cost a small fraction of that.

`GITHUB_TOKEN` is provided automatically by Actions — GitHub Models needs no separate key.
The workflow requests `models: read` permission for it.

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
data/
  reviews.json                 the dataset
  derived/metrics.json         everything the dashboard reads
  derived/summary.json         narrative summary
  snapshots/                   dated aggregates, one per run
site/
  index.html                   the dashboard shell
  assets/css/main.css          TRPL tokens, shared with the Marketing Dashboard
  assets/js/app.js             tabs, filters, thread, reply drafting
  assets/img/logo.png          brand mark (from the Dashboard repo)
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

**Google is on a bridge.** Apify is a stopgap while the Google Business Profile API access
request is pending. That API is free, returns complete history, and — unlike any scraper —
can post replies. Swapping to it is a change to `collect.py` and `config.json`, nothing more.
Setup steps are in the TRPL working folder under `reviews/HOW-TO-COLLECT.md`.

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
