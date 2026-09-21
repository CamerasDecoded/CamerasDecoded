/* ================================================================
   CAMERAS DECODED — Gear collectibles awarding (shared)
   Thin wrapper around CDBadges for the gear-* badge family.

   - CDGear.award(uid, badgeId, db): awards one gear badge (once-only,
     via CDBadges). On a NEW earn it checks the Trinity meta-badge
     (any 3 gear collectibles) and fires the share-on-earn prompt.
   - CDGear.trackArcade(db, uid, slotId): call on every scored arcade
     play. Maintains gearProgress { arcadeSlots[], arcadePlays } and
     awards Overdrive (5 plays) / Arsenal (5 distinct games).
   - CDGear.trackLesson(db, uid, isFree): call on every newly-banked
     Darkroom lesson. Maintains gearProgress { lessonsDone,
     freeLessons } and awards Director (1st) / Relic (9 free).

   Everything is best-effort: failures never throw, never block the
   calling flow. Requires scripts/badges.js (CDBadges) for awarding;
   Firestore writes go to users/{uid} via merge.
   ================================================================ */
(function () {
  'use strict';

  var GEAR_PREFIX = 'gear-';
  var TRINITY_ID = 'gear-trinity';

  function getDb(explicitDb) {
    if (explicitDb) return explicitDb;
    if (window.db) return window.db;
    if (window.firebase && firebase.firestore) {
      try { return firebase.firestore(); } catch (e) { return null; }
    }
    return null;
  }

  function fieldValue() {
    try {
      if (window.firebase && firebase.firestore && firebase.firestore.FieldValue)
        return firebase.firestore.FieldValue;
    } catch (e) {}
    return null;
  }

  // Award one gear badge. Resolves true only on a NEW earn.
  function award(uid, badgeId, explicitDb) {
    if (!uid || !badgeId || badgeId.indexOf(GEAR_PREFIX) !== 0) return Promise.resolve(false);
    if (!window.CDBadges || typeof window.CDBadges.award !== 'function') return Promise.resolve(false);
    var db = getDb(explicitDb);
    return window.CDBadges.award(uid, badgeId, db).then(function (earned) {
      if (earned) {
        checkTrinity(uid, db);           // meta-badge (never throws)
        offerShare(badgeId);             // share-on-earn prompt (never throws)
      }
      return earned;
    }).catch(function () { return false; });
  }

  // The Trinity: earn any 3 gear collectibles (excluding itself).
  function checkTrinity(uid, db) {
    try {
      db = getDb(db);
      if (!db) return;
      db.collection('users').doc(uid).get().then(function (snap) {
        var badges = ((snap.data() || {}).badges) || {};
        if (badges[TRINITY_ID]) return; // already earned
        var count = Object.keys(badges).filter(function (id) {
          return id.indexOf(GEAR_PREFIX) === 0 && id !== TRINITY_ID;
        }).length;
        if (count >= 3 && window.CDBadges) {
          window.CDBadges.award(uid, TRINITY_ID, db).then(function (earned) {
            if (earned) offerShare(TRINITY_ID);
          }).catch(function () {});
        }
      }).catch(function () {});
    } catch (e) { /* best-effort */ }
  }

  function offerShare(badgeId) {
    try {
      if (window.CDGearShare && typeof window.CDGearShare.offerShare === 'function')
        window.CDGearShare.offerShare(badgeId);
    } catch (e) { /* share prompt is optional */ }
  }

  // ---- Arcade progress: call on every scored play ----
  function trackArcade(explicitDb, uid, slotId) {
    var db = getDb(explicitDb);
    if (!db || !uid) return Promise.resolve();
    var F = fieldValue();
    if (!F) return Promise.resolve();
    var upd = {
      'gearProgress.arcadePlays': F.increment(1)
    };
    if (slotId) upd['gearProgress.arcadeSlots'] = F.arrayUnion(slotId);
    return db.collection('users').doc(uid).set(upd, { merge: true }).then(function () {
      return db.collection('users').doc(uid).get();
    }).then(function (snap) {
      var gp = ((snap.data() || {}).gearProgress) || {};
      var plays = gp.arcadePlays || 0;
      var slots = gp.arcadeSlots || [];
      if (plays >= 5) award(uid, 'gear-overdrive', db);
      if (slots.length >= 5) award(uid, 'gear-arsenal', db);
    }).catch(function () {});
  }

  // ---- Darkroom lesson progress: call on every NEWLY banked lesson ----
  function trackLesson(explicitDb, uid, isFree) {
    var db = getDb(explicitDb);
    if (!db || !uid) return Promise.resolve();
    var F = fieldValue();
    if (!F) return Promise.resolve();
    var upd = { 'gearProgress.lessonsDone': F.increment(1) };
    if (isFree) upd['gearProgress.freeLessons'] = F.increment(1);
    return db.collection('users').doc(uid).set(upd, { merge: true }).then(function () {
      return db.collection('users').doc(uid).get();
    }).then(function (snap) {
      var gp = ((snap.data() || {}).gearProgress) || {};
      if ((gp.lessonsDone || 0) >= 1) award(uid, 'gear-director', db);
      if ((gp.freeLessons || 0) >= 9) award(uid, 'gear-relic', db);
    }).catch(function () {});
  }

  window.CDGear = {
    award: award,
    trackArcade: trackArcade,
    trackLesson: trackLesson
  };
})();
