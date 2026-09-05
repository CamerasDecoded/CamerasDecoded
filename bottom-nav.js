// bottom-nav.js – Premium instructor style with auth/role logic
(function() {
  console.log('[BottomNav] Script loaded.');

  const NAV_HTML = `
    <nav class="bottom-nav chasing-border-nav" role="navigation" aria-label="Main Navigation">
      <a href="index.html" data-page="index.html" class="nav-link show-badge">
        <i class="fa-regular fa-house"></i>
        <span>Home</span>
        <span class="badge-dot" id="badgeHome"></span>
      </a>
      <a href="#" data-page="dashboard" class="nav-link show-badge" id="navDashboard">
        <i class="fa-solid fa-chart-simple"></i>
        <span>Dashboard</span>
        <span class="badge-dot" id="badgeDashboard"></span>
      </a>
      <a href="journey.html" data-page="journey.html" class="nav-link show-badge">
        <i class="fa-regular fa-compass"></i>
        <span>Journey</span>
        <span class="badge-dot" id="badgeJourney"></span>
      </a>
      <a href="cynetis-7.html" data-page="cynetis-7.html" class="nav-link">
        <i class="fa-regular fa-camera"></i>
        <span>Cynetis-7</span>
        <span class="badge-dot" id="badgeCynetis"></span>
      </a>
      <a href="#" data-page="profile" class="nav-link active show-badge" id="navProfile">
        <i class="fa-regular fa-user"></i>
        <span>Profile</span>
        <span class="badge-dot" id="badgeProfile"></span>
      </a>
    </nav>
  `;

  function injectNav() {
    const container = document.getElementById('bottomNavContainer');
    if (!container) {
      console.warn('[BottomNav] Container #bottomNavContainer not found.');
      return;
    }
    console.log('[BottomNav] Injecting nav into container.');
    container.innerHTML = NAV_HTML;
    updateActiveLink();
    updateCartBadge();
  }

  function updateActiveLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.bottom-nav .nav-link');
    links.forEach(link => {
      const page = link.getAttribute('data-page');
      link.classList.remove('active');
      if (page === 'dashboard' && currentPath.includes('dashboard')) {
        link.classList.add('active');
      } else if (page === 'profile' && currentPath.includes('profile')) {
        link.classList.add('active');
      } else if (page === currentPath) {
        link.classList.add('active');
      }
    });
  }

  function updateCartBadge() {
    try {
      const cart = JSON.parse(localStorage.getItem('cameras_decoded_cart') || '[]');
      const totalItems = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
      // (future use)
    } catch (e) { /* ignore */ }
  }

  function updateDashboardLink(role) {
    const map = {
      'Operator': 'operator-dashboard.html',
      'Instructor': 'instructor-dashboard.html',
      'Partner': 'partner-dashboard.html',
      'Admin': 'admin-dashboard.html'
    };
    const url = map[role] || 'operator-dashboard.html';
    const dashLink = document.querySelector('.bottom-nav #navDashboard');
    if (dashLink) {
      dashLink.setAttribute('href', url);
      dashLink.setAttribute('data-page', url);
    }
  }

  function updateProfileLink(uid) {
    const profileLink = document.querySelector('.bottom-nav #navProfile');
    if (profileLink) {
      profileLink.setAttribute('href', 'instructor-profile.html');
      profileLink.setAttribute('data-page', 'instructor-profile.html');
    }
  }

  function updateBadges(userData) {
    console.log('[BottomNav] updateBadges called with:', userData);
    const badges = {
      badgeHome: false,
      badgeDashboard: false,
      badgeJourney: false,
      badgeCynetis: false,
      badgeProfile: false
    };
    if (userData?.unreadAnnouncements) badges.badgeHome = true;
    if (userData?.pendingChallenges) badges.badgeJourney = true;
    if (userData?.unreadMessages) badges.badgeProfile = true;

    Object.keys(badges).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = badges[id] ? 'inline-block' : 'none';
      }
    });

    if (userData?.role) updateDashboardLink(userData.role);
    if (userData?.uid) updateProfileLink(userData.uid);
  }

  window.BottomNav = {
    inject: injectNav,
    updateBadges: updateBadges,
    updateActiveLink: updateActiveLink,
    updateCartBadge: updateCartBadge
  };

  // Auto-inject on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNav);
  } else {
    injectNav();
  }

  window.addEventListener('storage', function(e) {
    if (e.key === 'cameras_decoded_cart') updateCartBadge();
  });

  console.log('[BottomNav] Initialized.');
})();