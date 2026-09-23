/* ==========================================================================
   sfx.js — shared sound-effects module -> window.CDSfx
   --------------------------------------------------------------------------
   Plays short, high-quality UI/game sound effects from /media/sfx/*.mp3.

   Mirrors the CDSound preference pattern:
     localStorage "cd_sound"  ('1' = on, default; '0' = muted)

   Usage:
     CDSfx.play('correct');   // quiz answer right
     CDSfx.play('wrong');     // quiz answer wrong
     CDSfx.play('perfect');   // perfect quiz bonus
     CDSfx.play('lesson');    // lesson complete
     CDSfx.play('chapter');   // chapter complete
     CDSfx.play('tick');      // subtle UI tap
     CDSfx.play('continue');  // continue / next-page advance
     CDSfx.play('back');      // back navigation

   Design notes:
   - Web Audio with pre-decoded buffers: every sound is fetched and decoded
     while the page loads, so play() fires near-instantly (<20ms) — no
     HTMLAudio spin-up lag on taps. Each play() gets its own BufferSource,
     so rapid re-triggers overlap cleanly instead of restarting.
   - The AudioContext is created pre-gesture (starts suspended — that's
     fine); unlock() resumes it inside a real tap (boot veil) for iOS.
   - HTMLAudio fallback if Web Audio is unavailable; silent no-op if a file
     fails — sound must never break the app.
   - Per-sound volumes keep effects sitting cleanly above the ambient loop.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'cd_sound';
  var BASE = '/media/sfx/';

  /* name -> [file, volume] */
  var SOUNDS = {
    correct: ['correct.mp3',  0.8],
    wrong:   ['wrong.mp3',    0.7],
    perfect: ['perfect.mp3',  0.85],
    lesson:  ['lesson.mp3',   0.85],
    chapter: ['chapter.mp3',  0.9],
    tick:    ['tick.mp3',     0.5],
    continue:['continue.mp3', 0.7],
    back:    ['back.mp3',     0.55]
  };

  var ctx = null;       // AudioContext (created early, resumed in a gesture)
  var buffers = {};     // name -> decoded AudioBuffer, ready to fire
  var loading = {};     // name -> true while fetch/decode is in flight
  var htmlEls = {};     // fallback Audio elements when Web Audio is missing

  function isOn() {
    try { return localStorage.getItem(KEY) !== '0'; }
    catch (e) { return true; }
  }

  function ac() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; }
    return ctx;
  }

  /* Fetch + decode a sound as early as possible so play() never waits. */
  function prime(name) {
    var def = SOUNDS[name];
    if (!def || buffers[name] || loading[name]) return;
    var c = ac();
    if (!c) { htmlPrime(name); return; }
    loading[name] = true;
    fetch(BASE + def[0]).then(function (r) {
      if (!r.ok) throw new Error('sfx ' + r.status);
      return r.arrayBuffer();
    }).then(function (ab) {
      return c.decodeAudioData(ab);
    }).then(function (buf) {
      buffers[name] = buf;
    }).catch(function () {
      /* silent — play() falls back to HTMLAudio */
    }).then(function () {
      loading[name] = false;
    });
  }

  function htmlPrime(name) {
    if (htmlEls[name]) return htmlEls[name];
    var def = SOUNDS[name];
    if (!def) return null;
    try {
      var a = new Audio();
      a.src = BASE + def[0];
      a.preload = 'auto';
      a.volume = def[1];
      a.load();
      htmlEls[name] = a;
      return a;
    } catch (e) { return null; }
  }

  function htmlPlay(name) {
    var a = htmlPrime(name);
    if (!a) return false;
    try {
      a.currentTime = 0;
      var p = a.play();
      if (p && p.catch) p.catch(function () {});
      return true;
    } catch (e) { return false; }
  }

  function play(name) {
    if (!isOn()) return false;
    var def = SOUNDS[name];
    if (!def) return false;
    prime(name); /* no-op when already primed or priming */
    var c = ac(), buf = buffers[name];
    if (c && buf) {
      try {
        if (c.state === 'suspended') c.resume();
        var src = c.createBufferSource();
        src.buffer = buf;
        var g = c.createGain();
        g.gain.value = def[1];
        src.connect(g);
        g.connect(c.destination);
        src.start(0);
        return true;
      } catch (e) { return htmlPlay(name); }
    }
    return htmlPlay(name);
  }

  /* Call inside a user gesture (the boot veil tap): unlocks the
     AudioContext on iOS and finishes priming every sound. */
  function unlock() {
    var c = ac();
    if (c && c.state === 'suspended') {
      try {
        var p = c.resume();
        if (p && p.catch) p.catch(function () {});
      } catch (e) {}
    }
    Object.keys(SOUNDS).forEach(prime);
  }

  /* Prime everything at parse time: decode happens while the page loads,
     so the first tap fires instantly. */
  try { Object.keys(SOUNDS).forEach(prime); } catch (e) {}

  window.CDSfx = {
    play: play,
    unlock: unlock,
    isOn: isOn,
    names: Object.keys(SOUNDS)
  };
})();
