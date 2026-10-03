/* ================================================================
   CAMERAS DECODED — Gear collectibles awarding (shared)
   Thin wrapper around CDBadges for the gear-* and glass-* badge
   families.

   - CDGear.award(uid, badgeId, db): awards one gear/glass badge
     (once-only, via CDBadges). On a NEW earn it checks the Trinity
     meta-badge (any 3 gear collectibles, gear family only) and fires
     the share-on-earn prompt.
   - CDGear.trackArcade(db, uid, slotId, score): call on every scored
     arcade play. Maintains gearProgress { arcadeSlots[], arcadePlays,
     bestScore } and awards Overdrive (5 plays) / Arsenal (5 distinct
     games) plus the glass arcade tiers.
   - CDGear.trackLesson(db, uid, isFree): call on every newly-banked
     Darkroom lesson. Maintains gearProgress { lessonsDone,
     freeLessons } and awards Director (1st) / Relic (9 free) plus
     the glass lesson tier.
   - CDGear.trackDrill / trackChallenge / trackSnapshot /
     trackQuizPerfect / trackMission / trackGuideLesson: increment
     their gearProgress counter, then run checkMilestones.
   - CDGear.checkMilestones(db, uid): reads users/{uid} once and
     awards any newly-met glass badge. Safe to call after any earn
     event; everything is once-only via CDBadges.

   Everything is best-effort: failures never throw, never block the
   calling flow. Requires scripts/badges.js (CDBadges) for awarding;
   Firestore writes go to users/{uid} via merge.
   ================================================================ */
