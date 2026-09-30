/* =====================================================================
   CAMERAS DECODED — Pro protocol gate
   Reveals the gated half of a Pro protocol for Pro members; everyone
   else gets the gate panel with the Unlock CTA into the paywall sheet.
   No deep-link bypass: tier comes from window.USER (Firestore users/{uid}.tier).
   ===================================================================== */
(function () {
  'use strict';

  function meta() {
    try {
      var el = document.getElementById('prpMeta');
      return el ? JSON.parse(el.textContent) : null;
    } catch (e) { return null; }
  }

  function isPro() {
    return !!(window.USER && window.USER.tier === 'pro');
  }

  function wireUnlock(m) {
    var btn = document.getElementById('prpUnlock');
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', function () {
      if (window.CDPaywall && window.CDPaywall.show) {
        window.CDPaywall.show({
          headline: 'Unlock Protocol ' + m.n,
          sub: 'The full Pro protocol library — every step, every download, every badge.'
        });
      } else {
        window.location.href = '/pro-checkout.html?plan=monthly';
      }
    });
  }

  function doneKey(n) { return 'prp-done-' + n; }

  function paintDone(btn, label) {
    btn.classList.add('done');
    btn.setAttribute('aria-pressed', 'true');
    if (label) label.textContent = 'Completed — badge earned';
  }

  function bindComplete(m) {
    var btn = document.getElementById('prpDone');
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    var label = btn.querySelector('.prp-done-label');
    try {
      if (localStorage.getItem(doneKey(m.n))) { paintDone(btn, label); return; }
    } catch (e) {}
    btn.addEventListener('click', function () {
      var uid = window.USER && window.USER.uid;
      var done = function () {
        try { localStorage.setItem(doneKey(m.n), '1'); } catch (e) {}
        paintDone(btn, label);
      };
      if (uid && window.CDBadges && window.CDBadges.award) {
        window.CDBadges.award(uid, m.badge_id).then(done, done);
      } else {
        done();
      }
    });
  }

  function apply() {
    var m = meta();
    if (!m) return;
    var gated = document.getElementById('prpGated');
    var gate = document.getElementById('prpGate');
    if (!gated) return;
    if (isPro()) {
      gated.hidden = false;
      if (gate) gate.style.display = 'none';
      bindComplete(m);
    } else {
      wireUnlock(m);
    }
  }

  function init() {
    apply();
    window.addEventListener('userStateReady', apply);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
