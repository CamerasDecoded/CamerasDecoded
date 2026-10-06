/* ============================================================================
 * CDLoading — shared Cynetis-7 loading screen (Signal Sync concept)
 *
 * A full-screen overlay featuring the Cynetis-7 character rig:
 *   - Body layer breathes (slow float, 4.2s)
 *   - Eyes layer blinks independently (5s cycle, CSS overlay until the
 *     individual Canva part exports arrive)
 *   - Glow layer pulses out of sync with the body (2.4s)
 *   - Dual expanding rings, progress bar, Space Mono percent counter
 *
 * Character rig layers are drop-in ready: when the individual Cynetis-7
 * parts are exported from Canva, swap each layer's background-image —
 * no layout or animation changes needed. Expected:
 *   cynetis-7-body.png, cynetis-7-eye.png, cynetis-7-glow.png, cynetis-7-core.png
 *
 * API:
 *   CDLoading.show({ text: 'LOADING GAME' })  — show the overlay
 *   CDLoading.hide()                          — fade out and remove
 *   CDLoading.setProgress(p)                  — p in 0..1, updates bar + pct
 *   CDLoading.showError(msg)                  — error state (keeps overlay up)
 *
 * Follows the animation-generator skill: transform + opacity only,
 * prefers-reduced-motion fallback, no emojis, no chase border.
 * ========================================================================== */
