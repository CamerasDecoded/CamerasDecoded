// ================================================================
// CD COMPANION — Cynetis-7 site-wide companion system
// She appears across the site: games, lessons, arena, dashboard.
// v20251007a — site-wide rewrite (supersedes dashboard-only v20251006a)
//
// Principles:
//   - Graceful appearances ONLY: fade 0→1 + scale 0.8→1, 600ms premium
//     ease. A soft green glow precedes her by 200ms. Exits reverse this.
//   - Sting sequencing: celebrate() returns a Promise. Pages chain their
//     sting in .then(). Her celebration completes → 300ms beat → sting.
//     NEVER overlapping.
//   - Real XP only: the displayed amount always comes from the actual
//     XP event. Never hardcoded.
//
// Page modes:
//   - dashboard (operator-dashboard.html): persistent idle companion
//   - transient (play.html, field-manual.html, missions.html): hidden by
//     default, appears gracefully for moments, exits after.
//
// Public API (all return Promises where noted):
//   CDCompanion.celebrate({xp, context, grade, perfect, label})
//   CDCompanion.encourage(reason)
//   CDCompanion.greet()
//   CDCompanion.goIdle()
//   CDCompanion.afterCelebration(fn) — queue a callback after celebration
// ================================================================
(function () {
  'use strict';

  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IMG = '/media/cynetis-7/';
  var IMG_V = '?v=20261006c';

  /* ============ PAGE DETECTION ============ */
  var path = (location.pathname || '').toLowerCase();
  var PAGE = 'other';
  if (path.indexOf('operator-dashboard') !== -1 || path === '/' || path.indexOf('index.html') !== -1) PAGE = 'dashboard';
  else if (path.indexOf('play.html') !== -1) PAGE = 'game';
  else if (path.indexOf('field-manual') !== -1) PAGE = 'lesson';
  else if (path.indexOf('missions') !== -1 || path.indexOf('arena') !== -1) PAGE = 'arena';

  // Dashboard gets persistent companion; other pages get transient
  var PERSISTENT = (PAGE === 'dashboard');

  /* ============ MEMORY (localStorage) ============ */
  var mem = {
    get: function (k, d) {
      try {
        var v = localStorage.getItem('cdc-' + k);
        return v === null ? d : JSON.parse(v);
      } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem('cdc-' + k, JSON.stringify(v)); } catch (e) {}
    }
  };

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function isLateNight() {
    var h = new Date().getHours();
    return h >= 22 || h < 6;
  }

  /* ============ CSS (injected) ============ */
  var css = [
    /* Base companion — hidden by default, graceful entrance */
    '.cdc{position:fixed;z-index:40;right:14px;bottom:calc(84px + env(safe-area-inset-bottom,0px));width:88px;height:88px;pointer-events:none}',
    '.cdc.cdc-hidden{opacity:0;transform:scale(.8);transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1)}',
    '.cdc.cdc-visible{opacity:1;transform:scale(1);transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1)}',
    /* Pre-glow: soft green aura that arrives 200ms before she does */
    '.cdc .c-preglow{position:absolute;inset:-30%;border-radius:50%;background:radial-gradient(circle,rgba(141,235,0,.25),transparent 65%);opacity:0;transition:opacity .5s ease;pointer-events:none}',
    '.cdc.cdc-preglow-on .c-preglow{opacity:1}',
    '.cdc .c-tap{position:absolute;inset:-10px;z-index:5;background:none;border:0;cursor:pointer;pointer-events:auto;-webkit-tap-highlight-color:transparent;touch-action:manipulation;border-radius:50%}',
    '.cdc .c-shadow{position:absolute;left:18%;right:18%;bottom:-4px;height:10px;background:radial-gradient(ellipse at center,rgba(0,0,0,.55),transparent 70%);animation:cdcShadow 4.6s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes cdcShadow{0%,100%{transform:scaleX(1);opacity:.8}50%{transform:scaleX(.82);opacity:.5}}',
    '.cdc .c-rig-pos{position:absolute;inset:0;transition:transform .65s cubic-bezier(.22,1,.36,1)}',
    '.cdc.mood-lesson .c-rig-pos{transform:scale(1.14) rotate(8deg)}',
    '.cdc.mood-visit .c-rig-pos{transform:scale(1.08)}',
    '.cdc.mood-night .c-rig-pos{transform:scale(.94)}',
    '.cdc.mood-proud .c-rig-pos{transform:scale(1.2)}',
    '.cdc.mood-sympathetic .c-rig-pos{transform:scale(1.05) rotate(-4deg)}',
    '.cdc .c-rig-tilt{position:absolute;inset:0}',
    '.cdc .c-rig-wrap{position:absolute;inset:0;animation:cdcDrift 7s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes cdcDrift{0%,100%{transform:translate(0,0)}30%{transform:translate(2.5px,-3px)}55%{transform:translate(-1.5px,-2px)}80%{transform:translate(1px,1px)}}',
    '.cdc .c-rig{position:absolute;inset:0;animation:cdcBob 4.6s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes cdcBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}',
    '.cdc .c-glow{position:absolute;inset:-14%;pointer-events:none;background:radial-gradient(ellipse at center,rgba(141,235,0,.16) 0%,transparent 68%);animation:cdcGlowPulse 4.6s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes cdcGlowPulse{0%,100%{opacity:.65}50%{opacity:1}}',
    '.cdc .c-layer{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}',
    '.cdc .c-layer-bg{animation:cdcBgPulse 6.5s cubic-bezier(.65,0,.35,1) infinite;filter:blur(1.5px)}',
    '@keyframes cdcBgPulse{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.03);opacity:.8}}',
    '.cdc .c-layer-aura{animation:cdcAuraPulse 2.9s cubic-bezier(.65,0,.35,1) infinite;filter:blur(1px)}',
    '@keyframes cdcAuraPulse{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.07);opacity:1}}',
    '.cdc .c-layer-globe{animation:cdcGlobeBreathe 5.4s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes cdcGlobeBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.018)}}',
    '.cdc .c-layer-cube{animation:cdcSpinCW 30s linear infinite;transform-origin:50% 50%}',
    '.cdc .c-layer-crystal{animation:cdcSpinCCW 22s linear infinite;transform-origin:50% 50%}',
    '@keyframes cdcSpinCW{to{transform:rotate(360deg)}}',
    '@keyframes cdcSpinCCW{to{transform:rotate(-360deg)}}',
    /* Eye states */
    '.cdc .c-layer-eye{animation:cdcEyeSleepy 6s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes cdcEyeSleepy{0%,100%{transform:translateX(0) scale(1,.42);filter:brightness(.42);opacity:.42}50%{transform:translateX(1px) scale(1.01,.44);filter:brightness(.46);opacity:.45}}',
    '.cdc .c-layer-eye.eye-night{animation:cdcEyeNight 7s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes cdcEyeNight{0%,100%{transform:translateX(0) scale(1,.3);filter:brightness(.3);opacity:.32}50%{transform:translateX(0) scale(1,.32);filter:brightness(.34);opacity:.35}}',
    '.cdc .c-layer-eye.eye-alert{animation:cdcEyeAlert 2.6s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes cdcEyeAlert{0%,100%{transform:translateX(0) scale(1.08,1.03);filter:brightness(1.35);opacity:1}30%{transform:translateX(-6px) scale(1.1,1.04);filter:brightness(1.44)}60%{transform:translateX(6px) scale(1.1,1.04);filter:brightness(1.44)}}',
    '.cdc .c-layer-eye.eye-warm{animation:cdcEyeWarm 3.4s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes cdcEyeWarm{0%,100%{transform:translateX(0) scale(1.02,.96);filter:brightness(.85) sepia(.4);opacity:.94}50%{transform:translateX(1px) scale(1.04,.99);filter:brightness(1.06) sepia(.32);opacity:1}}',
    '.cdc .c-layer-eye.eye-bright{animation:cdcEyeBright 1.1s cubic-bezier(.22,1,.36,1) forwards}',
    '@keyframes cdcEyeBright{0%{transform:translateX(0) scale(1,.42);filter:brightness(.5);opacity:.5}25%{transform:translateX(0) scale(1.22,1.12);filter:brightness(2.6);opacity:1}60%{transform:translateX(0) scale(1.1,1.02);filter:brightness(1.7);opacity:1}100%{transform:translateX(0) scale(1,.42);filter:brightness(.42);opacity:.42}}',
    /* Proud: bigger, brighter, triumphant */
    '.cdc .c-layer-eye.eye-proud{animation:cdcEyeProud 2s cubic-bezier(.22,1,.36,1) infinite}',
    '@keyframes cdcEyeProud{0%,100%{transform:translateX(0) scale(1.15,1.08);filter:brightness(1.8);opacity:1}50%{transform:translateX(0) scale(1.2,1.12);filter:brightness(2.2);opacity:1}}',
    /* Sympathetic: soft, gentle, caring — distinct from warm encouragement */
    '.cdc .c-layer-eye.eye-sympathetic{animation:cdcEyeSymp 4s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes cdcEyeSymp{0%,100%{transform:translateX(0) scale(1,.7);filter:brightness(.7) sepia(.25);opacity:.8}50%{transform:translateX(0) scale(1.02,.75);filter:brightness(.85) sepia(.2);opacity:.9}}',
    '.cdc .c-layer-dots{animation:cdcDotsDrift 4.6s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes cdcDotsDrift{0%,100%{transform:translateX(0);opacity:.6}50%{transform:translateX(3px);opacity:.9}}',
    '.cdc .c-particles{position:absolute;inset:-25%;width:150%;height:150%;pointer-events:none}',
    /* XP float — shows the REAL amount */
    '.cdc .xp-float{position:absolute;left:50%;top:-6px;z-index:6;transform:translateX(-50%);font-size:11px;letter-spacing:.12em;color:#8deb00;text-shadow:0 0 10px rgba(141,235,0,.8);opacity:0;pointer-events:none;white-space:nowrap;font-family:Space Mono,ui-monospace,monospace}',
    '.cdc .xp-float.go{animation:cdcXpFloatUp 1.4s cubic-bezier(.22,1,.36,1) forwards}',
    '@keyframes cdcXpFloatUp{0%{opacity:0;transform:translate(-50%,6px) scale(.8)}20%{opacity:1;transform:translate(-50%,0) scale(1.05)}100%{opacity:0;transform:translate(-50%,-34px) scale(1)}}',
    /* Sleep FX (late night) */
    '.cdc .c-sleep-fx{position:absolute;inset:-40%;pointer-events:none;opacity:0;transition:opacity 1.2s ease;font-family:Space Mono,ui-monospace,monospace}',
    '.cdc.mood-night .c-sleep-fx{opacity:1}',
    '.cdc .c-sleep-fx .zz{position:absolute;color:rgba(255,255,255,.55);animation:cdcZFloat 4.2s ease-in-out infinite}',
    '.cdc .c-sleep-fx .zz-1{font-size:10px;left:52%;top:8%;animation-delay:0s}',
    '.cdc .c-sleep-fx .zz-2{font-size:13px;left:66%;top:2%;animation-delay:1.4s}',
    '.cdc .c-sleep-fx .zz-3{font-size:17px;left:74%;top:-6%;animation-delay:2.8s}',
    '@keyframes cdcZFloat{0%{opacity:0;transform:translateY(6px) rotate(-8deg)}30%{opacity:.8}100%{opacity:0;transform:translateY(-18px) rotate(10deg)}}',
    '.cdc .c-sleep-fx .zstar{position:absolute;width:3px;height:3px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.9),rgba(141,235,0,.4) 60%,transparent);animation:cdcStarTw 3.2s ease-in-out infinite}',
    '@keyframes cdcStarTw{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:.9;transform:scale(1.2)}}',
    '@media (prefers-reduced-motion: reduce){.cdc .c-rig-wrap,.cdc .c-rig,.cdc .c-rig-tilt,.cdc .c-layer-bg,.cdc .c-layer-aura,.cdc .c-layer-globe,.cdc .c-layer-cube,.cdc .c-layer-crystal,.cdc .c-layer-eye,.cdc .c-layer-dots,.cdc .c-glow,.cdc .c-shadow{animation:none!important}.cdc .c-rig-pos{transform:none!important;transition:none}.cdc .c-particles,.cdc .c-sleep-fx{display:none}.cdc.cdc-hidden,.cdc.cdc-visible{transition:none}}'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ============ DOM ============ */
  var companion = document.createElement('div');
  companion.className = 'cdc mood-idle ' + (PERSISTENT ? 'cdc-visible' : 'cdc-hidden');
  companion.id = 'cdCompanion';
  companion.setAttribute('aria-hidden', 'true');
  companion.innerHTML =
    '<div class="c-preglow"></div>' +
    '<div class="c-shadow"></div><div class="c-glow"></div>' +
    '<div class="c-rig-pos"><div class="c-rig-tilt" id="cdcRigTilt"><div class="c-rig-wrap"><div class="c-rig" id="cdcRig">' +
    '<img class="c-layer c-layer-bg" src="' + IMG + 'c7-bg.png' + IMG_V + '" alt="">' +
    '<img class="c-layer c-layer-aura" src="' + IMG + 'c7-aura.png' + IMG_V + '" alt="">' +
    '<img class="c-layer c-layer-globe" src="' + IMG + 'c7-globe.png' + IMG_V + '" alt="">' +
    '<img class="c-layer c-layer-cube" src="' + IMG + 'c7-cube.png' + IMG_V + '" alt="">' +
    '<img class="c-layer c-layer-crystal" src="' + IMG + 'c7-crystal.png' + IMG_V + '" alt="">' +
    '<img class="c-layer c-layer-eye" id="cdcEye" src="' + IMG + 'c7-eye.png' + IMG_V + '" alt="">' +
    '<img class="c-layer c-layer-dots" src="' + IMG + 'c7-particles.png' + IMG_V + '" alt="">' +
    '</div></div></div></div>' +
    '<canvas class="c-particles" id="cdcParticles"></canvas>' +
    '<div class="xp-float" id="cdcXpFloat"></div>' +
    '<div class="c-sleep-fx" aria-hidden="true">' +
    '<span class="zz zz-1">z</span><span class="zz zz-2">z</span><span class="zz zz-3">Z</span>' +
    '<span class="zstar" style="left:30%;top:20%;animation-delay:0s"></span>' +
    '<span class="zstar" style="left:70%;top:30%;animation-delay:.8s"></span>' +
    '<span class="zstar" style="left:45%;top:5%;animation-delay:1.6s"></span>' +
    '<span class="zstar" style="left:80%;top:15%;animation-delay:2.2s"></span>' +
    '<span class="zstar" style="left:25%;top:35%;animation-delay:2.8s"></span>' +
    '</div>' +
    '<button class="c-tap" id="cdcTap" aria-label="Say hello to Cynetis-7"></button>';
  document.body.appendChild(companion);

  var rig = document.getElementById('cdcRig');
  var rigTilt = document.getElementById('cdcRigTilt');
  var xpFloat = document.getElementById('cdcXpFloat');
  var tap = document.getElementById('cdcTap');

  /* ============ STATE ============ */
  var timers = [];
  var waapiAnims = [];
  var night = isLateNight();
  var mood = 'idle';
  var busyUntil = 0;
  var isVisible = PERSISTENT;
  var afterQueue = []; // callbacks to run after celebration completes

  function trackAnim(a) { if (a) waapiAnims.push(a); return a; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); return timers[timers.length - 1]; }

  var EYE_BASE = {
    'eye-alert': 'translateX(0) scale(1.08,1.03)',
    'eye-warm': 'translateX(0) scale(1.02,0.96)',
    'eye-sleepy': 'translateX(0) scale(1,0.42)',
    'eye-night': 'translateX(0) scale(1,0.3)',
    'eye-bright': 'translateX(0) scale(1,0.42)',
    'eye-proud': 'translateX(0) scale(1.15,1.08)',
    'eye-sympathetic': 'translateX(0) scale(1,0.7)',
    'default': 'translateX(0) scale(1,1)'
  };
  var currentEyeBase = EYE_BASE['eye-sleepy'];
  var EYE_CLASSES = ['eye-alert', 'eye-warm', 'eye-sleepy', 'eye-night', 'eye-bright', 'eye-proud', 'eye-sympathetic'];

  function eyeEl() { return document.getElementById('cdcEye'); }

  function setEye(cls) {
    var eye = eyeEl();
    if (!eye || RM) return;
    function swap() {
      eye.classList.remove.apply(eye.classList, EYE_CLASSES);
      if (cls) {
        eye.classList.add(cls);
        if (EYE_BASE[cls]) currentEyeBase = EYE_BASE[cls];
      }
    }
    try {
      var a = eye.animate(
        [{ opacity: 1 }, { opacity: 0.3, offset: 0.5 }, { opacity: 1 }],
        { duration: 160, easing: 'cubic-bezier(0.22,1,0.36,1)' }
      );
      a.onfinish = swap;
      setTimeout(swap, 220);
    } catch (e) { swap(); }
  }

  function blinkEye(duration) {
    if (RM) return;
    var eye = eyeEl();
    if (!eye) return;
    try {
      eye.animate([
        { transform: currentEyeBase + ' scaleY(1)', offset: 0 },
        { transform: currentEyeBase + ' scaleY(0.06)', offset: 0.42 },
        { transform: currentEyeBase + ' scaleY(0.06)', offset: 0.58 },
        { transform: currentEyeBase + ' scaleY(1)', offset: 1 }
      ], { duration: duration || 150, easing: 'ease-in-out' });
    } catch (e) {}
  }

  function startBlinkLoop(minMs, maxMs, duration) {
    if (RM) return;
    var loop = function () {
      if (mood !== 'idle' && mood !== 'night') return;
      if (Date.now() < busyUntil) { later(loop, 1200); return; }
      blinkEye(duration);
      later(loop, minMs + Math.random() * (maxMs - minMs));
    };
    later(loop, minMs + Math.random() * (maxMs - minMs));
  }

  function startIdleDrift() {
    if (RM || !rigTilt) return;
    try {
      trackAnim(rigTilt.animate([
        { transform: 'translate(0px,0px) rotate(0deg)', offset: 0 },
        { transform: 'translate(3px,-2px) rotate(0.6deg)', offset: 0.3 },
        { transform: 'translate(-2px,-3px) rotate(-0.5deg)', offset: 0.65 },
        { transform: 'translate(0px,0px) rotate(0deg)', offset: 1 }
      ], { duration: night ? 16000 : 12000, iterations: Infinity, easing: 'ease-in-out' }));
    } catch (e) {}
  }

  function startNoticeLoop() {
    if (RM) return;
    var gap = night ? 12000 : 8000;
    var notice = function () {
      if (mood !== 'idle' && mood !== 'night') { later(notice, gap); return; }
      var eye = eyeEl();
      var sleepy = night ? EYE_BASE['eye-night'] : EYE_BASE['eye-sleepy'];
      if (eye && Date.now() > busyUntil) {
        try {
          eye.animate([
            { transform: sleepy, filter: night ? 'brightness(0.3)' : 'brightness(0.42)', opacity: night ? 0.32 : 0.42 },
            { transform: 'translateX(0) scale(1.16,1.05)', filter: 'brightness(1.6)', opacity: 1, offset: 0.3 },
            { transform: 'translateX(0) scale(1.1,1)', filter: 'brightness(1.45)', opacity: 1, offset: 0.7 },
            { transform: sleepy, filter: night ? 'brightness(0.3)' : 'brightness(0.42)', opacity: night ? 0.32 : 0.42 }
          ], { duration: 1500, easing: 'cubic-bezier(0.22,1,0.36,1)' });
        } catch (e) {}
      }
      later(notice, gap);
    };
    later(notice, 5000);
  }

  function setMoodClass(m) {
    companion.classList.remove('mood-idle', 'mood-xp', 'mood-lesson', 'mood-visit', 'mood-night', 'mood-proud', 'mood-sympathetic', 'mood-encourage');
    companion.classList.add('mood-' + m);
  }

  function clearAll() {
    timers.forEach(clearTimeout); timers = [];
    waapiAnims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    waapiAnims = [];
  }

  /* ============ GRACEFUL SHOW / HIDE ============ */
  function show() {
    return new Promise(function (resolve) {
      if (isVisible) { resolve(); return; }
      if (RM) {
        companion.classList.remove('cdc-hidden');
        companion.classList.add('cdc-visible');
        isVisible = true;
        resolve();
        return;
      }
      // Pre-glow arrives 200ms before she does
      companion.classList.add('cdc-preglow-on');
      setTimeout(function () {
        companion.classList.remove('cdc-hidden');
        companion.classList.add('cdc-visible');
        isVisible = true;
        setTimeout(function () {
          companion.classList.remove('cdc-preglow-on');
          resolve();
        }, 600);
      }, 200);
    });
  }

  function hide() {
    return new Promise(function (resolve) {
      if (!isVisible || PERSISTENT) { resolve(); return; }
      if (RM) {
        companion.classList.remove('cdc-visible');
        companion.classList.add('cdc-hidden');
        isVisible = false;
        resolve();
        return;
      }
      companion.classList.remove('cdc-visible');
      companion.classList.add('cdc-hidden');
      isVisible = false;
      setTimeout(resolve, 600);
    });
  }

  function goIdle() {
    clearAll();
    mood = night ? 'night' : 'idle';
    setMoodClass(mood);
    setEye(night ? 'eye-night' : 'eye-sleepy');
    startIdleDrift();
    startBlinkLoop(night ? 7000 : 5000, night ? 10000 : 7500, night ? 1000 : 800);
    startNoticeLoop();
    busyUntil = 0;
    // Drain the after-celebration queue
    var q = afterQueue.slice();
    afterQueue = [];
    q.forEach(function (fn) { try { fn(); } catch (e) {} });
  }

  /* ============ CELEBRATE (returns Promise for sting sequencing) ============ */
  function celebrate(opts) {
    opts = opts || {};
    var xp = typeof opts.xp === 'number' ? opts.xp : 0;
    var context = opts.context || 'generic';
    var grade = opts.grade || null;
    var perfect = opts.perfect === true;
    var isMilestone = opts.milestone === true;

    return new Promise(function (resolve) {
      if (RM) {
        // Reduced motion: show XP, resolve immediately
        if (xp > 0) showXpFloat(xp);
        resolve();
        if (!PERSISTENT) hide();
        return;
      }

      show().then(function () {
        clearAll();

        // Choose celebration intensity
        var isBig = isMilestone || perfect || context === 'chapter' || (grade === 'S');
        var duration = isBig ? 2800 : 1600;

        mood = isBig ? 'proud' : 'xp';
        setMoodClass(isBig ? 'proud' : 'xp');
        busyUntil = Date.now() + duration;

        if (isBig) {
          setEye('eye-proud');
          // Triumphant rise + spin
          try {
            trackAnim(rigTilt.animate([
              { transform: 'translateY(0px) scale(1) rotate(0deg)', offset: 0 },
              { transform: 'translateY(-22px) scale(1.1) rotate(180deg)', offset: 0.4 },
              { transform: 'translateY(0px) scale(1.02) rotate(360deg)', offset: 0.75 },
              { transform: 'translateY(0px) scale(1) rotate(360deg)', offset: 1 }
            ], { duration: 1400, easing: 'cubic-bezier(0.22,1,0.36,1)' }));
          } catch (e) {}
          confetti(46);
        } else {
          setEye('eye-bright');
          // Happy hop
          try {
            trackAnim(rigTilt.animate([
              { transform: 'translateY(0px) scale(1,1)', offset: 0 },
              { transform: 'translateY(-14px) scale(1.04,1.02)', offset: 0.4 },
              { transform: 'translateY(0px) scale(0.98,1.03)', offset: 0.72 },
              { transform: 'translateY(0px) scale(1,1)', offset: 1 }
            ], { duration: 700, easing: 'cubic-bezier(0.34,1.3,0.64,1)' }));
          } catch (e) {}
          puff(12);
        }

        // Show the REAL XP amount
        if (xp > 0) showXpFloat(xp);

        // Track milestones in memory
        trackCelebration(context, grade, xp);

        later(function () {
          // 300ms beat before resolving (sting fires after)
          setTimeout(function () {
            if (PERSISTENT) {
              goIdle();
            } else {
              hide().then(goIdle);
            }
            resolve();
          }, 300);
        }, duration);
      });
    });
  }

  function showXpFloat(amount) {
    xpFloat.textContent = '+' + amount + ' XP';
    xpFloat.classList.remove('go');
    void xpFloat.offsetWidth;
    xpFloat.classList.add('go');
  }

  /* ============ ENCOURAGE ============ */
  function encourage(reason) {
    return new Promise(function (resolve) {
      if (RM) { resolve(); return; }
      show().then(function () {
        clearAll();
        // Sympathetic is softer than warm encouragement — for struggle
        var isStruggle = reason === 'struggle';
        mood = isStruggle ? 'sympathetic' : 'encourage';
        setMoodClass(mood);
        busyUntil = Date.now() + 3000;
        setEye(isStruggle ? 'eye-sympathetic' : 'eye-warm');
        // Gentle lean-in
        try {
          trackAnim(rigTilt.animate([
            { transform: 'rotate(0deg) scale(1)', offset: 0 },
            { transform: 'rotate(' + (isStruggle ? '-4deg' : '8deg') + ') scale(1.08)', offset: 0.4 },
            { transform: 'rotate(0deg) scale(1)', offset: 1 }
          ], { duration: 2800, easing: 'ease-in-out' }));
        } catch (e) {}
        if (!RM) startBlinkLoop(3000, 4200, 450);
        later(function () {
          setTimeout(function () {
            if (PERSISTENT) goIdle(); else hide().then(goIdle);
            resolve();
          }, 300);
        }, 3000);
      });
    });
  }

  /* ============ GREET ============ */
  function greet(kind) {
    return new Promise(function (resolve) {
      if (RM) { resolve(); return; }
      show().then(function () {
        clearAll();
        mood = 'visit';
        setMoodClass('visit');
        busyUntil = Date.now() + 2800;
        setEye('eye-alert');
        try {
          trackAnim(rigTilt.animate([
            { transform: 'rotate(0deg) scale(1)', offset: 0 },
            { transform: 'rotate(-3deg) scale(1.05)', offset: 0.3 },
            { transform: 'rotate(3deg) scale(1.05)', offset: 0.65 },
            { transform: 'rotate(0deg) scale(1)', offset: 1 }
          ], { duration: 2600, easing: 'ease-in-out' }));
        } catch (e) {}
        if (!RM) startBlinkLoop(1800, 2600, 150);
        later(function () {
          setTimeout(function () {
            if (PERSISTENT) goIdle(); else hide().then(goIdle);
            resolve();
          }, 300);
        }, 2800);
      });
    });
  }

  /* ============ MEMORY TRACKING ============ */
  function trackCelebration(context, grade, xp) {
    try {
      // Track grades for struggle detection
      if (grade) {
        var grades = mem.get('grades', []);
        grades.push({ grade: grade, ts: Date.now() });
        // Keep last 10
        if (grades.length > 10) grades = grades.slice(-10);
        mem.set('grades', grades);

        // Struggle detection: two consecutive C-or-below
        var lowGrades = ['C', 'D', 'F'];
        if (grades.length >= 2) {
          var last2 = grades.slice(-2);
          if (lowGrades.indexOf(last2[0].grade) !== -1 &&
              lowGrades.indexOf(last2[1].grade) !== -1 &&
              Date.now() - mem.get('last-encouraged', 0) > 300000) { // 5 min cooldown
            mem.set('last-encouraged', Date.now());
            // Encourage after a beat (don't interrupt the celebration)
            setTimeout(function () { encourage('struggle'); }, 4000);
          }
        }
      }

      // Milestone: first S-rank ever
      if (grade === 'S' && !mem.get('first-s-rank', false)) {
        mem.set('first-s-rank', true);
        mem.set('pending-milestone', { type: 'first-s-rank', ts: Date.now() });
      }

      // Count total celebrations for milestone detection
      var count = mem.get('celebration-count', 0) + 1;
      mem.set('celebration-count', count);
      if (count === 100 && !mem.get('milestone-100', false)) {
        mem.set('milestone-100', true);
        mem.set('pending-milestone', { type: '100-celebrations', ts: Date.now() });
      }
    } catch (e) {}
  }

  function checkStreakMilestone() {
    try {
      // Read streak from common locations
      var streak = 0;
      try {
        var ls = localStorage.getItem('cd-streak') || localStorage.getItem('dailyStreak');
        if (ls) streak = parseInt(JSON.parse(ls).count || ls, 10) || 0;
      } catch (e) {}
      var milestones = [7, 14, 30, 60, 100];
      var seenKey = 'streak-milestone-' + streak;
      if (milestones.indexOf(streak) !== -1 && !mem.get(seenKey, false)) {
        mem.set(seenKey, true);
        return streak;
      }
    } catch (e) {}
    return 0;
  }

  /* ============ PARTICLES ============ */
  var puffFn = null, confettiFn = null;
  (function initParticles() {
    var canvas = document.getElementById('cdcParticles');
    if (!canvas || RM) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0;
    var P = [];
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    puffFn = function (n) {
      var cx = W / 2, cy = H / 2;
      for (var i = 0; i < (n || 10); i++) {
        var ang = Math.random() * 6.28, sp = 0.8 + Math.random() * 1.8;
        P.push({
          bx: true, x: cx, y: cy,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.4,
          r: 0.8 + Math.random() * 1.5, a: 0.4 + Math.random() * 0.4,
          green: Math.random() < 0.7, life: 1, decay: 0.02 + Math.random() * 0.02
        });
      }
    };
    confettiFn = function (n) {
      var cx = W / 2, cy = H / 2;
      var colors = ['#8deb00', '#ffffff', '#d4af37'];
      for (var i = 0; i < (n || 30); i++) {
        var ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        var sp = 2 + Math.random() * 3.5;
        P.push({
          cf: true, x: cx + (Math.random() - 0.5) * 20, y: cy,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          w: 3 + Math.random() * 4, h: 2 + Math.random() * 3,
          rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
          color: colors[(Math.random() * colors.length) | 0],
          life: 1, decay: 0.008 + Math.random() * 0.01
        });
      }
    };
    function frame() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i];
        if (p.cf) {
          p.x += p.vx; p.y += p.vy;
          p.vy += 0.12; p.vx *= 0.99;
          p.rot += p.vr; p.life -= p.decay;
          if (p.life <= 0 || p.y > H + 10) { P.splice(i, 1); continue; }
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
          ctx.globalAlpha = 1;
          continue;
        }
        if (p.bx) {
          p.x += p.vx; p.y += p.vy;
          p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.02;
          p.life -= p.decay;
          if (p.life <= 0) { P.splice(i, 1); continue; }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.28);
          var al = (p.a * p.life).toFixed(3);
          ctx.fillStyle = p.green ? 'rgba(141,235,0,' + al + ')' : 'rgba(255,255,255,' + (al * 0.8).toFixed(3) + ')';
          ctx.fill();
          continue;
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  })();

  function puff(n) { if (puffFn) puffFn(n); }
  function confetti(n) { if (confettiFn) confettiFn(n); }

  /* ============ TAP INTERACTION ============ */
  tap.addEventListener('click', function (e) {
    if (RM || Date.now() < busyUntil) return;
    var WAKE_MS = 4300;
    busyUntil = Date.now() + WAKE_MS;
    var eye = eyeEl();
    var dim = night;
    var dimFilter = dim ? 'brightness(0.3)' : 'brightness(0.42)';
    var dimOp = dim ? 0.32 : 0.42;
    var r = companion.getBoundingClientRect();
    var dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
    var lookX = (dx * 6).toFixed(1);
    if (eye) {
      try {
        eye.animate([
          { transform: currentEyeBase, filter: 'brightness(1)', opacity: 1, offset: 0 },
          { transform: 'translateX(' + lookX + 'px) scale(1.12,1.06)', filter: 'brightness(1.8)', opacity: 1, offset: 0.14 },
          { transform: 'translateX(-4px) scale(1.08,1.03)', filter: 'brightness(1.5)', opacity: 1, offset: 0.34 },
          { transform: 'translateX(4px) scale(1.08,1.03)', filter: 'brightness(1.5)', opacity: 1, offset: 0.55 },
          { transform: 'translateX(0px) scale(1.05,0.9)', filter: 'brightness(1.1)', opacity: 0.85, offset: 0.8 },
          { transform: currentEyeBase, filter: dimFilter, opacity: dimOp, offset: 1 }
        ], { duration: WAKE_MS, easing: 'cubic-bezier(0.22,1,0.36,1)' });
      } catch (err) {}
    }
    try {
      trackAnim(rigTilt.animate([
        { transform: 'rotate(0deg) translateY(0px)', offset: 0 },
        { transform: 'rotate(180deg) translateY(-10px)', offset: 0.5 },
        { transform: 'rotate(360deg) translateY(0px)', offset: 1 }
      ], { duration: 650, easing: 'cubic-bezier(0.22,1,0.36,1)' }));
    } catch (err) {}
    later(function () { if (Date.now() >= busyUntil) goIdle(); }, WAKE_MS + 100);
  });

  /* ============ PAGE-SPECIFIC AUTO-HOOKS ============ */

  /* Dashboard: persistent idle + first-visit greeting + streak milestones */
  function initDashboard() {
    night = isLateNight();
    goIdle();
    // First visit today → greeting
    var lastVisit = mem.get('last-visit', '');
    var today = todayKey();
    if (lastVisit !== today) {
      mem.set('last-visit', today);
      later(function () { greet('first-visit'); }, 1500);
    }
    // Streak milestone check
    var streakMs = checkStreakMilestone();
    if (streakMs > 0) {
      later(function () {
        celebrate({ xp: 0, context: 'streak', milestone: true });
      }, 4000);
    }
    // Pending milestone from another page
    var pending = mem.get('pending-milestone', null);
    if (pending && Date.now() - pending.ts < 86400000) {
      mem.set('pending-milestone', null);
      later(function () {
        celebrate({ xp: 0, context: 'milestone', milestone: true });
      }, 6000);
    }
  }

  /* Game pages: expose hook for showResult */
  function initGame() {
    night = isLateNight();
    // Companion stays hidden until gameResult is called
    goIdle();
    // Pre-hide (already hidden via cdc-hidden class)
  }

  /* Lesson pages: expose hook for finishLesson */
  function initLesson() {
    night = isLateNight();
    goIdle();
  }

  /* Arena: expose hook for vote */
  function initArena() {
    night = isLateNight();
    goIdle();
  }

  /* ============ PUBLIC API ============ */
  window.CDCompanion = {
    celebrate: celebrate,
    encourage: encourage,
    greet: greet,
    goIdle: goIdle,
    // Queue a callback to run after the current/next celebration
    // completes. Use for sting sequencing: her first, then sting.
    afterCelebration: function (fn) {
      if (typeof fn === 'function') afterQueue.push(fn);
    },
    // Convenience wrappers
    celebrateXP: function (amount) { return celebrate({ xp: amount, context: 'xp' }); },
    lessonComplete: function (amount, isChapter) {
      return celebrate({ xp: amount || 0, context: isChapter ? 'chapter' : 'lesson' });
    },
    gameResult: function (opts) {
      opts = opts || {};
      return celebrate({
        xp: opts.xp || 0,
        context: 'game',
        grade: opts.grade || null,
        perfect: opts.grade === 'S'
      });
    },
    voteSealed: function () {
      return celebrate({ xp: 0, context: 'vote' });
    },
    // For testing/debugging
    _page: PAGE,
    _isVisible: function () { return isVisible; }
  };

  /* ============ BOOT ============ */
  if (PAGE === 'dashboard') initDashboard();
  else if (PAGE === 'game') initGame();
  else if (PAGE === 'lesson') initLesson();
  else if (PAGE === 'arena') initArena();
  else { night = isLateNight(); goIdle(); }

})();
