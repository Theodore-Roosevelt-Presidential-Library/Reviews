/*!
 * Theodore Roosevelt Presidential Library — visitor quotes widget
 * Generated 2026-08-12 by collector/pullquotes.py. Do not edit site/embed.js by hand.
 *
 *   <div data-trpl-quotes data-layout="banner"></div>
 *   <script src="https://reviews.labs.trlibrary.com/embed.js" async></script>
 *
 * Options, all optional, set as data- attributes on the container:
 *   data-layout   banner | card | wall | inline      (default banner)
 *   data-theme    auto | light | dark                (default auto)
 *   data-accent   any CSS colour                     (default TRPL red)
 *   data-count    how many to show in wall layout    (default 3)
 *   data-interval seconds between rotations, 0 = off (default 8)
 *   data-align    left | center                      (default center for banner)
 *   data-height   fixed | auto                       (default fixed — no layout shift)
 *
 * Design notes worth keeping:
 *
 * Everything renders inside a shadow root. The host site is Drupal with Bootstrap, whose
 * global styles would otherwise reach in and restyle a blockquote; nothing here inherits
 * except the font stack and the resolved text colour, both deliberately.
 *
 * The widget reads its own computed background and picks light or dark text from the
 * luminance it finds. "Any colour block including white" means the block can't assume one.
 * Transparent backgrounds walk up the tree until something opaque is found.
 *
 * Rotation stops when the widget is off screen, when the tab is hidden, when a pointer is
 * over it, and when the visitor has asked for reduced motion. A quote block that keeps
 * animating behind a scrolled-past viewport is wasted battery and, for some readers,
 * genuinely unpleasant.
 */
