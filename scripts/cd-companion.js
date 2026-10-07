// ================================================================
// CD COMPANION — Cynetis-7 dashboard companion
// She floats in the bottom-right corner: idle, reactive, alive.
// v20251006a
// ================================================================
(function () {
  'use strict';

  // Only on the operator dashboard
  if (!document.getElementById('toast')) return;

  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IMG = '/media/cynetis-7/';

  /* ============ CSS (injected) ============ */
  var css = [
    '.cdc{position:fixed;z-index:40;right:14px;bottom:calc(84px + env(safe-area-inset-bottom,0px));width:88px;height:88px;pointer-events:none}',
    '.cdc .c-tap{position:absolute;inset:-10px;z-index:5;background:none;border:0;cursor:pointer;pointer-events:auto;-webkit-tap-highlight-color:transparent;touch-action:manipulation;border-radius:50%}',
    '.cdc .c-shadow{position:absolute;left:18%;right:18%;bottom:-4px;height:10px;background:radial-gradient(ellipse at center,rgba(0,0,0,.55),transparent 70%);animation:cdcShadow 4.6s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes cdcShadow{0%,100%{transform:scaleX(1);opacity:.8}50%{transform:scaleX(.82);opacity:.5}}',
    '.cdc .c-rig-pos{position:absolute;inset:0;transition:transform .65s cubic-bezier(.22,1,.36,1)}',
    '.cdc.mood-lesson .c-rig-pos{transform:scale(1.14) rotate(8deg)}',
    '.cdc.mood-visit .c-rig-pos{transform:scale(1.08)}',
    '.cdc.mood-night .c-rig-pos{transform:scale(.94)}',
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
    '.cdc .c-layer-dots{animation:cdcDotsDrift 4.6s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes cdcDotsDrift{0%,100%{transform:translateX(0);opacity:.6}50%{transform:translateX(3px);opacity:.9}}',
    '.cdc .c-particles{position:absolute;inset:-25%;width:150%;height:150%;pointer-events:none}',
    '.cdc .xp-float{position:absolute;left:50%;top:-6px;z-index:6;transform:translateX(-50%);font-size:11px;letter-spacing:.12em;color:#8deb00;text-shadow:0 0 10px rgba(141,235,0,.8);opacity:0;pointer-events:none;white-space:nowrap;font-family:Space Mono,ui-monospace,monospace}',
    '.cdc .xp-float.go{animation:cdcXpFloatUp 1.4s cubic-bezier(.22,1,.36,1) forwards}',
    '@keyframes cdcXpFloatUp{0%{opacity:0;transform:translate(-50%,6px) scale(.8)}20%{opacity:1;transform:translate(-50%,0) scale(1.05)}100%{opacity:0;transform:translate(-50%,-34px) scale(1)}}',
    '.cdc .c-sleep-fx{position:absolute;inset:-40%;pointer-events:none;opacity:0;transition:opacity 1.2s ease;font-family:Space Mono,ui-monospace,monospace}',
    '.cdc.mood-night .c-sleep-fx{opacity:1}',
    '.cdc .c-sleep-fx .zz{position:absolute;color:rgba(255,255,255,.55);animation:cdcZFloat 4.2s ease-in-out infinite}',
    '.cdc .c-sleep-fx .zz-1{font-size:10px;left:52%;top:8%;animation-delay:0s}',
    '.cdc .c-sleep-fx .zz-2{font-size:13px;left:66%;top:2%;animation-delay:1.4s}',
    '.cdc .c-sleep-fx .zz-3{font-size:17px;left:74%;top:-6%;animation-delay:2.8s}',
    '@keyframes cdcZFloat{0%{opacity:0;transform:translateY(6px) rotate(-8deg)}30%{opacity:.8}100%{opacity:0;transform:translateY(-18px) rotate(10deg)}}',
    '.cdc .c-sleep-fx .zstar{position:absolute;width:3px;height:3px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.9),rgba(141,235,0,.4) 60%,transparent);animation:cdcStarTw 3.2s ease-in-out infinite}',
    '@keyframes cdcStarTw{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:.9;transform:scale(1.2)}}',
    '@media (prefers-reduced-motion: reduce){.cdc .c-rig-wrap,.cdc .c-rig,.cdc .c-rig-tilt,.cdc .c-layer-bg,.cdc .c-layer-aura,.cdc .c-layer-globe,.cdc .c-layer-cube,.cdc .c-layer-crystal,.cdc .c-layer-eye,.cdc .c-layer-dots,.cdc .c-glow,.cdc .c-shadow{animation:none!important}.cdc .c-rig-pos{transform:none!important;transition:none}.cdc .c-particles,.cdc .c-sleep-fx{display:none}}'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ============ DOM ============ */
  var companion = document.createElement('div');
  companion.className = 'cdc mood-idle';
  companion.id = 'cdCompanion';
  companion.setAttribute('aria-hidden', 'true');
  companion.innerHTML =
    '<div class="c-shadow"></div><div class="c-glow"></div>' +
    '<div class="c-rig-pos"><div class="c-rig-tilt" id="cdcRigTilt"><div class="c-rig-wrap"><div class="c-rig" id="cdcRig">' +
    '<img class="c-layer c-layer-bg" src="' + IMG + 'c7-bg.png" alt="">' +
    '<img class="c-layer c-layer-aura" src="' + IMG + 'c7-aura.png" alt="">' +
    '<img class="c-layer c-layer-globe" src="' + IMG + 'c7-globe.png" alt="">' +
    '<img class="c-layer c-layer-cube" src="' + IMG + 'c7-cube.png" alt="">' +
    '<img class="c-layer c-layer-crystal" src="' + IMG + 'c7-crystal.png" alt="">' +
    '<img class="c-layer c-layer-eye" id="cdcEye" src="' + IMG + 'c7-eye.png" alt="">' +
    '<img class="c-layer c-layer-dots" src="' + IMG + 'c7-particles.png" alt="">' +
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

  var rigTilt = document.getElementById('cdcRigTilt');
  var rig = document.getElementById('cdcRig');
  var xpFloat = document.getElementById('cdcXpFloat');
  var tap = document.getElementById('cdcTap');
  var timers = [];
  var waapiAnims = [];
  var busyUntil = 0;
  var mood = 'idle';
  var night = false;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearAll() {
    timers.forEach(clearTimeout); timers = [];
    waapiAnims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    waapiAnims = [];
  }
  function trackAnim(a) { if (a) waapiAnims.push(a); return a; }
  function eyeEl() { return document.getElementById('cdcEye'); }
  function setMoodClass(m) {
    companion.classList.remove('mood-idle', 'mood-night', 'mood-xp', 'mood-lesson', 'mood-visit');
    companion.classList.add('mood-' + m);
  }
  function setEye(cls) {
    var eye = eyeEl();
    if (!eye) return;
    eye.classList.remove('eye-night', 'eye-alert', 'eye-warm', 'eye-bright');
    if (cls) eye.classList.add(cls);
  }

  /* ---- blinking: WAAPI scaleY collapse, randomized ---- */
  var EYE_BASE = {
    'eye-alert': 'translateX(0) scale(1.08,1.03)',
    'eye-warm': 'translateX(0) scale(1.02,0.96)',
    'eye-night': 'translateX(0) scale(1,0.3)',
    'default': 'translateX(0) scale(1,0.42)'
  };
  var currentEyeBase = EYE_BASE['default'];
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
      if (Date.now() < busyUntil) { timers.push(setTimeout(loop, 800)); return; }
      blinkEye(duration);
      timers.push(setTimeout(loop, minMs + Math.random() * (maxMs - minMs)));
    };
    timers.push(setTimeout(loop, minMs + Math.random() * (maxMs - minMs)));
  }

  /* ---- idle drift + notice loop ---- */
  function startIdleDrift() {
    if (RM || !rigTilt) return;
    try {
      trackAnim(rigTilt.animate([
        { transform: 'translate(0px,0px) rotate(0deg)', offset: 0 },
        { transform: 'translate(2px,-3px) rotate(0.5deg)', offset: 0.5 },
        { transform: 'translate(0px,0px) rotate(0deg)', offset: 1 }
      ], { duration: night ? 16000 : 11000, iterations: Infinity, easing: 'ease-in-out' }));
    } catch (e) {}
  }
  function startNoticeLoop() {
    if (RM) return;
    var notice = function () {
      if (Date.now() < busyUntil) { timers.push(setTimeout(notice, 3000)); return; }
      var eye = eyeEl();
      if (eye) {
        currentEyeBase = night ? EYE_BASE['eye-night'] : EYE_BASE['default'];
        try {
          eye.animate([
            { transform: currentEyeBase, filter: night ? 'brightness(0.3)' : 'brightness(0.42)', opacity: night ? 0.32 : 0.42 },
            { transform: 'translateX(0) scale(1.12,1.02)', filter: 'brightness(1.4)', opacity: 1, offset: 0.35 },
            { transform: currentEyeBase, filter: night ? 'brightness(0.3)' : 'brightness(0.42)', opacity: night ? 0.32 : 0.42 }
          ], { duration: 1200, easing: 'cubic-bezier(0.22,1,0.36,1)' });
        } catch (e) {}
      }
      timers.push(setTimeout(notice, night ? 12000 : 8000));
    };
    timers.push(setTimeout(notice, 5000));
  }

  function goIdle() {
    clearAll();
    mood = night ? 'night' : 'idle';
    setMoodClass(mood);
    var eyeCls = night ? 'eye-night' : null;
    setEye(eyeCls);
    currentEyeBase = night ? EYE_BASE['eye-night'] : EYE_BASE['default'];
    startIdleDrift();
    startBlinkLoop(night ? 7000 : 5000, night ? 10000 : 7500, night ? 1000 : 800);
    startNoticeLoop();
    busyUntil = 0;
  }

  /* ---- XP celebration: amount comes from the actual award ---- */
  function doXp(amount) {
    if (Date.now() < busyUntil) return;
    clearAll();
    mood = 'xp';
    setMoodClass('xp');
    busyUntil = Date.now() + 1500;
    setEye('eye-bright');
    currentEyeBase = EYE_BASE['default'];
    try {
      trackAnim(rigTilt.animate([
        { transform: 'translateY(0px) scale(1,1)', offset: 0 },
        { transform: 'translateY(-14px) scale(1.04,1.02)', offset: 0.4 },
        { transform: 'translateY(0px) scale(0.98,1.03)', offset: 0.72 },
        { transform: 'translateY(0px) scale(1,1)', offset: 1 }
      ], { duration: 700, easing: 'cubic-bezier(0.34,1.3,0.64,1)' }));
    } catch (e) {}
    /* show the ACTUAL amount earned */
    xpFloat.textContent = '+' + amount + ' XP';
    xpFloat.classList.remove('go');
    void xpFloat.offsetWidth;
    xpFloat.classList.add('go');
    puff();
    later(goIdle, 1500);
  }

  /* ---- Lesson complete: warm tilt + confetti ---- */
  function doLesson(amount) {
    if (Date.now() < busyUntil) return;
    clearAll();
    mood = 'lesson';
    setMoodClass('lesson');
    busyUntil = Date.now() + 3200;
    setEye('eye-warm');
    currentEyeBase = EYE_BASE['eye-warm'];
    confetti(30);
    try {
      trackAnim(rigTilt.animate([
        { transform: 'rotate(-2deg) scale(1)', offset: 0 },
        { transform: 'rotate(2deg) scale(1.05)', offset: 0.5 },
        { transform: 'rotate(-2deg) scale(1)', offset: 1 }
      ], { duration: 3000, easing: 'ease-in-out' }));
    } catch (e) {}
    if (!RM) startBlinkLoop(3000, 4200, 450);
    later(goIdle, 3200);
  }

  /* ---- First visit: curious ---- */
  function doVisit() {
    if (Date.now() < busyUntil) return;
    clearAll();
    mood = 'visit';
    setMoodClass('visit');
    busyUntil = Date.now() + 3200;
    setEye('eye-alert');
    currentEyeBase = EYE_BASE['eye-alert'];
    try {
      trackAnim(rigTilt.animate([
        { transform: 'rotate(0deg) scale(1)', offset: 0 },
        { transform: 'rotate(-3deg) scale(1.05)', offset: 0.3 },
        { transform: 'rotate(3deg) scale(1.05)', offset: 0.65 },
        { transform: 'rotate(0deg) scale(1)', offset: 1 }
      ], { duration: 3000, easing: 'ease-in-out' }));
    } catch (e) {}
    if (!RM) startBlinkLoop(1800, 2600, 150);
    later(goIdle, 3200);
  }

  /* ---- Tap: wake up, stay alert, then drowse back ---- */
  tap.addEventListener('click', function (e) {
    if (RM || Date.now() < busyUntil) return;
    var WAKE_MS = 4300;
    busyUntil = Date.now() + WAKE_MS;
    var eye = eyeEl();
    var dim = (mood === 'night');
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

  /* ---- particles ---- */
  var puffFn = null, confettiFn = null;
  function puff() { if (puffFn) puffFn(10); }
  function confetti(n) { if (confettiFn) confettiFn(n); }
  (function initParticles() {
    var canvas = document.getElementById('cdcParticles');
    if (!canvas || RM) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, P = [];
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(anyY) {
      return { x: Math.random() * W, y: anyY ? Math.random() * H : H + 4,
        r: 0.5 + Math.random() * 1.1, vy: 0.1 + Math.random() * 0.25,
        sway: Math.random() * 6.28, amp: 2 + Math.random() * 5,
        a: 0.12 + Math.random() * 0.3, green: Math.random() < 0.7, tw: Math.random() * 6.28 };
    }
    puffFn = function (n) {
      var cx = W / 2, cy = H / 2;
      for (var i = 0; i < n; i++) {
        var ang = Math.random() * 6.28, sp = 0.8 + Math.random() * 1.8;
        P.push({ bx: true, x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.4,
          r: 0.8 + Math.random() * 1.4, a: 0.5, life: 1, decay: 0.02 + Math.random() * 0.02, green: Math.random() < 0.75 });
      }
    };
    confettiFn = function (n) {
      var cx = W / 2, cy = H / 2;
      var colors = ['141,235,0', '255,255,255', '212,175,55'];
      for (var i = 0; i < n; i++) {
        var ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        var sp = 1.4 + Math.random() * 3.2;
        P.push({ cf: true, x: cx + (Math.random() - 0.5) * 14, y: cy + (Math.random() - 0.5) * 14,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          w: 2.5 + Math.random() * 3.5, h: 2 + Math.random() * 3,
          rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
          col: colors[(Math.random() * colors.length) | 0], life: 1, decay: 0.008 + Math.random() * 0.008 });
      }
    };
    function frame() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i];
        if (p.cf) {
          p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.985; p.rot += p.vr;
          p.life -= p.decay;
          if (p.life <= 0 || p.y > H + 12) { P.splice(i, 1); continue; }
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = 'rgba(' + p.col + ',' + (p.life * 0.95).toFixed(3) + ')';
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore(); continue;
        }
        if (p.bx) {
          p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy = p.vy * 0.97 + 0.02;
          p.life -= p.decay;
          if (p.life <= 0) { P.splice(i, 1); continue; }
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29);
          ctx.fillStyle = p.green ? 'rgba(141,235,0,' + (p.a * p.life).toFixed(3) + ')'
                                  : 'rgba(255,255,255,' + (p.a * p.life * 0.8).toFixed(3) + ')';
          ctx.fill(); continue;
        }
        p.y -= p.vy; p.sway += 0.01; p.tw += 0.03;
        if (p.y < -6) { P[i] = spawn(false); continue; }
        var al = p.a * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.beginPath(); ctx.arc(p.x + Math.sin(p.sway) * p.amp, p.y, p.r, 0, 6.29);
        ctx.fillStyle = p.green ? 'rgba(141,235,0,' + al.toFixed(3) + ')'
                                : 'rgba(255,255,255,' + (al * 0.8).toFixed(3) + ')';
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener('resize', resize);
    for (var i = 0; i < 10; i++) P.push(spawn(true));
    requestAnimationFrame(frame);
  })();

  /* ---- XP hook: watch the dashboard toast for real XP awards ----
     All dashboard XP flows call showToast() with the amount in the message
     (e.g. '+10 XP · Quick drill complete'). We parse the ACTUAL amount —
     never hardcoded. Lesson completions get the warm celebration. */
  function hookToast() {
    var toast = document.getElementById('toast');
    if (!toast) return;
    var lastMsg = '';
    var obs = new MutationObserver(function () {
      var msg = toast.textContent || '';
      if (msg === lastMsg || !toast.classList.contains('show')) return;
      lastMsg = msg;
      var m = msg.match(/\+(\d+)\s*XP/i);
      if (!m) return;
      var amount = parseInt(m[1], 10);
      if (!amount || amount <= 0) return;
      if (/lesson/i.test(msg)) doLesson(amount);
      else doXp(amount);
    });
    obs.observe(toast, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  /* ---- late night: 10pm–6am local ---- */
  function isLateNight() {
    var h = new Date().getHours();
    return h >= 22 || h < 6;
  }

  /* ---- first visit today ---- */
  function isFirstVisitToday() {
    try {
      var key = 'cdc-first-visit';
      var today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(key) === today) return false;
      localStorage.setItem(key, today);
      return true;
    } catch (e) { return false; }
  }

  /* ---- public API ---- */
  window.CDCompanion = {
    celebrateXP: function (amount) { doXp(amount); },
    lessonComplete: function (amount) { doLesson(amount || 20); },
    firstVisit: function () { doVisit(); },
    goIdle: function () { goIdle(); }
  };

  /* ---- boot ---- */
  night = isLateNight();
  hookToast();
  if (isFirstVisitToday()) {
    goIdle();
    later(doVisit, 1200);
  } else {
    goIdle();
  }
})();
