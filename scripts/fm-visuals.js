/* Cameras Decoded — Field Manual SVG visuals.
   window.CDFmVisuals.render(id) -> inline SVG string for lesson blocks.
   Dark + neon-green brand language, Space Mono labels, fully responsive
   (viewBox scaling), no external assets. Reduced-motion safe (static). */
(function(){
  "use strict";

  var NEON = "#8deb00", DIM = "#4a7c2a", TEXT = "#e6f0e4", FAINT = "#93a894";
  var MONO = "ui-monospace,SFMono-Regular,Menlo,monospace";

  function frame(w, h, inner){
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-hidden="true" ' +
      'style="display:block;max-width:560px;margin:6px auto 4px">' +
      '<rect x="1" y="1" width="' + (w-2) + '" height="' + (h-2) + '" rx="14" fill="rgba(141,235,0,.03)" stroke="rgba(141,235,0,.22)"/>' +
      inner + '</svg>';
  }
  function label(x, y, text, size, color, anchor, weight){
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor||"middle") + '" ' +
      'font-family="' + MONO + '" font-size="' + (size||11) + '" ' +
      'fill="' + (color||FAINT) + '" letter-spacing="1.5"' +
      (weight ? ' font-weight="' + weight + '"' : '') + '>' + text + '</text>';
  }

  /* ---------------- 1. exposure triangle ---------------- */
  function exposureTriangle(){
    var inner =
      label(180, 34, "EXPOSURE TRIANGLE", 12, NEON, "middle", 700) +
      /* triangle */
      '<path d="M180 62 L62 210 L298 210 Z" fill="none" stroke="' + NEON + '" stroke-width="2"/>' +
      /* corner nodes */
      '<circle cx="180" cy="62" r="7" fill="' + NEON + '"/>' +
      '<circle cx="62" cy="210" r="7" fill="' + NEON + '"/>' +
      '<circle cx="298" cy="210" r="7" fill="' + NEON + '"/>' +
      /* corner labels */
      label(180, 50, "APERTURE", 12, TEXT, "middle", 700) +
      label(62, 234, "SHUTTER", 12, TEXT, "middle", 700) +
      label(298, 234, "ISO", 12, TEXT, "middle", 700) +
      /* sub-ranges */
      label(180, 84, "f/1.8 \u2194 f/16", 10, FAINT) +
      label(112, 196, "1/1000 \u2194 30\u2033", 10, FAINT) +
      label(248, 196, "100 \u2194 12800", 10, FAINT) +
      /* center */
      label(180, 158, "CHANGE ONE \u2014", 10, FAINT) +
      label(180, 172, "MOVE ANOTHER", 10, FAINT) +
      label(180, 188, "TO HOLD EXPOSURE", 10, DIM, "middle", 700);
    return frame(360, 262, inner);
  }

  /* ---------------- 2. aperture vs depth of field (graph) ---------------- */
  function apertureDof(){
    /* x: f/1.8 (40) -> f/16 (320); y: shallow (200) -> deep (60) */
    var curve = "M40 196 C110 188 170 150 320 66";
    var inner =
      label(180, 30, "APERTURE \u2192 DEPTH OF FIELD", 12, NEON, "middle", 700) +
      /* axes */
      '<line x1="40" y1="210" x2="330" y2="210" stroke="' + DIM + '" stroke-width="1"/>' +
      '<line x1="40" y1="210" x2="40" y2="46" stroke="' + DIM + '" stroke-width="1"/>' +
      /* curve */
      '<path d="' + curve + '" fill="none" stroke="' + NEON + '" stroke-width="2.5"/>' +
      '<circle cx="40" cy="196" r="4" fill="' + NEON + '"/>' +
      '<circle cx="320" cy="66" r="4" fill="' + NEON + '"/>' +
      /* x ticks */
      label(40, 228, "f/1.8", 10, FAINT) +
      label(130, 228, "f/4", 10, FAINT) +
      label(220, 228, "f/8", 10, FAINT) +
      label(320, 228, "f/16", 10, FAINT) +
      /* y labels */
      label(28, 200, "shallow", 10, FAINT, "end") +
      label(28, 70, "deep", 10, FAINT, "end") +
      /* callouts */
      label(96, 168, "creamy blur", 10, DIM) +
      label(272, 92, "sharp front-to-back", 10, DIM);
    return frame(360, 248, inner);
  }

  /* ---------------- 3. ISO vs noise (graph) ---------------- */
  function isoNoise(){
    /* log-ish x positions for 100..12800; y: clean (200) -> grainy (60) */
    var curve = "M48 198 C110 192 160 178 200 150 C240 122 280 92 322 62";
    var inner =
      label(180, 30, "ISO \u2192 NOISE", 12, NEON, "middle", 700) +
      '<line x1="40" y1="210" x2="330" y2="210" stroke="' + DIM + '" stroke-width="1"/>' +
      '<line x1="40" y1="210" x2="40" y2="46" stroke="' + DIM + '" stroke-width="1"/>' +
      '<path d="' + curve + '" fill="none" stroke="' + NEON + '" stroke-width="2.5"/>' +
      '<circle cx="48" cy="198" r="4" fill="' + NEON + '"/>' +
      '<circle cx="322" cy="62" r="4" fill="' + NEON + '"/>' +
      label(48, 228, "100", 10, FAINT) +
      label(140, 228, "800", 10, FAINT) +
      label(232, 228, "3200", 10, FAINT) +
      label(322, 228, "12800", 10, FAINT) +
      label(28, 200, "clean", 10, FAINT, "end") +
      label(28, 70, "grainy", 10, FAINT, "end") +
      label(104, 176, "sweet spot", 10, DIM) +
      label(276, 108, "use only if", 10, DIM) +
      label(276, 120, "you must", 10, DIM);
    return frame(360, 248, inner);
  }

  /* ---------------- 4. shutter speed vs motion blur (scale) ---------------- */
  function shutterBlur(){
    var stops = [
      { x: 52,  t: "1/1000", streak: 6 },
      { x: 116, t: "1/250",  streak: 16 },
      { x: 180, t: "1/60",   streak: 30 },
      { x: 244, t: "1/15",   streak: 48 },
      { x: 308, t: '1"',     streak: 70 }
    ];
    var inner = label(180, 30, "SHUTTER SPEED \u2192 MOTION", 12, NEON, "middle", 700);
    inner += '<line x1="36" y1="80" x2="324" y2="80" stroke="' + DIM + '" stroke-width="1"/>';
    stops.forEach(function(s){
      inner += '<circle cx="' + s.x + '" cy="80" r="4" fill="' + NEON + '"/>';
      inner += label(s.x, 102, s.t, 10, TEXT, "middle", 700);
      /* motion streak: horizontal neon smear, longer = more blur */
      inner += '<rect x="' + (s.x - s.streak) + '" y="126" width="' + (s.streak * 2) + '" height="10" rx="5" ' +
        'fill="' + NEON + '" opacity="' + (0.85 - (s.streak / 70) * 0.55).toFixed(2) + '"/>';
      inner += '<circle cx="' + s.x + '" cy="131" r="7" fill="none" stroke="' + NEON + '" stroke-width="2"/>';
    });
    inner += label(52, 168, "freezes motion", 10, DIM);
    inner += label(308, 168, "blurs motion", 10, DIM);
    inner += label(180, 196, "SLOWER SHUTTER = MORE LIGHT + MORE BLUR", 10, FAINT);
    return frame(360, 216, inner);
  }

  /* ---------------- 5. mirrorless anatomy (diagram) ---------------- */
  function cameraAnatomy(){
    var inner =
      label(180, 30, "MIRRORLESS ANATOMY", 12, NEON, "middle", 700) +
      /* body */
      '<rect x="120" y="70" width="130" height="110" rx="10" fill="rgba(141,235,0,.05)" stroke="' + NEON + '" stroke-width="2"/>' +
      /* lens barrel */
      '<rect x="52" y="96" width="68" height="58" rx="8" fill="rgba(141,235,0,.05)" stroke="' + NEON + '" stroke-width="2"/>' +
      '<ellipse cx="52" cy="125" rx="10" ry="29" fill="none" stroke="' + NEON + '" stroke-width="2"/>' +
      '<ellipse cx="52" cy="125" rx="4" ry="16" fill="rgba(141,235,0,.25)"/>' +
      /* sensor */
      '<rect x="196" y="96" width="10" height="58" fill="' + NEON + '"/>' +
      /* EVF hump */
      '<rect x="158" y="52" width="54" height="22" rx="6" fill="rgba(141,235,0,.05)" stroke="' + NEON + '" stroke-width="2"/>' +
      /* leader lines + labels */
      '<line x1="52" y1="96" x2="52" y2="52" stroke="' + DIM + '"/>' +
      label(52, 44, "LENS", 10, TEXT, "middle", 700) +
      '<line x1="201" y1="96" x2="201" y2="200" stroke="' + DIM + '"/>' +
      label(201, 214, "SENSOR", 10, TEXT, "middle", 700) +
      '<line x1="250" y1="110" x2="292" y2="110" stroke="' + DIM + '"/>' +
      label(296, 114, "MOUNT", 10, TEXT, "start", 700) +
      '<line x1="212" y1="52" x2="262" y2="40" stroke="' + DIM + '"/>' +
      label(266, 36, "EVF", 10, TEXT, "start", 700) +
      label(180, 244, "NO MIRROR \u2014 LIGHT HITS THE SENSOR DIRECTLY", 10, FAINT);
    return frame(360, 264, inner);
  }

  /* ---------------- 6. light path (diagram) ---------------- */
  function lightPath(){
    var inner =
      label(180, 30, "LIGHT PATH", 12, NEON, "middle", 700) +
      /* incoming parallel rays */
      '<line x1="30" y1="90" x2="140" y2="90" stroke="' + DIM + '" stroke-width="1.5"/>' +
      '<line x1="30" y1="125" x2="140" y2="125" stroke="' + DIM + '" stroke-width="1.5"/>' +
      '<line x1="30" y1="160" x2="140" y2="160" stroke="' + DIM + '" stroke-width="1.5"/>' +
      /* lens (biconvex) */
      '<path d="M140 78 C162 105 162 145 140 172 C118 145 118 105 140 78 Z" fill="rgba(141,235,0,.12)" stroke="' + NEON + '" stroke-width="2"/>' +
      /* converging rays */
      '<line x1="150" y1="90" x2="236" y2="112" stroke="' + NEON + '" stroke-width="1.5"/>' +
      '<line x1="150" y1="125" x2="236" y2="125" stroke="' + NEON + '" stroke-width="1.5"/>' +
      '<line x1="150" y1="160" x2="236" y2="138" stroke="' + NEON + '" stroke-width="1.5"/>' +
      /* focal point */
      '<circle cx="236" cy="125" r="4" fill="' + NEON + '"/>' +
      label(236, 148, "focus", 10, FAINT) +
      /* sensor */
      '<rect x="252" y="86" width="12" height="78" fill="' + NEON + '"/>' +
      label(258, 182, "SENSOR", 10, TEXT, "middle", 700) +
      /* labels */
      label(80, 70, "light in", 10, FAINT) +
      label(150, 196, "LENS BENDS LIGHT", 10, FAINT) +
      label(180, 214, "TO A SINGLE FOCAL POINT", 10, FAINT);
    return frame(360, 234, inner);
  }

  var LIB = {
    "exposure-triangle": exposureTriangle,
    "aperture-dof": apertureDof,
    "iso-noise": isoNoise,
    "shutter-blur": shutterBlur,
    "camera-anatomy": cameraAnatomy,
    "light-path": lightPath
  };

  window.CDFmVisuals = {
    ids: function(){ return Object.keys(LIB); },
    render: function(id){
      var fn = LIB[id];
      if(!fn) return "";
      try{ return fn(); }catch(e){ return ""; }
    }
  };
})();
