/* Cameras Decoded — true day streak.
 *
 * Any learning activity (mission step, game session, Field Manual lesson)
 * keeps the streak alive by calling CDStreak.touch(db, uid).
 *
 * Storage: users/{uid}.dailyStreak = { last: 'YYYY-MM-DD', count: N }.
 *
 * touch() resolves { count, secured } — secured is true only when this call
 * marked today (increments when yesterday was active, restarts at 1 after a
 * lapse, no-ops when today is already marked). It also awards the streak-7
 * badge the day the count reaches exactly 7.
 *
 * CDStreak.displayCount(streak) is the honest read for UI: a streak whose
 * last active day is older than yesterday displays 0 until the next activity
 * (the stored count is left alone — it resumes on the next touch).
 */
(function () {
  'use strict';

  function pad(n) { return String(n).padStart(2, '0'); }

  function dateKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  async function touch(db, uid) {
    var today = dateKey();
    var yest = dateKey(new Date(Date.now() - 864e5));
    try {
      var ref = db.collection('users').doc(uid);
      var snap = await ref.get();
      var data = snap.exists ? snap.data() : null;
      var s = (data && data.dailyStreak) || { last: null, count: 0 };
      if (s.last === today) return { count: s.count || 0, secured: false };
      var lapsed = s.last && s.last !== yest;
      var count = (s.last === yest) ? (s.count || 0) + 1 : 1;
      await ref.set({ dailyStreak: { last: today, count: count } }, { merge: true });
      if (count === 7 && window.CDBadges) {
        try { window.CDBadges.award(uid, 'streak-7', db); } catch (e) { /* best-effort */ }
      }
      if (count === 3 && window.CDGear) {
        try { window.CDGear.award(uid, 'gear-longshot', db); } catch (e) { /* best-effort */ }
      }
      if (count === 14 && window.CDGear) {
        try { window.CDGear.award(uid, 'glass-steady', db); } catch (e) { /* best-effort */ }
      }
      // Dust Off: the signal went quiet for a week or more, then came back.
      if (lapsed && count === 1 && window.CDGear) {
        try {
          var gapMs = Date.now() - new Date(s.last + 'T12:00:00').getTime();
          if (gapMs >= 7 * 864e5) window.CDGear.award(uid, 'glass-dustoff', db);
        } catch (e) { /* best-effort */ }
      }
      // Milestone inbox notifications (cross-device via the bell).
      if ((count === 7 || count === 30 || count === 100) && window.CDNotifs) {
        try {
          window.CDNotifs.notify({
            title: count + '-day streak',
            body: 'The signal holds. Keep the chain alive.',
            href: '/missions.html',
            kind: 'streak'
          });
        } catch (e) { /* best-effort */ }
      }
      return { count: count, secured: true };
    } catch (e) {
      return { count: 0, secured: false };
    }
  }

  function displayCount(streak) {
    var today = dateKey();
    var yest = dateKey(new Date(Date.now() - 864e5));
    var s = streak || { last: null, count: 0 };
    if (s.last !== today && s.last !== yest) return 0;
    return s.count || 0;
  }

  window.CDStreak = { touch: touch, displayCount: displayCount, dateKey: dateKey };
})();
