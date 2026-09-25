/* ==========================================================================
   sound.js — shared background-sound module -> window.CDSound
   --------------------------------------------------------------------------
   Plays /media/background-sound.mp3 on loop as the app's ambient background
   track. Mirrors the CDHaptics preference pattern:
     localStorage "cd_sound"  ('1' = on, default; '0' = muted)

   Position persists in localStorage ("cd_sound_pos") so the loop resumes
   mid-track across page loads AND fresh tabs — sessionStorage alone could
   never survive the user's fresh-open test loop, which is why the music
   kept restarting from the top on every new tab.

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

  function getPos() {
    // localStorage survives fresh tabs; sessionStorage is the fallback for
    // private mode where localStorage writes throw.
    try {
      var raw = null;
      try { raw = localStorage.getItem(POS_KEY); } catch (e) {}
      if (raw == null) { try { raw = sessionStorage.getItem(POS_KEY); } catch (e) {} }
      var p = parseFloat(raw || '0');
      return isNaN(p) ? 0 : p;
    } catch (e) { return 0; }
  }

  function savePos() {
    try {
      if (el && !el.paused && el.currentTime > 0) {
        var v = String(el.currentTime);
        try { localStorage.setItem(POS_KEY, v); } catch (e) {}
        try { sessionStorage.setItem(POS_KEY, v); } catch (e) {}
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
        var p = getPos();
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
  //
  // Speed matters more than ceremony here: the theme is the priority, so
  // when resuming we kick off playback IMMEDIATELY at silence (that kick
  // is also what makes iOS start fetching/decoding without delay), then
  // seek to the saved spot and unmute the instant metadata lands. Never
  // any audible blip of the track start, never a wait.
  function start() {
    if (!isOn()) return false;
    try {
      var a = ensure();
      if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
      var resumePos = 0;
      try { resumePos = getPos(); } catch (e) {}
      var resuming = resumePos > 1;

      var playNow = function () {
        var p = a.play();
        if (p && typeof p.catch === 'function') p.catch(function () {});
      };
      var applyResume = function () {
        // Metadata is in: seek to the saved spot, then come back at full
        // volume. The loop continues instead of restarting.
        try {
          var dur = a.duration || 0;
          if (dur > 0 && resumePos < dur - 2) a.currentTime = resumePos;
        } catch (e) {}
        try { a.volume = TARGET_VOL; } catch (e) {}
      };

      if (resuming) {
        if (a.readyState >= 1) {
          applyResume(); // metadata already in: seek, then play — instant
          playNow();
        } else {
          try { a.volume = 0; } catch (e) {}
          playNow(); // pipeline starts now, silently
          var metaDone = false;
          var onMeta = function () {
            if (metaDone) return; metaDone = true;
            try { a.removeEventListener('loadedmetadata', onMeta); } catch (e) {}
            if (!isOn()) return;
            applyResume();
          };
          a.addEventListener('loadedmetadata', onMeta);
          setTimeout(onMeta, 1500); // backstop: unmute even if metadata stalls
        }
        return true;
      }
      // Cold start: fade up from silence.
      try { a.volume = 0; } catch (e) {}
      playNow();
      var t0 = Date.now();
      fadeTimer = setInterval(function () {
        var k = Math.min(1, (Date.now() - t0) / FADE_MS);
        try { a.volume = TARGET_VOL * k; } catch (e) {}
        if (k >= 1) { clearInterval(fadeTimer); fadeTimer = null; }
      }, 60);
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
