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
    'darkroom-skill':{ name: 'Master Print',   icon: 'fa-award',       emoji: '🖼️', desc: 'Completed a Darkroom skill' },
    /* ---- Gear collectibles · Series 01 ---- */
    'gear-flatline': { name: 'Flatline',    icon: 'fa-camera',   emoji: '📷', desc: 'Completed your first mission step',        art: '/media/badges/gear/gear-flatline.png',    rarity: 'common' },
    'gear-overdrive':{ name: 'Overdrive',   icon: 'fa-bolt',     emoji: '🎞️', desc: 'Ran 5 arcade drills',                      art: '/media/badges/gear/gear-overdrive.png',   rarity: 'common' },
    'gear-longshot': { name: 'Longshot',    icon: 'fa-crosshairs',emoji: '🔭', desc: 'Held a 3-day streak',                      art: '/media/badges/gear/gear-longshot.png',    rarity: 'common' },
    'gear-framed':   { name: 'Framed',      icon: 'fa-crop',     emoji: '🖼️', desc: 'Completed your first daily challenge',     art: '/media/badges/gear/gear-framed.png',      rarity: 'common' },
    'gear-bloom':    { name: 'Bloom',       icon: 'fa-leaf',     emoji: '🌸', desc: 'Saved your first snapshot card',           art: '/media/badges/gear/gear-bloom.png',       rarity: 'common' },
    'gear-ghost':    { name: 'Ghost',       icon: 'fa-ghost',    emoji: '👻', desc: 'Aced an advanced quiz — every question',   art: '/media/badges/gear/gear-ghost.png',       rarity: 'rare' },
    'gear-director': { name: 'Director',    icon: 'fa-clapperboard', emoji: '🎬', desc: 'Completed your first Darkroom skill',   art: '/media/badges/gear/gear-director.png',    rarity: 'rare' },
    'gear-arsenal':  { name: 'The Arsenal', icon: 'fa-box-open', emoji: '🧰', desc: 'Played every arcade game',                 art: '/media/badges/gear/gear-arsenal.png',     rarity: 'rare' },
    'gear-trinity':  { name: 'The Trinity', icon: 'fa-gem',      emoji: '💎', desc: 'Earned any 3 gear collectibles',           art: '/media/badges/gear/gear-trinity.png',     rarity: 'rare' },
    'gear-relic':    { name: 'The Relic',   icon: 'fa-award',    emoji: '🏆', desc: 'Completed all 9 free Darkroom lessons',    art: '/media/badges/gear/gear-relic.png',       rarity: 'legendary' },
    /* ---- Signal Glass · Series 02 ---- */
    'glass-kit':       { name: 'The Kit Bag',  icon: 'fa-briefcase', emoji: '🎒', desc: 'Ran 10 arcade drills',                    art: '/media/badges/glass/glass-kit.png',       rarity: 'common' },
    'glass-hauler':    { name: 'The Hauler',   icon: 'fa-briefcase', emoji: '🎒', desc: 'Ran 25 arcade drills',                    art: '/media/badges/glass/glass-hauler.png',    rarity: 'rare' },
    'glass-overloaded':{ name: 'Overloaded',   icon: 'fa-box',       emoji: '📦', desc: 'Ran 50 arcade drills',                    art: '/media/badges/glass/glass-overloaded.png', rarity: 'rare' },
    'glass-bullseye':  { name: 'Bullseye',     icon: 'fa-bullseye',  emoji: '🎯', desc: 'Scored 95+ in any arcade game',            art: '/media/badges/glass/glass-bullseye.png',  rarity: 'rare' },
    'glass-blueprint': { name: 'The Blueprint',icon: 'fa-drafting-compass', emoji: '📐', desc: 'Completed 5 Darkroom lessons',    art: '/media/badges/glass/glass-blueprint.png', rarity: 'common' },
    'glass-developer': { name: 'The Developer',icon: 'fa-flask',     emoji: '🧪', desc: 'Completed 25 Darkroom drills',            art: '/media/badges/glass/glass-developer.png', rarity: 'rare' },
    'glass-action':    { name: 'Action',       icon: 'fa-video',     emoji: '🎬', desc: 'Completed 5 daily challenges',            art: '/media/badges/glass/glass-action.png',    rarity: 'common' },
    'glass-tripod':    { name: 'Three Legs',  icon: 'fa-camera',    emoji: '📷', desc: 'Completed 10 daily challenges',           art: '/media/badges/glass/glass-tripod.png',    rarity: 'common' },
    'glass-strobe':    { name: 'The Strobe',   icon: 'fa-bolt',      emoji: '⚡', desc: 'Completed 25 daily challenges',           art: '/media/badges/glass/glass-strobe.png',    rarity: 'rare' },
    'glass-archive':   { name: 'The Archive',  icon: 'fa-sd-card',   emoji: '💾', desc: 'Saved 10 snapshot cards',                 art: '/media/badges/glass/glass-archive.png',   rarity: 'common' },
    'glass-gallery':   { name: 'Night Gallery',icon: 'fa-image',     emoji: '🖼️', desc: 'Saved 25 snapshot cards',                 art: '/media/badges/glass/glass-gallery.png',   rarity: 'rare' },
    'glass-steady':    { name: 'Steady',       icon: 'fa-arrows-up-down-left-right', emoji: '🎥', desc: 'Held a 14-day streak',    art: '/media/badges/glass/glass-steady.png',    rarity: 'rare' },
    'glass-dustoff':   { name: 'Dust Off',     icon: 'fa-wind',      emoji: '💨', desc: 'Came back after 7+ days away',            art: '/media/badges/glass/glass-dustoff.png',   rarity: 'common' },
    'glass-vision':    { name: 'Second Sight', icon: 'fa-glasses',   emoji: '👓', desc: 'Aced 5 quizzes — every question right',   art: '/media/badges/glass/glass-vision.png',    rarity: 'rare' },
    'glass-body':      { name: 'Full Frame',   icon: 'fa-camera',    emoji: '📸', desc: 'Completed your first mission',            art: '/media/badges/glass/glass-body.png',      rarity: 'common' },
    'glass-overhead':  { name: 'Overhead',     icon: 'fa-paper-plane', emoji: '🚁', desc: 'Earned 1,000 lifetime XP',              art: '/media/badges/glass/glass-overhead.png',  rarity: 'rare' },
    'glass-prism':     { name: 'Prism',        icon: 'fa-gem',       emoji: '💎', desc: 'Earned 5,000 lifetime XP',                art: '/media/badges/glass/glass-prism.png',     rarity: 'legendary' },
    'glass-signalday': { name: 'Signal Day',   icon: 'fa-cake-candles', emoji: '🎂', desc: 'One year on the signal',              art: '/media/badges/glass/glass-signalday.png', rarity: 'legendary' }
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
