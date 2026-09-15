/* ==========================================================================
   FOCAL LENGTH SNIPER v1 — Cameras Decoded game module
   --------------------------------------------------------------------------
   Read the glass. A dusk street scene renders at a mystery focal length with
   a true pinhole projection (fixed camera position, so FOV + background
   compression are honest optics, not faked). Call the focal length:
   24 / 35 / 50 / 85 / 135 / 200mm. The reveal morphs the scene from your
   guess to the truth — that morph IS the lesson.

   Scoring: exact = 100, ±1 step = 65, ±2 steps = 35, else 15. Average → 0-100.

   Perf: procedural canvas, static scene (rAF only during the reveal morph),
   DPR capped at 2, reduced-motion honored, destroy() tears everything down.
   ========================================================================== */
(function () {
  'use strict';

  var CSS = `
  .fls-root{--green:#8deb00;--amber:#ffb02e;--red:#ff5d5d;--card:rgba(255,255,255,.045);
    --border:rgba(255,255,255,.1);--text:#f2f4ef;--muted:rgba(255,255,255,.55);
    --mono:'Space Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
    --sans:'Montserrat',system-ui,-apple-system,sans-serif;
    color:var(--text);font-family:var(--sans);-webkit-font-smoothing:antialiased;}
  .fls-top{display:flex;justify-content:space-between;gap:10px;margin-bottom:10px;}
  .fls-pill{font-family:var(--mono);font-size:12px;letter-spacing:1px;padding:7px 12px;border-radius:999px;
    border:1px solid var(--border);background:var(--card);color:var(--muted);font-variant-numeric:tabular-nums;}
  .fls-pill b{color:var(--text);}
  .fls-vf{position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--border);
    background:#000;box-shadow:0 18px 50px rgba(0,0,0,.5);}
  .fls-vf canvas{display:block;width:100%;height:auto;}
  .fls-vf::after{content:'';position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.5) 100%);}
  .fls-corner{position:absolute;width:22px;height:22px;z-index:2;pointer-events:none;
    border:2px solid rgba(255,255,255,.35);}
  .fls-corner.tl{top:10px;left:10px;border-right:0;border-bottom:0;border-radius:6px 0 0 0;}
  .fls-corner.tr{top:10px;right:10px;border-left:0;border-bottom:0;border-radius:0 6px 0 0;}
  .fls-corner.bl{bottom:10px;left:10px;border-right:0;border-top:0;border-radius:0 0 0 6px;}
  .fls-corner.br{bottom:10px;right:10px;border-left:0;border-top:0;border-radius:0 0 6px 0;}
  .fls-flbadge{position:absolute;top:12px;left:50%;transform:translateX(-50%);z-index:2;
    font-family:var(--mono);font-size:13px;font-weight:700;letter-spacing:2px;
    background:rgba(0,0,0,.62);border:1px solid var(--border);color:var(--text);
    padding:7px 16px;border-radius:999px;pointer-events:none;font-variant-numeric:tabular-nums;}
  .fls-flbadge.known{border-color:rgba(141,235,0,.6);color:var(--green);}
  .fls-tip{font-size:13px;color:var(--muted);line-height:1.55;min-height:42px;margin:10px 2px;}
  .fls-tip b{color:var(--green);}
  .fls-options{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;}
  .fls-opt{border:1px solid var(--border);background:var(--card);color:var(--text);
    border-radius:14px;padding:14px 0;min-height:56px;cursor:pointer;
    font-family:var(--mono);font-size:17px;font-weight:700;font-variant-numeric:tabular-nums;
    transition:border-color .15s,background .15s,transform .1s;}
  .fls-opt small{display:block;font-size:10px;font-weight:400;color:var(--muted);letter-spacing:1px;margin-top:2px;}
  .fls-opt:active{transform:scale(.96);}
  .fls-opt.sel{border-color:var(--green);background:rgba(141,235,0,.12);color:var(--green);
    box-shadow:0 0 16px rgba(141,235,0,.25);}
  .fls-opt:disabled{opacity:.55;cursor:default;}
  .fls-opt:focus-visible{outline:3px solid var(--green);outline-offset:2px;}
  .fls-shoot{width:100%;border:0;border-radius:14px;background:var(--green);color:#06110a;
    font-family:var(--mono);font-size:16px;font-weight:700;letter-spacing:3px;
    padding:16px;min-height:56px;cursor:pointer;box-shadow:0 4px 0 #5da300;}
  .fls-shoot:active{transform:translateY(3px);box-shadow:0 1px 0 #5da300;}
  .fls-shoot:disabled{opacity:.35;box-shadow:none;cursor:default;}
  .fls-shoot:focus-visible{outline:3px solid var(--green);outline-offset:2px;}
  .fls-reveal{margin-top:12px;border:1px solid rgba(141,235,0,.35);border-radius:16px;
    background:rgba(141,235,0,.06);padding:18px;text-align:center;}
  .fls-reveal[hidden]{display:none;}
  .fls-rkicker{font-family:var(--mono);font-size:11px;letter-spacing:3px;color:var(--green);margin-bottom:8px;}
  .fls-reveal.miss .fls-rkicker{color:var(--amber);}
  .fls-reveal.bad .fls-rkicker{color:var(--red);}
  .fls-rfl{font-family:var(--mono);font-size:52px;font-weight:700;line-height:1;}
  .fls-rfl small{font-size:18px;color:var(--muted);font-weight:400;}
  .fls-rsub{font-size:13px;color:var(--muted);margin:8px 0 14px;line-height:1.5;}
  .fls-next{border:0;border-radius:12px;background:var(--green);color:#06110a;cursor:pointer;
    font-family:var(--mono);font-size:14px;font-weight:700;letter-spacing:2px;
    padding:14px 26px;min-height:52px;box-shadow:0 4px 0 #5da300;}
  .fls-next:active{transform:translateY(3px);box-shadow:0 1px 0 #5da300;}
  @media (prefers-reduced-motion:reduce){
    .fls-opt,.fls-shoot,.fls-next{transition:none !important;}
  }`;

  var HTML = `
  <div class="fls-root">
    <div class="fls-top">
      <div class="fls-pill">TARGET <b id="flsRound">1/8</b></div>
      <div class="fls-pill">SIGNAL <b id="flsScore">–</b></div>
    </div>
    <div class="fls-vf" id="flsVf">
      <canvas id="flsCanvas"></canvas>
      <div class="fls-corner tl"></div><div class="fls-corner tr"></div>
      <div class="fls-corner bl"></div><div class="fls-corner br"></div>
      <div class="fls-flbadge" id="flsBadge">?? mm</div>
    </div>
    <p class="fls-tip" id="flsTip"></p>
    <div class="fls-options" id="flsOptions" role="group" aria-label="Focal length options"></div>
    <button class="fls-shoot" id="flsShoot" disabled>SHOOT</button>
    <div class="fls-reveal" id="flsReveal" hidden>
      <div class="fls-rkicker" id="flsVerdict">CLEAN SIGNAL</div>
      <div class="fls-rfl"><span id="flsTrueFl">135</span><small> mm</small></div>
      <div class="fls-rsub" id="flsRSub"></div>
      <button class="fls-next" id="flsNext">NEXT TARGET →</button>
    </div>
  </div>`;

  /* ---------------- game data ---------------- */
  var OPTIONS = [24, 35, 50, 85, 135, 200];
  var OPT_NAMES = { 24: 'ULTRA WIDE', 35: 'WIDE', 50: 'NORMAL', 85: 'PORTRAIT', 135: 'TELE', 200: 'SUPER TELE' };
  var ROUND_SCORE = [100, 65, 35, 15]; // by steps missed, capped
  var TIPS = [
    'Long glass <b>compresses</b> the background — a huge moon means telephoto.',
    'Wide glass <b>shrinks</b> the background and stretches the foreground.',
    'Same spot, different lens. Only the glass changed.',
    'Foreground bokeh <b>balloons</b> at wide focal lengths.',
    'If the subject fills the frame from back here, you are long.',
    'At 24mm the street feels endless. At 200mm it collapses.',
    'Read the <b>moon</b> — it never lies about focal length.'
  ];

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }


  /* Module instance state (fresh per init, fully dropped on destroy) */
  var M = null;

  function init(stage, config, api) {
    config = config || {};
    var ROUNDS = config.rounds || 8;

    var root = document.createElement('div');
    var style = document.createElement('style');
    style.textContent = CSS;
    root.appendChild(style);
    var body = document.createElement('div');
    body.innerHTML = HTML;
    root.appendChild(body);
    stage.appendChild(root);

    function $(id) { return root.querySelector('#' + id); }

    var cv = $('flsCanvas'), ctx = cv.getContext('2d');
    var badge = $('flsBadge'), tipEl = $('flsTip'), optBox = $('flsOptions');
    var shootBtn = $('flsShoot'), reveal = $('flsReveal');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var W = 0, H = 0, horizonY = 0, K = 13; // K: px per focal-mm per meter, scaled to canvas
    function sizeCanvas() {
      var cw = cv.clientWidth || 360;
      W = Math.round(cw * DPR); H = Math.round(cw * 2 / 3 * DPR);
      cv.width = W; cv.height = H;
      horizonY = H * 0.60;
      K = W / 28;
    }

    /* ---- pinhole projection: fixed camera, honest optics ----
       x: meters right of lens axis · y: meters above lens height ·
       z: meters forward. f: focal length in mm (35mm-equiv). */
    function P(x, y, z, f) {
      var s = f * K / z;
      return { x: W / 2 + x * s, y: horizonY - y * s, s: s };
    }

    /* ---------------- scene ---------------- */
    var scene = { stars: [], buildings: [], seed: 1 };

    function buildScene(roundIdx) {
      var rnd = mulberry32(1234 + roundIdx * 777);
      scene.seed = roundIdx;
      scene.stars = [];
      for (var i = 0; i < 70; i++) {
        scene.stars.push({ x: rnd(), y: rnd() * 0.55, r: 0.6 + rnd() * 1.4, a: 0.25 + rnd() * 0.6 });
      }
      scene.buildings = [];
      for (var b = -4; b <= 4; b++) {
        var bw = 5 + rnd() * 3, bh = 8 + rnd() * 12;
        var wins = [];
        for (var wy = 0; wy < 4; wy++) for (var wx = 0; wx < 3; wx++) {
          if (rnd() < 0.38) wins.push({ wx: wx, wy: wy });
        }
        scene.buildings.push({ x: b * 7 + (rnd() - 0.5) * 3, z: 60, w: bw, h: bh, wins: wins });
      }
    }

    function drawSky(f) {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#05081a');
      g.addColorStop(0.42, '#0c1428');
      g.addColorStop(0.58, '#2b1f38');
      g.addColorStop(0.62, '#57332c');
      g.addColorStop(0.66, '#0a0a0e');
      g.addColorStop(1, '#060607');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // stars (fixed sky positions — effectively at infinity)
      var i, s;
      for (i = 0; i < scene.stars.length; i++) {
        s = scene.stars[i];
        ctx.globalAlpha = s.a;
        ctx.fillStyle = '#cdd8ff';
        ctx.fillRect(s.x * W, s.y * H, s.r, s.r);
      }
      ctx.globalAlpha = 1;
    }

    function drawMoon(f) {
      // moon at fixed sky direction — its size vs. the scene is the compression lesson
      var az = -0.055, el = 0.088; // radians
      var mx = W / 2 + Math.tan(az) * f * K;
      var my = horizonY - Math.tan(el) * f * K;
      var d = 0.0093 * f * K; // ~0.53° angular diameter, honest scale
      if (d < 1.2) d = 1.2;
      var glow = ctx.createRadialGradient(mx, my, d * 0.4, mx, my, d * 3);
      glow.addColorStop(0, 'rgba(235,240,255,.85)');
      glow.addColorStop(0.25, 'rgba(220,228,255,.28)');
      glow.addColorStop(1, 'rgba(220,228,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(mx, my, d * 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#eef1ff';
      ctx.beginPath(); ctx.arc(mx, my, d / 2, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(190,200,230,.5)';
      ctx.beginPath(); ctx.arc(mx - d * 0.12, my - d * 0.08, d * 0.32, 0, 7); ctx.fill();
    }

    function drawBuildings(f) {
      var i, b, p1, p2, pTop;
      for (i = 0; i < scene.buildings.length; i++) {
        b = scene.buildings[i];
        p1 = P(b.x - b.w / 2, 0, b.z, f);
        p2 = P(b.x + b.w / 2, 0, b.z, f);
        pTop = P(b.x, b.h, b.z, f);
        if (p2.x < -50 || p1.x > W + 50) continue;
        ctx.fillStyle = '#0b0d14';
        ctx.fillRect(p1.x, pTop.y, p2.x - p1.x, p1.y - pTop.y);
        // lit windows
        var ww = (p2.x - p1.x) / 4, wh = (p1.y - pTop.y) / 5.5;
        ctx.fillStyle = 'rgba(255,190,110,.75)';
        for (var k = 0; k < b.wins.length; k++) {
          var wn = b.wins[k];
          var wxp = p1.x + ww * (0.7 + wn.wx), wyp = pTop.y + wh * (0.8 + wn.wy);
          ctx.fillRect(wxp, wyp, ww * 0.42, wh * 0.42);
        }
      }
    }

    function lampGlow(x, z, f, warm) {
      var base = P(x, 0, z, f), top = P(x, 4.4, z, f);
      ctx.strokeStyle = '#101218';
      ctx.lineWidth = Math.max(1.5, 0.09 * top.s);
      ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(top.x, top.y); ctx.stroke();
      var r = Math.max(3, f * K * 0.016);
      var g = ctx.createRadialGradient(top.x, top.y, 1, top.x, top.y, r * 3);
      var col = warm ? '255,176,90' : '150,200,255';
      g.addColorStop(0, 'rgba(' + col + ',.9)');
      g.addColorStop(0.3, 'rgba(' + col + ',.32)');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(top.x, top.y, r * 3, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,170,.95)';
      ctx.beginPath(); ctx.arc(top.x, top.y, Math.max(1.5, r * 0.45), 0, 7); ctx.fill();
    }

    function drawSubject(f) {
      // photographer silhouette with tripod, 8m out — the anchor of every frame
      var z = 8, x0 = 0.4;
      function L(x1, y1, x2, y2, wdt) {
        var a = P(x1, y1, z, f), b = P(x2, y2, z, f);
        ctx.strokeStyle = '#040406';
        ctx.lineWidth = Math.max(1.5, wdt * a.s);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      // tripod legs
      L(x0, 1.1, x0 - 0.45, 0, 0.05); L(x0, 1.1, x0 + 0.45, 0, 0.05); L(x0, 1.1, x0, 0, 0.05);
      // body
      var sh = P(x0 - 0.30, 0.55, z, f), sh2 = P(x0 + 0.30, 1.75, z, f);
      ctx.fillStyle = '#040406';
      roundRect(sh.x, sh2.y, sh2.x - sh.x, sh.y - sh2.y, Math.min(8, sh2.x - sh.x));
      ctx.fill();
      // head
      var hp = P(x0 + 0.02, 1.92, z, f);
      ctx.beginPath(); ctx.arc(hp.x, hp.y, Math.max(2, 0.15 * hp.s), 0, 7); ctx.fill();
      // camera box on tripod head
      var cp = P(x0, 1.18, z, f);
      ctx.fillRect(cp.x - 0.16 * cp.s, cp.y - 0.10 * cp.s, 0.32 * cp.s, 0.20 * cp.s);
      // green rim light on the shadow side
      ctx.strokeStyle = 'rgba(141,235,0,.55)';
      ctx.lineWidth = Math.max(1, 0.02 * sh.s);
      ctx.beginPath(); ctx.moveTo(sh.x, sh2.y + 4); ctx.lineTo(sh.x, sh.y - 4); ctx.stroke();
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function bokehOrb(x, z, f, col) {
      var p = P(x, 0.4, z, f);
      var r = Math.min(W * 0.42, 0.34 * f * K);
      if (r < 4) return;
      var g = ctx.createRadialGradient(p.x, p.y, r * 0.1, p.x, p.y, r);
      g.addColorStop(0, 'rgba(' + col + ',.20)');
      g.addColorStop(0.7, 'rgba(' + col + ',.10)');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(' + col + ',.16)';
      ctx.lineWidth = Math.max(1, r * 0.06);
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.82, 0, 7); ctx.stroke();
    }

    function render(f) {
      if (!W) sizeCanvas();
      ctx.clearRect(0, 0, W, H);
      drawSky(f);
      drawMoon(f);
      drawBuildings(f);
      lampGlow(-4.5, 15, f, true);
      lampGlow(5.5, 26, f, false);
      drawSubject(f);
      bokehOrb(-1.7, 2.5, f, '255,176,90');
      bokehOrb(1.9, 3.1, f, '150,200,255');
    }

    /* ---------------- game state ---------------- */
    var round = 0, trueIdx = -1, selIdx = -1, lastFlIdx = -1;
    var shownF = 50; // focal length currently on screen (never leaks the answer early)
    var scores = [], exactCount = 0, missMmTotal = 0, missCount = 0;
    var locked = false, finished = false, destroyed = false;
    var rafId = 0, morph = null, paused = false;
    var tipIdx = -1;

    function blip(fq, dur) {
      try { if (window.CDGames) window.CDGames.blip(fq, dur); } catch (e) {}
    }

    function pickTip() {
      var i;
      do { i = Math.floor(Math.random() * TIPS.length); } while (i === tipIdx);
      tipIdx = i;
      tipEl.innerHTML = TIPS[i];
    }

    function buildOptions() {
      optBox.innerHTML = '';
      OPTIONS.forEach(function (fl, i) {
        var b = document.createElement('button');
        b.className = 'fls-opt';
        b.type = 'button';
        b.innerHTML = fl + '<small>' + OPT_NAMES[fl] + '</small>';
        b.setAttribute('aria-label', 'Guess ' + fl + ' millimeters, ' + OPT_NAMES[fl]);
        b.addEventListener('click', function () { select(i); });
        optBox.appendChild(b);
      });
    }

    function select(i) {
      if (locked || finished || destroyed) return;
      selIdx = i;
      var btns = optBox.querySelectorAll('.fls-opt');
      for (var k = 0; k < btns.length; k++) btns[k].classList.toggle('sel', k === i);
      shootBtn.disabled = false;
      blip(660, 60);
    }

    function newRound() {
      round++;
      locked = false; selIdx = -1;
      var i;
      do { i = Math.floor(Math.random() * OPTIONS.length); } while (i === lastFlIdx);
      lastFlIdx = i; trueIdx = i;
      buildScene(round);
      stopMorph();
      shownF = OPTIONS[trueIdx];
      render(shownF);
      badge.textContent = '?? mm';
      badge.classList.remove('known');
      $('flsRound').textContent = round + '/' + ROUNDS;
      updateScorePill();
      buildOptions();
      pickTip();
      shootBtn.disabled = true;
      shootBtn.textContent = 'SHOOT';
      reveal.hidden = true;
      if (api && api.hud) api.hud({ progress: (round - 1) / ROUNDS, label: 'TARGET ' + round + '/' + ROUNDS });
    }

    function updateScorePill() {
      $('flsScore').textContent = scores.length
        ? Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length)
        : '–';
    }

    function shoot() {
      if (locked || finished || destroyed || selIdx < 0) return;
      locked = true;
      shootBtn.disabled = true;
      shootBtn.textContent = 'DEVELOPING…';
      var btns = optBox.querySelectorAll('.fls-opt');
      for (var k = 0; k < btns.length; k++) btns[k].disabled = true;
      blip(440, 120);
      setTimeout(function () { if (!destroyed) revealRound(); }, reduceMotion ? 60 : 450);
    }

    function revealRound() {
      var guessFl = OPTIONS[selIdx], trueFl = OPTIONS[trueIdx];
      var steps = Math.abs(selIdx - trueIdx);
      var mmOff = Math.abs(guessFl - trueFl);
      var pts = ROUND_SCORE[Math.min(steps, 3)];
      scores.push(pts);
      if (steps === 0) exactCount++;
      else { missMmTotal += mmOff; missCount++; }

      var verdict, cls, line;
      if (steps === 0) {
        verdict = 'CLEAN SIGNAL'; cls = ''; line = 'Nailed it — that is the glass.';
        blip(880, 120); setTimeout(function () { blip(1320, 180); }, 130);
      } else if (steps === 1) {
        verdict = 'CLOSE'; cls = 'miss'; line = mmOff + 'mm off — the background told the story.';
        blip(520, 140);
      } else if (steps === 2) {
        verdict = 'DRIFTING'; cls = 'miss'; line = mmOff + 'mm off. Watch the compression.';
        blip(330, 160);
      } else {
        verdict = 'NOISY SIGNAL'; cls = 'bad'; line = mmOff + 'mm off. Reset and read the light again.';
        blip(220, 220);
      }

      $('flsVerdict').textContent = verdict;
      $('flsTrueFl').textContent = trueFl;
      $('flsRSub').textContent = 'Your call: ' + guessFl + 'mm · ' + line;
      reveal.className = 'fls-reveal' + (cls ? ' ' + cls : '');
      reveal.hidden = false;
      badge.textContent = trueFl + ' mm';
      badge.classList.add('known');
      $('flsNext').textContent = round >= ROUNDS ? 'SEE RESULTS →' : 'NEXT TARGET →';
      updateScorePill();
      if (api && api.hud) api.hud({ progress: round / ROUNDS, label: 'TARGET ' + round + '/' + ROUNDS });

      // the lesson: morph the scene from the guess to the truth
      if (steps > 0 && !reduceMotion) startMorph(guessFl, trueFl);
      else {
        shownF = trueFl;
        if (api && api.toast) api.toast(steps === 0 ? 'Exact focal length.' : 'True: ' + trueFl + 'mm.');
      }

      try { reveal.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' }); } catch (e) {}
    }

    function startMorph(fromF, toF) {
      stopMorph();
      morph = { fromF: fromF, toF: toF, t0: performance.now(), dur: 900 };
      function frame(now) {
        if (destroyed || paused || !morph) return;
        var t = Math.min(1, (now - morph.t0) / morph.dur);
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        shownF = morph.fromF + (morph.toF - morph.fromF) * e;
        render(shownF);
        if (t < 1) rafId = requestAnimationFrame(frame);
        else { shownF = morph.toF; morph = null; }
      }
      rafId = requestAnimationFrame(frame);
    }

    function stopMorph() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0; morph = null;
    }

    function next() {
      if (finished || destroyed) return;
      blip(660, 60);
      if (round >= ROUNDS) {
        finished = true;
        if (api && api.toast) api.toast('Drill complete — signal logged.');
        setTimeout(function () { if (api) api.finish(); }, 700);
      } else {
        newRound();
      }
    }

    function getSnapshot() {
      var avg = scores.length
        ? Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length)
        : 0;
      var avgMiss = missCount ? Math.round(missMmTotal / missCount) : 0;
      return {
        score: avg,
        detail: {
          summary: 'EXACT ' + exactCount + '/' + scores.length + ' · AVG MISS ' + avgMiss + 'mm',
          exact: exactCount,
          roundsDone: scores.length
        }
      };
    }

    function onResize() {
      sizeCanvas();
      render(shownF);
    }

    function destroy() {
      destroyed = true;
      stopMorph();
      window.removeEventListener('resize', onResize);
      try { if (root.parentNode) root.parentNode.removeChild(root); } catch (e) {}
    }

    shootBtn.addEventListener('click', shoot);
    $('flsNext').addEventListener('click', next);
    window.addEventListener('resize', onResize);

    sizeCanvas();
    newRound();

    M = {
      pause: function () { paused = true; if (rafId) cancelAnimationFrame(rafId); rafId = 0; },
      resume: function () {
        if (!paused) return;
        paused = false;
        if (morph) { var m = morph; morph = null; startMorph(m.fromF, m.toF); }
      },
      getSnapshot: getSnapshot,
      destroy: destroy
    };
  }
  function destroy() { if (M) { M.destroy(); M = null; } }

  window.CDGames.register('focal-length-sniper', {
    version: 'v1',
    title: 'Focal Length Sniper',
    init: init,
    destroy: destroy,
    pause: function () { if (M) M.pause(); },
    resume: function () { if (M) M.resume(); },
    getSnapshot: function () { return M ? M.getSnapshot() : { score: 0, detail: {} }; }
  });
})();
