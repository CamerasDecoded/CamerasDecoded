/**
 * Cameras Decoded blog article — desktop 3-column enhancement.
 *
 * On viewports >= 1100px, wraps the <article> in a grid with:
 *   Left rail:  4 latest articles (from search-index.json, excluding current)
 *   Right rail: table of contents (from h2s) + share buttons
 *
 * Mobile is untouched — the rails are display:none below 1100px.
 * Safe to include on every blog article page; no-ops if no <article> found.
 */
(function () {
  "use strict";

  var MIN_WIDTH = 1100;
  var INDEX_URL = "/blog/search-index.json";

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function buildTOC(article) {
    var headings = article.querySelectorAll("h2");
    if (headings.length < 2) return null; // not worth a TOC

    var nav = document.createElement("nav");
    nav.className = "cd-rail-right";
    nav.setAttribute("aria-label", "Table of contents");

    var heading = document.createElement("div");
    heading.className = "cd-rail-heading";
    heading.textContent = "On this page";
    nav.appendChild(heading);

    var list = document.createElement("ul");
    list.className = "cd-toc-list";

    headings.forEach(function (h) {
      if (!h.id) h.id = slugify(h.textContent);
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      a.dataset.target = h.id;
      li.appendChild(a);
      list.appendChild(li);
    });
    nav.appendChild(list);

    // Highlight active section on scroll
    var links = list.querySelectorAll("a");
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            links.forEach(function (l) {
              l.classList.toggle("cd-toc-active", l.dataset.target === e.target.id);
            });
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    headings.forEach(function (h) {
      observer.observe(h);
    });

    // Share buttons
    var shareLabel = document.createElement("div");
    shareLabel.className = "cd-rail-heading";
    shareLabel.textContent = "Share";
    shareLabel.style.marginTop = "20px";
    nav.appendChild(shareLabel);

    var shareRow = document.createElement("div");
    shareRow.className = "cd-share-row";
    var pageUrl = encodeURIComponent(window.location.href);
    var pageTitle = encodeURIComponent(document.title);
    shareRow.innerHTML =
      '<a class="cd-share-btn" href="https://twitter.com/intent/tweet?url=' +
      pageUrl +
      "&text=" +
      pageTitle +
      '" target="_blank" rel="noopener">X</a>' +
      '<a class="cd-share-btn" href="https://www.facebook.com/sharer/sharer.php?u=' +
      pageUrl +
      '" target="_blank" rel="noopener">Facebook</a>' +
      '<a class="cd-share-btn" href="#" id="cd-copy-link">Copy link</a>';
    nav.appendChild(shareRow);

    shareRow.querySelector("#cd-copy-link").addEventListener("click", function (e) {
      e.preventDefault();
      var done = function () {
        e.target.textContent = "Copied!";
        setTimeout(function () {
          e.target.textContent = "Copy link";
        }, 1500);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(done, done);
      } else {
        done();
      }
    });

    return nav;
  }

  function buildLatestRail(currentSlug) {
    var aside = document.createElement("aside");
    aside.className = "cd-rail-left";
    aside.setAttribute("aria-label", "Latest articles");

    var heading = document.createElement("div");
    heading.className = "cd-rail-heading";
    heading.textContent = "Latest field notes";
    aside.appendChild(heading);

    var placeholder = document.createElement("div");
    placeholder.style.cssText = "font-size:12px;color:rgba(232,245,233,.4)";
    placeholder.textContent = "Loading…";
    aside.appendChild(placeholder);

    fetch(INDEX_URL, { credentials: "same-origin", cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("index fetch failed");
        return r.json();
      })
      .then(function (data) {
        placeholder.remove();
        var others = (data.articles || [])
          .filter(function (a) {
            return a.slug !== currentSlug;
          })
          .slice(0, 4);
        others.forEach(function (a) {
          var card = document.createElement("a");
          card.className = "cd-rail-card";
          card.href = a.url;
          card.innerHTML =
            '<div class="cd-rail-card-title">' +
            escHtml(a.title) +
            "</div>" +
            (a.date
              ? '<div class="cd-rail-card-meta">' + escHtml(a.date) + "</div>"
              : "");
          aside.appendChild(card);
        });
        if (!others.length) {
          aside.style.display = "none";
        }
      })
      .catch(function () {
        placeholder.textContent = "";
      });

    return aside;
  }

  function enhance() {
    var article = document.querySelector("article");
    if (!article || document.querySelector(".cd-rail-left")) return;

    // Current slug from URL: /blog/some-slug.html
    var m = window.location.pathname.match(/\/blog\/([^/]+)\.html/);
    var currentSlug = m ? m[1] : "";

    // Fixed-position sidebars — appended to body, no grid needed.
    // The article stays exactly as-is, centered by its own styles.
    var leftRail = buildLatestRail(currentSlug);
    var rightRail = buildTOC(article);

    document.body.appendChild(leftRail);
    if (rightRail) {
      document.body.appendChild(rightRail);
    }
  }

  // Run on load; re-check on resize crossing the breakpoint
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhance);
  } else {
    enhance();
  }

  var wasDesktop = window.innerWidth >= MIN_WIDTH;
  window.addEventListener("resize", function () {
    var isDesktop = window.innerWidth >= MIN_WIDTH;
    if (isDesktop && !wasDesktop && !document.querySelector(".cd-rail-left")) {
      enhance();
    }
    wasDesktop = isDesktop;
  });
})();