(function () {
  'use strict';

  var GEAR_PREFIX = 'gear-';
  var GLASS_PREFIX = 'glass-';
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

  // Award one gear/glass badge. Resolves true only on a NEW earn.
  function award(uid, badgeId, explicitDb) {
    if (!uid || !badgeId) return Promise.resolve(false);
    var isGear = badgeId.indexOf(GEAR_PREFIX) === 0;
    var isGlass = badgeId.indexOf(GLASS_PREFIX) === 0;
    if (!isGear && !isGlass) return Promise.resolve(false);
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
  function trackArcade(explicitDb, uid, slotId, score) {
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
      var data = snap.data() || {};
      var gp = data.gearProgress || {};
      var plays = gp.arcadePlays || 0;
      var slots = gp.arcadeSlots || [];
      var best = gp.bestScore || 0;
      if (typeof score === 'number' && score > 0 && score > best) {
        best = score;
        db.collection('users').doc(uid).set({ 'gearProgress.bestScore': score }, { merge: true }).catch(function () {});
      }
      if (!gp.firstSeen) {
        db.collection('users').doc(uid).set(
          { 'gearProgress.firstSeen': Date.now() }, { merge: true }).catch(function () {});
      }
      data.gearProgress = Object.assign({}, gp, { bestScore: best });
      if (plays >= 5) award(uid, 'gear-overdrive', db);
      if (slots.length >= 5) award(uid, 'gear-arsenal', db);
      return checkMilestones(db, uid, data);
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
      var data = snap.data() || {};
      var gp = data.gearProgress || {};
      if (!gp.firstSeen) {
        db.collection('users').doc(uid).set(
          { 'gearProgress.firstSeen': Date.now() }, { merge: true }).catch(function () {});
      }
      if ((gp.lessonsDone || 0) >= 1) award(uid, 'gear-director', db);
      if ((gp.freeLessons || 0) >= 9) award(uid, 'gear-relic', db);
      return checkMilestones(db, uid, data);
    }).catch(function () {});
  }

  // ---- Generic counter trackers: bump one gearProgress counter, stamp
  // firstSeen, then run the milestone check. Each is one line at the
  // call site and never throws. ----
  function trackCounter(explicitDb, uid, key, amount) {
    var db = getDb(explicitDb);
    if (!db || !uid) return Promise.resolve();
    var F = fieldValue();
    if (!F) return Promise.resolve();
    var upd = {};
    upd['gearProgress.' + key] = F.increment(amount || 1);
    return db.collection('users').doc(uid).set(upd, { merge: true }).then(function () {
      return db.collection('users').doc(uid).get();
    }).then(function (snap) {
      var data = snap.data() || {};
      var gp = data.gearProgress || {};
      if (!gp.firstSeen) {
        db.collection('users').doc(uid).set(
          { 'gearProgress.firstSeen': Date.now() }, { merge: true }).catch(function () {});
      }
      return checkMilestones(db, uid, data);
    }).catch(function () {});
  }

  function trackDrill(explicitDb, uid)        { return trackCounter(explicitDb, uid, 'drillsDone'); }
  function trackChallenge(explicitDb, uid)    { return trackCounter(explicitDb, uid, 'challengesDone'); }
  function trackSnapshot(explicitDb, uid)     { return trackCounter(explicitDb, uid, 'snapshotsSaved'); }
  function trackQuizPerfect(explicitDb, uid) { return trackCounter(explicitDb, uid, 'perfectQuizzes'); }
  function trackMission(explicitDb, uid)     { return trackCounter(explicitDb, uid, 'missionsDone'); }
  function trackGuideLesson(explicitDb, uid) { return trackCounter(explicitDb, uid, 'guideLessonsDone'); }

  // ---- Milestone check: award any newly-met glass badge. Reads the
  // user doc the caller already fetched (or fetches it). All awards
  // are once-only via CDBadges, so this is safe to call often. ----
  function checkMilestones(explicitDb, uid, userData) {
    var db = getDb(explicitDb);
    if (!db || !uid || !window.CDBadges) return Promise.resolve();
    function run(data) {
      try {
        data = data || {};
        var gp = data.gearProgress || {};
        var badges = data.badges || {};
        function need(id) { return !badges[id]; }
        function maybe(cond, id) { if (cond && need(id)) award(uid, id, db); }

        var plays = gp.arcadePlays || 0;
        maybe(plays >= 10, 'glass-kit');
        maybe(plays >= 25, 'glass-hauler');
        maybe(plays >= 50, 'glass-overloaded');
        maybe((gp.bestScore || 0) >= 95, 'glass-bullseye');

        maybe((gp.lessonsDone || 0) >= 5, 'glass-blueprint');
        maybe((gp.drillsDone || 0) >= 25, 'glass-developer');

        var ch = gp.challengesDone || 0;
        maybe(ch >= 5, 'glass-action');
        maybe(ch >= 10, 'glass-tripod');
        maybe(ch >= 25, 'glass-strobe');

        var snaps = gp.snapshotsSaved || 0;
        maybe(snaps >= 10, 'glass-archive');
        maybe(snaps >= 25, 'glass-gallery');

        maybe((gp.perfectQuizzes || 0) >= 5, 'glass-vision');
        maybe((gp.missionsDone || 0) >= 1, 'glass-body');

        var xp = data.totalPoints || 0;
        maybe(xp >= 1000, 'glass-overhead');
        maybe(xp >= 5000, 'glass-prism');

        if (gp.firstSeen && need('glass-signalday')) {
          var days = (Date.now() - gp.firstSeen) / 864e5;
          if (days >= 365) award(uid, 'glass-signalday', db);
        }
      } catch (e) { /* best-effort */ }
      return Promise.resolve();
    }
    if (userData) return run(userData);
    return db.collection('users').doc(uid).get()
      .then(function (snap) { return run(snap.exists ? snap.data() : null); })
      .catch(function () {});
  }

  window.CDGear = {
    award: award,
    trackArcade: trackArcade,
    trackLesson: trackLesson,
    trackDrill: trackDrill,
    trackChallenge: trackChallenge,
    trackSnapshot: trackSnapshot,
    trackQuizPerfect: trackQuizPerfect,
    trackMission: trackMission,
    trackGuideLesson: trackGuideLesson,
    checkMilestones: checkMilestones
  };
})();
