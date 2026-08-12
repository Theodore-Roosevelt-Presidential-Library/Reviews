/*!
 * Theodore Roosevelt Presidential Library — visitor quotes widget
 * Generated __GENERATED__ by collector/pullquotes.py. Do not edit site/embed.js by hand.
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

  var QUOTES = /*__QUOTES__*/[];
  var GENERATED = "__GENERATED__";
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

  /** Effective background behind an element, walking up through transparency. */
  function backdrop(el) {
    var node = el;
    while (node && node.nodeType === 1) {
      var c = parseColor(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0.1) return c;
      node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
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

  function styles(dark, ac, align) {
    var fg = dark ? "#F7F3EC" : "#241C17";
    var muted = dark ? "rgba(247,243,236,.62)" : "rgba(36,28,23,.58)";
    var rule = dark ? "rgba(247,243,236,.20)" : "rgba(36,28,23,.14)";
    var chip = dark ? "rgba(247,243,236,.10)" : "rgba(36,28,23,.05)";
    return [
      ':host{all:initial;display:block;contain:content}',
      '*{box-sizing:border-box;margin:0;padding:0}',
      '.w{font-family:"Source Serif 4",Georgia,"Times New Roman",serif;color:' + fg + ';',
      '  text-align:' + (align === "left" ? "left" : "center") + ';line-height:1.5}',
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
      '.stars{color:' + ac + ';letter-spacing:.08em;font-size:.75rem}',
      '.via{padding:.1rem .4rem;border-radius:3px;background:' + chip + ';font-size:.6875rem;',
      '  letter-spacing:.03em;text-transform:uppercase}',
      // Rotation is a cross-fade with a small lift. Both are suppressed under
      // prefers-reduced-motion, where the quote simply changes.
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
      '.foot{margin-top:1rem;font-family:Inter,system-ui,sans-serif;font-size:.625rem;',
      '  letter-spacing:.04em;text-transform:uppercase;opacity:.75;color:' + muted + '}',
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

  function mount(host) {
    var layout = (host.getAttribute("data-layout") || "banner").toLowerCase();
    var themeAttr = (host.getAttribute("data-theme") || "auto").toLowerCase();
    var accent = host.getAttribute("data-accent") || "";
    var align = (host.getAttribute("data-align") || "").toLowerCase();
    var count = Math.max(1, parseInt(host.getAttribute("data-count") || "3", 10));
    var interval = host.hasAttribute("data-interval")
      ? parseFloat(host.getAttribute("data-interval")) * 1000 : 8000;

    var bg = backdrop(host);
    var dark = themeAttr === "dark";
    if (themeAttr === "auto") dark = luminance(bg) < 0.45;
    var ac = pickAccent(accent, bg, dark ? "#F7F3EC" : "#241C17");

    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var pool = shuffle(QUOTES);

    var sheet = document.createElement("style");
    sheet.textContent = styles(dark, ac, align);
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
    if (layout === "card") {
      var box = document.createElement("div");
      box.className = "box";
      box.appendChild(stage);
      wrap.appendChild(box);
    } else {
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
