/* ==========================================================================
   sound.js — shared background-sound module -> window.CDSound
   --------------------------------------------------------------------------
   Plays /media/background-sound.mp3 on loop as the app's ambient background
   track. Mirrors the CDHaptics preference pattern:
     localStorage "cd_sound"  ('1' = on, default; '0' = muted)

   Autoplay rule: browsers (esp. iOS Safari) only allow audio after a user
   gesture. Call CDSound.start() synchronously inside a tap/click handler
   (the master-loader boot veil's tap-to-enter does this once per session).
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'cd_sound';
  var POS_KEY = 'cd_sound_pos';
  var SRC = '/media/background-sound.mp3';
  var TARGET_VOL = 0.32; // background bed, not foreground — sits under UI, never shouts
  var FADE_MS = 2600;   // swell in gently instead of blurting at full volume
  var el = null;
  var fadeTimer = null;

  function isOn() {
    try { return localStorage.getItem(KEY) !== '0'; }
    catch (e) { return true; }
  }

  function setOn(on) {
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    if (!on) stop();
  }

  function savePos() {
    try {
      if (el && !el.paused && el.currentTime > 0) {
        sessionStorage.setItem(POS_KEY, String(el.currentTime));
      }
    } catch (e) {}
  }

  function ensure() {
    if (el) return el;
    el = new Audio();
    el.src = SRC;
    el.loop = true;
    el.preload = 'auto';
    el.volume = 0; // start silent; start() fades up to TARGET_VOL
    // Resume where the last page left off (same tab session).
    el.addEventListener('loadedmetadata', function () {
      try {
        var p = parseFloat(sessionStorage.getItem(POS_KEY) || '0');
        var dur = el.duration || 0;
        if (p > 1 && dur > 0 && p < dur - 2) el.currentTime = p;
      } catch (e) {}
    });
    setInterval(savePos, 5000);
    window.addEventListener('pagehide', savePos);
    return el;
  }

  // Start the loop. Must be called inside a user gesture to unlock audio.
  // Cold start fades up from silence so the bed swells in instead of
  // starting abruptly. But when a saved position exists, the music was
  // already playing this session — come back at full volume from that
  // spot so it feels like it continues instead of restarting.
  function start() {
    if (!isOn()) return false;
    try {
      var a = ensure();
      if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
      var resumePos = 0;
      try { resumePos = parseFloat(sessionStorage.getItem(POS_KEY) || '0'); } catch (e) {}
      var resuming = resumePos > 1;
      if (resuming) {
        try {
          if (a.readyState >= 1) {
            var dur = a.duration || 0;
            if (dur > 0 && resumePos < dur - 2) a.currentTime = resumePos;
          }
        } catch (e) {}
        try { a.volume = TARGET_VOL; } catch (e) {}
      } else {
        try { a.volume = 0; } catch (e) {}
      }
      var p = a.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
      if (!resuming) {
        var t0 = Date.now();
        fadeTimer = setInterval(function () {
          var k = Math.min(1, (Date.now() - t0) / FADE_MS);
          try { a.volume = TARGET_VOL * k; } catch (e) {}
          if (k >= 1) { clearInterval(fadeTimer); fadeTimer = null; }
        }, 60);
      }
      return true;
    } catch (e) { return false; }
  }

  function stop() {
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
    if (!el) return;
    try { el.pause(); } catch (e) {}
  }

  // Flip the preference; returns the new state. Safe to call from a click.
  function toggle() {
    var on = !isOn();
    setOn(on);
    if (on) start();
    return on;
  }

  // Warm the audio cache at parse time (master-loader injects this script
  // during boot) so the file is already loaded when the veil tap calls
  // start() — no delayed blurt while the MP3 downloads.
  try { ensure(); } catch (e) {}

  window.CDSound = {
    isOn: isOn,
    setOn: setOn,
    start: start,
    stop: stop,
    toggle: toggle
  };
})();
