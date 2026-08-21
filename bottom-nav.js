// ================================================================
// SHARED BOTTOM NAVIGATION
// ================================================================
// This file expects Firebase (firebase.auth, firebase.firestore)
// to be initialized globally before this script runs.
// ================================================================

(function() {
  'use strict';

  // ---- HTML template ----
  const NAV_HTML = `
    <nav class="bottom-nav chasing-border-nav" id="bottomNav" role="navigation" aria-label="Main Navigation">
      <!-- Home -->
      <a href="index.html" data-page="index.html">
        <i class="fas fa-home"></i>
        <span>Home</span>
        <span class="badge-dot" id="badgeHome"></span>
      </a>
      <!-- Dashboard -->
      <a href="operator-dashboard.html" data-page="operator-dashboard.html">
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
      <!-- Profile -->
      <a href="profile.html" data-page="profile.html">
        <i class="fas fa-user"></i>
        <span>Profile</span>
        <span class="badge-dot" id="badgeProfile"></span>
      </a>
    </nav>
  `;

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
  }

  // ---- Set active link based on current URL ----
  function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.bottom-nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === path) {
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

        const dashboardLink = document.querySelector('.bottom-nav a[href="operator-dashboard.html"]');
        const journeyLink = document.querySelector('.bottom-nav a[href="journey.html"]');
        const profileLink = document.querySelector('.bottom-nav a[href="profile.html"]');

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
      // optionally hide the badge immediately
      link.classList.remove('show-badge');
    }
  });

  // ---- Public API ----
  window.BottomNav = {
    inject: injectNav,
    setActive: setActiveNav,
    updateBadges: updateNotificationBadges,
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
              if (doc.exists) updateNotificationBadges(doc.data());
            })
            .catch(() => {});
        }
      }
    }
  };

  // ---- Auto‑init when DOM is ready ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Inject and set active, but defer badge fetch until Firebase is ready
      injectNav();
      setActiveNav();
      // If Firebase is already loaded, try to fetch user data
      if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
          firebase.firestore().collection('users').doc(user.uid).get()
            .then(doc => {
              if (doc.exists) updateNotificationBadges(doc.data());
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
            if (doc.exists) updateNotificationBadges(doc.data());
          })
          .catch(() => {});
      }
    }
  }

})();