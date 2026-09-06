// bottom-nav.js – Premium with auth/role logic and reliable Font Awesome 6 icons
(function() {
  'use strict';
  
  console.log('[BottomNav] Script loaded.');

  const ROLE_MAP = {
    'Operator': {
      dashboard: 'operator-dashboard.html',
      profile: 'profile.html'
    },
    'Partner': {
      dashboard: 'partner-dashboard.html',
      profile: 'partner-profile.html'
    },
    'Instructor': {
      dashboard: 'instructor-dashboard.html',
      profile: 'instructor-profile.html'
    },
    'Admin': {
      dashboard: 'admin-dashboard.html',
      profile: 'admin-profile.html'
    },
    'admin': {
      dashboard: 'admin-dashboard.html',
      profile: 'admin-profile.html'
    }
  };

  let currentRole = 'Operator';
  let currentUser = null;

  // Wait for Font Awesome to be available
  function waitForFontAwesome(maxWait = 3000) {
    return new Promise((resolve) => {
      if (typeof FontAwesome !== 'undefined' || document.querySelector('.fa-house')) {
        resolve(true);
        return;
      }
      let elapsed = 0;
      const check = setInterval(() => {
        if (document.querySelector('link[href*="font-awesome"]')?.sheet || elapsed > maxWait) {
          clearInterval(check);
          resolve(true);
        }
        elapsed += 100;
      }, 100);
    });
  }

  function buildNavHTML() {
    const config = ROLE_MAP[currentRole] || ROLE_MAP['Operator'];
    
    return `
      <nav class="bottom-nav chasing-border-nav" role="navigation" aria-label="Main Navigation">
        <a href="index.html" data-page="index.html" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none">
            <path d="M3 10h18M3 10l2-6h14l2 6M3 10v9a1 1 0 001 1h16a1 1 0 001-1v-9M9 14v3M15 14v3"/>
          </svg>
          <span>Home</span>
          <span class="badge-dot" id="badgeHome"></span>
        </a>
        <a href="${config.dashboard}" data-page="${config.dashboard}" class="nav-link" id="navDashboard">
          <svg class="nav-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none">
            <path d="M3 12h4v9H3zM9 6h4v15H9zM15 3h4v18h-4z"/>
          </svg>
          <span>Dashboard</span>
          <span class="badge-dot" id="badgeDashboard"></span>
        </a>
        <a href="journey.html" data-page="journey.html" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7v5l3 2"/>
          </svg>
          <span>Journey</span>
          <span class="badge-dot" id="badgeJourney"></span>
        </a>
        <a href="cynetis-7.html" data-page="cynetis-7.html" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none">
            <path d="M19 10h-2V6a2 2 0 00-2-2H9a2 2 0 00-2 2v4H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2zm-10 0V6h6v4"/>
          </svg>
          <span>Cynetis-7</span>
          <span class="badge-dot" id="badgeCynetis"></span>
        </a>
        <a href="${config.profile}" data-page="${config.profile}" class="nav-link" id="navProfile">
          <svg class="nav-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none">
            <circle cx="12" cy="8" r="4"/>
            <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
          </svg>
          <span>Profile</span>
          <span class="badge-dot" id="badgeProfile"></span>
        </a>
      </nav>
    `;
  }

  function injectNav() {
    const container = document.getElementById('bottomNavContainer');
    if (!container) {
      console.warn('[BottomNav] Container #bottomNavContainer not found.');
      return;
    }
    console.log('[BottomNav] Injecting nav into container.');
    container.innerHTML = buildNavHTML();
    updateActiveLink();
  }

  function setCurrentRole(role) {
    currentRole = role || 'Operator';
    console.log('[BottomNav] Role set to:', currentRole);
    
    const config = ROLE_MAP[currentRole] || ROLE_MAP['Operator'];
    const dashLink = document.querySelector('.bottom-nav #navDashboard');
    const profileLink = document.querySelector('.bottom-nav #navProfile');
    
    if (dashLink) {
      dashLink.setAttribute('href', config.dashboard);
      dashLink.setAttribute('data-page', config.dashboard);
    }
    if (profileLink) {
      profileLink.setAttribute('href', config.profile);
      profileLink.setAttribute('data-page', config.profile);
    }

    // ★★★ FIX: re-run active link detection after updating href/data-page ★★★
    updateActiveLink();
  }

  function updateActiveLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.bottom-nav .nav-link');
    
    links.forEach(link => {
      const page = link.getAttribute('data-page');
      link.classList.remove('active');
      
      if (page === currentPath) {
        link.classList.add('active');
      }
    });
  }

  function updateBadges(userData) {
    console.log('[BottomNav] updateBadges called with:', userData);
    
    if (!userData) return;

    // Show/hide badges based on user data
    const badgesConfig = {
      badgeHome: userData?.unreadAnnouncements || false,
      badgeDashboard: userData?.pendingAlerts || false,
      badgeJourney: userData?.pendingChallenges || false,
      badgeCynetis: userData?.newFeatures || false,
      badgeProfile: userData?.unreadMessages || false
    };

    Object.keys(badgesConfig).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = badgesConfig[id] ? 'block' : 'none';
      }
    });

    // Update links based on role
    if (userData?.role) {
      setCurrentRole(userData.role);
    }
  }

  function listenToUserState() {
    window.addEventListener('userStateReady', (e) => {
      currentUser = e.detail;
      console.log('[BottomNav] User state ready:', currentUser);
      
      if (currentUser?.isLoggedIn) {
        setCurrentRole(currentUser.role);
        updateBadges(currentUser);
      }
    });

    // Also check if window.USER is already set
    if (window.USER && window.USER.isLoggedIn) {
      currentUser = window.USER;
      setCurrentRole(window.USER.role);
      updateBadges(window.USER);
    }
  }

  // ================================================================
  // PUBLIC API
  // ================================================================

  window.BottomNav = {
    inject: injectNav,
    updateBadges: updateBadges,
    updateActiveLink: updateActiveLink,
    setRole: setCurrentRole   // exposes setCurrentRole as setRole
  };

  // ================================================================
  // AUTO-INIT
  // ================================================================

  async function init() {
    await waitForFontAwesome();
    injectNav();
    listenToUserState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('popstate', updateActiveLink);

  console.log('[BottomNav] Initialized.');
})();