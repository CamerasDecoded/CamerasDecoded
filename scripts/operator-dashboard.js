// operator-dashboard.js – View model, data loading, rendering, event handlers

(function() {
  'use strict';

  console.log('[Dashboard] Loading...');

  // ================================================================
  // DOM REFS – with proper wait
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
      // 1. Load user doc
      const userDoc = await firebase.firestore().collection('users').doc(userId).get();
      if (!userDoc.exists) throw new Error('User document not found');
      const userData = userDoc.data();

      // 2. Load journey progress
      const journeyData = await fetchJourneyData(userId);

      // 3. Load recent activity
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
  // JOURNEY DATA HELPER
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

  // ================================================================
  // LEARNING DATA
  // ================================================================
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
    if (!loadingEl || !contentEl) {
      if (!getElements()) {
        console.warn('[Dashboard] Elements not ready, skipping render');
        return;
      }
    }

    // Show content, hide loading
    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

    renderHero();
    renderStats();
    renderGoalAndJourney();
    renderActivity();
    renderCollections();
    renderAI();
    // Challenge, Protocols, Referral, Quiz will be added
  }

  function renderHero() {
    const l = dashboard.learning;
    const titleEl = document.getElementById('heroLessonTitle');
    const progressEl = document.getElementById('heroProgress');
    const labelEl = document.getElementById('heroProgressLabel');
    const stepEl = document.getElementById('heroStepInfo');
    const estimateEl = document.getElementById('heroEstimate');
    const cta = document.getElementById('heroCta');
    const hero = document.getElementById('continueLearning');
    const empty = document.getElementById('heroEmpty');
    const content = hero?.querySelector('.hero-content');

    if (!hero || !content) return;

    if (!l.lessonId || l.progressPct >= 100) {
      content.style.display = 'none';
      if (empty) empty.style.display = 'block';
      if (hero) hero.classList.remove('chasing-border');
      return;
    }

    content.style.display = 'flex';
    if (empty) empty.style.display = 'none';
    if (hero) hero.classList.add('chasing-border');

    if (titleEl) titleEl.textContent = l.title || 'Continue your journey';
    if (progressEl) progressEl.value = l.progressPct;
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
    const barEl = document.getElementById('goalProgressBar');
    if (barEl) {
      const pct = a.xpGoal > 0 ? (a.xpToday / a.xpGoal) * 100 : 0;
      barEl.value = Math.min(pct, 100);
    }
    const remainingEl = document.getElementById('goalRemaining');
    if (remainingEl) remainingEl.textContent = `Remaining: ${Math.max(a.xpGoal - a.xpToday, 0)} XP`;

    const nodeEl = document.getElementById('journeyNodeName');
    if (nodeEl) nodeEl.textContent = j.nextNode || 'No next node';
    const textEl = document.getElementById('journeyProgressText');
    if (textEl) textEl.textContent = `${j.completed} / ${j.total} completed`;
    const jBarEl = document.getElementById('journeyProgressBar');
    if (jBarEl) {
      const pct = j.total > 0 ? (j.completed / j.total) * 100 : 0;
      jBarEl.value = Math.min(pct, 100);
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

  // ================================================================
  // REAL-TIME LISTENER
  // ================================================================
  function listenToUserUpdates(userId) {
    firebase.firestore().collection('users').doc(userId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          // Reload and re-render
          loadDashboardData(userId).then(() => {
            renderDashboard();
          });
        }
      }, (err) => {
        console.warn('[Dashboard] Listener error:', err);
      });
  }

  // ================================================================
  // INIT
  // ================================================================
  async function init() {
    // Make sure DOM elements exist
    if (!getElements()) {
      console.warn('[Dashboard] DOM not ready, waiting...');
      // Try again in 500ms
      setTimeout(init, 500);
      return;
    }

    const auth = window.auth;
    if (!auth) {
      console.error('[Dashboard] Firebase auth not available');
      if (loadingEl) loadingEl.innerHTML = '<p class="error">Firebase not initialized.</p>';
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      if (loadingEl) loadingEl.innerHTML = '<p>Please <a href="login.html">log in</a>.</p>';
      return;
    }

    // Show loading
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

    // Start listener
    listenToUserUpdates(user.uid);

    // Update bottom nav
    if (window.BottomNav && typeof window.BottomNav.updateBadges === 'function') {
      window.BottomNav.updateBadges(window.USER);
    }

    // Update header
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
          // Check DOM first
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

  // ================================================================
  // EXPOSE FOR DEBUGGING
  // ================================================================
  window.dashboard = dashboard;
  window.renderDashboard = renderDashboard;

  console.log('[Dashboard] Script loaded.');
})();