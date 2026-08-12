/* TRPL Visitor Reviews — dashboard behaviour.

   State lives in one object. Every filter change recomputes a single filtered set,
   and each panel renders from that set, so the tabs can never disagree with each other.
   Window-level aggregates still come from metrics.json (computed in Python) — the
   browser only ever filters, it never recalculates the headline numbers.            */

(function () {
  "use strict";

  var M = null, REVIEWS = [], BRIEF = null, SUMMARY = null, chart = null;
  var S = {
    tab: "overview",
    window: "30",
    source: "all",
    rating: "all",
    theme: null,
    search: "",
    sort: "newest",
    tier: "all",
    allThemes: false,
    themeSort: "size",
    expanded: {}
  };

  // The theme table's ceiling. The vocabulary grows on its own now, so without a cap a long
  // tail of two-mention themes would eventually own the page.
  var THEME_LIMIT = 20;

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return (s == null ? "" : String(s))
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };
  var stars = function (n) { return n ? "★".repeat(n) + "☆".repeat(5 - n) : ""; };

  /* Tone: -2..+2, read from the review text. Shown as a position on a track rather than
     a number, because the useful information is "which way and how far", not the digit. */
  var TONE_LABEL = { "-2": "Strongly negative", "-1": "Negative", "0": "Neutral",
                     "1": "Positive", "2": "Strongly positive" };
  function toneBar(t) {
    if (t === null || t === undefined) return "";
    var pct = ((t + 2) / 4) * 100;
    var cls = t < 0 ? "t-neg" + Math.abs(t) : t > 0 ? "t-pos" + t : "t-0";
    return '<div class="tone" title="Tone of the review text, judged separately from the star rating">' +
      '<span class="tone-label">' + esc(TONE_LABEL[String(t)]) + "</span>" +
      '<span class="tone-track" role="img" aria-label="Text tone: ' +
        esc(TONE_LABEL[String(t)]) + '">' +
      '<i class="tone-mid"></i>' +
      '<i class="tone-dot ' + cls + '" style="left:' + pct + '%"></i></span></div>';
  }
  var titleCase = function (t) { return t.replace(/_/g, " "); };

  // Highlight search hits. Runs on already-escaped text, and escapes the needle too, so
  // neither the review nor the query can inject markup.
  function mark(escaped) {
    if (!S.search) return escaped;
    var needle = esc(S.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!needle) return escaped;
    return escaped.replace(new RegExp("(" + needle + ")", "gi"), "<mark>$1</mark>");
  }

  var SOURCE_LABEL = function (k) { return (M.sources[k] || {}).label || k; };

  /* Every filter currently narrowing the view, as removable tokens. */
  function activeFilters() {
    var out = [];
    if (S.theme) out.push({ key: "theme", label: "Theme", value: titleCase(S.theme) });
    if (S.source !== "all") out.push({ key: "source", label: "Source", value: SOURCE_LABEL(S.source) });
    if (S.rating !== "all") {
      out.push({ key: "rating", label: "Rating",
                 value: S.rating === "low" ? "3★ or below" : S.rating + "★" });
    }
    if (S.search) out.push({ key: "search", label: "Text", value: '"' + S.search + '"' });
    if (S.tier !== "all" && S.tab === "triage") {
      out.push({ key: "tier", label: "Tier", value: titleCase(S.tier) });
    }
    return out;
  }

  function clearFilter(key) {
    if (key === "theme") S.theme = null;
    if (key === "source") S.source = "all";
    if (key === "rating") S.rating = "all";
    if (key === "tier") S.tier = "all";
    if (key === "search") { S.search = ""; $("f-search").value = ""; }
  }

  function renderActiveBar() {
    var bar = $("activebar");
    // Filters are preserved when you visit Overview but do not apply there, so the
    // band would claim a narrowing that isn't happening. It reappears, intact, on
    // returning to a list tab.
    if (S.tab === "overview") { bar.hidden = true; return; }
    var items = activeFilters();
    if (!items.length) { bar.hidden = true; return; }
    bar.hidden = false;

    $("tokens").innerHTML = items.map(function (f) {
      return '<button class="token" data-clear="' + f.key + '" ' +
        'aria-label="Remove filter ' + esc(f.label) + " " + esc(f.value) + '">' +
        "<em>" + esc(f.label) + ":</em> " + esc(f.value) +
        '<span class="token-x" aria-hidden="true">×</span></button>';
    }).join("");

    var shown = S.tab === "triage" ? triageRows().length : filtered().length;
    var total = S.tab === "triage" ? M.triage.length : M.all_time.count;
    $("activebar-result").textContent =
      "Showing " + shown + " of " + total + " · " + (total - shown) + " hidden";

    $("tokens").querySelectorAll("[data-clear]").forEach(function (b) {
      b.onclick = function () { clearFilter(b.dataset.clear); render(); };
    });
  }

  /* ---------- reply drafting -------------------------------------------
     A template, not generated prose. Anything published in the Library's voice
     gets written by a person; this only removes the blank page.               */
  var BUCKET = {
    timed_entry: "ticketing", sellouts: "ticketing", walkup_expectations: "ticketing",
    parking: "arrival", wayfinding_signage: "arrival", accessibility: "arrival",
    crowding: "flow", queues: "flow", security_screening: "flow",
    retail_pricing: "amenities", food_beverage: "amenities",
    water_availability: "amenities", restrooms: "amenities",
    staff_training: "staff", ai_criticism: "ai", data_privacy: "ai"
  };
  var LINES = {
    parking: "We're working on parking capacity and circulation on the site.",
    wayfinding_signage: "More wayfinding signage is going in.",
    accessibility: "Accessible parking and drop-off are a priority fix, including the signage that made them hard to find.",
    crowding: "Summer has been busier than we projected, and we're adjusting how we release timed-entry slots.",
    queues: "We're working on entry flow to cut the wait at the door.",
    timed_entry: "All admission is timed-entry and dates do sell out — booking ahead at trlibrary.com/tickets is the surest way in.",
    sellouts: "Dates are selling out well in advance; booking ahead at trlibrary.com/tickets is the surest way in.",
    walkup_expectations: "Admission is timed-entry and walk-up tickets often aren't available. We're making that clearer up front so no one makes the drive for nothing.",
    retail_pricing: "We've shared your note on museum store pricing with that team.",
    food_beverage: "We've passed your note along to the Salt + Scoria team.",
    water_availability: "You're right that water needs to be easier to find, and we're adding stations.",
    restrooms: "We've flagged restroom capacity for our facilities team.",
    staff_training: "We're tightening front-line training so staff can answer ticketing questions confidently.",
    security_screening: "We're working to speed up screening at entry.",
    ai_criticism: "The AI stations are optional — the original Roosevelt objects, films, and traditional displays stand on their own, and you can skip registration entirely and still see everything.",
    data_privacy: "Registration is optional. You can skip the photo and email entirely and still experience every exhibit. [Confirm current retention policy before sending.]"
  };

  function draft(r) {
    var out = [];
    var tier = r.tier || (r.rating != null && r.rating <= 2 ? "critical"
                        : r.rating != null && r.rating <= 3 ? "negative"
                        : "positive_with_criticism");
    out.push(tier === "critical" || tier === "negative"
      ? "Thank you for telling us about this, and we're sorry — this isn't the visit we want anyone to have."
      : "Thank you for the kind words, and for flagging what didn't work.");

    var seen = {}, specific = [];
    (r.themes || []).forEach(function (t) {
      if (specific.length >= 2 || !LINES[t]) return;
      var b = BUCKET[t] || t;
      if (seen[b]) return;
      seen[b] = 1; specific.push(LINES[t]);
    });
    if (specific.length) out.push(specific.join(" "));
    out.push("We'd like another chance to get it right — if you're back in the Badlands, please come see us.");
    return out.join("\n\n") + "\n\n— The team at the Theodore Roosevelt Presidential Library";
  }

  /* ---------- filtering ------------------------------------------------- */
  function inWindow(r) {
    var w = M.windows[S.window];
    if (!w || !r.date || r.date.length !== 10) return false;
    return r.date >= w.range[0] && r.date <= w.range[1];
  }

  function filtered(opts) {
    opts = opts || {};
    var rows = REVIEWS.filter(function (r) {
      if (!opts.ignoreWindow && !inWindow(r)) return false;
      if (S.source !== "all" && r.source !== S.source) return false;
      if (S.rating !== "all") {
        if (S.rating === "low" && !(r.rating != null && r.rating <= 3)) return false;
        if (S.rating !== "low" && String(r.rating) !== S.rating) return false;
      }
      if (S.theme && (r.themes || []).indexOf(S.theme) === -1) return false;
      if (S.search) {
        var hay = ((r.text || "") + " " + (r.title || "") + " " + (r.author || "")).toLowerCase();
        if (hay.indexOf(S.search.toLowerCase()) === -1) return false;
      }
      return true;
    });
    rows.sort(function (a, b) {
      if (S.sort === "oldest") return (a.date || "").localeCompare(b.date || "");
      if (S.sort === "lowest") return (a.rating || 9) - (b.rating || 9) ||
                                      (b.date || "").localeCompare(a.date || "");
      return (b.date || "").localeCompare(a.date || "");
    });
    return rows;
  }

  /* ---------- chrome ---------------------------------------------------- */
  function renderTabs() {
    var overdue = M.triage.filter(function (t) { return (t.overdue_by || 0) > 0; }).length;
    var defs = [
      { id: "overview", label: "Overview" },
      { id: "reviews", label: "Reviews", count: M.all_time.count },
      { id: "triage", label: "Needs a response", count: M.triage.length, alert: overdue > 0 }
    ];
    $("tabbar").innerHTML = defs.map(function (d) {
      return '<button class="tab" role="tab" id="tab-' + d.id + '" data-tab="' + d.id +
        '" aria-selected="' + (S.tab === d.id) + '" aria-controls="panel-' + d.id + '">' +
        esc(d.label) +
        (d.count != null ? '<span class="tab-count' + (d.alert ? " is-alert" : "") + '">' +
          d.count + "</span>" : "") + "</button>";
    }).join("");
    $("tabbar").querySelectorAll(".tab").forEach(function (b) {
      b.onclick = function () { S.tab = b.dataset.tab; render(); };
    });
    ["overview", "reviews", "triage"].forEach(function (id) {
      $("panel-" + id).hidden = S.tab !== id;
    });
  }

  function pills(host, items, current, onPick) {
    var label = host.querySelector(".flabel");
    host.innerHTML = "";
    if (label) host.appendChild(label);
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.textContent = it.label;
      if (String(it.value) === String(current)) b.className = "active";
      b.onclick = function () { onPick(it.value); };
      host.appendChild(b);
    });
  }

  function renderFilters() {
    // Period applies everywhere. Source, rating and search only narrow a list of
    // reviews — on Overview the figures come from precomputed window aggregates, so
    // those controls would sit there looking live while changing nothing. Hide them
    // rather than let the interface lie about what it does.
    var listTab = S.tab !== "overview";
    ["f-source", "f-rating"].forEach(function (id) {
      var el = $(id); if (el) el.hidden = !listTab;
    });
    var searchWrap = $("f-searchgroup");
    if (searchWrap) searchWrap.hidden = !listTab;
    $("f-reset").hidden = !listTab;

    pills($("f-window"), Object.keys(M.windows).sort(function (a, b) { return a - b; })
      .map(function (w) { return { value: w, label: w + "d" }; }), S.window,
      function (v) { S.window = v; render(); });

    if (!listTab) return;   // nothing else to draw

    var srcs = [{ value: "all", label: "All" }].concat(
      Object.keys(M.all_time.by_source).map(function (k) {
        return { value: k, label: (M.sources[k] && M.sources[k].label) || k };
      }));
    pills($("f-source"), srcs, S.source, function (v) { S.source = v; render(); });

    pills($("f-rating"), [
      { value: "all", label: "All" }, { value: "5", label: "5★" }, { value: "4", label: "4★" },
      { value: "low", label: "3★ or below" }
    ], S.rating, function (v) { S.rating = v; render(); });
  }

  /* ---------- brief ----------------------------------------------------- */
  function renderBrief() {
    BRIEF = (M.briefs || {})[S.window];
    var host = $("brief");
    if (!BRIEF) { host.innerHTML = ""; return; }

    // The full brief belongs on Overview. On the working tabs it collapses to one line
    // so the reviews themselves start at the top of the screen instead of 400px down.
    var compact = S.tab !== "overview";
    host.className = "brief" + (compact ? " compact" : "");
    if (compact) {
      var st = BRIEF.stats || {};
      host.innerHTML = '<div class="brief-headline">' + esc(BRIEF.headline) + "</div>" +
        '<div class="brief-sub">' + st.unanswered + " awaiting a reply · " +
        st.overdue + " past SLA · " + esc(BRIEF.paragraphs[0] || "") + "</div>";
      return;
    }

    var main = '<div class="brief-main"><div class="brief-headline">' + esc(BRIEF.headline) +
      "</div>" + '<div class="brief-body">' +
      BRIEF.paragraphs.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>";
    if (BRIEF.actions && BRIEF.actions.length) {
      main += '<div class="brief-actions">' + BRIEF.actions.map(function (a) {
        return '<button class="brief-action" data-issue="' + esc(a.issue) + '">' +
          esc(a.issue) + " <b>" + a.mentions + "</b></button>";
      }).join("") + "</div>";
    }
    // BRIEF.notes is standing context and lives in the footer. A coverage warning is
    // the exception — it means the theme vocabulary has a gap right now, which is news.
    if (BRIEF.coverage_warning) {
      main += '<div class="brief-warn">' + esc(BRIEF.coverage_warning) + "</div>";
    }
    main += "</div>";

    var st = BRIEF.stats || {};
    var w = M.windows[S.window].current;
    var rail = '<aside class="brief-rail"><h3>Where it stands</h3>' +
      row("Average", st.average == null ? "—" : st.average) +
      row("Reviews this period", st.count) +
      row("Three star or below", (st.pct_low == null ? "—" : st.pct_low + "%")) +
      row("Awaiting a reply", st.unanswered, st.unanswered > 0) +
      row("Past our SLA", st.overdue, st.overdue > 0) +
      '<button class="btn primary rail-cta" id="rail-cta">Work the queue</button></aside>';

    host.innerHTML = main + rail;
    host.querySelectorAll(".brief-action").forEach(function (b) {
      b.onclick = function () { S.tab = "reviews"; S.rating = "low"; render(); };
    });
    var cta = $("rail-cta");
    if (cta) cta.onclick = function () { S.tab = "triage"; render(); };

    function row(label, value, bad) {
      return '<div class="rail-row"><span>' + esc(label) + "</span><b" +
        (bad ? ' class="is-bad"' : "") + ">" + esc(value) + "</b></div>";
    }
  }

  /* ---------- overview -------------------------------------------------- */
  function deltaPill(v, opts) {
    opts = opts || {};
    if (v == null) return '<span class="kpi-delta neutral">no prior period</span>';
    if (Math.abs(v) < 0.005) return '<span class="kpi-delta neutral">unchanged</span>';
    var good = opts.invert ? v < 0 : v > 0;
    return '<span class="kpi-delta ' + (good ? "good" : "bad") + '">' +
      (v > 0 ? "▲" : "▼") + " " + Math.abs(v) + (opts.suffix || "") + "</span>";
  }

  /* The model-written narrative. Shown with its provenance attached: a reader of a
     presidential library's dashboard should be able to tell at a glance which sentences
     a machine wrote and which came from counting. */
  function renderNarrative() {
    var card = $("narrative-card");
    if (!card) return;
    // One narrative per window, so the card answers the period selector above it.
    var byWindow = (SUMMARY && SUMMARY.windows) || {};
    var text = byWindow[S.window] || (S.window === "30" ? (SUMMARY && SUMMARY.text) : null);
    if (!text) {
      card.hidden = false;
      $("narrative").textContent =
        "No narrative for this period — too few reviews in the last " + S.window + " days.";
      $("narrative-tag").textContent = "Last " + S.window + " days";
      $("narrative-source").textContent = "";
      return;
    }
    card.hidden = false;
    $("narrative").textContent = text;
    $("narrative-tag").textContent = "Last " + S.window + " days";
    var by = SUMMARY.generated_by || SUMMARY.model || "a language model";
    $("narrative-source").textContent =
      "Written by " + by + " on " + (SUMMARY.generated || "?") +
      ", from the reviews in this period. Every figure elsewhere on this page is counted, not generated.";
  }

  // Gaps in the theme vocabulary. All-time, not windowed: a subject raised three times
  // across three months is exactly the signal worth acting on, and a 7-day view would
  // hide it. Deliberately shown as raw text, not a count — the point is to read them.
  function renderGaps() {
    var card = $("gaps-card");
    if (!card) return;
    var rows = M.proposed_themes || [];
    if (!rows.length) { card.hidden = true; return; }
    card.hidden = false;
    $("gaps-tag").textContent = rows.length + " suggested · all time";
    $("gaps").innerHTML = rows.map(function (g) {
      var meta = [g.count + (g.count === 1 ? " review" : " reviews")];
      if (g.avg_rating != null) meta.push("avg " + g.avg_rating + "\u2605");
      meta.push(g.first_seen === g.last_seen ? g.first_seen
                                             : g.first_seen + " \u2013 " + g.last_seen);
      return '<div class="gap' + (g.count > 1 ? ' gap-repeat' : '') + '">' +
        '<div class="gap-head"><span class="gap-label">' + esc(g.label) + '</span>' +
        '<span class="gap-meta">' + esc(meta.join(" \u00b7 ")) + '</span></div>' +
        '<p class="gap-quote">\u201c' + esc(g.examples[0].text) + '\u201d</p></div>';
    }).join("");
  }

  function renderKpis() {
    var w = M.windows[S.window], c = w.current, d = w.delta;
    var overdue = M.triage.filter(function (t) { return (t.overdue_by || 0) > 0; }).length;
    $("kpis").innerHTML = [
      ['Average rating', c.average == null ? "—" : c.average, deltaPill(d.average), false],
      ['Reviews', c.count, deltaPill(d.count), false],
      ['5-star share', c.pct_5_star == null ? "—" : c.pct_5_star + "%", deltaPill(d.pct_5_star, { suffix: " pts" }), false],
      ['3★ or below', c.pct_low == null ? "—" : c.pct_low + "%", deltaPill(d.pct_low, { invert: true, suffix: " pts" }), false],
      ['Awaiting reply', M.triage.length, '<span class="kpi-delta ' + (overdue ? "bad" : "neutral") + '">' + overdue + " past SLA</span>", overdue > 0],
      ['All time', M.all_time.average == null ? "—" : M.all_time.average, '<span class="kpi-delta neutral">' + M.all_time.count + " reviews</span>", false]
    ].map(function (k) {
      return '<div class="kpi-tile"><div class="kpi-label">' + k[0] + "</div>" +
        '<div class="kpi-value' + (k[3] ? " is-bad" : "") + '">' + k[1] + "</div>" + k[2] + "</div>";
    }).join("");
  }

  function renderMix() {
    var c = M.windows[S.window].current, total = c.rated_count;
    $("mix-tag").textContent = total + " rated";
    var rows = [5, 4, 3, 2, 1].map(function (s) {
      var n = c.distribution[s] || 0, pct = total ? (100 * n / total) : 0;
      return '<tr class="clickable' + (String(S.rating) === String(s) ? " is-active" : "") +
        '" data-rating="' + s + '"><td style="width:78px"><span class="stars">' +
        stars(s) + '</span></td><td><span class="bar' + (s >= 4 ? "" : " soft") +
        '" style="width:' + Math.max(pct * 2.2, n ? 3 : 0) + 'px"></span></td>' +
        '<td class="num" style="width:56px">' + n + "</td>" +
        '<td class="num muted" style="width:60px">' + (total ? pct.toFixed(0) + "%" : "—") + "</td></tr>";
    }).join("");
    $("mix").innerHTML = "<tbody>" + rows + "</tbody>";
    $("mix").querySelectorAll("tr.clickable").forEach(function (tr) {
      tr.onclick = function () { S.rating = tr.dataset.rating; S.tab = "reviews"; render(); };
    });
  }

  // A theme the vocabulary grew into on its own is marked, always. The alternative is a
  // machine-coined label sitting on a presidential library's public dashboard looking
  // exactly like one a person chose.
  function autoBadge(theme) {
    var auto = (M.vocabulary && M.vocabulary.auto) || {};
    var a = auto[theme];
    if (!a) return "";
    return '<span class="auto-badge" title="Added automatically on ' + esc(a.promoted_on) +
      ' after visitors raised this ' + a.reviews_at_promotion +
      ' times. Built from: ' + esc((a.promoted_from || []).join(", ")) + '">auto</span>';
  }

  function renderThemes() {
    var moves = (M.windows[S.window].theme_movement || []).slice();

    // Order matters more than it looks, because the list is capped. derive.py sorts by how
    // far a theme's share moved, which buries anything large and steady: ai_criticism sat at
    // 27 mentions and rank 21, cut from a card titled "Themes", while value_for_money showed
    // at rank 10 with zero mentions this period because it had fallen. Size is the honest
    // default for a capped list — what gets cut is then genuinely small. Movement is still
    // one click away, because a theme doubling quietly is worth catching early.
    if (S.themeSort === "size") {
      moves.sort(function (a, b) {
        return (b.current - a.current) || (Math.abs(b.change) - Math.abs(a.change));
      });
    } else {
      moves.sort(function (a, b) { return Math.abs(b.change) - Math.abs(a.change); });
    }

    document.querySelectorAll("[data-themesort]").forEach(function (b) {
      b.classList.toggle("active", b.dataset.themesort === S.themeSort);
      b.onclick = function () {
        S.themeSort = b.dataset.themesort; S.allThemes = false; render();
      };
    });

    if (!moves.length) {
      $("themes").innerHTML = '<tbody><tr><td class="empty">Not enough reviews in this period to show movement.</td></tr></tbody>';
      return;
    }
    $("themes").innerHTML =
      "<thead><tr><th>Theme</th><th class='num'>Now</th><th class='num'>Prior</th>" +
      "<th class='num'>Share</th><th class='num' title=\"Change in this theme's share of " +
      "all reviews, not in its raw count. A theme can gain mentions and still lose share " +
      "in a busier month.\">Share change</th></tr></thead><tbody>" +
      moves.slice(0, S.allThemes ? moves.length : THEME_LIMIT).map(function (m) {
        // More mentions of a theme is not inherently good or bad, but for complaint
        // themes a rise is worth noticing — colour by direction, not by judgement.
        var cls = m.change > 0 ? "neg" : m.change < 0 ? "pos" : "muted";
        return '<tr class="clickable' + (S.theme === m.theme ? " is-active" : "") +
          '" data-theme="' + esc(m.theme) + '"><td>' +
          esc(titleCase(m.theme)) + autoBadge(m.theme) + '</td><td class="num">' + m.current +
          '</td><td class="num muted">' + m.prior + '</td><td class="num">' +
          m.current_share + '%</td><td class="num ' + cls + '">' +
          (m.change > 0 ? "+" : "") + m.change + " pts</td></tr>";
      }).join("") + "</tbody>";

    // The vocabulary grows on its own, so this table has no natural ceiling. Show the
    // themes that matter this period and put the rest one click away, rather than letting
    // a long tail of two-mention themes push the rest of the page off screen.
    var more = $("themes-more");
    if (more) {
      more.hidden = moves.length <= THEME_LIMIT;
      more.textContent = S.allThemes
        ? "Show top " + THEME_LIMIT
        : "Show all " + moves.length + " themes";
      more.onclick = function () { S.allThemes = !S.allThemes; render(); };
    }

    $("themes").querySelectorAll("tr.clickable").forEach(function (tr) {
      tr.onclick = function () {
        S.theme = S.theme === tr.dataset.theme ? null : tr.dataset.theme;
        S.tab = "reviews"; render();
      };
    });
  }

  function renderSources() {
    var c = M.windows[S.window].current;
    var keys = Object.keys(M.sources);
    var rows = keys.map(function (k) {
      var n = c.by_source[k] || 0;
      var all = M.all_time.by_source[k] || 0;
      return '<tr class="clickable' + (S.source === k ? " is-active" : "") +
        '" data-source="' + k + '"><td>' +
        esc(M.sources[k].label) + '</td><td class="num">' + n +
        '</td><td class="num muted">' + all + "</td></tr>";
    }).join("");
    $("sources").innerHTML =
      "<thead><tr><th>Source</th><th class='num'>Period</th><th class='num'>All time</th></tr></thead><tbody>" +
      rows + "</tbody>";
    $("sources").querySelectorAll("tr.clickable").forEach(function (tr) {
      tr.onclick = function () {
        S.source = S.source === tr.dataset.source ? "all" : tr.dataset.source;
        render();
      };
    });
  }

  function renderChart() {
    var days = parseInt(S.window, 10);
    var pts = M.series.filter(function (p) { return p.trailing_30_count > 0; })
      .slice(-Math.max(days * 3, 60));
    if (chart) { chart.destroy(); chart = null; }
    if (!pts.length) return;
    chart = new Chart($("trend"), {
      data: {
        labels: pts.map(function (p) { return p.date; }),
        datasets: [
          { type: "line", label: "Trailing average", data: pts.map(function (p) { return p.trailing_30_average; }),
            borderColor: "#8B2E1F", backgroundColor: "rgba(139,46,31,.07)", fill: true,
            tension: .3, pointRadius: 0, borderWidth: 2, yAxisID: "y" },
          { type: "bar", label: "Reviews per day", data: pts.map(function (p) { return p.count; }),
            backgroundColor: "#C7B9A4", yAxisID: "y1", barThickness: 3 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 3.5, max: 5.02, position: "left", ticks: { color: "#8A8377", font: { size: 11 } },
               grid: { color: "#E5DDD0" } },
          y1: { beginAtZero: true, position: "right", ticks: { color: "#8A8377", font: { size: 11 } },
                grid: { display: false } },
          x: { ticks: { color: "#8A8377", font: { size: 11 }, maxTicksLimit: 8 }, grid: { display: false } }
        }
      }
    });
  }

  /* ---------- review cards ---------------------------------------------- */
  function card(r, opts) {
    opts = opts || {};
    var src = M.sources[r.source] || {};
    var open = !!S.expanded[r.id];
    var long = (r.text || "").length > 320;
    var overdue = (r.overdue_by || 0) > 0;

    var badge = r.rating != null ? '<span class="stars">' + stars(r.rating) + "</span>"
      : (r.recommends === true ? '<span class="chip static replied">Recommends</span>'
        : r.recommends === false ? '<span class="chip static overdue">Doesn\'t recommend</span>' : "");

    var h = '<article class="rev' + (opts.tier && r.tier ? " tier-" + r.tier : "") + '">' +
      '<div class="rev-head"><div class="rev-who">' + esc(r.author || "Anonymous") + " " + badge +
      '</div><div class="rev-meta">' + esc(src.label || r.source) + " · " + esc(r.date || "undated") + "</div></div>";

    if (r.title) h += '<div class="rev-title">' + mark(esc(r.title)) + "</div>";
    if (r.text) {
      h += '<p class="rev-text' + (long && !open ? " clamped" : "") + '">' +
        mark(esc(r.text)) + "</p>";
      if (long) h += '<button class="rev-more" data-expand="' + esc(r.id) + '">' +
        (open ? "Show less" : "Show more") + "</button>";
    }

    h += '<div class="chips">';
    if (opts.tier && r.tier) {
      h += '<span class="chip ' + (overdue ? "overdue" : "due") + ' static">' +
        (overdue ? r.overdue_by + "d overdue" : "due within " + r.sla_days + "d") + "</span>";
    }
    if (r.responded) h += '<span class="chip replied static">Replied</span>';
    // Put the matching theme first and mark it, so each card shows why it survived the filter.
    var themes = (r.themes || []).slice().sort(function (a, b) {
      return (b === S.theme) - (a === S.theme);
    });
    themes.forEach(function (t) {
      h += '<button class="chip' + (t === S.theme ? " is-active" : "") +
        '" data-theme="' + esc(t) + '">' + esc(titleCase(t)) +
        (t === S.theme ? " ×" : "") + "</button>";
    });
    h += "</div>";

    h += toneBar(r.tone);

    if (r.responded && r.response_text) {
      h += '<div class="rev-reply"><b>Our reply</b>' + esc(r.response_text) + "</div>";
    }

    if (opts.tier) {
      // Two links that go to genuinely different places, and the old labels hid that.
      // "Open Google" sounded like the main action but went to the Business Profile inbox,
      // so it looked like the deep link was broken when it was sitting right next to it.
      // Name the destination: one opens this review, the other opens the reply tool.
      h += '<div class="rev-tools">' +
        '<button class="btn" data-draft="' + esc(r.id) + '">Draft a reply</button>' +
        (r.url
          ? '<a class="btn" href="' + esc(r.url) + '" target="_blank" rel="noopener">' +
            'Open this review ↗</a>'
          : (src.listing_url
              ? '<a class="btn" href="' + esc(src.listing_url) + '" target="_blank" ' +
                'rel="noopener" title="' + esc(src.label) + ' gives us no link to the ' +
                'individual review, so this opens the listing — find it by the reviewer\u2019s ' +
                'name and date.">Find on ' + esc(src.label) + ' ↗</a>'
              : "")) +
        (src.reply_url ? '<a class="btn" href="' + esc(src.reply_url) +
          '" target="_blank" rel="noopener" title="Opens the ' + esc(src.label) +
          ' owner tools, where replies are posted.">Reply on ' + esc(src.label) +
          " ↗</a>" : "") +
        "</div>" +
        '<div class="draft" id="draft-' + esc(r.id) + '"><textarea id="ta-' + esc(r.id) + '"></textarea>' +
        '<div class="rev-tools"><button class="btn primary" data-copy="' + esc(r.id) + '">Copy</button></div>' +
        '<div class="draft-note">A starting point, not a finished reply. Edit before sending — ' +
        "this publishes in the Library's voice.</div></div>";
    }
    return h + "</article>";
  }

  function wire(host, rows) {
    host.querySelectorAll("[data-expand]").forEach(function (b) {
      b.onclick = function () {
        S.expanded[b.dataset.expand] = !S.expanded[b.dataset.expand];
        render();
      };
    });
    host.querySelectorAll(".chip[data-theme]").forEach(function (b) {
      b.onclick = function () {
        S.theme = S.theme === b.dataset.theme ? null : b.dataset.theme;
        render();
      };
    });
    host.querySelectorAll("[data-draft]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.draft, box = $("draft-" + id), ta = $("ta-" + id);
        if (!box.classList.contains("open")) {
          var r = rows.filter(function (x) { return x.id === id; })[0];
          ta.value = draft(r);
        }
        box.classList.toggle("open");
      };
    });
    host.querySelectorAll("[data-copy]").forEach(function (b) {
      b.onclick = function () {
        navigator.clipboard.writeText($("ta-" + b.dataset.copy).value);
        var t = b.textContent; b.textContent = "Copied"; setTimeout(function () { b.textContent = t; }, 1400);
      };
    });
  }


  /* Empty results should say what to undo, not just that there is nothing. */
  function emptyState(lead) {
    var items = activeFilters();
    var html = '<div class="empty">' + (lead || "No reviews match");
    if (items.length) {
      html += " " + items.map(function (f) {
        return f.label.toLowerCase() + " " + f.value;
      }).join(" + ");
    }
    html += '.<br><button class="btn" id="empty-clear" style="margin-top:12px">' +
      "Clear all filters</button></div>";
    return html;
  }

  function wireEmptyClear() {
    var b = $("empty-clear");
    if (b) b.onclick = function () { $("f-reset").click(); };
  }

  function renderThread() {
    var rows = filtered();
    $("thread-tag").textContent = rows.length + " shown";
    $("thread").innerHTML = rows.length
      ? rows.map(function (r) { return card(r, {}); }).join("")
      : emptyState();
    wire($("thread"), rows);
    wireEmptyClear();
    renderSelection(rows);
  }

  /* Breakdown of whatever is currently on screen. Recomputed from the filtered set
     rather than read from metrics.json, so it always describes what the user is
     actually looking at — including after a text search. */
  function renderSelection(rows) {
    var host = $("selection");
    if (!host) return;
    if (!rows.length) { host.innerHTML = '<div class="empty">Nothing selected.</div>'; return; }

    var rated = rows.filter(function (r) { return r.rating != null; });
    var avg = rated.length
      ? (rated.reduce(function (a, r) { return a + r.rating; }, 0) / rated.length).toFixed(2)
      : "—";
    var unanswered = rows.filter(function (r) { return !r.responded; }).length;

    var themes = {};
    rows.forEach(function (r) {
      (r.themes || []).forEach(function (t) { themes[t] = (themes[t] || 0) + 1; });
    });
    var top = Object.keys(themes).map(function (t) { return [t, themes[t]]; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 10);
    var max = top.length ? top[0][1] : 1;

    var srcs = {};
    rows.forEach(function (r) { srcs[r.source] = (srcs[r.source] || 0) + 1; });

    var html = '<div style="padding:14px 20px;border-bottom:1px solid var(--color-line)">' +
      '<div class="rail-row"><span>Average of selection</span><b>' + avg + "</b></div>" +
      '<div class="rail-row"><span>Reviews</span><b>' + rows.length + "</b></div>" +
      '<div class="rail-row"><span>Without a reply</span><b' +
        (unanswered ? ' class="is-bad"' : "") + ">" + unanswered + "</b></div></div>";

    html += '<table><thead><tr><th>Theme</th><th></th><th class="num">n</th></tr></thead><tbody>' +
      top.map(function (p) {
        var active = S.theme === p[0];
        return '<tr class="clickable' + (active ? " is-active" : "") +
          '" data-theme="' + esc(p[0]) + '"><td>' +
          esc(titleCase(p[0])) + '</td><td style="width:46%"><span class="bar' +
          (active ? "" : " soft") + '" style="width:' + Math.round(100 * p[1] / max) +
          '%"></span></td><td class="num">' + p[1] + "</td></tr>";
      }).join("") + "</tbody></table>";

    html += '<table style="border-top:1px solid var(--color-line)"><thead><tr><th>Source</th>' +
      '<th class="num">n</th></tr></thead><tbody>' +
      Object.keys(srcs).map(function (k) {
        return '<tr class="clickable' + (S.source === k ? " is-active" : "") +
          '" data-source="' + esc(k) + '"><td>' +
          esc((M.sources[k] || {}).label || k) + '</td><td class="num">' + srcs[k] + "</td></tr>";
      }).join("") + "</tbody></table>";

    host.innerHTML = html;
    host.querySelectorAll("[data-theme]").forEach(function (tr) {
      tr.onclick = function () {
        S.theme = S.theme === tr.dataset.theme ? null : tr.dataset.theme; render();
      };
    });
    host.querySelectorAll("[data-source]").forEach(function (tr) {
      tr.onclick = function () {
        S.source = S.source === tr.dataset.source ? "all" : tr.dataset.source; render();
      };
    });
  }

  function triageRows() {
    return M.triage.filter(function (t) {
      if (S.tier !== "all" && t.tier !== S.tier) return false;
      if (S.source !== "all" && t.source !== S.source) return false;
      if (S.rating !== "all") {
        if (S.rating === "low" && !(t.rating != null && t.rating <= 3)) return false;
        if (S.rating !== "low" && String(t.rating) !== S.rating) return false;
      }
      if (S.theme && (t.themes || []).indexOf(S.theme) === -1) return false;
      if (S.search) {
        var hay = ((t.text || "") + " " + (t.title || "") + " " + (t.author || "")).toLowerCase();
        if (hay.indexOf(S.search.toLowerCase()) === -1) return false;
      }
      return true;
    });
  }

  function renderTriage() {
    var q = triageRows();
    var overdue = M.triage.filter(function (t) { return (t.overdue_by || 0) > 0; }).length;
    var crit = M.triage.filter(function (t) { return t.tier === "critical"; }).length;
    var oldest = M.triage.reduce(function (a, t) { return Math.max(a, t.age_days || 0); }, 0);
    $("triage-kpis").innerHTML = [
      ["In the queue", M.triage.length, M.triage.length + " unanswered", false],
      ["Past SLA", overdue, "against our own targets", overdue > 0],
      ["Critical", crit, "1–2 star, unanswered", crit > 0]
    ].map(function (k) {
      return '<div class="kpi-tile"><div class="kpi-label">' + k[0] + "</div>" +
        '<div class="kpi-value' + (k[3] ? " is-bad" : "") + '">' + k[1] + "</div>" +
        '<div class="kpi-delta neutral">' + esc(k[2]) + "</div></div>";
    }).join("") +
      '<div class="kpi-tile"><div class="kpi-label">Oldest waiting</div>' +
      '<div class="kpi-value' + (oldest > 14 ? " is-bad" : "") + '">' + oldest + "d</div>" +
      '<div class="kpi-delta neutral">since it was posted</div></div>';

    $("triage-tag").textContent = q.length + " shown";
    $("triage-thread").innerHTML = q.length
      ? q.map(function (r) { return card(r, { tier: true }); }).join("")
      : emptyState("Nothing in the queue matches");
    wire($("triage-thread"), q);
    wireEmptyClear();
  }

  /* ---------- render ---------------------------------------------------- */
  var LAST = { tab: null, sig: null };

  function render() {
    // Changing tab or filters replaces what's on screen. Keeping the old scroll offset
    // drops the reader into the middle of a different list, above the band explaining
    // why it changed — so send them back to the top when the result set changes.
    var sig = [S.window, S.source, S.rating, S.theme, S.search, S.tier].join("|");
    var jumped = LAST.tab !== null && (LAST.tab !== S.tab || LAST.sig !== sig);
    LAST.tab = S.tab; LAST.sig = sig;

    renderTabs();
    renderFilters();
    renderBrief();
    renderActiveBar();

    if (S.tab === "overview") {
      $("f-count").textContent =
        M.windows[S.window].current.count + " reviews in this period";
    } else {
      var shown = S.tab === "triage" ? triageRows().length : filtered().length;
      var total = S.tab === "triage" ? M.triage.length : M.all_time.count;
      var bits = [shown + " of " + total];
      if (S.theme) bits.push("theme: " + titleCase(S.theme));
      if (S.source !== "all") bits.push((M.sources[S.source] || {}).label || S.source);
      $("f-count").textContent = bits.join(" · ");
    }

    if (S.tab === "overview") {
      renderKpis(); renderNarrative(); renderMix(); renderThemes(); renderSources(); renderChart();
      renderGaps();
    }
    if (S.tab === "reviews") renderThread();
    if (S.tab === "triage") renderTriage();

    document.querySelectorAll("[data-tier]").forEach(function (b) {
      b.classList.toggle("active", b.dataset.tier === S.tier);
    });

    if (jumped) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      ["thread", "triage-thread"].forEach(function (id) {
        var el = $(id); if (el) el.scrollTop = 0;
      });
    }
  }

  /* ---------- boot ------------------------------------------------------ */
  function boot() {
    var bust = "?v=" + Date.now();
    Promise.all([
      fetch("data/derived/metrics.json" + bust).then(function (r) { return r.json(); }),
      fetch("data/reviews.json" + bust).then(function (r) { return r.json(); })
        .catch(function () { return { reviews: [] }; }),
      fetch("data/derived/summary.json" + bust).then(function (r) { return r.json(); })
        .catch(function () { return null; })
    ]).then(function (res) {
      M = res[0];
      REVIEWS = res[1].reviews || [];
      SUMMARY = res[2];

      $("freshness").textContent = "Updated " + M.generated;
      $("freshness-sub").textContent = M.all_time.count + " reviews · " +
        Object.keys(M.all_time.by_source).length + " sources";
      var b30 = (M.briefs || {})["30"] || {};
      var notes = (b30.notes || []).filter(function (n) { return n !== b30.coverage_warning; });
      $("foot").innerHTML = "Built from public reviews on " +
        Object.keys(M.all_time.by_source).map(function (k) {
          return esc((M.sources[k] || {}).label || k);
        }).join(", ") +
        ". Review text is stored verbatim. " +
        '<a href="https://github.com/Theodore-Roosevelt-Presidential-Library/Reviews">Source and data</a>.' +
        (notes.length ? '<br><span class="foot-note">' +
          notes.map(esc).join(" ") + "</span>" : "");

      $("f-search").oninput = function (e) {
        S.search = e.target.value;
        if (S.tab === "overview") S.tab = "reviews";
        render();
        $("f-search").focus();
      };
      $("clear-all").onclick = function () { $("f-reset").click(); };
      $("f-reset").onclick = function () {
        S.source = "all"; S.rating = "all"; S.theme = null; S.search = "";
        S.tier = "all"; $("f-search").value = ""; render();
      };
      $("sort-toggle").onclick = function () {
        var order = ["newest", "oldest", "lowest"];
        var labels = { newest: "Newest first", oldest: "Oldest first", lowest: "Lowest rated" };
        S.sort = order[(order.indexOf(S.sort) + 1) % order.length];
        $("sort-toggle").textContent = labels[S.sort];
        render();
      };
      document.querySelectorAll("[data-tier]").forEach(function (b) {
        b.onclick = function () { S.tier = b.dataset.tier; render(); };
      });

      render();
    }).catch(function (e) {
      $("brief").innerHTML = '<div class="brief-headline">Could not load data</div>' +
        '<div class="brief-body"><p>' + esc(e && e.message) +
        " — has the collector run yet?</p></div>";
    });
  }

  boot();
})();
