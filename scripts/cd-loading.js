/* ============================================================================
 * CDLoading — Cynetis-7 character system loading screen
 *
 * Full-screen overlay featuring the real Cynetis-7 PNG layers:
 *   - 7 transparent layers (bg, aura, globe, cube, crystal, eye, particles)
 *   - Animated gradient background (on-brand dark greens)
 *   - Curious eye expressions, blinks, tilts, impatience when loading drags
 *   - "ESTABLISHING UPLINK" -> progress -> "SIGNAL LOCKED" excitement
 *   - Cameras Decoded logo watermark
 *
 * API:
 *   CDLoading.show({ text: 'LOADING GAME' })  — show the overlay
 *   CDLoading.hide()                          — signal-lock excitement, then fade
 *   CDLoading.setProgress(p)                  — p in 0..1, updates bar + pct
 *   CDLoading.showError(msg)                  — error state (keeps overlay up)
 *
 * Uses only the user's real transparent PNGs (media/cynetis-7/). Never
 * AI-generated. Transform + opacity only, prefers-reduced-motion fallback,
 * no emojis. All classes namespaced cdl- to avoid page conflicts.
 * ========================================================================== */
(function () {
  'use strict';

  var IMG_V = '20261006c';
  var IMG = {
    bg: '/media/cynetis-7/c7-bg.png?v=' + IMG_V,
    aura: '/media/cynetis-7/c7-aura.png?v=' + IMG_V,
    globe: '/media/cynetis-7/c7-globe.png?v=' + IMG_V,
    cube: '/media/cynetis-7/c7-cube.png?v=' + IMG_V,
    crystal: '/media/cynetis-7/c7-crystal.png?v=' + IMG_V,
    eye: '/media/cynetis-7/c7-eye.png?v=' + IMG_V,
    dots: '/media/cynetis-7/c7-particles.png?v=' + IMG_V,
    logo: '/cameras-decoded-transparent-logo.png?v=' + IMG_V
  };

  var cssInjected = false;
  var overlay = null;
  var els = {};
  var timers = [];
  var waapiAnims = [];
  var RM = false;
  var isShowing = false;
  var eyeBase = 'translateX(0) scale(1,1)';

  var EYE_BASE = {
    'eye-alert': 'translateX(0) scale(1.08,1.03)',
    'eye-curious': 'translateX(0) scale(1.06,1.04)',
    'eye-impatient': 'translateX(-6px) scale(1.08,1.02)',
    'locked': 'translateX(0) scale(1.06,1)',
    'default': 'translateX(0) scale(1,1)'
  };

  /* ================= CSS ================= */

  function injectCss() {
    if (cssInjected) return;
    cssInjected = true;
    RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var css =
      '.cdl-overlay{position:fixed;inset:0;z-index:10001;background:#07090a;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'gap:18px;overflow:hidden;opacity:0;pointer-events:none;' +
      'transition:opacity .45s ease;font-family:"Space Mono",ui-monospace,monospace;}' +
      '.cdl-overlay.on{opacity:1;pointer-events:auto;}' +

      /* Animated gradient background — deep dark, green-teal glow */
      '.cdl-bg{position:absolute;inset:0;overflow:hidden;}' +
      '.cdl-bgl{position:absolute;inset:-25%;will-change:transform,opacity;}' +
      '.cdl-bgl-1{background:radial-gradient(ellipse 55% 42% at 50% 42%,rgba(22,92,80,.30),rgba(22,92,80,0) 70%);' +
      'animation:cdlDriftA 26s ease-in-out infinite alternate;}' +
      '.cdl-bgl-2{background:radial-gradient(ellipse 75% 55% at 50% 108%,rgba(12,66,52,.26),rgba(12,66,52,0) 70%);' +
      'animation:cdlDriftB 34s ease-in-out infinite alternate;animation-delay:-11s;}' +
      '.cdl-bgl-3{background:radial-gradient(ellipse 45% 32% at 86% 12%,rgba(30,105,90,.15),rgba(30,105,90,0) 70%);' +
      'animation:cdlDriftC 41s ease-in-out infinite alternate;animation-delay:-23s;}' +
      '@keyframes cdlDriftA{0%{transform:translate(-3%,-2%) scale(1);opacity:.85;}' +
      '50%{opacity:1;}100%{transform:translate(3%,2.5%) scale(1.07);opacity:.9;}}' +
      '@keyframes cdlDriftB{0%{transform:translate(2.5%,3%) scale(1.05);opacity:.9;}' +
      '50%{opacity:.78;}100%{transform:translate(-2.5%,-3%) scale(1);opacity:.95;}}' +
      '@keyframes cdlDriftC{0%{transform:translate(0,-3%) scale(1.02);opacity:.8;}' +
      '50%{opacity:1;}100%{transform:translate(-2%,3%) scale(1.08);opacity:.85;}}' +

      /* Dark halo behind her — stage lighting so she pops */
      '.cdl-halo{position:absolute;inset:-10%;pointer-events:none;' +
      'background:radial-gradient(ellipse at center,rgba(0,0,0,.55) 0%,transparent 55%);}' +

      /* Rig positioning */
      '.cdl-rigpos{position:relative;width:min(78vw,340px);aspect-ratio:1;' +
      'transform:translateY(-2%) scale(1.05);}' +
      '.cdl-rigtilt{position:absolute;inset:0;}' +
      '.cdl-rigwrap{position:relative;width:100%;height:100%;' +
      'animation:cdlRigDrift 7.3s cubic-bezier(0.65,0,0.35,1) infinite;}' +
      '@keyframes cdlRigDrift{0%,100%{transform:translate(0,0);}' +
      '30%{transform:translate(7px,-9px);}55%{transform:translate(-4px,-5px);}' +
      '80%{transform:translate(3px,2px);}}' +
      '.cdl-rig{position:absolute;inset:0;will-change:transform;' +
      'animation:cdlRigBob 4.2s cubic-bezier(0.65,0,0.35,1) infinite;}' +
      '@keyframes cdlRigBob{0%,100%{transform:translateY(0) rotate(0.25deg);}' +
      '38%{transform:translateY(-11px) rotate(-0.3deg);}' +
      '70%{transform:translateY(-4px) rotate(0.15deg);}}' +

      /* Ambient glow — breathes with hover */
      '.cdl-glow{position:absolute;inset:-18%;pointer-events:none;' +
      'background:radial-gradient(ellipse at center,rgba(141,235,0,0.14) 0%,' +
      'rgba(141,235,0,0.05) 45%,transparent 70%);' +
      'animation:cdlBreathe 4.2s cubic-bezier(0.65,0,0.35,1) infinite;}' +
      '@keyframes cdlBreathe{0%,100%{opacity:0.7;transform:scale(1);}' +
      '38%{opacity:1;transform:scale(1.06);}70%{opacity:0.82;transform:scale(1.02);}}' +

      /* The 7 PNG layers */
      '.cdl-layer{position:absolute;inset:0;width:100%;height:100%;' +
      'object-fit:contain;pointer-events:none;}' +
      '.cdl-layer-bg{animation:cdlBgPulse 6.5s cubic-bezier(0.65,0,0.35,1) infinite;' +
      'animation-delay:-2.1s;filter:blur(2px);}' +
      '@keyframes cdlBgPulse{0%,100%{transform:scale(1);opacity:1;}' +
      '35%{transform:scale(1.032);opacity:0.93;}68%{transform:scale(1.012);opacity:0.97;}}' +
      '.cdl-layer-aura{animation:cdlAuraPulse 2.9s cubic-bezier(0.65,0,0.35,1) infinite;' +
      'animation-delay:-1.2s;filter:blur(1.5px);}' +
      '@keyframes cdlAuraPulse{0%,100%{transform:scale(1);opacity:0.82;}' +
      '38%{transform:scale(1.07);opacity:1;}70%{transform:scale(1.03);opacity:0.9;}}' +
      '.cdl-layer-globe{animation:cdlGlobeBreathe 5.4s cubic-bezier(0.65,0,0.35,1) infinite;' +
      'animation-delay:-3.7s;}' +
      '@keyframes cdlGlobeBreathe{0%,100%{transform:scale(1);opacity:0.98;}' +
      '30%{transform:scale(1.018);opacity:1;}62%{transform:scale(1.006);opacity:0.97;}}' +
      '.cdl-layer-cube{animation:cdlSpinCW 30s linear infinite;transform-origin:50% 50%;}' +
      '.cdl-layer-crystal{animation:cdlSpinCCW 22s linear infinite;transform-origin:50% 50%;}' +
      '@keyframes cdlSpinCW{to{transform:rotate(360deg);}}' +
      '@keyframes cdlSpinCCW{to{transform:rotate(-360deg);}}' +

      /* Eyes — expression system */
      '.cdl-layer-eye{animation:cdlEyeIdle 5.2s cubic-bezier(0.65,0,0.35,1) infinite;}' +
      '@keyframes cdlEyeIdle{' +
      '0%,100%{transform:translateX(0) scale(1,1);opacity:1;filter:brightness(1);}' +
      '22%{transform:translateX(5px) scale(1.012,0.995);opacity:0.98;filter:brightness(1.05);}' +
      '45%{transform:translateX(-4px) scale(1.02,0.99);opacity:0.96;filter:brightness(1.09);}' +
      '68%{transform:translateX(3px) scale(1.008,1);opacity:0.99;filter:brightness(1.03);}' +
      '86%{transform:translateX(0) scale(1,1);opacity:1;filter:brightness(1);}' +
      '89%{opacity:1;filter:brightness(1);}' +
      '91.5%{opacity:0.28;filter:brightness(0.75);}' +
      '94%{opacity:1;filter:brightness(1.05);}}' +
      '.cdl-rig .cdl-layer-eye.cdl-eye-alert{animation:cdlEyeAlert 2.6s cubic-bezier(0.65,0,0.35,1) infinite;}' +
      '@keyframes cdlEyeAlert{' +
      '0%,100%{transform:translateX(0) scale(1.08,1.03);filter:brightness(1.35);opacity:1;}' +
      '18%{transform:translateX(-9px) scale(1.1,1.04);filter:brightness(1.44);}' +
      '34%{transform:translateX(-9px) scale(1.1,1.04);filter:brightness(1.44);}' +
      '54%{transform:translateX(9px) scale(1.1,1.04);filter:brightness(1.44);}' +
      '70%{transform:translateX(9px) scale(1.1,1.04);filter:brightness(1.44);}' +
      '86%{transform:translateX(0) scale(1.08,1.03);filter:brightness(1.35);}}' +
      '.cdl-rig .cdl-layer-eye.cdl-eye-curious{animation:cdlEyeCurious 0.72s cubic-bezier(0.65,0,0.35,1) infinite;}' +
      '@keyframes cdlEyeCurious{' +
      '0%,100%{transform:translateX(0) scale(1.06,1.04);filter:brightness(1.28);opacity:1;}' +
      '25%{transform:translateX(3px) scale(1.1,1.07);filter:brightness(1.45);}' +
      '50%{transform:translateX(-2px) scale(1.05,1.03);filter:brightness(1.22);}' +
      '75%{transform:translateX(4px) scale(1.09,1.06);filter:brightness(1.38);}}' +
      '.cdl-rig .cdl-layer-eye.cdl-eye-impatient{animation:cdlEyeImpatient 0.5s cubic-bezier(0.65,0,0.35,1) infinite;}' +
      '@keyframes cdlEyeImpatient{' +
      '0%,100%{transform:translateX(-6px) scale(1.08,1.02);filter:brightness(1.5);opacity:1;}' +
      '25%{transform:translateX(6px) scale(1.1,1.04);filter:brightness(1.72);}' +
      '50%{transform:translateX(-3px) scale(1.06,1);filter:brightness(1.42);}' +
      '75%{transform:translateX(5px) scale(1.09,1.03);filter:brightness(1.66);}}' +
      '.cdl-rig.cdl-locked .cdl-layer-eye{animation:cdlEyeExcite 1.5s cubic-bezier(0.22,1,0.36,1) forwards;}' +
      '@keyframes cdlEyeExcite{' +
      '0%{transform:translateX(0) scale(1,1);filter:brightness(1.2);opacity:1;}' +
      '14%{transform:translateX(0) scale(1.7,1.45);filter:brightness(3.2);opacity:1;}' +
      '40%{transform:translateX(0) scale(1.12,1.04);filter:brightness(2);}' +
      '70%{transform:translateX(0) scale(1.07,1.01);filter:brightness(1.65);}' +
      '100%{transform:translateX(0) scale(1.06,1);filter:brightness(1.5);opacity:1;}}' +

      /* Particle layer */
      '.cdl-layer-dots{animation:cdlDotsDrift 4.6s cubic-bezier(0.65,0,0.35,1) infinite;animation-delay:-1.8s;}' +
      '@keyframes cdlDotsDrift{' +
      '0%,100%{transform:translateX(0);opacity:0.7;filter:brightness(1);}' +
      '40%{transform:translateX(7px);opacity:1;filter:brightness(1.15);}' +
      '72%{transform:translateX(3px);opacity:0.85;filter:brightness(1.05);}}' +
      '.cdl-rig.cdl-locked .cdl-layer-dots{animation:cdlDotsExcited 1.4s cubic-bezier(0.22,1,0.36,1) forwards;}' +
      '@keyframes cdlDotsExcited{' +
      '0%{transform:translateX(0) scale(1);opacity:0.7;filter:brightness(1);}' +
      '35%{transform:translateX(4px) scale(1.12);opacity:1;filter:brightness(2);}' +
      '100%{transform:translateX(2px) scale(1.05);opacity:0.95;filter:brightness(1.45);}}' +

      /* Eye glow spill on lock */
      '.cdl-spill{position:absolute;top:2%;left:10%;right:10%;height:40%;pointer-events:none;' +
      'background:radial-gradient(ellipse at center,rgba(141,235,0,0.38) 0%,' +
      'rgba(141,235,0,0.14) 45%,transparent 72%);' +
      'opacity:0;mix-blend-mode:screen;transition:opacity 0.6s cubic-bezier(0.22,1,0.36,1);}' +
      '.cdl-rig.cdl-locked .cdl-spill{opacity:1;}' +

      /* Canvas particles */
      '.cdl-fx{position:absolute;inset:-15%;width:130%;height:130%;pointer-events:none;}' +

      /* Vignette */
      '.cdl-vignette{position:absolute;inset:0;pointer-events:none;' +
      'background:radial-gradient(ellipse at center,transparent 52%,rgba(0,0,0,0.42) 100%);}' +

      /* Loading UI */
      '.cdl-ui{display:flex;flex-direction:column;align-items:center;gap:12px;' +
      'z-index:10;position:relative;}' +
      '.cdl-label{font-size:13px;letter-spacing:0.35em;color:#8deb00;' +
      'text-transform:uppercase;text-shadow:0 0 12px rgba(141,235,0,0.5);text-align:center;}' +
      '.cdl-label .cdl-dots::after{content:"";animation:cdlDotCycle 1.2s steps(4) infinite;}' +
      '@keyframes cdlDotCycle{0%{content:"";}25%{content:".";}50%{content:"..";}75%{content:"...";}}' +
      '.cdl-track{width:min(70vw,280px);height:3px;background:rgba(255,255,255,0.08);' +
      'border-radius:2px;overflow:hidden;}' +
      '.cdl-fill{height:100%;width:0%;background:#8deb00;border-radius:2px;' +
      'box-shadow:0 0 10px rgba(141,235,0,0.8);transition:width 0.15s linear;}' +
      '.cdl-pct{font-size:12px;color:rgba(255,255,255,0.5);' +
      'font-variant-numeric:tabular-nums;letter-spacing:0.2em;}' +
      '.cdl-rig.cdl-locked ~ .cdl-ui .cdl-label{animation:cdlLockGlow 0.9s cubic-bezier(0.22,1,0.36,1);}' +
      '@keyframes cdlLockGlow{' +
      '0%{text-shadow:0 0 12px rgba(141,235,0,0.5);}' +
      '50%{text-shadow:0 0 30px rgba(141,235,0,1);}' +
      '100%{text-shadow:0 0 12px rgba(141,235,0,0.5);}}' +

      /* Logo watermark */
      '.cdl-logo{position:absolute;left:50%;transform:translateX(-50%);z-index:10;' +
      'bottom:max(10px,env(safe-area-inset-bottom,0px));width:92px;opacity:.5;pointer-events:none;}' +

      /* Error state */
      '.cdl-error{color:#ff6b6b;font-size:13px;letter-spacing:.15em;text-align:center;' +
      'max-width:80vw;line-height:1.8;}' +

      /* Reduced motion */
      '@media (prefers-reduced-motion: reduce){' +
      '.cdl-rigwrap,.cdl-rig,.cdl-rigtilt,.cdl-layer-bg,.cdl-layer-aura,.cdl-layer-globe,' +
      '.cdl-layer-cube,.cdl-layer-crystal,.cdl-layer-eye,.cdl-layer-dots,' +
      '.cdl-label .cdl-dots::after,.cdl-glow,.cdl-bgl{animation:none !important;}' +
      '.cdl-rigwrap,.cdl-rig,.cdl-rigtilt{transform:none;}' +
      '.cdl-fx{display:none;}.cdl-spill{transition:none;}}';

    var style = document.createElement('style');
    style.setAttribute('data-cdl', '1');
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ================= DOM ================= */

  function buildOverlay() {
    var o = document.createElement('div');
    o.className = 'cdl-overlay';
    o.setAttribute('role', 'status');
    o.setAttribute('aria-label', 'Loading');

    o.innerHTML =
      '<div class="cdl-bg">' +
        '<div class="cdl-bgl cdl-bgl-1"></div>' +
        '<div class="cdl-bgl cdl-bgl-2"></div>' +
        '<div class="cdl-bgl cdl-bgl-3"></div>' +
      '</div>' +
      '<div class="cdl-rigpos">' +
        '<div class="cdl-rigtilt">' +
          '<div class="cdl-rigwrap">' +
            '<div class="cdl-halo"></div>' +
            '<div class="cdl-glow"></div>' +
            '<div class="cdl-rig">' +
              '<img class="cdl-layer cdl-layer-bg" src="' + IMG.bg + '" alt="">' +
              '<img class="cdl-layer cdl-layer-aura" src="' + IMG.aura + '" alt="">' +
              '<img class="cdl-layer cdl-layer-globe" src="' + IMG.globe + '" alt="">' +
              '<img class="cdl-layer cdl-layer-cube" src="' + IMG.cube + '" alt="">' +
              '<img class="cdl-layer cdl-layer-crystal" src="' + IMG.crystal + '" alt="">' +
              '<img class="cdl-layer cdl-layer-eye" src="' + IMG.eye + '" alt="">' +
              '<img class="cdl-layer cdl-layer-dots" src="' + IMG.dots + '" alt="">' +
              '<div class="cdl-spill"></div>' +
              '<canvas class="cdl-fx"></canvas>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="cdl-ui">' +
        '<div class="cdl-label"><span class="cdl-labeltext">Establishing uplink</span><span class="cdl-dots"></span></div>' +
        '<div class="cdl-track"><div class="cdl-fill"></div></div>' +
        '<div class="cdl-pct">0%</div>' +
      '</div>' +
      '<div class="cdl-vignette"></div>' +
      '<img class="cdl-logo" src="' + IMG.logo + '" alt="Cameras Decoded">';

    els = {
      rig: o.querySelector('.cdl-rig'),
      rigTilt: o.querySelector('.cdl-rigtilt'),
      eye: o.querySelector('.cdl-layer-eye'),
      fill: o.querySelector('.cdl-fill'),
      pct: o.querySelector('.cdl-pct'),
      label: o.querySelector('.cdl-labeltext'),
      dots: o.querySelector('.cdl-dots'),
      ui: o.querySelector('.cdl-ui'),
      canvas: o.querySelector('.cdl-fx')
    };
    return o;
  }

  /* ================= Animation helpers ================= */

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
    waapiAnims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    waapiAnims = [];
  }

  function setEyeState(cls) {
    if (!els.eye || RM) return;
    var done = false;
    function swap() {
      if (done) return; done = true;
      els.eye.classList.remove('cdl-eye-alert', 'cdl-eye-curious', 'cdl-eye-impatient');
      if (cls) {
        els.eye.classList.add('cdl-' + cls);
        if (EYE_BASE[cls]) eyeBase = EYE_BASE[cls];
      }
    }
    try {
      var a = els.eye.animate(
        [{ opacity: 1 }, { opacity: 0.3, offset: 0.5 }, { opacity: 1 }],
        { duration: 160, easing: 'cubic-bezier(0.22,1,0.36,1)' }
      );
      a.onfinish = swap;
      setTimeout(swap, 220);
    } catch (e) { swap(); }
  }

  function blinkEye(duration) {
    if (RM || !els.eye) return;
    try {
      els.eye.animate([
        { transform: eyeBase + ' scaleY(1)', offset: 0 },
        { transform: eyeBase + ' scaleY(0.06)', offset: 0.42 },
        { transform: eyeBase + ' scaleY(0.06)', offset: 0.58 },
        { transform: eyeBase + ' scaleY(1)', offset: 1 }
      ], { duration: duration || 150, easing: 'ease-in-out' });
    } catch (e) {}
  }

  function startBlinkLoop(minMs, maxMs, duration) {
    if (RM) return;
    var loop = function () {
      if (!isShowing) return;
      blinkEye(duration);
      later(loop, minMs + Math.random() * (maxMs - minMs));
    };
    later(loop, minMs + Math.random() * (maxMs - minMs));
  }

  function startTiltLoop() {
    if (RM || !els.rigTilt) return;
    try {
      var a = els.rigTilt.animate([
        { transform: 'rotate(0deg) scale(1) translateY(0px)', offset: 0 },
        { transform: 'rotate(-4deg) scale(1.03) translateY(-4px)', offset: 0.22 },
        { transform: 'rotate(-4deg) scale(1.07) translateY(-10px)', offset: 0.38 },
        { transform: 'rotate(4deg) scale(1.07) translateY(-10px)', offset: 0.62 },
        { transform: 'rotate(4deg) scale(1.03) translateY(-4px)', offset: 0.78 },
        { transform: 'rotate(0deg) scale(1) translateY(0px)', offset: 1 }
      ], { duration: 8000, iterations: Infinity, easing: 'ease-in-out' });
      waapiAnims.push(a);
    } catch (e) {}
  }

  function rigFrustrated() {
    if (RM || !els.rig) return;
    try {
      els.rig.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.045)', offset: 0.35 },
        { transform: 'scale(1)' }
      ], { duration: 420, easing: 'cubic-bezier(0.22,1,0.36,1)' });
    } catch (e) {}
  }

  /* Canvas particles */
  function initParticles() {
    var canvas = els.canvas;
    if (!canvas || RM) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0;
    var COUNT = 22;
    var P = [];

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(fromBottom) {
      return {
        x: Math.random() * W,
        y: fromBottom ? H + 6 : Math.random() * H,
        r: 0.6 + Math.random() * 1.8,
        vy: 0.12 + Math.random() * 0.35,
        sway: Math.random() * Math.PI * 2,
        swayAmp: 4 + Math.random() * 10,
        swaySpeed: 0.004 + Math.random() * 0.01,
        a: 0.15 + Math.random() * 0.4,
        green: Math.random() < 0.65,
        tw: Math.random() * Math.PI * 2,
        twSpeed: 0.02 + Math.random() * 0.04
      };
    }

    function frame() {
      if (!isShowing) return;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        p.y -= p.vy;
        p.sway += p.swaySpeed;
        p.tw += p.twSpeed;
        if (p.y < -8) { P[i] = spawn(true); continue; }
        var twinkle = 0.6 + 0.4 * Math.sin(p.tw);
        var alpha = p.a * twinkle;
        var x = p.x + Math.sin(p.sway) * p.swayAmp;
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.green
          ? 'rgba(141,235,0,' + alpha.toFixed(3) + ')'
          : 'rgba(255,255,255,' + (alpha * 0.8).toFixed(3) + ')';
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    for (var i = 0; i < COUNT; i++) P.push(spawn(false));
    requestAnimationFrame(frame);
  }

  /* Expression arc: alert -> curious -> impatient (if loading drags) */
  function startExpressionArc() {
    if (RM) return;
    later(function () { setEyeState('eye-alert'); }, 60);
    later(function () { setEyeState('eye-curious'); }, 950);
    later(function () { setEyeState('eye-alert'); }, 1650);
    later(function () { setEyeState('eye-impatient'); rigFrustrated(); }, 2200);
    // Keep her impatient if still loading after 6s — another frustrated pulse
    later(function () { if (isShowing) rigFrustrated(); }, 6000);
    later(function () { if (isShowing) rigFrustrated(); }, 10000);
  }

  /* ================= Public API ================= */

  function show(opts) {
    injectCss();
    if (!overlay) {
      overlay = buildOverlay();
      document.body.appendChild(overlay);
      initParticles();
    }
    clearTimers();
    isShowing = true;

    // Reset state
    els.rig.classList.remove('cdl-locked');
    if (els.eye) els.eye.classList.remove('cdl-eye-alert', 'cdl-eye-curious', 'cdl-eye-impatient');
    eyeBase = EYE_BASE['default'];
    setProgress(0);

    var text = (opts && opts.text) || 'ESTABLISHING UPLINK';
    // Strip trailing dots animation span handling: keep text, dots span animates
    els.label.textContent = text.charAt(0) + text.slice(1).toLowerCase();
    els.dots.style.display = '';

    // Remove any error state
    var err = overlay.querySelector('.cdl-error');
    if (err) err.remove();
    els.ui.style.display = '';

    // Show
    requestAnimationFrame(function () {
      overlay.classList.add('on');
    });

    // Start her personality
    startExpressionArc();
    startBlinkLoop(2000, 3200, 150);
    startTiltLoop();
  }

  function setProgress(p) {
    p = Math.max(0, Math.min(1, p));
    if (els.fill) els.fill.style.width = (p * 100).toFixed(1) + '%';
    if (els.pct) els.pct.textContent = Math.round(p * 100) + '%';
  }

  function hide() {
    if (!overlay || !isShowing) return;
    isShowing = false;
    clearTimers();

    // SIGNAL LOCKED excitement
    els.rig.classList.add('cdl-locked');
    eyeBase = EYE_BASE['locked'];
    els.label.textContent = 'Signal locked';
    els.dots.style.display = 'none';
    setProgress(1);

    if (RM) {
      overlay.classList.remove('on');
      return;
    }

    // Let her celebrate briefly, then fade
    setTimeout(function () {
      if (overlay) overlay.classList.remove('on');
    }, 900);
  }

  function showError(msg) {
    injectCss();
    if (!overlay) {
      overlay = buildOverlay();
      document.body.appendChild(overlay);
    }
    clearTimers();
    isShowing = true;
    overlay.classList.add('on');

    // Hide normal UI, show error
    els.ui.style.display = 'none';
    var err = document.createElement('div');
    err.className = 'cdl-error';
    err.innerHTML = msg;
    err.style.cssText = 'position:relative;z-index:10;';
    overlay.appendChild(err);
  }

  window.CDLoading = {
    show: show,
    hide: hide,
    setProgress: setProgress,
    showError: showError
  };
})();
