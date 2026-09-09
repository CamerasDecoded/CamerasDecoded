// operator-dashboard.js – View model, data loading, rendering, event handlers

(function() {
  'use strict';

  console.log('[Dashboard] Loading...');

  // ================================================================
  // DOM REFS
  // ================================================================
  const $ = (id) => document.getElementById(id);
  const qs = (sel) => document.querySelector(sel);

  const loadingEl = $('loadingState');
  const contentEl = $('dashboardContent');

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

      // 2. Load journey progress (for Continue Learning and Journey Next)
      const journeyData = await fetchJourneyData(userId);

      // 3. Load recent activity (from completed nodes or challenges)
      const activity = await fetchRecentActivity(userId);

      // Build the view model
      dashboard.user = {
        name: userData.displayName || userData.username || 'Operator',
        role: userData.role || 'Operator',
        tier: userData.tier || 'free',
        avatarUrl: userData.avatarUrl || ''
      };

      // Learning: from journey – use the first incomplete node as "continue"
      const learning = buildLearningData(journeyData, userData);
      dashboard.learning = learning;

      // Activity
      dashboard.activity = {
        streakDays: userData.dailyChallengeStreak || 0,
        xpToday: userData.xpToday || 0,
        xpGoal: userData.xpGoal || 100,
        totalXp: userData.totalPoints || 0,
        rank: userData.rank || '—'
      };

      // Journey
      dashboard.journey = {
        stage: journeyData.stage || 'Beginner',
        nextNode: journeyData.nextNode || 'Start your journey',
        completed: journeyData.completedNodes || 0,
        total: journeyData.totalNodes || 0
      };

      // Counts
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
      // Assume we fetch from userJourney subcollection, or from a global journey doc
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
        // Find next incomplete node
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
  // LEARNING DATA (Continue Learning hero)
  // ================================================================
  function buildLearningData(journeyData, userData) {
    // If we have a next node, use it
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
    // Otherwise, use the last completed node or a default
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
  // RECENT ACTIVITY (from Firestore)
  // ================================================================
  async function fetchRecentActivity(userId) {
    try {
      // This could be from a 'userActivity' collection, or from completed nodes.
      // For now, we'll get from user's completed nodes or challenge logs.
      const userJourneyDoc = await firebase.firestore().collection('userJourney').doc(userId).get();
      if (userJourneyDoc.exists) {
        const data = userJourneyDoc.data();
        const completed = data.completedNodes || [];
        // Return the last 3 as activity items
        return completed.slice(-3).map((nodeId, idx) => ({
          id: nodeId,
          text: `Completed node: ${nodeId}`,
          time: new Date(Date.now() - (idx * 3600000)).toLocaleString() // fake timestamp
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
    // 1. Continue Learning Hero
    renderHero();

    // 2. Stats Row
    renderStats();

    // 3. Goal & Journey
    renderGoalAndJourney();

    // 4. Recent Activity
    renderActivity();

    // 5. Collections
    renderCollections();

    // 6. AI Workbench
    renderAI();

    // 7. Challenge
    renderChallenge();

    // 8. Protocols
    renderProtocols();

    // 9. Referral
    renderReferral();

    // 10. Quiz
    renderQuiz();
  }

  function renderHero() {
    const l = dashboard.learning;
    const titleEl = $('heroLessonTitle');
    const progressEl = $('heroProgress');
    const labelEl = $('heroProgressLabel');
    const stepEl = $('heroStepInfo');
    const estimateEl = $('heroEstimate');
    const cta = $('heroCta');
    const hero = $('continueLearning');
    const empty = $('heroEmpty');
    const content = hero.querySelector('.hero-content');

    if (!l.lessonId || l.progressPct >= 100) {
      // Empty state
      content.style.display = 'none';
      empty.style.display = 'block';
      hero.classList.remove('chasing-border');
      return;
    }

    content.style.display = 'flex';
    empty.style.display = 'none';
    hero.classList.add('chasing-border');

    titleEl.textContent = l.title || 'Continue your journey';
    progressEl.value = l.progressPct;
    labelEl.textContent = Math.round(l.progressPct) + '%';
    stepEl.textContent = `Step ${l.step} of ${l.total}`;
    estimateEl.textContent = '~5 min'; // placeholder
    cta.href = l.href || 'journey.html';
  }

  function renderStats() {
    const a = dashboard.activity;
    $('statStreak').textContent = a.streakDays;
    $('statXpToday').textContent = a.xpToday;
    $('statRank').textContent = a.rank;
  }

  function renderGoalAndJourney() {
    const a = dashboard.activity;
    const j = dashboard.journey;

    $('goalCurrent').textContent = Math.min(a.xpToday, a.xpGoal);
    $('goalTarget').textContent = a.xpGoal;
    const goalPct = a.xpGoal > 0 ? (a.xpToday / a.xpGoal) * 100 : 0;
    $('goalProgressBar').value = Math.min(goalPct, 100);
    const remaining = Math.max(a.xpGoal - a.xpToday, 0);
    $('goalRemaining').textContent = `Remaining: ${remaining} XP`;

    $('journeyNodeName').textContent = j.nextNode || 'No next node';
    $('journeyProgressText').textContent = `${j.completed} / ${j.total} completed`;
    const jPct = j.total > 0 ? (j.completed / j.total) * 100 : 0;
    $('journeyProgressBar').value = Math.min(jPct, 100);
  }

  function renderActivity() {
    const list = $('activityList');
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
    $('protocolCount').textContent = c.protocols;
    $('snapshotCount').textContent = c.snapshots;
    $('postCount').textContent = c.posts;
  }

  function renderAI() {
    // This will be populated from userData later
    // For now, it's static but we can update from Firestore listener
    const userData = window.USER;
    if (!userData) return;
    const usage = userData.aiUsage || { total: 0 };
    const limit = userData.tier === 'pro' ? 50 : 5;
    const pct = Math.min((usage.total / limit) * 100, 100);
    $('aiUsed').textContent = usage.total;
    $('aiLimit').textContent = limit === 50 ? '∞' : limit;
    $('aiPercent').textContent = limit === 50 ? '∞' : Math.round(pct) + '%';
    $('aiFill').style.width = pct + '%';
    $('aiBadge').textContent = userData.tier === 'pro' ? 'Pro' : 'Free';
  }

  function renderChallenge() {
    // Placeholder – will be replaced by real data
    // We'll use the existing challenge logic from the old dashboard
    // This will be updated by the real-time listener
  }

  function renderProtocols() {
    // Placeholder – will be replaced
  }

  function renderReferral() {
    // Placeholder
  }

  function renderQuiz() {
    // Placeholder
  }

  // ================================================================
  // REAL-TIME LISTENER (for updates)
  // ================================================================
  function listenToUserUpdates(userId) {
    firebase.firestore().collection('users').doc(userId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          // Update dashboard view model and re-render only changed parts
          // For simplicity, we'll reload data (or we can do partial updates)
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
    const auth = window.auth;
    if (!auth) {
      console.error('[Dashboard] Firebase auth not available');
      loadingEl.innerHTML = '<p class="error">Firebase not initialized.</p>';
      return;
    }

    // Wait for user state
    const user = auth.currentUser;
    if (!user) {
      // Auth state listener will handle login
      loadingEl.innerHTML = '<p>Please <a href="login.html">log in</a>.</p>';
      return;
    }

    loadingEl.style.display = 'block';
    contentEl.style.display = 'none';

    const success = await loadDashboardData(user.uid);
    if (!success) {
      loadingEl.innerHTML = '<p class="error">Failed to load dashboard. <button onclick="location.reload()">Retry</button></p>';
      return;
    }

    // Render
    renderDashboard();

    // Show content
    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

    // Start real-time listener
    listenToUserUpdates(user.uid);

    // Update bottom nav (if needed)
    if (window.BottomNav && typeof window.BottomNav.updateBadges === 'function') {
      window.BottomNav.updateBadges(window.USER);
    }

    // Update header (already handled by header.js, but just in case)
    if (window.Header && typeof window.Header.setUserData === 'function') {
      window.Header.setUserData(user, window.USER);
    }

    console.log('[Dashboard] Ready.');
  }

  // ================================================================
  // AUTH STATE LISTENER
  // ================================================================
  if (window.auth) {
    window.auth.onAuthStateChanged((user) => {
      if (user) {
        // Ensure user-state.js has loaded
        if (window.USER && window.USER.isLoggedIn) {
          init();
        } else {
          // Wait for user state
          window.addEventListener('userStateReady', () => {
            init();
          });
        }
      } else {
        // Not logged in
        loadingEl.innerHTML = '<p>Please <a href="login.html">log in</a>.</p>';
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