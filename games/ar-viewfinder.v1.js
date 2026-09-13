/* ==========================================================================
   AR VIEWFINDER v1 — Cameras Decoded game module
   --------------------------------------------------------------------------
   Rear-camera (or demo-feed) viewfinder: meter-relative exposure simulation,
   motion ghosts, ISO grain, live histogram, tap-to-focus, challenge mode.

   Perf notes:
     - No per-pixel loops in the hot path; grain = pre-rendered tiles.
     - No ctx.filter per-frame; exposure via overlay rects.
     - destroy() stops the camera track — the LED goes off, no leak.
   ========================================================================== */
(function () {
  'use strict';

  var CSS = `
  .av-root{--bg:#060806;--panel:#0c100c;--line:#1d261d;--txt:#e8f0e4;--dim:#8a9a86;
    --acc:#8deb00;--warn:#ffb300;--bad:#ff4d4d;
    --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
    position:relative;background:var(--bg);color:var(--txt);font-family:var(--mono);
    border-radius:12px;overflow:hidden;}
  .av-apphead{display:flex;align-items:center;justify-content:space-between;padding:8px 2px 10px;}
  .av-brand{font-size:13px;letter-spacing:2px;color:var(--acc);}
  .av-brand span{color:var(--dim);letter-spacing:1px;font-size:10px;}
  .av-aestat{font-size:10px;color:var(--dim);letter-spacing:1px;}
  .av-aestat.locked{color:var(--acc);}
  .av-stage{position:relative;width:100%;aspect-ratio:16/9;background:#000;
    border:1px solid var(--line);border-radius:10px;overflow:hidden;}
  .av-vf{position:absolute;inset:0;width:100%;height:100%;display:block;}
  .av-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;}
  .av-flash.go{animation:avFlash .28s ease-out;}
  @keyframes avFlash{0%{opacity:.9}100%{opacity:0}}
  .av-hud{position:absolute;pointer-events:none;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.9);
    font-size:11px;letter-spacing:1px;}
  .av-hudtop{top:0;left:0;right:0;display:flex;justify-content:space-between;padding:8px 10px;}
  .av-hudtop .mode{color:var(--acc);font-weight:700;}
  .av-corner{position:absolute;font-size:12px;}
  .av-ap{left:10px;top:50%;transform:translateY(-50%);}
  .av-sh{right:10px;top:50%;transform:translateY(-50%);}
  .av-iso{left:10px;bottom:44px;}
  .av-corner b{color:var(--acc);}
  .av-hist{position:absolute;right:8px;bottom:40px;width:110px;height:40px;opacity:.92;
    border:1px solid rgba(255,255,255,.25);border-radius:4px;background:rgba(0,0,0,.35);}
  .av-expscale{position:absolute;left:50%;transform:translateX(-50%);bottom:8px;width:62%;height:26px;}
  .av-ticks{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;
    font-size:9px;color:#cfd8cc;}
  .av-bar{position:absolute;left:0;right:0;top:16px;height:3px;
    background:linear-gradient(90deg,var(--bad),#666 30%,#666 70%,var(--warn));}
  .av-needle{position:absolute;top:11px;width:2px;height:13px;background:var(--acc);left:50%;box-shadow:0 0 6px var(--acc);}
  .av-tgt{position:absolute;top:11px;width:2px;height:13px;background:#fff;display:none;box-shadow:0 0 6px #fff;}
  .av-afbox{position:absolute;left:50%;top:50%;width:86px;height:86px;transform:translate(-50%,-50%);
    pointer-events:none;transition:left .18s ease-out,top .18s ease-out;}
  .av-afbox .c{position:absolute;width:18px;height:18px;border:2px solid var(--acc);}
  .av-afbox .tl{top:0;left:0;border-right:0;border-bottom:0;}
  .av-afbox .tr{top:0;right:0;border-left:0;border-bottom:0;}
  .av-afbox .bl{bottom:0;left:0;border-right:0;border-top:0;}
  .av-afbox .br{bottom:0;right:0;border-left:0;border-top:0;}
  .av-afbox.pulse{animation:avAfP .35s ease-out;}
  @keyframes avAfP{0%{transform:translate(-50%,-50%) scale(1.35)}100%{transform:translate(-50%,-50%) scale(1)}}
  .av-ribbon{position:absolute;top:34px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.72);
    border:1px solid var(--acc);border-radius:20px;padding:5px 14px;font-size:11px;letter-spacing:1px;
    color:var(--acc);display:none;white-space:nowrap;}
  .av-result{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(4,6,4,.92);
    border:1px solid var(--acc);border-radius:12px;padding:14px 20px;text-align:center;display:none;max-width:84%;}
  .av-result .score{font-size:30px;color:var(--acc);font-weight:700;}
  .av-result .coach{font-size:11px;color:var(--txt);margin-top:6px;line-height:1.5;}
  .av-shutterrow{display:flex;align-items:center;gap:12px;margin:12px 2px;}
  .av-shutter{width:64px;height:64px;border-radius:50%;flex:0 0 auto;cursor:pointer;
    background:radial-gradient(circle at 50% 42%,#2a332a,#101510 70%);
    border:3px solid var(--acc);box-shadow:0 0 14px rgba(141,235,0,.35);}
  .av-shutter:active{transform:scale(.93);}
  .av-film{display:flex;gap:8px;overflow-x:auto;flex:1;min-height:56px;align-items:center;}
  .av-film .shot{flex:0 0 auto;text-align:center;}
  .av-film img{width:76px;height:43px;object-fit:cover;border-radius:6px;border:1px solid var(--line);display:block;}
  .av-film .cap{font-size:8.5px;color:var(--dim);margin-top:3px;letter-spacing:.5px;}
  .av-filmhint{font-size:10px;color:var(--dim);letter-spacing:1px;}
  .av-dials{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:4px;}
  .av-dial{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:8px 6px;text-align:center;}
  .av-dial .lab{font-size:9.5px;color:var(--dim);letter-spacing:2px;margin-bottom:6px;}
  .av-dial .row{display:flex;align-items:center;justify-content:space-between;}
  .av-dial button{width:34px;height:40px;border-radius:8px;border:1px solid var(--line);
    background:#141a14;color:var(--acc);font-size:18px;cursor:pointer;}
  .av-dial button:active{background:#1e2a1e;}
  .av-dial .val{font-size:15px;min-width:58px;}
  .av-dial .val small{font-size:9px;color:var(--dim);display:block;letter-spacing:1px;}
  .av-readout{background:var(--panel);border:1px solid var(--line);border-radius:10px;margin-top:10px;padding:10px 12px;}
  .av-devline{display:flex;align-items:baseline;justify-content:space-between;}
  .av-devval{font-size:26px;color:var(--acc);}
  .av-devval small{font-size:11px;color:var(--dim);}
  .av-setline{font-size:11px;color:var(--dim);letter-spacing:1px;margin-top:4px;}
  .av-btnrow{display:flex;gap:8px;margin-top:10px;}
  .av-btn{flex:1;padding:10px;border-radius:8px;border:1px solid var(--acc);background:transparent;
    color:var(--acc);font-family:var(--mono);font-size:11px;letter-spacing:1.5px;cursor:pointer;}
  .av-btn.ghost{border-color:var(--line);color:var(--dim);}
  .av-btn:active{transform:scale(.97);}
  .av-note{font-size:10px;color:var(--dim);line-height:1.6;margin-top:10px;padding:0 2px;letter-spacing:.3px;}
  .av-note b{color:var(--txt);}
  .av-overlay{position:absolute;inset:0;background:rgba(4,6,4,.96);z-index:50;
    display:flex;align-items:center;justify-content:center;padding:24px;}
  .av-overlay[hidden]{display:none !important;}
  .av-card{max-width:420px;text-align:center;border:1px solid var(--line);border-radius:14px;
    padding:28px 22px;background:var(--panel);}
  .av-card h1{font-size:16px;letter-spacing:2px;color:var(--acc);margin:0 0 12px;}
  .av-card p{font-size:12px;color:var(--dim);line-height:1.7;margin:0 0 8px;}
  .av-card p b{color:var(--txt);}
  .av-card .av-btn{margin-top:14px;font-size:13px;padding:13px;width:100%;}
  .av-card .av-btn.ghost{margin-top:8px;}
  `;

  var HTML = `
  <div style="padding:10px 10px 6px;">
    <div class="av-apphead">
      <div class="av-brand">◉ CAMERAS DECODED <span>AR VIEWFINDER</span></div>
      <div class="av-aestat" id="av-aestat">AE …</div>
    </div>
    <div class="av-stage" id="av-stage">
      <canvas class="av-vf" id="av-vf" width="960" height="540"></canvas>
      <div class="av-flash" id="av-flash"></div>
      <div class="av-hud av-hudtop">
        <span><span class="mode">M</span>&nbsp;&nbsp;CD-AR</span>
        <span>⛽ 82%&nbsp;&nbsp;▣ 999</span>
      </div>
      <div class="av-hud av-corner av-ap" id="av-hudap">F<b>8.0</b></div>
      <div class="av-hud av-corner av-sh" id="av-hudsh"><b>1/125</b></div>
      <div class="av-hud av-corner av-iso" id="av-hudiso">ISO <b>100</b></div>
      <canvas class="av-hist" id="av-hist" width="220" height="80"></canvas>
      <div class="av-hud av-expscale">
        <div class="av-ticks"><span>-3</span><span>-2</span><span>-1</span><span>0</span><span>+1</span><span>+2</span><span>+3</span></div>
        <div class="av-bar"></div>
        <div class="av-tgt" id="av-tgt"></div>
        <div class="av-needle" id="av-needle"></div>
      </div>
      <div class="av-afbox" id="av-afbox"><div class="c tl"></div><div class="c tr"></div><div class="c bl"></div><div class="c br"></div></div>
      <div class="av-hud av-ribbon" id="av-ribbon"></div>
      <div class="av-result" id="av-result"><div class="score"></div><div class="coach"></div></div>
    </div>
    <div class="av-shutterrow">
      <button class="av-shutter" id="av-shutter" aria-label="Shutter release"></button>
      <div class="av-film" id="av-film"><span class="av-filmhint">SHOTS APPEAR HERE →</span></div>
    </div>
    <div class="av-dials">
      <div class="av-dial"><div class="lab">APERTURE</div>
        <div class="row"><button id="av-apdn" aria-label="Wider aperture">−</button>
        <div class="val"><span id="av-apv">8</span><small>f-stop</small></div>
        <button id="av-apup" aria-label="Narrow aperture">+</button></div></div>
      <div class="av-dial"><div class="lab">SHUTTER</div>
        <div class="row"><button id="av-shdn" aria-label="Slower shutter">−</button>
        <div class="val"><span id="av-shv">1/125</span><small>sec</small></div>
        <button id="av-shup" aria-label="Faster shutter">+</button></div></div>
      <div class="av-dial"><div class="lab">ISO</div>
        <div class="row"><button id="av-isodn" aria-label="Lower ISO">−</button>
        <div class="val"><span id="av-isov">100</span><small>gain</small></div>
        <button id="av-isoup" aria-label="Higher ISO">+</button></div></div>
    </div>
    <div class="av-readout">
      <div class="av-devline">
        <div class="av-devval" id="av-devval">+0.0 <small>EV vs meter</small></div>
        <div id="av-dof" style="font-size:10px;color:var(--dim);letter-spacing:1px;"></div>
      </div>
      <div class="av-setline" id="av-setline">f/8 · 1/125 · ISO 100</div>
      <div class="av-btnrow">
        <button class="av-btn" id="av-chal">NEW CHALLENGE</button>
        <button class="av-btn ghost" id="av-reset">RESET</button>
      </div>
    </div>
    <div class="av-note"><b>How it reads:</b> your phone's auto-exposure is the meter. The dials shift
      exposure <b>relative to it</b> — each full click is exactly 1&nbsp;EV, like a real
      camera in manual mode. Slow shutter + moving phone = motion ghosts. High ISO =
      grain. Tap the viewfinder to move focus.</div>
  </div>
  <div class="av-overlay" id="av-gate">
    <div class="av-card">
      <h1>◉ AR VIEWFINDER</h1>
      <p>This viewfinder uses your <b>rear camera</b> as a live training feed.</p>
      <p>Grant camera access when prompted. <b>Nothing is recorded or uploaded</b> — frames are processed on-device and never leave your phone.</p>
      <p style="font-size:10px;">Live camera needs https (not file://). Demo mode works anywhere.</p>
      <button class="av-btn" id="av-enable">ENABLE CAMERA</button>
      <button class="av-btn ghost" id="av-demo">TRY DEMO MODE — NO CAMERA</button>
    </div>
  </div>
  <div class="av-overlay" id="av-denied" hidden>
    <div class="av-card">
      <h1>CAMERA BLOCKED</h1>
      <p>Camera access was denied. On iPhone: <b>Settings → Safari → Camera → Allow</b>, then retry.</p>
      <button class="av-btn" id="av-retry">RETRY</button>
      <button class="av-btn ghost" id="av-demo2">CONTINUE IN DEMO MODE</button>
    </div>
  </div>
  `;

  var APERTURES = [1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
  var SHUTTERS = [1, 2, 4, 8, 15, 30, 60, 125, 250, 500, 1000, 2000, 4000];
  var ISOS = [100, 200, 400, 800, 1600, 3200, 6400, 12800];
  var BASE = { ap: 8, sh: 125, iso: 100 };

  var M = null;

  function init(stage, config, api) {
    config = config || {};
    var root = document.createElement('div');
    root.className = 'av-root';
    var style = document.createElement('style');
    style.textContent = CSS;
    root.appendChild(style);
    var body = document.createElement('div');
    body.innerHTML = HTML;
    root.appendChild(body);
    stage.appendChild(root);
    function $(id) { return root.querySelector('#' + id); }

    var S = { ai: 6, si: 6, ii: 0 };
    var chal = { active: false, target: 0 };
    var stream = null, camReady = false, aeLocked = false, demoMode = false;
    var rafId = 0, running = false, frame = 0;
    var shotsTaken = 0, challengesDone = 0, bestScore = 0;

    function ap() { return APERTURES[S.ai]; }
    function sh() { return SHUTTERS[S.si]; }
    function iso() { return ISOS[S.ii]; }
    function devEV() {
      var ev = Math.log2(ap() * ap() * sh()) - Math.log2(iso() / 100);
      var ref = Math.log2(BASE.ap * BASE.ap * BASE.sh) - Math.log2(BASE.iso / 100);
      return ev - ref;
    }
    function brightnessMult() {
      return Math.max(0.04, Math.min(8, Math.pow(2, -devEV())));
    }
    function blurAlpha() {
      var map = { 1: .85, 2: .78, 4: .7, 8: .6, 15: .45, 30: .25 };
      return map[sh()] || 0;
    }
    function grainAlpha() {
      var i = iso(); if (i <= 800) return 0;
      return Math.min(.34, (i - 800) / 6400 * .34);
    }

    var vf = $('av-vf'), vctx = vf.getContext('2d');
    var W = vf.width, H = vf.height;
    var prev = document.createElement('canvas'); prev.width = W; prev.height = H;
    var pctx = prev.getContext('2d');
    var hist = $('av-hist'), hctx = hist.getContext('2d');
    var mini = document.createElement('canvas'); mini.width = 120; mini.height = 68;
    var mctx = mini.getContext('2d', { willReadFrequently: true });
    var video = document.createElement('video');
    video.setAttribute('playsinline', ''); video.muted = true; video.autoplay = true;

    var demoCanvas = document.createElement('canvas'); demoCanvas.width = W; demoCanvas.height = H;
    var dctx = demoCanvas.getContext('2d');

    var grainTiles = [];
    for (var g = 0; g < 3; g++) {
      var t = document.createElement('canvas'); t.width = t.height = 128;
      var tc = t.getContext('2d'), id = tc.createImageData(128, 128), d = id.data;
      for (var p = 0; p < d.length; p += 4) {
        var v = (Math.random() * 255) | 0;
        d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255;
      }
      tc.putImageData(id, 0, 0); grainTiles.push(t);
    }
    var grainPat = null, grainIdx = 0;

    function mixc(a, b, k) { return [a[0] + (b[0] - a[0]) * k | 0, a[1] + (b[1] - a[1]) * k | 0, a[2] + (b[2] - a[2]) * k | 0]; }
    function rgbc(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }
    function drawDemoScene(t) {
      var cyc = (Math.sin(t * 0.06) + 1) / 2;
      var gr = dctx.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, rgbc(mixc([8, 14, 26], [48, 20, 66], cyc)));
      gr.addColorStop(.55, rgbc(mixc([24, 40, 72], [122, 60, 92], cyc)));
      gr.addColorStop(1, rgbc(mixc([60, 80, 110], [205, 132, 80], cyc)));
      dctx.fillStyle = gr; dctx.fillRect(0, 0, W, H);
      var sx = W * (0.2 + 0.6 * cyc), sy = H * (0.62 - 0.4 * Math.sin(cyc * Math.PI));
      var sg = dctx.createRadialGradient(sx, sy, 4, sx, sy, 95);
      sg.addColorStop(0, 'rgba(255,240,210,.95)'); sg.addColorStop(1, 'rgba(255,240,210,0)');
      dctx.fillStyle = sg; dctx.beginPath(); dctx.arc(sx, sy, 95, 0, 7); dctx.fill();
      dctx.fillStyle = 'rgba(20,24,40,.55)';
      for (var i = 0; i < 5; i++) {
        var cx = ((t * 14 * (1 + i * 0.2) + i * 260) % (W + 320)) - 160, cy = 60 + i * 46;
        dctx.beginPath(); dctx.ellipse(cx, cy, 120, 22, 0, 0, 7); dctx.fill();
        dctx.beginPath(); dctx.ellipse(cx + 70, cy + 8, 80, 16, 0, 0, 7); dctx.fill();
      }
      var bw = [150, 110, 190, 130, 170, 120, 140], x = 0;
      for (var b = 0; b < bw.length; b++) {
        var bh = 120 + ((b * 67) % 130);
        dctx.fillStyle = '#070a10'; dctx.fillRect(x, H - bh, bw[b] - 14, bh);
        dctx.fillStyle = 'rgba(255,210,120,.5)';
        for (var wy = H - bh + 14; wy < H - 16; wy += 26) for (var wx = x + 12; wx < x + bw[b] - 30; wx += 26) {
          if (((wx * 7 + wy * 13 + b) | 0) % 3 === 0) dctx.fillRect(wx, wy, 10, 14);
        }
        x += bw[b];
      }
      var bx = W * 0.5 + Math.sin(t * 0.5) * 190, by = H * 0.42 + Math.sin(t * 0.83) * 60;
      dctx.fillStyle = '#8deb00'; dctx.beginPath(); dctx.arc(bx, by, 26, 0, 7); dctx.fill();
      dctx.strokeStyle = 'rgba(0,0,0,.5)'; dctx.lineWidth = 2;
      dctx.beginPath(); dctx.moveTo(bx, by + 26); dctx.lineTo(bx, by + 64); dctx.stroke();
    }

    function setAeStat() {
      var ae = $('av-aestat');
      if (demoMode) { ae.textContent = 'DEMO FEED'; ae.className = 'av-aestat locked'; return; }
      if (!camReady) { ae.textContent = 'AE …'; ae.className = 'av-aestat'; return; }
      ae.textContent = aeLocked ? 'AE LOCKED' : 'AE AUTO';
      ae.className = 'av-aestat' + (aeLocked ? ' locked' : '');
    }

    async function initCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        $('av-gate').hidden = true; $('av-denied').hidden = false; return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch (e) { $('av-gate').hidden = true; $('av-denied').hidden = false; return; }
      video.srcObject = stream;
      if (M) M.stream = stream; // teardown hook: destroy() stops the track
      try { await video.play(); } catch (e) {}
      try {
        await stream.getVideoTracks()[0].applyConstraints({ advanced: [{ exposureMode: 'manual' }] });
        aeLocked = true;
      } catch (e) { aeLocked = false; }
      camReady = true; setAeStat();
      $('av-gate').hidden = true; $('av-denied').hidden = true;
      if (window.CDGames) window.CDGames.audio();
    }
    function startDemo() {
      demoMode = true; camReady = true;
      $('av-gate').hidden = true; $('av-denied').hidden = true;
      setAeStat();
      if (window.CDGames) window.CDGames.audio();
    }
    $('av-enable').addEventListener('click', initCamera);
    $('av-retry').addEventListener('click', function () { $('av-denied').hidden = true; $('av-gate').hidden = false; });
    $('av-demo').addEventListener('click', startDemo);
    $('av-demo2').addEventListener('click', startDemo);

    function drawCover(src) {
      var vw = src.videoWidth, vh = src.videoHeight;
      if (!vw || !vh) return false;
      var s = Math.max(W / vw, H / vh), dw = vw * s, dh = vh * s;
      vctx.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
      return true;
    }

    function loop() {
      if (!running) return;
      requestAnimationFrame(loop);
      frame++;
      vctx.globalAlpha = 1; vctx.globalCompositeOperation = 'source-over';
      if (demoMode) {
        drawDemoScene(frame / 60);
        vctx.drawImage(demoCanvas, 0, 0);
      } else {
        if (!camReady || video.readyState < 2) { idleCard(); return; }
        if (!drawCover(video)) return;
      }
      var ba = blurAlpha();
      if (ba > 0 && frame > 2) { vctx.globalAlpha = ba; vctx.drawImage(prev, 0, 0); vctx.globalAlpha = 1; }
      pctx.drawImage(vf, 0, 0);

      var m = brightnessMult();
      if (m > 1.001) vctx.fillStyle = 'rgba(255,255,255,' + Math.min(.92, 1 - 1 / m).toFixed(3) + ')';
      else if (m < 0.999) vctx.fillStyle = 'rgba(0,0,0,' + Math.min(.96, 1 - m).toFixed(3) + ')';
      else vctx.fillStyle = 'rgba(0,0,0,0)';
      if (m !== 1) vctx.fillRect(0, 0, W, H);

      var ga = grainAlpha();
      if (ga > 0) {
        if (!grainPat || frame % 9 === 0) { grainIdx = (grainIdx + 1) % 3; grainPat = vctx.createPattern(grainTiles[grainIdx], 'repeat'); }
        vctx.globalAlpha = ga; vctx.fillStyle = grainPat; vctx.fillRect(0, 0, W, H); vctx.globalAlpha = 1;
      }
      if (frame % 6 === 0) drawHist();
    }

    function idleCard() {
      vctx.fillStyle = '#050705'; vctx.fillRect(0, 0, W, H);
      vctx.fillStyle = '#1a241a'; vctx.textAlign = 'center';
      vctx.font = '28px ui-monospace,monospace';
      vctx.fillText('◉ NO SIGNAL', W / 2, H / 2 - 8);
      vctx.fillStyle = '#3a4a3a'; vctx.font = '15px ui-monospace,monospace';
      vctx.fillText('enable the camera to start the viewfinder', W / 2, H / 2 + 24);
    }

    function drawHist() {
      mctx.drawImage(vf, 0, 0, mini.width, mini.height);
      var d;
      try { d = mctx.getImageData(0, 0, mini.width, mini.height).data; } catch (e) { return; }
      var bins = [new Array(24).fill(0), new Array(24).fill(0), new Array(24).fill(0)];
      for (var i = 0; i < d.length; i += 16) {
        bins[0][Math.min(23, (d[i] / 255 * 24) | 0)]++;
        bins[1][Math.min(23, (d[i + 1] / 255 * 24) | 0)]++;
        bins[2][Math.min(23, (d[i + 2] / 255 * 24) | 0)]++;
      }
      var mx = 1, c, b;
      for (c = 0; c < 3; c++) for (b = 0; b < 24; b++) mx = Math.max(mx, bins[c][b]);
      hctx.clearRect(0, 0, hist.width, hist.height);
      var cols = ['rgba(255,80,80,.85)', 'rgba(120,255,120,.85)', 'rgba(120,160,255,.85)'];
      var bw = hist.width / 24;
      for (c = 0; c < 3; c++) {
        hctx.fillStyle = cols[c];
        for (b = 0; b < 24; b++) {
          var h = bins[c][b] / mx * hist.height;
          hctx.fillRect(b * bw, hist.height - h, Math.max(1, bw - 1), h);
        }
      }
    }

    function fmtSh(s) { return s === 1 ? '1"' : '1/' + s; }
    function refresh() {
      var a = ap(), s = sh(), isoV = iso(), dev = devEV();
      $('av-apv').textContent = a; $('av-shv').textContent = fmtSh(s); $('av-isov').textContent = isoV;
      $('av-hudap').innerHTML = 'F<b>' + a.toFixed(1) + '</b>';
      $('av-hudsh').innerHTML = '<b>' + fmtSh(s) + '</b>';
      $('av-hudiso').innerHTML = 'ISO <b>' + isoV + '</b>';
      $('av-devval').innerHTML = (dev >= 0 ? '+' : '') + dev.toFixed(1) + ' <small>EV vs meter</small>';
      $('av-setline').textContent = 'f/' + a + ' · ' + fmtSh(s) + ' · ISO ' + isoV;
      var cl = Math.max(-3, Math.min(3, dev));
      $('av-needle').style.left = ((cl + 3) / 6 * 100) + '%';
      var deep = Math.round((S.ai / (APERTURES.length - 1)) * 8);
      $('av-dof').textContent = 'DEPTH ' + '▬'.repeat(deep) + '░'.repeat(8 - deep);
      if (chal.active) {
        $('av-ribbon').style.display = 'block';
        $('av-ribbon').textContent = 'TARGET ' + (chal.target > 0 ? '+' : '') + chal.target + ' EV — MATCH IT, THEN SHOOT';
        var tc = Math.max(-3, Math.min(3, chal.target));
        $('av-tgt').style.display = 'block';
        $('av-tgt').style.left = ((tc + 3) / 6 * 100) + '%';
      } else {
        $('av-ribbon').style.display = 'none';
        $('av-tgt').style.display = 'none';
      }
    }

    function bind(id, fn) { $(id).addEventListener('click', function () { fn(); refresh(); }); }
    bind('av-apdn', function () { S.ai = Math.max(0, S.ai - 1); });
    bind('av-apup', function () { S.ai = Math.min(APERTURES.length - 1, S.ai + 1); });
    bind('av-shdn', function () { S.si = Math.max(0, S.si - 1); });
    bind('av-shup', function () { S.si = Math.min(SHUTTERS.length - 1, S.si + 1); });
    bind('av-isodn', function () { S.ii = Math.max(0, S.ii - 1); });
    bind('av-isoup', function () { S.ii = Math.min(ISOS.length - 1, S.ii + 1); });
    $('av-reset').addEventListener('click', function () { S = { ai: 6, si: 6, ii: 0 }; chal.active = false; refresh(); });

    $('av-stage').addEventListener('click', function (e) {
      var r = $('av-stage').getBoundingClientRect();
      var box = $('av-afbox');
      box.style.left = ((e.clientX - r.left) / r.width * 100) + '%';
      box.style.top = ((e.clientY - r.top) / r.height * 100) + '%';
      box.classList.remove('pulse'); void box.offsetWidth; box.classList.add('pulse');
    });

    var COACH = {
      perfect: 'Dead on. That is meter-relative thinking — the core manual skill.',
      close: 'Within a stop — a real meter would forgive this. Count clicks: each full dial step is 1 EV.',
      far: 'Off by a mile. Slow down: decide the direction first (brighter/darker), then count the clicks.'
    };
    $('av-chal').addEventListener('click', function () {
      var opts = [-2, -1, 1, 2];
      chal.target = opts[(Math.random() * opts.length) | 0];
      chal.active = true; refresh();
      if (window.CDGames) window.CDGames.blip(880, 120);
    });
    function coachFor(err) {
      if (err < 0.05) return COACH.perfect;
      if (err < 1.05) return COACH.close;
      return COACH.far;
    }

    $('av-shutter').addEventListener('click', function () {
      if (!camReady) return;
      if (window.CDGames) { window.CDGames.shutterClick(); window.CDGames.fx.tap(12); }
      var f = $('av-flash');
      f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
      shotsTaken++;
      var url;
      try { url = vf.toDataURL('image/jpeg', 0.82); } catch (e) { url = null; }
      if (url) {
        var strip = $('av-film'), hint = root.querySelector('.av-filmhint');
        if (hint) hint.remove();
        var d = document.createElement('div'); d.className = 'shot';
        var im = document.createElement('img'); im.src = url; im.alt = 'Captured training shot';
        var cap = document.createElement('div'); cap.className = 'cap';
        var dev0 = devEV();
        cap.textContent = 'f/' + ap() + ' ' + fmtSh(sh()) + ' ISO' + iso() + ' ' + (dev0 >= 0 ? '+' : '') + dev0.toFixed(1) + 'EV';
        d.appendChild(im); d.appendChild(cap);
        strip.insertBefore(d, strip.firstChild);
        while (strip.children.length > 4) strip.removeChild(strip.lastChild);
      }
      api.hud({ progress: Math.min(1, shotsTaken / 5), label: shotsTaken + ' shot' + (shotsTaken === 1 ? '' : 's') });
      if (chal.active) {
        var dev = devEV();
        var err = Math.abs(dev - chal.target);
        var score = err < 0.05 ? 100 : Math.max(5, Math.round(100 - err * 32));
        challengesDone++;
        bestScore = Math.max(bestScore, score);
        var r = $('av-result');
        r.querySelector('.score').textContent = score;
        r.querySelector('.coach').textContent = coachFor(err) +
          ' (You shot ' + (dev >= 0 ? '+' : '') + dev.toFixed(1) + ' EV vs target ' +
          (chal.target > 0 ? '+' : '') + chal.target + ' EV.)';
        r.style.display = 'block';
        if (window.CDGames) window.CDGames.blip(score >= 90 ? 880 : 220, 160);
        setTimeout(function () { r.style.display = 'none'; }, 3200);
      }
    });

    /* ---------- boot ---------- */
    refresh(); setAeStat();
    running = true;
    requestAnimationFrame(loop);
    if (config.demo) startDemo();

    M = {
      root: root,
      pause: function () { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; },
      resume: function () {
        if (running || !root.isConnected) return;
        running = true;
        requestAnimationFrame(loop);
      },
      getSnapshot: function () {
        return {
          score: bestScore,
          detail: { shotsTaken: shotsTaken, challengesDone: challengesDone, bestChallenge: bestScore }
        };
      }
    };
  }

  function destroy() {
    if (!M) return;
    M.pause();
    // stop the camera — LED off, no background capture
    if (M.stream) { try { M.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} }
    if (M.root && M.root.parentNode) M.root.parentNode.removeChild(M.root);
    M = null;
  }

  window.CDGames.register('ar-viewfinder', {
    version: 'v1',
    title: 'AR Viewfinder',
    init: init,
    destroy: destroy,
    pause: function () { if (M) M.pause(); },
    resume: function () { if (M) M.resume(); },
    getSnapshot: function () { return M ? M.getSnapshot() : { score: 0, detail: {} }; }
  });
})();