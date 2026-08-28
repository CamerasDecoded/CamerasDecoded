// ================================================================
// BOTTOM NAV – BULLETPROOF VERSION
// ================================================================
// Single source of truth for role-aware routing
// Handles Firebase async, caching, auth state changes
// Works on every page with no race conditions
// ================================================================

(function() {
  'use strict';

  // ---- CONFIGURATION ----
  const ROLE_MAP = {
    Operator: {
      dashboard: 'operator-dashboard.html',
      profile: 'profile.html'
    },
    Partner: {
      dashboard: 'partner-dashboard.html',
      profile: 'partner-profile.html'
    },
    Instructor: {
      dashboard: 'instructor-dashboard.html',
      profile: 'instructor-profile.html'
    }
  };

  const DEFAULT_ROLE = 'Operator';
  const CACHE_KEY = 'cameras_decoded_user_role';
  const CACHE_TTL = 3600000; // 1 hour in ms

  // ---- STATE ----
  let currentRole = DEFAULT_ROLE;
  let currentUser = null;
  let navInjected = false;
  let firebaseReady = false;
  let authStateResolved = false;

  // ================================================================
  // UTILITY: Wait for Firebase to be ready
  // ================================================================
  function waitForFirebase(maxWaitMs = 5000) {
    return new Promise((resolve) => {
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
        firebaseReady = true;
        resolve(true);
        return;
      }

      let elapsed = 0;
      const checkInterval = 100;
      const maxAttempts = maxWaitMs / checkInterval;
      let attempts = 0;

      const interval = setInterval(() => {
        attempts++;
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
          firebaseReady = true;
          clearInterval(interval);
          resolve(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          resolve(false); // Firebase never loaded, continue anyway
        }
      }, checkInterval);
    });
  }

  // ================================================================
  // UTILITY: Get role from cache or Firestore
  // ================================================================
  async function getRoleFromCache() {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { role, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          return role;
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    return null;
  }

  function setCacheRole(role) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        role,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  }

  // ================================================================
  // FETCH ROLE FROM FIRESTORE (with retries)
  // ================================================================
  async function getRoleFromFirestore(userId, maxRetries = 3) {
    if (!firebaseReady || !userId) return null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const doc = await firebase.firestore().collection('users').doc(userId).get();
        if (doc.exists) {
          const role = doc.data().role || DEFAULT_ROLE;
          setCacheRole(role);
          return role;
        }
      } catch (e) {
        console.warn(`Firestore read attempt ${attempt + 1} failed:`, e);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
        }
      }
    }
    return null;
  }

  // ================================================================
  // RESOLVE USER ROLE (main logic)
  // ================================================================
  async function resolveUserRole() {
    await waitForFirebase();

    if (!firebaseReady) {
      currentRole = DEFAULT_ROLE;
      return currentRole;
    }

    // Wait for auth state to be determined
    return new Promise((resolve) => {
      const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
        currentUser = user;
        authStateResolved = true;

        if (!user) {
          // Not logged in – use default
          currentRole = DEFAULT_ROLE;
          unsubscribe();
          resolve(currentRole);
          return;
        }

        // User is logged in
        // 1. Try cache first
        let cachedRole = await getRoleFromCache();
        if (cachedRole) {
          currentRole = cachedRole;
          unsubscribe();
          resolve(currentRole);
          return;
        }

        // 2. Fetch from Firestore
        let firestoreRole = await getRoleFromFirestore(user.uid);
        if (firestoreRole) {
          currentRole = firestoreRole;
          unsubscribe();
          resolve(currentRole);
          return;
        }

        // 3. Default fallback
        currentRole = DEFAULT_ROLE;
        unsubscribe();
        resolve(currentRole);
      });
    });
  }

  // ================================================================
  // BUILD NAV HTML (with resolved role)
  // ================================================================
  function buildNavHTML() {
    const roleConfig = ROLE_MAP[currentRole] || ROLE_MAP[DEFAULT_ROLE];
    const dashboardHref = roleConfig.dashboard;
    const profileHref = roleConfig.profile;

    return `
      <nav class="bottom-nav chasing-border-nav" id="bottomNav" role="navigation" aria-label="Main Navigation">
        <a href="index.html" data-page="index.html" class="nav-link">
          <i class="fas fa-home"></i>
          <span>Home</span>
          <span class="badge-dot" id="badgeHome"></span>
        </a>
        <a href="${dashboardHref}" data-page="${dashboardHref}" class="nav-link" id="navDashboard">
          <i class="fas fa-th-large"></i>
          <span>Dashboard</span>
          <span class="badge-dot" id="badgeDashboard"></span>
        </a>
        <a href="learning-journey.html" data-page="learning-journey.html" class="nav-link">
          <i class="fas fa-compass"></i>
          <span>Journey</span>
          <span class="badge-dot" id="badgeJourney"></span>
        </a>
        <a href="cynetis-7.html" data-page="cynetis-7.html" class="nav-link">
          <i class="fas fa-camera"></i>
          <span>Cynetis-7</span>
          <span class="badge-dot" id="badgeCynetis"></span>
        </a>
        <a href="${profileHref}" data-page="${profileHref}" class="nav-link" id="navProfile">
          <i class="fas fa-user"></i>
          <span>Profile</span>
          <span class="badge-dot" id="badgeProfile"></span>
        </a>
      </nav>
    `;
  }

  // ================================================================
  // INJECT NAV INTO DOM
  // ================================================================
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

    // Set active state immediately
    setActiveNav();

    // Update badges asynchronously (don't block)
    updateBadgesAsync();
  }

  // ================================================================
  // SET ACTIVE NAV LINK
  // ================================================================
  function setActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.bottom-nav .nav-link');

    links.forEach(link => {
      const page = link.dataset.page || link.getAttribute('href');
      if (page === currentPath || page.endsWith(currentPath)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ================================================================
  // UPDATE BADGES (async, non-blocking)
  // ================================================================
  async function updateBadgesAsync() {
    if (!firebaseReady) return;

    try {
      // Admin announcement badge
      const annDoc = await firebase.firestore().collection('admin').doc('announcement').get();
      const hasAnnouncement = annDoc.exists && annDoc.data()?.active === true;
      const homeLink = document.querySelector('.bottom-nav a[href="index.html"]');
      if (homeLink) homeLink.classList.toggle('show-badge', hasAnnouncement);

      // Cynetis badge (visited flag)
      const hasNewFeatures = !localStorage.getItem('cynetis_visited');
      const cynetisLink = document.querySelector('.bottom-nav a[href="cynetis-7.html"]');
      if (cynetisLink) cynetisLink.classList.toggle('show-badge', hasNewFeatures);

      // User profile/journey badges
      if (currentUser) {
        const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const hasAlerts = !userData.tourCompleted ||
                           !userData.learningJourney?.primaryGoal ||
                           (userData.totalPoints || 0) < 10;

          const dashboardLink = document.getElementById('navDashboard');
          const journeyLink = document.querySelector('.bottom-nav a[href="learning-journey.html"]');
          const profileLink = document.getElementById('navProfile');

          if (dashboardLink) dashboardLink.classList.toggle('show-badge', hasAlerts);
          if (journeyLink) journeyLink.classList.toggle('show-badge', hasAlerts);
          if (profileLink) profileLink.classList.toggle('show-badge', hasAlerts);
        }
      }
    } catch (e) {
      console.warn('Badge update error:', e);
    }
  }

  // ================================================================
  // REBUILD NAV ON AUTH STATE CHANGE
  // ================================================================
  function listenToAuthStateChanges() {
    if (!firebaseReady) return;

    firebase.auth().onAuthStateChanged(async (user) => {
      const previousRole = currentRole;
      const previousUser = currentUser;

      currentUser = user;

      if (!user) {
        // User logged out
        currentRole = DEFAULT_ROLE;
        injectNav(); // Rebuild with default role
        return;
      }

      // User logged in – resolve their role
      let cachedRole = await getRoleFromCache();
      if (!cachedRole) {
        cachedRole = await getRoleFromFirestore(user.uid);
      }

      if (cachedRole) {
        currentRole = cachedRole;
      } else {
        currentRole = DEFAULT_ROLE;
      }

      // Rebuild nav if role changed or user changed
      if (currentRole !== previousRole || user.uid !== previousUser?.uid) {
        navInjected = false; // Force re-injection
        injectNav();
      }

      // Update badges
      updateBadgesAsync();
    });
  }

  // ================================================================
  // MARK CYNETIS AS VISITED
  // ================================================================
  function setupCynetisVisited() {
    document.addEventListener('click', function(e) {
      const link = e.target.closest('.bottom-nav a[href="cynetis-7.html"]');
      if (link) {
        localStorage.setItem('cynetis_visited', 'true');
        link.classList.remove('show-badge');
      }
    });
  }

  // ================================================================
  // PUBLIC API
  // ================================================================
  window.BottomNav = {
    init: async function() {
      await resolveUserRole();
      injectNav();
      listenToAuthStateChanges();
      setupCynetisVisited();
    },
    inject: injectNav,
    setActive: setActiveNav,
    updateBadges: updateBadgesAsync,
    getRole: () => currentRole,
    getUser: () => currentUser,
    rebuild: async function() {
      navInjected = false;
      await resolveUserRole();
      injectNav();
    }
  };

  // ================================================================
  // AUTO-INIT
  // ================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.BottomNav.init();
    });
  } else {
    // DOM already loaded
    window.BottomNav.init();
  }

  // Re-set active nav on navigation
  window.addEventListener('popstate', () => {
    setActiveNav();
  });

})();
