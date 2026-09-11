// operator-dashboard.js — full Firebase wiring for the redesigned dashboard
(function () {
  'use strict';
  console.log('[Dashboard] dashboard JS loaded');
  const stage = (msg) => { const el = document.getElementById('loadingStage'); if (el) el.textContent = msg; console.log('[Dashboard]', msg); };

  // ---- DOM helpers ----
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---- View model (fills from Firestore) ----
  const vm = {
    user: { uid:'', name:'Operator', email:'', role:'Operator', tier:'free', avatar:'O' },
    stats: { streak:0, xpToday:0, xpGoal:100, rank:'—' },
    journey: { title:'', nodes:[], completed:[], next:null, completedCount:0, total:0, pct:0 },
    activity: [],
    counts: { protocols:0, snapshots:0, posts:0 },
    notifications: [],
    raw: {}
  };

  // ============================================================
  // WAIT FOR FIREBASE
  // ============================================================
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

  // ============================================================
  // SAFE FIELD READERS (tolerate the live schema's many aliases)
  // ============================================================
  const pick = (obj, keys, fallback) => {
    for (const k of keys) if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
    return fallback;
  };
  const toNum = (v, fb=0) => typeof v === 'number' && isFinite(v) ? v : (parseInt(v,10) || fb);

  // ============================================================
  // HYDRATE USER
  // ============================================================
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
      uid,
      name: display,
      email: pick(u, ['email'], ''),
      role,
      tier: isPro ? 'pro' : 'free',
      avatar: String(display).trim().charAt(0).toUpperCase() || 'O'
    };

    // Stats
    vm.stats = {
      streak: toNum(pick(u, ['dailyChallengeStreak','streakDays','streak'], 0)),
      xpToday: toNum(pick(u, ['xpToday','dailyXp'], 0)),
      xpGoal: toNum(pick(u, ['xpGoal','dailyXpGoal'], 100), 100),
      rank: pick(u, ['rank','operatorRank','level'], '—')
    };

    // Counts
    vm.counts = {
      protocols: (u.savedProtocols || []).length,
      snapshots: (u.savedCards || u.savedSnapshots || []).length,
      posts: (u.savedCommunityPosts || []).length
    };

    // Recent activity
    vm.activity = Array.isArray(u.recentActivity)
      ? u.recentActivity.slice(0,4).map(a => ({
          text: pick(a, ['label','text','title'], 'Activity'),
          time: pick(a, ['time','date'], ''),
          xp: a.xp || null
        }))
      : [];

    // Notifications
    vm.notifications = Array.isArray(u.notifications)
      ? u.notifications.slice(0,6)
      : [];

    vm.raw = u;
    return vm;
  }

  // ============================================================
  // LOAD JOURNEY
  // ============================================================
  async function loadJourney(uid) {
    const [jDoc, uDoc] = await Promise.all([
      window.db.collection('journeys').doc('beginner').get().catch(() => null),
      window.db.collection('userJourney').doc(uid).get().catch(() => null)
    ]);
    const journey = jDoc && jDoc.exists ? jDoc.data() : { title:'Beginner', nodes:[] };
    const userJourney = uDoc && uDoc.exists ? uDoc.data() : { completedNodes: [] };
    const completed = Array.isArray(userJourney.completedNodes) ? userJourney.completedNodes : [];
    const nodes = Array.isArray(journey.nodes) ? journey.nodes : [];
    const next = nodes.find(n => !completed.includes(n.id)) || null;

    vm.journey = {
      title: journey.title || 'Beginner',
      nodes,
      completed,
      next,
      completedCount: completed.length,
      total: nodes.length,
      pct: nodes.length ? (completed.length / nodes.length) * 100 : 0
    };
    return vm.journey;
  }

  // ============================================================
  // RENDERERS
  // ============================================================
  function greetingText() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function renderIdentity() {
    const { name, avatar, role, tier } = vm.user;
    const greet = `${greetingText()}, ${name}`;

    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('userName', greet);
    set('userNameMobile', greet);
    set('sidebarName', name);
    set('sidebarAvatar', avatar);
    set('sidebarPlan', tier === 'pro' ? 'Pro tier' : 'Free tier');

    const roleEl = $('sidebarRole'); if (roleEl) roleEl.textContent = role;

    const tb = $('tierBadge');
    if (tb) tb.innerHTML = `<i class="fas fa-circle"></i> ${tier === 'pro' ? 'Pro' : 'Free'}`;

    const greeting = $('userGreeting');
    if (greeting) greeting.textContent = 'Your next useful action is ready.';
  }

  function renderStats() {
    const { streak, xpToday, xpGoal, rank } = vm.stats;

    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('statStreak', streak + (streak === 1 ? ' day' : ' days'));
    set('statStreakPill', streak);
    set('statXpToday', `${xpToday} / ${xpGoal}`);
    set('statRank', rank || '—');
    set('mobileStreakPill', `${streak} day streak`);

    // Ring
    const pct = xpGoal > 0 ? Math.min(100, (xpToday / xpGoal) * 100) : 0;
    const ring = $('xpRing');
    if (ring) {
      ring.style.setProperty('--p', pct + '%');
      ring.setAttribute('aria-label', `${xpToday} of ${xpGoal} daily experience points earned`);
    }
    set('ringValue', Math.min(xpToday, xpGoal));
    set('ringGoal', `of ${xpGoal} XP`);
    set('xpRemaining', `${Math.max(xpGoal - xpToday, 0)} XP`);
  }

  function renderLearning() {
    const l = vm.journey;
    const card = $('continueLearning');
    const empty = $('heroEmpty');
    if (!card) return;

    const hasNext = !!l.next && l.total > 0;
    const inner = card.querySelector('.resume-copy');
    const photo = card.querySelector('.resume-photo');

    if (!hasNext) {
      if (inner) inner.hidden = true;
      if (photo) photo.hidden = true;
      if (empty) empty.hidden = false;
      card.classList.remove('chasing-border');
      return;
    }

    if (inner) inner.hidden = false;
    if (photo) photo.hidden = false;
    if (empty) empty.hidden = true;
    card.classList.add('chasing-border');

    const title = l.next.title || l.next.name || 'Next lesson';
    const pct = l.total ? (l.completedCount / l.total) * 100 : 0;

    $('heroLessonTitle') && ($('heroLessonTitle').textContent = title);
    $('heroLessonDesc') && ($('heroLessonDesc').textContent = 'Continue your journey from where you left off.');
    $('heroEstimate') && ($('heroEstimate').textContent = '~5 min left');
    $('heroBadge') && ($('heroBadge').textContent = `LESSON ${String(l.completedCount + 1).padStart(2,'0')} · IN PROGRESS`);
    $('heroProgressLabel') && ($('heroProgressLabel').textContent = `${l.completedCount} of ${l.total}`);
    const bar = $('heroProgress');
    if (bar) bar.setAttribute('aria-valuenow', Math.round(pct));
    const fill = $('heroProgressFill');
    if (fill) fill.style.width = pct + '%';

    const cta = $('heroCta');
    const ctaLabel = $('heroCtaLabel');
    if (cta) cta.href = '/journey.html';
    if (ctaLabel) ctaLabel.textContent = 'Continue lesson';
  }

  function renderJourneyList() {
    const list = $('journeyList');
    const summary = $('journeyProgressText');
    const l = vm.journey;
    if (summary) summary.textContent = `${l.title} · ${l.completedCount} of ${l.total} lessons complete`;
    if (!list) return;

    if (!l.nodes.length) {
      list.innerHTML = '<p class="empty-state">Your journey is being prepared.</p>';
      return;
    }

    const firstIncompleteIdx = l.nodes.findIndex(n => !l.completed.includes(n.id));
    const visible = [];
    // Show: last completed (if any), current (first incomplete), next 1–2 upcoming
    if (firstIncompleteIdx > 0) visible.push({ ...l.nodes[firstIncompleteIdx - 1], _state:'done' });
    if (firstIncompleteIdx >= 0) visible.push({ ...l.nodes[firstIncompleteIdx], _state:'current' });
    for (let i = firstIncompleteIdx + 1; i < l.nodes.length && visible.length < 3; i++) {
      visible.push({ ...l.nodes[i], _state:'upcoming' });
    }
    if (!visible.length) {
      list.innerHTML = '<p class="empty-state">You finished this journey. 🎉</p>';
      return;
    }

    list.innerHTML = visible.map((n, i) => {
      const num = String(l.nodes.indexOf(n) + 1).padStart(2,'0');
      const nodeClass = n._state === 'done' ? 'done' : (n._state === 'current' ? 'current' : '');
      const nodeIcon = n._state === 'done'
        ? '<i class="fas fa-check"></i>'
        : num;
      const status = n._state === 'done' ? 'Complete'
        : n._state === 'current' ? 'In progress'
        : 'Up next';
      const subtitle = n.description || n.summary || '';
      return `<article class="journey-item ${nodeClass}">
        <div class="lesson-node" aria-hidden="true">${nodeIcon}</div>
        <div class="journey-title"><strong>${n.title || n.name || 'Lesson'}</strong>${subtitle ? `<span>${subtitle}</span>` : ''}</div>
        <div class="lesson-status">${status}</div>
      </article>`;
    }).join('');
  }

  function renderActivity() {
    const box = $('activityList');
    if (!box) return;
    if (!vm.activity.length) {
      box.innerHTML = '<p class="empty-state">No recent activity yet.</p>';
      return;
    }
    box.innerHTML = vm.activity.map(a => `
      <div class="activity-row">
        <div class="activity-dot"><i class="fas fa-check"></i></div>
        <div><strong>${a.text}</strong><span>${a.time || ''}</span></div>
        ${a.xp ? `<div class="xp">+${a.xp} XP</div>` : '<div></div>'}
      </div>
    `).join('');
  }

  function renderCollections() {
    const c = vm.counts;
    ['protocolCount','snapshotCount','postCount'].forEach((id, i) => {
      const el = $(id);
      if (el) el.textContent = [c.protocols, c.snapshots, c.posts][i];
    });
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

  const CHALLENGES = [
    { title:'Golden Hour Portrait', desc:'Capture a portrait during golden hour. Focus on warm tones and backlighting.', href:'/dailyprotocol.html' },
    { title:'Street Scene', desc:'Capture a candid street moment with strong composition.', href:'/dailyprotocol.html' },
    { title:'Minimalist Still Life', desc:'Arrange 3 objects and create a simple, clean composition.', href:'/dailyprotocol.html' },
    { title:'Macro Details', desc:'Find a small subject and capture it in extreme detail.', href:'/dailyprotocol.html' },
    { title:'Reflection Hunt', desc:'Find a reflection (water, glass, mirror) and use it as the main subject.', href:'/dailyprotocol.html' }
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
    const href = c.href || '/dailyprotocol.html';

    const t = $('challengeTitle'); if (t) t.textContent = title;
    const d = $('challengeDesc'); if (d) d.textContent = desc;
    const btn = $('challengeBtn');
    if (btn) {
      if (done) { btn.textContent = 'Completed today'; btn.setAttribute('aria-disabled','true'); btn.style.opacity='0.5'; btn.style.pointerEvents='none'; }
      else { btn.textContent = 'Start challenge'; btn.href = href; btn.removeAttribute('aria-disabled'); btn.style.opacity=''; btn.style.pointerEvents=''; }
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
    const ls = $('logStreak'); if (ls) ls.textContent = vm.stats.streak;
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

  function renderNotifications() {
    const u = vm.raw;
    const unread = toNum(pick(u, ['unreadNotifications','unreadNotices'], 0));
    const dots = [$('noticeDot'), $('mobileNoticeDot')];
    dots.forEach(d => { if (d) d.hidden = unread <= 0; });

    const box = $('notificationsList');
    if (!box) return;
    const items = vm.notifications.length
      ? vm.notifications
      : [{ text: 'You are all caught up.' }];
    box.innerHTML = items.map(n => {
      const text = n.text || n.message || n.title || 'Notification';
      const time = n.time || n.date || '';
      return `<div class="notice"><span class="notice-mark"></span><div><p>${text}</p>${time ? `<time>${time}</time>` : ''}</div></div>`;
    }).join('');
  }

  function renderAll() {
    renderIdentity();
    renderStats();
    renderLearning();
    renderJourneyList();
    renderActivity();
    renderCollections();
    renderAI();
    renderChallenge();
    renderProtocols();
    renderReferral();
    renderQuiz();
    renderNotifications();
  }

  // ============================================================
  // EVENTS / UI
  // ============================================================
  const toast = $('toast');
  let toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }
  function announce(msg) { const el = $('dashboardAnnouncements'); if (el) el.textContent = msg; }

  let lastFocus = null;
  function openModal(id) {
    closePopover();
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
  function togglePopover() {
    const pop = $('notifications');
    const open = !pop.classList.contains('open');
    pop.classList.toggle('open', open);
    $('noticeButton')?.setAttribute('aria-expanded', String(open));
    $('mobileNoticeButton')?.setAttribute('aria-expanded', String(open));
  }
  function closePopover() {
    $('notifications')?.classList.remove('open');
    $('noticeButton')?.setAttribute('aria-expanded','false');
    $('mobileNoticeButton')?.setAttribute('aria-expanded','false');
  }

  function bindUI() {
    $$('[data-scroll]').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.scroll;
      const node = id === 'main' ? $('main') : document.getElementById(id);
      node?.scrollIntoView({behavior:'smooth', block:'start'});
      $$('.bottom-link').forEach(b => {
        const on = b.dataset.scroll === id;
        b.classList.toggle('active', on);
        on ? b.setAttribute('aria-current','page') : b.removeAttribute('aria-current');
      });
    }));
    $$('[data-open]').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.open)));
    $$('[data-close]').forEach(btn => btn.addEventListener('click', () => {
      const scrim = btn.closest('.scrim'); if (scrim) closeModal(scrim);
    }));
    $$('.scrim').forEach(s => s.addEventListener('click', e => { if (e.target === s) closeModal(s); }));

    $('noticeButton')?.addEventListener('click', (e) => { e.stopPropagation(); togglePopover(); });
    $('mobileNoticeButton')?.addEventListener('click', (e) => { e.stopPropagation(); togglePopover(); });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#notifications') && !e.target.closest('#noticeButton') && !e.target.closest('#mobileNoticeButton')) closePopover();
    });

    $('moreButton')?.addEventListener('click', () => openModal('more'));
    $('moreLogout')?.addEventListener('click', logout);

    // Quiz / drill choice handlers
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

    // Drill completion — real Firestore write, then snapshot re-renders.
    $('drillFinish')?.addEventListener('click', async () => {
      const uid = vm.user.uid;
      if (!uid) return;
      try {
        await window.db.collection('users').doc(uid).update({
          xpToday: firebase.firestore.FieldValue.increment(10),
          totalPoints: firebase.firestore.FieldValue.increment(10),
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

    // Lesson preview completion — mark journey progress.
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
            totalPoints: firebase.firestore.FieldValue.increment(20)
          });
          showToast('Lesson marked complete · +20 XP');
        } catch (err) {
          console.warn('[Dashboard] Lesson write failed:', err);
          showToast('Could not save lesson progress.');
        }
      }
      closeModal($('lessonModal'));
    });

    // Escape closes everything
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const open = document.querySelector('.scrim.open');
        if (open) closeModal(open);
        closePopover();
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

    // Referral copy
    $('copyReferralBtn')?.addEventListener('click', () => {
      const text = ($('referralLink')?.textContent || '').trim();
      const url = 'https://' + text;
      const done = () => { showToast('Referral link copied'); announce('Referral link copied'); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(() => {
        const inp = document.createElement('input'); inp.value = url;
        document.body.appendChild(inp); inp.select(); document.execCommand('copy'); document.body.removeChild(inp); done();
      });
    });

    // Quiz difficulty → launch href
    const diff = $('diffSelect'), launch = $('quizLaunchBtn');
    if (diff && launch) {
      const update = () => { launch.href = `/quiz-full.html?difficulty=${diff.value}`; };
      diff.addEventListener('change', update);
      update();
    }

    // Logout
    $('sidebarLogout')?.addEventListener('click', logout);
  }

  function logout() {
    window.auth.signOut()
      .then(() => { window.location.href = '/login.html'; })
      .catch(() => { window.location.href = '/login.html'; });
  }

  // ============================================================
  // SUBSCRIPTION
  // ============================================================
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

  // ============================================================
  // BOOT
  // ============================================================
  async function boot() {
    stage('boot started');
    const ok = await waitForFirebase();
    if (!ok) { showLoadError('Firebase did not load.'); return; }
    stage('Firebase globals found');

    // userStateReady (optional merge)
    window.addEventListener('userStateReady', () => { /* user-state has run; nothing required */ }, { once: true });

    window.auth.onAuthStateChanged(async (user) => {
      stage('auth callback fired');
      if (!user) {
        $('loadingState').innerHTML = '<p>Please <a href="/login.html" style="color:var(--green)">log in</a>.</p>';
        return;
      }
      try {
        await hydrateUser(user.uid);
        await loadJourney(user.uid);
        renderAll();
        subscribeToUser(user.uid);
        $('loadingState').hidden = true;
        $('dashboardContent').hidden = false;
        console.log('[Dashboard] ✅ Ready.');
      } catch (err) {
        console.error('[Dashboard] boot error', err);
        showLoadError(err.message || 'Unknown error');
      }
    });
  }

  function showLoadError(msg) {
    const el = $('loadingState');
    if (!el) return;
    el.innerHTML = `<p style="color:#ff8888">${msg}</p><button class="btn btn-secondary" onclick="location.reload()" style="margin-top:12px">Retry</button>`;
  }

  // ============================================================
  // START
  // ============================================================
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindUI);
  else bindUI();
  boot();
})();