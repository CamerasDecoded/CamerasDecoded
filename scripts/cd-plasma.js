/* ============================================================
   CD PLASMA — shared engine
   The crackling plasma edge, approved on the owner's iPhone
   2026-10-16. Brand green only.

   Usage:
     CDPlasmaModal.open({ kicker, chipText, title, body, avatarSrc, footer })
     CDPlasmaModal.close()
     var edge = CDPlasmaEdge.attach(el);   // edge around any element
     edge.setActive(false);                // pause (edge goes quiet)
     edge.destroy();                       // remove (never leaks)

   Diagnostics hook: CDPlasmaModal.onDiag = fn  (harness only)
   ============================================================ */
(function () {
  'use strict';

  /* ---- Tunables (proven values from the approved demo) ----------- */
  var SPRING_K = 90;          // stiffness — higher = snappier
  var SPRING_C = 14;          // damping — lower = more overshoot (k=90,c=14: slight overshoot, soft settle)
  var MAX_RX = 14;            // degrees, rotateX
  var MAX_RY = 18;            // degrees, rotateY
  var SEAM_OFFSET = 19;       // px: seam sits this far outside the host border
  var PLASMA_MARGIN = 64;     // px: canvas oversize around the host. MUST exceed
                              // the seam's full outward glow extent (shadowBlur ~
                              // 16→~32px + lineWidth/2 3px + noise wander ~6px +
                              // spit flares ~40px on rare frames). Headroom =
                              // PLASMA_MARGIN - SEAM_OFFSET = 45px, so the
                              // glow always fades out inside the bitmap and the
                              // bitmap edge never becomes a visible cutoff.
  var DPR_CAP = 2;

  var GREEN = '#8deb00';
  var GREEN_PALE = '#dcffb5';

  var SVG_X =
    '<svg viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<line x1="2" y1="2" x2="12" y2="12"/>' +
    '<line x1="12" y1="2" x2="2" y2="12"/></svg>';

  /* ---- Plasma perimeter ---------------------------------------- */
  // Walks a rounded rect and returns N points with outward normals,
  // evenly spaced along the perimeter.
  function perimeterPoints(w, h, r, n) {
    var pts = [];
    var straight = 2 * (w - 2 * r) + 2 * (h - 2 * r);
    var arcs = 2 * Math.PI * r;
    var total = straight + arcs;
    for (var i = 0; i < n; i++) {
      var d = (i / n) * total;
      var x, y, nx, ny;
      if (d < w - 2 * r) {                       // top edge, left→right
        x = r + d; y = 0; nx = 0; ny = -1;
      } else if ((d -= w - 2 * r) < Math.PI / 2 * r) { // top-right arc
        var a = -Math.PI / 2 + d / r;
        x = w - r + r * Math.cos(a); y = r + r * Math.sin(a);
        nx = Math.cos(a); ny = Math.sin(a);
      } else if ((d -= Math.PI / 2 * r) < h - 2 * r) { // right edge, top→bottom
        x = w; y = r + d; nx = 1; ny = 0;
      } else if ((d -= h - 2 * r) < Math.PI / 2 * r) { // bottom-right arc
        var a2 = d / r;
        x = w - r + r * Math.cos(a2); y = h - r + r * Math.sin(a2);
        nx = Math.cos(a2); ny = Math.sin(a2);
      } else if ((d -= Math.PI / 2 * r) < w - 2 * r) { // bottom edge, right→left
        x = w - r - d; y = h; nx = 0; ny = 1;
      } else if ((d -= w - 2 * r) < Math.PI / 2 * r) { // bottom-left arc
        var a3 = Math.PI / 2 + d / r;
        x = r + r * Math.cos(a3); y = h - r + r * Math.sin(a3);
        nx = Math.cos(a3); ny = Math.sin(a3);
      } else if ((d -= Math.PI / 2 * r) < h - 2 * r) { // left edge, bottom→top
        x = 0; y = h - r - d; nx = -1; ny = 0;
      } else {                                        // top-left arc
        d -= h - 2 * r;
        var a4 = Math.PI + d / r;
        x = r + r * Math.cos(a4); y = r + r * Math.sin(a4);
        nx = Math.cos(a4); ny = Math.sin(a4);
      }
      pts.push({ x: x, y: y, nx: nx, ny: ny });
    }
    return pts;
  }

  // Shared renderer. `st` must carry: ctx, perim (points, canvas coords),
  // plasmaW, plasmaH, noise (Float32Array), spit, _scratch.
  function plasmaFrame(st, t) {
    var ctx = st.ctx, P = st.perim;
    if (!P) return;
    var W = st.plasmaW, H = st.plasmaH, n = P.length;
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    var ph1 = t * 1.7, ph2 = t * 2.9;
    var pts = st._scratch || (st._scratch = new Float32Array(n * 2));
    for (var i = 0; i < n; i++) {
      var s = i / n, p = P[i];
      // smoothed per-point flicker (organic, not aliased)
      st.noise[i] = st.noise[i] * 0.72 + (Math.random() - 0.5) * 0.56;
      var off =
        2.5 * Math.sin(6.2832 * 3 * s + ph1 + p.x * 0.004) +
        1.5 * Math.sin(6.2832 * 7 * s - ph2 + p.y * 0.006) +
        st.noise[i] * 2.0;
      pts[i * 2]     = p.x + p.nx * off;
      pts[i * 2 + 1] = p.y + p.ny * off;
    }

    // Glow pass
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (var j = 2; j < n * 2; j += 2) ctx.lineTo(pts[j], pts[j + 1]);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(141,235,0,0.20)';
    ctx.lineWidth = 6;
    ctx.shadowColor = GREEN;
    ctx.shadowBlur = 16;
    ctx.stroke();

    // Core pass
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (var k = 2; k < n * 2; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(220,255,181,0.90)';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = GREEN_PALE;
    ctx.shadowBlur = 6;
    ctx.stroke();

    // Occasional restrained "spit" — a short segment flares for a few frames
    if (st.spit && st.spit.frames > 0) {
      var sp = st.spit, i0 = Math.floor(sp.s0 * n), len = Math.floor(sp.len * n);
      ctx.beginPath();
      ctx.moveTo(pts[i0 * 2], pts[i0 * 2 + 1]);
      for (var m = 1; m <= len; m++) {
        var ii = (i0 + m) % n;
        ctx.lineTo(pts[ii * 2], pts[ii * 2 + 1]);
      }
      ctx.strokeStyle = 'rgba(220,255,181,0.95)';
      ctx.lineWidth = 2.6;
      ctx.shadowColor = GREEN_PALE;
      ctx.shadowBlur = 20;
      ctx.stroke();
      sp.frames--;
      if (sp.frames <= 0) st.spit = null;
    } else if (Math.random() < 0.006) {
      st.spit = { s0: Math.random(), len: 0.05 + Math.random() * 0.06, frames: 4 + Math.floor(Math.random() * 6) };
    }
    ctx.shadowBlur = 0;
  }

  function reducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ============================================================
     CDPlasmaEdge — the plasma edge around any element.
     Returns { setActive(bool), destroy() }.
     Perf: animates ONLY while on screen (IntersectionObserver),
     pauses when the tab hides, DPR capped at 2, reduced motion →
     one static frame. Canvas resizes with the host (ResizeObserver).
     ============================================================ */
  function borderRadiusOf(el) {
    var cs = window.getComputedStyle(el);
    var r = parseFloat(cs.borderTopLeftRadius) || 0;
    return r;
  }

  function sizeEdge(st) {
    var el = st.el, canvas = st.canvas;
    var w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    if (!w || !h) return;
    // Keep the canvas CSS box in lockstep with PLASMA_MARGIN so CSS
    // and JS can never desync (matches .cdp-edge-canvas intent).
    canvas.style.inset = (-PLASMA_MARGIN) + 'px';
    canvas.style.width = (w + PLASMA_MARGIN * 2) + 'px';
    canvas.style.height = (h + PLASMA_MARGIN * 2) + 'px';
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    var cw = w + PLASMA_MARGIN * 2, ch = h + PLASMA_MARGIN * 2;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    st.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    st.plasmaW = cw; st.plasmaH = ch;
    // Seam path: rounded rect SEAM_OFFSET outside the host border,
    // centered in the canvas so the glow has
    // PLASMA_MARGIN - SEAM_OFFSET headroom on every side.
    var pathW = w + SEAM_OFFSET * 2, pathH = h + SEAM_OFFSET * 2;
    var r = Math.min(borderRadiusOf(el) + SEAM_OFFSET, w / 2, h / 2);
    st.perim = perimeterPoints(pathW, pathH, r, 240);
    var off = PLASMA_MARGIN - SEAM_OFFSET;
    for (var i = 0; i < st.perim.length; i++) {
      st.perim[i].x += off;
      st.perim[i].y += off;
    }
    st.noise = new Float32Array(240);
  }

  function attachEdge(el) {
    if (!el) return null;
    var prevPos = el.style.position;
    if (window.getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }
    var canvas = document.createElement('canvas');
    canvas.className = 'cdp-edge-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);
    var st = {
      el: el, canvas: canvas, ctx: canvas.getContext('2d'),
      active: true, raf: 0, perim: null, noise: null,
      spit: null, _scratch: null, reduced: !!reducedMotion(),
      io: null, ro: null, visHandler: null
    };
    sizeEdge(st);

    function frame(now) {
      if (!st.active) { st.raf = 0; return; }
      plasmaFrame(st, now / 1000);
      st.raf = requestAnimationFrame(frame);
    }
    function start() {
      if (!st.active) return;
      if (st.reduced) { plasmaFrame(st, 0); return; } // one static frame
      if (st.raf) return;
      st.raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (st.raf) { cancelAnimationFrame(st.raf); st.raf = 0; }
    }

    if ('IntersectionObserver' in window) {
      st.io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
      }, { threshold: 0 });
      st.io.observe(el);
    } else {
      start();
    }
    st.visHandler = function () {
      if (document.hidden) stop(); else start();
    };
    document.addEventListener('visibilitychange', st.visHandler);
    if ('ResizeObserver' in window) {
      st.ro = new ResizeObserver(function () {
        sizeEdge(st);
        if (st.reduced && st.active) plasmaFrame(st, 0);
      });
      st.ro.observe(el);
    }

    return {
      setActive: function (b) {
        b = !!b;
        if (b === st.active) return;
        st.active = b;
        canvas.style.display = b ? '' : 'none';
        if (b) start(); else stop();
      },
      destroy: function () {
        st.active = false;
        stop();
        if (st.io) st.io.disconnect();
        if (st.ro) st.ro.disconnect();
        if (st.visHandler) document.removeEventListener('visibilitychange', st.visHandler);
        el.style.position = prevPos;
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }

  window.CDPlasmaEdge = { attach: attachEdge };

  /* ============================================================
     CDPlasmaModal — the tilt + plasma modal card (unchanged from
     the approved demo; now shares the renderer above).
     ============================================================ */
  var TEMPLATE =
    '<div class="cdp-root" role="dialog" aria-modal="true" aria-label="Cynetis transmission">' +
      '<div class="cdp-backdrop" data-cdp-close></div>' +
      '<div class="cdp-stage">' +
        '<div class="cdp-halo"></div>' +
        '<div class="cdp-tilt">' +
          '<div class="cdp-card">' +
            '<canvas class="cdp-plasma" aria-hidden="true"></canvas>' +
            '<div class="cdp-sheen" aria-hidden="true"></div>' +
            '<div class="cdp-content">' +
              '<div class="cdp-toprow"><span class="cdp-kicker"></span><span class="cdp-chip"></span></div>' +
              '<div class="cdp-herorow"><img class="cdp-avatar" alt="Cynetis-7"/><h2 class="cdp-title"></h2></div>' +
              '<p class="cdp-body"></p>' +
              '<div class="cdp-footer"></div>' +
            '</div>' +
            '<button class="cdp-close" data-cdp-close aria-label="Close">' + SVG_X + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var modalState = null;

  function diag(payload) {
    if (typeof window.CDPlasmaModal !== 'undefined' &&
        typeof window.CDPlasmaModal.onDiag === 'function') {
      try { window.CDPlasmaModal.onDiag(payload); } catch (e) {}
    }
  }

  function sizeModalCanvas(st) {
    var card = st.cardEl;
    var w = Math.round(card.offsetWidth), h = Math.round(card.offsetHeight);
    if (!w || !h) return;
    st.canvas.style.inset = (-PLASMA_MARGIN) + 'px';
    st.canvas.style.width = (w + PLASMA_MARGIN * 2) + 'px';
    st.canvas.style.height = (h + PLASMA_MARGIN * 2) + 'px';
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    var cw = w + PLASMA_MARGIN * 2, ch = h + PLASMA_MARGIN * 2;
    st.canvas.width = Math.round(cw * dpr);
    st.canvas.height = Math.round(ch * dpr);
    st.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    st.plasmaW = cw; st.plasmaH = ch;
    var pathW = w + SEAM_OFFSET * 2, pathH = h + SEAM_OFFSET * 2;
    var r = 22 + SEAM_OFFSET + 3; // modal card radius + offset + a hair outside the border
    r = Math.min(r, w / 2, h / 2);
    st.perim = perimeterPoints(pathW, pathH, r, 240);
    var off = PLASMA_MARGIN - SEAM_OFFSET;
    for (var i = 0; i < st.perim.length; i++) {
      st.perim[i].x += off;
      st.perim[i].y += off;
    }
    st.noise = new Float32Array(240);
  }

  /* ---- Main loop: spring + plasma + halo + fps ----------------- */
  function loop(now) {
    var st = modalState;
    if (!st) return;
    var dt = Math.min(0.05, (now - st.last) / 1000 || 0.016);
    st.last = now;

    // Velocity spring → targets (underdamped: slight overshoot, soft settle)
    var ax = (st.trx - st.rx) * SPRING_K - st.vrx * SPRING_C;
    var ay = (st.try - st.ry) * SPRING_K - st.vry * SPRING_C;
    st.vrx += ax * dt; st.rx += st.vrx * dt;
    st.vry += ay * dt; st.ry += st.vry * dt;
    st.tiltEl.style.transform =
      'rotateX(' + st.rx.toFixed(3) + 'deg) rotateY(' + st.ry.toFixed(3) + 'deg)';
    st.sheenEl.style.transform =
      'translate(' + (-st.ry * 1.6).toFixed(2) + 'px,' + (-st.rx * 1.6).toFixed(2) + 'px)';

    var t = now / 1000;
    plasmaFrame(st, t);

    // Halo breathing on the same clock
    var b = Math.sin(t * 0.9);
    st.haloEl.style.opacity = (0.3 + 0.1 * b).toFixed(3);
    st.haloEl.style.transform = 'scale(' + (1 + 0.02 * Math.sin(t * 0.9 + 1)).toFixed(4) + ')';

    // FPS (EMA) + diagnostics @ ~2Hz
    var fdt = (now - st.fpsLast) / 1000;
    if (fdt > 0) st.fps = st.fps * 0.9 + (1 / fdt) * 0.1;
    st.fpsLast = now;
    if (now - st.diagLast > 500) {
      st.diagLast = now;
      diag({ input: st.gyroActive ? 'gyro' : (st.pointerSeen ? 'pointer' : 'none'),
             fps: Math.round(st.fps), permission: st.permission, reducedMotion: st.reduced });
    }
    st.raf = requestAnimationFrame(loop);
  }

  /* ---- Inputs --------------------------------------------------- */
  function onPointerMove(st, ev) {
    if (st.gyroActive) return; // gyro owns the tilt when alive
    var r = st.stageEl.getBoundingClientRect();
    var nx = ((ev.clientX - r.left) - r.width / 2) / (r.width / 2);
    var ny = ((ev.clientY - r.top) - r.height / 2) / (r.height / 2);
    nx = Math.max(-1, Math.min(1, nx));
    ny = Math.max(-1, Math.min(1, ny));
    st.try = nx * MAX_RY;
    st.trx = -ny * MAX_RX;
    st.pointerSeen = true;
  }

  function onDeviceOrientation(st, ev) {
    if (ev.beta == null || ev.gamma == null) return;
    if (!st.calibrated) {
      st.beta0 = ev.beta; st.gamma0 = ev.gamma;
      st.calibrated = true;
    }
    var db = (ev.beta - st.beta0) / 35;
    var dg = (ev.gamma - st.gamma0) / 35;
    st.trx = Math.max(-1, Math.min(1, db)) * MAX_RX;
    st.try = Math.max(-1, Math.min(1, dg)) * MAX_RY;
    st.gyroActive = true;
    st.gyroLast = performance.now();
  }

  /* ---- Open / Close -------------------------------------------- */
  function open(opts) {
    opts = opts || {};
    close(true); // never stack two
    var isReduced = reducedMotion();

    var wrap = document.createElement('div');
    wrap.innerHTML = TEMPLATE;
    var root = wrap.firstChild;
    var q = function (sel) { return root.querySelector(sel); };
    var st = {
      root: root,
      stageEl: q('.cdp-stage'),
      tiltEl: q('.cdp-tilt'),
      cardEl: q('.cdp-card'),
      haloEl: q('.cdp-halo'),
      sheenEl: q('.cdp-sheen'),
      canvas: q('.cdp-plasma'),
      ctx: q('.cdp-plasma').getContext('2d'),
      rx: 0, ry: 0, vrx: 0, vry: 0, trx: 0, try: 0,
      gyroActive: false, calibrated: false, beta0: 0, gamma0: 0,
      pointerSeen: false, permission: 'unchecked',
      fps: 60, fpsLast: performance.now(), diagLast: 0,
      reduced: !!isReduced, raf: 0, last: performance.now(),
      spit: null, perim: null, noise: null
    };

    q('.cdp-kicker').textContent = opts.kicker || '';
    q('.cdp-chip').textContent = opts.chipText || '';
    q('.cdp-title').textContent = opts.title || '';
    q('.cdp-body').textContent = opts.body || '';
    q('.cdp-footer').textContent = opts.footer || '';
    var img = q('.cdp-avatar');
    img.src = opts.avatarSrc || '';
    img.onerror = function () {
      img.onerror = null;
      img.src = 'https://camerasdecoded.com/images/cynetis-7-the-entity.png';
    };

    // Dismiss
    var onKey = function (ev) { if (ev.key === 'Escape') close(); };
    var onTap = function (ev) {
      if (ev.target.closest('[data-cdp-close]')) close();
    };
    document.addEventListener('keydown', onKey);
    root.addEventListener('click', onTap);

    // Tilt inputs (skipped entirely under reduced motion)
    var onPM = function (ev) { onPointerMove(st, ev); };
    var onDO = function (ev) { onDeviceOrientation(st, ev); };
    var gyroWatch = 0;
    if (!isReduced) {
      root.addEventListener('pointermove', onPM);
      window.addEventListener('resize', st._onResize = function () { sizeModalCanvas(st); });
      var DOE = window.DeviceOrientationEvent;
      if (typeof DOE !== 'undefined' && typeof DOE.requestPermission === 'function') {
        // iOS: must be called inside the user gesture — open() is called from the tap.
        try {
          DOE.requestPermission().then(function (res) {
            st.permission = res === 'granted' ? 'granted' : 'denied';
            if (res === 'granted') window.addEventListener('deviceorientation', onDO);
          }).catch(function () { st.permission = 'denied'; });
        } catch (e) { st.permission = 'denied'; }
      } else if (typeof DOE !== 'undefined' || 'ondeviceorientation' in window) {
        st.permission = 'available';
        window.addEventListener('deviceorientation', onDO);
      } else {
        st.permission = 'unavailable';
      }
      // Gyro watchdog: if the sensor goes quiet, fall back to pointer/drag.
      gyroWatch = setInterval(function () {
        if (st.gyroActive && performance.now() - st.gyroLast > 2500) st.gyroActive = false;
      }, 1000);
    }

    // Hidden-tab: pause the loop
    var onVis = function () {
      if (document.hidden) { if (st.raf) cancelAnimationFrame(st.raf), st.raf = 0; }
      else if (modalState === st && !isReduced && !st.raf) {
        st.last = performance.now(); st.fpsLast = st.last;
        st.raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';
    // Force layout so the enter transition runs
    void root.offsetWidth;
    root.classList.add('cdp-open');

    sizeModalCanvas(st);
    modalState = st;
    st._teardown = function () {
      document.removeEventListener('keydown', onKey);
      root.removeEventListener('pointermove', onPM);
      window.removeEventListener('deviceorientation', onDO);
      if (st._onResize) window.removeEventListener('resize', st._onResize);
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(gyroWatch);
      if (st.raf) cancelAnimationFrame(st.raf);
      if (root.parentNode) root.parentNode.removeChild(root);
      if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
    };

    if (isReduced) {
      plasmaFrame(st, 0); // one static frame, no tilt, no breathing
      diag({ input: 'none', fps: 0, permission: 'n/a', reducedMotion: true });
    } else {
      st.raf = requestAnimationFrame(loop);
    }
    return st;
  }

  function close(silent) {
    var st = modalState;
    modalState = null;
    if (!st) return;
    var done = function () { st._teardown(); };
    if (silent) { done(); return; }
    st.root.classList.remove('cdp-open');
    setTimeout(done, 300);
  }

  window.CDPlasmaModal = {
    open: open,
    close: close,
    onDiag: null
  };
})();
