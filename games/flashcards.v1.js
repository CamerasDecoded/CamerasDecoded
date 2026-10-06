/* ==========================================================================
   SIGNAL FLASHCARDS v1 — Cameras Decoded game module
   --------------------------------------------------------------------------
   Photography flashcards with three modes in one deck:

     1. TERM CARDS (classic) — front shows a term, tap to flip, back shows
        the definition + a practical shooting tip. Player marks "Got it"
        or "Missed it".
     2. VISUAL CARDS — front shows a pure CSS/SVG visual demo of a concept
        (no external images), asks "What created this look?" with 3
        multiple-choice answers.
     3. REVERSE MODE — shows a term and asks "Which image shows it?",
        with 3 visual demos to pick from.

   SPACED REPETITION — every card starts at weight 1. A miss raises its
   weight (up to 6) and drops it back near the front of the queue so it
   resurfaces soon. A correct answer retires the card. Cards missed 3+
   times are force-retired so a session always terminates. Session ends
   when the queue empties; getSnapshot() returns accuracy 0-100.

   Arcade contract:
     - All UI mounts inside the `stage` element; every class is namespaced
       under `.fc-` (zero collisions with site CSS).
     - Sounds via CDGames.fx.blip() (correct/wrong/tick), haptics via
       CDGames.fx.tap(). All guarded — the game runs silent if fx is absent.
     - Progress via api.hud(); session end via api.finish(); notes via
       api.toast(). No rAF loop — pause()/resume() just gate input.
     - Scoring: getSnapshot() returns { score: 0-100 accuracy, detail }.
       The platform banks XP from the score.
     - Daily mode: init(stage, {daily:true}, api) deals a fixed 10-card
       deck (category locked to All).
   ========================================================================== */
