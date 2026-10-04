/**
 * Cameras Decoded blog search.
 *
 * Lazy-loads /blog/search-index.json on first use, then does client-side
 * full-text matching across titles and article bodies. Tier 1 (title/excerpt)
 * matches rank above tier 2 (body text) matches.
 *
 * Usage: include this script and add a container:
 *   <div id="cd-blog-search"></div>
 * Then call: CDBlogSearch.mount(document.getElementById('cd-blog-search'))
 */
(function () {
  "use strict";

  var INDEX_URL = "/blog/search-index.json";
  var indexPromise = null;
  var articles = [];

  function loadIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = fetch(INDEX_URL, { credentials: "same-origin", cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("index fetch failed: " + r.status);
        return r.json();
      })
      .then(function (data) {
        articles = (data.articles || []).map(function (a) {
          return {
            url: a.url,
            title: a.title || "",
            excerpt: a.excerpt || "",
            date: a.date || "",
            section: a.section || "",
            body: a.body || "",
            _titleLC: (a.title || "").toLowerCase(),
            _bodyLC: (a.body || "").toLowerCase(),
          };
        });
        return articles;
      })
      .catch(function (err) {
        console.warn("[CDBlogSearch] index load failed:", err);
        indexPromise = null; // allow retry
        return [];
      });
    return indexPromise;
  }

  function snippet(body, query, radius) {
    radius = radius || 90;
    var qi = body.toLowerCase().indexOf(query);
    if (qi < 0) return "";
    var start = Math.max(0, qi - radius);
    var end = Math.min(body.length, qi + query.length + radius);
    var text = body.slice(start, end).trim();
    if (start > 0) text = "…" + text;
    if (end < body.length) text = text + "…";
    // Highlight the match
    var esc = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(
      new RegExp("(" + esc + ")", "ig"),
      "<mark>$1</mark>"
    );
  }

  function search(query) {
    query = query.trim().toLowerCase();
    if (!query || query.length < 2) return [];
    var words = query.split(/\s+/);
    var results = [];

    articles.forEach(function (a) {
      var titleHits = 0,
        bodyHits = 0,
        firstPos = Infinity;

      words.forEach(function (w) {
        var ti = a._titleLC.indexOf(w);
        if (ti >= 0) {
          titleHits++;
          firstPos = Math.min(firstPos, ti);
        }
        var bi = a._bodyLC.indexOf(w);
        if (bi >= 0) {
          bodyHits++;
          firstPos = Math.min(firstPos, 1000 + bi);
        }
      });

      if (titleHits === 0 && bodyHits === 0) return;

      // Title matches rank highest, then body matches, then earlier position
      var score = titleHits * 100 + bodyHits * 10 - firstPos / 10000;
      results.push({
        article: a,
        score: score,
        inTitle: titleHits > 0,
        snippet: titleHits > 0 ? "" : snippet(a.body, words[0]),
      });
    });

    results.sort(function (x, y) {
      return y.score - x.score;
    });
    return results.slice(0, 12);
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderResults(container, results, query) {
    var list = container.querySelector(".cd-search-results");
    if (!results.length) {
      list.innerHTML =
        '<div class="cd-search-empty">No articles mention "' +
        escHtml(query) +
        '" yet.</div>';
      return;
    }
    list.innerHTML = results
      .map(function (r) {
        var a = r.article;
        var sub = r.inTitle
          ? escHtml(a.excerpt).slice(0, 120)
          : r.snippet;
        var badge = r.inTitle
          ? '<span class="cd-search-badge">title</span>'
          : '<span class="cd-search-badge">in article</span>';
        return (
          '<a class="cd-search-hit" href="' +
          escHtml(a.url) +
          '">' +
          '<div class="cd-search-hit-top"><span class="cd-search-hit-title">' +
          escHtml(a.title) +
          "</span>" +
          badge +
          "</div>" +
          (a.section
            ? '<div class="cd-search-hit-meta">' + escHtml(a.section) + "</div>"
            : "") +
          '<div class="cd-search-hit-snippet">' +
          sub +
          "</div>" +
          "</a>"
        );
      })
      .join("");
  }

  function mount(el) {
    if (!el || el.dataset.cdSearchMounted) return;
    el.dataset.cdSearchMounted = "1";

    el.innerHTML =
      '<div class="cd-search-wrap">' +
      '<input class="cd-search-input" type="search" placeholder="Search articles…" ' +
      'aria-label="Search blog articles" autocomplete="off">' +
      '<div class="cd-search-results" hidden></div>' +
      "</div>";

    var input = el.querySelector(".cd-search-input");
    var results = el.querySelector(".cd-search-results");
    var debounce = null;
    var indexLoaded = false;

    // Preload index on focus so first keystroke is instant
    input.addEventListener("focus", function () {
      if (!indexLoaded) {
        indexLoaded = true;
        loadIndex();
      }
    });

    input.addEventListener("input", function () {
      clearTimeout(debounce);
      var q = input.value;
      if (q.trim().length < 2) {
        results.hidden = true;
        results.innerHTML = "";
        return;
      }
      debounce = setTimeout(function () {
        loadIndex().then(function () {
          var hits = search(q);
          results.hidden = false;
          renderResults(el, hits, q.trim());
        });
      }, 180);
    });

    // Close on Escape
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        input.value = "";
        results.hidden = true;
        results.innerHTML = "";
        input.blur();
      }
    });

    // Close when clicking outside
    document.addEventListener("click", function (e) {
      if (!el.contains(e.target)) {
        results.hidden = true;
      }
    });
  }

  window.CDBlogSearch = { mount: mount, loadIndex: loadIndex, search: search };
})();
