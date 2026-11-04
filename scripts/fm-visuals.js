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
    /* scene strip (matched to the aperture strip): the same subject at
       ISO 100 / 1600 / 12800 — blacks lift, edges soften, contrast
       flattens as sensitivity climbs. Smooth tones only, no speckle. */
    function isoPanel(x, isoLabel, bg, discs, subject, wash){
      var s = '<rect x="' + x + '" y="246" width="84" height="52" rx="10" fill="' + bg + '" stroke="rgba(141,235,0,.18)"/>' +
        label(x + 9, 259, isoLabel, 8.5, FAINT, "start") +
        '<line x1="' + (x + 8) + '" y1="284" x2="' + (x + 76) + '" y2="284" stroke="' + DIM + '" stroke-width="1"/>' +
        discs + subject;
      if (wash) s += '<rect x="' + (x + 2) + '" y="248" width="80" height="48" rx="9" fill="' + FAINT + '" opacity=".08"/>';
      return s;
    }
    var ip1 = isoPanel(48, "100", "#0b0d09",
      '<circle cx="104" cy="266" r="3.5" fill="' + NEON + '" opacity=".55"/>' +
      '<circle cx="116" cy="274" r="3" fill="' + NEON + '" opacity=".55"/>',
      '<circle cx="69" cy="271" r="6" fill="' + NEON + '"/>', false);
    var ip2 = isoPanel(148, "1600", "#12150e",
      '<circle cx="204" cy="266" r="4.5" fill="' + NEON + '" opacity=".45" filter="url(#isoSoftSm)"/>' +
      '<circle cx="216" cy="274" r="3.5" fill="' + NEON + '" opacity=".45" filter="url(#isoSoftSm)"/>',
      '<circle cx="169" cy="271" r="6" fill="' + NEON + '" opacity=".92" filter="url(#isoSoftSm)"/>', false);
    var ip3 = isoPanel(248, "12800", "#1a1e14",
      '<circle cx="306" cy="266" r="6" fill="' + NEON + '" opacity=".35" filter="url(#isoSoft)"/>' +
      '<circle cx="318" cy="275" r="4.5" fill="' + NEON + '" opacity=".35" filter="url(#isoSoft)"/>',
      '<circle cx="269" cy="271" r="6" fill="' + NEON + '" opacity=".85" filter="url(#isoSoft)"/>', true);
    var inner =
      '<defs><linearGradient id="isoFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + NEON + '" stop-opacity=".14"/>' +
      '<stop offset="100%" stop-color="' + NEON + '" stop-opacity=".01"/></linearGradient>' +
      '<filter id="isoSoft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.8"/></filter>' +
      '<filter id="isoSoftSm" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="0.9"/></filter></defs>' +
      label(180, 30, "ISO \u2192 NOISE", 12, NEON, "middle", 700) +
      '<line x1="64" y1="210" x2="330" y2="210" stroke="' + DIM + '" stroke-width="1"/>' +
      '<line x1="64" y1="210" x2="64" y2="46" stroke="' + DIM + '" stroke-width="1"/>' +
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
      label(232, 95, "you must", 10, FAINT) +
      /* scene strip */
      ip1 + ip2 + ip3;
    return frame(360, 312, inner);
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

  function toneScale(){
    var s = label(18, 30, "THE TONAL SCALE", 12, NEON, "start", 700);
    s += '<defs><linearGradient id="tsGrad" x1="0" y1="0" x2="1" y2="0">'
      + '<stop offset="0" stop-color="#141c12"/><stop offset=".45" stop-color="#43563f"/>'
      + '<stop offset=".75" stop-color="#9db894"/><stop offset="1" stop-color="#eef6ec"/></linearGradient></defs>';
    s += '<text x="180" y="46" font-family="' + MONO + '" font-size="9.5" fill="' + TEXT + '" text-anchor="middle">EXPOSURE PLACES THE WHOLE SCALE</text>';
    s += '<line x1="34" y1="56" x2="326" y2="56" stroke="' + DIM + '" stroke-width="1"/><line x1="34" y1="51" x2="34" y2="61" stroke="' + DIM + '"/><line x1="326" y1="51" x2="326" y2="61" stroke="' + DIM + '"/>';
    s += '<rect x="30" y="72" width="300" height="30" rx="6" fill="url(#tsGrad)" stroke="' + DIM + '"/>';
    s += '<line x1="130" y1="72" x2="130" y2="102" stroke="#0d120c" stroke-width="1" stroke-dasharray="3 3" opacity=".55"/>';
    s += '<line x1="230" y1="72" x2="230" y2="102" stroke="#0d120c" stroke-width="1" stroke-dasharray="3 3" opacity=".55"/>';
    s += '<text x="80" y="122" font-family="' + MONO + '" font-size="10" fill="' + FAINT + '" text-anchor="middle">SHADOWS</text>';
    s += '<text x="180" y="122" font-family="' + MONO + '" font-size="10" fill="' + TEXT + '" text-anchor="middle">MIDTONES</text>';
    s += '<text x="180" y="137" font-family="' + MONO + '" font-size="9" fill="' + FAINT + '" text-anchor="middle">where skin lives</text>';
    s += '<text x="280" y="122" font-family="' + MONO + '" font-size="10" fill="' + FAINT + '" text-anchor="middle">HIGHLIGHTS</text>';
    s += '<text x="180" y="168" font-family="' + MONO + '" font-size="9" fill="' + FAINT + '" text-anchor="middle">HIGHLIGHTS + SHADOWS SLIDERS WORK THE ENDS</text>';
    return frame(360, 182, s);
  }

  function beforeAfter(){
    var s = label(18, 30, "BEFORE / AFTER — THE AUDIT", 12, NEON, "start", 700);
    s += '<defs><linearGradient id="baSky" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#5d8148"/><stop offset="1" stop-color="#2a3d22"/></linearGradient>'
      + '<radialGradient id="baGlow" cx=".5" cy=".5" r=".5">'
      + '<stop offset="0" stop-color="#8deb00" stop-opacity=".8"/><stop offset="1" stop-color="#8deb00" stop-opacity="0"/></radialGradient></defs>';
    /* before: flat scene */
    s += '<rect x="45" y="42" width="150" height="128" fill="#262e24"/>';
    s += '<circle cx="88" cy="72" r="11" fill="#5c6b58"/>';
    s += '<path d="M45 138 L96 100 L132 124 L168 106 L195 122 L195 170 L45 170 Z" fill="#313b2f"/>';
    s += '<rect x="45" y="140" width="150" height="30" fill="#20261f"/>';
    /* after: graded scene */
    s += '<rect x="195" y="42" width="120" height="128" fill="url(#baSky)"/>';
    s += '<circle cx="238" cy="72" r="24" fill="url(#baGlow)"/>';
    s += '<circle cx="238" cy="72" r="10" fill="#d9ffb0"/>';
    s += '<path d="M195 122 L218 106 L252 124 L282 100 L315 138 L315 170 L195 170 Z" fill="#16240f"/>';
    s += '<path d="M195 122 L218 106 L252 124 L282 100 L315 138" fill="none" stroke="' + NEON + '" stroke-width="1.4" opacity=".75"/>';
    s += '<rect x="195" y="140" width="120" height="30" fill="#101a0b"/>';
    /* frame + divider */
    s += '<rect x="45" y="42" width="270" height="128" fill="none" stroke="' + DIM + '"/>';
    s += '<line x1="195" y1="38" x2="195" y2="174" stroke="' + NEON + '" stroke-width="2"/>';
    s += '<circle cx="195" cy="106" r="11" fill="#0d120c" stroke="' + NEON + '" stroke-width="1.6"/>';
    s += '<polygon points="186,106 192,101 192,111" fill="' + NEON + '"/>';
    s += '<polygon points="204,106 198,101 198,111" fill="' + NEON + '"/>';
    s += '<text x="52" y="192" font-family="' + MONO + '" font-size="9.5" fill="' + FAINT + '">BEFORE</text>';
    s += '<text x="308" y="192" font-family="' + MONO + '" font-size="9.5" fill="' + TEXT + '" text-anchor="end">AFTER</text>';
    return frame(360, 202, s);
  }

  function kelvinScale(){
    var s = label(18, 30, "TEMPERATURE — IN KELVIN", 12, NEON, "start", 700);
    s += '<defs><linearGradient id="kGrad" x1="0" y1="0" x2="1" y2="0">'
      + '<stop offset="0" stop-color="#ff8f3f"/><stop offset=".3" stop-color="#ffc37a"/>'
      + '<stop offset=".55" stop-color="#f2ead8"/><stop offset=".8" stop-color="#b9cdea"/>'
      + '<stop offset="1" stop-color="#7fb0ff"/></linearGradient></defs>';
    function stop(x, k, name, above){
      var y1 = above ? 62 : 118, ty = above ? 56 : 132;
      return '<line x1="' + x + '" y1="' + (above ? 78 : 98) + '" x2="' + x + '" y2="' + y1 + '" stroke="' + FAINT + '" stroke-width="1"/>'
        + '<text x="' + x + '" y="' + ty + '" font-family="' + MONO + '" font-size="9.5" fill="' + TEXT + '" text-anchor="middle">' + k + '</text>'
        + '<text x="' + x + '" y="' + (ty + (above ? -11 : 12)) + '" font-family="' + MONO + '" font-size="8" fill="' + FAINT + '" text-anchor="middle">' + name + '</text>';
    }
    s += stop(46, "1,900K", "CANDLELIGHT", false);
    s += stop(132, "3,200K", "TUNGSTEN", true);
    s += stop(240, "5,500K", "DAYLIGHT", false);
    s += stop(306, "6,500K+", "SHADE", true);
    s += '<rect x="30" y="78" width="300" height="20" rx="6" fill="url(#kGrad)" stroke="rgba(230,240,228,.35)"/>';
    s += '<text x="180" y="166" font-family="' + MONO + '" font-size="9" fill="' + FAINT + '" text-anchor="middle">RAISING THE SLIDER WARMS THE PHOTO</text>';
    s += '<text x="180" y="182" font-family="' + MONO + '" font-size="9" fill="' + FAINT + '" text-anchor="middle">DECLARE THE LIGHT THAT WAS THERE</text>';
    return frame(360, 192, s);
  }

  function mixerChannels(){
    var s = label(18, 30, "THE MIXER — EIGHT CHANNELS", 12, NEON, "start", 700);
    var names = ["RED", "ORANGE", "YELLOW", "GREEN", "AQUA", "BLUE", "PURPLE", "MAGENTA"];
    var letters = ["R", "O", "Y", "G", "A", "B", "P", "M"];
    for (var i = 0; i < 8; i++) {
      var cx = 18 + (i % 4) * 84, cy = 46 + Math.floor(i / 4) * 56;
      var skin = i === 1;
      if (skin) s += '<rect x="' + (cx - 3) + '" y="' + (cy - 3) + '" width="82" height="50" rx="10" fill="rgba(141,235,0,.14)"/>';
      s += '<rect x="' + cx + '" y="' + cy + '" width="76" height="44" rx="8" fill="#10160f" stroke="' + (skin ? NEON : DIM) + '" stroke-width="' + (skin ? 1.6 : 1) + '"/>';
      s += '<text x="' + (cx + 38) + '" y="' + (cy + 21) + '" font-family="' + MONO + '" font-size="13" fill="' + (skin ? NEON : TEXT) + '" text-anchor="middle">' + letters[i] + '</text>';
      s += '<text x="' + (cx + 38) + '" y="' + (cy + 36) + '" font-family="' + MONO + '" font-size="7.5" fill="' + FAINT + '" text-anchor="middle">' + names[i] + '</text>';
    }
    s += '<rect x="18" y="166" width="9" height="9" fill="' + NEON + '"/>';
    s += '<text x="34" y="175" font-family="' + MONO + '" font-size="9.5" fill="' + TEXT + '">ORANGE — SKIN LIVES HERE · RED IN SUPPORT</text>';
    s += '<text x="18" y="196" font-family="' + MONO + '" font-size="8.5" fill="' + FAINT + '">ORANGE · HUE</text>';
    s += '<rect x="118" y="188" width="212" height="5" rx="2.5" fill="#22301c"/>';
    s += '<line x1="224" y1="184" x2="224" y2="197" stroke="' + TEXT + '" stroke-width="1.4"/>';
    s += '<text x="18" y="226" font-family="' + MONO + '" font-size="8.5" fill="' + FAINT + '">ORANGE · SAT</text>';
    s += '<rect x="118" y="218" width="212" height="5" rx="2.5" fill="#22301c"/>';
    s += '<rect x="118" y="218" width="132" height="5" rx="2.5" fill="' + DIM + '"/>';
    s += '<circle cx="250" cy="220.5" r="4" fill="' + NEON + '"/>';
    return frame(360, 244, s);
  }

  function intensityScale(){
    var s = label(18, 30, "INTENSITY — WHERE TASTE LIVES", 12, NEON, "start", 700);
    s += '<defs><linearGradient id="intGrad" x1="0" y1="0" x2="1" y2="0">'
      + '<stop offset="0" stop-color="#4a7c2a"/><stop offset="1" stop-color="#8deb00"/></linearGradient></defs>';
    s += '<text x="240" y="48" font-family="' + MONO + '" font-size="9.5" fill="' + TEXT + '" text-anchor="middle">THE DEFAULT: 70</text>';
    s += '<text x="240" y="61" font-family="' + MONO + '" font-size="8" fill="' + FAINT + '" text-anchor="middle">not a decision</text>';
    s += '<polygon points="240,84 234,72 246,72" fill="' + NEON + '"/>';
    s += '<text x="30" y="80" font-family="' + MONO + '" font-size="9" fill="' + FAINT + '">0</text>';
    s += '<text x="150" y="80" font-family="' + MONO + '" font-size="9" fill="' + FAINT + '" text-anchor="middle">40</text>';
    s += '<text x="270" y="80" font-family="' + MONO + '" font-size="9" fill="' + FAINT + '" text-anchor="middle">80</text>';
    s += '<text x="330" y="80" font-family="' + MONO + '" font-size="9" fill="' + FAINT + '" text-anchor="end">100</text>';
    s += '<rect x="30" y="88" width="120" height="18" fill="' + DIM + '" opacity=".45"/>';
    s += '<rect x="150" y="88" width="120" height="18" fill="url(#intGrad)"/>';
    s += '<rect x="270" y="88" width="60" height="18" fill="' + NEON + '"/>';
    s += '<rect x="30" y="88" width="300" height="18" fill="none" stroke="rgba(230,240,228,.3)"/>';
    s += '<text x="90" y="126" font-family="' + MONO + '" font-size="9" fill="' + FAINT + '" text-anchor="middle">SEASONING</text>';
    s += '<text x="210" y="126" font-family="' + MONO + '" font-size="9.5" fill="' + TEXT + '" text-anchor="middle">HONEST WORK</text>';
    s += '<text x="300" y="126" font-family="' + MONO + '" font-size="8.5" fill="' + FAINT + '" text-anchor="middle">STYLIZATION</text>';
    s += '<text x="180" y="158" font-family="' + MONO + '" font-size="9" fill="' + FAINT + '" text-anchor="middle">SET BY THE PHOTOGRAPH — THEN PULL BACK TEN</text>';
    return frame(360, 170, s);
  }

  var LIB = {
    "fps-shutter": fpsShutter,
    "audio-meter": audioMeter,
    "gamma-curves": gammaCurves,
    "tone-scale": toneScale,
    "before-after": beforeAfter,
    "kelvin-scale": kelvinScale,
    "mixer-channels": mixerChannels,
    "intensity-scale": intensityScale,
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

  /* ---------------- fps -> shutter (the 180-degree rule) ---------------- */
  function fpsShutter(){
    function chip(x, y, w, text, color, strong){
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="30" rx="9" fill="' + (strong ? 'rgba(141,235,0,.10)' : 'rgba(141,235,0,.03)') + '" stroke="' + color + '" stroke-opacity="' + (strong ? '.8' : '.35') + '"/>' +
        '<text x="' + (x + w/2) + '" y="' + (y + 20) + '" text-anchor="middle" font-family="' + MONO + '" font-size="12" font-weight="700" fill="' + color + '" letter-spacing="1.5">' + text + '</text>';
    }
    function row(y, fps, shutter, desc){
      return chip(36, y, 104, fps + ' FPS', TEXT, false) +
        '<line x1="152" y1="' + (y + 15) + '" x2="180" y2="' + (y + 15) + '" stroke="' + FAINT + '" stroke-width="1.5"/>' +
        '<polygon points="180,' + (y + 11) + ' 188,' + (y + 15) + ' 180,' + (y + 19) + '" fill="' + FAINT + '"/>' +
        label(170, y + 6, "\u00d72", 9.5, FAINT) +
        chip(196, y, 128, shutter, NEON, true) +
        label(40, y + 46, desc, 9, FAINT, "start");
    }
    var inner =
      label(180, 30, "FRAME RATE \u2192 SHUTTER", 12, NEON, "middle", 700) +
      label(88, 58, "FRAME RATE", 9.5, FAINT) +
      label(260, 58, "SHUTTER SPEED", 9.5, FAINT) +
      row(72, "24", "1/50", "THE CINEMA STANDARD") +
      row(124, "30", "1/60", "TV + VLOGS") +
      row(176, "60", "1/125", "SLOW MOTION") +
      label(180, 248, "SHUTTER = DOUBLE THE FRAME RATE", 10.5, NEON, "middle", 700);
    return frame(360, 262, inner);
  }

  /* ---------------- audio meter (the -12dB rule) ---------------- */
  function audioMeter(){
    /* scale: -40dB at x=44, 0dB at x=316 */
    function dbx(db){ return Math.round(44 + ((db + 40) / 40) * 272); }
    var inner =
      '<defs><linearGradient id="amGrad" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="' + DIM + '"/>' +
      '<stop offset="55%" stop-color="' + NEON + '" stop-opacity=".75"/>' +
      '<stop offset="88%" stop-color="' + NEON + '"/>' +
      '<stop offset="100%" stop-color="#ffffff"/></linearGradient>' +
      '<pattern id="amHatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">' +
      '<rect width="6" height="6" fill="rgba(230,240,228,.14)"/><line x1="0" y1="0" x2="0" y2="6" stroke="' + TEXT + '" stroke-width="1.6"/></pattern></defs>' +
      label(180, 30, "AUDIO LEVELS", 12, NEON, "middle", 700) +
      /* the bounce band: where a voice actually lives */
      '<rect x="' + dbx(-18) + '" y="82" width="' + (dbx(-9) - dbx(-18)) + '" height="42" rx="6" fill="' + NEON + '" opacity=".08"/>' +
      label((dbx(-18) + dbx(-9)) / 2, 72, "VOICE BOUNCES HERE", 9, FAINT) +
      /* the meter bar */
      '<rect x="44" y="92" width="272" height="22" rx="5" fill="url(#amGrad)"/>' +
      '<rect x="' + dbx(-3) + '" y="92" width="' + (316 - dbx(-3)) + '" height="22" fill="url(#amHatch)"/>' +
      '<rect x="44" y="92" width="272" height="22" rx="5" fill="none" stroke="rgba(141,235,0,.35)"/>' +
      /* target needle at -12dB */
      '<line x1="' + dbx(-12) + '" y1="80" x2="' + dbx(-12) + '" y2="126" stroke="' + NEON + '" stroke-width="2"/>' +
      '<polygon points="' + (dbx(-12) - 5) + ',74 ' + (dbx(-12) + 5) + ',74 ' + dbx(-12) + ',81" fill="' + NEON + '"/>' +
      /* ticks + scale numbers */
      [ [-40, FAINT, 0], [-24, FAINT, 0], [-12, NEON, 700], [-6, FAINT, 0], [0, TEXT, 700] ].map(function(t){
        return '<line x1="' + dbx(t[0]) + '" y1="114" x2="' + dbx(t[0]) + '" y2="120" stroke="' + FAINT + '"/>' +
          label(dbx(t[0]), 136, (t[0] === 0 ? "0" : "\u2212" + Math.abs(t[0])), 10, t[1], "middle", t[2] || undefined);
      }).join("") +
      label(44, 162, "WHISPERS + HISS", 9, FAINT, "start") +
      label(316, 162, "CLIPPING \u2014 RUINED", 9.5, TEXT, "end", 700) +
      label(180, 192, "PEAK BETWEEN \u221212dB AND \u22126dB", 10.5, NEON, "middle", 700);
    return frame(360, 206, inner);
  }

  /* ---------------- gamma curves (standard vs log) ---------------- */
  function gammaCurves(){
    var std = "M92 208 C138 122 190 86 240 74 C275 67 305 66 322 66";
    var log = "M92 208 C165 178 250 130 322 84";
    var inner =
      '<defs><linearGradient id="logFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + NEON + '" stop-opacity=".13"/>' +
      '<stop offset="100%" stop-color="' + NEON + '" stop-opacity=".01"/></linearGradient></defs>' +
      label(180, 30, "GAMMA \u2014 TWO CURVES", 12, NEON, "middle", 700) +
      '<line x1="84" y1="212" x2="330" y2="212" stroke="' + DIM + '" stroke-width="1"/>' +
      '<line x1="84" y1="212" x2="84" y2="46" stroke="' + DIM + '" stroke-width="1"/>' +
      label(76, 70, "highlights", 9, FAINT, "end") +
      label(76, 204, "shadows", 9, FAINT, "end") +
      '<path d="' + log + ' L322 212 L92 212 Z" fill="url(#logFill)"/>' +
      '<path d="' + std + '" fill="none" stroke="' + TEXT + '" stroke-width="2.5"/>' +
      '<path d="' + log + '" fill="none" stroke="' + NEON + '" stroke-width="2.5"/>' +
      '<circle cx="322" cy="66" r="3.5" fill="' + TEXT + '"/>' +
      '<circle cx="322" cy="84" r="3.5" fill="' + NEON + '"/>' +
      label(252, 54, "STANDARD \u2014 DECIDES + CLIPS", 9.5, TEXT, "middle", 700) +
      label(322, 102, "LOG \u2014 KEEPS THE DATA", 9.5, NEON, "end", 700) +
      label(134, 152, "THE GAP IS", 9.5, FAINT, "start") +
      label(134, 165, "YOUR GRADE", 9.5, FAINT, "start") +
      label(92, 232, "DARK SCENE", 9.5, FAINT, "start") +
      label(322, 232, "BRIGHT SCENE", 9.5, FAINT, "end");
    return frame(360, 246, inner);
  }

  window.CDFmVisuals = {
    ids: function(){ return Object.keys(LIB); },
    render: function(id){
      var fn = LIB[id];
      if(!fn) return "";
      try{ return fn(); }catch(e){ return ""; }
    }
  };
})();
