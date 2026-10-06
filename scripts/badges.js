/* ================================================================
   CAMERAS DECODED — Badges (shared)
   Single source of truth for badge definitions and awarding.
   Badges live on users/{uid} as badges: { <id>: <timestamp> }.
   On every NEW earn, the badge sting fires: a bottom sheet with the
   badge art/name/rarity, the 'perfect' SFX (when CDSfx is present)
   and a haptic (when CDHaptics is present). Earns queue so
   back-to-back badges celebrate in sequence.
   Usage:
     <script src="/scripts/badges.js"></script>
     CDBadges.award(uid, 'quiz-perfect');          // needs firebase + db ready
     CDBadges.award(uid, 'quiz-perfect', db);      // or pass db explicitly
   ================================================================ */
(function () {
  'use strict';

  var DEFS = {
    'quiz-perfect':  { name: 'Tack Sharp',     icon: 'fa-crosshairs',  emoji: '🎯', desc: 'Nailed every question — critical focus', art: '/media/badges/glass/quiz-perfect.png' },
    'quiz-10':       { name: 'Contact Sheet',  icon: 'fa-layer-group', emoji: '🎞️', desc: 'Worked through 10 full quizzes' },
    'streak-7':      { name: 'Daily Developer',icon: 'fa-flask',       emoji: '🧪', desc: 'Showed up 7 days straight' },
    'arcade-first':  { name: 'First Exposure', icon: 'fa-aperture',    emoji: '📸', desc: 'Ran your first arcade drill', art: '/media/badges/glass/arcade-first.png' },
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
    'glass-signalday': { name: 'Signal Day',   icon: 'fa-cake-candles', emoji: '🎂', desc: 'One year on the signal',              art: '/media/badges/glass/glass-signalday.png', rarity: 'legendary' },
    /* ---- Camera Lab v2 · Series ---- */
    'clab-master': { name: 'Master of Light', icon: 'fa-camera', desc: 'Earned an S on all 5 Camera Lab scenes', rarity: 'legendary' },
    'clab-sharpshooter-1': { name: 'Sharp Shooter', icon: 'fa-crosshairs', desc: '25 photos graded B or better in Camera Lab', rarity: 'common' },
    'clab-sharpshooter-2': { name: 'Sharp Shooter II', icon: 'fa-crosshairs', desc: '100 photos graded B or better in Camera Lab', rarity: 'rare' },
    'clab-sharpshooter-3': { name: 'Sharp Shooter III', icon: 'fa-crosshairs', desc: '300 photos graded B or better in Camera Lab', rarity: 'legendary' },
    /* ---- Pro Protocols · Night Ops ---- */
    'blue-hour-operator': { name: 'Blue Hour Operator', icon: 'fa-moon', emoji: '🌃', desc: 'Completed Protocol 022: The Blue Hour Contract', rarity: 'rare' }
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
  // On a NEW earn, fires the badge sting (visual + sound + haptics).
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
      return ref.set(upd, { merge: true }).then(function () {
        queueSting(badgeId);
        return true;
      });
    }).catch(function () { return false; });
  }

  /* ================================================================
     BADGE STING — one celebratory moment per new earn.
     Bottom sheet with the badge art, name and rarity; plays the
     sting sound (CDSfx 'perfect') and a haptic (CDHaptics), both
     guarded — pages without sfx.js/haptics.js get the visual only.
     Earns are queued so back-to-back badges celebrate in sequence.
     Never throws; never blocks the awarding flow.
     ================================================================ */
  var stingQueue = [];

  function stingDefs() { return DEFS; }

  function playStingFeedback(rarity) {
    try {
      if (window.CDSfx && typeof window.CDSfx.play === 'function') {
        window.CDSfx.play('perfect');
      }
    } catch (e) {}
    try {
      if (window.CDHaptics) {
        if ((rarity === 'rare' || rarity === 'legendary') && typeof window.CDHaptics.bigSuccess === 'function') {
          window.CDHaptics.bigSuccess();
        } else if (typeof window.CDHaptics.success === 'function') {
          window.CDHaptics.success();
        }
      }
    } catch (e) {}
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function queueSting(badgeId) {
    if (typeof document === 'undefined') return;
    try {
      if (document.getElementById('cd-badge-sting') || stingQueue.length) {
        if (stingQueue.indexOf(badgeId) === -1) stingQueue.push(badgeId);
        return;
      }
      showSting(badgeId);
    } catch (e) { /* celebration never breaks the earn */ }
  }

  function nextSting() {
    try {
      if (stingQueue.length) showSting(stingQueue.shift());
    } catch (e) {}
  }

  function showSting(badgeId) {
    var d = stingDefs()[badgeId];
    if (!d) { nextSting(); return; }
    try {
      if (document.getElementById('cd-badge-sting')) { queueSting(badgeId); return; }
      var reduceMotion = false;
      try {
        reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (e) {}

      var GREEN = '#8DEB00';
      var GREEN_SOFT = '#B6FF45';
      var rarity = d.rarity || 'common';
      var accent = rarity === 'legendary' ? GREEN_SOFT : (rarity === 'rare' ? GREEN : '#999');
      var isGear = badgeId.indexOf('gear-') === 0 || badgeId.indexOf('glass-') === 0;
      var kicker = isGear ? 'GEAR ACQUIRED' : 'BADGE EARNED';
      var shareable = !!(d.art && window.CDGearShare && typeof window.CDGearShare.card === 'function');

      var artHtml = d.art
        ? '<img src="' + d.art + '" alt="" style="width:96px;height:96px;object-fit:contain;">'
        : (d.icon
            ? '<div style="font-size:52px;line-height:96px;color:' + accent + ';"><i class="fa ' + escapeHtml(d.icon) + '"></i></div>'
            : '<div style="font-size:52px;line-height:96px;">' + (d.emoji || '🏅') + '</div>');

      var rarityHtml = d.rarity
        ? '<div style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:2px;color:' + accent +
          ';border:1px solid ' + accent + ';border-radius:20px;padding:5px 14px;margin-bottom:16px;">' +
          escapeHtml(rarity.toUpperCase()) + '</div>'
        : '<div style="margin-bottom:16px;"></div>';

      var buttonsHtml = shareable
        ? '<div style="display:flex;gap:10px;">' +
          '<button type="button" id="cdStingShareBtn" style="flex:1;padding:14px;border:none;border-radius:12px;background:' + GREEN + ';color:#000;font-weight:800;font-size:15px;cursor:pointer;">Share</button>' +
          '<button type="button" id="cdStingDismissBtn" style="flex:1;padding:14px;border:1px solid #2a2a2a;border-radius:12px;background:transparent;color:#bbb;font-weight:700;font-size:15px;cursor:pointer;">Not now</button>' +
          '</div>'
        : '<button type="button" id="cdStingDismissBtn" style="width:100%;padding:14px;border:none;border-radius:12px;background:' + GREEN + ';color:#000;font-weight:800;font-size:15px;cursor:pointer;">Keep going</button>';

      var wrap = document.createElement('div');
      wrap.id = 'cd-badge-sting';
      wrap.setAttribute('role', 'dialog');
      wrap.setAttribute('aria-label', kicker);
      wrap.style.cssText = 'position:fixed;inset:0;z-index:99990;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.6);' +
        (reduceMotion ? '' : 'animation:cdStingFade .25s ease;');

      wrap.innerHTML =
        '<div style="width:100%;max-width:520px;background:#0c0c0c;border:1px solid #1e1e1e;border-bottom:none;border-radius:20px 20px 0 0;padding:24px 24px calc(24px + env(safe-area-inset-bottom));text-align:center;' +
        (reduceMotion ? '' : 'animation:cdStingUp .3s ease;') + '">' +
          '<div style="font-size:11px;letter-spacing:3px;color:' + GREEN + ';font-weight:700;margin-bottom:12px;">' + kicker + '</div>' +
          '<div style="margin-bottom:12px;">' + artHtml + '</div>' +
          '<div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:4px;">' + escapeHtml(d.name || badgeId) + '</div>' +
          '<div style="font-size:13px;color:#888;margin-bottom:12px;">' + escapeHtml(d.desc || '') + '</div>' +
          rarityHtml +
          buttonsHtml +
        '</div>' +
        '<style>@keyframes cdStingFade{from{opacity:0}}@keyframes cdStingUp{from{transform:translateY(40px);opacity:0}}</style>';

      function close() {
        try { wrap.remove(); } catch (e) {}
        nextSting();
      }
      wrap.addEventListener('click', function (ev) { if (ev.target === wrap) close(); });
      var dismissBtn = wrap.querySelector('#cdStingDismissBtn');
      if (dismissBtn) dismissBtn.addEventListener('click', close);
      var shareBtn = wrap.querySelector('#cdStingShareBtn');
      if (shareBtn) shareBtn.addEventListener('click', function () {
        close();
        try { window.CDGearShare.card(badgeId); } catch (e) {}
      });
      document.body.appendChild(wrap);
      playStingFeedback(rarity);
    } catch (e) {
      nextSting();
    }
  }

  function defs() { return DEFS; }

  window.CDBadges = { defs: defs, award: award };
})();
