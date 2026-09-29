/* ================================================================
   CDLightFeed — ambient light conditions, the non-intrusive way.
   A slim strip (dashboard) + a context line (challenge page) showing
   the current photographic light phase and the next good-light window.

   - Self-contained drop-in: injects its own scoped CSS (.lf-*).
   - Solar math is vendored (compact NOAA-style low-precision SPA,
     ~0.01 deg — plenty for multi-degree windows). No CDN, no API,
     works offline, nothing to block.
   - No geolocation prompt on load. Location is estimated from the
     device timezone until the user taps "Use precise location"
     inside the expanded detail (permission asked in context).
   - Window scans are cached for 5 minutes; the 1s tick only updates
     the clock/countdown. Cheap on battery.
   - No Firebase, no auth. Renders for signed-out visitors too.
   ================================================================ */
(function () {
  'use strict';

  /* ---------------- Solar math (vendored, no dependencies) ---------------- */
  var RAD = Math.PI / 180;

  function norm360(d) { d = d % 360; return d < 0 ? d + 360 : d; }

  // Returns { elevation, azimuth } in degrees. Azimuth is compass-style:
  // 0 = north, 90 = east, 180 = south, 270 = west.
  function sunPos(date, lat, lon) {
    var jd = date.getTime() / 86400000 + 2440587.5; // Julian day (UTC)
    var n = jd - 2451545.0;                          // days since J2000.0
    var L = norm360(280.460 + 0.9856474 * n);        // mean longitude
    var g = norm360(357.528 + 0.9856003 * n) * RAD;  // mean anomaly
    var lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
    var eps = (23.439 - 0.0000004 * n) * RAD;        // obliquity
    var RA = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
    if (RA < 0) RA += 2 * Math.PI;
    var dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
    var gmstH = (18.697374558 + 24.06570982441908 * n) % 24; // GMST, hours
    if (gmstH < 0) gmstH += 24;
    var lst = norm360(gmstH * 15 + lon) * RAD;        // local sidereal, rad
    var H = lst - RA;                                // hour angle
    if (H > Math.PI) H -= 2 * Math.PI;
    if (H < -Math.PI) H += 2 * Math.PI;
    var latR = lat * RAD;
    var el = Math.asin(
      Math.sin(dec) * Math.sin(latR) +
      Math.cos(dec) * Math.cos(latR) * Math.cos(H)
    );
    var azS = Math.atan2(
      Math.sin(H),
      Math.cos(H) * Math.sin(latR) - Math.tan(dec) * Math.cos(latR)
    );
    var az = (azS / RAD + 180) % 360;
    if (az < 0) az += 360;
    return { elevation: el / RAD, azimuth: az };
  }

  function elevAt(date, lat, lon) { return sunPos(date, lat, lon).elevation; }

  /* ---------------- Photographic model ---------------- */
  // "Good light" window: blue hour (-6..-4) + golden hour (-4..+6),
  // treated as one continuous band for next-window purposes.
  var WIN_MIN = -6, WIN_MAX = 6;

  function phaseFor(elev, rising) {
    if (elev < -18) return 'NIGHT';
    if (elev < -6)  return 'ASTRONOMICAL TWILIGHT';
    if (elev < -4)  return 'BLUE HOUR';
    if (elev < 6)   return 'GOLDEN HOUR';
    if (elev < 50)  return rising ? 'MORNING' : 'AFTERNOON';
    return 'HIGH NOON';
  }

  function colorTempFor(elev) {
    if (elev < -6) return 10000;
    if (elev < 0)  return 8000;
    if (elev < 5)  return 3000;
    if (elev < 10) return 4000;
    if (elev < 20) return 5000;
    if (elev < 40) return 5800;
    return 6500;
  }

  var DOT_COLORS = {
    'GOLDEN HOUR': '#ffb020',
    'BLUE HOUR': '#5aa9ff',
    'NIGHT': '#5a5a5a',
    'ASTRONOMICAL TWILIGHT': '#5a5a5a',
    'MORNING': '#8deb00',
    'AFTERNOON': '#8deb00',
    'HIGH NOON': '#8deb00'
  };

  /* ---------------- Formatting ---------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function fmtCountdown(ms) {
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return h + 'h ' + pad(m) + 'm';
    if (m > 0) return m + 'm ' + pad(sec) + 's';
    return sec + 's';
  }

  function fmtClock(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  function fmtTemp(k) { return k.toLocaleString('en-US') + 'K'; }

  /* ---------------- Location (no prompt on load) ---------------- */
  var loc = { lat: 40, lon: 0, precise: false, label: 'APPROXIMATE' };

  function estimateFromTimezone() {
    // Longitude from UTC offset: 15 deg per hour. Honest approximation —
    // labeled as such until the user opts into precise location.
    var offHours = -new Date().getTimezoneOffset() / 60;
    loc.lon = Math.max(-180, Math.min(180, offHours * 15));
    loc.lat = 40;
    loc.precise = false;
    loc.label = 'APPROXIMATE';
  }

  /* ---------------- Window scan (cached) ---------------- */
  var winCache = { at: 0, win: null };
  var WIN_CACHE_MS = 5 * 60 * 1000;

  function findWindow(lat, lon) {
    var now = Date.now();
    if (winCache.win && now - winCache.at < WIN_CACHE_MS) return winCache.win;
    var win = scanWindow(new Date(now), lat, lon);
    winCache = { at: now, win: win };
    return win;
  }

  function scanWindow(from, lat, lon) {
    var step = 5 * 60000, t0 = from.getTime();
    for (var i = 0; i <= 288; i++) { // 24h in 5-min steps
      var t = new Date(t0 + i * step);
      var e = elevAt(t, lat, lon);
      if (e >= WIN_MIN && e < WIN_MAX) {
        return bracketWindow(t, lat, lon);
      }
    }
    return null; // polar day/night: no crossing in 24h
  }

  function bracketWindow(t, lat, lon) {
    var step = 60000, start = t.getTime(), end = t.getTime(), guard;
    var back = t.getTime();
    guard = 0;
    while (guard++ < 1440) {
      back -= step;
      var be = elevAt(new Date(back), lat, lon);
      if (be < WIN_MIN || be >= WIN_MAX) { start = back + step; break; }
      start = back;
    }
    var fwd = t.getTime();
    guard = 0;
    while (guard++ < 1440) {
      fwd += step;
      var fe = elevAt(new Date(fwd), lat, lon);
      if (fe < WIN_MIN || fe >= WIN_MAX) { end = fwd; break; }
      end = fwd;
    }
    return { start: new Date(start), end: new Date(end) };
  }

  /* ---------------- Scoped CSS (drop-in pattern) ---------------- */
  var CSS = [
    '.lf-strip{margin:0;border:1px solid rgba(141,235,0,.14);border-radius:10px;',
    'background:rgba(10,10,10,.55);overflow:hidden}',
    '.lf-strip[hidden],.lf-detail[hidden],[data-lf-context][hidden]{display:none!important}',
    '.lf-strip-main{display:flex;align-items:center;gap:10px;width:100%;padding:11px 14px;',
    'background:none;border:0;color:inherit;font:inherit;cursor:pointer;text-align:left}',
    '.lf-dot{width:7px;height:7px;border-radius:50%;flex:none;background:var(--lf-dot,#8deb00);',
    'box-shadow:0 0 10px var(--lf-dot,#8deb00);animation:lfPulse 3.2s ease-in-out infinite}',
    '@keyframes lfPulse{0%,100%{opacity:1}50%{opacity:.45}}',
    '.lf-phase{font-family:"Space Mono",monospace;font-size:12px;font-weight:600;letter-spacing:1.5px;color:#fff;white-space:nowrap}',
    '.lf-count{margin-left:auto;font-family:"Space Mono",monospace;font-size:12px;color:#b4b4b4;white-space:nowrap}',
    '.lf-caret{color:#666;font-size:10px;transition:transform .25s ease}',
    '.lf-strip[data-open="1"] .lf-caret{transform:rotate(180deg)}',
    '.lf-bar{height:2px;background:rgba(255,255,255,.06)}',
    '.lf-bar-fill{height:100%;width:0;background:linear-gradient(90deg,#1db31b,#8deb00);transition:width 1s linear}',
    '.lf-detail{border-top:1px solid rgba(141,235,0,.1);padding:14px;display:grid;',
    'grid-template-columns:1fr 1fr;gap:10px}',
    '.lf-cell{background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;padding:10px 12px;min-width:0}',
    '.lf-cell.wide{grid-column:span 2}',
    '.lf-label{font-family:"Space Mono",monospace;font-size:9px;letter-spacing:2px;color:#666;text-transform:uppercase;margin-bottom:5px}',
    '.lf-value{font-family:"Space Mono",monospace;font-size:15px;font-weight:700;letter-spacing:1px;color:#8deb00}',
    '.lf-value.dim{color:#b4b4b4;font-weight:400;font-size:12px}',
    '.lf-locbtn{margin-top:8px;background:none;border:1px solid rgba(141,235,0,.3);border-radius:20px;',
    'color:#8deb00;font-family:"Space Mono",monospace;font-size:10px;letter-spacing:1px;',
    'padding:6px 12px;cursor:pointer}',
    '.lf-locbtn:active{transform:scale(.97)}',
    '.lf-context{display:flex;align-items:center;gap:9px;justify-content:center;margin:0 auto 20px;',
    'padding:9px 16px;max-width:520px;border:1px solid rgba(141,235,0,.14);border-radius:20px;',
    'background:rgba(10,10,10,.55);font-family:"Space Mono",monospace;font-size:11.5px;',
    'letter-spacing:.5px;color:#b4b4b4;text-align:center}',
    '.lf-context .lf-dot{animation:none}',
    '.lf-context strong{color:#fff;font-weight:700}',
    '@media (prefers-reduced-motion:reduce){.lf-dot{animation:none}.lf-bar-fill{transition:none}.lf-caret{transition:none}}',
    '@media (max-width:380px){.lf-phase{font-size:12px;letter-spacing:1px}.lf-count{font-size:11px}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('lf-css')) return;
    var st = document.createElement('style');
    st.id = 'lf-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------- Render: dashboard strip ---------------- */
  function wireStrip(root) {
    var btn = root.querySelector('[data-lf-toggle]');
    var dot = root.querySelector('[data-lf-dot]');
    var phaseEl = root.querySelector('[data-lf-phase]');
    var countEl = root.querySelector('[data-lf-count]');
    var barFill = root.querySelector('[data-lf-bar]');
    var detail = root.querySelector('[data-lf-detail]');
    if (!btn || !dot || !phaseEl || !countEl) return;

    var dTemp = root.querySelector('[data-lf-temp]');
    var dWinName = root.querySelector('[data-lf-winname]');
    var dWinTime = root.querySelector('[data-lf-wintime]');
    var dWinCount = root.querySelector('[data-lf-wincount]');
    var dClock = root.querySelector('[data-lf-clock]');
    var dLoc = root.querySelector('[data-lf-loc]');
    var locBtn = root.querySelector('[data-lf-locbtn]');

    btn.addEventListener('click', function () {
      var open = root.getAttribute('data-open') === '1';
      root.setAttribute('data-open', open ? '0' : '1');
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      detail.hidden = open;
    });

    if (locBtn) {
      if (!navigator.geolocation) { locBtn.style.display = 'none'; }
      locBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        locBtn.disabled = true;
        locBtn.textContent = 'LOCATING…';
        navigator.geolocation.getCurrentPosition(
          function (pos) {
            loc.lat = pos.coords.latitude;
            loc.lon = pos.coords.longitude;
            loc.precise = true;
            loc.label = 'PRECISE';
            winCache.at = 0; // force window rescan
            tick();
          },
          function () {
            locBtn.disabled = false;
            locBtn.textContent = 'USE PRECISE LOCATION';
          },
          { timeout: 8000, maximumAge: 600000 }
        );
      });
    }

    function tick() {
      try {
        var now = new Date();
        var eNow = elevAt(now, loc.lat, loc.lon);
        var eLater = elevAt(new Date(now.getTime() + 30 * 60000), loc.lat, loc.lon);
        var rising = eLater > eNow;
        var phase = phaseFor(eNow, rising);
        var win = findWindow(loc.lat, loc.lon);

        var color = DOT_COLORS[phase] || '#8deb00';
        root.style.setProperty('--lf-dot', color);

        phaseEl.textContent = phase;

        var active = win && now >= win.start && now <= win.end;
        if (win && active) {
          countEl.textContent = fmtCountdown(win.end - now) + ' left';
          barFill.style.width = Math.max(0, Math.min(100,
            ((now - win.start) / (win.end - win.start)) * 100)) + '%';
        } else if (win && now < win.start) {
          countEl.textContent = 'in ' + fmtCountdown(win.start - now);
          barFill.style.width = '0%';
        } else {
          countEl.textContent = '—';
          barFill.style.width = '0%';
        }

        if (dTemp) dTemp.textContent = fmtTemp(colorTempFor(eNow));
        if (dWinName) dWinName.textContent = win ? (active ? phase + ' · ACTIVE' : 'NEXT · ' + phaseFor(elevAt(win.start, loc.lat, loc.lon), true)) : '—';
        if (dWinTime) dWinTime.textContent = win ? fmtClock(win.start) + ' → ' + fmtClock(win.end) : '—';
        if (dWinCount) dWinCount.textContent = win ? (active ? fmtCountdown(win.end - now) + ' remaining' : 'starts in ' + fmtCountdown(win.start - now)) : 'no crossing in 24h';
        if (dClock) dClock.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
        if (dLoc) dLoc.textContent = loc.label + ' · ' + loc.lat.toFixed(1) + '°, ' + loc.lon.toFixed(1) + '°';
        if (locBtn && loc.precise) locBtn.style.display = 'none';

        root.hidden = false;
      } catch (err) { /* never break the page over ambient data */ }
    }

    tick();
    setInterval(tick, 1000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) tick();
    });
  }

  /* ---------------- Render: challenge context line ---------------- */
  function wireContext(el) {
    var dot = el.querySelector('[data-lf-dot]');
    var txt = el.querySelector('[data-lf-context-text]');
    if (!txt) return;

    function tick() {
      try {
        var now = new Date();
        var eNow = elevAt(now, loc.lat, loc.lon);
        var win = findWindow(loc.lat, loc.lon);
        var inWindow = eNow >= WIN_MIN && eNow < WIN_MAX;
        var msg = null, color = '#8deb00';

        if (inWindow) {
          var eLater = elevAt(new Date(now.getTime() + 30 * 60000), loc.lat, loc.lon);
          var phase = phaseFor(eNow, eLater > eNow);
          color = DOT_COLORS[phase] || '#8deb00';
          var left = win && now <= win.end ? fmtCountdown(win.end - now) : null;
          msg = '<strong>' + phase.charAt(0) + phase.slice(1).toLowerCase() +
                '</strong> · ' + (left ? left + ' of good light left — shoot it now.' : 'good light right now — shoot it.');
        } else if (win && now < win.start && (win.start - now) <= 3 * 3600000) {
          var wPhase = phaseFor(elevAt(win.start, loc.lat, loc.lon), true);
          color = DOT_COLORS[wPhase] || '#8deb00';
          var eStartLater = elevAt(new Date(win.start.getTime() + 30 * 60000), loc.lat, loc.lon);
          var edge = eStartLater > elevAt(win.start, loc.lat, loc.lon) ? 'dawn' : 'dusk';
          msg = '<strong>' + wPhase.charAt(0) + wPhase.slice(1).toLowerCase() +
                '</strong> in ' + fmtCountdown(win.start - now) +
                ' — time this shot for ' + edge + '.';
        }

        if (msg) {
          if (dot) dot.style.setProperty('--lf-dot', color);
          txt.innerHTML = msg;
          el.hidden = false;
        } else {
          el.hidden = true; // not actionable right now: stay out of the way
        }
      } catch (err) { el.hidden = true; }
    }

    tick();
    setInterval(tick, 30000); // context only needs a 30s refresh
  }

  /* ---------------- Boot ---------------- */
  function init() {
    var strip = document.querySelector('[data-lf-strip]');
    var ctx = document.querySelector('[data-lf-context]');
    if (!strip && !ctx) return;
    injectCSS();
    estimateFromTimezone();
    if (strip) wireStrip(strip);
    if (ctx) wireContext(ctx);
  }

  window.CDLightFeed = { init: init, sunPos: sunPos };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
