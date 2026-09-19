// operator-dashboard.js — Cameras Decoded
(function () {
  'use strict';
  console.log('[Dashboard] dashboard JS loaded');
  // Keep the branded boot veil up until first render lands.
  if (window.CDLoading) window.CDLoading.hold();
  const releaseVeil = () => { if (window.CDLoading) window.CDLoading.done(); };
  const stage = (msg) => {
    const el = document.getElementById('loadingStage');
    if (el) el.textContent = msg;
    console.log('[Dashboard]', msg);
  };

  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Animated count-up for gauge numbers (mirrors the animated circular progress bar feel).
  function animateCount(el, from, to, dur = 900) {
    if (!el) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from === to) { el.textContent = to; return; }
    const start = performance.now();
    const frame = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  const vm = {
    user: { uid:'', name:'Operator', email:'', role:'Operator', tier:'free', avatar:'O' },
    stats: { streak:0, xpToday:0, xpGoal:100, rank:'—' },
    journey: { title:'', nodes:[], completed:[], next:null, completedCount:0, total:0, pct:0 },
    activity: [],
    counts: { protocols:0, snapshots:0, posts:0 },
    notifications: [],
    raw: {}
  };

  function waitForFirebase(maxWaitMs = 8000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (window.auth && window.db) return resolve(true);
        if (Date.now() - start > maxWaitMs) return resolve(false);
        setTimeout(check, 150);
      };
      check();
    });
  }

  const pick = (obj, keys, fallback) => {
    for (const k of keys) if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
    return fallback;
  };
  const toNum = (v, fb=0) => typeof v === 'number' && isFinite(v) ? v : (parseInt(v,10) || fb);

  // ---- Shared header bell: announcements are owned by header.js now.
  // The dashboard only feeds its personal notifications into the shared bell.
  function pushNotificationsToHeader() {
    const u = vm.raw || {};
    const unread = toNum(pick(u, ['unreadNotifications','unreadNotices'], 0));
    const payload = { items: vm.notifications, unread };
    if (window.Header && typeof window.Header.setNotifications === 'function') {
      window.Header.setNotifications(payload.items, payload.unread);
    } else {
      // Header loads after this script; it picks the payload up on init.
      window.__CDPendingNotifs = payload;
    }
  }

  async function hydrateUser(uid) {
    const snap = await window.db.collection('users').doc(uid).get();
    if (!snap.exists) throw new Error('User doc not found');
    const u = snap.data();

    const display = pick(u, ['displayName','name','username'], 'Operator');
    const role = pick(u, ['role','roleName','accountRole','userRole'], 'Operator');
    const rawTier = pick(u, ['tier','plan','planName','planTier','subscriptionTier','membershipTier','membershipLevel'], 'free');
    const sub = u.subscription || {};
    const tier = String(pick(sub, ['tier','plan','name'], rawTier) || 'free').toLowerCase();
    const isPro = tier.includes('pro') || tier.includes('premium') || tier.includes('paid');

    vm.user = {
      uid, name: display,
      email: pick(u, ['email'], ''),
      role,
      tier: isPro ? 'pro' : 'free',
      avatar: String(display).trim().charAt(0).toUpperCase() || 'O'
    };

    vm.stats = {
      streak: toNum(pick(u, ['dailyChallengeStreak','streakDays','streak'], 0)),
      xpToday: toNum(pick(u, ['xpToday','dailyXp'], 0)),
      xpGoal: toNum(pick(u, ['xpGoal','dailyXpGoal'], 100), 100),
      rank: pick(u, ['rank','operatorRank','level'], '—')
    };

    vm.counts = {
      protocols: (u.savedProtocols || []).length,
      snapshots: (u.savedCards || u.savedSnapshots || []).length,
      posts: (u.savedCommunityPosts || []).length
    };

    vm.activity = Array.isArray(u.recentActivity)
      ? u.recentActivity.slice(0,4).map(a => ({
          text: pick(a, ['label','text','title'], 'Activity'),
          time: pick(a, ['time','date'], ''),
          xp: a.xp || null
        }))
      : [];

    vm.notifications = Array.isArray(u.notifications) ? u.notifications.slice(0,6) : [];
    vm.raw = u;
    return vm;
  }

  async function loadJourney(uid) {
    // Mirror the Missions page data model: the user's preferred track level
    // -> journeys/{level} (modules of steps) -> userJourney/{uid}/levels/{level}
    // (completedSteps). Flattened into the vm.journey shape the hero expects.
    const level = (vm.raw && vm.raw.preferredJourneyLevel) || 'beginner';
    let journeyData = null;
    try {
      const jDoc = await window.db.collection('journeys').doc(level).get();
      if (jDoc && jDoc.exists) journeyData = jDoc.data();
    } catch (e) { journeyData = null; }
    let completedSteps = [];
    try {
      const pDoc = await window.db.collection('userJourney').doc(uid).collection('levels').doc(level).get();
      if (pDoc && pDoc.exists) {
        const p = pDoc.data() || {};
        if (Array.isArray(p.completedSteps)) completedSteps = p.completedSteps;
      }
    } catch (e) { completedSteps = []; }

    const modules = (journeyData && Array.isArray(journeyData.modules)) ? journeyData.modules : [];
    const nodes = [];
    modules.forEach((m) => {
      (m.steps || []).forEach((s) => {
        nodes.push({
          id: s.id,
          title: s.title || s.name || 'Mission',
          name: s.title || s.name || 'Mission',
          description: s.description || '',
          moduleId: m.id,
          moduleTitle: m.title || ''
        });
      });
    });
    const completedIds = nodes.filter((n) => completedSteps.includes(n.id)).map((n) => n.id);
    const next = nodes.find((n) => !completedSteps.includes(n.id)) || null;

    vm.journey = {
      title: (journeyData && (journeyData.title || journeyData.name)) || 'Missions',
      level,
      nodes, next,
      completed: completedIds,
      completedCount: completedIds.length,
      total: nodes.length,
      pct: nodes.length ? (completedIds.length / nodes.length) * 100 : 0
    };
    return vm.journey;
  }

  function renderIdentity() {
    // Greeting + tier badge are owned by the shared header (header.js) now.
    const { name, avatar, role, tier } = vm.user;
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('sidebarName', name);
    set('sidebarAvatar', avatar);
    set('sidebarPlan', tier === 'pro' ? 'Pro tier' : 'Free tier');
    const roleEl = $('sidebarRole'); if (roleEl) roleEl.textContent = role;
  }

  let ringArmed = false;
  let ringObserver = null;
  let userScrolled = false;

  function paintRing(ring, pct, target) {
    ring.style.setProperty('--p', pct);
    const rv = $('ringValue');
    if (rv) {
      const from = parseFloat(rv.dataset.v || '0');
      rv.dataset.v = target;
      animateCount(rv, from, target);
    }
  }

  function playRingReveal(ring) {
    if (!ring || ring.dataset.revealed === '1') return;
    ring.dataset.revealed = '1';
    if (ringObserver) { ringObserver.disconnect(); ringObserver = null; }
    window.removeEventListener('scroll', markScrolled);
    paintRing(ring, ring.dataset.target || '0', parseFloat(ring.dataset.vtarget || '0'));
    setGoalCrushed(ring.dataset.crushed === '1');
  }

  // Goal crushed celebration: swap the ring for the success sting, flip the
  // copy, and offer the streak-saving drill. Degrades to the full ring if the
  // video is missing or motion is reduced.
  function setGoalCrushed(on) {
    const panel = $('goalPanel');
    const note = $('goalNote');
    if (!panel || !note) return;
    if (on === panel.classList.contains('goal-crushed')) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (on) {
      panel.classList.add('goal-crushed');
      if (!reduce && !panel.querySelector('.ring-video')) {
        const v = document.createElement('video');
        v.className = 'ring-video';
        v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
        v.setAttribute('aria-hidden', 'true');
        const src = document.createElement('source');
        src.src = '/media/mission-complete-success.mp4';
        src.type = 'video/mp4';
        const killVideo = () => { v.remove(); panel.classList.add('goal-crushed-static'); };
        v.addEventListener('error', killVideo, { once: true });
        src.addEventListener('error', killVideo, { once: true });
        v.addEventListener('canplay', () => v.classList.add('on'), { once: true });
        $('xpRing').appendChild(v);
      } else {
        panel.classList.add('goal-crushed-static');
      }
      note.innerHTML = '<b>🔥 Goal crushed.</b> Take the streak into tomorrow.<br><button class="btn btn-primary btn-chase chasing-border" id="crushCta" type="button"><i class="fas fa-play" aria-hidden="true"></i> Keep the streak alive</button>';
      const cta = $('crushCta');
      if (cta) cta.addEventListener('click', () => openModal('drill'));
    } else {
      panel.classList.remove('goal-crushed', 'goal-crushed-static');
      const v = panel.querySelector('.ring-video');
      if (v) v.remove();
      note.innerHTML = '<b id="xpRemaining"></b> to finish today';
    }
  }

  function checkRingVisibility(ring) {
    const r = ring.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    if (visible >= r.height * 0.35) playRingReveal(ring);
  }

  function markScrolled() {
    userScrolled = true;
    const ring = $('xpRing');
    if (ring && ring.dataset.revealed !== '1') checkRingVisibility(ring);
  }

  // First scroll reveal: hold the gauge at 0 until the user scrolls the ring
  // into view, then play the arc + count-up exactly once. The observer's
  // initial page-load report doesn't count — only a real scroll does.
  // Later stat updates paint live.
  function armRingReveal(ring) {
    if (!ring || ring.dataset.revealed === '1' || ringArmed) return;
    ringArmed = true;
    window.addEventListener('scroll', markScrolled, { passive: true });
    if ('IntersectionObserver' in window) {
      ringObserver = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (!userScrolled) return;
        playRingReveal(ring);
      }, { threshold: 0.35 });
      ringObserver.observe(ring);
    }
    // Fallback: never leave the ring stuck at 0. If it's sitting in view and
    // the user never scrolls, reveal it once the page settles.
    setTimeout(() => {
      const el = $('xpRing');
      if (el && el.dataset.revealed !== '1') checkRingVisibility(el);
    }, 3000);
  }

  // Streak nudge: warn when the streak is at risk (streak alive, no XP today),
  // or invite a first drill when there's no streak yet. Idempotent.
  function setStreakNudge(streak, xpToday) {
    const card = $('streakCard');
    const nudge = $('streakNudge');
    if (!card || !nudge) return;
    const state = streak > 0 && xpToday <= 0 ? 'risk' : (streak === 0 && xpToday <= 0 ? 'fresh' : 'ok');
    if (card.dataset.nudge === state) return;
    card.dataset.nudge = state;
    card.classList.toggle('streak-risk', state === 'risk');
    if (state === 'ok') { nudge.hidden = true; return; }
    const text = $('streakNudgeText');
    const label = $('streakNudgeCtaLabel');
    if (state === 'risk') {
      if (text) text.innerHTML = '<b>⚠️ Streak at risk.</b> One drill saves it.';
      if (label) label.textContent = 'Save my streak';
    } else {
      if (text) text.innerHTML = '<b>No streak yet.</b> One drill starts it.';
      if (label) label.textContent = 'Start my streak';
    }
    nudge.hidden = false;
  }

  // 7-day XP sparkline on the Today's-XP stat.
  // Sources: users/{uid}.xpByDay ledger (drill/lesson XP, written alongside xpToday)
  // plus game_sessions sums for the last 7 days (game XP backfill; single-field
  // query so no composite Firestore index is needed).
  // The two sources are disjoint today (game XP never lands in the ledger), so a
  // per-day sum is correct. If play.html ever writes the ledger too, switch the
  // merge from sum to max to avoid double-counting.
  let sparkReq = 0;
  function drawSpark(el, values) {
    const w = 70, h = 24, p = 3;
    const max = Math.max(...values, 1);
    const pts = values.map((v, i) => {
      const x = p + (i * (w - 2 * p)) / (values.length - 1);
      const y = h - p - (v / max) * (h - 2 * p - 3);
      return [x.toFixed(1), y.toFixed(1)];
    });
    const line = pts.map(pt => pt.join(',')).join(' ');
    const area = `${p},${h - p} ${line} ${w - p},${h - p}`;
    const dots = pts.map((pt, i) => {
      const last = i === pts.length - 1;
      return `<circle cx="${pt[0]}" cy="${pt[1]}" r="${last ? 2 : 1.1}" fill="${last ? '#8deb00' : 'rgba(141,235,0,.4)'}"/>`;
    }).join('');
    el.innerHTML = `<polygon points="${area}" fill="rgba(141,235,0,.10)"/>`
      + `<polyline points="${line}" fill="none" stroke="#8deb00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
      + dots;
    el.setAttribute('aria-label', 'XP over the last 7 days: ' + values.join(', '));
    // Scroll-reveal draw-in: arm the dash animation unless already revealed
    // or motion is reduced.
    const pl = el.querySelector('polyline');
    if (pl && !statsRevealed && !reduceMotion()) {
      try {
        const len = pl.getTotalLength();
        pl.style.strokeDasharray = String(len);
        pl.style.strokeDashoffset = String(len);
        pl.dataset.armed = '1';
      } catch (e) { /* older SVG: show the line as-is */ }
    }
  }
  async function loadXpSparkline() {
    const uid = vm.user && vm.user.uid;
    const el = $('xpSpark');
    if (!uid || !el || !window.db) return;
    const my = ++sparkReq;
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().slice(0, 10)); }
    const perDay = {};
    days.forEach(k => { perDay[k] = 0; });
    const ledger = (vm.raw && vm.raw.xpByDay) || {};
    days.forEach(k => { if (typeof ledger[k] === 'number') perDay[k] += ledger[k]; });
    // Cache the raw sessions for the stat modals (streak calendar + XP breakdown).
    const sessions = [];
    try {
      const qs = await window.db.collection('game_sessions').where('uid', '==', uid).limit(200).get();
      qs.forEach(doc => {
        const s = doc.data() || {};
        const t = s.createdAt && s.createdAt.toDate ? s.createdAt.toDate() : null;
        if (!t || typeof s.xp !== 'number') return;
        const k = t.toISOString().slice(0, 10);
        if (k in perDay) perDay[k] += s.xp;
        sessions.push({ key: k, xp: s.xp, game: s.game || s.slotId || 'game', score: s.score, ts: t });
      });
    } catch (err) { /* offline/denied: sparkline falls back to the ledger */ }
    vm.gameSessions = sessions;
    if (my !== sparkReq) return;
    const values = days.map(k => perDay[k]);
    const sig = values.join(',');
    if (el.dataset.sig === sig) return;
    el.dataset.sig = sig;
    drawSpark(el, values);
  }

  // --- Stat-card mini graphics: streak dots, rank bars, scroll reveal ---
  // All three animate on scroll reveal (not on load), following the xpRing
  // pattern: a `revealed` class on .stats-strip drives the CSS transitions.
  let statsRevealed = false, statsScrolled = false, statsArmed = false, statsObserver = null;
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function playStatsReveal() {
    if (statsRevealed) return;
    statsRevealed = true;
    const strip = document.querySelector('.stats-strip');
    if (strip) strip.classList.add('revealed');
    if (statsObserver) { statsObserver.disconnect(); statsObserver = null; }
    window.removeEventListener('scroll', markStatsScrolled);
    // Finish the sparkline draw if it was armed pre-reveal.
    const spark = $('xpSpark');
    const pl = spark && spark.querySelector('polyline');
    if (pl && pl.dataset.armed) { pl.style.strokeDashoffset = '0'; delete pl.dataset.armed; }
  }
  function markStatsScrolled() { statsScrolled = true; }
  function armStatsReveal() {
    if (statsArmed) return;
    statsArmed = true;
    if (reduceMotion()) { playStatsReveal(); return; }
    window.addEventListener('scroll', markStatsScrolled, { passive: true });
    const strip = document.querySelector('.stats-strip');
    if (strip && 'IntersectionObserver' in window) {
      statsObserver = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (!statsScrolled) return;
        playStatsReveal();
      }, { threshold: 0.3 });
      statsObserver.observe(strip);
    }
    // Fallback: never leave the graphics stuck pre-reveal if the strip sits
    // in view and the user never scrolls.
    setTimeout(() => { if (!statsRevealed) playStatsReveal(); }, 3000);
  }

  // Streak week-dots: last 7 days from the xpByDay ledger (UTC date keys,
  // matching the existing ledger writes). A day with XP > 0 counts as active.
  function renderStreakDots() {
    const el = $('streakDots');
    if (!el) return;
    const ledger = (vm.raw && vm.raw.xpByDay) || {};
    let html = '';
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      const active = typeof ledger[k] === 'number' && ledger[k] > 0;
      const idx = 6 - i;
      html += `<span class="dot${active ? ' on' : ''}${idx === 6 ? ' today' : ''}" style="--i:${idx}"></span>`;
    }
    el.innerHTML = html;
  }

  // ISO week key, mirroring play.html / leaderboard.html.
  function lbWeekKey(d) {
    d = d || new Date();
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = (t.getUTCDay() + 6) % 7;
    t.setUTCDate(t.getUTCDate() - day + 3);
    const first = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
    const week = 1 + Math.round(((t - first) / 864e5 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
    return t.getUTCFullYear() + '-W' + ('0' + week).slice(-2);
  }

  // Rank window: 5 bars centered on the user from this week's leaderboard.
  // One small ordered query (<=50 reads). If the board ever needs to scale
  // past this, a daily rank job writing back to the user doc replaces the
  // query — the card won't know the difference.
  let rankReq = 0;
  async function loadRankWindow() {
    const uid = vm.user && vm.user.uid;
    const el = $('rankBars');
    if (!uid || !el || !window.db) return;
    const my = ++rankReq;
    const wk = lbWeekKey();
    const setRank = (v) => { const n = $('statRank'); if (n) n.textContent = v; };
    const paint = (bars) => {
      if (my !== rankReq) return;
      el.innerHTML = bars.map((b, i) =>
        `<span class="bar${b.you ? ' you' : ''}${b.ghost ? ' ghost' : ''}" style="--i:${i};${b.h ? `height:${b.h}%;` : ''}"></span>`
      ).join('');
    };
    try {
      const snap = await window.db.collection('leaderboard').orderBy('weeks.' + wk, 'desc').limit(50).get();
      const rows = [];
      snap.forEach((doc) => {
        const dd = doc.data() || {};
        const wxp = dd.weeks && typeof dd.weeks[wk] === 'number' ? dd.weeks[wk] : 0;
        if (wxp > 0) rows.push({ id: doc.id, xp: wxp, name: dd.displayName || 'Decoder' });
      });
      // Cache for the rank preview modal.
      vm.lbRows = rows;
      vm.lbWeek = wk;
      const at = rows.findIndex((r) => r.id === uid);
      vm.lbUserIdx = at;
      if (at < 0) {
        // Unranked this week: quiet ghost bars, keep the existing rank label.
        paint([{ ghost: 1 }, { ghost: 1 }, { ghost: 1 }, { ghost: 1 }, { ghost: 1 }]);
        return;
      }
      setRank('#' + (at + 1));
      const start = Math.max(0, Math.min(at - 2, rows.length - 5));
      const win = rows.slice(start, start + 5);
      const max = Math.max(...win.map((r) => r.xp), 1);
      paint(win.map((r) => ({
        you: r.id === uid,
        h: Math.max(14, Math.round((r.xp / max) * 100))
      })));
    } catch (err) {
      // Best-effort: leave the card as-is when the board is unreachable.
    }
  }

  function renderStats() {
    const { streak, xpToday, xpGoal, rank } = vm.stats;
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('statStreak', streak + (streak === 1 ? ' day' : ' days'));
    set('statXpToday', `${xpToday} / ${xpGoal}`);
    set('statRank', rank || '—');

    const pct = xpGoal > 0 ? Math.min(100, (xpToday / xpGoal) * 100) : 0;
    const ring = $('xpRing');
    const target = Math.min(xpToday, xpGoal);
    const crushed = xpGoal > 0 && xpToday >= xpGoal;
    if (ring) {
      ring.setAttribute('aria-label', crushed
        ? `Daily goal crushed: ${xpToday} of ${xpGoal} experience points`
        : `${xpToday} of ${xpGoal} daily experience points earned`);
      if (ring.dataset.revealed === '1') {
        paintRing(ring, pct, target);
        setGoalCrushed(crushed);
      } else {
        ring.dataset.target = pct;
        ring.dataset.vtarget = target;
        ring.dataset.crushed = crushed ? '1' : '';
        armRingReveal(ring);
      }
    }
    set('ringGoal', `of ${xpGoal} XP`);
    set('xpRemaining', `${Math.max(xpGoal - xpToday, 0)} XP`);
    setStreakNudge(streak, xpToday);
  }

  function renderLearning() {
    const l = vm.journey;
    const card = $('continueLearning');
    const empty = $('heroEmpty');
    if (!card) return;

    const inner = card.querySelector('.resume-copy');
    const photo = card.querySelector('.resume-photo');
    const hasNext = !!l.next && l.total > 0;

    card.classList.add('chasing-border');

    // Hero photo follows the user's current mission track, matching the
    // banner art on the Missions page. Falls back to beginner, then hides.
    const TRACK_BANNERS = {
      beginner: '/images/mission-banners/banner-beginner.jpg',
      intermediate: '/images/mission-banners/banner-intermediate.jpg',
      flash: '/images/mission-banners/banner-flash.jpg',
      advanced: '/images/mission-banners/banner-advanced.jpg'
    };
    const photoImg = card.querySelector('.resume-photo img');
    if (photoImg) {
      const src = TRACK_BANNERS[l.level] || TRACK_BANNERS.beginner;
      photoImg.onerror = () => {
        if (!photoImg.src.endsWith('banner-beginner.jpg')) photoImg.src = TRACK_BANNERS.beginner;
        else photoImg.style.display = 'none';
      };
      if (photoImg.getAttribute('src') !== src) photoImg.src = src;
      photoImg.alt = (l.title || 'Mission') + ' track artwork';
    }

    if (!hasNext) {
      if (inner) inner.hidden = true;
      if (photo) photo.hidden = true;
      if (empty) {
        empty.hidden = false;
        if (!l.total) {
          empty.innerHTML = '<i class="fas fa-compass" aria-hidden="true"></i><p>Your missions are waiting. <a href="/missions.html">Explore Missions →</a></p>';
        }
      }
      return;
    }

    if (inner) inner.hidden = false;
    if (photo) photo.hidden = false;
    if (empty) empty.hidden = true;

    const next = l.next;
    const title = next.title || next.name || 'Next lesson';
    const pct = l.total ? (l.completedCount / l.total) * 100 : 0;

    const t = $('heroLessonTitleText'); if (t) t.textContent = title;
    const ti = $('heroLessonTitleImg'); if (ti) ti.alt = title;
    const d = $('heroLessonDesc'); if (d) d.textContent = 'Your next frame is waiting.';
    const e = $('heroEstimate'); if (e) e.textContent = '~5 min left';
    const b = $('heroBadge'); if (b) b.textContent = `MISSION ${String(l.completedCount + 1).padStart(2,'0')} · IN PROGRESS`;
    const pl = $('heroProgressLabel'); if (pl) pl.textContent = `${l.completedCount} of ${l.total}`;
    const bar = $('heroProgress'); if (bar) bar.setAttribute('aria-valuenow', Math.round(pct));
    const fill = $('heroProgressFill'); if (fill) fill.style.width = pct + '%';

    const cta = $('heroCta');
    const ctaLabel = $('heroCtaLabel');
    if (cta) cta.href = '/missions.html';
    if (ctaLabel) ctaLabel.textContent = 'Continue mission';
  }

  function renderJourneyList() {
    const list = $('journeyList');
    const summary = $('journeyProgressText');
    const l = vm.journey;
    if (summary) summary.textContent = `${l.title} · ${l.completedCount} of ${l.total} missions complete`;
    if (!list) return;

    if (!l.nodes.length) {
      list.innerHTML = '<p class="empty-state">Your journey is being prepared.</p>';
      return;
    }

    const firstIncompleteIdx = l.nodes.findIndex(n => !l.completed.includes(n.id));
    const visible = [];
    if (firstIncompleteIdx > 0) visible.push({ ...l.nodes[firstIncompleteIdx - 1], _state:'done', _idx: firstIncompleteIdx - 1 });
    if (firstIncompleteIdx >= 0) visible.push({ ...l.nodes[firstIncompleteIdx], _state:'current', _idx: firstIncompleteIdx });
    for (let i = firstIncompleteIdx + 1; i < l.nodes.length && visible.length < 3; i++) {
      visible.push({ ...l.nodes[i], _state:'upcoming', _idx: i });
    }
    if (!visible.length) {
      list.innerHTML = '<p class="empty-state">You finished this journey. 🎉</p>';
      return;
    }

    list.innerHTML = visible.map((n) => {
      const num = String((typeof n._idx === 'number' ? n._idx : l.nodes.indexOf(n)) + 1).padStart(2,'0');
      const nodeClass = n._state === 'done' ? 'done' : (n._state === 'current' ? 'current' : '');
      const nodeIcon = n._state === 'done' ? '<i class="fas fa-check"></i>' : num;
      const status = n._state === 'done' ? 'Complete' : n._state === 'current' ? 'In progress' : 'Up next';
      const subtitle = n.description || n.summary || '';
      return `<article class="journey-item ${nodeClass}">
        <div class="lesson-node" aria-hidden="true">${nodeIcon}</div>
        <div class="journey-title"><strong>${n.title || n.name || 'Lesson'}</strong>${subtitle ? `<span>${subtitle}</span>` : ''}</div>
        <div class="lesson-status">${status}</div>
      </article>`;
    }).join('');
  }

  // Challenge mark-complete flow: the button opens a modal instead of routing
  // to the waitlist page. Marking complete writes the date log, the streak
  // (with day-rollover), and XP together so the dots and streak can't disagree.
  function openChallengeModal() {
    const u = vm.raw || {};
    const log = u.challengeLog || u.dailyChallengeLog || [];
    const todayKey = new Date().toISOString().slice(0, 10);
    if (Array.isArray(log) && log.includes(todayKey)) return;
    const name = $('challengeModalName');
    const desc = $('challengeModalDesc');
    if (name) name.textContent = $('challengeTitle')?.textContent || 'Daily challenge';
    if (desc) desc.textContent = $('challengeDesc')?.textContent || '';
    openModal('challenge');
  }

  function renderActivity() {
    const box = $('activityList');
    if (!box) return;
    if (!vm.activity.length) {
      box.innerHTML = '<p class="empty-state">Nothing on the wire yet. <a href="/arcade.html" style="color:var(--green);font-weight:700">Run a drill</a> to get on the board.</p>';
      return;
    }
    const expanded = box.dataset.expanded === '1';
    const items = expanded ? vm.activity : vm.activity.slice(0, 3);
    box.innerHTML = items.map(a => `
      <div class="activity-row">
        <div class="activity-dot"><i class="fas fa-check"></i></div>
        <div><strong>${a.text}</strong><span>${a.time || ''}</span></div>
        ${a.xp ? `<div class="xp">+${a.xp} XP</div>` : '<div></div>'}
      </div>
    `).join('') + (vm.activity.length > 3
      ? `<button class="text-btn" id="activityToggle" type="button" aria-expanded="${expanded}">${expanded ? 'Show less' : `Show all activity (${vm.activity.length})`}</button>`
      : '');
    $('activityToggle')?.addEventListener('click', () => {
      box.dataset.expanded = expanded ? '0' : '1';
      renderActivity();
    });
  }

  function renderCollections() {
    const c = vm.counts;
    const ids = ['protocolCount','snapshotCount','postCount'];
    const vals = [c.protocols, c.snapshots, c.posts];
    ids.forEach((id, i) => { const el = $(id); if (el) el.textContent = vals[i]; });
  }

  function renderAI() {
    const u = vm.raw;
    const isPro = vm.user.tier === 'pro';
    const usage = u.aiUsage || {};
    const total = toNum(pick(usage, ['total','today'], toNum(u.aiUsageToday, 0)));
    const limit = toNum(u.aiDailyLimit, isPro ? 50 : 5);
    const pct = limit > 0 ? Math.min(100, (total / limit) * 100) : 0;
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('aiBadge', isPro ? 'Pro' : 'Free');
    set('aiUsed', total);
    set('aiLimit', isPro ? '∞' : limit);
    set('aiPercent', isPro ? '∞' : Math.round(pct) + '%');
    const bar = $('aiProgress'); if (bar) bar.setAttribute('aria-valuenow', Math.round(pct));
    const fill = $('aiFill'); if (fill) fill.style.width = pct + '%';
  }

  // Shared pool: /scripts/challenges-data.js (window.CD_CHALLENGES). Fallback below only if it fails to load.
  const CHALLENGES = window.CD_CHALLENGES || [
    { title:'Golden Hour Portrait', desc:'Capture a portrait during golden hour. Focus on warm tones and backlighting.' },
    { title:'Street Scene', desc:'Capture a candid street moment with strong composition.' },
    { title:'Minimalist Still Life', desc:'Arrange 3 objects and create a simple, clean composition.' },
    { title:'Macro Details', desc:'Find a small subject and capture it in extreme detail.' },
    { title:'Reflection Hunt', desc:'Find a reflection (water, glass, mirror) and use it as the main subject.' }
  ];

  function renderChallenge() {
    const u = vm.raw;
    const log = u.challengeLog || u.dailyChallengeLog || [];
    const todayKey = new Date().toISOString().slice(0,10);
    const done = Array.isArray(log) && log.includes(todayKey);
    const dayIdx = Math.floor(Date.now() / 86400000) % CHALLENGES.length;
    const c = u.dailyChallenge || CHALLENGES[dayIdx];
    const title = c.title || 'Daily challenge';
    const desc = c.description || c.prompt || CHALLENGES[dayIdx].desc;

    const t = $('challengeTitle'); if (t) t.textContent = title;
    const d = $('challengeDesc'); if (d) d.textContent = desc;
    const btn = $('challengeBtn');
    if (btn) {
      if (done) { btn.textContent = 'Completed today'; btn.setAttribute('aria-disabled','true'); btn.style.opacity='0.5'; btn.style.pointerEvents='none'; }
      else { btn.textContent = 'Start challenge'; btn.removeAttribute('aria-disabled'); btn.style.opacity=''; btn.style.pointerEvents=''; }
    }

    const logDays = $('logDays');
    if (logDays) {
      const dayNames = ['S','M','T','W','T','F','S'];
      let html = '';
      for (let i = 6; i >= 0; i--) {
        const dt = new Date(); dt.setDate(dt.getDate() - i);
        const key = dt.toISOString().slice(0,10);
        const ok = Array.isArray(log) && log.includes(key);
        html += `<span class="log-day${ok ? ' complete' : ''}">${dayNames[dt.getDay()]}</span>`;
      }
      logDays.innerHTML = html;
    }
    const ls = $('logStreak');
    if (ls) {
      ls.textContent = vm.stats.streak;
      const unit = $('logStreakUnit');
      if (unit) unit.textContent = vm.stats.streak === 1 ? 'day' : 'days';
    }
  }

  function renderProtocols() {
    const grid = $('protocolGrid');
    if (!grid) return;
    const saved = vm.raw.savedProtocols || [];
    if (!saved.length) { grid.innerHTML = '<p class="empty-state">No saved protocols yet.</p>'; return; }
    grid.innerHTML = saved.slice(0,4).map(p => {
      const title = typeof p === 'string' ? p : (p.title || p.name || 'Protocol');
      const desc = typeof p === 'string' ? '' : (p.description || '');
      return `<article class="protocol-card"><h3>${title}</h3>${desc ? `<p>${desc}</p>` : ''}</article>`;
    }).join('');
  }

  function renderReferral() {
    const u = vm.raw;
    const code = u.referralCode || '—';
    const el = $('referralLink'); if (el) el.textContent = `camerasdecoded.com/ref/${code}`;
    const set = (id, v) => { const n = $(id); if (n) n.textContent = v; };
    set('totalReferrals', toNum(pick(u, ['totalReferrals','referralCount'], 0)));
    const comm = toNum(pick(u, ['totalCommission','commissionTotal','totalCommissionEarned'], 0));
    set('totalCommission', '$' + comm.toFixed(2));
    const tierMap = { signal:'Signal Creator', operator:'Operator Creator', transmission_elite:'Transmission Elite' };
    set('ambassadorTier', tierMap[u.ambassadorTier] || u.ambassadorTier || 'Signal Creator');
  }

  function renderQuiz() {
    const u = vm.raw;
    const set = (id, v) => { const n = $(id); if (n) n.textContent = v; };
    set('quizStreak', u.quizStreak || 0);
    const last = u.lastQuizScore || u.quizLastScore;
    if (last && last.score != null && last.total != null) set('lastScoreDisplay', `${last.score}/${last.total}`);
    else set('lastScoreDisplay', '—');
  }

  function renderAll() {
    renderIdentity();
    renderStats();
    armStatsReveal();
    renderStreakDots();
    loadXpSparkline();
    loadRankWindow();
    initStatModals();
    renderLearning();
    renderJourneyList();
    renderActivity();
    renderCollections();
    renderAI();
    renderChallenge();
    renderProtocols();
    renderReferral();
    renderQuiz();
    pushNotificationsToHeader();
  }

  const toast = $('toast');
  let toastTimer;
  function showToast(msg, kind) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.toggle('error', kind === 'error');
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }
  function announce(msg) { const el = $('dashboardAnnouncements'); if (el) el.textContent = msg; }

  // Entrance choreography: panels rise in a staggered visual sequence once
  // the dashboard content is revealed. Uses the house ease; skipped entirely
  // under prefers-reduced-motion.
  const ENTRANCE_ORDER = ['.hero-block','.goal-panel','.stats-strip','.drill-card','.journey-block','.activity-panel','.challenge-grid','.more-toggle','.workspace-heading','.collections-strip','.ai-section','.protocol-section','.referral-card','.quiz-card','.ambassador-card','.dashboard-footer'];
  function prepEntrance() {
    ENTRANCE_ORDER.forEach(sel => { const el = $(sel); if (el) el.classList.add('rise'); });
  }
  function playEntrance() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ENTRANCE_ORDER
      .map(sel => $(sel))
      .filter(el => el && el.offsetParent !== null)
      .forEach((el, i) => {
        if (reduce || i === 0) { el.classList.add('in'); return; }
        setTimeout(() => el.classList.add('in'), i * 55);
      });
  }

  let lastFocus = null;
  function openModal(id) {
    const modal = document.getElementById(id + 'Modal');
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => modal.querySelector('.close-btn')?.focus(), 20);
  }
  function closeModal(modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    lastFocus?.focus();
  }
  function logout() {
    window.auth.signOut().then(() => { window.location.href = '/login.html'; })
      .catch(() => { window.location.href = '/login.html'; });
  }

  function bindUI() {
    prepEntrance();
    $$('[data-open]').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.open)));
    $('streakNudgeCta')?.addEventListener('click', () => openModal('drill'));
    $('moreToggle')?.addEventListener('click', () => {
      const grid = document.querySelector('.dashboard-grid');
      if (!grid) return;
      const open = grid.classList.toggle('more-open');
      $('moreToggle')?.setAttribute('aria-expanded', String(open));
      const label = $('moreToggleLabel');
      if (label) label.textContent = open ? 'Show less' : 'Show more';
      if (open) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        ['.protocol-section', '.referral-card', '.quiz-card', '.ambassador-card'].forEach((sel, i) => {
          const el = $(sel);
          if (!el) return;
          if (reduce) { el.classList.add('in'); return; }
          setTimeout(() => el.classList.add('in'), 60 + i * 70);
        });
      }
    });
    // Today's Challenge is its own page now — the button routes there; XP is earned on the page.
    $('challengeBtn')?.addEventListener('click', () => { window.location.href = '/challenge.html'; });
    $('challengeCompleteBtn')?.addEventListener('click', async () => {
      const uid = vm.user.uid;
      if (!uid) return;
      const u = vm.raw || {};
      const log = u.challengeLog || u.dailyChallengeLog || [];
      const todayKey = new Date().toISOString().slice(0, 10);
      if (Array.isArray(log) && log.includes(todayKey)) { closeModal($('challengeModal')); return; }
      const yd = new Date(); yd.setDate(yd.getDate() - 1);
      const yKey = yd.toISOString().slice(0, 10);
      const prevStreak = toNum(pick(u, ['dailyChallengeStreak', 'streakDays', 'streak'], 0));
      const newStreak = (Array.isArray(log) && log.includes(yKey)) ? prevStreak + 1 : 1;
      const btn = $('challengeCompleteBtn');
      if (btn) btn.disabled = true;
      try {
        await window.db.collection('users').doc(uid).update({
          challengeLog: firebase.firestore.FieldValue.arrayUnion(todayKey),
          dailyChallengeStreak: newStreak,
          xpToday: firebase.firestore.FieldValue.increment(10),
          totalPoints: firebase.firestore.FieldValue.increment(10),
          ['xpByDay.' + todayKey]: firebase.firestore.FieldValue.increment(10),
          recentActivity: firebase.firestore.FieldValue.arrayUnion({ label: 'Daily challenge complete', time: 'Just now', xp: 10 })
        });
        showToast('Challenge complete · +10 XP');
        announce('Daily challenge complete. Plus 10 XP.');
        closeModal($('challengeModal'));
      } catch (err) {
        console.warn('[Dashboard] Challenge write failed:', err);
        showToast('Could not save. Check your connection.', 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
    $$('[data-close]').forEach(btn => btn.addEventListener('click', () => {
      const scrim = btn.closest('.scrim'); if (scrim) closeModal(scrim);
    }));
    $$('.scrim').forEach(s => s.addEventListener('click', e => { if (e.target === s) closeModal(s); }));


    $('moreLogout')?.addEventListener('click', logout);

    $$('[data-quiz]').forEach(group => {
      const feedback = group.parentElement.querySelector('.feedback');
      const finish = group.dataset.quiz === 'lesson' ? $('lessonFinish') : $('drillFinish');
      $$('.choice', group).forEach(ch => ch.addEventListener('click', () => {
        $$('.choice', group).forEach(c => { c.disabled = true; c.classList.remove('correct','wrong'); });
        const correct = ch.hasAttribute('data-correct');
        ch.classList.add(correct ? 'correct' : 'wrong');
        group.querySelector('[data-correct]')?.classList.add('correct');
        if (feedback) {
          feedback.textContent = group.dataset.quiz === 'drill'
            ? (correct ? 'Correct. A slower shutter leaves the sensor exposed longer, so movement records as blur.' : 'Not quite. Aperture and ISO change exposure, but shutter speed controls how motion is rendered.')
            : (correct ? 'Correct. Positive compensation lifts the room while keeping your camera settings deliberate.' : 'Not quite. A faster shutter or negative compensation would make the room darker.');
          feedback.classList.add('show');
        }
        if (finish) finish.disabled = false;
      }));
    });

    $('drillFinish')?.addEventListener('click', async () => {
      const uid = vm.user.uid;
      if (!uid) return;
      try {
        await window.db.collection('users').doc(uid).update({
          xpToday: firebase.firestore.FieldValue.increment(10),
          totalPoints: firebase.firestore.FieldValue.increment(10),
          ['xpByDay.' + new Date().toISOString().slice(0, 10)]: firebase.firestore.FieldValue.increment(10),
          recentActivity: firebase.firestore.FieldValue.arrayUnion({
            label: 'Quick drill complete', time: 'Just now', xp: 10
          })
        });
        showToast('+10 XP · Quick drill complete');
        announce('Quick drill complete. Plus 10 XP.');
        closeModal($('drillModal'));
      } catch (err) {
        console.warn('[Dashboard] Drill write failed:', err);
        showToast('Could not save drill. Check your connection.');
      }
    });

    $('lessonFinish')?.addEventListener('click', async () => {
      const uid = vm.user.uid;
      const nextId = vm.journey.next && vm.journey.next.id;
      if (uid && nextId) {
        try {
          await window.db.collection('userJourney').doc(uid).set({
            completedNodes: firebase.firestore.FieldValue.arrayUnion(nextId)
          }, { merge: true });
          await window.db.collection('users').doc(uid).update({
            xpToday: firebase.firestore.FieldValue.increment(20),
            totalPoints: firebase.firestore.FieldValue.increment(20),
            ['xpByDay.' + new Date().toISOString().slice(0, 10)]: firebase.firestore.FieldValue.increment(20)
          });
          showToast('Lesson marked complete · +20 XP');
        } catch (err) {
          console.warn('[Dashboard] Lesson write failed:', err);
          showToast('Could not save lesson progress.');
        }
      }
      closeModal($('lessonModal'));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const open = document.querySelector('.scrim.open');
        if (open) closeModal(open);
      }
      const open = document.querySelector('.scrim.open');
      if (e.key === 'Tab' && open) {
        const focusable = open.querySelectorAll('button:not([disabled]), a[href]');
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    $('copyReferralBtn')?.addEventListener('click', () => {
      const text = ($('referralLink')?.textContent || '').trim();
      const url = 'https://' + text;
      const done = () => { showToast('Referral link copied'); announce('Referral link copied'); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(() => {
        const inp = document.createElement('input'); inp.value = url;
        document.body.appendChild(inp); inp.select(); document.execCommand('copy'); document.body.removeChild(inp); done();
      });
    });

    const diff = $('diffSelect'), launch = $('quizLaunchBtn');
    if (diff && launch) {
      const update = () => { launch.href = `/quiz-full.html?difficulty=${diff.value}`; };
      diff.addEventListener('change', update);
      update();
    }

    $('sidebarLogout')?.addEventListener('click', logout);
  }

  let unsub = null;
  function subscribeToUser(uid) {
    if (unsub) unsub();
    unsub = window.db.collection('users').doc(uid).onSnapshot(async (snap) => {
      if (!snap.exists) return;
      try {
        await hydrateUser(uid);
        await loadJourney(uid);
        renderAll();
        if (window.BottomNav?.updateBadges) window.BottomNav.updateBadges(window.USER || vm.user);
      } catch (e) { console.warn('[Dashboard] snapshot render error', e); }
    }, (err) => console.warn('[Dashboard] listener error', err));
  }

  // ---- Profile completion nudge (operators): bell prompt until profile completed ----
  // Fires once per user: skipped when users/{uid}.profile.completed is true,
  // and skipped when a 'profile' inbox item already exists.
  async function maybePromptProfileCompletion(uid) {
    try {
      const prof = (vm.raw && vm.raw.profile) || {};
      if (prof.completed) return;
      const db = window.db;
      if (!db || !db.collection) return;
      const existing = await db.collection('notifications').doc(uid).collection('items')
        .where('kind', '==', 'profile').limit(1).get();
      if (!existing.empty) return;
      for (let i = 0; i < 10 && !window.CDNotifs; i++) {
        await new Promise(r => setTimeout(r, 500));
      }
      if (!window.CDNotifs || typeof window.CDNotifs.notify !== 'function') return;
      await window.CDNotifs.notify({
        title: 'Complete your profile',
        body: 'Pick your camera brand, lenses, and interests — 30 seconds, and it tunes your experience.',
        href: '/profile.html',
        kind: 'profile'
      });
    } catch (e) { /* nudge must never break the dashboard */ }
  }

  async function boot() {
    stage('boot started');
    const ok = await waitForFirebase();
    if (!ok) { showLoadError('Firebase did not load.'); releaseVeil(); return; }
    stage('Firebase globals found');

    window.addEventListener('userStateReady', () => {}, { once: true });

    window.auth.onAuthStateChanged(async (user) => {
      stage('auth callback fired');
      if (!user) {
        const l = $('loadingState');
        if (l) l.innerHTML = '<p>Please <a href="/login.html" style="color:var(--green)">log in</a>.</p>';
        releaseVeil();
        return;
      }
      try {
        await hydrateUser(user.uid);
        maybePromptProfileCompletion(user.uid); // fire-and-forget bell nudge
        await loadJourney(user.uid);
        renderAll();
        subscribeToUser(user.uid);
        const l = $('loadingState'); if (l) l.hidden = true;
        const c = $('dashboardContent'); if (c) c.hidden = false;
        playEntrance();
        releaseVeil();
        console.log('[Dashboard] ✅ Ready.');
      } catch (err) {
        console.error('[Dashboard] boot error', err);
        showLoadError(err.message || 'Unknown error');
        releaseVeil();
      }
    });
  }

  function showLoadError(msg) {
    const el = $('loadingState');
    if (!el) return;
    el.innerHTML = `<p style="color:var(--danger)">${msg}</p><button class="btn btn-secondary" onclick="location.reload()" style="margin-top:12px">Retry</button>`;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindUI);
  else bindUI();
  boot();

  (function pullToRefresh() {
    const isTouch  = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isNarrow = window.matchMedia('(max-width:820px)').matches;

    if (!isTouch || !isNarrow) {
      console.log('[PTR] disabled:', { isTouch, isNarrow, ua: navigator.userAgent });
      return;
    }
    console.log('[PTR] active');

    const wrap = document.createElement('div');
    wrap.className = 'ptr-wrap';
    wrap.innerHTML = '<div class="ptr-sphere"></div><div class="ptr-label">Refreshing</div>';
    document.body.appendChild(wrap);

    const sphere = wrap.querySelector('.ptr-sphere');

    const BASE_Y    = -120;
    const THRESHOLD = 100;
    const MAX_PULL  = 130;

    let startY     = 0;
    let pull       = 0;
    let dragging   = false;
    let refreshing = false;

    const setPos    = (y)         => { wrap.style.transform = `translate(-50%, ${y}px)`; };
    const setSphere = (deg, scale) => { sphere.style.transform = `rotate(${deg}deg) scale(${scale})`; };

    const getScrollY = () =>
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    window.addEventListener('touchstart', (e) => {
      if (refreshing) return;
      if (e.touches.length !== 1) return;
      if (getScrollY() > 0) return;
      startY = e.touches[0].clientY;
      dragging = true;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!dragging || refreshing) return;
      if (getScrollY() > 0) { dragging = false; return; }

      const delta = e.touches[0].clientY - startY;
      if (delta <= 0) { pull = 0; return; }

      pull = Math.min(delta * 0.55, MAX_PULL);

      wrap.classList.add('visible');
      setPos(BASE_Y + pull);

      const t = Math.min(pull / MAX_PULL, 1);
      setSphere(pull * 2.4, 0.85 + t * 0.15);
      wrap.classList.toggle('ready', pull >= THRESHOLD);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (!dragging || refreshing) return;
      dragging = false;

      if (pull >= THRESHOLD) {
        refreshing = true;
        wrap.classList.add('refreshing');
        setPos(24);
        if (navigator.vibrate) navigator.vibrate(12);
        setTimeout(() => window.location.reload(), 650);
      } else {
        wrap.classList.remove('visible', 'ready');
        setPos(BASE_Y);
        setSphere(0, 1);
      }
      pull = 0;
    }, { passive: true });

    window.addEventListener('touchcancel', () => {
      dragging = false;
      pull = 0;
      wrap.classList.remove('visible', 'ready');
      setPos(BASE_Y);
      setSphere(0, 1);
    }, { passive: true });
  })();

  // ================================================================
  // STAT-CARD MODALS — tap a stat for the full picture
  // Streak -> full activity calendar. XP -> itemized day breakdown.
  // Rank -> live leaderboard preview. All reuse the cached queries
  // from the stat graphics (no extra reads on open beyond a refresh).
  // ================================================================
  let statModalsWired = false;

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function utcKey(d) { return d.toISOString().slice(0, 10); }
  function todayKey() { return utcKey(new Date()); }

  function prettyGameName(g) {
    const s = String(g || '').trim();
    if (!s || s === 'game') return 'Practice game';
    return s.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Active-day lookup: xpByDay ledger (full history, zero reads) merged
  // with cached game sessions (covers days whose XP never hit the ledger).
  function buildActiveDays() {
    const active = new Set();
    const ledger = (vm.raw && vm.raw.xpByDay) || {};
    Object.keys(ledger).forEach((k) => { if (typeof ledger[k] === 'number' && ledger[k] > 0) active.add(k); });
    (vm.gameSessions || []).forEach((s) => { if (s.xp > 0) active.add(s.key); });
    return active;
  }

  function initStatModals() {
    if (statModalsWired) return;
    statModalsWired = true;
    $$('.stat[data-stat-modal]').forEach((card) => {
      const kind = card.dataset.statModal;
      const open = () => {
        if (kind === 'streak') openStreakCal();
        else if (kind === 'xp') openXpDetail();
        else if (kind === 'rank') openRankPreview();
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
    $('calPrev')?.addEventListener('click', () => shiftCalMonth(-1));
    $('calNext')?.addEventListener('click', () => shiftCalMonth(1));
    $('streakCalCta')?.addEventListener('click', () => { closeModal($('streakCalModal')); openModal('drill'); });
    $('xpDetailCta')?.addEventListener('click', () => { closeModal($('xpDetailModal')); openModal('drill'); });
  }

  async function refreshStatData() {
    try { await Promise.all([loadXpSparkline(), loadRankWindow()]); } catch (e) {}
  }

  // ---------- Streak calendar ----------
  let calCursor = null; // {y, m} — month being viewed
  function calBounds() {
    const now = new Date();
    return {
      minY: now.getFullYear(), minM: now.getMonth() - 11,
      maxY: now.getFullYear(), maxM: now.getMonth()
    };
  }
  function normalizeCalCursor() {
    const now = new Date();
    let y = calCursor ? calCursor.y : now.getFullYear();
    let m = calCursor ? calCursor.m : now.getMonth();
    while (m < 0) { m += 12; y--; }
    while (m > 11) { m -= 12; y++; }
    const b = calBounds();
    const cur = y * 12 + m, lo = b.minY * 12 + b.minM, hi = b.maxY * 12 + b.maxM;
    const clamped = Math.max(lo, Math.min(hi, cur));
    calCursor = { y: Math.floor(clamped / 12), m: ((clamped % 12) + 12) % 12 };
  }
  function shiftCalMonth(dir) {
    normalizeCalCursor();
    calCursor.m += dir;
    normalizeCalCursor();
    renderCal();
  }

  async function openStreakCal() {
    calCursor = null;
    await refreshStatData();
    renderCal();
    openModal('streakCal');
  }

  function renderCal() {
    normalizeCalCursor();
    const grid = $('calGrid');
    if (!grid) return;
    const { y, m } = calCursor;
    const active = buildActiveDays();
    const tKey = todayKey();
    const monthName = new Date(y, m, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    $('calMonthLabel').textContent = monthName;

    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    let html = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
      .map((d) => `<div class="cal-dow" aria-hidden="true">${d}</div>`).join('');
    for (let i = 0; i < firstDow; i++) html += '<div class="cal-day dim" aria-hidden="true"></div>';
    let monthActive = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const isActive = active.has(key);
      const isToday = key === tKey;
      if (isActive) monthActive++;
      html += `<div class="cal-day${isActive ? ' on' : ''}${isToday ? ' today' : ''}" role="gridcell" aria-label="${monthName} ${d}${isActive ? ', active' : ', rest day'}${isToday ? ', today' : ''}">`
        + `<span class="dnum">${d}</span><span class="cdot"></span></div>`;
    }
    grid.innerHTML = html;

    // Nav bounds: up to 11 months back, never into the future.
    const b = calBounds();
    const cur = y * 12 + m;
    $('calPrev').disabled = cur <= b.minY * 12 + b.minM;
    $('calNext').disabled = cur >= b.maxY * 12 + b.maxM;

    const streak = (vm.stats && vm.stats.streak) || 0;
    $('streakCalSummary').innerHTML = `<b style="color:var(--green-2)">${monthActive}</b> active day${monthActive === 1 ? '' : 's'} in ${escHtml(monthName)} · <b style="color:var(--green-2)">${streak}</b>-day streak`;
    // One loud CTA, only when today is still unmarked.
    $('streakCalCta').hidden = active.has(tKey);
  }

  // ---------- XP breakdown ----------
  async function openXpDetail() {
    await refreshStatData();
    renderXpDetail();
    openModal('xpDetail');
  }

  function renderXpDetail() {
    const rowsBox = $('xpDetailRows');
    if (!rowsBox) return;
    const tKey = todayKey();
    const xpToday = (vm.stats && vm.stats.xpToday) || 0;
    const xpGoal = (vm.stats && vm.stats.xpGoal) || 100;
    $('xpDetailTotal').textContent = xpToday;
    $('xpDetailGoal').textContent = `${xpToday} of ${xpGoal}`;

    const sessions = (vm.gameSessions || [])
      .filter((s) => s.key === tKey && s.xp > 0)
      .sort((a, b) => b.ts - a.ts);
    const gameXp = sessions.reduce((sum, s) => sum + s.xp, 0);
    const rest = Math.max(0, xpToday - gameXp);

    if (xpToday <= 0) {
      // On-brand empty state: the signal is quiet, not broken.
      rowsBox.innerHTML = `
        <div class="xp-empty">
          <div class="xp-empty-ic"><i class="fas fa-satellite-dish" aria-hidden="true"></i></div>
          <p><strong>No signal decoded yet today.</strong></p>
          <p>Your first points of the day are one drill away.</p>
        </div>`;
      $('xpDetailCta').hidden = false;
      return;
    }
    $('xpDetailCta').hidden = true;

    let html = '';
    sessions.forEach((s) => {
      const when = s.ts ? s.ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
      const scoreBit = (typeof s.score === 'number') ? ` · score ${s.score}` : '';
      html += `
        <div class="xp-row">
          <div class="xp-ic"><i class="fas fa-gamepad" aria-hidden="true"></i></div>
          <div class="xp-main">
            <div class="xp-name">${escHtml(prettyGameName(s.game))}</div>
            <div class="xp-sub">${escHtml(when)}${escHtml(scoreBit)}</div>
          </div>
          <div class="xp-pts">+${s.xp} XP</div>
        </div>`;
    });
    if (rest > 0) {
      // Drills/lessons/challenges write totals, not itemized events —
      // grouped honestly rather than faked per-item.
      html += `
        <div class="xp-row">
          <div class="xp-ic"><i class="fas fa-list-check" aria-hidden="true"></i></div>
          <div class="xp-main">
            <div class="xp-name">Drills · lessons · challenges</div>
            <div class="xp-sub">Practice XP banked today</div>
          </div>
          <div class="xp-pts">+${rest} XP</div>
        </div>`;
    }
    rowsBox.innerHTML = html;
  }

  // ---------- Rank preview ----------
  async function openRankPreview() {
    await refreshStatData();
    renderRankPreview();
    openModal('rankPreview');
  }

  function lbRowHtml(r, rankNum, you) {
    return `
      <div class="lb-row${you ? ' you' : ''}${rankNum === 1 ? ' top1' : ''}">
        <div class="lb-rank">${rankNum}</div>
        <div class="lb-name">${escHtml(r.name)}${you ? ' · you' : ''}</div>
        <div class="lb-xp">${r.xp} XP</div>
      </div>`;
  }

  function renderRankPreview() {
    const box = $('rankPreviewRows');
    if (!box) return;
    const rows = vm.lbRows || [];
    const at = (typeof vm.lbUserIdx === 'number') ? vm.lbUserIdx : -1;
    const uid = vm.user && vm.user.uid;
    $('rankPreviewSub').textContent = rows.length
      ? `${rows.length} decoder${rows.length === 1 ? '' : 's'} on the board this week`
      : 'Top decoders, live.';

    if (!rows.length) {
      box.innerHTML = `<div class="lb-note">The board is quiet this week.<br>Be the first signal on it — <a href="/arcade.html" style="color:var(--green);font-weight:700">run a drill</a>.</div>`;
      return;
    }

    let html = '';
    const top = rows.slice(0, 5);
    top.forEach((r, i) => { html += lbRowHtml(r, i + 1, r.id === uid); });

    if (at >= 5) {
      // You're ranked but outside the top 5: show your neighborhood.
      html += '<div class="lb-ellipsis" aria-hidden="true">···</div>';
      const lo = Math.max(0, at - 1), hi = Math.min(rows.length - 1, at + 1);
      for (let i = lo; i <= hi; i++) html += lbRowHtml(rows[i], i + 1, rows[i].id === uid);
    } else if (at < 0) {
      html += `<div class="lb-note">You're unranked this week — every game you play puts XP on this board.</div>`;
    }
    box.innerHTML = html;
  }

  console.log('[Dashboard] Script loaded.');
})();