/* operator-dashboard.js — auth-aware, responsive Cameras Decoded dashboard */
(function () {
  'use strict';

  const state = {
    authUser: null,
    user: {},
    journey: { title: 'Beginner', nextNode: 'Start your journey', completed: 0, total: 0 },
    activity: [],
    unsubscribe: null,
    menuOpen: false,
    lastFocus: null
  };

  const $ = (id) => document.getElementById(id);
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const announce = (message) => setText('dashboardAnnouncements', message);
  const safeArray = (value) => Array.isArray(value) ? value : [];
  const firstString = (...values) => values.find((v) => typeof v === 'string' && v.trim()) || '';
  const cap = (value, fallback) => {
    const text = firstString(value, fallback);
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  };
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const escapeText = (value) => String(value == null ? '' : value);

  function normalizedUser(data, authUser) {
    const subscription = data.subscription && typeof data.subscription === 'object' ? data.subscription : {};
    return Object.assign({}, data, {
      name: firstString(data.displayName, data.name, data.username, authUser && authUser.displayName, 'Operator'),
      email: firstString(data.email, authUser && authUser.email),
      role: cap(firstString(data.role, data.roleName, data.accountRole, data.userRole), 'Operator'),
      tier: cap(firstString(data.tier, data.plan, data.planName, data.planTier, data.subscriptionTier, data.membershipTier, data.membershipLevel, typeof data.subscription === 'string' ? data.subscription : '', subscription.tier, subscription.plan, subscription.name), 'Free')
    });
  }

  function syncHeader() {
    const signedIn = Boolean(state.authUser);
    const authButtons = $('headerAuthButtons');
    const roleBadge = $('roleTierBadge');
    if (authButtons) authButtons.style.display = signedIn ? 'none' : 'flex';
    if (roleBadge) roleBadge.style.display = signedIn ? 'inline-flex' : 'none';
    if (signedIn) {
      setText('headerRole', state.user.role || 'Operator');
      setText('headerTier', state.user.tier || 'Free');
    }
    ensureNotificationButton();
  }

  function ensureNotificationButton() {
    const right = document.querySelector('.floating-right-group');
    if (!right || $('headerNotificationButton')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'headerNotificationButton';
    button.className = 'header-notification-button';
    button.setAttribute('aria-label', 'Notifications');
    button.innerHTML = '<i class="fas fa-bell" aria-hidden="true"></i><span class="header-notification-dot" id="notificationCount"></span>';
    const authButtons = $('headerAuthButtons');
    right.insertBefore(button, authButtons || right.firstChild);
    button.addEventListener('click', () => announce('Notifications panel is not connected yet.'));
    updateNotificationCount();
  }

  function updateNotificationCount() {
    const unread = number(state.user.unreadNotifications, safeArray(state.user.notifications).filter((item) => !item.read).length);
    const dot = $('notificationCount');
    if (!dot) return;
    dot.textContent = unread > 99 ? '99+' : String(unread);
    dot.style.display = unread > 0 ? 'block' : 'none';
    const button = $('headerNotificationButton');
    if (button) button.setAttribute('aria-label', unread ? `Notifications, ${unread} unread` : 'Notifications');
  }
  function progress(id, value) {
    const pct = Math.max(0, Math.min(100, number(value)));
    const track = $(id);
    if (!track) return;
    track.setAttribute('aria-valuenow', String(Math.round(pct)));
    const fill = track.querySelector('span');
    if (fill) fill.style.width = `${pct}%`;
  }

  async function loadJourney(uid) {
    try {
      const [journeyDoc, progressDoc] = await Promise.all([
        window.db.collection('journeys').doc('beginner').get(),
        window.db.collection('userJourney').doc(uid).get()
      ]);
      const journey = journeyDoc.exists ? journeyDoc.data() : {};
      const userProgress = progressDoc.exists ? progressDoc.data() : {};
      const nodes = safeArray(journey.nodes);
      const completedIds = safeArray(userProgress.completedNodes);
      const next = nodes.find((node) => !completedIds.includes(node.id));
      state.journey = {
        title: firstString(journey.title, 'Beginner'),
        nextNode: next ? firstString(next.title, next.name, 'Next lesson') : (nodes.length ? 'Journey complete' : 'Start your journey'),
        completed: completedIds.length,
        total: nodes.length
      };
      state.activity = completedIds.slice(-3).reverse().map((id) => ({ label: `Completed: ${id}`, date: null }));
    } catch (error) {
      console.warn('[Dashboard] Journey data unavailable:', error);
    }
  }

  function renderIdentity() {
    const user = state.user;
    setText('userName', user.name || 'Operator');
    setText('tierBadge', `● ${user.tier || 'Free'}`);
    setText('sidebarName', user.name || 'Operator');
    setText('sidebarPlan', `${user.tier || 'Free'} plan`);
    setText('sheetUserName', user.name || 'Operator');
    setText('sheetUserPlan', user.tier || 'Free');
    const avatar = firstString(user.name, 'O').charAt(0).toUpperCase();
    setText('sidebarAvatar', avatar);
    syncHeader();
  }

  function renderLearning() {
    const journey = state.journey;
    const complete = journey.total > 0 && journey.completed >= journey.total;
    const pct = journey.total ? journey.completed / journey.total * 100 : 0;
    const heroInner = document.querySelector('#continueLearning .hero-inner');
    const empty = $('heroEmpty');
    if (heroInner) heroInner.hidden = complete;
    if (empty) empty.hidden = !complete;
    setText('heroLessonTitle', journey.nextNode);
    setText('heroProgressLabel', `${Math.round(pct)}%`);
    setText('heroStepInfo', journey.total ? `Step ${Math.min(journey.completed + 1, journey.total)} of ${journey.total}` : 'Ready to begin');
    progress('heroProgress', pct);
  }

  function renderStats() {
    const user = state.user;
    const streak = number(user.dailyChallengeStreak || user.streakDays || user.streak);
    const xpToday = number(user.xpToday || user.dailyXp);
    const goal = Math.max(1, number(user.xpGoal || user.dailyXpGoal, 100));
    setText('statStreak', streak);
    setText('statXpToday', xpToday);
    setText('statRank', firstString(user.rank, user.operatorRank, '—'));
    setText('goalCurrent', Math.min(xpToday, goal));
    setText('goalTarget', goal);
    setText('goalRemaining', xpToday >= goal ? 'Daily goal complete' : `Remaining: ${goal - xpToday} XP`);
    progress('goalProgress', xpToday / goal * 100);
    setText('logStreak', streak);
    renderWeek(user.challengeLog || user.dailyChallengeLog);
  }
  function renderWeek(log) {
    const host = $('logDays');
    if (!host) return;
    host.replaceChildren();
    const completed = safeArray(log);
    const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      const day = document.createElement('span');
      day.className = `log-day${completed.includes(key) ? ' complete' : ''}`;
      day.textContent = formatter.format(date);
      day.title = key;
      host.appendChild(day);
    }
  }

  function renderJourney() {
    const journey = state.journey;
    const pct = journey.total ? journey.completed / journey.total * 100 : 0;
    setText('journeyNodeName', journey.nextNode);
    setText('journeyProgressText', `${journey.completed} / ${journey.total} completed`);
    progress('journeyProgress', pct);
  }

  function renderActivity() {
    const host = $('activityList');
    if (!host) return;
    host.replaceChildren();
    const items = safeArray(state.user.recentActivity).length ? state.user.recentActivity : state.activity;
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No recent activity yet.';
      host.appendChild(empty);
      return;
    }
    items.slice(0, 4).forEach((item) => {
      const row = document.createElement('article');
      row.className = 'activity-item';
      const label = document.createElement('span');
      label.textContent = firstString(item.label, item.text, item.title, 'Activity');
      const time = document.createElement('time');
      time.textContent = firstString(item.time, item.date, 'Recent');
      row.append(label, time);
      host.appendChild(row);
    });
  }

  function renderCollections() {
    const user = state.user;
    setText('protocolCount', safeArray(user.savedProtocols).length);
    setText('snapshotCount', safeArray(user.savedCards || user.savedSnapshots).length);
    setText('postCount', safeArray(user.savedCommunityPosts).length);
  }

  function renderAI() {
    const user = state.user;
    const usage = user.aiUsage && typeof user.aiUsage === 'object' ? number(user.aiUsage.total || user.aiUsage.today) : number(user.aiUsageToday);
    const isPro = /pro|premium|founder/i.test(user.tier || '');
    const limit = Math.max(1, number(user.aiDailyLimit, isPro ? 50 : 5));
    const pct = usage / limit * 100;
    setText('aiUsed', usage);
    setText('aiLimit', limit);
    setText('aiPercent', `${Math.round(Math.min(100, pct))}%`);
    setText('aiBadge', user.tier || 'Free');
    progress('aiProgress', pct);
  }

  function renderChallenge() {
    const challenge = state.user.dailyChallenge && typeof state.user.dailyChallenge === 'object' ? state.user.dailyChallenge : null;
    const link = $('challengeBtn');
    if (challenge) {
      setText('challengeTitle', firstString(challenge.title, 'Today’s challenge'));
      setText('challengeDesc', firstString(challenge.description, challenge.prompt, 'Complete today’s field mission.'));
      if (link) link.href = firstString(challenge.href, '/dailyprotocol.html');
    } else {
      setText('challengeTitle', 'No challenge published yet');
      setText('challengeDesc', 'Today’s field mission will appear here when it is ready.');
      if (link) { link.textContent = 'Browse protocols'; link.href = '/protocols.html'; }
    }
  }
  function renderProtocols() {
    const host = $('protocolGrid');
    if (!host) return;
    host.replaceChildren();
    const protocols = safeArray(state.user.savedProtocols);
    if (!protocols.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No saved protocols yet.';
      host.appendChild(empty);
      return;
    }
    protocols.slice(0, 6).forEach((entry) => {
      const protocol = typeof entry === 'string' ? { title: entry } : entry;
      const article = document.createElement('article');
      article.className = 'protocol-card';
      const title = document.createElement('h3');
      title.textContent = firstString(protocol.title, protocol.name, 'Saved protocol');
      const description = document.createElement('p');
      description.textContent = firstString(protocol.description, 'Saved to your library.');
      const tag = document.createElement('span');
      tag.className = 'genre-tag';
      tag.textContent = cap(firstString(protocol.category, protocol.genre, 'Protocol'));
      article.append(title, description, tag);
      host.appendChild(article);
    });
  }

  function renderReferral() {
    const user = state.user;
    const slug = firstString(user.referralCode, user.username, state.authUser && state.authUser.uid, '—');
    setText('referralLink', `camerasdecoded.com/ref/${slug}`);
    setText('totalReferrals', number(user.totalReferrals || user.referralCount));
    const commission = number(user.totalCommission || user.commissionTotal);
    setText('totalCommission', new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(commission));
    setText('ambassadorTier', firstString(user.ambassadorTier, '—'));
  }

  function renderQuiz() {
    setText('quizStreak', number(state.user.quizStreak));
    const score = state.user.lastQuizScore;
    setText('lastScoreDisplay', score == null ? '—' : `${number(score)}%`);
  }

  function renderAll() {
    renderIdentity();
    renderLearning();
    renderStats();
    renderJourney();
    renderActivity();
    renderCollections();
    renderAI();
    renderChallenge();
    renderProtocols();
    renderReferral();
    renderQuiz();
    updateNotificationCount();
    const loading = $('loadingState');
    const content = $('dashboardContent');
    if (loading) loading.hidden = true;
    if (content) content.hidden = false;
  }

  function showLoadError(message) {
    const loading = $('loadingState');
    if (!loading) return;
    loading.hidden = false;
    loading.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'loading-error';
    const text = document.createElement('p');
    text.textContent = message;
    const retry = document.createElement('button');
    retry.className = 'btn-secondary';
    retry.type = 'button';
    retry.textContent = 'Retry';
    retry.addEventListener('click', () => window.location.reload());
    box.append(text, retry);
    loading.appendChild(box);
  }

  async function hydrateUser(user) {
    state.authUser = user;
    syncHeader();
    try {
      const [doc] = await Promise.all([
        window.db.collection('users').doc(user.uid).get(),
        loadJourney(user.uid)
      ]);
      state.user = normalizedUser(doc.exists ? doc.data() : {}, user);
      renderAll();
      subscribeToUser(user.uid);
    } catch (error) {
      console.error('[Dashboard] Could not load user:', error);
      state.user = normalizedUser({}, user);
      renderAll();
      announce('Some dashboard data could not be loaded.');
    }
  }
  function subscribeToUser(uid) {
    if (state.unsubscribe) state.unsubscribe();
    state.unsubscribe = window.db.collection('users').doc(uid).onSnapshot((doc) => {
      if (!doc.exists) return;
      state.user = normalizedUser(doc.data(), state.authUser);
      renderAll();
      if (window.BottomNav && typeof window.BottomNav.updateBadges === 'function') window.BottomNav.updateBadges(state.user);
    }, (error) => console.warn('[Dashboard] Live updates unavailable:', error));
  }

  async function copyReferral() {
    const text = $('referralLink') ? $('referralLink').textContent : '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(`https://${text}`);
      announce('Referral link copied.');
    } catch (_) {
      const input = document.createElement('textarea');
      input.value = `https://${text}`;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      announce('Referral link copied.');
    }
  }

  function updateQuizLink() {
    const select = $('diffSelect');
    const link = $('quizLaunchBtn');
    if (select && link) link.href = `/quiz-full.html?difficulty=${encodeURIComponent(select.value)}`;
  }

  async function logout() {
    if (!window.auth) return;
    await window.auth.signOut();
    window.location.assign('/login.html');
  }

  function openMenu() {
    if (window.innerWidth > 1024 || state.menuOpen) return;
    const menu = $('dashboardMenu');
    const backdrop = $('dashboardMenuBackdrop');
    const toggle = $('floatingToggle');
    if (!menu || !backdrop) return;
    state.lastFocus = document.activeElement;
    state.menuOpen = true;
    menu.hidden = false;
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    if (toggle) { toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-controls', 'dashboardMenu'); }
    const close = $('closeDashboardMenu');
    if (close) close.focus();
  }

  function closeMenu() {
    if (!state.menuOpen) return;
    state.menuOpen = false;
    const menu = $('dashboardMenu');
    const backdrop = $('dashboardMenuBackdrop');
    if (menu) menu.hidden = true;
    if (backdrop) backdrop.hidden = true;
    document.body.style.overflow = '';
    const toggle = $('floatingToggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (state.lastFocus && typeof state.lastFocus.focus === 'function') state.lastFocus.focus();
  }

  function trapFocus(event) {
    if (!state.menuOpen || event.key !== 'Tab') return;
    const menu = $('dashboardMenu');
    const focusables = menu ? Array.from(menu.querySelectorAll('a[href],button:not([disabled]),select,[tabindex]:not([tabindex="-1"])')).filter((el) => !el.hidden) : [];
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function bindUI() {
    $('copyReferralBtn')?.addEventListener('click', copyReferral);
    $('diffSelect')?.addEventListener('change', updateQuizLink);
    $('sidebarLogout')?.addEventListener('click', logout);
    $('sheetLogout')?.addEventListener('click', logout);
    $('closeDashboardMenu')?.addEventListener('click', closeMenu);
    $('dashboardMenuBackdrop')?.addEventListener('click', closeMenu);
    document.addEventListener('click', (event) => {
      const toggle = event.target.closest('#floatingToggle');
      if (!toggle) return;
      event.preventDefault();
      state.menuOpen ? closeMenu() : openMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
      trapFocus(event);
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 1024) closeMenu(); });
    updateQuizLink();
  }

  function waitForFirebase(timeout = 8000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(() => {
        if (window.auth && window.db) { clearInterval(timer); resolve(); }
        else if (Date.now() - started >= timeout) { clearInterval(timer); reject(new Error('Firebase did not initialize')); }
      }, 100);
    });
  }

  function watchHeaderInjection() {
    syncHeader();
    const observer = new MutationObserver(() => {
      if ($('headerAuthButtons') || $('roleTierBadge')) syncHeader();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 10000);
  }

  async function boot() {
    bindUI();
    watchHeaderInjection();
    try {
      await waitForFirebase();
      window.auth.onAuthStateChanged((user) => {
        if (user) hydrateUser(user);
        else {
          state.authUser = null;
          state.user = {};
          syncHeader();
          showLoadError('Please log in to open your operator dashboard.');
          const loading = $('loadingState');
          if (loading) {
            const link = document.createElement('a');
            link.className = 'btn-primary';
            link.href = '/login.html';
            link.textContent = 'Log in';
            loading.querySelector('.loading-error')?.appendChild(link);
          }
        }
      });
    } catch (error) {
      console.error('[Dashboard] Initialization failed:', error);
      showLoadError('The dashboard could not connect.');
    }
  }

  window.addEventListener('userStateReady', (event) => {
    if (!event.detail || !state.authUser) return;
    state.user = Object.assign({}, state.user, normalizedUser(event.detail, state.authUser));
    renderIdentity();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
