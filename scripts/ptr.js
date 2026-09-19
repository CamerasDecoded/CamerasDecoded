/* Cameras Decoded — pull-to-refresh (drop-in).
   Add at the bottom of every page as pages are updated:
     <script src="/scripts/ptr.js"></script>
   NOT on game pages (play.html, /games/*). YES on the arcade hub (arcade.html).
   Self-contained: injects its own CSS, runs only on touch + narrow screens. */
(function () {
  if (window.__cdPtrLoaded) return;
  window.__cdPtrLoaded = true;

  var CSS =
    '.ptr-wrap{position:fixed;top:0;left:50%;z-index:150;width:64px;height:64px;margin-top:16px;' +
    'transform:translate(-50%,-120px);opacity:0;pointer-events:none;will-change:transform,opacity;transition:opacity .18s ease}' +
    '.ptr-wrap.visible{opacity:1}' +
    '.ptr-sphere{width:100%;height:100%;border-radius:50%;' +
    "background:url('/images/cynetis-7-the-entity.png') center/contain no-repeat;" +
    'filter:drop-shadow(0 0 10px rgba(141,235,0,.35));will-change:transform;transition:filter .2s ease}' +
    '.ptr-wrap.ready .ptr-sphere{filter:drop-shadow(0 0 22px rgba(141,235,0,.75));animation:ptrPulse 1.4s ease-in-out infinite}' +
    '.ptr-wrap.refreshing .ptr-sphere{animation:ptrSpin 1.1s linear infinite}' +
    '@keyframes ptrPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}' +
    '@keyframes ptrSpin{to{transform:rotate(360deg)}}' +
    '.ptr-label{position:absolute;left:50%;bottom:-16px;transform:translateX(-50%);' +
    'font:700 9px "Space Mono",ui-monospace,monospace;color:#8deb00;letter-spacing:.16em;' +
    'text-transform:uppercase;white-space:nowrap;opacity:0;transition:opacity .2s ease}' +
    '.ptr-wrap.ready .ptr-label{opacity:1}' +
    '@media (min-width:821px){.ptr-wrap{display:none}}' +
    '@media (prefers-reduced-motion:reduce){.ptr-wrap.ready .ptr-sphere,.ptr-wrap.refreshing .ptr-sphere{animation:none}}';

  var style = document.createElement('style');
  style.setAttribute('data-cd-ptr', '');
  style.textContent = CSS;
  document.head.appendChild(style);

  (function pullToRefresh() {
    var isTouch  = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    var isNarrow = window.matchMedia('(max-width:820px)').matches;

    if (!isTouch || !isNarrow) return;

    var wrap = document.createElement('div');
    wrap.className = 'ptr-wrap';
    wrap.innerHTML = '<div class="ptr-sphere"></div><div class="ptr-label">Refreshing</div>';
    document.body.appendChild(wrap);

    var sphere = wrap.querySelector('.ptr-sphere');

    var BASE_Y    = -120;
    var THRESHOLD = 100;
    var MAX_PULL  = 130;

    var startY     = 0;
    var pull       = 0;
    var dragging   = false;
    var refreshing = false;

    function setPos(y)         { wrap.style.transform = 'translate(-50%, ' + y + 'px)'; }
    function setSphere(deg, s) { sphere.style.transform = 'rotate(' + deg + 'deg) scale(' + s + ')'; }

    function getScrollY() {
      return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }

    window.addEventListener('touchstart', function (e) {
      if (refreshing) return;
      if (e.touches.length !== 1) return;
      if (getScrollY() > 0) return;
      startY = e.touches[0].clientY;
      dragging = true;
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (!dragging || refreshing) return;
      if (getScrollY() > 0) { dragging = false; return; }

      var delta = e.touches[0].clientY - startY;
      if (delta <= 0) { pull = 0; return; }

      pull = Math.min(delta * 0.55, MAX_PULL);

      wrap.classList.add('visible');
      setPos(BASE_Y + pull);

      var t = Math.min(pull / MAX_PULL, 1);
      setSphere(pull * 2.4, 0.85 + t * 0.15);
      wrap.classList.toggle('ready', pull >= THRESHOLD);
    }, { passive: true });

    window.addEventListener('touchend', function () {
      if (!dragging || refreshing) return;
      dragging = false;

      if (pull >= THRESHOLD) {
        refreshing = true;
        wrap.classList.add('refreshing');
        setPos(24);
        if (navigator.vibrate) navigator.vibrate(12);
        setTimeout(function () { window.location.reload(); }, 650);
      } else {
        wrap.classList.remove('visible', 'ready');
        setPos(BASE_Y);
        setSphere(0, 1);
      }
      pull = 0;
    }, { passive: true });

    window.addEventListener('touchcancel', function () {
      dragging = false;
      pull = 0;
      wrap.classList.remove('visible', 'ready');
      setPos(BASE_Y);
      setSphere(0, 1);
    }, { passive: true });
  })();
})();
