// bottom-nav.js – Premium instructor style with auth/role logic
(function() {
  // ============================================================
  // 1. HTML TEMPLATE (fixed 5 links)
  // ============================================================
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

  // ============================================================
  // 2. INJECTION
  // ============================================================
  function injectNav() {
    const container = document.getElementById('bottomNavContainer');
    if (!container) {
      console.warn('bottomNavContainer not found – nav not injected.');
      return;
    }
    container.innerHTML = NAV_HTML;
    updateActiveLink();
    updateCartBadge();
  }

  // ============================================================
  // 3. ACTIVE LINK DETECTION (role‑aware)
  // ============================================================
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

  // ============================================================
  // 4. CART BADGE (kept for future)
  // ============================================================
  function updateCartBadge() {
    try {
      const cart = JSON.parse(localStorage.getItem('cameras_decoded_cart') || '[]');
      const totalItems = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
      // You could add a cart link if desired.
    } catch (e) { /* ignore */ }
  }

  // ============================================================
  // 5. ROLE‑BASED DASHBOARD + PROFILE LINKS
  // ============================================================
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
      // If you have a dynamic profile page with UID, adjust here.
      // For now, keep instructor-profile.html (or profile.html)
      profileLink.setAttribute('href', 'instructor-profile.html');
      profileLink.setAttribute('data-page', 'instructor-profile.html');
    }
  }

  // ============================================================
  // 6. BADGE DOTS (public API)
  // ============================================================
  function updateBadges(userData) {
    const badges = {
      badgeHome: false,
      badgeDashboard: false,
      badgeJourney: false,
      badgeCynetis: false,
      badgeProfile: false
    };

    // Customise these conditions
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

  // ============================================================
  // 7. EXPOSE GLOBAL API
  // ============================================================
  window.BottomNav = {
    inject: injectNav,
    updateBadges: updateBadges,
    updateActiveLink: updateActiveLink,
    updateCartBadge: updateCartBadge
  };

  // ============================================================
  // 8. AUTO‑INJECT ON DOM READY
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNav);
  } else {
    injectNav();
  }

  window.addEventListener('storage', function(e) {
    if (e.key === 'cameras_decoded_cart') updateCartBadge();
  });
})();