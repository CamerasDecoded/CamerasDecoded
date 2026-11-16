/* =====================================================================
   CAMERAS DECODED — Next card (the "bottomless pit" guidance card)
   window.CDNext.show({ id, image, title, body, ctaLabel, ctaHref })

   One shared component, every "what next" in the app. A premium bottom
   sheet with a full-bleed image header, one short title + one line of
   body, and ONE obvious button (solid green, the single chase-border
   CTA on the screen while open). Self-contained: injects its own CSS,
   following the paywall.js / ptr.js drop-in pattern.

   Nag-balance (owner's rule: lead, don't nag) is built in:
   - A card id shows once per session (sessionStorage guard).
   - Always dismissible: swipe down, veil tap, X, "Not now", Escape.
   - Dismissing returns the user to exactly where they were — the card
     never blocks navigation and never re-prompts in the same session.
   ===================================================================== */
(function () {
  'use strict';
  if (window.CDNext) return;

  var SEEN_PREFIX = 'cd_next_seen_';
  var HIDE_MS = 320;

  var scrim = null, sheet = null, imgWrap = null, imgEl = null,
      titleEl = null, bodyEl = null, ctaEl = null, ctaLabelEl = null;
  var open = false, openId = null, lastFocus = null, hideTimer = null;

  /* ------------------------------- CSS ------------------------------- */
  var CSS = [
    '.nx-scrim{position:fixed;inset:0;z-index:20000;display:flex;align-items:flex-end;justify-content:center;',
    'background:rgba(2,6,2,.72);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);',
    'opacity:0;transition:opacity .28s ease;padding:0 12px calc(12px + env(safe-area-inset-bottom,0px));}',
    '.nx-scrim.nx-open{opacity:1;}',

    '.nx-sheet{position:relative;width:100%;max-width:480px;overflow:hidden;flex:0 0 auto;',
    'border-radius:24px;border:1px solid rgba(141,235,0,.22);',
    'background:linear-gradient(175deg,#0b120a 0%,#070d07 55%,#0a140a 100%);',
    'box-shadow:0 -18px 80px rgba(0,0,0,.7),0 0 60px rgba(141,235,0,.07);',
    'transform:translateY(110%);transition:transform .45s cubic-bezier(.32,.72,.35,1);touch-action:none;}',
    '.nx-scrim.nx-open .nx-sheet{transform:translateY(0);}',
    '.nx-sheet.nx-dragging{transition:none;}',
    '.nx-sheet:focus{outline:none;}',

    /* full-bleed image header */
    '.nx-img{position:relative;height:180px;overflow:hidden;background:#0a0b0a;}',
    '.nx-img img{width:100%;height:100%;object-fit:cover;display:block;}',
    '.nx-img-scrim{position:absolute;inset:0;pointer-events:none;',
    'background:linear-gradient(180deg,rgba(7,13,7,.08) 40%,rgba(7,13,7,.45) 78%,#0b120a 100%);}',
    '.nx-grip{position:absolute;top:10px;left:50%;transform:translateX(-50%);',
    'width:40px;height:4px;border-radius:2px;background:rgba(255,255,255,.55);z-index:2;pointer-events:none;}',
    '.nx-x{position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;z-index:2;',
    'display:flex;align-items:center;justify-content:center;cursor:pointer;',
    'background:rgba(5,7,5,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);',
    'border:1px solid rgba(255,255,255,.18);color:#fff;}',
    '.nx-x:active{transform:scale(.94);}',

    '.nx-body{padding:18px 20px 20px;}',
    '.nx-kicker{font:700 11px "Space Mono",ui-monospace,monospace;letter-spacing:.22em;',
    'text-transform:uppercase;color:#8deb00;margin:0 0 8px;}',
    '.nx-title{font:800 24px/1.15 "Montserrat",system-ui,sans-serif;color:#fff;margin:0 0 8px;letter-spacing:-.01em;}',
    '.nx-sub{font:400 14px/1.55 "Montserrat",system-ui,sans-serif;color:#b4b4b4;margin:0 0 18px;}',

    /* the one loud button: solid green + the chase ring (single primary CTA) */
    '@property --nx-angle{syntax:"<angle>";initial-value:0deg;inherits:false;}',
    '@keyframes nxSpin{to{--nx-angle:360deg;}}',
    '.nx-cta{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;',
    'width:100%;min-height:56px;border-radius:16px;border:0;cursor:pointer;text-decoration:none;',
    'background:linear-gradient(180deg,#a4f71f,#7fd000);color:#0a0c05;',
    'font:800 15px "Montserrat",system-ui,sans-serif;letter-spacing:.02em;',
    'box-shadow:0 8px 28px rgba(141,235,0,.35),inset 0 1px 0 rgba(255,255,255,.22);}',
    '.nx-cta::before{content:"";position:absolute;inset:-1px;border-radius:17px;padding:1.5px;',
    'background:conic-gradient(from var(--nx-angle),transparent 20%,#8deb00 40%,transparent 60%,#8deb00 80%,transparent 100%);',
    '-webkit-mask:linear-gradient(#000,#000) content-box,linear-gradient(#000,#000);',
    '-webkit-mask-composite:xor;mask:linear-gradient(#000,#000) content-box,linear-gradient(#000,#000);',
    'mask-composite:exclude;pointer-events:none;opacity:.8;}',
    '@media (prefers-reduced-motion:no-preference){.nx-cta::before{animation:nxSpin 6s linear infinite;}}',
    '.nx-cta:active{transform:scale(.98);}',
    '.nx-cta svg{flex:0 0 auto;}',
    /* Focus is keyboard-only: programmatic focus on open shows no ring
       (nothing on touch), tabbing in shows a deliberate white ring. */
    '.nx-cta:focus,.nx-x:focus,.nx-later:focus{outline:none;}',
    '.nx-cta:focus-visible{outline:2px solid rgba(255,255,255,.9);outline-offset:3px;}',
    '.nx-x:focus-visible,.nx-later:focus-visible{outline:2px solid rgba(255,255,255,.9);outline-offset:2px;}',

    '.nx-later{display:block;margin:12px auto 0;background:none;border:0;color:#8a9784;',
    'font:600 13px "Montserrat",system-ui,sans-serif;cursor:pointer;padding:6px 12px;}',
    '.nx-later:hover{color:#fff;}',

    '@media (prefers-reduced-motion:reduce){',
    '.nx-scrim,.nx-sheet{transition:none;}',
    '.nx-cta::before{animation:none;}}'
  ].join('\n');

  function injectCss() {
    if (document.querySelector('style[data-cd-next]')) return;
    var style = document.createElement('style');
    style.setAttribute('data-cd-next', '');
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* --------------------------- session guard -------------------------- */
  function seen(id) {
    try { return !!window.sessionStorage.getItem(SEEN_PREFIX + id); } catch (e) { return false; }
  }
  function markSeen(id) {
    try { window.sessionStorage.setItem(SEEN_PREFIX + id, '1'); } catch (e) {}
  }

  /* ------------------------------ build ------------------------------ */
  var X_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" ' +
    'stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
    '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
  var ARROW_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
    'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  function build() {
    injectCss();
    scrim = document.createElement('div');
    scrim.className = 'nx-scrim';
    scrim.id = 'cdNextScrim';
    scrim.setAttribute('role', 'dialog');
    scrim.setAttribute('aria-modal', 'true');
    scrim.setAttribute('aria-labelledby', 'cdNextTitle');
    scrim.style.display = 'none';
    scrim.hidden = true;
    scrim.innerHTML =
      '<div class="nx-sheet" id="cdNextSheet" tabindex="-1">' +
        '<div class="nx-img" id="cdNextImgWrap">' +
          '<img id="cdNextImg" src="" alt="" />' +
          '<div class="nx-img-scrim"></div>' +
          '<span class="nx-grip" aria-hidden="true"></span>' +
          '<button class="nx-x" id="cdNextX" type="button" aria-label="Dismiss">' + X_SVG + '</button>' +
        '</div>' +
        '<div class="nx-body">' +
          '<div class="nx-kicker">Next up</div>' +
          '<h2 class="nx-title" id="cdNextTitle"></h2>' +
          '<p class="nx-sub" id="cdNextBody"></p>' +
          '<a class="nx-cta" id="cdNextCta" href="#"><span id="cdNextCtaLabel"></span>' + ARROW_SVG + '</a>' +
          '<button class="nx-later" id="cdNextLater" type="button">Not now</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(scrim);

    sheet = scrim.querySelector('#cdNextSheet');
    imgWrap = scrim.querySelector('#cdNextImgWrap');
    imgEl = scrim.querySelector('#cdNextImg');
    titleEl = scrim.querySelector('#cdNextTitle');
    bodyEl = scrim.querySelector('#cdNextBody');
    ctaEl = scrim.querySelector('#cdNextCta');
    ctaLabelEl = scrim.querySelector('#cdNextCtaLabel');

    /* Image failed or absent: the sheet still works, header just hides. */
    imgEl.addEventListener('error', function () { imgWrap.style.display = 'none'; });

    scrim.querySelector('#cdNextX').addEventListener('click', hide);
    scrim.querySelector('#cdNextLater').addEventListener('click', hide);
    scrim.addEventListener('click', function (e) { if (e.target === scrim) hide(); });
    ctaEl.addEventListener('click', function () {
      /* A CTA without a destination just dismisses. */
      if (!ctaEl.getAttribute('href') || ctaEl.getAttribute('href') === '#') hide();
    });

    /* Swipe-to-dismiss: pointer tracking on window so taps still click. */
    var drag = null;
    sheet.addEventListener('pointerdown', function (e) {
      if (!open || (e.pointerType === 'mouse' && e.button !== 0)) return;
      drag = { y0: e.clientY, t0: Date.now(), dy: 0, moved: false };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp, { once: true });
      window.addEventListener('pointercancel', onUp, { once: true });
    });
    function onMove(e) {
      if (!drag) return;
      var dy = e.clientY - drag.y0;
      if (dy > 8) drag.moved = true;
      if (!drag.moved) return;
      drag.dy = dy;
      if (dy > 0) {
        sheet.classList.add('nx-dragging');
        sheet.style.transform = 'translateY(' + Math.min(dy, 260) + 'px)';
        scrim.style.opacity = String(Math.max(0.25, 1 - dy / 420));
      }
    }
    function onUp(e) {
      window.removeEventListener('pointermove', onMove);
      if (!drag) return;
      var dy = drag.dy, dt = Math.max(1, Date.now() - drag.t0);
      var flick = dy > 30 && (dy / dt) > 0.5;
      var d = drag; drag = null;
      if (d.moved && (dy > 90 || flick)) { hide(); return; }
      sheet.classList.remove('nx-dragging');
      sheet.style.transform = '';
      scrim.style.opacity = '';
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) hide();
    });
  }

  /* --------------------------- show / hide --------------------------- */
  function show(opts) {
    opts = opts || {};
    if (!opts.id || !opts.title || !opts.ctaLabel) return false;
    if (open) return false;
    if (seen(opts.id)) return false;
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', function () { show(opts); }, { once: true });
      return true;
    }
    if (!scrim) build();

    titleEl.textContent = opts.title;
    bodyEl.textContent = opts.body || '';
    ctaLabelEl.textContent = opts.ctaLabel;
    if (opts.ctaHref) ctaEl.setAttribute('href', opts.ctaHref);
    else ctaEl.setAttribute('href', '#');
    if (opts.image) {
      imgWrap.style.display = '';
      if (imgEl.getAttribute('src') !== opts.image) imgEl.setAttribute('src', opts.image);
    } else {
      imgWrap.style.display = 'none';
    }

    markSeen(opts.id);
    open = true;
    openId = opts.id;
    try { lastFocus = document.activeElement; } catch (e) { lastFocus = null; }
    document.body.style.overflow = 'hidden';
    clearTimeout(hideTimer);
    scrim.hidden = false;
    scrim.style.display = 'flex';
    sheet.classList.remove('nx-dragging');
    sheet.style.transform = '';
    scrim.style.opacity = '';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { scrim.classList.add('nx-open'); });
    });
    /* Focus the dialog itself on open (screen readers announce it);
       the CTA gets no ring until a keyboard user tabs to it. */
    try { sheet.focus({ preventScroll: true }); } catch (e) {}
    return true;
  }

  function hide() {
    if (!scrim || !open) return;
    open = false;
    openId = null;
    scrim.classList.remove('nx-open');
    sheet.classList.remove('nx-dragging');
    sheet.style.transform = '';
    scrim.style.opacity = '';
    document.body.style.overflow = '';
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      scrim.style.display = 'none';
      scrim.hidden = true;
    }, HIDE_MS);
    try { if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }

  window.CDNext = { show: show, hide: hide };
})();
