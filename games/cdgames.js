/* ==========================================================================
   Cameras Decoded — Game Platform Core  (vanilla JS, zero dependencies)
   --------------------------------------------------------------------------
   What this is:
     - A tiny registry + on-demand script loader for learning games.
     - Shared perf/visual helpers so every game feels premium without
       each game re-solving the same problems.

   THE GAME CONTRACT (every game module must follow it):
     window.CDGames.register('<game-id>', {
       version:  'v1',            // pinned by the slot doc; ship v2 freely
       title:    'Human title',
       init:     function(stage, config, api) {},  // build UI inside `stage`
       destroy:  function() {},                    // FULL teardown (see below)
       pause:    function() {},  // optional — shell calls when tab hidden
       resume:   function() {},  // optional
       getSnapshot: function(){} // -> { score:0-100, detail:{...} }
     });

     api = {
       hud:    function({progress:0..1, label}) {}, // shared progress bar
       finish: function() {},  // natural completion (game decides)
       exit:   function() {},  // bail out, no XP
       toast:  function(msg) {} // tiny floating message
     }

   PERF RULES (lightweight is a feature):
     - Games load LAZILY: only the slot's script is fetched, nothing else.
     - Classic <script> (not ES modules): works on file:// for phone testing,
       matches the existing compat stack, no bundler, no CORS traps.
     - destroy() must be TOTAL: cancel rAF, stop media tracks, drop canvas
       refs, remove DOM. Switching games must not leak frames or camera.
     - No per-pixel getImageData loops in hot paths, no ctx.filter in
       per-frame rendering (spotty on iOS, expensive everywhere).
       Pre-render layers/tiles instead.
     - Cap devicePixelRatio at 2 via CDGames.env.dpr; fixed internal canvas
       resolution, CSS scales up.
     - Respect prefers-reduced-motion: CDGames.env.reducedMotion.
   ========================================================================== */
(function () {
  'use strict';

  var registry = {};   // 'id@version' -> game def
  var loadedScripts = {}; // src -> true (never load twice)

  var env = {
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    reducedMotion: !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    touch: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)
  };

  function register(id, def) {
    if (!id || !def) throw new Error('CDGames.register: id and def required');
    ['init', 'destroy', 'getSnapshot'].forEach(function (m) {
      if (typeof def[m] !== 'function')
        throw new Error('CDGames.register: "' + id + '" missing contract method: ' + m);
    });
    def.version = def.version || 'v1';
    def.id = id;
    registry[id + '@' + def.version] = def;
  }

  function get(id, version) {
    return registry[id + '@' + (version || 'v1')] || null;
  }

  // On-demand classic-script loader. Resolves with the registered game def.
  function load(id, version, basePath) {
    version = version || 'v1';
    var key = id + '@' + version;
    return new Promise(function (resolve, reject) {
      if (registry[key]) return resolve(registry[key]);
      var src = (basePath || 'games/') + id + '.' + version + '.js';
      if (loadedScripts[src]) {
        // script tag exists but game never registered — fail loudly
        return reject(new Error('CDGames: ' + src + ' loaded but "' + key + '" never registered'));
      }
      loadedScripts[src] = true;
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () {
        if (registry[key]) resolve(registry[key]);
        else reject(new Error('CDGames: ' + src + ' loaded but "' + key + '" never registered'));
      };
      s.onerror = function () {
        reject(new Error('CDGames: failed to load ' + src));
      };
      document.head.appendChild(s);
    });
  }

  /* ---------- tiny DOM helpers (so games stay dependency-free) ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, k) { return a + (b - a) * k; }

  /* ---------- lightweight premium motion helpers ---------- */
  var fx = {
    // count-up animation; honors reduced-motion (jumps to final)
    countUp: function (node, to, durMs, fmt) {
      durMs = durMs || 900;
      fmt = fmt || function (v) { return Math.round(v); };
      if (env.reducedMotion) { node.textContent = fmt(to); return; }
      var t0 = performance.now();
      function tick(now) {
        var k = clamp((now - t0) / durMs, 0, 1);
        k = 1 - Math.pow(1 - k, 3); // easeOutCubic
        node.textContent = fmt(lerp(0, to, k));
        if (k < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    },
    // soft haptic tap where supported
    tap: function (ms) {
      if (navigator.vibrate) { try { navigator.vibrate(ms || 10); } catch (e) {} }
    },
    // pre-rendered film-grain tiles (no per-pixel work in render hot paths).
    // usage: var t = fx.grainTiles(3, 128); ctx.fillStyle = ctx.createPattern(t[i], 'repeat');
    grainTiles: function (count, size) {
      count = count || 3; size = size || 128;
      var tiles = [];
      for (var n = 0; n < count; n++) {
        var t = document.createElement('canvas');
        t.width = size; t.height = size;
        var tc = t.getContext('2d');
        var id = tc.createImageData(size, size);
        for (var i = 0; i < id.data.length; i += 4) {
          var v = (Math.random() * 255) | 0;
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
          id.data[i + 3] = 255;
        }
        tc.putImageData(id, 0, 0);
        tiles.push(t);
      }
      return tiles;
    }
  };

  /* ---------- synthesized micro-audio (no assets, created on gesture) --- */
  var AC = null;
  function audio() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  function blip(freq, durMs) {
    var c = audio(); if (!c) return;
    freq = freq || 880; durMs = durMs || 140;
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.16, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + durMs / 1000);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + durMs / 1000 + 0.02);
  }
  function shutterClick() {
    var c = audio(); if (!c) return;
    var len = Math.floor(c.sampleRate * 0.07);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var ch = buf.getChannelData(0);
    for (var i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.12));
    var s = c.createBufferSource(); s.buffer = buf;
    var f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800;
    s.connect(f); f.connect(c.destination); s.start();
  }

  window.CDGames = {
    register: register,
    get: get,
    load: load,
    env: env,
    el: el,
    clamp: clamp,
    lerp: lerp,
    fx: fx,
    audio: audio,
    blip: blip,
    shutterClick: shutterClick
  };
})();
