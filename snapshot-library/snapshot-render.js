/* Cameras Decoded — "Render my card" for snapshot-library card pages.
 * Scrapes the card's values from the DOM, draws the approved Canva-template
 * card on canvas, plays the 3-second render animation, offers Save PNG.
 * Self-contained: injects its own CSS + the repo's Open Sans (same file the
 * build-time compositor uses, so canvas metrics match exactly). No-ops off
 * card pages.
 *
 * Card copy is condensed for the small template slots (the full prose stays
 * on the page): shutter keeps the speed token, ISO keeps the Auto ceiling,
 * white balance keeps the Kelvin number. Long values shrink/wrap to fit. */
(function () {
  'use strict';
  if (!document.querySelector('.settings-grid')) return;

  var FONT_FAM = '"Open Sans"';
  var FONT_URL = '/media/fonts/opensans.ttf';
  var TEMPLATE_URL = '/media/snapshot-card-template.jpg';
  var FW = 1206, FH = 2144;          // template size (approved formula coords)
  var WHITE = '#f5f5f5', GREEN = '#9fe870';

  /* ---------------- value scraping ---------------- */
  var LABEL_MAP = {
    'Recommended Mode': 'mode', 'Shutter Speed': 'shutter', 'Aperture': 'aperture',
    'ISO': 'iso', 'Focus Mode': 'focus', 'Drive Mode': 'drive', 'White Balance': 'wb'
  };
  var LIGHTINGS = ['Bright Natural', 'Golden Hour', 'Indoor Artificial', 'Low Light', 'Overcast'];
  var SCENARIOS = ['Event', 'Portrait', 'Real Estate', 'Sports', 'Street'];
  var DANGLERS = { a: 1, an: 1, the: 1, at: 1, to: 1, of: 1, in: 1, on: 1, and: 1, or: 1, for: 1, with: 1, as: 1, by: 1, from: 1 };

  function parseH1(h1) {
    var t = (h1 || '').replace(/\s+Settings\s*$/i, '').trim();
    var lighting = '', scenario = '', i;
    for (i = 0; i < LIGHTINGS.length; i++) {
      if (t.slice(-LIGHTINGS[i].length) === LIGHTINGS[i]) { lighting = LIGHTINGS[i]; t = t.slice(0, -lighting.length).trim(); break; }
    }
    for (i = 0; i < SCENARIOS.length; i++) {
      if (t.slice(-SCENARIOS[i].length) === SCENARIOS[i]) { scenario = SCENARIOS[i]; t = t.slice(0, -scenario.length).trim(); break; }
    }
    return { camera: t, scenario: scenario, lighting: lighting };
  }

  // Condense verbose library values to their essential setting for the card.
  function compactShutter(t) {
    return t.split(' \u2014 ')[0].split(' (')[0].replace(/\s+minimum$/, '').trim();
  }
  function compactIso(t) {
    var m = t.match(/(?:cap(?: at)?|ceiling)\s+(\d+)/i);
    if (/auto/i.test(t) && m) return 'Auto \u00b7 ' + m[1] + ' max';
    if (/auto/i.test(t)) return 'Auto';
    return t.replace(/^ISO\s+/i, '').trim();
  }
  function compactWb(t) {
    var m = t.match(/(\d+K)/);
    return m ? m[1] : t.trim();
  }
  function compactAperture(t) {
    // strip "(group)" qualifiers; split alternatives only on spaced slashes
    // ("f/2.8–f/4 (group) / f/1.4–f/2 (singles)" -> "f/2.8–f/4 / f/1.4–f/2")
    // so the f-stop slashes in "f/1.8" are never treated as separators.
    t = t.replace(/\s*\([^)]*\)/g, '');
    return t.split(/\s+\/\s+/).map(function (s) { return s.trim(); }).filter(Boolean).join(' / ');
  }
  function compactKeyNote(t) {
    var words = t.split('. ')[0].split(/\s+/).slice(0, 32);
    while (words.length > 1 && DANGLERS[words[words.length - 1].toLowerCase().replace(/[^a-z]/g, '')]) words.pop();
    return words.join(' ') + '\u2026';
  }

  function scrape() {
    var h1 = document.querySelector('h1');
    var meta = parseH1(h1 ? h1.textContent : '');
    var labels = document.querySelectorAll('.settings-grid .label');
    var values = document.querySelectorAll('.settings-grid .value');
    var v = {
      camera: meta.camera, scenario: meta.scenario, lighting: meta.lighting,
      mode: '', shutter: '', aperture: '', iso: '', focus: '', drive: '', wb: '',
      key_note: '', inner_note: ''
    };
    Array.prototype.forEach.call(labels, function (l, i) {
      var key = LABEL_MAP[l.textContent.trim()];
      if (key && values[i]) v[key] = values[i].textContent.trim();
    });
    v.shutter = compactShutter(v.shutter);
    v.aperture = compactAperture(v.aperture);
    v.iso = compactIso(v.iso);
    v.wb = compactWb(v.wb);
    var keyP = null;
    Array.prototype.forEach.call(document.querySelectorAll('h2'), function (h) {
      if (/key setting/i.test(h.textContent)) {
        var p = h.nextElementSibling;
        if (p && p.tagName === 'P') keyP = p;
      }
    });
    if (keyP) v.key_note = compactKeyNote(keyP.textContent.trim());
    var inner = document.querySelector('.inner-signal p');
    if (inner) v.inner_note = inner.textContent.trim().replace(/^["\u201c\u201d]+|["\u201c\u201d]+$/g, '');
    try {
      var cam = localStorage.getItem('cd_camera');
      if (cam) v.camera = cam;   // stamp the user's own body
    } catch (e) {}
    return v;
  }

  /* ---------------- card drawing (mirrors render.py) ---------------- */
  function ascentFor(px) { return px * 43 / 40; }
  function descentFor(px) { return px * 12 / 40; }

  function wrapText(ctx, text, px, maxW) {
    ctx.font = px + 'px ' + FONT_FAM;
    var words = text.split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) {
      var t = (cur + ' ' + w).trim();
      if (ctx.measureText(t).width <= maxW) cur = t;
      else { if (cur) lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    return lines;
  }
  // Draws the full card at scale S into ctx. Returns value rects (full-res coords).
  function drawCard(ctx, S, v) {
    var rects = [];
    ctx.save();
    ctx.scale(S, S);
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    function box(x, yTop, w, px) {
      rects.push({ x: x, y: yTop, w: w, h: ascentFor(px) + descentFor(px) });
    }
    function text(t, x, yTop, px) {
      ctx.font = px + 'px ' + FONT_FAM;
      var w = ctx.measureText(t).width;
      ctx.fillText(t, x, yTop + ascentFor(px));
      box(x, yTop, w, px);
      return w;
    }
    // Lay out a left-column field: split alternatives on " / ", wrap each
    // piece at 30px; shrink a piece to a single line (min 18px) when it
    // can't wrap cleanly. Returns [{line, px}], capped at 3 lines.
    function widest(lines, px) {
      ctx.font = px + 'px ' + FONT_FAM;
      var w = 0;
      lines.forEach(function (ln) { w = Math.max(w, ctx.measureText(ln).width); });
      return w;
    }
    function layoutField(t, maxW) {
      var out = [];
      t.split(' / ').forEach(function (seg) {
        seg = seg.trim();
        if (!seg) return;
        var lines = wrapText(ctx, seg, 30, maxW);
        if (lines.length <= 2 && widest(lines, 30) <= maxW) {
          lines.forEach(function (ln) { out.push({ line: ln, px: 30 }); });
          return;
        }
        var px = 30;
        ctx.font = px + 'px ' + FONT_FAM;
        while (ctx.measureText(seg).width > maxW && px > 18) {
          px -= 2;
          ctx.font = px + 'px ' + FONT_FAM;
        }
        if (ctx.measureText(seg).width <= maxW) { out.push({ line: seg, px: px }); return; }
        wrapText(ctx, seg, 18, maxW).slice(0, 3).forEach(function (ln) { out.push({ line: ln, px: 18 }); });
      });
      return out.slice(0, 3);
    }
    function drawField(t, x, yTop, maxW, lineStep) {
      var y = yTop;
      layoutField(t, maxW).forEach(function (it) {
        text(it.line, x, y, it.px);
        y += lineStep;
      });
    }
    // Fit a single line, shrinking to minPx.
    function fitSingle(t, x, yTop, maxW, basePx, minPx, rightEdge) {
      var px = basePx;
      ctx.font = px + 'px ' + FONT_FAM;
      while (ctx.measureText(t).width > maxW && px > minPx) {
        px -= 2;
        ctx.font = px + 'px ' + FONT_FAM;
      }
      var w = ctx.measureText(t).width;
      text(t, rightEdge ? rightEdge - w : x, yTop, px);
    }

    // top fields: baseline-locked to labels, left-aligned x=640
    var tops = [['camera', 145], ['scenario', 295], ['lighting', 433]];
    tops.forEach(function (pair) {
      var t = v[pair[0]] || '', y = pair[1], px = 40;
      ctx.font = px + 'px ' + FONT_FAM;
      var w = ctx.measureText(t).width;
      if (640 + w > 990) { px = 36; ctx.font = px + 'px ' + FONT_FAM; w = ctx.measureText(t).width; }
      if (640 + w > 990) { px = 32; ctx.font = px + 'px ' + FONT_FAM; }
      text(t, 640, y, px);
    });

    // settings: left column wraps in its lane; right column fits its slot
    fitSingle(v.shutter, 0, 768, 480, 30, 18, 1195);          // right-aligned
    text(v.iso, 945, 898, 30);
    fitSingle(v.drive, 1035, 1058, 155, 30, 18);              // 1035 -> 1190
    drawField(v.mode, 445, 768, 140, 38);
    drawField(v.aperture, 445, 898, 140, 38);
    drawField(v.focus, 445, 1028, 140, 38);
    text(v.wb, 445, 1178, 30);

    // key setting note
    var y = 1400, px = 28;
    wrapText(ctx, v.key_note, px, 950).forEach(function (ln) { text(ln, 120, y, px); y += 42; });

    // inner signal note: centered, quoted
    y = 1850; px = 30;
    ctx.font = px + 'px ' + FONT_FAM;
    ctx.textAlign = 'center';
    wrapText(ctx, '\u201c' + v.inner_note + '\u201d', px, 900).forEach(function (ln) {
      var w = ctx.measureText(ln).width;
      ctx.fillText(ln, FW / 2, y + ascentFor(px));
      box(FW / 2 - w / 2, y, w, px);
      y += 46;
    });
    ctx.textAlign = 'left';

    ctx.restore();
    return rects;
  }

  /* ---------------- styles ---------------- */
  var css = [
    '@font-face{font-family:"Open Sans";src:url("' + FONT_URL + '") format("truetype");font-display:swap}',
    '.snr-render-btn{display:block;width:100%;margin:20px 0 6px;padding:16px;border:1px solid rgba(141,235,0,.55);',
    ' border-radius:12px;background:rgba(141,235,0,.07);color:#eaffd0;font-family:"Space Mono",monospace;',
    ' font-size:13px;letter-spacing:.12em;cursor:pointer;text-align:center}',
    '.snr-render-btn:active{transform:scale(.98)}',
    '.snr-overlay{position:fixed;inset:0;background:rgba(2,3,2,.97);z-index:10002;display:flex;flex-direction:column;',
    ' align-items:center;justify-content:flex-start;padding:26px 16px 40px;overflow-y:auto}',
    '.snr-stage{position:relative;width:min(74vw,330px);aspect-ratio:1206/2144;border:1px solid #1c2b12;border-radius:10px;',
    ' overflow:hidden;background:#000;box-shadow:0 0 60px rgba(141,235,0,.07)}',
    '.snr-stage canvas{width:100%;height:100%;display:block}',
    '.snr-hud{width:min(74vw,330px);margin-top:14px;background:#050705;border:1px solid #1c2b12;border-radius:10px;',
    ' padding:12px 14px;min-height:118px;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;line-height:1.7}',
    '.snr-hud .ln{white-space:pre-wrap;color:#9fe870}',
    '.snr-hud .ln.ok{color:#e8f5e0}',
    '.snr-row{width:min(74vw,330px);display:flex;gap:10px;margin-top:14px}',
    '.snr-row button{flex:1;background:transparent;border:1px solid #2c3f1c;color:#9fe870;border-radius:999px;',
    ' padding:13px;font-family:ui-monospace,Menlo,monospace;font-size:13px;letter-spacing:.08em;cursor:pointer}',
    '.snr-row button.primary{background:#9fe870;color:#061206;border:none;font-weight:700}',
    '.snr-row button:active{transform:scale(.97)}',
    '.snr-pulse{animation:snredgepulse 1.1s ease-in-out 2}',
    '@keyframes snredgepulse{0%,100%{box-shadow:0 0 60px rgba(141,235,0,.07)}50%{box-shadow:0 0 90px rgba(141,235,0,.35)}}'
  ].join('\n');
  var styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /* ---------------- overlay + animation ---------------- */
  var GLYPHS = '\u2588\u2593\u2592\u2591<>\\/\\|01';
  var DUR = 3.0;
  var LOG = [
    [0.05, '> establishing uplink\u2026'],
    [0.45, '> stamping identity\u2026'],
    [1.05, '> stamping exposure values\u2026'],
    [1.65, '> locking white balance\u2026'],
    [2.10, '> writing field notes\u2026'],
    [2.50, '> sealing the inner signal\u2026'],
    [2.90, '> RENDER COMPLETE \u2713', 'ok']
  ];

  var tplImg = new Image();
  tplImg.src = TEMPLATE_URL;
  var tplReady = new Promise(function (res, rej) { tplImg.onload = res; tplImg.onerror = rej; });

  function openOverlay() {
    var v = scrape();
    var ov = document.createElement('div');
    ov.className = 'snr-overlay';
    ov.innerHTML =
      '<div class="snr-stage"><canvas width="603" height="1072"></canvas></div>' +
      '<div class="snr-hud"></div>' +
      '<div class="snr-row"><button type="button" data-snr="close">CLOSE</button>' +
      '<button type="button" class="primary" data-snr="save" style="opacity:.25;pointer-events:none">SAVE CARD</button></div>';
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';

    var cv = ov.querySelector('canvas'), ctx = cv.getContext('2d');
    var hud = ov.querySelector('.snr-hud'), stage = ov.querySelector('.snr-stage');
    var saveBtn = ov.querySelector('[data-snr="save"]');
    var S = 603 / FW, W = 603, H = 1072;
    var shown = LOG.map(function () { return false; });
    var rects, done = false, raf = null, t0 = null;

    function addLog(txt, cls) {
      var d = document.createElement('div');
      d.className = 'ln' + (cls ? ' ' + cls : '');
      d.textContent = txt;
      hud.appendChild(d);
      while (hud.children.length > 5) hud.removeChild(hud.firstChild);
    }

    function finish() {
      cancelAnimationFrame(raf);
      rects.forEach(function (r) { r.born = 0; r.dead = false; });
      ctx.drawImage(finalCv, 0, 0, W, H);
      LOG.forEach(function (l, i) { if (!shown[i]) { shown[i] = true; addLog(l[1], l[2]); } });
      done = true;
      stage.classList.add('snr-pulse');
      saveBtn.style.opacity = 1;
      saveBtn.style.pointerEvents = 'auto';
    }

    var finalCv = document.createElement('canvas');
    finalCv.width = W; finalCv.height = H;

    Promise.all([
      tplReady,
      document.fonts.load('40px "Open Sans"'),
      document.fonts.load('30px "Open Sans"'),
      document.fonts.load('28px "Open Sans"')
    ]).then(function () {
      var fctx = finalCv.getContext('2d');
      fctx.drawImage(tplImg, 0, 0, W, H);
      rects = drawCard(fctx, S, v);
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
      t0 = performance.now();
      tick(t0);
    }).catch(function () {
      if (window.cdToast) window.cdToast('Could not load the card template.', 'error');
      close();
    });

    function tick(now) {
      var t = (now - t0) / 1000;
      var p = Math.min(t / DUR, 1);
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      var scanY = e * H;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(tplImg, 0, 0, W, H);
      if (scanY > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, scanY); ctx.clip();
        ctx.drawImage(finalCv, 0, 0, W, H);
        for (var i = 0; i < rects.length; i++) {
          (function (r) {
            var ry = (r.y + r.h) * S;
            if (scanY >= ry && !r.dead) {
              if (!r.born) r.born = now;
              if (now - r.born < 220) {
                var n = Math.max(2, Math.floor(r.w * S / 9));
                ctx.fillStyle = 'rgba(2,3,2,0.85)';
                ctx.fillRect(r.x * S - 4, r.y * S - 4, r.w * S + 8, r.h * S + 8);
                ctx.fillStyle = GREEN;
                ctx.font = Math.max(8, (r.h * S) * 0.55) + 'px ui-monospace,monospace';
                var s = '';
                for (var k = 0; k < n; k++) s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
                ctx.fillText(s, r.x * S, (r.y + r.h * 0.72) * S);
              } else r.dead = true;
            }
          })(rects[i]);
        }
        ctx.restore();
      }
      if (p < 1) {
        var g = ctx.createLinearGradient(0, scanY - 52, 0, scanY);
        g.addColorStop(0, 'rgba(159,232,112,0)');
        g.addColorStop(1, 'rgba(159,232,112,0.5)');
        ctx.fillStyle = g;
        ctx.fillRect(0, Math.max(0, scanY - 52), W, 52);
        ctx.fillStyle = '#c6ff9e';
        ctx.fillRect(0, scanY - 1.5, W, 3);
      }
      LOG.forEach(function (l, i) {
        if (t >= l[0] && !shown[i]) { shown[i] = true; addLog(l[1], l[2]); }
      });
      if (p >= 1 && !done) { finish(); return; }
      if (!done) raf = requestAnimationFrame(tick);
    }

    cv.addEventListener('click', function () { if (!done && rects) finish(); });
    ov.querySelector('[data-snr="close"]').addEventListener('click', close);
    saveBtn.addEventListener('click', function () {
      // full-resolution export
      var big = document.createElement('canvas');
      big.width = FW; big.height = FH;
      var bctx = big.getContext('2d');
      var img = new Image();
      img.onload = function () {
        bctx.drawImage(img, 0, 0, FW, FH);
        drawCard(bctx, 1, v);
        var a = document.createElement('a');
        var slug = (location.pathname.split('/').pop() || 'card').replace(/\.html$/, '');
        a.download = 'snapshot-card-' + slug + '.png';
        a.href = big.toDataURL('image/png');
        document.body.appendChild(a); a.click(); a.remove();
        if (window.cdToast) window.cdToast('Card saved.');
      };
      img.onerror = function () { if (window.cdToast) window.cdToast('Export failed.', 'error'); };
      img.src = TEMPLATE_URL;
    });

    function close() {
      cancelAnimationFrame(raf);
      document.body.style.overflow = '';
      ov.remove();
    }
  }

  /* ---------------- inject the button ---------------- */
  function init() {
    var grid = document.querySelector('.settings-grid');
    if (!grid || document.querySelector('.snr-render-btn')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'snr-render-btn';
    btn.textContent = '\u25b6 RENDER MY CARD';
    btn.addEventListener('click', openOverlay);
    grid.parentNode.insertBefore(btn, grid);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
