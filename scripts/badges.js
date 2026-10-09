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
     Full-screen premium overlay: confetti rain + badge-center
     burst, large badge art with spring pop-in, rarity halo/rays,
     "Badge earned!" headline, rarity pill, and a Share row
     (Web Share API with clipboard fallback).
     Rarity scaling: common gets a short rain + particle puff;
     rare adds rotating light rays + longer rain; legendary opens
     with Cynetis-7 in proud state (via CDCompanion), then the
     overlay drops in with gold confetti.
     Plays the sting sound (CDSfx 'perfect') and a haptic
     (CDHaptics), both guarded — pages without sfx.js/haptics.js
     get the visual only. Earns are queued so back-to-back badges
     celebrate in sequence. Respects prefers-reduced-motion.
     Never throws; never blocks the awarding flow.
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
      '@keyframes cdbcFade{from{opacity:0}to{opacity:1}}',
      '@keyframes cdbcCardIn{0%{opacity:0;transform:scale(.92) translateY(18px)}100%{opacity:1;transform:none}}',
      '@keyframes cdbcBadgePop{0%{opacity:0;transform:scale(.3) rotate(-14deg)}60%{opacity:1;transform:scale(1.12) rotate(3deg)}100%{opacity:1;transform:scale(1) rotate(0)}}',
      '@keyframes cdbcRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
      '@keyframes cdbcRaysSpin{to{transform:rotate(360deg)}}',
      '@keyframes cdbcHaloPulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.9;transform:scale(1.08)}}',
      '@keyframes cdbcPillPulse{0%,100%{box-shadow:0 0 12px rgba(212,175,55,.35)}50%{box-shadow:0 0 26px rgba(212,175,55,.7)}}',
      '.cdbc-wrap{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;padding:24px;opacity:0;transition:opacity .3s ease;pointer-events:none}',
      '.cdbc-wrap.cdbc-in{opacity:1;pointer-events:auto}',
      '.cdbc-wrap.cdbc-out{opacity:0 !important;pointer-events:none}',
      '.cdbc-backdrop{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 36%,rgba(141,235,0,.13),rgba(4,4,6,.94) 72%)}',
      '.cdbc-card{position:relative;text-align:center;max-width:400px;width:100%;opacity:0}',
      '.cdbc-wrap.cdbc-in .cdbc-card{animation:cdbcCardIn .5s cubic-bezier(.22,1,.36,1) .05s forwards}',
      '.cdbc-kicker{font-size:11px;letter-spacing:4px;font-weight:800;color:#8deb00;margin-bottom:18px;opacity:0}',
      '.cdbc-wrap.cdbc-in .cdbc-kicker{animation:cdbcRise .45s ease .3s forwards}',
      '.cdbc-badge-zone{position:relative;width:210px;height:210px;margin:0 auto 20px}',
      '.cdbc-rays{position:absolute;inset:-42px;border-radius:50%;opacity:0;pointer-events:none;',
      ' background:repeating-conic-gradient(from 0deg,rgba(141,235,0,.16) 0deg 6deg,transparent 6deg 20deg);',
      ' -webkit-mask:radial-gradient(circle,#000 0%,transparent 68%);mask:radial-gradient(circle,#000 0%,transparent 68%)}',
      '.cdbc-wrap[data-rarity="rare"].cdbc-in .cdbc-rays,.cdbc-wrap[data-rarity="legendary"].cdbc-in .cdbc-rays{opacity:1;animation:cdbcRaysSpin 16s linear infinite}',
      '.cdbc-halo{position:absolute;inset:4px;border-radius:50%;pointer-events:none;opacity:0;',
      ' background:radial-gradient(circle,rgba(141,235,0,.35),rgba(141,235,0,0) 68%)}',
      '.cdbc-wrap[data-rarity="legendary"] .cdbc-halo{background:radial-gradient(circle,rgba(212,175,55,.45),rgba(212,175,55,0) 68%)}',
      '.cdbc-wrap.cdbc-in .cdbc-halo{animation:cdbcHaloPulse 2.6s ease-in-out .5s infinite}',
      '.cdbc-badge-art{position:absolute;inset:20px;width:170px;height:170px;object-fit:contain;opacity:0}',
      '.cdbc-wrap.cdbc-in .cdbc-badge-art{animation:cdbcBadgePop .7s cubic-bezier(.34,1.4,.64,1) .15s forwards}',
      '.cdbc-wrap[data-rarity="common"].cdbc-in .cdbc-badge-art{filter:drop-shadow(0 8px 28px rgba(141,235,0,.3))}',
      '.cdbc-wrap[data-rarity="rare"].cdbc-in .cdbc-badge-art{filter:drop-shadow(0 8px 34px rgba(141,235,0,.45))}',
      '.cdbc-wrap[data-rarity="legendary"].cdbc-in .cdbc-badge-art{filter:drop-shadow(0 10px 42px rgba(212,175,55,.55))}',
      '.cdbc-badge-fallback{display:flex;align-items:center;justify-content:center;font-size:84px}',
      '.cdbc-badge-fallback i{font-size:84px}',
      '.cdbc-headline{font-size:28px;font-weight:800;color:#fff;letter-spacing:-.01em;margin-bottom:6px;opacity:0}',
      '.cdbc-wrap.cdbc-in .cdbc-headline{animation:cdbcRise .45s ease .45s forwards}',
      '.cdbc-name{font-size:16px;font-weight:700;color:#8deb00;margin-bottom:8px;opacity:0}',
      '.cdbc-wrap.cdbc-in .cdbc-name{animation:cdbcRise .45s ease .55s forwards}',
      '.cdbc-desc{font-size:13.5px;line-height:1.55;color:rgba(255,255,255,.6);max-width:32ch;margin:0 auto 16px;opacity:0}',
      '.cdbc-wrap.cdbc-in .cdbc-desc{animation:cdbcRise .45s ease .65s forwards}',
      '.cdbc-pill{display:inline-block;font-size:11px;font-weight:800;letter-spacing:3px;border-radius:999px;padding:7px 18px;margin-bottom:24px;opacity:0}',
      '.cdbc-wrap.cdbc-in .cdbc-pill{animation:cdbcRise .45s ease .75s forwards}',
      '.cdbc-pill.cdbc-common{color:#b6ff45;border:1px solid rgba(141,235,0,.5);background:rgba(141,235,0,.08)}',
      '.cdbc-pill.cdbc-rare{color:#8deb00;border:1px solid #8deb00;background:rgba(141,235,0,.12)}',
      '.cdbc-pill.cdbc-legendary{color:#d4af37;border:1px solid #d4af37;background:rgba(212,175,55,.1)}',
      '.cdbc-wrap.cdbc-in .cdbc-pill.cdbc-legendary{animation:cdbcRise .45s ease .75s forwards,cdbcPillPulse 2.2s ease-in-out 1.2s infinite}',
      '.cdbc-share-label{font-size:12px;letter-spacing:2px;font-weight:700;color:rgba(255,255,255,.55);margin-bottom:10px;opacity:0}',
      '.cdbc-wrap.cdbc-in .cdbc-share-label{animation:cdbcRise .45s ease .85s forwards}',
      '.cdbc-actions{display:flex;gap:10px;opacity:0}',
      '.cdbc-wrap.cdbc-in .cdbc-actions{animation:cdbcRise .45s ease .95s forwards}',
      '.cdbc-btn{flex:1;padding:15px 10px;border-radius:14px;font-size:15px;font-weight:800;cursor:pointer;border:none;font-family:inherit}',
      '.cdbc-share{background:#8deb00;color:#060606}',
      '.cdbc-share:active{transform:scale(.97)}',
      '.cdbc-dismiss{background:rgba(255,255,255,.06);color:#ddd;border:1px solid rgba(255,255,255,.14)}',
      '@media (prefers-reduced-motion: reduce){',
      ' .cdbc-wrap{transition:none}',
      ' .cdbc-wrap.cdbc-in .cdbc-card{animation:cdbcFade .25s ease .05s forwards}',
      ' .cdbc-wrap.cdbc-in .cdbc-kicker,.cdbc-wrap.cdbc-in .cdbc-headline,.cdbc-wrap.cdbc-in .cdbc-name,',
      ' .cdbc-wrap.cdbc-in .cdbc-desc,.cdbc-wrap.cdbc-in .cdbc-pill,.cdbc-wrap.cdbc-in .cdbc-share-label,',
      ' .cdbc-wrap.cdbc-in .cdbc-actions{animation:cdbcFade .25s ease .1s forwards}',
      ' .cdbc-wrap.cdbc-in .cdbc-badge-art{animation:cdbcFade .25s ease .1s forwards !important;filter:none}',
      ' .cdbc-rays,.cdbc-halo{display:none !important}',
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

  /* Confetti rain: pieces fall from the top across the full width. */
  function fxRain(n, colors, spreadMs) {
    if (reduceMotionOn()) return;
    fxInit();
    if (!fxCtx) return;
    spreadMs = spreadMs || 1400;
    var per = Math.max(1, Math.round(n / 14));
    var ticks = 0, total = Math.ceil(spreadMs / 100);
    var iv = setInterval(function () {
      ticks++;
      var w = window.innerWidth || 390;
      for (var i = 0; i < per; i++) {
        fxParts.push({
          x: Math.random() * w,
          y: -20 - Math.random() * 50,
          vx: (Math.random() - 0.5) * 1.8,
          vy: 2.2 + Math.random() * 3.4,
          life: 1, decay: 0.0035 + Math.random() * 0.004,
          size: 5 + Math.random() * 7,
          color: colors[(Math.random() * colors.length) | 0],
          confetti: true,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.25,
          grav: 0.05
        });
      }
      if (!fxRaf) fxTick();
      if (ticks >= total) clearInterval(iv);
    }, 100);
  }

  function badgeZoneCenter() {
    try {
      var el = document.querySelector('#cd-badge-sting .cdbc-badge-zone');
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

  /* Share the earn: native Web Share API, clipboard fallback. */
  function shareBadge(badgeId, d) {
    var btn = null;
    try { btn = document.getElementById('cdbcShareBtn'); } catch (e) {}
    function done(label) {
      try { if (btn) { btn.textContent = label; btn.disabled = true; } } catch (e) {}
    }
    var name = (d && d.name) || badgeId;
    var text = "I just earned the '" + name + "' badge on Cameras Decoded!";
    var origin = 'https://camerasdecoded.com';
    try {
      if (window.location && window.location.origin) origin = window.location.origin;
    } catch (e) {}
    var url = origin + '/';
    try {
      if (window.navigator && typeof window.navigator.share === 'function') {
        window.navigator.share({ title: 'Cameras Decoded', text: text, url: url })
          .then(function () { done('Shared!'); }, function () {});
        return;
      }
    } catch (e) {}
    var full = text + ' ' + url;
    try {
      if (window.navigator && window.navigator.clipboard && window.navigator.clipboard.writeText) {
        window.navigator.clipboard.writeText(full).then(
          function () { done('Copied!'); },
          function () { done('Copy failed'); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = full;
        ta.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done('Copied!'); }
        catch (e) { done('Copy failed'); }
        try { ta.remove(); } catch (e) {}
      }
    } catch (e) { done('Copy failed'); }
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
      var GOLD = '#d4af37';
      var rarity = d.rarity || 'common';
      var accent = rarity === 'legendary' ? GOLD : (rarity === 'rare' ? GREEN : '#b6ff45');
      var isGear = badgeId.indexOf('gear-') === 0 || badgeId.indexOf('glass-') === 0;
      var kicker = rarity === 'legendary' ? 'LEGENDARY EARNED' : (isGear ? 'GEAR ACQUIRED' : 'BADGE EARNED');

      var artHtml;
      if (d.art) {
        artHtml = '<img class="cdbc-badge-art" src="' + d.art + '" alt="' + escapeHtml(d.name || badgeId) + ' badge">';
      } else if (d.icon) {
        artHtml = '<div class="cdbc-badge-art cdbc-badge-fallback" style="color:' + accent + '"><i class="fa ' + escapeHtml(d.icon) + '"></i></div>';
      } else {
        artHtml = '<div class="cdbc-badge-art cdbc-badge-fallback">' + escapeHtml(d.emoji || '') + '</div>';
      }

      var wrap = document.createElement('div');
      wrap.id = 'cd-badge-sting';
      wrap.className = 'cdbc-wrap';
      wrap.setAttribute('data-rarity', rarity);
      wrap.setAttribute('role', 'dialog');
      wrap.setAttribute('aria-modal', 'true');
      wrap.setAttribute('aria-label', kicker + ': ' + (d.name || badgeId));

      wrap.innerHTML =
        '<div class="cdbc-backdrop"></div>' +
        '<div class="cdbc-card">' +
          '<div class="cdbc-kicker">' + kicker + '</div>' +
          '<div class="cdbc-badge-zone">' +
            '<div class="cdbc-rays"></div>' +
            '<div class="cdbc-halo"></div>' +
            artHtml +
          '</div>' +
          '<div class="cdbc-headline">Badge earned!</div>' +
          '<div class="cdbc-name">' + escapeHtml(d.name || badgeId) + '</div>' +
          '<div class="cdbc-desc">' + escapeHtml(d.desc || '') + '</div>' +
          '<div class="cdbc-pill cdbc-' + escapeHtml(rarity) + '">' + escapeHtml(rarity.toUpperCase()) + '</div>' +
          '<div class="cdbc-share-label">SHARE YOUR BADGE</div>' +
          '<div class="cdbc-actions">' +
            '<button type="button" id="cdbcShareBtn" class="cdbc-btn cdbc-share">Share</button>' +
            '<button type="button" id="cdbcDismissBtn" class="cdbc-btn cdbc-dismiss">Keep going</button>' +
          '</div>' +
        '</div>';

      var closed = false;
      function close() {
        if (closed) return;
        closed = true;
        try { wrap.removeAttribute('id'); } catch (e) {}
        try {
          wrap.classList.add('cdbc-out');
          setTimeout(function () { try { wrap.remove(); } catch (e) {} }, 340);
        } catch (e) {}
        try { document.removeEventListener('keydown', onKey); } catch (e) {}
        nextSting();
      }
      function onKey(ev) {
        try { if (ev && ev.key === 'Escape') close(); } catch (e) {}
      }
      wrap.addEventListener('click', function (ev) {
        try { if (ev.target === wrap || (ev.target.classList && ev.target.classList.contains('cdbc-backdrop'))) close(); } catch (e) {}
      });
      var dismissBtn = wrap.querySelector('#cdbcDismissBtn');
      if (dismissBtn) dismissBtn.addEventListener('click', close);
      var shareBtn = wrap.querySelector('#cdbcShareBtn');
      if (shareBtn) shareBtn.addEventListener('click', function () { shareBadge(badgeId, d); });
      try { document.addEventListener('keydown', onKey); } catch (e) {}
      document.body.appendChild(wrap);
      requestAnimationFrame(function () {
        try { wrap.classList.add('cdbc-in'); } catch (e) {}
      });
      playStingFeedback(rarity);

      /* Celebration: confetti rain + badge-center burst, scaled by rarity. */
      if (!rm) {
        var colors = rarity === 'legendary' ? FX_GOLDS : FX_GREENS;
        if (rarity === 'common') {
          fxRain(70, colors, 1200);
          setTimeout(function () { var c = badgeZoneCenter(); fxSpawn(c.x, c.y, 14, colors, false); }, 450);
        } else if (rarity === 'rare') {
          fxRain(120, colors, 1800);
          setTimeout(function () { var c = badgeZoneCenter(); fxSpawn(c.x, c.y, 26, colors, false); }, 500);
        } else {
          fxRain(200, colors, 2600);
          setTimeout(function () { var c = badgeZoneCenter(); fxSpawn(c.x, c.y, 50, colors, true); }, 650);
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