(function () {
  'use strict';

  var CSS = `
.fc-root{--fc-bg:#0b0d0a;--fc-panel:#14170f;--fc-panel2:#1b2013;--fc-ink:#f2f6ea;--fc-muted:#9aa38c;--fc-line:#2c3324;--fc-accent:#8deb00;--fc-accent-ink:#0d1600;--fc-wrong:#ff5d5d;--fc-glow:0 0 10px rgba(141,235,0,.35)}
.fc-root *{box-sizing:border-box}
.fc-root{margin:0;min-height:100%;background:var(--fc-bg);color:var(--fc-ink);font-family:Manrope,system-ui,-apple-system,sans-serif;overflow-x:hidden;background-image:radial-gradient(circle at 50% -10%,rgba(141,235,0,.06),transparent 34%)}
.fc-root button{font:inherit;color:inherit}
.fc-shell{width:min(560px,100%);margin:0 auto;padding:14px 14px max(40px,env(safe-area-inset-bottom))}
/* ---------- header / progress ---------- */
.fc-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.fc-brand{font:700 13px/1 "IBM Plex Mono",monospace;letter-spacing:.14em;color:var(--fc-accent);text-transform:uppercase}
.fc-score{font:600 12px/1 "IBM Plex Mono",monospace;color:var(--fc-ink);background:var(--fc-panel);border:1px solid var(--fc-line);border-radius:20px;padding:8px 12px}
.fc-score b{color:var(--fc-accent)}
.fc-progress{height:8px;border-radius:6px;background:#171b12;border:1px solid var(--fc-line);overflow:hidden;margin-bottom:4px}
.fc-progress i{display:block;height:100%;width:0%;border-radius:6px;background:linear-gradient(90deg,#5da300,var(--fc-accent));box-shadow:var(--fc-glow);transition:width .35s ease}
.fc-count{font:500 11px/1 "IBM Plex Mono",monospace;color:var(--fc-muted);margin-bottom:14px;letter-spacing:.04em}
/* ---------- start screen ---------- */
.fc-start{background:var(--fc-panel);border:1px solid var(--fc-line);border-radius:18px;padding:26px 20px;text-align:center;box-shadow:0 18px 44px rgba(0,0,0,.45)}
.fc-start h1{font-size:30px;margin:0 0 8px;letter-spacing:.01em}
.fc-start h1 span{color:var(--fc-accent)}
.fc-start p{color:var(--fc-muted);font-size:13px;line-height:1.55;margin:0 0 18px}
.fc-cats{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:20px}
.fc-cat{min-height:40px;padding:0 16px;border-radius:20px;border:1px solid var(--fc-line);background:var(--fc-panel2);color:var(--fc-muted);font:600 12px/1 "IBM Plex Mono",monospace;letter-spacing:.05em;cursor:pointer;transition:all .18s}
.fc-cat.fc-on{border-color:var(--fc-accent);color:var(--fc-accent);box-shadow:var(--fc-glow);background:rgba(141,235,0,.07)}
.fc-bigbtn{display:block;width:100%;min-height:54px;border-radius:14px;border:1px solid var(--fc-accent);background:var(--fc-accent);color:var(--fc-accent-ink);font-weight:800;font-size:16px;letter-spacing:.06em;cursor:pointer;box-shadow:var(--fc-glow);text-transform:uppercase}
.fc-bigbtn:active{transform:scale(.98)}
.fc-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}
.fc-mode{background:var(--fc-panel2);border:1px solid var(--fc-line);border-radius:10px;padding:10px 6px;font-size:11px;color:var(--fc-muted);line-height:1.4}
.fc-mode b{display:block;color:var(--fc-ink);font-size:12px;margin-bottom:3px}
/* ---------- card stage ---------- */
.fc-stage{min-height:380px}
.fc-q{font:600 12px/1.4 "IBM Plex Mono",monospace;color:var(--fc-muted);letter-spacing:.08em;text-transform:uppercase;margin:0 0 10px;text-align:center}
.fc-q b{color:var(--fc-accent)}
.fc-card{perspective:1400px;cursor:pointer;min-height:330px}
.fc-card-inner{position:relative;width:100%;min-height:330px;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.25,.7,.3,1.15)}
.fc-card.fc-flipped .fc-card-inner{transform:rotateY(180deg)}
.fc-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:18px;border:1px solid var(--fc-line);background:linear-gradient(160deg,var(--fc-panel),#0e110a);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:26px 22px;text-align:center;box-shadow:0 18px 44px rgba(0,0,0,.45)}
.fc-face.fc-back{transform:rotateY(180deg);background:linear-gradient(160deg,#17200e,#0e110a);border-color:rgba(141,235,0,.35)}
.fc-kicker{font:600 10px/1 "IBM Plex Mono",monospace;letter-spacing:.16em;color:var(--fc-accent);text-transform:uppercase;margin-bottom:14px}
.fc-term{font-size:34px;font-weight:800;letter-spacing:.01em;margin:0 0 6px;line-height:1.1}
.fc-hintline{color:var(--fc-muted);font-size:12px;margin-top:14px}
.fc-def{font-size:15px;line-height:1.6;color:var(--fc-ink);margin:0 0 14px}
.fc-tip{background:rgba(141,235,0,.07);border:1px solid rgba(141,235,0,.3);border-radius:10px;padding:12px 14px;font-size:13px;line-height:1.5;color:#d9e8c2;text-align:left;width:100%}
.fc-tip b{color:var(--fc-accent);font:600 10px/1 "IBM Plex Mono",monospace;letter-spacing:.1em;display:block;margin-bottom:6px}
/* ---------- visual demos ---------- */
.fc-vis{width:100%;height:190px;border-radius:12px;overflow:hidden;position:relative;background:#05060a;border:1px solid var(--fc-line);margin-bottom:6px}
.fc-vis svg{width:100%;height:100%;display:block}
.fc-vis-row{display:flex;gap:8px;height:100%}
.fc-vis-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;position:relative}
.fc-vis-col span{font:600 10px/1 "IBM Plex Mono",monospace;color:var(--fc-muted);letter-spacing:.08em}
.fc-bokeh{position:relative;width:100%;height:110px}
.fc-bokeh i{position:absolute;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffe9a8,#ff9d5c 60%,rgba(255,157,92,0));filter:blur(7px)}
.fc-bokeh i:nth-child(1){width:64px;height:64px;left:8%;top:8%}
.fc-bokeh i:nth-child(2){width:44px;height:44px;left:52%;top:38%;background:radial-gradient(circle at 35% 35%,#bfe9ff,#5ca8ff 60%,rgba(92,168,255,0));filter:blur(6px)}
.fc-bokeh i:nth-child(3){width:30px;height:30px;left:30%;top:62%;background:radial-gradient(circle at 35% 35%,#ffc2d6,#ff5c8a 60%,rgba(255,92,138,0));filter:blur(5px)}
.fc-bokeh.fc-sharp i{filter:none;width:14px;height:14px}
.fc-bokeh.fc-sharp i:nth-child(1){left:20%;top:20%}
.fc-bokeh.fc-sharp i:nth-child(2){left:55%;top:45%}
.fc-bokeh.fc-sharp i:nth-child(3){left:35%;top:68%}
.fc-streak{position:relative;width:100%;height:110px;overflow:hidden}
.fc-streak i{position:absolute;height:10px;border-radius:6px;background:linear-gradient(90deg,transparent,#8deb00)}
.fc-streak i:nth-child(1){top:18%;width:78%;left:4%}
.fc-streak i:nth-child(2){top:44%;width:92%;left:0;opacity:.75}
.fc-streak i:nth-child(3){top:70%;width:64%;left:10%;opacity:.5}
.fc-streak.fc-frozen i{background:#e8f4d8;height:22px;border-radius:11px;top:38%;width:70%;left:15%}
.fc-dof{display:flex;align-items:stretch;gap:10px;height:110px;width:100%;justify-content:center}
.fc-dof div{flex:1;border-radius:8px;background:linear-gradient(180deg,#3a4a2a,#222d16);border:1px solid var(--fc-line);display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px;font:600 9px/1 "IBM Plex Mono",monospace;color:var(--fc-muted)}
.fc-dof .fc-blur{filter:blur(5px);opacity:.65}
.fc-dof .fc-mid{background:linear-gradient(180deg,#7cc400,#3f7a00);border-color:var(--fc-accent)}
.fc-grain{position:absolute;inset:0;background:repeating-conic-gradient(rgba(255,255,255,.16) 0 .00006turn,transparent .00006turn .00012turn);background-size:7px 7px;mix-blend-mode:overlay}
.fc-sun{position:absolute;border-radius:50%}
.fc-gridlines{position:absolute;inset:0}
.fc-gridlines:before,.fc-gridlines:after{content:"";position:absolute;background:rgba(255,255,255,.5)}
.fc-gridlines:before{left:0;right:0;top:33.3%;height:1px;box-shadow:0 66.6px 0 rgba(255,255,255,.5)}
.fc-gridlines:after{top:0;bottom:0;left:33.3%;width:1px;box-shadow:66.6px 0 0 rgba(255,255,255,.5)}
/* ---------- choices ---------- */
.fc-choices{display:grid;gap:10px;margin-top:14px}
.fc-choice{min-height:56px;border-radius:12px;border:1px solid var(--fc-line);background:var(--fc-panel);color:var(--fc-ink);font-size:15px;font-weight:600;cursor:pointer;padding:12px 16px;text-align:center;transition:all .18s;line-height:1.35}
.fc-choice:active{transform:scale(.98)}
.fc-choice.fc-right{border-color:var(--fc-accent);background:rgba(141,235,0,.12);color:var(--fc-accent);box-shadow:var(--fc-glow)}
.fc-choice.fc-wrongpick{border-color:var(--fc-wrong);background:rgba(255,93,93,.1);color:var(--fc-wrong)}
.fc-choice:disabled{cursor:default;opacity:.92}
.fc-visopts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
.fc-visopt{border-radius:12px;border:1px solid var(--fc-line);background:var(--fc-panel);cursor:pointer;padding:6px;transition:all .18s}
.fc-visopt .fc-vis{height:110px;margin-bottom:0}
.fc-visopt.fc-right{border-color:var(--fc-accent);box-shadow:var(--fc-glow)}
.fc-visopt.fc-wrongpick{border-color:var(--fc-wrong);opacity:.75}
.fc-visopt:disabled{cursor:default}
/* ---------- verdict buttons ---------- */
.fc-verdict{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.fc-verdict button{min-height:56px;border-radius:12px;font-weight:800;font-size:15px;letter-spacing:.05em;cursor:pointer;text-transform:uppercase}
.fc-got{border:1px solid var(--fc-accent);background:rgba(141,235,0,.1);color:var(--fc-accent)}
.fc-missed{border:1px solid #4a4438;background:transparent;color:var(--fc-muted)}
.fc-verdict button:active{transform:scale(.97)}
/* ---------- results ---------- */
.fc-results{background:var(--fc-panel);border:1px solid var(--fc-line);border-radius:18px;padding:30px 22px;text-align:center;box-shadow:0 18px 44px rgba(0,0,0,.45)}
.fc-results h2{margin:0 0 6px;font-size:26px}
.fc-results h2 span{color:var(--fc-accent)}
.fc-ring{width:130px;height:130px;border-radius:50%;margin:18px auto;display:grid;place-items:center;background:conic-gradient(var(--fc-accent) var(--fc-pct,0%),#20261a 0);position:relative}
.fc-ring:before{content:"";position:absolute;inset:12px;border-radius:50%;background:var(--fc-panel)}
.fc-ring b{position:relative;font:800 30px/1 "IBM Plex Mono",monospace;color:var(--fc-accent)}
.fc-stats{display:flex;gap:10px;justify-content:center;margin:6px 0 22px}
.fc-stat{background:var(--fc-panel2);border:1px solid var(--fc-line);border-radius:10px;padding:10px 16px;font:600 11px/1.5 "IBM Plex Mono",monospace;color:var(--fc-muted)}
.fc-stat b{display:block;font-size:20px;color:var(--fc-ink)}
.fc-note{color:var(--fc-muted);font-size:12px;line-height:1.5;margin:0 0 18px}
@media (prefers-reduced-motion:reduce){.fc-card-inner,.fc-progress i,.fc-choice,.fc-visopt{transition:none!important}}
`;

  /* ---------------- content: 24 terms ---------------- */
  var CARDS = [
    /* --- Exposure --- */
    { id: 'aperture', cat: 'exposure', term: 'Aperture',
      def: 'The opening in the lens that lets light in, measured in f-stops like f/1.8 or f/16.',
      tip: 'Wide aperture (small f-number) = blurry background. Narrow (big f-number) = everything sharp.' },
    { id: 'shutter', cat: 'exposure', term: 'Shutter Speed',
      def: 'How long the sensor is exposed to light. 1/1000s freezes motion; 1/30s blurs it.',
      tip: 'Handheld rule: keep shutter at 1/(focal length) or faster to avoid camera shake.' },
    { id: 'iso', cat: 'exposure', term: 'ISO',
      def: 'Sensor sensitivity to light. Higher ISO brightens dark scenes but adds grain.',
      tip: 'Raise ISO last — after aperture and shutter are maxed out.' },
    { id: 'triangle', cat: 'exposure', term: 'Exposure Triangle',
      def: 'Aperture, shutter speed, and ISO work together. Change one and at least one other must shift to hold exposure.',
      tip: 'Learn it as a triangle, not three dials: every setting is a tradeoff.' },
    { id: 'metering', cat: 'exposure', term: 'Metering',
      def: 'How the camera measures scene brightness to choose exposure: evaluative, center-weighted, or spot.',
      tip: 'Spot-meter faces in tricky light; evaluative works for most scenes.' },
    { id: 'ev', cat: 'exposure', term: 'Exposure Compensation (EV)',
      def: 'A +/- dial that brightens or darkens the camera\u2019s chosen exposure without leaving auto modes.',
      tip: 'Snow or beach rendering gray? Dial +1 EV. Night shots too bright? Dial -1.' },
    /* --- Composition --- */
    { id: 'thirds', cat: 'composition', term: 'Rule of Thirds',
      def: 'Imagine a 3x3 grid. Place subjects on the lines or intersections, not dead center.',
      tip: 'Turn on grid lines in your camera menu and leave them on.' },
    { id: 'lines', cat: 'composition', term: 'Leading Lines',
      def: 'Roads, fences, or shorelines that pull the viewer\u2019s eye toward your subject.',
      tip: 'Get low — lines converge harder near the ground.' },
    { id: 'framing', cat: 'composition', term: 'Framing',
      def: 'Using doorways, branches, or arches to frame your subject inside the frame.',
      tip: 'A frame-within-a-frame adds instant depth to flat scenes.' },
    { id: 'negspace', cat: 'composition', term: 'Negative Space',
      def: 'Empty area around your subject that gives it room to breathe.',
      tip: 'When in doubt, back up — clutter kills more photos than distance.' },
    { id: 'symmetry', cat: 'composition', term: 'Symmetry',
      def: 'Mirrored halves that feel calm and deliberate. Reflections are the easy win.',
      tip: 'Break perfect symmetry with one small element for tension.' },
    /* --- Focus --- */
    { id: 'autofocus', cat: 'focus', term: 'Autofocus',
      def: 'The camera locks focus for you: single (AF-S) for stills, continuous (AF-C) for motion.',
      tip: 'Use AF-C plus burst mode for anything that moves, even slowly.' },
    { id: 'manualfocus', cat: 'focus', term: 'Manual Focus',
      def: 'You turn the focus ring yourself. Essential for macro, astro, and video work.',
      tip: 'Zoom live view to 100% to nail manual focus.' },
    { id: 'dof', cat: 'focus', term: 'Depth of Field',
      def: 'How much of the scene is sharp, front to back. Controlled by aperture, distance, and focal length.',
      tip: 'Get closer to shrink depth of field without touching the aperture.' },
    { id: 'bokeh', cat: 'focus', term: 'Bokeh',
      def: 'The creamy blur of out-of-focus highlights, shaped by your aperture blades.',
      tip: 'Wide aperture plus distant background lights = the creamiest bokeh.' },
    { id: 'hyperfocal', cat: 'focus', term: 'Hyperfocal Distance',
      def: 'The focus distance that keeps everything from half that distance to infinity sharp.',
      tip: 'Landscapes: focus about a third into the scene at f/8 to f/11.' },
    /* --- Light --- */
    { id: 'golden', cat: 'light', term: 'Golden Hour',
      def: 'The hour after sunrise and before sunset. Warm, directional, flattering light.',
      tip: 'Arrive 30 minutes early — the best color often comes before the sun shows.' },
    { id: 'bluehour', cat: 'light', term: 'Blue Hour',
      def: 'The twilight window when the sky goes deep blue. Made for city and neon shots.',
      tip: 'Bring a tripod — exposures run long and the window is short.' },
    { id: 'backlight', cat: 'light', term: 'Backlight',
      def: 'Light behind your subject. Creates rims, halos, and dramatic silhouettes.',
      tip: 'Expose for the highlights and let the subject go dark for a true silhouette.' },
    { id: 'sidelight', cat: 'light', term: 'Side Light',
      def: 'Light from the side. Reveals texture and shape through shadow.',
      tip: 'The professional secret: side light makes flat subjects look three-dimensional.' },
    { id: 'harsh', cat: 'light', term: 'Harsh Light',
      def: 'Hard midday sun. Strong shadows, blown highlights, squinting subjects.',
      tip: 'Find open shade — or embrace it for high-contrast black and white.' },
    /* --- Gear --- */
    { id: 'focal', cat: 'gear', term: 'Focal Length',
      def: 'Measured in mm. 24mm is wide, 50mm is \u201cnormal,\u201d 200mm is telephoto.',
      tip: 'A 35mm or 50mm prime teaches you to move your feet, not the zoom.' },
    { id: 'prime', cat: 'gear', term: 'Prime Lens',
      def: 'Fixed focal length. Usually sharper, faster (wider aperture), and lighter than zooms.',
      tip: 'One prime lens for a month teaches more than three zooms.' },
    { id: 'zoom', cat: 'gear', term: 'Zoom Lens',
      def: 'Variable focal length. Flexible framing without moving, at the cost of size and max aperture.',
      tip: 'Zooms are for events and travel; primes are for learning to see.' }
  ];

  var CATS = [
    { id: 'all', label: 'All' },
    { id: 'exposure', label: 'Exposure' },
    { id: 'composition', label: 'Composition' },
    { id: 'focus', label: 'Focus' },
    { id: 'light', label: 'Light' },
    { id: 'gear', label: 'Gear' }
  ];

  /* ---------------- visual demos (pure CSS/SVG, no external images) ---------------- */
  var VISUALS = {
    aperture: function () {
      return '<div class="fc-vis"><div class="fc-vis-row">' +
        '<div class="fc-vis-col"><div class="fc-bokeh"><i></i><i></i><i></i></div><span>f/1.8</span></div>' +
        '<div class="fc-vis-col"><div class="fc-bokeh fc-sharp"><i></i><i></i><i></i></div><span>f/16</span></div>' +
        '</div></div>';
    },
    shutter: function () {
      return '<div class="fc-vis"><div class="fc-vis-row">' +
        '<div class="fc-vis-col"><div class="fc-streak fc-frozen"><i></i></div><span>1/1000s</span></div>' +
        '<div class="fc-vis-col"><div class="fc-streak"><i></i><i></i><i></i></div><span>1/30s</span></div>' +
        '</div></div>';
    },
    iso: function () {
      return '<div class="fc-vis" style="background:linear-gradient(160deg,#1a2030,#0a0d18)">' +
        '<div class="fc-vis-row">' +
        '<div class="fc-vis-col"><span style="font-size:13px;color:#cfd8ea">Clean shadows</span><span>ISO 100</span></div>' +
        '<div class="fc-vis-col" style="position:relative"><div class="fc-grain"></div><span style="font-size:13px;color:#cfd8ea;position:relative">Noisy shadows</span><span>ISO 12800</span></div>' +
        '</div></div>';
    },
    dof: function () {
      return '<div class="fc-vis"><div class="fc-vis-row"><div class="fc-vis-col">' +
        '<div class="fc-dof"><div class="fc-blur">NEAR</div><div class="fc-mid">SUBJECT</div><div class="fc-blur">FAR</div></div>' +
        '<span>Shallow depth of field</span></div></div></div>';
    },
    bokeh: function () {
      return '<div class="fc-vis"><div class="fc-bokeh" style="height:100%">' +
        '<i style="width:90px;height:90px;left:6%;top:14%"></i>' +
        '<i style="width:60px;height:60px;left:56%;top:10%"></i>' +
        '<i style="width:44px;height:44px;left:36%;top:56%"></i>' +
        '<i style="width:70px;height:70px;left:70%;top:58%;background:radial-gradient(circle at 35% 35%,#d6f5a8,#8deb00 60%,rgba(141,235,0,0));filter:blur(9px)"></i>' +
        '</div></div>';
    },
    thirds: function () {
      return '<div class="fc-vis" style="background:linear-gradient(160deg,#232a18,#12150c)">' +
        '<div class="fc-gridlines"></div>' +
        '<div class="fc-sun" style="width:26px;height:26px;left:calc(66.6% - 13px);top:calc(33.3% - 13px);background:#8deb00;box-shadow:0 0 18px rgba(141,235,0,.8)"></div>' +
        '<div style="position:absolute;bottom:10px;width:100%;text-align:center;font:600 10px/1 \'IBM Plex Mono\',monospace;color:#9aa38c;letter-spacing:.08em">SUBJECT ON THE INTERSECTION</div></div>';
    },
    golden: function () {
      return '<div class="fc-vis" style="background:linear-gradient(180deg,#3a2b6e 0%,#b4502e 45%,#f2a23a 75%,#ffd97a 100%)">' +
        '<div class="fc-sun" style="width:54px;height:54px;left:calc(50% - 27px);bottom:26px;background:radial-gradient(circle,#fff6d8,#ffcf6e 70%,rgba(255,207,110,0));box-shadow:0 0 34px rgba(255,200,100,.9)"></div>' +
        '<div style="position:absolute;bottom:0;left:0;right:0;height:34px;background:#0c0a08"></div></div>';
    },
    bluehour: function () {
      return '<div class="fc-vis" style="background:linear-gradient(180deg,#060a1c 0%,#0d1c4a 60%,#14306e 100%)">' +
        '<div class="fc-sun" style="width:30px;height:30px;right:18%;top:16%;background:radial-gradient(circle,#f4f7ff,#b9c8ee 70%,rgba(185,200,238,0));box-shadow:0 0 22px rgba(200,215,255,.7)"></div>' +
        '<div style="position:absolute;bottom:0;left:0;right:0;height:52px;background:#05070f">' +
        '<i style="position:absolute;left:14%;top:30%;width:8px;height:10px;background:#ffd97a;box-shadow:0 0 8px #ffd97a"></i>' +
        '<i style="position:absolute;left:38%;top:44%;width:8px;height:10px;background:#ffd97a;box-shadow:0 0 8px #ffd97a"></i>' +
        '<i style="position:absolute;left:66%;top:26%;width:8px;height:10px;background:#9fd8ff;box-shadow:0 0 8px #9fd8ff"></i>' +
        '<i style="position:absolute;left:84%;top:52%;width:8px;height:10px;background:#ffd97a;box-shadow:0 0 8px #ffd97a"></i></div></div>';
    },
    lines: function () {
      return '<div class="fc-vis"><svg viewBox="0 0 300 190" preserveAspectRatio="xMidYMid slice">' +
        '<rect width="300" height="190" fill="#0d120a"/>' +
        '<line x1="0" y1="190" x2="150" y2="60" stroke="#8deb00" stroke-width="3"/>' +
        '<line x1="300" y1="190" x2="150" y2="60" stroke="#8deb00" stroke-width="3"/>' +
        '<line x1="90" y1="190" x2="150" y2="60" stroke="#5da300" stroke-width="2"/>' +
        '<line x1="210" y1="190" x2="150" y2="60" stroke="#5da300" stroke-width="2"/>' +
        '<circle cx="150" cy="60" r="7" fill="#8deb00"/>' +
        '<text x="150" y="40" fill="#9aa38c" font-size="11" text-anchor="middle" font-family="monospace">SUBJECT</text>' +
        '</svg></div>';
    },
    backlight: function () {
      return '<div class="fc-vis" style="background:radial-gradient(circle at 50% 42%,#fff3cf 0%,#ffcf7a 34%,#c46a2a 68%,#241206 100%)">' +
        '<svg viewBox="0 0 300 190" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0">' +
        '<ellipse cx="150" cy="196" rx="120" ry="46" fill="#0a0805"/>' +
        '<circle cx="150" cy="86" r="17" fill="#0a0805"/>' +
        '<path d="M150 104 c-16 0 -22 12 -24 30 l-6 56 h60 l-6 -56 c-2 -18 -8 -30 -24 -30z" fill="#0a0805"/>' +
        '</svg></div>';
    }
  };
  var VISUAL_IDS = Object.keys(VISUALS);

  /* ---------------- helpers ---------------- */
  var M = null;

  function fx() { return (window.CDGames && window.CDGames.fx) || null; }
  function sfx(kind) {
    var f = fx(); if (!f || typeof f.blip !== 'function') return;
    try {
      if (kind === 'good') f.blip(990, 150);
      else if (kind === 'bad') f.blip(220, 200);
      else if (kind === 'flip') f.blip(660, 90);
      else f.blip(520, 100);
    } catch (e) {}
  }
  function tap(ms) {
    var f = fx(); if (!f || typeof f.tap !== 'function') return;
    try { f.tap(ms || 12); } catch (e) {}
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function cardById(id) {
    for (var i = 0; i < CARDS.length; i++) if (CARDS[i].id === id) return CARDS[i];
    return null;
  }
  function hasVisual(card) { return !!VISUALS[card.id]; }

  /* Pick 2 distractor terms for multiple choice. Prefer same category. */
  function distractors(card, deckCards, n) {
    var same = [], other = [];
    for (var i = 0; i < deckCards.length; i++) {
      var c = deckCards[i];
      if (c.id === card.id) continue;
      if (c.cat === card.cat) same.push(c); else other.push(c);
    }
    shuffle(same); shuffle(other);
    return same.concat(other).slice(0, n);
  }
  /* Pick 2 distractor visuals (cards that have visuals) for reverse mode. */
  function visualDistractors(card, deckCards, n) {
    var pool = [];
    for (var i = 0; i < deckCards.length; i++) {
      var c = deckCards[i];
      if (c.id === card.id || !hasVisual(c)) continue;
      pool.push(c);
    }
    shuffle(pool);
    return pool.slice(0, n);
  }

  /* Resolve which mode a card can actually run in this deck. */
  function resolveMode(card, visualCount) {
    var r = Math.random();
    var hv = hasVisual(card);
    if (hv && r < 0.38) return 'visual';
    if (hv && visualCount >= 3 && r < 0.68) return 'reverse';
    return 'term';
  }

  function buildDeck(catId, daily) {
    var pool = CARDS.filter(function (c) { return catId === 'all' || c.cat === catId; });
    pool = shuffle(pool.slice());
    if (daily) pool = pool.slice(0, Math.min(10, pool.length));
    var visualCount = pool.filter(hasVisual).length;
    return pool.map(function (c) {
      return { card: c, mode: resolveMode(c, visualCount), weight: 1, seen: 0 };
    });
  }

  /* Weighted draw: higher weight = surfaces sooner. Removes from queue. */
  function drawNext(S) {
    if (!S.queue.length) return null;
    var total = 0, i;
    for (i = 0; i < S.queue.length; i++) total += S.queue[i].weight;
    var r = Math.random() * total, acc = 0;
    for (i = 0; i < S.queue.length; i++) {
      acc += S.queue[i].weight;
      if (r < acc) return S.queue.splice(i, 1)[0];
    }
    return S.queue.shift();
  }

  function accuracy(S) {
    return S.attempts ? Math.round(100 * S.correct / S.attempts) : 0;
  }

  function init(stage, config, api) {
    var root = document.createElement('div');
    root.className = 'fc-root';
    var styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    root.appendChild(styleEl);
    root.insertAdjacentHTML('beforeend',
      '<div class="fc-shell">' +
        '<div class="fc-top"><div class="fc-brand">Signal Flashcards</div>' +
        '<div class="fc-score">SCORE <b id="fc-scoreVal">0</b></div></div>' +
        '<div class="fc-progress"><i id="fc-bar"></i></div>' +
        '<div class="fc-count" id="fc-count"></div>' +
        '<div class="fc-stage" id="fc-stage"></div>' +
      '</div>');
    stage.appendChild(root);

    var S = {
      api: api, root: root, stage: root.querySelector('#fc-stage'),
      bar: root.querySelector('#fc-bar'), count: root.querySelector('#fc-count'),
      scoreVal: root.querySelector('#fc-scoreVal'),
      cat: 'all', queue: [], deck: [], deckSize: 0,
      correct: 0, attempts: 0, done: 0, misses: 0,
      paused: false, finished: false, timers: [], daily: !!(config && config.daily)
    };

    function later(fn, ms) {
      var t = setTimeout(function () {
        S.timers = S.timers.filter(function (x) { return x !== t; });
        if (!S.paused && !S.finished) fn();
      }, ms);
      S.timers.push(t);
      return t;
    }
    function clearTimers() {
      S.timers.forEach(clearTimeout); S.timers = [];
    }

    function hud() {
      try {
        S.api.hud({
          progress: S.deckSize ? S.done / S.deckSize : 0,
          label: S.done + '/' + S.deckSize + ' cards'
        });
      } catch (e) {}
    }
    function paint() {
      var pct = S.deckSize ? Math.round(100 * S.done / S.deckSize) : 0;
      S.bar.style.width = pct + '%';
      S.scoreVal.textContent = accuracy(S);
      S.count.textContent = 'REVIEWED ' + S.done + ' OF ' + S.deckSize +
        (S.queue.length ? '  ·  ' + S.queue.length + ' IN QUEUE' : '');
      hud();
    }

    /* ---------------- start screen ---------------- */
    function renderStart() {
      var cats = CATS.map(function (c) {
        var n = c.id === 'all' ? CARDS.length : CARDS.filter(function (x) { return x.cat === c.id; }).length;
        var on = (S.cat === c.id) ? ' fc-on' : '';
        var dis = (S.daily && c.id !== 'all') ? ' disabled' : '';
        return '<button class="fc-cat' + on + '" data-cat="' + c.id + '"' + dis + '>' +
          esc(c.label) + ' · ' + n + '</button>';
      }).join('');
      S.stage.innerHTML =
        '<div class="fc-start"><h1>Signal <span>Flashcards</span></h1>' +
        '<p>Terms, visual demos, and reverse ID drills — with spaced repetition. ' +
        'Miss a card and it comes back soon. Clear the queue to finish.</p>' +
        '<div class="fc-cats">' + cats + '</div>' +
        '<button class="fc-bigbtn" id="fc-go">Start drill</button>' +
        '<div class="fc-modes">' +
        '<div class="fc-mode"><b>Term cards</b>Flip it, then call it: got it or missed it.</div>' +
        '<div class="fc-mode"><b>Visual cards</b>See the look, name the technique.</div>' +
        '<div class="fc-mode"><b>Reverse</b>Given the term, pick the right image.</div>' +
        '</div></div>';
      var btns = S.stage.querySelectorAll('.fc-cat');
      for (var i = 0; i < btns.length; i++) {
        (function (b) {
          b.addEventListener('click', function () {
            if (b.disabled) return;
            tap(); sfx('tick');
            S.cat = b.getAttribute('data-cat');
            renderStart();
          });
        })(btns[i]);
      }
      S.stage.querySelector('#fc-go').addEventListener('click', function () {
        tap(18); sfx('flip');
        startSession();
      });
      paint();
    }

    function startSession() {
      S.queue = buildDeck(S.cat, S.daily);
      S.deck = S.queue.map(function (e) { return e.card; });
      S.deckSize = S.queue.length;
      S.correct = 0; S.attempts = 0; S.done = 0; S.misses = 0; S.finished = false;
      paint();
      nextCard();
    }

    /* ---------------- card flow ---------------- */
    function nextCard() {
      if (S.finished) return;
      var entry = drawNext(S);
      if (!entry) return renderResults();
      if (entry.mode === 'visual') renderVisualQ(entry);
      else if (entry.mode === 'reverse') renderReverseQ(entry);
      else renderTerm(entry);
    }

    /* Spaced repetition: correct retires the card; a miss raises weight and
       re-queues near the front. After 3 misses the card is force-retired. */
    function answer(entry, ok) {
      S.attempts++;
      if (ok) {
        S.correct++;
        S.done++;
        sfx('good'); tap(14);
      } else {
        S.misses++;
        entry.seen++;
        entry.weight = Math.min(entry.weight + 2, 6);
        sfx('bad'); tap(30);
        if (entry.seen < 3) {
          var pos = Math.floor(Math.random() * Math.min(3, S.queue.length + 1));
          S.queue.splice(pos, 0, entry);
        } else {
          S.done++; /* force-retire: the queue must always drain */
        }
      }
      paint();
      later(nextCard, ok ? 650 : 1400);
    }

    /* ---- mode 1: term card (flip) ---- */
    function renderTerm(entry) {
      var c = entry.card;
      S.stage.innerHTML =
        '<div class="fc-stage"><p class="fc-q">Term card · <b>' + esc(catLabel(c.cat)) + '</b> · tap to flip</p>' +
        '<div class="fc-card" id="fc-card"><div class="fc-card-inner">' +
        '<div class="fc-face"><div class="fc-kicker">Signal Flashcards</div>' +
        '<p class="fc-term">' + esc(c.term) + '</p>' +
        '<p class="fc-hintline">Tap the card to reveal</p></div>' +
        '<div class="fc-face fc-back"><div class="fc-kicker">' + esc(c.term) + '</div>' +
        '<p class="fc-def">' + esc(c.def) + '</p>' +
        '<div class="fc-tip"><b>FIELD TIP</b>' + esc(c.tip) + '</div></div>' +
        '</div></div>' +
        '<div class="fc-verdict" id="fc-verdict" style="visibility:hidden">' +
        '<button class="fc-missed" id="fc-miss">Missed it</button>' +
        '<button class="fc-got" id="fc-got">Got it</button></div></div>';
      var card = S.stage.querySelector('#fc-card');
      var verdict = S.stage.querySelector('#fc-verdict');
      var flipped = false, voted = false;
      card.addEventListener('click', function () {
        flipped = !flipped;
        card.classList.toggle('fc-flipped', flipped);
        verdict.style.visibility = flipped ? 'visible' : 'hidden';
        sfx('flip'); tap();
      });
      S.stage.querySelector('#fc-got').addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (voted) return; voted = true;
        answer(entry, true);
      });
      S.stage.querySelector('#fc-miss').addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (voted) return; voted = true;
        answer(entry, false);
      });
    }

    /* ---- mode 2: visual card (name the technique) ---- */
    function renderVisualQ(entry) {
      var c = entry.card;
      var opts = shuffle([c].concat(distractors(c, S.deck, 2)));
      var html = '<div class="fc-stage"><p class="fc-q">Visual card · what created <b>this look</b>?</p>' +
        VISUALS[c.id]() + '<div class="fc-choices" id="fc-choices">';
      opts.forEach(function (o) {
        html += '<button class="fc-choice" data-id="' + o.id + '">' + esc(o.term) + '</button>';
      });
      html += '</div></div>';
      S.stage.innerHTML = html;
      var btns = S.stage.querySelectorAll('.fc-choice');
      var locked = false;
      for (var i = 0; i < btns.length; i++) {
        (function (b) {
          b.addEventListener('click', function () {
            if (locked) return;
            locked = true;
            var ok = b.getAttribute('data-id') === c.id;
            for (var j = 0; j < btns.length; j++) {
              btns[j].disabled = true;
              if (btns[j].getAttribute('data-id') === c.id) btns[j].classList.add('fc-right');
            }
            if (!ok) b.classList.add('fc-wrongpick');
            answer(entry, ok);
          });
        })(btns[i]);
      }
    }

    /* ---- mode 3: reverse (pick the image) ---- */
    function renderReverseQ(entry) {
      var c = entry.card;
      var opts = shuffle([c].concat(visualDistractors(c, S.deck, 2)));
      var html = '<div class="fc-stage"><p class="fc-q">Reverse · which image shows <b>' +
        esc(c.term) + '</b>?</p><div class="fc-visopts" id="fc-vopts">';
      opts.forEach(function (o) {
        html += '<button class="fc-visopt" data-id="' + o.id + '">' + VISUALS[o.id]() + '</button>';
      });
      html += '</div></div>';
      S.stage.innerHTML = html;
      var btns = S.stage.querySelectorAll('.fc-visopt');
      var locked = false;
      for (var i = 0; i < btns.length; i++) {
        (function (b) {
          b.addEventListener('click', function () {
            if (locked) return;
            locked = true;
            var ok = b.getAttribute('data-id') === c.id;
            for (var j = 0; j < btns.length; j++) {
              btns[j].disabled = true;
              if (btns[j].getAttribute('data-id') === c.id) btns[j].classList.add('fc-right');
            }
            if (!ok) b.classList.add('fc-wrongpick');
            answer(entry, ok);
          });
        })(btns[i]);
      }
    }

    function catLabel(id) {
      for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].label;
      return id;
    }

    /* ---------------- results ---------------- */
    function renderResults() {
      S.finished = true;
      clearTimers();
      var sc = accuracy(S);
      try { S.api.toast(sc >= 80 ? 'Sharp work, operator.' : sc >= 50 ? 'Deck cleared — run it back.' : 'Tough deck. The misses are the lesson.'); } catch (e) {}
      sfx(sc >= 80 ? 'good' : 'tick');
      S.stage.innerHTML =
        '<div class="fc-results"><h2>Deck <span>cleared</span></h2>' +
        '<div class="fc-ring" style="--fc-pct:' + sc + '%"><b>' + sc + '</b></div>' +
        '<div class="fc-stats">' +
        '<div class="fc-stat"><b>' + S.correct + '/' + S.attempts + '</b>ACCURACY</div>' +
        '<div class="fc-stat"><b>' + S.deckSize + '</b>CARDS</div>' +
        '<div class="fc-stat"><b>' + S.misses + '</b>RETRIES</div>' +
        '</div>' +
        '<p class="fc-note">Missed cards resurfaced automatically — that\u2019s spaced repetition doing its job. ' +
        'Score is banked from accuracy across every attempt.</p>' +
        '<div class="fc-verdict">' +
        '<button class="fc-missed" id="fc-again">Run it back</button>' +
        '<button class="fc-got" id="fc-done">Bank score</button>' +
        '</div></div>';
      paint();
      var doneT = later(function () { try { S.api.finish(); } catch (e) {} }, 200);
      S.stage.querySelector('#fc-again').addEventListener('click', function () {
        S.timers = S.timers.filter(function (t) { return t !== doneT; });
        clearTimeout(doneT);
        tap(); sfx('flip');
        startSession();
      });
      S.stage.querySelector('#fc-done').addEventListener('click', function () {
        S.timers = S.timers.filter(function (t) { return t !== doneT; });
        clearTimeout(doneT);
        tap(18);
        try { S.api.finish(); } catch (e) {}
      });
    }

    /* ---------------- lifecycle ---------------- */
    function pause() { S.paused = true; clearTimers(); }
    function resume() { if (S.root.isConnected) S.paused = false; }
    function getSnapshot() {
      return {
        score: accuracy(S),
        detail: {
          correct: S.correct, attempts: S.attempts, deckSize: S.deckSize,
          misses: S.misses, category: S.cat, finished: S.finished,
          daily: S.daily
        }
      };
    }

    M = {
      root: root,
      pause: pause,
      resume: resume,
      getSnapshot: getSnapshot,
      _S: S
    };

    renderStart();
    try { S.api.hud({ progress: 0, label: 'Pick a category' }); } catch (e) {}
  }

  function destroy() {
    if (M) {
      try { M.pause(); } catch (e) {}
      if (M.root && M.root.parentNode) M.root.parentNode.removeChild(M.root);
      M = null;
    }
  }

  window.CDGames.register('flashcards', {
    version: 'v1',
    title: 'Signal Flashcards',
    init: init,
    destroy: destroy,
    pause: function () { if (M) M.pause(); },
    resume: function () { if (M) M.resume(); },
    getSnapshot: function () { return M ? M.getSnapshot() : { score: 0, detail: {} }; }
  });
})();
