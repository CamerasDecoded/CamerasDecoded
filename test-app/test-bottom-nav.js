// test-bottom-nav.js – Bulletproof Role‑Aware Bottom Navigation
// Adapted for /test-app/ file names
(function() {
  'use strict';

  // ---- CONFIGURATION ----
  const ROLE_MAP = {
    Operator: {
      dashboard: '/test-app/test-operator-dashboard.html',
      profile: '/test-app/test-profile.html'
    },
    Partner: {
      dashboard: '/test-app/test-partner-dashboard.html',
      profile: '/test-app/test-partner-profile.html'
    },
    Instructor: {
      dashboard: '/test-app/test-instructor-dashboard.html',
      profile: '/test-app/test-instructor-profile.html'
    }
  };

  const DEFAULT_ROLE = 'Operator';
  const CACHE_KEY = 'cameras_decoded_user_role';
  const CACHE_TTL = 3600000; // 1 hour

  let currentRole = DEFAULT_ROLE;
  let currentUser = null;
  let navInjected = false;
  let firebaseReady = false;

  // ---- Wait for Firebase ----
  function waitForFirebase(maxWaitMs = 5000) {
    return new Promise((resolve) => {
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
        firebaseReady = true;
        resolve(true);
        return;
      }
      let elapsed = 0;
      const interval = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
          firebaseReady = true;
          clearInterval(interval);
          resolve(true);
        } else if (elapsed >= maxWaitMs) {
          clearInterval(interval);
          resolve(false);
        }
        elapsed += 100;
      }, 100);
    });
  }

  // ---- Cache helpers ----
  function getCacheRole() {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { role, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) return role;
      }
    } catch (e) {}
    return null;
  }

  function setCacheRole(role) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ role, timestamp: Date.now() }));
    } catch (e) {}
  }

  // ---- Fetch role from Firestore ----
  async function fetchRole(userId) {
    if (!firebaseReady || !userId) return null;
    for (let i = 0; i < 3; i++) {
      try {
        const doc = await firebase.firestore().collection('users').doc(userId).get();
        if (doc.exists) {
          const role = doc.data().role || DEFAULT_ROLE;
          setCacheRole(role);
          return role;
        }
      } catch (e) {
        console.warn('Fetch role error:', e);
        if (i < 2) await new Promise(r => setTimeout(r, 500));
      }
    }
    return null;
  }

  // ---- Resolve user role ----
  async function resolveRole() {
    await waitForFirebase();
    if (!firebaseReady) return DEFAULT_ROLE;

    return new Promise((resolve) => {
      const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
        currentUser = user;
        if (!user) {
          unsubscribe();
          resolve(DEFAULT_ROLE);
          return;
        }

        const cachedRole = getCacheRole();
        if (cachedRole) {
          unsubscribe();
          resolve(cachedRole);
          return;
        }

        const role = await fetchRole(user.uid);
        unsubscribe();
        resolve(role || DEFAULT_ROLE);
      });
    });
  }

  // ---- Build nav HTML ----
  function buildNavHTML() {
    const config = ROLE_MAP[currentRole] || ROLE_MAP[DEFAULT_ROLE];
    return `
      <nav class="bottom-nav chasing-border-nav" role="navigation" aria-label="Main Navigation">
        <a href="/test-app/test-index.html" data-page="test-index.html" class="nav-link">
          <i class="fas fa-home"></i>
          <span>Home</span>
          <span class="badge-dot" id="badgeHome"></span>
        </a>
        <a href="${config.dashboard}" data-page="${config.dashboard.split('/').pop()}" class="nav-link" id="navDashboard">
          <i class="fas fa-th-large"></i>
          <span>Dashboard</span>
          <span class="badge-dot" id="badgeDashboard"></span>
        </a>
        <a href="/test-app/journey.html" data-page="journey.html" class="nav-link">
          <i class="fas fa-compass"></i>
          <span>Journey</span>
          <span class="badge-dot" id="badgeJourney"></span>
        </a>
        <a href="/test-app/cynetis-7.html" data-page="cynetis-7.html" class="nav-link">
          <i class="fas fa-camera"></i>
          <span>Cynetis-7</span>
          <span class="badge-dot" id="badgeCynetis"></span>
        </a>
        <a href="${config.profile}" data-page="${config.profile.split('/').pop()}" class="nav-link" id="navProfile">
          <i class="fas fa-user"></i>
          <span>Profile</span>
          <span class="badge-dot" id="badgeProfile"></span>
        </a>
      </nav>
    `;
  }

  // ---- Inject nav ----
  function injectNav() {
    if (navInjected) return;
    let container = document.getElementById('bottomNavContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bottomNavContainer';
      document.body.appendChild(container);
    }
    container.innerHTML = buildNavHTML();
    navInjected = true;
    setActiveNav();
    updateBadgesAsync();
  }

  // ---- Active state ----
  function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'test-index.html';
    document.querySelectorAll('.bottom-nav .nav-link').forEach(link => {
      const page = link.dataset.page;
      link.classList.toggle('active', page === currentPage);
    });
  }

  // ---- Badges ----
  async function updateBadgesAsync() {
    if (!firebaseReady) return;
    try {
      const annDoc = await firebase.firestore().collection('admin').doc('announcement').get();
      const hasAnnouncement = annDoc.exists && annDoc.data()?.active === true;
      const homeLink = document.querySelector('.bottom-nav a[href="/test-app/test-index.html"]');
      if (homeLink) homeLink.classList.toggle('show-badge', hasAnnouncement);

      const hasNewFeatures = !localStorage.getItem('cynetis_visited');
      const cynetisLink = document.querySelector('.bottom-nav a[href="/test-app/cynetis-7.html"]');
      if (cynetisLink) cynetisLink.classList.toggle('show-badge', hasNewFeatures);

      if (currentUser) {
        const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          const hasAlerts = !data.tourCompleted || !data.learningJourney?.primaryGoal || (data.totalPoints || 0) < 10;
          ['navDashboard', 'navProfile'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('show-badge', hasAlerts);
          });
          const journeyLink = document.querySelector('.bottom-nav a[href="/test-app/journey.html"]');
          if (journeyLink) journeyLink.classList.toggle('show-badge', hasAlerts);
        }
      }
    } catch (e) {
      console.warn('Badge update error:', e);
    }
  }

  // ---- Listen to auth changes ----
  function listenToAuthChanges() {
    if (!firebaseReady) return;
    firebase.auth().onAuthStateChanged(async (user) => {
      const prevRole = currentRole;
      currentUser = user;

      if (!user) {
        currentRole = DEFAULT_ROLE;
        navInjected = false;
        injectNav();
        return;
      }

      let role = getCacheRole() || await fetchRole(user.uid) || DEFAULT_ROLE;
      currentRole = role;
      if (role !== prevRole) {
        navInjected = false;
        injectNav();
      } else {
        updateBadgesAsync();
      }
    });
  }

  // ---- Mark Cynetis visited ----
  function setupCynetisVisited() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('.bottom-nav a[href="/test-app/cynetis-7.html"]');
      if (link) {
        localStorage.setItem('cynetis_visited', 'true');
        link.classList.remove('show-badge');
      }
    });
  }

  // ---- Public API ----
  window.BottomNav = {
    init: async function() {
      currentRole = await resolveRole();
      injectNav();
      listenToAuthChanges();
      setupCynetisVisited();
    },
    inject: injectNav,
    setActive: setActiveNav,
    updateBadges: updateBadgesAsync,
    rebuild: async function() {
      navInjected = false;
      currentRole = await resolveRole();
      injectNav();
    }
  };

  // ---- Auto‑init ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.BottomNav.init());
  } else {
    window.BottomNav.init();
  }

  window.addEventListener('popstate', setActiveNav);
})();