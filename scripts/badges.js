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
     Rarity-scaled celebrations: common gets a spin-in + particle
     puff; rare adds glow burst + rotating light rays; legendary
     opens with Cynetis-7 in proud state (via CDCompanion), then the
     sting sheet drops in with confetti + vignette flash.
     Plays the sting sound (CDSfx 'perfect') and a haptic
     (CDHaptics), both guarded — pages without sfx.js/haptics.js
     get the visual only. Earns are queued so back-to-back badges
     celebrate in sequence. Never throws; never blocks the awarding
     flow.
     ================================================================ */
  var stingQueue = [];
  var stingActive = false; // true while a legendary Cynetis-7 intro is playing

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

  function reduceMotionOn() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

  /* ---------- Celebration CSS (injected once) ---------- */
  function injectStingCss() {
    if (typeof document === 'undefined' || document.getElementById('cdbs-css')) return;
    var css = [
      '@keyframes cdbsFade{from{opacity:0}}',
      '@keyframes cdbsSheetSpring{0%{transform:translateY(60px);opacity:0}100%{transform:translateY(0);opacity:1}}',
      '@keyframes cdbsFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
      '@keyframes cdbsBadgeSpinIn{0%{opacity:0;transform:rotate(-360deg) scale(0)}100%{opacity:1;transform:rotate(0) scale(1)}}',
      '@keyframes cdbsBadgeDrop{0%{opacity:0;transform:translateY(-40vh) scale(1)}55%{opacity:1;transform:translateY(0) scale(1.12)}78%{transform:translateY(-18px) scale(1.05)}100%{opacity:1;transform:translateY(0) scale(1)}}',
      '@keyframes cdbsRaysSpin{to{transform:rotate(360deg)}}',
      '@keyframes cdbsGlowBurst{0%{opacity:0;transform:scale(.4)}35%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(1.5)}}',
      '@keyframes cdbsPillPulse{0%,100%{box-shadow:0 0 14px rgba(212,175,55,.35)}50%{box-shadow:0 0 26px rgba(212,175,55,.65)}}',
      '@keyframes cdbsVigFlash{0%{opacity:0}18%{opacity:1}100%{opacity:0}}',
      '@keyframes cdbsSheetOut{to{transform:translateY(40px);opacity:0}}',
      '.cdbs-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.62);opacity:0}',
      '.cdbs-wrap.cdbs-in .cdbs-backdrop{animation:cdbsFade .3s ease forwards}',
      '.cdbs-sheet-inner{transform:translateY(60px);opacity:0}',
      '.cdbs-wrap.cdbs-in .cdbs-sheet-inner{animation:cdbsSheetSpring .55s cubic-bezier(0.34,1.3,0.64,1) forwards}',
      '.cdbs-kicker,.cdbs-badge-name,.cdbs-badge-desc,.cdbs-pill,.cdbs-buttons{opacity:0}',
      '.cdbs-wrap.cdbs-in .cdbs-kicker{animation:cdbsFadeUp .4s cubic-bezier(0.22,1,0.36,1) .35s forwards}',
      '.cdbs-wrap.cdbs-in .cdbs-badge-name{animation:cdbsFadeUp .4s cubic-bezier(0.22,1,0.36,1) .55s forwards}',
      '.cdbs-wrap.cdbs-in .cdbs-badge-desc{animation:cdbsFadeUp .4s cubic-bezier(0.22,1,0.36,1) .65s forwards}',
      '.cdbs-wrap.cdbs-in .cdbs-pill{animation:cdbsFadeUp .4s cubic-bezier(0.22,1,0.36,1) .75s forwards}',
      '.cdbs-wrap.cdbs-in .cdbs-pill.cdbs-legendary{animation:cdbsFadeUp .4s cubic-bezier(0.22,1,0.36,1) .75s forwards,cdbsPillPulse 2s ease-in-out 1.2s infinite}',
      '.cdbs-wrap.cdbs-in .cdbs-buttons{animation:cdbsFadeUp .4s cubic-bezier(0.22,1,0.36,1) .85s forwards}',
      '.cdbs-badge-zone{position:relative;width:150px;height:150px;margin:0 auto 14px}',
      '.cdbs-rays{position:absolute;inset:-46px;border-radius:50%;opacity:0;pointer-events:none;',
      ' background:repeating-conic-gradient(from 0deg,rgba(141,235,0,.14) 0deg 7deg,transparent 7deg 22deg);',
      ' -webkit-mask:radial-gradient(circle,#000 0%,transparent 68%);mask:radial-gradient(circle,#000 0%,transparent 68%)}',
      '.cdbs-wrap[data-rarity="rare"].cdbs-in .cdbs-rays,.cdbs-wrap[data-rarity="legendary"].cdbs-in .cdbs-rays{opacity:1;animation:cdbsRaysSpin 14s linear infinite}',
      '.cdbs-glow-burst{position:absolute;inset:-30px;border-radius:50%;opacity:0;pointer-events:none;',
      ' background:radial-gradient(circle,rgba(141,235,0,.55),rgba(141,235,0,0) 65%)}',
      '.cdbs-wrap[data-rarity="rare"].cdbs-in .cdbs-glow-burst,.cdbs-wrap[data-rarity="legendary"].cdbs-in .cdbs-glow-burst{animation:cdbsGlowBurst .9s cubic-bezier(0.22,1,0.36,1) .15s}',
      '.cdbs-badge-art{position:absolute;inset:15px;width:120px;height:120px;object-fit:contain;opacity:0}',
      '.cdbs-wrap[data-rarity="common"].cdbs-in .cdbs-badge-art{animation:cdbsBadgeSpinIn .8s cubic-bezier(0.34,1.3,0.64,1) .2s forwards;filter:drop-shadow(0 6px 22px rgba(141,235,0,.25))}',
      '.cdbs-wrap[data-rarity="rare"].cdbs-in .cdbs-badge-art{animation:cdbsBadgeSpinIn .9s cubic-bezier(0.34,1.3,0.64,1) .2s forwards;filter:drop-shadow(0 6px 22px rgba(141,235,0,.35))}',
      '.cdbs-wrap[data-rarity="legendary"].cdbs-in .cdbs-badge-art{animation:cdbsBadgeDrop 1s cubic-bezier(0.22,1,0.36,1) forwards;filter:drop-shadow(0 10px 30px rgba(212,175,55,.5))}',
      '.cdbs-vignette{position:absolute;inset:0;pointer-events:none;opacity:0;',
      ' background:radial-gradient(ellipse at center,transparent 55%,rgba(141,235,0,.28) 100%)}',
      '.cdbs-vignette.cdbs-flash{animation:cdbsVigFlash 1.6s cubic-bezier(0.22,1,0.36,1)}',
      '.cdbs-wrap.cdbs-out .cdbs-backdrop{animation:cdbsFade .25s ease reverse forwards}',
      '.cdbs-wrap.cdbs-out .cdbs-sheet-inner{animation:cdbsSheetOut .25s ease forwards}',
      '@media (prefers-reduced-motion: reduce){',
      ' .cdbs-wrap.cdbs-in .cdbs-backdrop{animation:cdbsFade .25s ease forwards}',
      ' .cdbs-wrap.cdbs-in .cdbs-sheet-inner{animation:cdbsSheetSpring .3s ease forwards}',
      ' .cdbs-wrap.cdbs-in .cdbs-kicker,.cdbs-wrap.cdbs-in .cdbs-badge-name,.cdbs-wrap.cdbs-in .cdbs-badge-desc,.cdbs-wrap.cdbs-in .cdbs-pill,.cdbs-wrap.cdbs-in .cdbs-buttons{animation:cdbsFade .3s ease .1s forwards}',
      ' .cdbs-wrap.cdbs-in .cdbs-badge-art{animation:cdbsFade .3s ease .1s forwards !important;filter:none}',
      ' .cdbs-rays,.cdbs-glow-burst,.cdbs-vignette{display:none !important}',
      '}'
    ].join('\n');
    var el = document.createElement('style');
    el.id = 'cdbs-css';
    el.textContent = css;
    document.head.appendChild(el);
  }

  /* ---------- Canvas particle engine (lazy-init, reused) ---------- */
  var FX_GREENS = ['#8deb00', '#b6ff45', '#ffffff'];
  var FX_GOLDS = ['#8deb00', '#ffffff', '#d4af37', '#f5d76e'];
  var fxCv = null, fxCtx = null, fxParts = [], fxRaf = null;

  function fxInit() {
    if (fxCv || typeof document === 'undefined') return;
    try {
      fxCv = document.createElement('canvas');
      fxCv.id = 'cdbs-fx';
      fxCv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99995;';
      document.body.appendChild(fxCv);
      fxCtx = fxCv.getContext('2d');
      var size = function () {
        var dpr = window.devicePixelRatio || 1;
        fxCv.width = window.innerWidth * dpr;
        fxCv.height = window.innerHeight * dpr;
        fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      size();
      window.addEventListener('resize', size);
    } catch (e) { fxCv = null; }
  }

  function fxSpawn(x, y, n, colors, confetti) {
    if (!fxCv || reduceMotionOn()) return;
    fxInit();
    if (!fxCtx) return;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = confetti ? 3 + Math.random() * 7 : 2 + Math.random() * 5;
      fxParts.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (confetti ? 3 : 1.5),
        life: 1, decay: 0.008 + Math.random() * 0.012,
        size: confetti ? 4 + Math.random() * 6 : 2 + Math.random() * 4,
        color: colors[(Math.random() * colors.length) | 0],
        confetti: confetti,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        grav: confetti ? 0.14 : 0.06
      });
    }
    if (!fxRaf) fxTick();
  }

  function fxTick() {
    if (!fxCtx) { fxRaf = null; return; }
    fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    fxParts = fxParts.filter(function (p) { return p.life > 0; });
    for (var i = 0; i < fxParts.length; i++) {
      var p = fxParts[i];
      p.vy += p.grav; p.vx *= 0.985; p.vy *= 0.99;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= p.decay;
      fxCtx.save();
      fxCtx.globalAlpha = Math.max(p.life, 0);
      if (p.confetti) {
        fxCtx.translate(p.x, p.y); fxCtx.rotate(p.rot);
        fxCtx.fillStyle = p.color;
        fxCtx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      } else {
        fxCtx.fillStyle = p.color;
        fxCtx.beginPath();
        fxCtx.arc(p.x, p.y, Math.max(p.size * p.life, 0.01), 0, 7);
        fxCtx.fill();
      }
      fxCtx.restore();
    }
    if (fxParts.length) {
      fxRaf = requestAnimationFrame(fxTick);
    } else {
      fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      fxRaf = null;
    }
  }

  function badgeZoneCenter() {
    try {
      var el = document.querySelector('#cd-badge-sting .cdbs-badge-zone') ||
               document.querySelector('.cdbs-wrap .cdbs-badge-zone');
      if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      var r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    } catch (e) {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
  }

  function queueSting(badgeId) {
    if (typeof document === 'undefined') return;
    try {
      if (stingActive || document.getElementById('cd-badge-sting') || stingQueue.length) {
        if (stingQueue.indexOf(badgeId) === -1) stingQueue.push(badgeId);
        return;
      }
      showSting(badgeId);
    } catch (e) { /* celebration never breaks the earn */ }
  }

  function nextSting() {
    try {
      stingActive = false;
      if (stingQueue.length) showSting(stingQueue.shift());
    } catch (e) { stingActive = false; }
  }

  function showSting(badgeId) {
    var d = stingDefs()[badgeId];
    if (!d) { nextSting(); return; }
    try {
      if (document.getElementById('cd-badge-sting')) { queueSting(badgeId); return; }
      var rarity = d.rarity || 'common';

      // Legendary: Cynetis-7 in proud state first, then the sheet.
      // CDCompanion.celebrate() resolves after her moment + the 300ms beat.
      if (rarity === 'legendary' && !reduceMotionOn() &&
          window.CDCompanion && typeof window.CDCompanion.celebrate === 'function') {
        stingActive = true;
        try {
          window.CDCompanion.celebrate({ xp: 0, context: 'badge', milestone: true }).then(function () {
            showStingSheet(badgeId);
          }, function () {
            showStingSheet(badgeId);
          });
          return;
        } catch (e) {
          stingActive = false;
          /* fall through to direct sheet */
        }
      }
      showStingSheet(badgeId);
    } catch (e) {
      stingActive = false;
      nextSting();
    }
  }

  function showStingSheet(badgeId) {
    var d = stingDefs()[badgeId];
    if (!d) { nextSting(); return; }
    try {
      if (document.getElementById('cd-badge-sting')) { queueSting(badgeId); return; }
      var rm = reduceMotionOn();
      injectStingCss();
      if (!rm) fxInit();

      var GREEN = '#8DEB00';
      var GREEN_SOFT = '#B6FF45';
      var GOLD = '#d4af37';
      var rarity = d.rarity || 'common';
      var accent = rarity === 'legendary' ? GOLD : (rarity === 'rare' ? GREEN : '#999');
      var isGear = badgeId.indexOf('gear-') === 0 || badgeId.indexOf('glass-') === 0;
      var kicker = rarity === 'legendary' ? 'LEGENDARY EARNED' : (isGear ? 'GEAR ACQUIRED' : 'BADGE EARNED');
      var shareable = !!(d.art && window.CDGearShare && typeof window.CDGearShare.card === 'function');

      var artHtml;
      if (d.art) {
        artHtml = '<img class="cdbs-badge-art" src="' + d.art + '" alt="">';
      } else if (d.icon) {
        artHtml = '<div class="cdbs-badge-art" style="font-size:52px;line-height:120px;color:' + accent + ';text-align:center;"><i class="fa ' + escapeHtml(d.icon) + '"></i></div>';
      } else {
        artHtml = '<div class="cdbs-badge-art" style="font-size:52px;line-height:120px;text-align:center;">' + escapeHtml(d.emoji || '') + '</div>';
      }

      var pillHtml = d.rarity
        ? '<div class="cdbs-pill cdbs-' + escapeHtml(rarity) + '" style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:2px;color:' + accent +
          ';border:1px solid ' + accent + ';border-radius:20px;padding:5px 14px;margin-bottom:18px;">' +
          escapeHtml(rarity.toUpperCase()) + '</div>'
        : '<div style="margin-bottom:18px;"></div>';

      var buttonsHtml = shareable
        ? '<div class="cdbs-buttons" style="display:flex;gap:10px;">' +
          '<button type="button" id="cdStingShareBtn" style="flex:1;padding:14px;border:none;border-radius:12px;background:' + GREEN + ';color:#000;font-weight:800;font-size:15px;cursor:pointer;">Share</button>' +
          '<button type="button" id="cdStingDismissBtn" style="flex:1;padding:14px;border:1px solid #2a2a2a;border-radius:12px;background:transparent;color:#bbb;font-weight:700;font-size:15px;cursor:pointer;">Not now</button>' +
          '</div>'
        : '<div class="cdbs-buttons"><button type="button" id="cdStingDismissBtn" style="width:100%;padding:14px;border:none;border-radius:12px;background:' + GREEN + ';color:#000;font-weight:800;font-size:15px;cursor:pointer;">Keep going</button></div>';

      var wrap = document.createElement('div');
      wrap.id = 'cd-badge-sting';
      wrap.className = 'cdbs-wrap';
      wrap.setAttribute('data-rarity', rarity);
      wrap.setAttribute('role', 'dialog');
      wrap.setAttribute('aria-label', kicker);
      wrap.style.cssText = 'position:fixed;inset:0;z-index:99990;display:flex;align-items:flex-end;justify-content:center;';

      wrap.innerHTML =
        '<div class="cdbs-backdrop"></div>' +
        '<div class="cdbs-sheet" style="position:relative;width:100%;display:flex;justify-content:center;pointer-events:none;">' +
          '<div class="cdbs-sheet-inner" style="pointer-events:auto;width:100%;max-width:520px;background:#0c0c0c;border:1px solid #1e1e1e;border-bottom:none;border-radius:20px 20px 0 0;padding:28px 24px calc(24px + env(safe-area-inset-bottom));text-align:center;">' +
            '<div class="cdbs-kicker" style="font-size:11px;letter-spacing:3px;color:' + GREEN + ';font-weight:700;margin-bottom:14px;">' + kicker + '</div>' +
            '<div class="cdbs-badge-zone">' +
              '<div class="cdbs-rays"></div>' +
              '<div class="cdbs-glow-burst"></div>' +
              artHtml +
            '</div>' +
            '<div class="cdbs-badge-name" style="font-size:22px;font-weight:800;color:#fff;margin-bottom:4px;">' + escapeHtml(d.name || badgeId) + '</div>' +
            '<div class="cdbs-badge-desc" style="font-size:13px;color:#888;margin-bottom:12px;">' + escapeHtml(d.desc || '') + '</div>' +
            pillHtml +
            buttonsHtml +
          '</div>' +
        '</div>' +
        '<div class="cdbs-vignette"></div>';

      var closed = false;
      function close() {
        if (closed) return;
        closed = true;
        // Drop the id immediately so the queued next sting doesn't see a stale element
        try { wrap.removeAttribute('id'); } catch (e) {}
        try {
          if (rm) {
            wrap.remove();
          } else {
            wrap.classList.remove('cdbs-in');
            wrap.classList.add('cdbs-out');
            setTimeout(function () { try { wrap.remove(); } catch (e) {} }, 260);
          }
        } catch (e) {}
        nextSting();
      }
      wrap.addEventListener('click', function (ev) { if (ev.target === wrap || ev.target.classList.contains('cdbs-backdrop')) close(); });
      var dismissBtn = wrap.querySelector('#cdStingDismissBtn');
      if (dismissBtn) dismissBtn.addEventListener('click', close);
      var shareBtn = wrap.querySelector('#cdStingShareBtn');
      if (shareBtn) shareBtn.addEventListener('click', function () {
        close();
        try { window.CDGearShare.card(badgeId); } catch (e) {}
      });
      document.body.appendChild(wrap);
      // Trigger entrance animations on the next frame
      requestAnimationFrame(function () {
        try { wrap.classList.add('cdbs-in'); } catch (e) {}
      });
      playStingFeedback(rarity);

      // Rarity-scaled particle celebrations, timed to the badge entrance
      if (!rm) {
        var colors = rarity === 'legendary' ? FX_GOLDS : FX_GREENS;
        if (rarity === 'common') {
          setTimeout(function () { var c = badgeZoneCenter(); fxSpawn(c.x, c.y, 12, colors, false); }, 450);
        } else if (rarity === 'rare') {
          setTimeout(function () { var c = badgeZoneCenter(); fxSpawn(c.x, c.y, 24, colors, false); }, 500);
        } else if (rarity === 'legendary') {
          setTimeout(function () {
            var c = badgeZoneCenter();
            fxSpawn(c.x, c.y, 46, colors, true);
            try {
              var v = wrap.querySelector('.cdbs-vignette');
              if (v) v.classList.add('cdbs-flash');
            } catch (e) {}
          }, 700);
        }
      }
    } catch (e) {
      stingActive = false;
      nextSting();
    }
  }

  function defs() { return DEFS; }

  window.CDBadges = { defs: defs, award: award };
})();
