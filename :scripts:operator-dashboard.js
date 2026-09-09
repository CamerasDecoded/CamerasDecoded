// operator-dashboard.js – Premium Dashboard Logic

(function() {
  'use strict';

  console.log('[Dashboard] Loading...');

  // ================================================================
  // DOM REFS – with retry
  // ================================================================
  let loadingEl = null;
  let contentEl = null;

  function getElements() {
    loadingEl = document.getElementById('loadingState');
    contentEl = document.getElementById('dashboardContent');
    return loadingEl && contentEl;
  }

  // ================================================================
  // VIEW MODEL
  // ================================================================
  let dashboard = {
    user: { name: '', role: '', tier: '', avatarUrl: '' },
    learning: { lessonId: null, title: '', step: 0, total: 0, progressPct: 0, href: '' },
    activity: { streakDays: 0, xpToday: 0, xpGoal: 100, totalXp: 0, rank: '' },
    journey: { stage: '', nextNode: '', completed: 0, total: 0 },
    counts: { protocols: 0, snapshots: 0, posts: 0 },
    notifications: [],
    recentActivity: []
  };

  // ================================================================
  // DATA LOADING
  // ================================================================
  async function loadDashboardData(userId) {
    try {
      const userDoc = await firebase.firestore().collection('users').doc(userId).get();
      if (!userDoc.exists) throw new Error('User document not found');
      const userData = userDoc.data();

      const journeyData = await fetchJourneyData(userId);
      const activity = await fetchRecentActivity(userId);

      dashboard.user = {
        name: userData.displayName || userData.username || 'Operator',
        role: userData.role || 'Operator',
        tier: userData.tier || 'free',
        avatarUrl: userData.avatarUrl || ''
      };

      dashboard.learning = buildLearningData(journeyData, userData);

      dashboard.activity = {
        streakDays: userData.dailyChallengeStreak || 0,
        xpToday: userData.xpToday || 0,
        xpGoal: userData.xpGoal || 100,
        totalXp: userData.totalPoints || 0,
        rank: userData.rank || '—'
      };

      dashboard.journey = {
        stage: journeyData.stage || 'Beginner',
        nextNode: journeyData.nextNode || 'Start your journey',
        completed: journeyData.completedNodes || 0,
        total: journeyData.totalNodes || 0
      };

      dashboard.counts = {
        protocols: (userData.savedProtocols || []).length,
        snapshots: (userData.savedCards || []).length,
        posts: (userData.savedCommunityPosts || []).length
      };

      dashboard.recentActivity = activity;

      return true;
    } catch (err) {
      console.error('[Dashboard] Error loading data:', err);
      return false;
    }
  }

  // ================================================================
  // JOURNEY DATA
  // ================================================================
  async function fetchJourneyData(userId) {
    try {
      const journeyDoc = await firebase.firestore().collection('journeys').doc('beginner').get();
      const userJourneyDoc = await firebase.firestore().collection('userJourney').doc(userId).get();

      let totalNodes = 0;
      let completedNodes = 0;
      let nextNode = 'Start your journey';
      let stage = 'Beginner';

      if (journeyDoc.exists) {
        const journey = journeyDoc.data();
        totalNodes = (journey.nodes || []).length;
        stage = journey.title || 'Beginner';
      }

      if (userJourneyDoc.exists) {
        const progress = userJourneyDoc.data();
        completedNodes = (progress.completedNodes || []).length;
        if (journeyDoc.exists && journeyDoc.data().nodes) {
          const allNodes = journeyDoc.data().nodes || [];
          const completed = progress.completedNodes || [];
          const next = allNodes.find(n => !completed.includes(n.id));
          if (next) nextNode = next.title || 'Next node';
        }
      }

      return { stage, nextNode, completedNodes, totalNodes };
    } catch (err) {
      console.warn('[Dashboard] Could not fetch journey:', err);
      return { stage: 'Beginner', nextNode: 'Start your journey', completedNodes: 0, totalNodes: 0 };
    }
  }

  function buildLearningData(journeyData, userData) {
    if (journeyData.nextNode && journeyData.nextNode !== 'Start your journey') {
      return {
        lessonId: 'next-node',
        title: journeyData.nextNode,
        step: journeyData.completedNodes + 1,
        total: journeyData.totalNodes,
        progressPct: journeyData.totalNodes > 0 ? (journeyData.completedNodes / journeyData.totalNodes) * 100 : 0,
        href: 'journey.html'
      };
    }
    return {
      lessonId: null,
      title: 'All caught up!',
      step: 0,
      total: 0,
      progressPct: 100,
      href: 'journey.html'
    };
  }

  // ================================================================
  // RECENT ACTIVITY
  // ================================================================
  async function fetchRecentActivity(userId) {
    try {
      const userJourneyDoc = await firebase.firestore().collection('userJourney').doc(userId).get();
      if (userJourneyDoc.exists) {
        const data = userJourneyDoc.data();
        const completed = data.completedNodes || [];
        return completed.slice(-3).map((nodeId, idx) => ({
          id: nodeId,
          text: `Completed node: ${nodeId}`,
          time: new Date(Date.now() - (idx * 3600000)).toLocaleString()
        }));
      }
      return [];
    } catch (err) {
      console.warn('[Dashboard] Could not fetch activity:', err);
      return [];
    }
  }

  // ================================================================
  // RENDER FUNCTIONS
  // ================================================================
  function renderDashboard() {
    if (!getElements()) {
      console.warn('[Dashboard] Elements not ready');
      return;
    }

    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

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

  function renderHero() {
    const l = dashboard.learning;
    const titleEl = document.getElementById('heroLessonTitle');
    const fillEl = document.getElementById('heroProgressFill');
    const labelEl = document.getElementById('heroProgressLabel');
    const stepEl = document.getElementById('heroStepInfo');
    const estimateEl = document.getElementById('heroEstimate');
    const cta = document.getElementById('heroCta');
    const hero = document.getElementById('continueLearning');
    const empty = document.getElementById('heroEmpty');
    const body = hero?.querySelector('.hero-inner');

    if (!hero || !body) return;

    if (!l.lessonId || l.progressPct >= 100) {
      body.style.display = 'none';
      if (empty) empty.style.display = 'block';
      if (hero) hero.classList.remove('chasing-border');
      return;
    }

    body.style.display = 'flex';
    if (empty) empty.style.display = 'none';
    if (hero) hero.classList.add('chasing-border');

    if (titleEl) titleEl.textContent = l.title || 'Continue your journey';
    if (fillEl) fillEl.style.width = l.progressPct + '%';
    if (labelEl) labelEl.textContent = Math.round(l.progressPct) + '%';
    if (stepEl) stepEl.textContent = `Step ${l.step} of ${l.total}`;
    if (estimateEl) estimateEl.textContent = '~5 min';
    if (cta) cta.href = l.href || 'journey.html';
  }

  function renderStats() {
    const a = dashboard.activity;
    const el = document.getElementById('statStreak');
    if (el) el.textContent = a.streakDays;
    const el2 = document.getElementById('statXpToday');
    if (el2) el2.textContent = a.xpToday;
    const el3 = document.getElementById('statRank');
    if (el3) el3.textContent = a.rank;
  }

  function renderGoalAndJourney() {
    const a = dashboard.activity;
    const j = dashboard.journey;

    const currentEl = document.getElementById('goalCurrent');
    if (currentEl) currentEl.textContent = Math.min(a.xpToday, a.xpGoal);
    const targetEl = document.getElementById('goalTarget');
    if (targetEl) targetEl.textContent = a.xpGoal;
    const fillEl = document.getElementById('goalProgressFill');
    if (fillEl) {
      const pct = a.xpGoal > 0 ? (a.xpToday / a.xpGoal) * 100 : 0;
      fillEl.style.width = Math.min(pct, 100) + '%';
    }
    const remainingEl = document.getElementById('goalRemaining');
    if (remainingEl) remainingEl.textContent = `Remaining: ${Math.max(a.xpGoal - a.xpToday, 0)} XP`;

    const nodeEl = document.getElementById('journeyNodeName');
    if (nodeEl) nodeEl.textContent = j.nextNode || 'No next node';
    const textEl = document.getElementById('journeyProgressText');
    if (textEl) textEl.textContent = `${j.completed} / ${j.total} completed`;
    const jFillEl = document.getElementById('journeyProgressFill');
    if (jFillEl) {
      const pct = j.total > 0 ? (j.completed / j.total) * 100 : 0;
      jFillEl.style.width = Math.min(pct, 100) + '%';
    }
  }

  function renderActivity() {
    const list = document.getElementById('activityList');
    if (!list) return;
    const activities = dashboard.recentActivity;
    if (!activities || activities.length === 0) {
      list.innerHTML = '<div class="activity-empty">No recent activity yet.</div>';
      return;
    }
    list.innerHTML = activities.map(act => `
      <div class="activity-item">
        <span>${act.text}</span>
        <span class="time">${act.time}</span>
      </div>
    `).join('');
  }

  function renderCollections() {
    const c = dashboard.counts;
    const el = document.getElementById('protocolCount');
    if (el) el.textContent = c.protocols;
    const el2 = document.getElementById('snapshotCount');
    if (el2) el2.textContent = c.snapshots;
    const el3 = document.getElementById('postCount');
    if (el3) el3.textContent = c.posts;
  }

  function renderAI() {
    const userData = window.USER;
    if (!userData) return;
    const usage = userData.aiUsage || { total: 0 };
    const limit = userData.tier === 'pro' ? 50 : 5;
    const pct = Math.min((usage.total / limit) * 100, 100);
    const usedEl = document.getElementById('aiUsed');
    if (usedEl) usedEl.textContent = usage.total;
    const limitEl = document.getElementById('aiLimit');
    if (limitEl) limitEl.textContent = limit === 50 ? '∞' : limit;
    const percentEl = document.getElementById('aiPercent');
    if (percentEl) percentEl.textContent = limit === 50 ? '∞' : Math.round(pct) + '%';
    const fillEl = document.getElementById('aiFill');
    if (fillEl) fillEl.style.width = pct + '%';
    const badgeEl = document.getElementById('aiBadge');
    if (badgeEl) badgeEl.textContent = userData.tier === 'pro' ? 'Pro' : 'Free';
  }

  function renderChallenge() {
    // Placeholder – real challenge data will be loaded
    // The existing challenge logic from the old dashboard can be reused
  }

  function renderProtocols() {
    // Placeholder – real protocol data will be loaded
  }

  function renderReferral() {
    // Placeholder – real referral data will be loaded
  }

  function renderQuiz() {
    // Placeholder – real quiz data will be loaded
  }

  // ================================================================
  // REAL-TIME LISTENER
  // ================================================================
  function listenToUserUpdates(userId) {
    firebase.firestore().collection('users').doc(userId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          loadDashboardData(userId).then(() => {
            renderDashboard();
          });
        }
      }, (err) => {
        console.warn('[Dashboard] Listener error:', err);
      });
  }

  // ================================================================
  // COPY REFERRAL
  // ================================================================
  window.copyReferralLink = function() {
    const link = document.getElementById('referralLink');
    if (!link) return;
    const text = link.textContent || '';
    navigator.clipboard.writeText('https://' + text).then(() => {
      console.log('[Dashboard] Referral link copied');
    }).catch(() => {
      const input = document.createElement('input');
      input.value = 'https://' + text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    });
  };

  // ================================================================
  // INIT
  // ================================================================
  async function init() {
    if (!getElements()) {
      setTimeout(init, 500);
      return;
    }

    const auth = window.auth;
    if (!auth) {
      if (loadingEl) loadingEl.innerHTML = '<p class="error">Firebase not initialized.</p>';
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      if (loadingEl) loadingEl.innerHTML = '<p>Please <a href="login.html">log in</a>.</p>';
      return;
    }

    if (loadingEl) loadingEl.style.display = 'block';
    if (contentEl) contentEl.style.display = 'none';

    const success = await loadDashboardData(user.uid);
    if (!success) {
      if (loadingEl) {
        loadingEl.innerHTML = '<p class="error">Failed to load dashboard. <button onclick="location.reload()">Retry</button></p>';
      }
      return;
    }

    renderDashboard();
    listenToUserUpdates(user.uid);

    if (window.BottomNav && typeof window.BottomNav.updateBadges === 'function') {
      window.BottomNav.updateBadges(window.USER);
    }

    if (window.Header && typeof window.Header.setUserData === 'function') {
      window.Header.setUserData(user, window.USER);
    }

    console.log('[Dashboard] ✅ Ready.');
  }

  // ================================================================
  // AUTH STATE LISTENER
  // ================================================================
  if (window.auth) {
    window.auth.onAuthStateChanged((user) => {
      if (user) {
        if (window.USER && window.USER.isLoggedIn) {
          if (getElements()) {
            init();
          } else {
            document.addEventListener('DOMContentLoaded', init);
          }
        } else {
          window.addEventListener('userStateReady', () => {
            if (getElements()) {
              init();
            } else {
              document.addEventListener('DOMContentLoaded', init);
            }
          });
        }
      } else {
        if (loadingEl) loadingEl.innerHTML = '<p>Please <a href="login.html">log in</a>.</p>';
      }
    });
  } else {
    console.error('[Dashboard] auth not available');
  }

  window.dashboard = dashboard;
  window.renderDashboard = renderDashboard;

  console.log('[Dashboard] Script loaded.');
})();