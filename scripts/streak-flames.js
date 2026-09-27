/* Cameras Decoded — streak flames overlay.
 *
 * Plays the transparent-background flame GIF whenever a user earns a streak
 * (CDStreak.touch() resolving secured:true). Unlike the fullscreen success
 * stings, this renders as a top-anchored overlay so the flames fall toward the
 * streak fire pill in the header. GIF transparency composites natively, so the
 * page shows through around the flames.
 *
 * window.CDStreakFlames.play()              — play the flames (waits for any
 *                                             transient fullscreen sting to clear
 *                                             first so the header is visible).
 * window.CDStreakFlames.afterTransient(fn)   — run fn once transient fullscreen
 *                                             stings (#missionSting, #sysOnlineSting)
 *                                             have cleared. Used to chain the
 *                                             day-7 STREAK SECURED milestone video.
 *
 * Set window.CDStreakFlames.SRC to point at the GIF file.
 */
(function () {
  'use strict';

  var SRC = '/media/free-fall.gif';
  var MAX_WAIT_MS = 8000;
  var SHOW_MS = 3200;

  var CSS =
    '#cdStreakFlames{position:fixed;top:0;left:0;right:0;height:52vh;z-index:10001;' +
    'pointer-events:none;display:flex;justify-content:center;align-items:flex-start;overflow:hidden}' +
    '#cdStreakFlames img{width:100%;height:100%;object-fit:cover}';

  function ensureCSS() {
    if (document.getElementById('cdStreakFlamesCSS')) return;
    var st = document.createElement('style');
    st.id = 'cdStreakFlamesCSS';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // Transient fullscreen stings hide the header; wait them out. The play.html
  // result screen (#cdResult) is deliberately NOT in this list — it persists
  // as the result screen, and the flames play over it.
  function transientStingVisible() {
    return !!(document.querySelector('#missionSting.on, #sysOnlineSting.on'));
  }

  function render() {
    if (reducedMotion()) return;
    if (document.getElementById('cdStreakFlames')) return; // already playing
    ensureCSS();
    var wrap = document.createElement('div');
    wrap.id = 'cdStreakFlames';
    wrap.setAttribute('aria-hidden', 'true');
    var img = document.createElement('img');
    img.setAttribute('aria-hidden', 'true');
    img.alt = '';
    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    };
    img.onerror = finish;
    // Cache-bust so a replaced GIF doesn't play stale from disk cache.
    img.src = SRC + (SRC.indexOf('?') === -1 ? '?v=1' : '');
    wrap.appendChild(img);
    document.body.appendChild(wrap);
    setTimeout(finish, SHOW_MS);
  }

  function play() {
    if (reducedMotion() || !SRC) return;
    if (!transientStingVisible()) { render(); return; }
    var waited = 0;
    var iv = setInterval(function () {
      waited += 250;
      if (!transientStingVisible() || waited >= MAX_WAIT_MS) {
        clearInterval(iv);
        render();
      }
    }, 250);
  }

  function afterTransient(fn) {
    if (typeof fn !== 'function') return;
    if (!transientStingVisible()) { try { fn(); } catch (e) {} return; }
    var waited = 0;
    var iv = setInterval(function () {
      waited += 250;
      if (!transientStingVisible() || waited >= MAX_WAIT_MS) {
        clearInterval(iv);
        try { fn(); } catch (e) {}
      }
    }, 250);
  }

  window.CDStreakFlames = { play: play, afterTransient: afterTransient, SRC: SRC };
})();
