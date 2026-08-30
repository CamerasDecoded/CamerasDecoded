// test-bottom-nav.js – Role‑aware bottom nav for mobile
(function() {
  'use strict';

  // ---- Role‑based dashboard mapping ----
  const DASHBOARD_MAP = {
    'Operator': '/test-app/test-operator-dashboard.html',
    'Partner': '/test-app/test-partner-dashboard.html',
    'Instructor': '/test-app/test-instructor-dashboard.html'
  };

  // ---- Build nav items based on role ----
  function getNavLinks(role) {
    // Default public links (visible to everyone)
    const publicLinks = [
      { label: 'Home', icon: 'fa-regular fa-house', href: '/test-app/test-index.html', page: 'test-index.html' }
    ];

    // Role‑specific links
    let roleLinks = [];
    if (role === 'Operator') {
      roleLinks = [
        { label: 'Dashboard', icon: 'fa-regular fa-chart-simple', href: DASHBOARD_MAP['Operator'], page: 'test-operator-dashboard.html' },
        { label: 'Journey', icon: 'fa-regular fa-route', href: '/test-app/journey.html', page: 'journey.html' },
        { label: 'Cynetis-7', icon: 'fa-regular fa-robot', href: '/test-app/cynetis-7.html', page: 'cynetis-7.html' },
        { label: 'Profile', icon: 'fa-regular fa-id-card', href: '/test-app/test-profile.html', page: 'test-profile.html' }
      ];
    } else if (role === 'Partner') {
      roleLinks = [
        { label: 'Dashboard', icon: 'fa-regular fa-chart-simple', href: DASHBOARD_MAP['Partner'], page: 'test-partner-dashboard.html' },
        { label: 'Profile', icon: 'fa-regular fa-id-card', href: '/test-app/test-partner-profile.html', page: 'test-partner-profile.html' },
        { label: 'Billing', icon: 'fa-regular fa-credit-card', href: '/test-app/billing.html', page: 'billing.html' }
      ];
    } else if (role === 'Instructor') {
      roleLinks = [
        { label: 'Dashboard', icon: 'fa-regular fa-chart-simple', href: DASHBOARD_MAP['Instructor'], page: 'test-instructor-dashboard.html' },
        { label: 'Profile', icon: 'fa-regular fa-id-card', href: '/test-app/test-instructor-profile.html', page: 'test-instructor-profile.html' },
        { label: 'Students', icon: 'fa-regular fa-users', href: '/test-app/students.html', page: 'students.html' },
        { label: 'Lessons', icon: 'fa-regular fa-book', href: '/test-app/lessons.html', page: 'lessons.html' }
      ];
    } else {
      // Guest / not logged in: show only public links + maybe login/signup
      // For now, just show Home + Login/Signup (we can add them)
      return publicLinks.concat([
        { label: 'Login', icon: 'fa-regular fa-right-to-bracket', href: '/test-app/test-login.html', page: 'test-login.html' },
        { label: 'Sign Up', icon: 'fa-regular fa-user-plus', href: '/test-app/test-signup.html', page: 'test-signup.html' }
      ]);
    }

    return publicLinks.concat(roleLinks);
  }

  // ---- Inject bottom nav ----
  function renderBottomNav() {
    const container = document.getElementById('bottomNavContainer');
    if (!container) return;

    // Get current user role from window.USER
    const role = window.USER && window.USER.isLoggedIn ? window.USER.role : null;
    const links = getNavLinks(role);

    // Build HTML
    let navHTML = `<nav class="bottom-nav chasing-border-nav">`;
    links.forEach(link => {
      // Determine if this link is the current page
      const currentPage = window.location.pathname.split('/').pop() || 'test-index.html';
      const isActive = link.page === currentPage ? 'active' : '';
      navHTML += `
        <a href="${link.href}" class="nav-item ${isActive}" data-page="${link.page}">
          <i class="${link.icon}"></i>
          <span>${link.label}</span>
        </a>
      `;
    });
    navHTML += `</nav>`;

    container.innerHTML = navHTML;

    // Re-apply badge logic (existing)
    updateBadges();
  }

  // ---- Badge logic (unchanged from original) ----
  async function updateBadges() {
    if (typeof firebase === 'undefined' || !firebase.firestore) return;
    const db = firebase.firestore();
    try {
      // Announcement badge on Home
      const annDoc = await db.collection('admin').doc('announcement').get();
      const hasAnnouncement = annDoc.exists && annDoc.data().active === true;
      const homeLink = document.querySelector('.bottom-nav a[data-page="test-index.html"]');
      if (homeLink) homeLink.classList.toggle('show-badge', hasAnnouncement);

      // User‑specific badges
      const user = firebase.auth().currentUser;
      if (user) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          const hasAlerts = !data.tourCompleted ||
                            !data.learningJourney?.primaryGoal ||
                            (data.totalPoints || 0) < 10;
          // Find dashboard link (any page ending with -dashboard.html)
          const dashboardLink = document.querySelector('.bottom-nav a[href$="-dashboard.html"]');
          const profileLink = document.querySelector('.bottom-nav a[data-page$="-profile.html"]');
          if (dashboardLink) dashboardLink.classList.toggle('show-badge', hasAlerts);
          if (profileLink) profileLink.classList.toggle('show-badge', hasAlerts);
        }
      }

      // Cynetis-7 badge (if not visited)
      const hasNewFeatures = !localStorage.getItem('cynetis_visited');
      const cynetisLink = document.querySelector('.bottom-nav a[data-page="cynetis-7.html"]');
      if (cynetisLink) cynetisLink.classList.toggle('show-badge', hasNewFeatures);

    } catch (e) {
      console.warn('Badge update error:', e);
    }
  }

  // ---- Mark Cynetis as visited on click ----
  document.addEventListener('click', function(e) {
    const link = e.target.closest('.bottom-nav a[data-page="cynetis-7.html"]');
    if (link) {
      localStorage.setItem('cynetis_visited', 'true');
      link.classList.remove('show-badge');
    }
  });

  // ---- Expose init ----
  window.BottomNav = {
    render: renderBottomNav,
    updateBadges: updateBadges,
    init: function() {
      renderBottomNav();
    }
  };

  // ---- Auto‑init when DOM ready ----
  function init() {
    // If window.USER is already available, render immediately
    if (window.USER) {
      renderBottomNav();
    } else {
      // Wait for userStateReady
      window.addEventListener('userStateReady', () => {
        renderBottomNav();
      });
    }
    // Also listen for resize (to re‑render if needed, but not necessary)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---- Re‑render when user state changes (e.g., login/logout) ----
  window.addEventListener('userStateReady', () => {
    renderBottomNav();
  });

})();