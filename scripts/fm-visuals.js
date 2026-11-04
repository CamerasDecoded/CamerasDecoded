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
      '<defs><radialGradient id="triGlow" cx="50%" cy="46%" r="55%">' +
      '<stop offset="0%" stop-color="' + NEON + '" stop-opacity=".13"/>' +
      '<stop offset="100%" stop-color="' + NEON + '" stop-opacity="0"/></radialGradient></defs>' +
      label(180, 30, "EXPOSURE TRIANGLE", 12, NEON, "middle", 700) +
      /* triangle with a lit interior */
      '<path d="M180 78 L62 226 L298 226 Z" fill="url(#triGlow)" stroke="' + NEON + '" stroke-width="2"/>' +
      /* corner nodes: dark rings carrying a small icon each —
         aperture iris (top), shutter dial (left), ISO gain bars (right) */
      '<circle cx="180" cy="78" r="11" fill="#0a0f05" stroke="' + NEON + '" stroke-width="1.5"/>' +
      '<polygon points="184.2,78 182.1,81.6 177.9,81.6 175.8,78 177.9,74.4 182.1,74.4" fill="none" stroke="' + NEON + '" stroke-width="1.2"/>' +
      '<circle cx="62" cy="226" r="11" fill="#0a0f05" stroke="' + NEON + '" stroke-width="1.5"/>' +
      '<circle cx="62" cy="226" r="5.5" fill="none" stroke="' + NEON + '" stroke-width="1.2"/>' +
      '<line x1="62" y1="226" x2="65.5" y2="222.5" stroke="' + NEON + '" stroke-width="1.2"/>' +
      '<circle cx="298" cy="226" r="11" fill="#0a0f05" stroke="' + NEON + '" stroke-width="1.5"/>' +
      '<rect x="293.4" y="227" width="2.6" height="3" fill="' + NEON + '"/>' +
      '<rect x="297" y="224.5" width="2.6" height="5.5" fill="' + NEON + '"/>' +
      '<rect x="300.6" y="222" width="2.6" height="8" fill="' + NEON + '"/>' +
      /* corner labels */
      label(180, 56, "APERTURE", 12, TEXT, "middle", 700) +
      label(62, 252, "SHUTTER", 12, TEXT, "middle", 700) +
      label(298, 252, "ISO", 12, TEXT, "middle", 700) +
      /* sub-ranges: kept clear of the edges — aperture beside its node,
         shutter / ISO ranges under their corner labels */
      label(198, 70, "f/1.8 \u2194 f/16", 10, TEXT, "start") +
      label(62, 270, "1/1000 \u2194 30\u2033", 10, TEXT) +
      label(298, 270, "100 \u2194 12800", 10, TEXT) +
      /* center */
      label(180, 168, "CHANGE ONE \u2014", 10, FAINT) +
      label(180, 182, "MOVE ANOTHER", 10, FAINT) +
      label(180, 198, "TO HOLD EXPOSURE", 10, NEON, "middle", 700);
    return frame(360, 286, inner);
  }

  /* ---------------- 2. aperture vs depth of field (graph) ---------------- */
  function apertureDof(){
    /* plot shifted right (axis at x=64) so the y labels sit inside the
       frame; x: f/1.8 (64) -> f/16 (320); y: shallow (200) -> deep (60).
       Below the graph, a scene strip shows the same subject at three
       apertures: background discs melt at f/1.8, resolve by f/16. */
    var curve = "M64 196 C130 188 190 150 320 66";
    function panel(x, fLabel, discs, ridge){
      var s = '<rect x="' + x + '" y="246" width="84" height="52" rx="10" fill="rgba(141,235,0,.03)" stroke="rgba(141,235,0,.18)"/>' +
        label(x + 9, 259, fLabel, 8.5, FAINT, "start") +
        '<line x1="' + (x + 8) + '" y1="284" x2="' + (x + 76) + '" y2="284" stroke="' + DIM + '" stroke-width="1"/>';
      if (ridge) s += '<path d="M' + (x + 40) + ' 284 L' + (x + 54) + ' 269 L' + (x + 63) + ' 277 L' + (x + 71) + ' 271 L' + (x + 79) + ' 284" fill="none" stroke="' + FAINT + '" stroke-width="1.2"/>';
      s += discs;
      s += '<circle cx="' + (x + 21) + '" cy="271" r="6" fill="' + NEON + '"/>';
      return s;
    }
    var soft = ' filter="url(#dofSoft)"', softSm = ' filter="url(#dofSoftSm)"';
    var p1 = panel(48, "f/1.8",
      '<circle cx="100" cy="264" r="9" fill="' + NEON + '" opacity=".35"' + soft + '/>' +
      '<circle cx="116" cy="274" r="7" fill="' + NEON + '" opacity=".35"' + soft + '/>' +
      '<circle cx="94" cy="279" r="5.5" fill="' + NEON + '" opacity=".35"' + soft + '/>', false);
    var p2 = panel(148, "f/5.6",
      '<circle cx="200" cy="264" r="6" fill="' + NEON + '" opacity=".4"' + softSm + '/>' +
      '<circle cx="214" cy="273" r="5" fill="' + NEON + '" opacity=".4"' + softSm + '/>' +
      '<circle cx="195" cy="278" r="4" fill="' + NEON + '" opacity=".4"' + softSm + '/>', false);
    var p3 = panel(248, "f/16",
      '<circle cx="314" cy="262" r="3.5" fill="' + NEON + '" opacity=".55"/>' +
      '<circle cx="322" cy="270" r="3" fill="' + NEON + '" opacity=".55"/>' +
      '<circle cx="308" cy="272" r="2.5" fill="' + NEON + '" opacity=".55"/>', true);
    var inner =
      '<defs>' +
      '<linearGradient id="dofFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + NEON + '" stop-opacity=".16"/>' +
      '<stop offset="100%" stop-color="' + NEON + '" stop-opacity=".01"/></linearGradient>' +
      '<filter id="dofSoft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>' +
      '<filter id="dofSoftSm" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.1"/></filter>' +
      '</defs>' +
      label(180, 30, "APERTURE \u2192 DEPTH OF FIELD", 12, NEON, "middle", 700) +
      /* axes */
      '<line x1="64" y1="210" x2="330" y2="210" stroke="' + DIM + '" stroke-width="1"/>' +
      '<line x1="64" y1="210" x2="64" y2="46" stroke="' + DIM + '" stroke-width="1"/>' +
      /* lit area under the curve */
      '<path d="' + curve + ' L320 210 L64 210 Z" fill="url(#dofFill)"/>' +
      /* curve */
      '<path d="' + curve + '" fill="none" stroke="' + NEON + '" stroke-width="2.5"/>' +
      '<circle cx="64" cy="196" r="4" fill="' + NEON + '"/>' +
      '<circle cx="320" cy="66" r="4" fill="' + NEON + '"/>' +
      /* x ticks */
      label(64, 228, "f/1.8", 10, FAINT) +
      label(150, 228, "f/4", 10, FAINT) +
      label(236, 228, "f/8", 10, FAINT) +
      label(320, 228, "f/16", 10, FAINT) +
      /* y labels */
      label(56, 200, "shallow", 10, FAINT, "end") +
      label(56, 70, "deep", 10, FAINT, "end") +
      /* callouts */
      label(106, 156, "creamy blur", 10, FAINT) +
      label(262, 92, "sharp front-to-back", 10, FAINT) +
      /* scene strip */
      p1 + p2 + p3;
    return frame(360, 312, inner);
  }

  /* ---------------- 3. ISO vs noise (graph) ---------------- */
  function isoNoise(){
    /* same right-shifted plot as apertureDof so the y labels stay inside
       the frame; log-ish x positions for 100..12800; y: clean -> grainy */
    var curve = "M72 198 C130 192 180 178 216 150 C252 122 288 92 322 62";
    /* grain field: sparse fine specks across the plot, denser and
       coarser toward the high-ISO end — the noise the curve describes */
    var grain = "", i, gx, gy;
    for (i = 0; i < 26; i++){
      gx = 70 + ((i * 47) % 252); gy = 54 + ((i * 31) % 148);
      grain += '<circle cx="' + gx + '" cy="' + gy + '" r="0.9" fill="' + FAINT + '" opacity=".16"/>';
    }
    for (i = 0; i < 30; i++){
      gx = 196 + ((i * 29) % 128); gy = 54 + ((i * 41) % 148);
      grain += '<circle cx="' + gx + '" cy="' + gy + '" r="' + (1.3 + ((i * 7) % 3) * 0.5).toFixed(1) + '" fill="' + TEXT + '" opacity=".28"/>';
    }
    var inner =
      '<defs><linearGradient id="isoFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + NEON + '" stop-opacity=".14"/>' +
      '<stop offset="100%" stop-color="' + NEON + '" stop-opacity=".01"/></linearGradient></defs>' +
      label(180, 30, "ISO \u2192 NOISE", 12, NEON, "middle", 700) +
      '<line x1="64" y1="210" x2="330" y2="210" stroke="' + DIM + '" stroke-width="1"/>' +
      '<line x1="64" y1="210" x2="64" y2="46" stroke="' + DIM + '" stroke-width="1"/>' +
      grain +
      '<path d="' + curve + ' L322 210 L72 210 Z" fill="url(#isoFill)"/>' +
      '<path d="' + curve + '" fill="none" stroke="' + NEON + '" stroke-width="2.5"/>' +
      '<circle cx="72" cy="198" r="4" fill="' + NEON + '"/>' +
      '<circle cx="322" cy="62" r="4" fill="' + NEON + '"/>' +
      label(72, 228, "100", 10, FAINT) +
      label(152, 228, "800", 10, FAINT) +
      label(238, 228, "3200", 10, FAINT) +
      label(322, 228, "12800", 10, FAINT) +
      label(56, 200, "clean", 10, FAINT, "end") +
      label(56, 70, "grainy", 10, FAINT, "end") +
      label(124, 176, "sweet spot", 10, FAINT) +
      label(232, 82, "use only if", 10, FAINT) +
      label(232, 95, "you must", 10, FAINT);
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
    var inner =
      '<defs><linearGradient id="shuFade" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="' + NEON + '" stop-opacity=".95"/>' +
      '<stop offset="100%" stop-color="' + NEON + '" stop-opacity=".2"/></linearGradient></defs>' +
      label(180, 30, "SHUTTER SPEED \u2192 MOTION", 12, NEON, "middle", 700) +
      /* freeze spark over the fastest stop */
      '<path d="M52 42 L54.6 49.4 L62 52 L54.6 54.6 L52 62 L49.4 54.6 L42 52 L49.4 49.4 Z" fill="' + NEON + '"/>';
    inner += '<line x1="36" y1="80" x2="324" y2="80" stroke="' + DIM + '" stroke-width="1"/>';
    stops.forEach(function(s){
      inner += '<circle cx="' + s.x + '" cy="80" r="8" fill="' + NEON + '" opacity=".14"/>';
      inner += '<circle cx="' + s.x + '" cy="80" r="4" fill="' + NEON + '"/>';
      inner += label(s.x, 102, s.t, 10, TEXT, "middle", 700);
      /* motion streak: horizontal neon smear that fades along its
         length like real motion blur; longer = more blur, clamped so
         the longest streak ends inside the frame */
      var sx = Math.max(8, Math.min(s.x - s.streak, 352 - s.streak * 2));
      inner += '<rect x="' + sx + '" y="126" width="' + (s.streak * 2) + '" height="10" rx="5" ' +
        'fill="url(#shuFade)" opacity="' + (0.9 - (s.streak / 70) * 0.35).toFixed(2) + '"/>';
      inner += '<circle cx="' + s.x + '" cy="131" r="7" fill="none" stroke="' + NEON + '" stroke-width="2"/>';
    });
    inner += label(36, 168, "freezes motion", 10, FAINT, "start");
    inner += label(324, 168, "blurs motion", 10, FAINT, "end");
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

  /* ---------------- 7. myth vs method (contrast) ---------------- */
  function mythVsMethod(){
    var inner =
      label(180, 30, "MYTH vs METHOD", 12, NEON, "middle", 700) +
      '<line x1="180" y1="46" x2="180" y2="226" stroke="rgba(141,235,0,.18)"/>' +
      /* left: myth */
      label(96, 54, "MAGIC BUTTON", 10, FAINT, "middle", 700) +
      label(96, 68, "MYTH", 10, FAINT, "middle", 700) +
      '<circle cx="96" cy="104" r="17" fill="none" stroke="' + FAINT + '" stroke-width="2"/>' +
      '<circle cx="96" cy="104" r="6" fill="' + FAINT + '"/>' +
      label(96, 138, "presses one button", 9, FAINT) +
      label(96, 152, "expects art", 9, FAINT) +
      '<line x1="96" y1="162" x2="96" y2="178" stroke="' + DIM + '" stroke-width="1.5"/>' +
      label(96, 200, "\u2715 FRUSTRATION", 11, "#e06c5b", "middle", 700) +
      /* right: method */
      label(264, 54, "DECODER\u2019S", 10, NEON, "middle", 700) +
      label(264, 68, "METHOD", 10, NEON, "middle", 700);
    ["TOOL", "SIGNAL", "METHOD"].forEach(function(w, i){
      var y = 88 + i * 34;
      inner += '<rect x="222" y="' + y + '" width="84" height="26" rx="8" fill="rgba(141,235,0,.06)" stroke="' + NEON + '" stroke-width="1.5"/>' +
        label(264, y + 17, w, 10, TEXT, "middle", 700);
    });
    inner += '<line x1="264" y1="192" x2="264" y2="204" stroke="' + NEON + '" stroke-width="1.5"/>' +
      label(264, 222, "\u2713 CONFIDENCE", 11, NEON, "middle", 700);
    return frame(360, 244, inner);
  }

  /* ---------------- 8. what's in the box (flat-lay) ---------------- */
  function boxEcosystem(){
    function card(x, y, icon, name, role){
      return '<rect x="' + x + '" y="' + y + '" width="150" height="86" rx="10" fill="rgba(141,235,0,.04)" stroke="rgba(141,235,0,.25)"/>' +
        icon +
        label(x + 75, y + 62, name, 10, TEXT, "middle", 700) +
        label(x + 75, y + 76, role, 9, FAINT);
    }
    var inner =
      label(180, 30, "WHAT\u2019S IN THE BOX", 12, NEON, "middle", 700) +
      card(28, 52,
        '<rect x="86" y="62" width="34" height="24" rx="5" fill="none" stroke="' + NEON + '" stroke-width="2"/>' +
        '<circle cx="103" cy="74" r="7" fill="none" stroke="' + NEON + '" stroke-width="1.5"/>',
        "BODY", "the brain") +
      card(182, 52,
        '<rect x="240" y="64" width="44" height="20" rx="6" fill="none" stroke="' + NEON + '" stroke-width="2"/>' +
        '<ellipse cx="240" cy="74" rx="5" ry="10" fill="none" stroke="' + NEON + '" stroke-width="1.5"/>',
        "LENS", "the eye") +
      card(28, 148,
        '<rect x="88" y="158" width="30" height="16" rx="3" fill="none" stroke="' + NEON + '" stroke-width="2"/>' +
        '<rect x="114" y="162" width="8" height="8" fill="' + NEON + '"/>',
        "BATTERY", "the lifeblood") +
      card(182, 148,
        '<rect x="244" y="160" width="32" height="18" rx="4" fill="none" stroke="' + NEON + '" stroke-width="2"/>' +
        '<line x1="252" y1="160" x2="252" y2="152" stroke="' + NEON + '" stroke-width="2"/>' +
        '<line x1="268" y1="160" x2="268" y2="152" stroke="' + NEON + '" stroke-width="2"/>',
        "CHARGER", "usb-c power") +
      '<rect x="28" y="248" width="304" height="52" rx="10" fill="none" stroke="' + FAINT + '" stroke-width="1.5" stroke-dasharray="7 5"/>' +
      label(180, 268, "NOT IN THE BOX", 10, FAINT, "middle", 700) +
      label(180, 286, "HIGH-SPEED SD CARD \u2014 BUY SEPARATELY", 10, TEXT, "middle", 700);
    return frame(360, 322, inner);
  }

  /* ---------------- 9. menu map (tree) ---------------- */
  function menuMap(){
    var cats = ["SHOOTING", "AF", "PLAYBK", "NETWORK", "SETUP"];
    var inner = label(180, 30, "MENU MAP", 12, NEON, "middle", 700);
    cats.forEach(function(c, i){
      var x = 40 + i * 70;
      inner += '<rect x="' + (x - 32) + '" y="48" width="64" height="24" rx="7" fill="rgba(141,235,0,.05)" stroke="' + DIM + '"/>' +
        label(x, 64, c, 9, TEXT, "middle", 700) +
        '<line x1="' + x + '" y1="72" x2="180" y2="196" stroke="' + DIM + '" stroke-width="1" opacity=".45"/>';
    });
    var sets = ["IMAGE QUALITY", "ISO LIMITS", "FOCUS AREA", "EYE AF", "DRIVE MODE", "FORMAT CARD"];
    sets.forEach(function(s, i){
      var x = 66 + (i % 3) * 114, y = 104 + Math.floor(i / 3) * 36;
      inner += '<rect x="' + (x - 52) + '" y="' + y + '" width="104" height="26" rx="8" fill="rgba(141,235,0,.04)" stroke="rgba(141,235,0,.3)"/>' +
        label(x, y + 17, s, 9, TEXT, "middle", 700) +
        '<line x1="' + x + '" y1="' + (y + 26) + '" x2="180" y2="196" stroke="' + DIM + '" stroke-width="1" opacity=".45"/>';
    });
    inner += '<rect x="110" y="196" width="140" height="34" rx="10" fill="rgba(141,235,0,.1)" stroke="' + NEON + '" stroke-width="2"/>' +
      label(180, 218, "MY MENU \u2605", 12, NEON, "middle", 700) +
      label(180, 254, "EVERY BRAND, SAME FIVE TERRITORIES \u2014 LEARN THE MAP ONCE", 9, FAINT);
    return frame(360, 276, inner);
  }

  /* ---------------- 10. SD card anatomy ---------------- */
  function sdAnatomy(){
    var inner =
      label(180, 30, "READ THE CARD", 12, NEON, "middle", 700) +
      /* card body with notched corner */
      '<polygon points="52,64 138,64 162,88 162,244 52,244" fill="rgba(141,235,0,.05)" stroke="' + NEON + '" stroke-width="2"/>' +
      '<rect x="66" y="200" width="82" height="26" rx="3" fill="none" stroke="' + DIM + '"/>' +
      label(107, 218, "contacts", 8, FAINT);
    var rows = [
      [96, "CAPACITY", "how much it holds"],
      [120, "READ SPEED", "MB/s offload"],
      [144, "WRITE SPEED", "MB/s record"],
      [168, "V60 / V90", "video class"],
      [192, "SDXC", "card type"],
      [216, "UHS-II", "bus interface"]
    ];
    rows.forEach(function(r){
      inner += '<line x1="162" y1="' + r[0] + '" x2="196" y2="' + r[0] + '" stroke="' + DIM + '"/>' +
        '<circle cx="162" cy="' + r[0] + '" r="3" fill="' + NEON + '"/>' +
        label(202, r[0] - 2, r[1], 10, TEXT, "start", 700) +
        label(202, r[0] + 12, r[2], 9, FAINT, "start");
    });
    inner += label(180, 272, "EVERY MARKING IS A SPEC \u2014 READ BEFORE YOU TRUST", 9, FAINT);
    return frame(360, 294, inner);
  }

  /* ---------------- 11. lens mount flow ---------------- */
  function lensMountFlow(){
    var steps = [
      ["1", "FIND THE MARK", "white dot on lens"],
      ["2", "ALIGN", "match the body mark"],
      ["3", "ROTATE", "until it CLICKS"]
    ];
    var inner = label(180, 30, "MOUNT THE LENS", 12, NEON, "middle", 700);
    steps.forEach(function(s, i){
      var x = 66 + i * 114;
      inner += '<circle cx="' + x + '" cy="76" r="20" fill="rgba(141,235,0,.07)" stroke="' + NEON + '" stroke-width="2"/>' +
        label(x, 82, s[0], 14, NEON, "middle", 700) +
        label(x, 116, s[1], 10, TEXT, "middle", 700) +
        label(x, 132, s[2], 9, FAINT);
      if(i < 2){
        inner += '<line x1="' + (x + 26) + '" y1="76" x2="' + (x + 82) + '" y2="76" stroke="' + NEON + '" stroke-width="1.5"/>' +
          '<polygon points="' + (x + 82) + ',70 ' + (x + 82) + ',82 ' + (x + 92) + ',76" fill="' + NEON + '"/>';
      }
    });
    inner += label(180, 168, "NEVER FORCE IT \u2014 NEVER PRESS THE RELEASE TO MOUNT", 9, FAINT);
    return frame(360, 190, inner);
  }

  /* ---------------- 12. focus peaking demo ---------------- */
  function peakingDemo(){
    var inner =
      label(180, 30, "FOCUS PEAKING", 12, NEON, "middle", 700) +
      label(96, 56, "OFF", 10, FAINT, "middle", 700) +
      label(264, 56, "ON", 10, NEON, "middle", 700) +
      /* left: plain silhouette */
      '<circle cx="96" cy="106" r="26" fill="none" stroke="' + FAINT + '" stroke-width="2"/>' +
      '<path d="M58 168 C62 140 130 140 134 168" fill="none" stroke="' + FAINT + '" stroke-width="2"/>' +
      /* right: same silhouette with neon edge glow */
      '<circle cx="264" cy="106" r="26" fill="none" stroke="' + FAINT + '" stroke-width="2"/>' +
      '<circle cx="264" cy="106" r="26" fill="none" stroke="' + NEON + '" stroke-width="4" opacity=".35"/>' +
      '<path d="M226 168 C230 140 298 140 302 168" fill="none" stroke="' + NEON + '" stroke-width="4" opacity=".35"/>' +
      '<path d="M226 168 C230 140 298 140 302 168" fill="none" stroke="#ffd23f" stroke-width="1.6" stroke-dasharray="6 4"/>' +
      '<circle cx="264" cy="106" r="26" fill="none" stroke="#ffd23f" stroke-width="1.6" stroke-dasharray="6 4"/>' +
      label(180, 200, "EDGES GLOW WHERE FOCUS LANDS", 10, TEXT, "middle", 700) +
      label(180, 218, "MORE COLOR = MORE IN FOCUS", 10, NEON, "middle", 700);
    return frame(360, 240, inner);
  }

  /* ---------------- 13. zebra demo ---------------- */
  function zebraDemo(){
    var inner =
      label(180, 30, "ZEBRA \u2014 HIGHLIGHT ALERT", 12, NEON, "middle", 700) +
      '<defs>' +
      '<linearGradient id="zb-sky" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#f4f7ef"/><stop offset="1" stop-color="#5c6b58"/></linearGradient>' +
      '<pattern id="zb-stripes" width="12" height="12" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">' +
      '<rect width="12" height="12" fill="rgba(0,0,0,0)"/>' +
      '<rect width="6" height="12" fill="rgba(20,20,20,.85)"/></pattern>' +
      '</defs>' +
      label(100, 56, "WITHOUT", 10, FAINT, "middle", 700) +
      label(260, 56, "WITH ZEBRA", 10, NEON, "middle", 700) +
      /* left photo: blown sky, no warning */
      '<rect x="30" y="66" width="140" height="110" rx="8" fill="url(#zb-sky)"/>' +
      '<rect x="30" y="130" width="140" height="46" rx="0" fill="#2c352c"/>' +
      /* right photo: same + zebra overlay on sky */
      '<rect x="190" y="66" width="140" height="110" rx="8" fill="url(#zb-sky)"/>' +
      '<rect x="190" y="66" width="140" height="64" fill="url(#zb-stripes)" opacity=".9"/>' +
      '<rect x="190" y="130" width="140" height="46" fill="#2c352c"/>' +
      label(100, 198, "clipped \u2014 and you", 9, FAINT) +
      label(100, 212, "would never know", 9, FAINT) +
      label(260, 198, "stripes = overexposed", 9, NEON, "middle", 700) +
      label(260, 212, "dial it back on the spot", 9, FAINT);
    return frame(360, 234, inner);
  }

  /* ---------------- 14. out-of-box settings checklist ---------------- */
  function settingsChecklist(){
    var steps = [
      ["PHYSICAL SETUP", "battery \u00b7 card \u00b7 lens"],
      ["IMAGE QUALITY", "RAW + JPEG"],
      ["RELEASE W/O LENS", "ON"],
      ["MODE DIAL", "A \u2014 aperture priority"],
      ["ISO AUTO", "capped 6400 / 12800"],
      ["AUTOFOCUS", "AF-C \u00b7 wide \u00b7 eye AF"],
      ["FOCUS PEAKING", "ON \u2014 red / yellow"],
      ["HIGHLIGHT ALERT", "zebra \u2014 ON"],
      ["EVF", "setting effect ON"]
    ];
    var inner = label(180, 28, "OUT-OF-BOX SEQUENCE", 12, NEON, "middle", 700);
    inner += '<line x1="40" y1="52" x2="40" y2="' + (52 + (steps.length - 1) * 36) + '" stroke="' + DIM + '" stroke-width="2"/>';
    steps.forEach(function(s, i){
      var y = 52 + i * 36;
      inner += '<circle cx="40" cy="' + y + '" r="11" fill="#0b120a" stroke="' + NEON + '" stroke-width="2"/>' +
        label(40, y + 4, String(i + 1), 10, NEON, "middle", 700) +
        label(62, y - 1, s[0], 10, TEXT, "start", 700) +
        label(62, y + 13, s[1], 9, FAINT, "start");
    });
    inner += label(200, 52 + 9 * 36 + 6, "SET ONCE \u2014 SHOOT FOREVER", 10, NEON, "middle", 700);
    return frame(360, 52 + 9 * 36 + 30, inner);
  }

  var LIB = {
    "exposure-triangle": exposureTriangle,
    "aperture-dof": apertureDof,
    "iso-noise": isoNoise,
    "shutter-blur": shutterBlur,
    "camera-anatomy": cameraAnatomy,
    "light-path": lightPath,
    "myth-vs-method": mythVsMethod,
    "box-ecosystem": boxEcosystem,
    "menu-map": menuMap,
    "sd-anatomy": sdAnatomy,
    "lens-mount-flow": lensMountFlow,
    "peaking-demo": peakingDemo,
    "zebra-demo": zebraDemo,
    "settings-checklist": settingsChecklist
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
