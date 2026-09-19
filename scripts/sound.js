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
  var el = null;

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
    el.volume = 0.45; // background bed, not foreground
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
  function start() {
    if (!isOn()) return false;
    try {
      var p = ensure().play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
      return true;
    } catch (e) { return false; }
  }

  function stop() {
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

  window.CDSound = {
    isOn: isOn,
    setOn: setOn,
    start: start,
    stop: stop,
    toggle: toggle
  };
})();