(function () {
  "use strict";

  var QUOTES = [{"quote":"The interactive exhibits made it engaging for young children and an incredible educational experience.","draw":"kids stayed engaged","author":"Abby H.","source":"tripadvisor","date":"2026-08-10","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1072569393-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html"},{"quote":"There were things to do and see for all ages. Museum artifacts, interactive exhibits, scavenger hunts, replicas, rooms designed to immerse you in different eras of TR's life... there was just so much.","draw":"enough to fill a day","author":"Lakeisha H.","source":"google","date":"2026-08-07","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT20xWlFtSm1jSGRwZWtGMmFVRXlZVFkzTVZCcGVsRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOm1ZQmJmcHdpekF2aUEyYTY3MVBpelE%7C%7C?hl=en"},{"quote":"The design blended into the landscape and incorporated features of the surrounding lands with wood textures and even the essence of the sandstone striations seen in the Badlands.","draw":"building blends with landscape","author":"Tina J.","source":"google","date":"2026-08-07","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2kweFdHOXZTM1pJY1VwSVoySkhTamw0TVVGbmJYYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOi0xWG9vS3ZIcUpIZ2JHSjl4MUFnbXc%7C%7C?hl=en"},{"quote":"Over the top exhibits. So interactive. Families and children were just loving it.","draw":"kids stayed engaged","author":"Becky W.","source":"tripadvisor","date":"2026-08-06","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1071737934-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html"},{"quote":"Stunning architecture designed to blend into the Badlands landscape.","draw":"building blends with landscape","author":"Mayberrys","source":"tripadvisor","date":"2026-08-06","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1071880432-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html"},{"quote":"An absolutely amazing structure built into the North Dakota landscape.","draw":"building blends with landscape","author":"Jonathan M.","source":"google","date":"2026-08-06","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tWWlJFbzJiMHRwZUhWbE5EVmZiamxtWDB0dlVrRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkVZREo2b0tpeHVlNDVfbjlmX0tvUkE%7C%7C?hl=en"},{"quote":"Interactive exhibit, very informative and the interactive exhibits were a fun highlight","draw":"interactive exhibits","author":"Sharon F.","source":"google","date":"2026-08-06","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2w4dFduVXlNWFpDUzFOUFlXVm9MVmhsUlZOTmMxRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOl8tWnUyMXZCS1NPYWVoLVhlRVNNc1E%7C%7C?hl=en"},{"quote":"Beautiful views from the roof and cool looking architecture.","draw":"the badlands view","author":"Scott R.","source":"google","date":"2026-08-04","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25kQlR6QlZZbVIwT1VvNWMyZERjbWRzTVU1bGRXYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOndBTzBVYmR0OUo5c2dDcmdsMU5ldWc%7C%7C?hl=en"},{"quote":"Totally loved the location, the design, use of AI, and the interactive exhibits.","draw":"interactive exhibits","author":"Brian H.","source":"google","date":"2026-08-04","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21wUVRsRmpMV3QxUVhSSFgxUlhabGRvTjJKWmVGRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmpQTlFjLWt1QXRHX1RXZldoN2JZeFE%7C%7C?hl=en"},{"quote":"This a must see experience! Spent 6 hours there and still didn't experience everything.","draw":"enough to fill a day","author":"Randy H.","source":"google","date":"2026-08-04","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21aNlFtOTVkWGRaVjAxdFlUTkpWQzB0VG13dFgxRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmZ6Qm95dXdZV01tYTNJVC0tTmwtX1E%7C%7C?hl=en"},{"quote":"The interactive exhibits are wonderful, kids will enjoy them too.","draw":"kids stayed engaged","author":"Tom K.","source":"google","date":"2026-08-03","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21kNWJqZDVSVXMzYTFSVVduWktiRW8xUmpCNlRtYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmd5bjd5RUs3a1RUWnZKbEo1RjB6Tmc%7C%7C?hl=en"},{"quote":"An exceptionally interactive and immersive educational experience housed in architecture that mirrors the surrounding beautiful landscape.","draw":"immersive experience","author":"Annika G.","source":"google","date":"2026-08-02","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tRNFUyTjBRbHB5VjJORWNXWmhSRmxSV2toSU9GRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkQ4U2N0QlpyV2NEcWZhRFlRWkhIOFE%7C%7C?hl=en"},{"quote":"The building itself is a masterpiece, seamlessly blending into the surrounding landscape, and the panoramic views alone are worth the visit.","draw":"the badlands view","author":"Obaidullah R.","source":"google","date":"2026-08-01","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25kbFRFWkpRMGRXU21VMFRWWndNalpZY1hOWmFYYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOndlTEZJQ0dWSmU0TVZwMjZYcXNZaXc%7C%7C?hl=en"},{"quote":"It is an inspiring place for its architecture and high tech show.","draw":"architecture and tech","author":"Giorgio F.","source":"google","date":"2026-08-01","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pkWGJFODNTbGxxVFhka1VEUlFSalo0WkhkUGFXYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjdXbE83SllqTXdkUDRQRjZ4ZHdPaWc%7C%7C?hl=en"},{"quote":"Incredibly engaging and fun. The exhibits and videos are really good.","draw":"engaging exhibits and videos","author":"Matt R.","source":"google","date":"2026-07-31","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21SNFJtaGpUVmg2YVZoM1FYazBRV2h4Y1VaclNGRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmR4RmhjTVh6aVh3QXk0QWhxcUZrSFE%7C%7C?hl=en"},{"quote":"Interactive displays get people of all ages and abilities involved.","draw":"interactive for all ages","author":"Betty B.","source":"google","date":"2026-07-30","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25GeFlsQnVkWEJCZW5sYU5VbFlXRGRrYjNKa1dHYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnFxYlBudXBBenlaNUlYWDdkb3JkWGc%7C%7C?hl=en"},{"quote":"The building itself is absolutely beautiful, and it's worth to to learn also about the ways the library is generating its own sustainable energy, curbs carbon, loses no water, and aims for zero waste.","draw":"sustainable building","author":"M-A","source":"google","date":"2026-07-27","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tsc1JFNDVjMUpCWDNWUWJXZ3hkRlZQZDBWdVYxRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOklsRE45c1JBX3VQbWgxdFVPd0VuV1E%7C%7C?hl=en"},{"quote":"The architecture and grounds are fantastic! You get a good sense of the place and what it must have felt like to live here more than a century ago.","draw":"historic atmosphere","author":"Stewart K.","source":"google","date":"2026-07-26","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2taQ1RVdEdTSGx4ZGpCVlFWQjROMUJXY1ZSd2IwRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkZCTUtGSHlxdjBVQVB4N1BWcVRwb0E%7C%7C?hl=en"}];
  var GENERATED = "2026-08-12";
  if (!QUOTES.length) return;

  var BRAND = "#8B2E1F";
  var SOURCE_LABEL = { google: "Google", tripadvisor: "TripAdvisor",
                       yelp: "Yelp", facebook: "Facebook" };

  // ---------------------------------------------------------------- utilities

  function parseColor(value) {
    var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/i.exec(value || "");
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  }

  /**
   * What is actually behind this widget?
   *
   * Returns { color, media }. `media` means an ancestor is painted with an image, gradient
   * or video, so the colour is a guess and shouldn't be trusted.
   *
   * Reading background-color alone is what broke this on trlibrary.com. The homepage is
   * built from sections backed by photographs and a video banner; every one of them reports
   * background-color: rgba(0,0,0,0). The walk sailed past them to <body>, found white,
   * chose near-black text — and put it on a dark picture of the Badlands.
   */
  function backdrop(el) {
    var node = el, media = false;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      var cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== "none") media = true;
      // A <video> or full-bleed <img> positioned behind the content is the same problem
      // wearing different markup — very common in Drupal hero sections.
      if (!media && node.querySelector) {
        var bleed = node.querySelector(":scope > video, :scope > img, :scope > picture");
        if (bleed) {
          var r = bleed.getBoundingClientRect(), n = node.getBoundingClientRect();
          if (r.width >= n.width * 0.9 && r.height >= n.height * 0.9) media = true;
        }
      }
      var c = parseColor(cs.backgroundColor);
      if (c && c.a > 0.1) return { color: c, media: media };
      node = node.parentElement;
    }
    return { color: { r: 255, g: 255, b: 255, a: 1 }, media: media };
  }

  /** WCAG relative luminance. Decides light text vs dark, nothing else. */
  function luminance(c) {
    var f = [c.r, c.g, c.b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  }

  function contrast(a, b) {
    var l1 = luminance(a), l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  /**
   * An accent that survives the background it landed on.
   *
   * Light/dark alone isn't enough: the brand red is dark, so a dark block gets the clay
   * accent — but on the brand red block itself that clay sits at 3.5:1 against its own
   * parent and the stars nearly vanish. Anything that fails is dropped for the foreground
   * colour, which is guaranteed to read because it is what the quote is set in.
   */
  function pickAccent(requested, bg, fg) {
    var candidates = [requested, luminance(bg) < 0.45 ? "#E8927C" : BRAND, fg];
    for (var i = 0; i < candidates.length; i++) {
      if (!candidates[i]) continue;
      var probe = document.createElement("span");
      probe.style.color = candidates[i];
      document.body.appendChild(probe);
      var resolved = parseColor(getComputedStyle(probe).color);
      document.body.removeChild(probe);
      if (resolved && contrast(resolved, bg) >= 3) return candidates[i];
    }
    return fg;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ------------------------------------------------------------------ styles

  function styles(dark, ac, align, media) {
    // Plain white on dark, not the cream used elsewhere in the brand. Over a photograph the
    // cream reads as dirty; white reads as intentional.
    var fg = dark ? "#FFFFFF" : "#241C17";
    var muted = dark ? "rgba(255,255,255,.78)" : "rgba(36,28,23,.58)";
    var rule = dark ? "rgba(255,255,255,.28)" : "rgba(36,28,23,.14)";
    var chip = dark ? "rgba(255,255,255,.16)" : "rgba(36,28,23,.05)";
    // Stars get their own colour, not the accent. A rating reads as a rating when it is
    // gold — brand red on a red block was both invisible and unfamiliar. Deepened on light
    // backgrounds, where bright gold falls under 3:1 against white.
    var star = dark ? "#FFC24A" : "#B8860B";
    // Text on an image needs a shadow or it dissolves wherever the picture goes pale.
    var shadow = media ? "0 1px 12px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.45)" : "none";
    return [
      ':host{all:initial;display:block;contain:content}',
      '*{box-sizing:border-box;margin:0;padding:0}',
      '.w{font-family:"Source Serif 4",Georgia,"Times New Roman",serif;color:' + fg + ';',
      '  text-align:' + (align === "left" ? "left" : "center") + ';line-height:1.5;',
      '  text-shadow:' + shadow + '}',
      '.w.l-wall,.w.l-inline{text-align:left}',
      'blockquote{font-size:clamp(1.15rem,2.4vw,1.6rem);font-weight:400;letter-spacing:-.01em;',
      '  quotes:none;position:relative}',
      '.l-banner blockquote{max-width:44ch;margin:0 auto}',
      '.l-banner.a-left blockquote{margin:0}',
      '.mark{display:block;font-size:2.6em;line-height:.6;color:' + ac + ';opacity:.4;',
      '  margin-bottom:.16em;font-family:Georgia,serif}',
      '.cite{margin-top:1rem;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",',
      '  Helvetica,Arial,sans-serif;font-size:.8125rem;font-style:normal;color:' + muted + ';',
      '  display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;',
      '  justify-content:' + (align === "left" ? "flex-start" : "center") + '}',
      '.l-wall .cite,.l-inline .cite{justify-content:flex-start}',
      '.who{font-weight:600;color:' + fg + '}',
      '.stars{color:' + star + ';letter-spacing:.09em;font-size:.8125rem;text-shadow:none}',
      '.via{padding:.1rem .4rem;border-radius:3px;background:' + chip + ';font-size:.6875rem;',
      '  letter-spacing:.03em;text-transform:uppercase;text-shadow:none}',
      // Rotation is a cross-fade with a small lift. Both are suppressed under
      // prefers-reduced-motion, where the quote simply changes.
      // Measured off-screen at the real width, with the real styles, so the number it
      // yields is the height the quote will actually occupy. visibility:hidden rather than
      // display:none — a display:none element has no layout and measures zero.
      '.probe{position:absolute;left:0;top:0;width:100%;visibility:hidden;',
      '  pointer-events:none;z-index:-1}',
      '.stage-host{position:relative}',
      '.slide{opacity:1;transform:translateY(0);transition:opacity .5s ease,transform .5s ease}',
      '.slide.out{opacity:0;transform:translateY(-6px)}',
      '@media (prefers-reduced-motion:reduce){.slide{transition:none}}',
      // wall
      '.grid{display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}',
      '.grid blockquote{font-size:1rem;line-height:1.6;padding:1.15rem 1.25rem;',
      '  border:1px solid ' + rule + ';border-radius:6px;height:100%}',
      '.grid .mark{font-size:1.8em}',
      '.grid .cite{margin-top:.75rem;font-size:.75rem}',
      // inline
      '.l-inline blockquote{font-size:1rem;line-height:1.65;padding-left:1rem;',
      '  border-left:3px solid ' + ac + '}',
      '.l-inline .mark{display:none}',
      // card
      '.l-card .box{padding:1.6rem 1.75rem;border:1px solid ' + rule + ';border-radius:8px;',
      '  background:' + (dark ? "rgba(247,243,236,.04)" : "rgba(255,255,255,.55)") + '}',
      '.l-card blockquote{font-size:1.1rem;line-height:1.6}',
      // controls
      '.dots{display:flex;gap:.4rem;margin-top:1.1rem;',
      '  justify-content:' + (align === "left" ? "flex-start" : "center") + '}',
      '.dot{width:6px;height:6px;border-radius:50%;border:0;padding:0;cursor:pointer;',
      '  background:' + rule + ';transition:background .2s,width .2s}',
      '.dot[aria-current="true"]{background:' + ac + ';width:18px;border-radius:3px}',
      '.dot:focus-visible{outline:2px solid ' + ac + ';outline-offset:3px}',
      // Over a photograph this line sat at .75 opacity on a busy background and vanished.
      // Full strength and the shared shadow when there is an image behind it.
      '.foot{margin-top:1rem;font-family:Inter,system-ui,sans-serif;font-size:.625rem;',
      '  letter-spacing:.04em;text-transform:uppercase;color:' + muted + ';',
      '  opacity:' + (media ? "1" : ".75") + '}',
      '.foot a{color:inherit;text-underline-offset:2px}'
    ].join("");
  }

  // ------------------------------------------------------------------ render

  function stars(n) { return n ? "★★★★★".slice(0, n) : ""; }

  function quoteHtml(q, opts) {
    var via = SOURCE_LABEL[q.source] || q.source;
    // Marks a fragment as a fragment. Adds no words, changes none — the quote is still
    // exactly what the visitor typed, it just stops looking like a complete sentence that
    // someone forgot to punctuate.
    var text = q.quote + (/[.!?…"'’”]$/.test(q.quote) ? "" : "…");
    return '<blockquote><span class="mark" aria-hidden="true">“</span>' +
      esc(text) +
      '<footer class="cite"><span class="who">' + esc(q.author) + '</span>' +
      (opts.showStars !== false ? '<span class="stars" aria-label="5 out of 5 stars">' +
        stars(q.rating || 5) + '</span>' : '') +
      '<span class="via">' + esc(via) + '</span></footer></blockquote>';
  }

  /**
   * Reserve the height of the tallest quote so rotation never moves the page.
   *
   * Quotes vary from one line to five. Left alone the block resizes every eight seconds and
   * shoves everything below it up and down — the worst kind of layout shift, because it
   * happens while someone is reading further down the page rather than only at load.
   *
   * Measured rather than guessed: a character-count estimate breaks the moment the font,
   * the column width or the viewport changes. This renders every quote into a hidden probe
   * that sits inside the same container and inherits the same rules, takes the largest
   * height, and pins the stage to it.
   */
  function reserveHeight(container, stage, pool) {
    var probe = document.createElement("div");
    probe.className = "probe";
    container.appendChild(probe);
    var tallest = 0;
    for (var n = 0; n < pool.length; n++) {
      probe.innerHTML = quoteHtml(pool[n], {});
      tallest = Math.max(tallest, probe.getBoundingClientRect().height);
    }
    container.removeChild(probe);
    if (tallest > 0) stage.style.minHeight = Math.ceil(tallest) + "px";
  }

  /** Re-measure when the width changes or a webfont finally lands. */
  function keepReserved(host, container, stage, pool) {
    var pending = null;
    function remeasure() {
      clearTimeout(pending);
      pending = setTimeout(function () {
        stage.style.minHeight = "";      // release before measuring, or it only ever grows
        reserveHeight(container, stage, pool);
      }, 120);
    }
    reserveHeight(container, stage, pool);

    // Source Serif 4 arrives after first paint. Measuring in the fallback font gives the
    // wrong answer and the reserved box ends up short by a line on narrow screens.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(remeasure).catch(function () {});
    }
    if (window.ResizeObserver) {
      var first = true;
      new ResizeObserver(function () {
        if (first) { first = false; return; }   // the observer fires once on attach
        remeasure();
      }).observe(host);
    } else {
      window.addEventListener("resize", remeasure);
    }
  }

  function mount(host) {
    var layout = (host.getAttribute("data-layout") || "banner").toLowerCase();
    var themeAttr = (host.getAttribute("data-theme") || "auto").toLowerCase();
    var accent = host.getAttribute("data-accent") || "";
    var align = (host.getAttribute("data-align") || "").toLowerCase();
    var count = Math.max(1, parseInt(host.getAttribute("data-count") || "3", 10));
    var interval = host.hasAttribute("data-interval")
      ? parseFloat(host.getAttribute("data-interval")) * 1000 : 8000;

    var back = backdrop(host);
    var bg = back.color;
    var dark = themeAttr === "dark";
    if (themeAttr === "auto") {
      // Over a photograph or video the measured colour means nothing. Light text with a
      // soft shadow is the safe read on almost any image; dark text on an unknown picture
      // is a coin flip, and this one landed wrong on the Library's own homepage.
      dark = back.media ? true : luminance(bg) < 0.45;
    }
    if (back.media && dark) bg = { r: 40, g: 36, b: 32, a: 1 };  // assume a dark-ish image
    var ac = pickAccent(accent, bg, dark ? "#FFFFFF" : "#241C17");

    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var pool = shuffle(QUOTES);

    var sheet = document.createElement("style");
    sheet.textContent = styles(dark, ac, align, back.media);
    root.appendChild(sheet);

    var wrap = document.createElement("div");
    wrap.className = "w l-" + layout + (align === "left" ? " a-left" : "");
    root.appendChild(wrap);

    // A wall shows several at once and does not rotate: motion in a grid is noise.
    if (layout === "wall") {
      wrap.innerHTML = '<div class="grid">' +
        pool.slice(0, count).map(function (q) { return quoteHtml(q, {}); }).join("") +
        "</div>" + footer();
      return;
    }

    var i = 0;
    var stage = document.createElement("div");
    stage.className = "slide";
    // The probe has to be measured inside whatever box constrains the real quote, or a
    // padded card measures at the wrong width and reserves too little.
    var container = wrap;
    if (layout === "card") {
      var box = document.createElement("div");
      box.className = "box stage-host";
      box.appendChild(stage);
      wrap.appendChild(box);
      container = box;
    } else {
      wrap.classList.add("stage-host");
      wrap.appendChild(stage);
    }

    var dots = null;
    if (pool.length > 1 && interval > 0) {
      dots = document.createElement("div");
      dots.className = "dots";
      dots.setAttribute("role", "tablist");
      dots.setAttribute("aria-label", "Choose a visitor quote");
      pool.slice(0, Math.min(pool.length, 6)).forEach(function (_, n) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "dot";
        b.setAttribute("aria-label", "Quote " + (n + 1));
        b.onclick = function () { show(n, true); };
        dots.appendChild(b);
      });
      wrap.appendChild(dots);
    }
    wrap.insertAdjacentHTML("beforeend", footer());

    // The quote is not an alert; a screen reader should find it on its own terms rather
    // than have every rotation announced over whatever the visitor is reading.
    stage.setAttribute("aria-live", "off");
    stage.setAttribute("role", "region");
    stage.setAttribute("aria-label", "What visitors say");

    var reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function paint(n) {
      stage.innerHTML = quoteHtml(pool[n], {});
      if (dots) {
        Array.prototype.forEach.call(dots.children, function (d, k) {
          d.setAttribute("aria-current", k === n % dots.children.length ? "true" : "false");
        });
      }
    }

    function show(n, manual) {
      i = (n + pool.length) % pool.length;
      if (reduce) { paint(i); }
      else {
        stage.classList.add("out");
        setTimeout(function () { paint(i); stage.classList.remove("out"); }, 320);
      }
      if (manual) restart();
    }

    var timer = null;
    function restart() {
      clearInterval(timer);
      if (interval > 0 && pool.length > 1) {
        timer = setInterval(function () { show(i + 1); }, interval);
      }
    }
    function stop() { clearInterval(timer); timer = null; }

    paint(0);
    if (dots) dots.children[0].setAttribute("aria-current", "true");

    // Opt out with data-height="auto" if a block genuinely wants to hug its content.
    if ((host.getAttribute("data-height") || "fixed").toLowerCase() !== "auto") {
      keepReserved(host, container, stage, pool);
    }
    restart();

    host.addEventListener("mouseenter", stop);
    host.addEventListener("focusin", stop);
    host.addEventListener("mouseleave", restart);
    host.addEventListener("focusout", restart);
    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : restart();
    });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? restart() : stop();
      }, { threshold: 0.05 }).observe(host);
    }
  }

  // One quiet line. The generated date lives in the tooltip, not on the page: a visible
  // date on a marketing block reads as a system artifact, and goes stale visibly if the
  // pipeline ever stops.
  function footer() {
    return '<div class="foot" title="Updated ' + esc(GENERATED) + '">' +
      'Excerpts from verified visitor reviews</div>';
  }

  function init() {
    var hosts = document.querySelectorAll("[data-trpl-quotes]:not([data-trpl-ready])");
    Array.prototype.forEach.call(hosts, function (h) {
      h.setAttribute("data-trpl-ready", "1");
      try { mount(h); } catch (e) { /* never take the page down over a quote block */ }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  window.TRPLQuotes = { refresh: init, count: QUOTES.length };
})();