(function () {
  'use strict';

  var NS = 'cd-loading';
  var cssInjected = false;
  var overlay = null;
  var els = {};
  var progressRaf = 0;
  var progressStart = 0;
  var progressDur = 3000;
  var progressDone = false;

  var EASE_OUT = 'cubic-bezier(0.16,1,0.3,1)';
  var EASE_IN_OUT = 'cubic-bezier(0.65,0,0.35,1)';

  function injectCss() {
    if (cssInjected) return;
    cssInjected = true;
    var css =
      '.' + NS + '{position:fixed;inset:0;z-index:10001;background:#08080a;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'gap:0;overflow:hidden;opacity:0;pointer-events:none;' +
      'transition:opacity .45s ease;}' +
      '.' + NS + '.on{opacity:1;pointer-events:auto;}' +

      /* dot-grid texture (site background pattern) */
      '.' + NS + '::before{content:"";position:absolute;inset:0;pointer-events:none;' +
      'background-image:radial-gradient(rgba(141,235,0,.07) 1px,transparent 1px);' +
      'background-size:22px 22px;}' +

      /* vignette */
      '.' + NS + '::after{content:"";position:absolute;inset:0;pointer-events:none;' +
      'background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.55) 100%);}' +

      /* character rig container */
      '.' + NS + '-avatar{position:relative;width:150px;height:150px;z-index:1;}' +
      '.' + NS + '-ring{position:absolute;inset:0;border-radius:50%;' +
      'border:2px solid #8deb00;z-index:1;}' +
      '.' + NS + '-ring.r1{animation:' + NS + '-ringpulse 2.4s ' + EASE_IN_OUT + ' infinite;}' +
      '.' + NS + '-ring.r2{animation:' + NS + '-ringpulse 2.4s ' + EASE_IN_OUT + ' 1.2s infinite;}' +
      '@keyframes ' + NS + '-ringpulse{' +
      '0%{transform:scale(1);opacity:.7}100%{transform:scale(1.9);opacity:0}}' +

      /* rig: layers stack, transparent PNGs composite like a real rig */
      '.' + NS + '-rig{position:relative;width:150px;height:150px;z-index:2;}' +
      '.' + NS + '-layer{position:absolute;inset:0;background-size:contain;' +
      'background-repeat:no-repeat;background-position:center;}' +

      /* LAYER 1 — body: slow breathing float.
         DROP-IN: cynetis-7-body.png (currently: cynetis-avatar.png).
         The hue-rotate shifts the artwork's red/orange palette into the
         site's neon-green range. Remove the filter when true green
         Canva part exports arrive. */
      '.' + NS + '-body{z-index:1;border-radius:50%;' +
      'background-image:url("/cynetis-avatar.png");' +
      'filter:hue-rotate(105deg) saturate(1.3);' +
      'animation:' + NS + '-breathe 4.2s ' + EASE_IN_OUT + ' infinite;}' +
      '@keyframes ' + NS + '-breathe{' +
      '0%,100%{transform:translateY(0) scale(1)}' +
      '50%{transform:translateY(-6px) scale(1.02)}}' +

      /* LAYER 2 — eyes: independent blink.
         DROP-IN: cynetis-7-eye.png (transparent, eyes only).
         Until exported: CSS blink overlay simulates the eye motion. */
      '.' + NS + '-eyes{z-index:2;pointer-events:none;}' +
      '.' + NS + '-eyes::after{content:"";position:absolute;left:33%;right:33%;top:39%;' +
      'height:13%;background:#08080a;border-radius:50%;' +
      'transform:scaleY(0);transform-origin:center;' +
      'animation:' + NS + '-blink 5s ease-in-out infinite;}' +
      '@keyframes ' + NS + '-blink{' +
      '0%,92%,100%{transform:scaleY(0)}95%{transform:scaleY(1)}}' +

      /* LAYER 3 — glow: pulses independently, out of sync with body.
         DROP-IN: cynetis-7-glow.png (transparent additive glow). */
      '.' + NS + '-glow{z-index:3;pointer-events:none;mix-blend-mode:screen;' +
      'background:radial-gradient(circle at 50% 45%,rgba(141,235,0,.32),transparent 62%);' +
      'animation:' + NS + '-glow 2.4s ' + EASE_IN_OUT + ' infinite;}' +
      '@keyframes ' + NS + '-glow{' +
      '0%,100%{opacity:.35;transform:scale(.96)}' +
      '50%{opacity:.7;transform:scale(1.05)}}' +

      /* LAYER 4 — core: reserved slot, hidden until the asset exists.
         DROP-IN: cynetis-7-core.png (center emblem/detail). */
      '.' + NS + '-core{display:none;}' +

      /* loading text with animated dots */
      '.' + NS + '-text{font-family:"Space Mono",ui-monospace,monospace;' +
      'font-size:14px;letter-spacing:.18em;color:rgba(255,255,255,.85);' +
      'margin-top:26px;text-align:center;z-index:1;position:relative;}' +
      '.' + NS + '-dots{display:inline-block;min-width:28px;text-align:left;}' +
      '.' + NS + '-dots::after{content:"";animation:' + NS + '-dots 1.2s steps(4) infinite;}' +
      '@keyframes ' + NS + '-dots{' +
      '0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}' +

      /* percent counter */
      '.' + NS + '-pct{font-family:"Space Mono",ui-monospace,monospace;' +
      'font-size:11px;color:#8deb00;letter-spacing:.2em;margin-top:14px;' +
      'font-variant-numeric:tabular-nums;z-index:1;position:relative;}' +

      /* progress bar (transform scaleX, never width) */
      '.' + NS + '-barwrap{width:min(280px,70vw);height:4px;' +
      'background:rgba(255,255,255,.1);border-radius:2px;' +
      'margin-top:20px;overflow:hidden;position:relative;z-index:1;}' +
      '.' + NS + '-barfill{height:100%;width:100%;background:#8deb00;border-radius:2px;' +
      'transform:scaleX(0);transform-origin:left;}' +

      /* error state */
      '.' + NS + '-err{max-width:420px;text-align:center;' +
      'font-family:"Space Mono",ui-monospace,monospace;font-size:12px;' +
      'color:rgba(255,255,255,.55);line-height:1.8;padding:0 24px;margin-top:20px;' +
      'z-index:1;position:relative;}' +
      '.' + NS + '-err b{color:#ff5d5d;}' +

      /* reduced motion: collapse everything to instant states */
      '@media (prefers-reduced-motion: reduce){' +
      '.' + NS + '-ring,.' + NS + '-body,.' + NS + '-eyes::after,.' + NS + '-glow,' +
      '.' + NS + '-dots::after{animation:none !important;}' +
      '.' + NS + '{transition:none;}' +
      '}';

    var style = document.createElement('style');
    style.setAttribute('data-cd-loading', '1');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildOverlay() {
    injectCss();
    var div = document.createElement('div');
    div.className = NS;
    div.setAttribute('role', 'status');
    div.setAttribute('aria-label', 'Loading');
    div.innerHTML =
      '<div class="' + NS + '-avatar">' +
        '<div class="' + NS + '-ring r1"></div>' +
        '<div class="' + NS + '-ring r2"></div>' +
        '<div class="' + NS + '-rig" role="img" aria-label="Cynetis-7">' +
          '<div class="' + NS + '-layer ' + NS + '-body"></div>' +
          '<div class="' + NS + '-layer ' + NS + '-eyes"></div>' +
          '<div class="' + NS + '-layer ' + NS + '-glow"></div>' +
          '<div class="' + NS + '-layer ' + NS + '-core"></div>' +
        '</div>' +
      '</div>' +
      '<div class="' + NS + '-text"><span class="' + NS + '-label"></span><span class="' + NS + '-dots"></span></div>' +
      '<div class="' + NS + '-pct">0%</div>' +
      '<div class="' + NS + '-barwrap"><div class="' + NS + '-barfill"></div></div>' +
      '<div class="' + NS + '-err" hidden></div>';

    els = {
      label: div.querySelector('.' + NS + '-label'),
      pct: div.querySelector('.' + NS + '-pct'),
      bar: div.querySelector('.' + NS + '-barfill'),
      err: div.querySelector('.' + NS + '-err'),
      dots: div.querySelector('.' + NS + '-dots')
    };
    return div;
  }

  function tickProgress() {
    if (!overlay || progressDone) return;
    var p = Math.min(1, (Date.now() - progressStart) / progressDur);
    // ease to match the visual fill: fast start, slow landing
    var e = p < 0.7 ? (p / 0.7) * 0.82 : 0.82 + ((p - 0.7) / 0.3) * 0.18;
    els.bar.style.transform = 'scaleX(' + e.toFixed(3) + ')';
    els.pct.textContent = Math.round(e * 100) + '%';
    if (p < 1) {
      progressRaf = requestAnimationFrame(tickProgress);
    } else {
      els.pct.textContent = '100%';
    }
  }

  function resetProgress() {
    cancelAnimationFrame(progressRaf);
    progressDone = false;
    progressStart = Date.now();
    // estimate: most game loads finish in ~3s; the bar eases to 82% at 70%
    // so it never sits at 100% while still loading
    progressDur = 6000;
    els.bar.style.transform = 'scaleX(0)';
    els.pct.textContent = '0%';
    tickProgress();
  }

  window.CDLoading = {
    show: function (opts) {
      opts = opts || {};
      if (!overlay) {
        overlay = buildOverlay();
        document.body.appendChild(overlay);
      }
      els.label.textContent = opts.text || 'LOADING';
      els.err.hidden = true;
      els.err.innerHTML = '';
      // force reflow so the fade-in transition triggers
      void overlay.offsetWidth;
      overlay.classList.add('on');
      resetProgress();
      return overlay;
    },

    hide: function () {
      if (!overlay) return;
      cancelAnimationFrame(progressRaf);
      progressDone = true;
      overlay.classList.remove('on');
      // remove from DOM after fade completes
      var el = overlay;
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        if (overlay === el) { overlay = null; els = {}; }
      }, 500);
    },

    setProgress: function (p) {
      if (!overlay || !els.bar) return;
      p = Math.max(0, Math.min(1, p));
      cancelAnimationFrame(progressRaf);
      progressDone = p >= 1;
      els.bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
      els.pct.textContent = Math.round(p * 100) + '%';
    },

    showError: function (msg) {
      if (!overlay) this.show({ text: 'LOADING' });
      cancelAnimationFrame(progressRaf);
      progressDone = true;
      els.err.hidden = false;
      els.err.innerHTML = '<b>Could not start this game.</b><br>' + msg;
    }
  };
})();
