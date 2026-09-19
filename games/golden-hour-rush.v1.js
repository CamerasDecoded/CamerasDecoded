/* ==========================================================================
   GOLDEN HOUR RUSH v1 — Cameras Decoded game module
   --------------------------------------------------------------------------
   Chase the dying light. The sun sinks for 75 seconds while clouds, haze and
   sunbursts swing the scene EV around — keep the exposure needle in the zone
   with the aperture / shutter / ISO dials. Combo multiplier rewards staying
   locked on; warned light events reward reading the sky.

   Stop math (same engine as Exposure Lab):
     err = log2(N^2 / t) - EVscene - log2(ISO / 100)   [+ = overexposed]

   Perf: procedural canvas, cheap overlay-rect exposure (no ctx.filter),
   pre-rendered grain tiles + hill layers, DPR capped at 2, rAF pausable.
   ========================================================================== */
(function () {
  'use strict';

  var CSS = `
  .ghr-root{--green:#8deb00;--amber:#ffb02e;--card:rgba(255,255,255,.045);--border:rgba(255,255,255,.1);
    --text:#f2f4ef;--muted:rgba(255,255,255,.55);
    --mono:'Space Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
    --sans:'Montserrat',system-ui,-apple-system,sans-serif;
    color:var(--text);font-family:var(--sans);-webkit-font-smoothing:antialiased;}
  .ghr-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}
  .ghr-timer{font-family:var(--mono);font-size:26px;font-weight:700;font-variant-numeric:tabular-nums;}
  .ghr-timer.low{color:#ff5d5d;animation:ghrPulse 1s infinite;}
  @keyframes ghrPulse{50%{opacity:.55;}}
  .ghr-stats{display:flex;gap:8px;align-items:center;}
  .ghr-pill{font-family:var(--mono);font-size:12px;letter-spacing:1px;padding:7px 12px;border-radius:999px;
    border:1px solid var(--border);background:var(--card);color:var(--muted);font-variant-numeric:tabular-nums;}
  .ghr-pill b{color:var(--text);}
  .ghr-pill.combo{border-color:rgba(141,235,0,.45);color:var(--green);}
  .ghr-pill.combo.hot{background:rgba(141,235,0,.14);color:var(--green);font-weight:700;}
  .ghr-vf{position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--border);background:#000;
    box-shadow:0 18px 50px rgba(0,0,0,.5);}
  .ghr-vf canvas{display:block;width:100%;height:auto;}
  .ghr-banner{position:absolute;top:10px;left:50%;transform:translate(-50%,-140%);z-index:3;
    font-family:var(--mono);font-size:12px;letter-spacing:1.5px;white-space:nowrap;
    background:rgba(10,8,4,.82);border:1px solid rgba(255,176,46,.55);color:var(--amber);
    padding:9px 16px;border-radius:999px;transition:transform .35s cubic-bezier(.2,.9,.25,1.2);pointer-events:none;}
  .ghr-banner.on{transform:translate(-50%,0);}
  .ghr-zonelamp{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);z-index:3;
    font-family:var(--mono);font-size:11px;letter-spacing:2px;padding:7px 14px;border-radius:999px;
    background:rgba(0,0,0,.55);border:1px solid var(--border);color:var(--muted);transition:all .2s;pointer-events:none;}
  .ghr-zonelamp.on{color:#06110a;background:var(--green);border-color:var(--green);font-weight:700;
    box-shadow:0 0 18px rgba(141,235,0,.55);}
  .ghr-meter{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:14px 16px;margin:12px 0;}
  .ghr-meterlabel{display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;
    letter-spacing:1px;color:var(--muted);margin-bottom:8px;}
  .ghr-meterlabel output{color:var(--text);font-weight:700;font-variant-numeric:tabular-nums;}
  .ghr-bar{position:relative;height:12px;border-radius:7px;background:linear-gradient(90deg,#3a6ea5,#1c1c22 32%,#1c1c22 68%,#b5892d);}
  .ghr-zone{position:absolute;top:0;bottom:0;left:41.66%;width:16.66%;background:rgba(141,235,0,.22);
    border-left:1px solid rgba(141,235,0,.7);border-right:1px solid rgba(141,235,0,.7);}
  .ghr-needle{position:absolute;top:-4px;width:3px;height:20px;background:#fff;border-radius:2px;
    box-shadow:0 0 8px rgba(255,255,255,.8);transform:translateX(-50%);}
  .ghr-hint{font-size:13px;color:var(--muted);line-height:1.55;min-height:40px;margin:2px 0 4px;}
  .ghr-hint b{color:var(--amber);}
  .ghr-controls{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;}
  .ghr-sblock{margin-bottom:14px;}
  .ghr-sblock:last-child{margin-bottom:0;}
  .ghr-stop{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;}
  .ghr-stop label{font-family:var(--mono);font-size:11px;letter-spacing:2px;color:var(--muted);}
  .ghr-stop output{font-family:var(--mono);font-size:16px;font-weight:700;color:var(--green);font-variant-numeric:tabular-nums;}
  .ghr-controls input[type=range]{width:100%;height:44px;accent-color:var(--green);cursor:pointer;margin:0;background:transparent;}
  .ghr-evline{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--muted);margin-top:2px;}
  .ghr-evline output{color:var(--amber);font-weight:700;}`;

  /* ---------------- exposure engine (shared stop math) ---------------- */
  var APERTURES = [1.8, 2.8, 4, 5.6, 8, 11, 16];
  var SHUTTERS = [
    { label: '1/4000', t: 1 / 4000 }, { label: '1/2000', t: 1 / 2000 },
    { label: '1/1000', t: 1 / 1000 }, { label: '1/500', t: 1 / 500 },
    { label: '1/250', t: 1 / 250 }, { label: '1/125', t: 1 / 125 },
    { label: '1/60', t: 1 / 60 }, { label: '1/30', t: 1 / 30 }, { label: '1/15', t: 1 / 15 }
  ];
  var ISOS = [100, 200, 400, 800, 1600, 3200];
  var LOG2 = Math.log(2);
  function log2(x) { return Math.log(x) / LOG2; }

  /* ---------------- light-event timeline ---------------- */
  // at: seconds in · ev: scene-EV offset · dur: seconds · warn: banner text
  var EVENTS = [
    { at: 12, dur: 8, ev: -1.7, warn: '☁ CLOUD BANK — light dropping' },
    { at: 28, dur: 5, ev: 1.3, warn: '☀ SUNBURST — light surging' },
    { at: 44, dur: 6, ev: -0.7, warn: '🌫 HAZE thickening' },
    { at: 58, dur: 4, ev: 2.0, warn: '🔥 LAST FLARE — hold it!' }
  ];
  var WARN_LEAD = 2.5, RAMP = 1.0;

  function smooth(k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); }
  function eventOffset(ev, t) {
    if (t < ev.at || t > ev.at + ev.dur) return 0;
    var k = smooth(Math.min((t - ev.at) / RAMP, (ev.at + ev.dur - t) / RAMP, 1));
    return ev.ev * k;
  }

  var M = null;
  var styleEl = null;
  var resizeHandler = null;

  function init(stage, config, api) {
    config = config || {};
    var G = window.CDGames;
    var clamp = G.clamp, lerp = G.lerp, el = G.el;

    var DURATION = config.durationSec || 75;
    var PAR = config.par || 1400;
    var ZONE = config.zoneEV || 0.5;
    var EVENTS_ON = config.events !== false;

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    styleEl = style;

    var root = el('div', 'ghr-root');
    root.innerHTML =
      '<div class="ghr-top">' +
        '<div class="ghr-timer" id="ghrTime" aria-label="Time remaining">1:15</div>' +
        '<div class="ghr-stats">' +
          '<div class="ghr-pill">SCORE <b id="ghrScore">0</b></div>' +
          '<div class="ghr-pill combo" id="ghrCombo">×1.0</div>' +
        '</div>' +
      '</div>' +
      '<div class="ghr-vf">' +
        '<canvas id="ghrCanvas" role="img" aria-label="Golden hour landscape. The sun is sinking."></canvas>' +
        '<div class="ghr-banner" id="ghrBanner" aria-live="polite"></div>' +
        '<div class="ghr-zonelamp" id="ghrLamp">● IN THE ZONE</div>' +
      '</div>' +
      '<div class="ghr-meter">' +
        '<div class="ghr-meterlabel"><span>EXPOSURE</span><output id="ghrEvOut">+0.0 EV</output></div>' +
        '<div class="ghr-bar"><div class="ghr-zone"></div><div class="ghr-needle" id="ghrNeedle" style="left:50%"></div></div>' +
      '</div>' +
      '<div class="ghr-hint" id="ghrHint" aria-live="polite"></div>' +
      '<div class="ghr-controls">' +
        '<div class="ghr-sblock"><div class="ghr-stop"><label for="ghrAp">APERTURE</label><output id="ghrApOut">f/5.6</output></div>' +
          '<input type="range" id="ghrAp" min="0" max="6" step="1" value="3" aria-label="Aperture"></div>' +
        '<div class="ghr-sblock"><div class="ghr-stop"><label for="ghrSh">SHUTTER</label><output id="ghrShOut">1/250</output></div>' +
          '<input type="range" id="ghrSh" min="0" max="8" step="1" value="4" aria-label="Shutter speed"></div>' +
        '<div class="ghr-sblock"><div class="ghr-stop"><label for="ghrIso">ISO</label><output id="ghrIsoOut">200</output></div>' +
          '<input type="range" id="ghrIso" min="0" max="5" step="1" value="1" aria-label="ISO"></div>' +
        '<div class="ghr-evline"><span>SCENE <output id="ghrSceneEv">EV 11.5</output></span><span id="ghrSunState">SUN 100%</span></div>' +
      '</div>';
    stage.appendChild(root);

    var canvas = root.querySelector('#ghrCanvas');
    var ctx = canvas.getContext('2d');
    var timeEl = root.querySelector('#ghrTime');
    var scoreEl = root.querySelector('#ghrScore');
    var comboEl = root.querySelector('#ghrCombo');
    var bannerEl = root.querySelector('#ghrBanner');
    var lampEl = root.querySelector('#ghrLamp');
    var needleEl = root.querySelector('#ghrNeedle');
    var evOut = root.querySelector('#ghrEvOut');
    var hintEl = root.querySelector('#ghrHint');
    var sceneEvEl = root.querySelector('#ghrSceneEv');
    var sunEl = root.querySelector('#ghrSunState');

    var apIn = root.querySelector('#ghrAp'), shIn = root.querySelector('#ghrSh'), isoIn = root.querySelector('#ghrIso');
    var apOut = root.querySelector('#ghrApOut'), shOut = root.querySelector('#ghrShOut'), isoOut = root.querySelector('#ghrIsoOut');

    /* ---------------- state ---------------- */
    var S = {
      ai: 3, si: 4, ii: 1,          // dial indices (f/5.6 · 1/250 · ISO 200)
      t: 0,                          // active seconds elapsed
      points: 0, streak: 0, bestStreak: 0, timeInZone: 0,
      ev: EVENTS.map(function () { return { warned: false, zoneT: 0, active: false }; }),
      bannerUntil: 0, lastTickSec: -1,
      smoothErr: 0
    };

    function evScene() {
      var base = lerp(11.5, 7.5, clamp(S.t / DURATION, 0, 1));
      if (!EVENTS_ON) return base;
      var off = 0;
      EVENTS.forEach(function (e) { off += eventOffset(e, S.t); });
      return base + off;
    }
    function errNow() {
      var N = APERTURES[S.ai], t = SHUTTERS[S.si].t, iso = ISOS[S.ii];
      return log2((N * N) / t) - evScene() - log2(iso / 100);
    }

    /* ---------------- scene rendering ---------------- */
    var W = 0, H = 0, DPR = 1, hills = null;
    var grain = G.fx.grainTiles(3, 128), grainIdx = 0, frame = 0;
    var clouds = [], birds = [];
    function resetSky() {
      clouds = [];
      for (var i = 0; i < 5; i++) clouds.push({
        x: Math.random(), y: 0.08 + Math.random() * 0.3,
        s: 0.10 + Math.random() * 0.12, v: 0.004 + Math.random() * 0.008
      });
      birds = [];
      for (var j = 0; j < 3; j++) birds.push({
        x: -0.1 - j * 0.15, y: 0.25 + Math.random() * 0.15, v: 0.03 + Math.random() * 0.02, ph: Math.random() * 6
      });
    }
    function resize() {
      var r = root.querySelector('.ghr-vf').getBoundingClientRect();
      DPR = Math.min(G.env.dpr || 1, 2);
      W = Math.max(280, Math.round(r.width)); H = Math.round(W * 0.62);
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      buildHills();
    }
    function ridge(baseY, amp, seed, color) {
      var c = document.createElement('canvas');
      c.width = Math.max(2, Math.round(W * DPR)); c.height = Math.max(2, Math.round(H * DPR));
      var g = c.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.fillStyle = color; g.beginPath(); g.moveTo(0, H);
      for (var x = 0; x <= W; x += 6) {
        var y = baseY + Math.sin(x * 0.008 + seed) * amp + Math.sin(x * 0.021 + seed * 2) * amp * 0.5;
        g.lineTo(x, y);
      }
      g.lineTo(W, H); g.closePath(); g.fill();
      return c;
    }
    function buildHills() {
      if (!W) return;
      var hz = H * 0.62;
      hills = {
        hz: hz,
        far: ridge(hz - H * 0.06, H * 0.045, 1.7, '#241a20'),
        near: ridge(hz + H * 0.02, H * 0.05, 4.2, '#120d12')
      };
      // lone tree on the near ridge, left of frame
      var g = hills.near.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0);
      var tx = W * 0.24, ty = hz - H * 0.01;
      g.fillStyle = '#0a070a';
      g.fillRect(tx - 2, ty - H * 0.16, 4, H * 0.16);
      for (var i = 0; i < 26; i++) {
        var a = Math.random() * Math.PI * 2, rr = Math.random() * H * 0.055;
        g.beginPath();
        g.arc(tx + Math.cos(a) * rr * 1.5, ty - H * 0.16 + Math.sin(a) * rr * 0.8, 3 + Math.random() * 5, 0, 7);
        g.fill();
      }
    }
    function skyColors(e) { // e: 1 = high sun … 0 = set
      return {
        top: [lerp(29, 42, 1 - e), lerp(58, 38, 1 - e), lerp(110, 74, 1 - e)],
        hor: [lerp(255, 255, 1 - e), lerp(190, 107, 1 - e), lerp(120, 53, 1 - e)]
      };
    }
    function draw(dt) {
      frame++;
      var e = clamp(1 - S.t / DURATION, 0, 1);
      var hz = hills.hz, col = skyColors(e);
      var sky = ctx.createLinearGradient(0, 0, 0, hz * 1.15);
      sky.addColorStop(0, 'rgb(' + (col.top[0] | 0) + ',' + (col.top[1] | 0) + ',' + (col.top[2] | 0) + ')');
      sky.addColorStop(1, 'rgb(' + (col.hor[0] | 0) + ',' + (col.hor[1] | 0) + ',' + (col.hor[2] | 0) + ')');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hz * 1.15);

      // sun + glow
      var sunX = W * 0.68, sunY = hz - e * hz * 0.72, sunR = Math.max(14, W * 0.045);
      if (sunY < hz + sunR * 2) {
        var glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 5);
        var ga = clamp(0.55 + e * 0.3, 0, 0.85);
        glow.addColorStop(0, 'rgba(255,190,90,' + ga + ')');
        glow.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = glow; ctx.fillRect(sunX - sunR * 5, sunY - sunR * 5, sunR * 10, sunR * 5.6);
        if (sunY < hz) {
          ctx.fillStyle = '#ffe9b8';
          ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, 7); ctx.fill();
        }
      }
      // sun shimmer path on the "water" strip
      ctx.fillStyle = 'rgba(255,170,80,.18)';
      ctx.fillRect(sunX - sunR * 0.7, hz, sunR * 1.4, H * 0.05);

      // clouds
      var cloudDark = EVENTS_ON && S.t > 0 ? eventOffset(EVENTS[0], S.t) / -1.7 : 0;
      clouds.forEach(function (c) {
        if (!G.env.reducedMotion) { c.x += c.v * dt; if (c.x > 1.25) c.x = -0.25; }
        var cx = c.x * W, cy = c.y * H, s = c.s * W;
        ctx.fillStyle = 'rgba(60,40,52,' + (0.35 + cloudDark * 0.4) + ')';
        for (var i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.ellipse(cx + i * s * 0.7, cy + Math.abs(i) * s * 0.12, s * 0.75, s * 0.3, 0, 0, 7);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,170,110,.16)';
        ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.12, s * 0.7, s * 0.2, 0, 0, 7); ctx.fill();
      });

      // hills
      ctx.drawImage(hills.far, 0, 0, W, H);
      ctx.drawImage(hills.near, 0, 0, W, H);
      // foreground grass
      ctx.fillStyle = '#070507'; ctx.fillRect(0, H * 0.9, W, H * 0.1);

      // birds (appear once the sun is low)
      if (e < 0.72) birds.forEach(function (b) {
        if (!G.env.reducedMotion) { b.x += b.v * dt; if (b.x > 1.2) { b.x = -0.2; b.y = 0.2 + Math.random() * 0.2; } }
        var bx = b.x * W, by = (b.y + Math.sin(S.t * 2 + b.ph) * 0.008) * H;
        var w = 5 + Math.sin(S.t * 9 + b.ph) * 2.5;
        ctx.strokeStyle = 'rgba(10,8,10,.9)'; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(bx - 7, by); ctx.quadraticCurveTo(bx - 3, by - w, bx, by);
        ctx.quadraticCurveTo(bx + 3, by - w, bx + 7, by); ctx.stroke();
      });

      // exposure feedback — cheap overlay rects, smoothed
      var err = errNow();
      S.smoothErr = lerp(S.smoothErr, err, 1 - Math.pow(0.001, dt)); // ~fast ease
      var se = S.smoothErr;
      if (se > 0.03) { ctx.fillStyle = 'rgba(255,244,220,' + clamp(se * 0.32, 0, 0.8) + ')'; ctx.fillRect(0, 0, W, H); }
      else if (se < -0.03) { ctx.fillStyle = 'rgba(0,0,8,' + clamp(-se * 0.32, 0, 0.82) + ')'; ctx.fillRect(0, 0, W, H); }

      // vignette
      var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.36, W / 2, H / 2, H * 0.95);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

      // ISO grain — pre-rendered tiles, density follows ISO
      var iso = ISOS[S.ii];
      var gAlpha = lerp(0.035, 0.16, log2(iso / 100) / 5);
      if (!G.env.reducedMotion && frame % 8 === 0) grainIdx = (grainIdx + 1) % grain.length;
      ctx.globalAlpha = gAlpha;
      ctx.fillStyle = ctx.createPattern(grain[grainIdx], 'repeat');
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    /* ---------------- HUD ---------------- */
    function fmtTime(s) {
      s = Math.max(0, Math.ceil(s));
      return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
    }
    function refreshDials() {
      apOut.textContent = 'f/' + APERTURES[S.ai];
      shOut.textContent = SHUTTERS[S.si].label;
      isoOut.textContent = ISOS[S.ii];
    }
    function onDial() {
      S.ai = +apIn.value; S.si = +shIn.value; S.ii = +isoIn.value;
      refreshDials();
      G.fx.tap(8);
    }
    apIn.addEventListener('input', onDial);
    shIn.addEventListener('input', onDial);
    isoIn.addEventListener('input', onDial);

    function coachLine(err, inZone) {
      if (S.bannerUntil > S.t) return null; // event banner owns the line
      if (inZone && S.streak > 4) return 'Locked in — <b>ride the light.</b> Small moves now.';
      if (inZone) return 'In the zone. Watch the sky — <b>light is about to move.</b>';
      if (err > ZONE) return 'Too bright — <b>stop down</b>, speed up the shutter, or drop ISO.';
      return 'Too dark — <b>open the aperture</b>, slow the shutter, or raise ISO.';
    }

    /* ---------------- main loop ---------------- */
    var running = false, rafId = 0, last = 0, finished = false;

    function tick(now) {
      if (!running) return;
      rafId = requestAnimationFrame(tick);
      var dt = clamp((now - last) / 1000, 0, 0.1);
      last = now;
      S.t += dt;
      var timeLeft = DURATION - S.t;

      var err = errNow();
      var inZone = Math.abs(err) <= ZONE;

      // scoring
      if (inZone) {
        S.streak += dt; S.timeInZone += dt;
        S.bestStreak = Math.max(S.bestStreak, S.streak);
        var mult = 1 + Math.min(S.streak, 24) / 6;
        S.points += 10 * mult * dt;
      } else {
        if (S.streak > 1.2) { G.blip(330, 120); }
        S.streak = 0;
      }

      // events: warnings, tracking
      if (EVENTS_ON) EVENTS.forEach(function (ev, i) {
        var st = S.ev[i];
        if (!st.warned && S.t >= ev.at - WARN_LEAD) {
          st.warned = true;
          bannerEl.textContent = ev.warn;
          bannerEl.classList.add('on');
          S.bannerUntil = ev.at + ev.dur + 1;
          canvas.setAttribute('aria-label', 'Golden hour landscape. ' + ev.warn);
          G.blip(520, 140); setTimeout(function () { G.blip(660, 160); }, 160);
          G.fx.tap(20);
        }
        if (S.t >= ev.at && S.t <= ev.at + ev.dur) {
          st.active = true;
          if (inZone) st.zoneT += dt;
        } else if (st.active && S.t > ev.at + ev.dur) {
          st.active = false;
        }
        if (S.bannerUntil && S.t > S.bannerUntil) {
          bannerEl.classList.remove('on');
          S.bannerUntil = 0;
        }
      });

      // zone enter ping
      if (inZone && S.streak - dt <= 0) { G.blip(740, 90); G.fx.tap(12); }

      // final countdown ticks
      var whole = Math.ceil(timeLeft);
      if (timeLeft <= 10.5 && whole !== S.lastTickSec && timeLeft > 0) {
        S.lastTickSec = whole; G.blip(1200, 60);
      }

      // HUD
      timeEl.textContent = fmtTime(timeLeft);
      timeEl.classList.toggle('low', timeLeft <= 10.5);
      scoreEl.textContent = Math.round(S.points);
      var multNow = 1 + Math.min(S.streak, 24) / 6;
      comboEl.textContent = '×' + multNow.toFixed(1);
      comboEl.classList.toggle('hot', S.streak >= 6);
      lampEl.classList.toggle('on', inZone);
      needleEl.style.left = (50 + clamp(err / 3, -1, 1) * 50) + '%';
      evOut.textContent = (err >= 0 ? '+' : '') + err.toFixed(1) + ' EV';
      sceneEvEl.textContent = 'EV ' + evScene().toFixed(1);
      sunEl.textContent = 'SUN ' + Math.round(clamp(1 - S.t / DURATION, 0, 1) * 100) + '%';
      var line = coachLine(err, inZone);
      if (line && hintEl._last !== line) { hintEl.innerHTML = line; hintEl._last = line; }

      api.hud({ progress: clamp(S.t / DURATION, 0, 1), label: fmtTime(timeLeft) + ' of light left' });

      draw(dt);

      if (timeLeft <= 0 && !finished) { finished = true; finish(); }
    }

    function finish() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      api.finish();
    }

    function start() {
      resetSky(); resize(); refreshDials();
      hintEl.innerHTML = 'The sun is sinking — <b>keep the needle in the green</b> as the light moves.';
      hintEl._last = hintEl.innerHTML;
      running = true; last = performance.now();
      rafId = requestAnimationFrame(tick);
    }

    /* ---------------- lifecycle ---------------- */
    var onResize = function () { resize(); };
    resizeHandler = onResize;
    window.addEventListener('resize', onResize);

    M = {
      root: root,
      pause: function () { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; },
      resume: function () {
        if (running || finished || !root.isConnected) return;
        running = true; last = performance.now();
        rafId = requestAnimationFrame(tick);
      },
      getSnapshot: function () {
        var score = clamp(Math.round(S.points / PAR * 100), 0, 100);
        var survived = S.ev.filter(function (st, i) { return st.warned && st.zoneT >= EVENTS[i].dur * 0.5; }).length;
        var zonePct = Math.round(S.timeInZone / DURATION * 100);
        return {
          score: score,
          detail: {
            points: Math.round(S.points),
            timeInZoneSec: Math.round(S.timeInZone),
            bestStreakSec: Math.round(S.bestStreak),
            eventsSurvived: survived,
            eventsTotal: EVENTS_ON ? EVENTS.length : 0,
            summary: 'LIGHT HELD ' + zonePct + '% · BEST LOCK ' + Math.round(S.bestStreak) + 's · EVENTS ' + survived + '/' + (EVENTS_ON ? EVENTS.length : 0)
          }
        };
      }
    };

    start();
  }

  function destroy() {
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
    if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    styleEl = null;
    if (M) {
      M.pause();
      if (M.root && M.root.parentNode) M.root.parentNode.removeChild(M.root);
      M = null;
    }
  }

  window.CDGames.register('golden-hour-rush', {
    version: 'v1',
    title: 'Golden Hour Rush',
    init: init,
    destroy: destroy,
    pause: function () { if (M) M.pause(); },
    resume: function () { if (M) M.resume(); },
    getSnapshot: function () { return M ? M.getSnapshot() : { score: 0, detail: {} }; }
  });
})();
