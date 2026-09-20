/* ================================================================
   CAMERAS DECODED — Badges (shared)
   Single source of truth for badge definitions and awarding.
   Badges live on users/{uid} as badges: { <id>: <timestamp> }.
   Usage:
     <script src="/scripts/badges.js"></script>
     CDBadges.award(uid, 'quiz-perfect');          // needs firebase + db ready
     CDBadges.award(uid, 'quiz-perfect', db);      // or pass db explicitly
   ================================================================ */
(function () {
  'use strict';

  var DEFS = {
    'quiz-perfect':  { name: 'Tack Sharp',     icon: 'fa-crosshairs',  emoji: '🎯', desc: 'Nailed every question — critical focus' },
    'quiz-10':       { name: 'Contact Sheet',  icon: 'fa-layer-group', emoji: '🎞️', desc: 'Worked through 10 full quizzes' },
    'streak-7':      { name: 'Daily Developer',icon: 'fa-flask',       emoji: '🧪', desc: 'Showed up 7 days straight' },
    'arcade-first':  { name: 'First Exposure', icon: 'fa-aperture',    emoji: '📸', desc: 'Ran your first arcade drill' },
    'darkroom-skill':{ name: 'Master Print',   icon: 'fa-award',       emoji: '🖼️', desc: 'Completed a Darkroom skill' }
  };

  function getDb(explicitDb) {
    if (explicitDb) return explicitDb;
    if (window.db) return window.db;
    if (window.firebase && firebase.firestore) {
      try { return firebase.firestore(); } catch (e) { return null; }
    }
    return null;
  }

  // Award a badge once. Never overwrites an existing award (keeps first date).
  function award(uid, badgeId, explicitDb) {
    if (!uid || !DEFS[badgeId]) return Promise.resolve(false);
    var db = getDb(explicitDb);
    if (!db) return Promise.resolve(false);
    var ref = db.collection('users').doc(uid);
    return ref.get().then(function (snap) {
      var badges = ((snap.data() || {}).badges) || {};
      if (badges[badgeId]) return false; // already earned
      var upd = { badges: {} };
      var ts = (window.firebase && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date();
      upd.badges[badgeId] = ts;
      return ref.set(upd, { merge: true }).then(function () { return true; });
    }).catch(function () { return false; });
  }

  function defs() { return DEFS; }

  window.CDBadges = { defs: defs, award: award };
})();
