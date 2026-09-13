/* ==========================================================================
   EXPOSURE LAB v1 — Cameras Decoded game module
   --------------------------------------------------------------------------
   The exposure-triangle simulator: procedural blue-hour city, real stop math,
   aperture bokeh, shutter motion ghosts, ISO grain, live histogram, scored
   assignments.

   Perf notes (vs the standalone prototype):
     - Exposure is applied with a cheap overlay rect, NOT ctx.filter
       brightness (per-frame ctx.filter is expensive and spotty on iOS).
     - The one-time bokeh blur on aperture change is guarded for old browsers.
     - rAF loop is pausable/resumable; destroy() tears everything down.
   ========================================================================== */
(function () {
  'use strict';

  var CSS = `
  .xl-root{--green:#8deb00;--card:rgba(255,255,255,.045);--border:rgba(255,255,255,.1);
    --text:#f2f4ef;--muted:rgba(255,255,255,.55);
    --mono:'Space Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
    --sans:'Montserrat',system-ui,-apple-system,sans-serif;
    color:var(--text);font-family:var(--sans);-webkit-font-smoothing:antialiased;}
  .xl-brief{background:linear-gradient(135deg,rgba(141,235,0,.1),var(--card) 60%);
    border:1px solid rgba(141,235,0,.3);border-radius:16px;padding:14px 16px;margin-bottom:12px;}
  .xl-kicker{font-family:var(--mono);font-size:10px;letter-spacing:3px;color:var(--green);margin-bottom:6px;}
  .xl-brief h2{margin:0 0 6px;font-size:18px;}
  .xl-brief p{margin:0;font-size:13px;color:var(--muted);line-height:1.6;}
  .xl-tabs{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}
  .xl-tab{font-family:var(--mono);font-size:11px;letter-spacing:1px;background:transparent;color:var(--muted);
    border:1px solid var(--border);border-radius:999px;padding:8px 14px;cursor:pointer;}
  .xl-tab.active{color:#06110a;background:var(--green);border-color:var(--green);font-weight:700;}
  .xl-stage{display:grid;grid-template-columns:1fr;gap:12px;}
  @media(min-width:900px){.xl-stage{grid-template-columns:1.5fr 1fr;}}
  .xl-vf{position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--border);background:#000;
    box-shadow:0 18px 50px rgba(0,0,0,.5);}
  .xl-vf canvas{display:block;width:100%;height:auto;}
  .xl-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .35s ease-out;}
  .xl-flash.go{opacity:.9;transition:opacity .03s;}
  .xl-scope{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:12px 14px;}
  .xl-scope h3{font-family:var(--mono);font-size:11px;letter-spacing:2.5px;color:var(--muted);margin:0 0 10px;font-weight:400;}
  .xl-scope h3 b{color:var(--green);font-weight:700;}
  .xl-hist{width:100%;height:86px;display:block;border-radius:8px;background:#0a0c0a;}
  .xl-clip{font-family:var(--mono);font-size:11px;margin-top:8px;color:var(--muted);}
  .xl-clip.bad{color:#ff5d5d;} .xl-clip.good{color:var(--green);}
  .xl-controls{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;}
  .xl-sblock{margin-bottom:16px;}
  .xl-stop{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;}
  .xl-stop label{font-family:var(--mono);font-size:11px;letter-spacing:2px;color:var(--muted);}
  .xl-stop output{font-family:var(--mono);font-size:16px;font-weight:700;color:var(--green);font-variant-numeric:tabular-nums;}
  .xl-controls input[type=range]{width:100%;height:44px;accent-color:var(--green);cursor:pointer;margin:0;background:transparent;}
  .xl-stopsline{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--muted);margin-top:2px;}
  .xl-meterwrap{margin:12px 0 6px;}
  .xl-meterlabel{display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;letter-spacing:1px;color:var(--muted);margin-bottom:6px;}
  .xl-meterlabel output{color:var(--text);font-weight:700;}
  .xl-meter{position:relative;height:10px;border-radius:6px;background:linear-gradient(90deg,#3a6ea5,#222 30%,#222 70%,#b5892d);}
  .xl-needle{position:absolute;top:-5px;width:3px;height:20px;background:var(--green);border-radius:2px;
    box-shadow:0 0 8px var(--green);transform:translateX(-50%);transition:left .12s linear;}
  .xl-hint{font-size:13px;color:var(--muted);line-height:1.55;min-height:42px;margin:10px 0 14px;}
  .xl-hint b{color:var(--text);}
  .xl-photo{width:100%;padding:18px;border:none;border-radius:14px;cursor:pointer;background:var(--green);color:#06110a;
    font-family:var(--mono);font-weight:700;font-size:15px;letter-spacing:3px;
    box-shadow:0 6px 0 #5da300,0 12px 28px rgba(141,235,0,.25);transition:transform .06s,box-shadow .06s;}
  .xl-photo:active{transform:translateY(4px);box-shadow:0 2px 0 #5da300;}
  .xl-result{margin-top:14px;border-radius:16px;padding:18px;border:1px solid var(--border);background:var(--card);}
  .xl-result.hidden{display:none;}
  .xl-result.pass{border-color:rgba(141,235,0,.45);background:linear-gradient(135deg,rgba(141,235,0,.12),var(--card) 65%);}
  .xl-result.fail{border-color:rgba(255,93,93,.4);}
  .xl-scorerow{display:flex;align-items:center;gap:16px;margin-bottom:12px;}
  .xl-scorenum{font-family:var(--mono);font-size:44px;font-weight:700;color:var(--green);line-height:1;}
  .xl-result.fail .xl-scorenum{color:#ff5d5d;}
  .xl-scorerow h3{margin:0 0 4px;font-size:17px;}
  .xl-scorerow p{margin:0;font-size:13px;color:var(--muted);}
  .xl-checks{list-style:none;margin:0 0 14px;padding:0;}
  .xl-checks li{font-size:13.5px;padding:8px 0;border-top:1px solid rgba(255,255,255,.07);color:var(--muted);}
  .xl-checks li b{color:var(--text);}
  .xl-ok{color:var(--green);font-weight:700;margin-right:8px;}
  .xl-no{color:#ff5d5d;font-weight:700;margin-right:8px;}
  .xl-rbtns{display:flex;gap:10px;}
  .xl-ghost{flex:1;padding:14px;border-radius:12px;cursor:pointer;background:transparent;color:var(--text);
    border:1px solid var(--border);font-family:var(--mono);font-size:12px;letter-spacing:2px;}
  .xl-ghost.primary{background:var(--green);color:#06110a;border-color:var(--green);font-weight:700;}
  .xl-foot{margin-top:14px;font-size:11.5px;color:var(--muted);line-height:1.7;font-family:var(--mono);}
  .xl-foot b{color:var(--green);}
  `;

  var HTML = `
  <div class="xl-brief">
    <div class="xl-kicker">ASSIGNMENT</div>
    <h2 id="xl-btitle"></h2>
    <p id="xl-bdesc"></p>
    <div class="xl-tabs" id="xl-btabs"></div>
  </div>
  <div class="xl-stage">
    <div>
      <div class="xl-vf">
        <canvas id="xl-scene" width="900" height="600"></canvas>
        <div class="xl-flash" id="xl-flash"></div>
      </div>
      <div style="height:12px"></div>
      <div class="xl-scope">
        <h3>LIVE HISTOGRAM <b>·</b> TRUST THE SCOPES, NOT THE SCREEN</h3>
        <canvas id="xl-hist" class="xl-hist" width="600" height="86"></canvas>
        <div class="xl-clip" id="xl-clip">Sampling pixels…</div>
      </div>
    </div>
    <div class="xl-controls">
      <div class="xl-sblock">
        <div class="xl-stop"><label>APERTURE</label><output id="xl-apv"></output></div>
        <input type="range" id="xl-ap" min="0" max="6" step="1" value="2" aria-label="Aperture">
        <div class="xl-stopsline"><span>f/1.8 · max bokeh</span><span>f/16 · deep focus</span></div>
      </div>
      <div class="xl-sblock">
        <div class="xl-stop"><label>SHUTTER</label><output id="xl-shv"></output></div>
        <input type="range" id="xl-sh" min="0" max="7" step="1" value="4" aria-label="Shutter speed">
        <div class="xl-stopsline"><span>1/4000 · freeze</span><span>1/30 · motion streaks</span></div>
      </div>
      <div class="xl-sblock">
        <div class="xl-stop"><label>ISO</label><output id="xl-isov"></output></div>
        <input type="range" id="xl-iso" min="0" max="6" step="1" value="2" aria-label="ISO">
        <div class="xl-stopsline"><span>100 · clean</span><span>6400 · grain</span></div>
      </div>
      <div class="xl-meterwrap">
        <div class="xl-meterlabel"><span>EXPOSURE METER</span><output id="xl-meterv">0.0 EV</output></div>
        <div class="xl-meter"><div class="xl-needle" id="xl-needle" style="left:50%"></div></div>
      </div>
      <div class="xl-hint" id="xl-hint"></div>
      <button class="xl-photo" id="xl-photo">TAKE PHOTO</button>
      <div class="xl-result hidden" id="xl-result"></div>
    </div>
  </div>
  <p class="xl-foot">Real stop math under the hood: <b>error = log₂(N²/t) − EVscene − log₂(ISO/100)</b>. Histogram is sampled from the actual rendered pixels.</p>
  `;

  var APERTURES = [1.8, 2.8, 4, 5.6, 8, 11, 16];
  var SHUTTERS = [
    { t: 1 / 4000, label: '1/4000' }, { t: 1 / 2000, label: '1/2000' },
    { t: 1 / 1000, label: '1/1000' }, { t: 1 / 500, label: '1/500' },
    { t: 1 / 250, label: '1/250' }, { t: 1 / 125, label: '1/125' },
    { t: 1 / 60, label: '1/60' }, { t: 1 / 30, label: '1/30' }
  ];
  var ISOS = [100, 200, 400, 800, 1600, 3200, 6400];

  var ALL_BRIEFS = [
    {
      id: 'bokeh', title: 'Melt the background',
      desc: 'Blue-hour street portrait. Isolate the drone against the city lights: turn the background into creamy bokeh orbs while holding correct exposure.',
      checks: [
        {
          label: 'Background melted (f/2.8 or wider)', test: function (s) { return s.N <= 2.8; },
          tip: 'Open the aperture to f/2.8 or wider — depth of field collapses as the iris opens.'
        },
        {
          label: 'Exposure within ±0.5 EV', test: function (s) { return Math.abs(s.err) <= 0.5; },
          tip: 'Balance the triangle: the meter needle must sit near center.'
        }
      ]
    },
    {
      id: 'freeze', title: 'Freeze the drone mid-flight',
      desc: 'It is moving fast across the frame. Stop the motion dead — no streaks, no ghosts — without blowing the exposure.',
      checks: [
        {
          label: 'Motion frozen (1/500s or faster)', test: function (s) { return s.t <= 1 / 500; },
          tip: 'A fast-moving subject needs 1/500s or faster. Trade ISO or aperture to keep exposure.'
        },
        {
          label: 'Exposure within ±0.5 EV', test: function (s) { return Math.abs(s.err) <= 0.5; },
          tip: 'Fast shutter starves the sensor — compensate with wider aperture or higher ISO.'
        }
      ]
    },
    {
      id: 'balance', title: 'Nail blue hour, your way',
      desc: 'No aperture or shutter target this time — just a perfect exposure, however you get there. Every stop has a tradeoff. Choose yours.',
      checks: [
        {
          label: 'Exposure within ±0.33 EV', test: function (s) { return Math.abs(s.err) <= 0.33; },
          tip: 'Within a third of a stop. Watch the histogram, not the preview.'
        },
        {
          label: 'ISO kept at 1600 or below', test: function (s) { return s.iso <= 1600; },
          tip: 'Grain is a tradeoff, not a free lunch. Find the light with glass and time instead.'
        }
      ]
    }
  ];

  /* Module instance state (fresh per init, fully dropped on destroy) */
  var M = null;

  function init(stage, config, api) {
    config = config || {};
    var BRIEFS = ALL_BRIEFS.filter(function (b) {
      return !config.briefs || config.briefs.indexOf(b.id) !== -1;
    });
    if (!BRIEFS.length) BRIEFS = ALL_BRIEFS.slice();
    var EV_SCENE = config.evScene || 8;

    var root = document.createElement('div');
    root.className = 'xl-root';
    var style = document.createElement('style');
    style.textContent = CSS;
    root.appendChild(style);
    var body = document.createElement('div');
    body.innerHTML = HTML;
    root.appendChild(body);
    stage.appendChild(root);

    function $(id) { return root.querySelector('#' + id); }

    var state = { ai: 2, si: 4, ii: 2, brief: 0 };
    var best = {};       // briefId -> best score
    var finished = false;
    var rafId = 0, running = false, frame = 0;

    function settings() {
      var N = APERTURES[state.ai], t = SHUTTERS[state.si].t, iso = ISOS[state.ii];
      var err = Math.log2((N * N) / t) - EV_SCENE - Math.log2(iso / 100);
      return { N: N, t: t, iso: iso, err: err };
    }

    /* ---------- canvas setup ---------- */
    var W = 900, H = 600;
    var scene = $('xl-scene');
    var ctx = scene.getContext('2d');

    var skyC = document.createElement('canvas'); skyC.width = W; skyC.height = H;
    (function paintSky() {
      var g = skyC.getContext('2d');
      var grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0a1626');
      grad.addColorStop(0.55, '#0b1f24');
      grad.addColorStop(1, '#060a08');
      g.fillStyle = grad; g.fillRect(0, 0, W, H);
      g.fillStyle = '#04070c';
      var x = 0, seed = 7;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      while (x < W) { var bw = 40 + rnd() * 90, bh = 60 + rnd() * 150; g.fillRect(x, H - bh - 40, bw, bh); x += bw + rnd() * 30; }
      g.fillStyle = 'rgba(255,190,90,.5)';
      for (var i = 0; i < 60; i++) { g.fillRect(rnd() * W, H - 60 - rnd() * 140, 3, 4); }
    })();

    var HUES = [38, 45, 190, 160, 95, 25, 200];
    var farDots = [], midDots = [];
    (function seedDots() {
      var seed = 42;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      var i;
      for (i = 0; i < 34; i++) farDots.push({ x: rnd(), y: 0.08 + rnd() * 0.6, r: 6 + rnd() * 22, h: HUES[(rnd() * HUES.length) | 0], a: 0.25 + rnd() * 0.5 });
      for (i = 0; i < 16; i++) midDots.push({ x: rnd(), y: 0.15 + rnd() * 0.65, r: 18 + rnd() * 42, h: HUES[(rnd() * HUES.length) | 0], a: 0.3 + rnd() * 0.5 });
    })();

    function paintBokehLayer(dots, scale, blurPx) {
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var g = c.getContext('2d');
      dots.forEach(function (d) {
        var r = d.r * scale, x = d.x * W, y = d.y * H;
        var grad = g.createRadialGradient(x, y, 0, x, y, r);
        var col = 'hsla(' + d.h + ',90%,62%,';
        grad.addColorStop(0, col + (d.a * 0.9) + ')');
        grad.addColorStop(0.55, col + (d.a * 0.45) + ')');
        grad.addColorStop(1, col + '0)');
        g.fillStyle = grad;
        g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
        if (scale > 1.15) {
          g.fillStyle = 'hsla(' + d.h + ',95%,80%,' + (d.a * 0.55) + ')';
          g.beginPath(); g.arc(x, y, r * 0.28, 0, 6.2832); g.fill();
        }
      });
      if (blurPx > 0.5) {
        try {
          var soft = document.createElement('canvas'); soft.width = W; soft.height = H;
          var sg = soft.getContext('2d');
          sg.filter = 'blur(' + blurPx + 'px)';
          sg.drawImage(c, 0, 0);
          return soft;
        } catch (e) { /* old browser: fall through unblurred */ }
      }
      return c;
    }

    var farLayer = null, midLayer = null;
    function renderBokehLayers() {
      var N = APERTURES[state.ai];
      var openness = Math.log2(16 / N) / Math.log2(16 / 1.8);
      farLayer = paintBokehLayer(farDots, 0.7 + openness * 0.9, 2 + openness * 10);
      midLayer = paintBokehLayer(midDots, 0.65 + openness * 1.0, 3 + openness * 14);
    }

    var vigC = document.createElement('canvas'); vigC.width = W; vigC.height = H;
    (function () {
      var g = vigC.getContext('2d');
      var grad = g.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.78);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,.55)');
      g.fillStyle = grad; g.fillRect(0, 0, W, H);
    })();

    var grainC = document.createElement('canvas'); grainC.width = 128; grainC.height = 128;
    (function () {
      var g = grainC.getContext('2d');
      var img = g.createImageData(128, 128);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = (Math.random() * 255) | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    })();
    var grainPattern = ctx.createPattern(grainC, 'repeat');

    /* ---------- drone ---------- */
    function drawDrone(g, x, y, s, alpha, rotorAngle, blinkOn) {
      g.save();
      g.globalAlpha = alpha;
      g.translate(x, y); g.scale(s, s);
      g.strokeStyle = '#1c222b'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-34, -14); g.lineTo(-52, -30); g.moveTo(34, -14); g.lineTo(52, -30);
      g.moveTo(-34, 14); g.lineTo(-52, 30); g.moveTo(34, 14); g.lineTo(52, 30);
      g.stroke();
      g.fillStyle = 'rgba(160,180,200,.28)';
      [[-52, -30], [52, -30], [-52, 30], [52, 30]].forEach(function (p) {
        g.save(); g.translate(p[0], p[1]); g.rotate(rotorAngle);
        g.beginPath(); g.ellipse(0, 0, 22, 5, 0, 0, 6.2832); g.fill();
        g.restore();
      });
      var bodyGrad = g.createLinearGradient(0, -18, 0, 18);
      bodyGrad.addColorStop(0, '#2b3442'); bodyGrad.addColorStop(1, '#12161d');
      g.fillStyle = bodyGrad;
      g.beginPath();
      if (g.roundRect) g.roundRect(-36, -16, 72, 32, 10); else g.rect(-36, -16, 72, 32);
      g.fill();
      g.strokeStyle = 'rgba(141,235,0,.85)'; g.lineWidth = 2;
      g.beginPath();
      if (g.roundRect) g.roundRect(-36, -16, 72, 32, 10); else g.rect(-36, -16, 72, 32);
      g.stroke();
      g.fillStyle = '#05070a';
      g.beginPath(); g.arc(0, 2, 11, 0, 6.2832); g.fill();
      g.fillStyle = 'rgba(120,200,255,.5)';
      g.beginPath(); g.arc(0, 2, 5, 0, 6.2832); g.fill();
      if (blinkOn) {
        g.fillStyle = '#ff3b30';
        g.beginPath(); g.arc(-30, -16, 4, 0, 6.2832); g.fill();
      }
      g.restore();
    }

    var t0 = performance.now();
    function dronePos(now) {
      var t = (now - t0) / 1000;
      var x = W * 0.5 + Math.sin(t * 0.55) * W * 0.34;
      var y = H * 0.46 + Math.sin(t * 1.1) * 26;
      var vx = Math.cos(t * 0.55) * W * 0.34 * 0.55;
      return { x: x, y: y, vx: vx, t: t };
    }

    /* ---------- render ---------- */
    var histCanvas = $('xl-hist');
    var hctx = histCanvas.getContext('2d');
    var clipWarn = $('xl-clip');
    var flatC = document.createElement('canvas'); flatC.width = W; flatC.height = H;
    var fctx = flatC.getContext('2d');

    function renderFlat(s, dp, ghosts, rotor, blink) {
      var g = fctx;
      g.clearRect(0, 0, W, H);
      g.drawImage(skyC, 0, 0);
      g.drawImage(farLayer, 0, 0);
      g.drawImage(midLayer, 0, 0);
      for (var i = ghosts; i >= 1; i--) {
        var gx = dp.x - Math.sign(dp.vx || 1) * i * 26;
        drawDrone(g, gx, dp.y + Math.sin(dp.t * 1.1 - i * 0.12) * 6, 1, 0.10 + 0.05 * (1 - i / 9), rotor, false);
      }
      drawDrone(g, dp.x, dp.y, 1, 1, rotor, blink);
      return flatC;
    }

    function render(now) {
      if (!running) return;
      var s = settings();
      var dp = dronePos(now);
      frame++;

      var rotor = dp.t * 40;
      var blink = (dp.t % 1.2) < 0.6;
      var stopsSlower = Math.log2(s.t / SHUTTERS[0].t);
      var ghosts = Math.max(0, Math.min(8, Math.round((stopsSlower - 3) * 1.15)));

      // exposure — overlay rect, NOT ctx.filter (cheap + universal)
      var bright = Math.pow(2, -s.err);
      bright = Math.max(0.12, Math.min(3.2, bright));
      var flat = renderFlat(s, dp, ghosts, rotor, blink);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(flat, 0, 0);
      if (bright > 1.003) {
        ctx.fillStyle = 'rgba(255,255,255,' + (1 - 1 / bright).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
      } else if (bright < 0.997) {
        ctx.fillStyle = 'rgba(0,0,0,' + (1 - bright).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
      }

      var grainAlpha = [0, 0.015, 0.035, 0.07, 0.12, 0.18, 0.26][state.ii];
      if (grainAlpha > 0) {
        ctx.save(); ctx.globalAlpha = grainAlpha; ctx.fillStyle = grainPattern;
        ctx.fillRect(0, 0, W, H); ctx.restore();
      }
      ctx.drawImage(vigC, 0, 0);

      drawEVF(s, dp);
      if (frame % 9 === 0) updateHistogram();

      rafId = requestAnimationFrame(render);
    }

    function drawEVF(s, dp) {
      var g = ctx;
      g.save();
      g.fillStyle = 'rgba(0,0,0,.45)';
      g.fillRect(0, 0, W, 44);
      g.font = '700 20px "Space Mono", ui-monospace, monospace';
      g.fillStyle = '#8deb00';
      g.textBaseline = 'middle';
      g.fillText('M   f/' + s.N.toFixed(1) + '   ' + SHUTTERS[state.si].label + '   ISO' + s.iso, 18, 24);
      g.textAlign = 'right';
      g.fillStyle = Math.abs(s.err) <= 0.5 ? '#8deb00' : (s.err > 0 ? '#7fb2e8' : '#e8b27f');
      g.fillText((s.err > 0 ? '-' : '+') + Math.abs(s.err).toFixed(1) + ' EV', W - 18, 24);
      g.textAlign = 'left';

      var bw = 150, bh = 96, bx = dp.x - bw / 2, by = dp.y - bh / 2;
      g.strokeStyle = '#8deb00'; g.lineWidth = 3;
      var L = 26;
      [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]].forEach(function (c) {
        g.beginPath();
        g.moveTo(c[0] + L * c[2], c[1]); g.lineTo(c[0], c[1]); g.lineTo(c[0], c[1] + L * c[3]);
        g.stroke();
      });
      g.font = '700 15px "Space Mono", monospace';
      g.fillStyle = '#8deb00';
      g.fillText('TRACKING', bx, by - 12);

      var mw = 320, mx = W / 2 - mw / 2, my = H - 34;
      g.fillStyle = 'rgba(0,0,0,.45)';
      g.fillRect(mx - 14, my - 16, mw + 28, 44);
      var grad = g.createLinearGradient(mx, 0, mx + mw, 0);
      grad.addColorStop(0, '#3a6ea5'); grad.addColorStop(0.35, '#2a2a2a');
      grad.addColorStop(0.65, '#2a2a2a'); grad.addColorStop(1, '#b5892d');
      g.fillStyle = grad;
      g.fillRect(mx, my, mw, 8);
      var pos = Math.max(0, Math.min(1, 0.5 - s.err / 6));
      g.fillStyle = '#8deb00';
      g.fillRect(mx + pos * mw - 2, my - 6, 4, 20);
      g.fillStyle = 'rgba(255,255,255,.6)';
      g.font = '12px "Space Mono", monospace';
      g.fillText('-3', mx - 14, my + 22); g.fillText('+3', mx + mw + 2, my + 22);
      g.restore();
    }

    /* ---------- histogram ---------- */
    var tinyC = document.createElement('canvas'); tinyC.width = 150; tinyC.height = 100;
    var tctx = tinyC.getContext('2d', { willReadFrequently: true });
    function updateHistogram() {
      tctx.drawImage(scene, 0, 0, 150, 100);
      var d = tctx.getImageData(0, 0, 150, 100).data;
      var bins = new Array(48).fill(0), clipped = 0, crushed = 0, n = d.length / 4;
      for (var i = 0; i < d.length; i += 4) {
        var lum = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) | 0;
        bins[Math.min(47, lum >> 3)]++;
        if (lum >= 250) clipped++;
        if (lum <= 5) crushed++;
      }
      var g = hctx, W2 = 600, H2 = 86;
      g.clearRect(0, 0, W2, H2);
      g.fillStyle = '#0a0c0a'; g.fillRect(0, 0, W2, H2);
      var max = 1;
      bins.forEach(function (b) { if (b > max) max = b; });
      var bw = W2 / 48;
      for (var b = 0; b < 48; b++) {
        var h = (bins[b] / max) * (H2 - 14);
        var isClip = b >= 46, isCrush = b <= 1;
        g.fillStyle = isClip ? 'rgba(255,93,93,.85)' : (isCrush ? 'rgba(127,178,232,.7)' : 'rgba(141,235,0,.75)');
        g.fillRect(b * bw + 1, H2 - 8 - h, bw - 2, h);
      }
      g.strokeStyle = 'rgba(255,93,93,.5)'; g.setLineDash([5, 4]);
      g.beginPath(); g.moveTo(46 * bw, 4); g.lineTo(46 * bw, H2 - 8); g.stroke();
      g.setLineDash([]);
      g.fillStyle = 'rgba(255,255,255,.45)'; g.font = '10px "Space Mono", monospace';
      g.fillText('0', 4, H2 - 12); g.fillText('100 IRE', 46 * bw - 52, 14);

      var clipPct = (clipped / n * 100), crushPct = (crushed / n * 100);
      if (clipPct > 4) {
        clipWarn.className = 'xl-clip bad';
        clipWarn.textContent = '⚠ ' + clipPct.toFixed(1) + '% clipped — highlights are blown. Bring exposure down.';
      } else if (crushPct > 55) {
        clipWarn.className = 'xl-clip bad';
        clipWarn.textContent = '⚠ ' + crushPct.toFixed(1) + '% crushed blacks — frame is starved. Add light.';
      } else {
        clipWarn.className = 'xl-clip good';
        clipWarn.textContent = '✓ Tones held — nothing slammed against the ceiling or the floor.';
      }
    }

    /* ---------- UI wiring ---------- */
    var apS = $('xl-ap'), shS = $('xl-sh'), isoS = $('xl-iso');

    function refreshReadouts() {
      $('xl-apv').textContent = 'f/' + APERTURES[state.ai].toFixed(1);
      $('xl-shv').textContent = SHUTTERS[state.si].label;
      $('xl-isov').textContent = 'ISO ' + ISOS[state.ii];
      var s = settings();
      $('xl-meterv').textContent = (s.err > 0 ? '-' : '+') + Math.abs(s.err).toFixed(1) + ' EV';
      $('xl-needle').style.left = Math.max(0, Math.min(100, 50 - s.err / 6 * 100)) + '%';
      renderHint(s);
    }

    function renderHint(s) {
      var msg;
      if (Math.abs(s.err) <= 0.33) {
        msg = '<b>Exposure nailed.</b> Now chase the creative target — aperture for bokeh, shutter for motion.';
      } else if (s.err > 0) {
        msg = '<b>Too dark (' + Math.abs(s.err).toFixed(1) + ' EV under).</b> Open the aperture, slow the shutter, or raise ISO.';
      } else {
        msg = '<b>Too bright (' + Math.abs(s.err).toFixed(1) + ' EV over).</b> Stop down, speed up the shutter, or drop ISO.';
      }
      if (state.ii >= 5) msg += ' Watch the grain at ISO ' + s.iso + '.';
      $('xl-hint').innerHTML = msg;
    }

    function onDial() { renderBokehLayers(); refreshReadouts(); hideResult(); }
    apS.addEventListener('input', function () { state.ai = +apS.value; onDial(); });
    shS.addEventListener('input', function () { state.si = +shS.value; refreshReadouts(); hideResult(); });
    isoS.addEventListener('input', function () { state.ii = +isoS.value; refreshReadouts(); hideResult(); });

    function renderBrief() {
      var b = BRIEFS[state.brief];
      $('xl-btitle').textContent = b.title;
      $('xl-bdesc').textContent = b.desc;
      var tabs = $('xl-btabs'); tabs.innerHTML = '';
      BRIEFS.forEach(function (bb, i) {
        var btn = document.createElement('button');
        btn.className = 'xl-tab' + (i === state.brief ? ' active' : '');
        btn.textContent = (i + 1) + ' · ' + bb.title.toUpperCase();
        btn.addEventListener('click', function () { state.brief = i; renderBrief(); hideResult(); });
        tabs.appendChild(btn);
      });
    }

    function hideResult() { var r = $('xl-result'); r.className = 'xl-result hidden'; r.innerHTML = ''; }

    function passedCount() {
      return BRIEFS.filter(function (b) { return (best[b.id] || 0) >= 100; }).length;
    }

    $('xl-photo').addEventListener('click', function () {
      var s = settings();
      var b = BRIEFS[state.brief];
      var fl = $('xl-flash');
      fl.classList.add('go');
      setTimeout(function () { fl.classList.remove('go'); }, 60);
      if (window.CDGames) window.CDGames.shutterClick();

      var passed = 0, rows = '';
      b.checks.forEach(function (c) {
        var ok = c.test(s);
        if (ok) passed++;
        rows += '<li><span class="' + (ok ? 'xl-ok">✓' : 'xl-no">✗') + '</span><b>' + c.label + '</b>' +
          (ok ? '' : '<br><span style="margin-left:26px">' + c.tip + '</span>') + '</li>';
      });
      var score = Math.round((passed / b.checks.length) * 100);
      best[b.id] = Math.max(best[b.id] || 0, score);
      var allPass = passed === b.checks.length;

      $('xl-result').className = 'xl-result ' + (allPass ? 'pass' : 'fail');
      $('xl-result').innerHTML =
        '<div class="xl-scorerow"><div class="xl-scorenum">' + score + '</div>' +
        '<div><h3>' + (allPass ? 'SHOT ACCEPTED' : 'SHOT REJECTED') + '</h3><p>' +
        (allPass ? 'Clean frame. That is operator instinct, not luck.'
                 : 'The lab does not lie — adjust and shoot again.') + '</p></div></div>' +
        '<ul class="xl-checks">' + rows +
        '<li><span class="xl-ok">◈</span>Settings locked: <b>f/' + s.N.toFixed(1) + ' · ' +
        SHUTTERS[state.si].label + ' · ISO ' + s.iso + '</b> (' +
        (s.err > 0 ? '−' : '+') + Math.abs(s.err).toFixed(2) + ' EV)</li></ul>' +
        '<div class="xl-rbtns">' +
        '<button class="xl-ghost" id="xl-retry">ADJUST &amp; RETRY</button>' +
        '<button class="xl-ghost primary" id="xl-next">' +
        (state.brief < BRIEFS.length - 1 ? 'NEXT ASSIGNMENT' : 'REPLAY LAB') + '</button></div>';
      $('xl-retry').addEventListener('click', hideResult);
      $('xl-next').addEventListener('click', function () {
        state.brief = (state.brief + 1) % BRIEFS.length;
        renderBrief(); hideResult();
      });

      api.hud({ progress: passedCount() / BRIEFS.length, label: passedCount() + '/' + BRIEFS.length + ' assignments' });
      if (!finished && passedCount() === BRIEFS.length) {
        finished = true;
        api.toast('All assignments cleared — lab complete.');
        setTimeout(function () { api.finish(); }, 900);
      }
    });

    /* ---------- boot ---------- */
    renderBokehLayers();
    renderBrief();
    refreshReadouts();
    running = true;
    rafId = requestAnimationFrame(render);

    M = {
      root: root,
      pause: function () { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; },
      resume: function () {
        if (running || !root.isConnected) return;
        running = true; t0 = performance.now();
        rafId = requestAnimationFrame(render);
      },
      getSnapshot: function () {
        var sum = 0;
        BRIEFS.forEach(function (b) { sum += (best[b.id] || 0); });
        return { score: Math.round(sum / BRIEFS.length), detail: { briefs: best, evScene: EV_SCENE } };
      }
    };
  }

  function destroy() {
    if (M) { M.pause(); if (M.root && M.root.parentNode) M.root.parentNode.removeChild(M.root); M = null; }
  }

  window.CDGames.register('exposure-lab', {
    version: 'v1',
    title: 'Exposure Lab',
    init: init,
    destroy: destroy,
    pause: function () { if (M) M.pause(); },
    resume: function () { if (M) M.resume(); },
    getSnapshot: function () { return M ? M.getSnapshot() : { score: 0, detail: {} }; }
  });
})();