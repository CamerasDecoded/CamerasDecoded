// ================================================================
// SHARED BOTTOM NAVIGATION – ROLE‑AWARE
// ================================================================
// This file expects Firebase (firebase.auth, firebase.firestore)
// to be initialized globally before this script runs.
// ================================================================

(function() {
  'use strict';

  // ---- HTML template (placeholders for dynamic links) ----
  const NAV_HTML = `
    <nav class="bottom-nav chasing-border-nav" id="bottomNav" role="navigation" aria-label="Main Navigation">
      <!-- Home -->
      <a href="index.html" data-page="index.html">
        <i class="fas fa-home"></i>
        <span>Home</span>
        <span class="badge-dot" id="badgeHome"></span>
      </a>
      <!-- Dashboard (dynamic) -->
      <a href="#" data-page="dashboard" id="navDashboard">
        <i class="fas fa-th-large"></i>
        <span>Dashboard</span>
        <span class="badge-dot" id="badgeDashboard"></span>
      </a>
      <!-- Journey -->
      <a href="learning-journey.html" data-page="learning-journey.html">
        <i class="fas fa-compass"></i>
        <span>Journey</span>
        <span class="badge-dot" id="badgeJourney"></span>
      </a>
      <!-- Cynetis-7 -->
      <a href="cynetis-7.html" data-page="cynetis-7.html">
        <i class="fas fa-camera"></i>
        <span>Cynetis-7</span>
        <span class="badge-dot" id="badgeCynetis"></span>
      </a>
      <!-- Profile (dynamic) -->
      <a href="#" data-page="profile" id="navProfile">
        <i class="fas fa-user"></i>
        <span>Profile</span>
        <span class="badge-dot" id="badgeProfile"></span>
      </a>
    </nav>
  `;

  // ---- Mapping role to dashboard URL ----
  const DASHBOARD_MAP = {
    'Operator': 'operator-dashboard.html',
    'Partner': 'partner-dashboard.html',
    'Instructor': 'instructor-dashboard.html'
  };

  const PROFILE_MAP = {
    'Operator': 'profile.html',
    'Partner': 'partner-profile.html',
    'Instructor': 'instructor-profile.html'
  };

  // ---- Get user role from Firestore ----
  async function getUserRole() {
    if (typeof firebase === 'undefined' || !firebase.auth) return null;
    const user = firebase.auth().currentUser;
    if (!user) return null;
    try {
      const db = firebase.firestore();
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists) {
        return doc.data().role || 'Operator';
      }
    } catch (e) {
      console.warn('Could not fetch user role:', e);
    }
    return null;
  }

  // ---- Update dynamic links based on role ----
  async function updateDynamicLinks() {
    const role = await getUserRole();
    const dashboardUrl = DASHBOARD_MAP[role] || 'operator-dashboard.html';
    const profileUrl = PROFILE_MAP[role] || 'profile.html';

    const dashboardLink = document.getElementById('navDashboard');
    const profileLink = document.getElementById('navProfile');

    if (dashboardLink) {
      dashboardLink.href = dashboardUrl;
      dashboardLink.dataset.page = dashboardUrl;
    }
    if (profileLink) {
      profileLink.href = profileUrl;
      profileLink.dataset.page = profileUrl;
    }

    // Update active state after links change
    setActiveNav();
  }

  // ---- Inject nav into the page ----
  function injectNav() {
    if (document.getElementById('bottomNav')) return;
    const container = document.getElementById('bottomNavContainer');
    if (container) {
      container.innerHTML = NAV_HTML;
    } else {
      const div = document.createElement('div');
      div.id = 'bottomNavContainer';
      div.innerHTML = NAV_HTML;
      document.body.appendChild(div);
    }
    // Update links as soon as injected
    updateDynamicLinks();
  }

  // ---- Set active link based on current URL ----
  function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.bottom-nav a').forEach(link => {
      const href = link.getAttribute('href');
      // For dynamic links, we compare the data-page attribute if href is '#'
      const page = link.dataset.page || href;
      if (page === path || href === path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ---- Update notification badges (requires Firestore) ----
  async function updateNotificationBadges(userData) {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      console.warn('Firebase not available for badge updates.');
      return;
    }
    const db = firebase.firestore();

    try {
      // 1. Home – admin announcement
      const annDoc = await db.collection('admin').doc('announcement').get();
      const hasAnnouncement = annDoc.exists && annDoc.data().active === true;
      const homeLink = document.querySelector('.bottom-nav a[href="index.html"]');
      if (homeLink) homeLink.classList.toggle('show-badge', hasAnnouncement);

      // 2. Dashboard, Journey, Profile – alerts based on user data
      if (userData) {
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

      // 3. Cynetis-7 – new features (localStorage flag)
      const hasNewFeatures = !localStorage.getItem('cynetis_visited');
      const cynetisLink = document.querySelector('.bottom-nav a[href="cynetis-7.html"]');
      if (cynetisLink) cynetisLink.classList.toggle('show-badge', hasNewFeatures);

    } catch (e) {
      console.warn('Badge update error:', e);
    }
  }

  // ---- Mark Cynetis as visited when clicked ----
  document.addEventListener('click', function(e) {
    const link = e.target.closest('.bottom-nav a[href="cynetis-7.html"]');
    if (link) {
      localStorage.setItem('cynetis_visited', 'true');
      link.classList.remove('show-badge');
    }
  });

  // ---- Public API ----
  window.BottomNav = {
    inject: injectNav,
    setActive: setActiveNav,
    updateBadges: updateNotificationBadges,
    updateLinks: updateDynamicLinks,
    init: function(userData) {
      injectNav();
      setActiveNav();
      if (userData) {
        updateNotificationBadges(userData);
      } else if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
          firebase.firestore().collection('users').doc(user.uid).get()
            .then(doc => {
              if (doc.exists) {
                updateNotificationBadges(doc.data());
                // Also ensure links are updated (in case they weren't yet)
                updateDynamicLinks();
              }
            })
            .catch(() => {});
        }
      }
    }
  };

  // ---- Auto‑init when DOM is ready ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectNav();
      setActiveNav();
      // If Firebase is already loaded, try to fetch user data
      if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
          firebase.firestore().collection('users').doc(user.uid).get()
            .then(doc => {
              if (doc.exists) {
                updateNotificationBadges(doc.data());
                updateDynamicLinks();
              }
            })
            .catch(() => {});
        }
      }
    });
  } else {
    // DOM already ready
    injectNav();
    setActiveNav();
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const user = firebase.auth().currentUser;
      if (user) {
        firebase.firestore().collection('users').doc(user.uid).get()
          .then(doc => {
            if (doc.exists) {
              updateNotificationBadges(doc.data());
              updateDynamicLinks();
            }
          })
          .catch(() => {});
      }
    }
  }

})();