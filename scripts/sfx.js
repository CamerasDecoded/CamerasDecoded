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

   Design notes:
   - HTMLAudio (not Web Audio): reliable on iOS once unlocked by a gesture.
     Every sound in the app is triggered by a tap, so playback naturally
     happens inside user gestures. A rejected play() is caught and ignored.
   - Sounds are preloaded at parse time; play() before load finishes is a
     silent no-op — sound must never break the app.
   - Rapid re-triggers restart the sound (currentTime = 0), which is the
     right feel for UI feedback.
   - Per-sound volumes keep effects sitting cleanly above the ambient loop.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'cd_sound';
  var BASE = '/media/sfx/';

  /* name -> [file, volume] */
  var SOUNDS = {
    correct: ['correct.mp3', 0.8],
    wrong:   ['wrong.mp3',   0.7],
    perfect: ['perfect.mp3',  0.85],
    lesson:  ['lesson.mp3',  0.85],
    chapter: ['chapter.mp3',  0.9],
    tick:    ['tick.mp3',     0.5]
  };

  var els = {};

  function isOn() {
    try { return localStorage.getItem(KEY) !== '0'; }
    catch (e) { return true; }
  }

  function ensure(name) {
    if (els[name]) return els[name];
    var def = SOUNDS[name];
    if (!def) return null;
    try {
      var a = new Audio();
      a.src = BASE + def[0];
      a.preload = 'auto';
      a.volume = def[1];
      els[name] = a;
      /* warm the cache without playing */
      a.load();
      return a;
    } catch (e) { return null; }
  }

  /* Preload everything up front so first taps are instant. */
  function preload() {
    Object.keys(SOUNDS).forEach(ensure);
  }

  function play(name) {
    if (!isOn()) return false;
    var a = ensure(name);
    if (!a) return false;
    try {
      a.currentTime = 0;
      var p = a.play();
      if (p && p.catch) p.catch(function () { /* iOS gesture guard: silent */ });
      return true;
    } catch (e) { return false; }
  }

  /* Call once inside a user gesture (e.g. the boot veil tap) to unlock
     audio on iOS for sounds that might fire outside later gestures. */
  function unlock() {
    if (!isOn()) return;
    Object.keys(els).forEach(function (name) {
      var a = els[name];
      try {
        var p = a.play();
        if (p && p.then) {
          p.then(function () { a.pause(); a.currentTime = 0; })
           .catch(function () {});
        } else { a.pause(); a.currentTime = 0; }
      } catch (e) {}
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preload);
  } else {
    preload();
  }

  window.CDSfx = {
    play: play,
    unlock: unlock,
    isOn: isOn,
    names: Object.keys(SOUNDS)
  };
})();
