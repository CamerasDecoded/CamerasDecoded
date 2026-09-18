/* Cameras Decoded — haptics abstraction.
 *
 * Android Chrome: navigator.vibrate() works. iOS Safari — and every other
 * iOS browser, which are all WebKit under the hood — exposes no vibration
 * API, so calls safely no-op there. If the app is ever wrapped (Capacitor),
 * only the inside of _buzz needs to change (Capacitor Haptics plugin).
 *
 * Respects the user's haptics preference (localStorage "cd_haptics",
 * default on) and prefers-reduced-motion.
 */
(function () {
  'use strict';

  function prefOn() {
    try { return localStorage.getItem('cd_haptics') !== '0'; }
    catch (e) { return true; }
  }

  function motionOk() {
    return !(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function _buzz(pattern) {
    if (!prefOn() || !motionOk()) return;
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* unsupported */ }
  }

  window.CDHaptics = {
    tick: function () { _buzz(10); },
    success: function () { _buzz([0, 30, 50, 50]); },
    bigSuccess: function () { _buzz([0, 30, 50, 40, 70, 60]); },
    error: function () { _buzz([0, 80, 50, 80]); },
    isOn: prefOn,
    setOn: function (on) {
      try { localStorage.setItem('cd_haptics', on ? '1' : '0'); } catch (e) {}
    }
  };
})();
