// operator-dashboard.js — Full data wiring for redesigned dashboard
(function () {
  'use strict';
  console.log('[Dashboard] Loading...');

  // ================================================================
  // DOM SHORTCUTS
  // ================================================================
  const $ = (id) => document.getElementById(id);
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => document.querySelectorAll(sel);

  // ================================================================
  // VIEW MODEL
  // ================================================================
  const dashboard = {
    user:  { name:'Operator', role:'Operator', tier:'free', avatar:'O' },
    learning: { title:'', step:0, total:0, pct:0, href:'/journey.html' },
    activity: { streak:0, xpToday:0, xpGoal:100, totalXp:0, rank:'—' },
    journey:  { stage:'Beginner', nextNode:'Start your journey', completed:0, total:0 },
    counts:   { protocols:0, snapshots:0, posts:0 },
    recent:   []
  };

  // ================================================================
  // UTILITIES
  // ================================================================
  function setProgress(barId, fillId, pct) {
    const bar = $(barId);
    const fill = $(fillId);
    const clamped = Math.max(0, Math.min(100, pct));
    if (fill) fill.style.width = clamped + '%';
    if (bar) bar.setAttribute('aria-valuenow', Math.round(clamped));
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function announce(msg) {
    const el = $('dashboardAnnouncements');
    if (el) el.textContent = msg;
  }

  function fmtDate(ts) {
    if (!ts) return '';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
    } catch { return ''; }
  }

  // ================================================================
  // DATA LOADING
  // ================================================================
  async function loadAll(userId) {
    try {
      console.log('[Dashboard] Loading for uid:', userId);

      const [userDoc, journeyDoc, userJourneyDoc] = await Promise.all([
        firebase.firestore().collection('users').doc(userId).get(),
        firebase.firestore().collection('journeys').doc('beginner').get(),
        firebase.firestore().collection('userJourney').doc(userId).get()
      ]);

      const userData = userDoc.exists ? userDoc.data() : {};
      const journeyData = journeyDoc.exists ? journeyDoc.data() : { nodes: [], title: 'Beginner' };
      const userJourney = userJourneyDoc.exists ? userJourneyDoc.data() : { completedNodes: [] };

      // ---- USER ----
      dashboard.user = {
        name: userData.displayName || userData.username || 'Operator',
        role: userData.role || 'Operator',
        tier: userData.tier || 'free',
        avatar: (userData.displayName || userData.username || 'O').charAt(0).toUpperCase()
      };

      // ---- JOURNEY ----
      const allNodes = journeyData.nodes || [];
      const completedIds = userJourney.completedNodes || [];
      const completedCount = completedIds.length;
      const totalCount = allNodes.length;
      const nextNode = allNodes.find(n => !completedIds.includes(n.id));

      dashboard.journey = {
        stage: journeyData.title || 'Beginner',
        nextNode: nextNode ? (nextNode.title || 'Next node') : 'All caught up',
        completed: completedCount,
        total: totalCount
      };

      // ---- LEARNING (Hero) ----
      if (nextNode && totalCount > 0) {
        dashboard.learning = {
          title: nextNode.title || 'Continue your journey',
          step: completedCount + 1,
          total: totalCount,
          pct: (completedCount / totalCount) * 100,
          href: '/journey.html'
        };
      } else {
        dashboard.learning = { title:'', step:0, total:0, pct:100, href:'/journey.html' };
      }

      // ---- ACTIVITY / STATS ----
      const todayKey = new Date().toISOString().slice(0,10);
      const xpToday = userData.xpToday || 0;
      const xpGoal = userData.xpGoal || 100;

      dashboard.activity = {
        streak: userData.dailyChallengeStreak || 0,
        xpToday,
        xpGoal,
        totalXp: userData.totalPoints || 0,
        rank: userData.rank || userData.level || '—'
      };

      // ---- COLLECTIONS ----
      dashboard.counts = {
        protocols: (userData.savedProtocols || []).length,
        snapshots: (userData.savedCards || []).length,
        posts: (userData.savedCommunityPosts || []).length
      };

      // ---- RECENT ACTIVITY ----
      dashboard.recent = buildRecentActivity(completedIds, allNodes);

      // Store extra bits for later renders
      dashboard._raw = { userData, allNodes, completedIds, todayKey };

      return true;
    } catch (err) {
      console.error('[Dashboard] Load failed:', err);
      return false;
    }
  }

  function buildRecentActivity(completedIds, allNodes) {
    if (!completedIds || completedIds.length === 0) return [];
    // Newest first, last 3
    return completedIds
      .slice(-3)
      .reverse()
      .map(id => {
        const node = allNodes.find(n => n.id === id);
        return { text: node ? `Completed: ${node.title}` : `Completed: ${id}`, time: 'Recently' };
      });
  }

  // ================================================================
  // RENDERERS
  // ================================================================
  function renderGreeting() {
    setText('userName', dashboard.user.name);
    setText('sidebarName', dashboard.user.name);
    setText('sidebarPlan', dashboard.user.tier === 'pro' ? 'Pro plan' : 'Free plan');
    setText('sidebarAvatar', dashboard.user.avatar);
    setText('sheetUserName', dashboard.user.name);
    setText('sheetUserPlan', dashboard.user.tier === 'pro' ? 'Pro' : 'Free');

    const tierBadge = $('tierBadge');
    if (tierBadge) tierBadge.textContent = '● ' + (dashboard.user.tier === 'pro' ? 'Pro' : 'Free');
  }

  function renderHero() {
    const l = dashboard.learning;
    const card = $('continueLearning');
    const inner = card ? card.querySelector('.hero-inner') : null;
    const empty = $('heroEmpty');
    if (!card || !inner) return;

    if (l.pct >= 100 || !l.title) {
      inner.hidden = true;
      if (empty) empty.hidden = false;
      card.classList.remove('chasing-border');
      return;
    }
    inner.hidden = false;
    if (empty) empty.hidden = true;
    card.classList.add('chasing-border');

    setText('heroLessonTitle', l.title);
    setText('heroProgressLabel', Math.round(l.pct) + '%');
    setText('heroStepInfo', `Step ${l.step} of ${l.total}`);
    setText('heroEstimate', '~5 min');
    setProgress('heroProgress', 'heroProgressFill', l.pct);
    const cta = $('heroCta');
    if (cta) cta.href = l.href;
  }

  function renderStats() {
    const a = dashboard.activity;
    setText('statStreak', a.streak);
    setText('statXpToday', a.xpToday);
    setText('statRank', a.rank);
  }

  function renderGoalAndJourney() {
    const a = dashboard.activity;
    const j = dashboard.journey;

    setText('goalCurrent', Math.min(a.xpToday, a.xpGoal));
    setText('goalTarget', a.xpGoal);
    setText('goalRemaining', `Remaining: ${Math.max(a.xpGoal - a.xpToday, 0)} XP`);
    setProgress('goalProgress', 'goalProgressFill', a.xpGoal ? (a.xpToday / a.xpGoal) * 100 : 0);

    setText('journeyNodeName', j.nextNode);
    setText('journeyProgressText', `${j.completed} / ${j.total} completed`);
    setProgress('journeyProgress', 'journeyProgressFill', j.total ? (j.completed / j.total) * 100 : 0);
  }

  function renderActivity() {
    const list = $('activityList');
    if (!list) return;
    if (dashboard.recent.length === 0) {
      list.innerHTML = '<p class="empty-state">No recent activity yet.</p>';
      return;
    }
    list.innerHTML = dashboard.recent.map(r => `
      <div class="activity-item">
        <span>${r.text}</span>
        <time>${r.time}</time>
      </div>
    `).join('');
  }

  function renderCollections() {
    setText('protocolCount', dashboard.counts.protocols);
    setText('snapshotCount', dashboard.counts.snapshots);
    setText('postCount', dashboard.counts.posts);
  }

  function renderAI() {
    const u = dashboard._raw?.userData || {};
    const usage = u.aiUsage || { total: 0 };
    const isPro = u.tier === 'pro';
    const limit = isPro ? 50 : 5;
    const pct = isPro ? 0 : Math.min((usage.total / limit) * 100, 100);

    setText('aiBadge', isPro ? 'Pro' : 'Free');
    setText('aiUsed', usage.total || 0);
    setText('aiLimit', isPro ? '∞' : limit);
    setText('aiPercent', isPro ? '∞' : Math.round(pct) + '%');
    setProgress('aiProgress', 'aiFill', pct);
  }

  function renderChallenge() {
    const u = dashboard._raw?.userData || {};
    const todayKey = dashboard._raw?.todayKey;
    const completed = u.dailyChallengesCompleted || [];
    const done = completed.includes(todayKey);

    const CHALLENGES = [
      { title:'Golden Hour Portrait', desc:'Capture a portrait during golden hour. Focus on warm tones and backlighting.' },
      { title:'Street Scene',         desc:'Capture a candid street moment with strong composition.' },
      { title:'Minimalist Still Life',desc:'Arrange 3 objects and create a simple, clean composition.' },
      { title:'Macro Details',        desc:'Find a small subject and capture it in extreme detail.' },
      { title:'Reflection Hunt',      desc:'Find a reflection (water, glass, mirror) and use it as the main subject.' }
    ];

    const dayIndex = Math.floor(Date.now() / 86400000) % CHALLENGES.length;
    const challenge = CHALLENGES[dayIndex];

    setText('challengeTitle', challenge.title);
    setText('challengeDesc', challenge.desc);

    const btn = $('challengeBtn');
    if (btn) {
      if (done) {
        btn.textContent = 'Completed today';
        btn.setAttribute('aria-disabled', 'true');
        btn.style.opacity = '0.5';
        btn.style.pointerEvents = 'none';
      } else {
        btn.innerHTML = 'Start challenge';
        btn.href = '/dailyprotocol.html';
        btn.removeAttribute('aria-disabled');
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
      }
    }

    // Streak log — 7 day dots
    const logDays = $('logDays');
    if (logDays) {
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      let html = '';
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0,10);
        const isDone = completed.includes(key);
        html += `<span class="log-day${isDone ? ' complete' : ''}">${dayNames[d.getDay()][0]}</span>`;
      }
      logDays.innerHTML = html;
    }

    setText('logStreak', u.dailyChallengeStreak || 0);
  }

  function renderProtocols() {
    const grid = $('protocolGrid');
    if (!grid) return;
    const u = dashboard._raw?.userData || {};
    const saved = u.savedProtocols || [];

    if (saved.length === 0) {
      grid.innerHTML = '<p class="empty-state">No saved protocols yet.</p>';
      return;
    }
    grid.innerHTML = saved.slice(0, 4).map(p => {
      const title = typeof p === 'string' ? p : (p.title || 'Protocol');
      const desc  = typeof p === 'string' ? '' : (p.description || '');
      return `<article class="protocol-card"><h3>${title}</h3>${desc ? `<p>${desc}</p>` : ''}</article>`;
    }).join('');
  }

  function renderReferral() {
    const u = dashboard._raw?.userData || {};
    const code = u.referralCode || '—';
    setText('referralLink', `camerasdecoded.com/ref/${code}`);
    setText('totalReferrals', u.totalReferrals || 0);
    setText('totalCommission', '$' + (u.totalCommissionEarned || 0).toFixed(2));
    const tierMap = { signal:'Signal Creator', operator:'Operator Creator', transmission_elite:'Transmission Elite' };
    setText('ambassadorTier', tierMap[u.ambassadorTier] || u.ambassadorTier || 'Signal Creator');
  }

  function renderQuiz() {
    const u = dashboard._raw?.userData || {};
    setText('quizStreak', u.quizStreak || 0);
    const last = u.quizLastScore;
    if (last && last.score != null && last.total != null) {
      setText('lastScoreDisplay', `${last.score}/${last.total}`);
    } else {
      setText('lastScoreDisplay', '—');
    }
  }

  function renderAll() {
    renderGreeting();
    renderHero();
    renderStats();
    renderGoalAndJourney();
    renderActivity();
    renderCollections();
    renderAI();
    renderChallenge();
    renderProtocols();
    renderReferral();
    renderQuiz();
  }

  // ================================================================
  // LOADING SWAP
  // ================================================================
  function showLoading() {
    const l = $('loadingState'); if (l) l.hidden = false;
    const c = $('dashboardContent'); if (c) c.hidden = true;
  }
  function showDashboard() {
    const l = $('loadingState'); if (l) l.hidden = true;
    const c = $('dashboardContent'); if (c) c.hidden = false;
  }

  // ================================================================
  // MOBILE SHEET MENU
  // ================================================================
  function openSheet() {
    const bd = $('dashboardMenuBackdrop');
    const sheet = $('dashboardMenu');
    if (!bd || !sheet) return;
    bd.hidden = false;
    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
    const close = $('closeDashboardMenu');
    if (close) close.focus();
  }
  function closeSheet() {
    const bd = $('dashboardMenuBackdrop');
    const sheet = $('dashboardMenu');
    if (!bd || !sheet) return;
    bd.hidden = true;
    sheet.hidden = true;
    document.body.style.overflow = '';
  }

  function ensureMobileMenuTrigger() {
    if ($('mobileMenuTrigger')) return;
    const sheet = $('dashboardMenu');
    if (!sheet) return;

    const btn = document.createElement('button');
    btn.id = 'mobileMenuTrigger';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open menu');
    btn.className = 'icon-button';
    btn.style.cssText = 'position:fixed;top:16px;right:16px;z-index:10000;background:rgba(12,12,14,.9);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(14px);display:none;';
    btn.innerHTML = '<i class="fas fa-bars"></i>';
    btn.addEventListener('click', openSheet);
    document.body.appendChild(btn);

    const mq = window.matchMedia('(max-width: 1024px)');
    const update = () => { btn.style.display = mq.matches ? 'grid' : 'none'; };
    mq.addEventListener('change', update);
    update();
  }

  // ================================================================
  // EVENT WIRING
  // ================================================================
  function wireEvents() {
    // Mobile sheet
    ensureMobileMenuTrigger();
    const closeBtn = $('closeDashboardMenu');
    const backdrop = $('dashboardMenuBackdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeSheet);
    if (backdrop) backdrop.addEventListener('click', closeSheet);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSheet();
    });

    // Logout (sidebar + sheet)
    const logout = () => firebase.auth().signOut().then(() => { window.location.href = '/login.html'; });
    const sl = $('sidebarLogout'); if (sl) sl.addEventListener('click', logout);
    const shl = $('sheetLogout'); if (shl) shl.addEventListener('click', logout);

    // Copy referral
    const copy = $('copyReferralBtn');
    if (copy) {
      copy.addEventListener('click', () => {
        const text = ($('referralLink')?.textContent || '').trim();
        const url = 'https://' + text;
        navigator.clipboard.writeText(url).then(() => {
          announce('Referral link copied');
          const old = copy.innerHTML;
          copy.innerHTML = '<i class="fas fa-check"></i> Copied';
          setTimeout(() => { copy.innerHTML = old; }, 1600);
        }).catch(() => {
          const i = document.createElement('input');
          i.value = url; document.body.appendChild(i); i.select();
          document.execCommand('copy'); document.body.removeChild(i);
        });
      });
    }

    // Quiz difficulty → update launch href
    const diff = $('diffSelect');
    const launch = $('quizLaunchBtn');
    if (diff && launch) {
      const update = () => { launch.href = `/quiz-full.html?difficulty=${diff.value}`; };
      diff.addEventListener('change', update);
      update();
    }
  }

  // ================================================================
  // REAL-TIME
  // ================================================================
  let unsub = null;
  function listen(userId) {
    if (unsub) unsub();
    unsub = firebase.firestore().collection('users').doc(userId)
      .onSnapshot(async (snap) => {
        if (!snap.exists) return;
        const ok = await loadAll(userId);
        if (ok) renderAll();
      }, (err) => console.warn('[Dashboard] listener error:', err));
  }

  // ================================================================
  // AUTH + BOOT
  // ================================================================
  async function boot(user) {
    showLoading();
    const ok = await loadAll(user.uid);
    if (!ok) {
      const l = $('loadingState');
      if (l) l.innerHTML = '<p class="loading-error">Failed to load. <button onclick="location.reload()">Retry</button></p>';
      return;
    }
    renderAll();
    showDashboard();
    listen(user.uid);
    console.log('[Dashboard] ✅ Ready.');
  }

  function waitForAuth() {
    if (!window.auth) {
      console.warn('[Dashboard] auth not ready, retrying...');
      return setTimeout(waitForAuth, 200);
    }
    window.auth.onAuthStateChanged((user) => {
      if (user) {
        // Wait for user-state.js (optional; we load straight from Firestore anyway)
        if (window.USER?.isLoggedIn) boot(user);
        else {
          // Fallback: just boot after 300ms regardless
          setTimeout(() => boot(user), 300);
        }
      } else {
        window.location.href = '/login.html';
      }
    });
  }

  // Wire events as soon as DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireEvents);
  } else {
    wireEvents();
  }

  waitForAuth();
  console.log('[Dashboard] Script loaded.');
})();