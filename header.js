// ================================================================
// SHARED HEADER – injects floating header, handles auth, cart, sidebar toggle
// ================================================================

(function() {
  'use strict';

  // ----- HTML template for the floating header -----
  const HEADER_HTML = `
    <div class="floating-header" id="floatingHeader">
      <div class="floating-left-group">
        <a href="index.html" class="floating-home-icon" title="Home"><i class="fas fa-home"></i></a>
      </div>
      <div class="floating-center-group">
        <div id="roleTierBadge" class="role-tier-badge" style="display:none;">
          <span class="glow-role">Operator</span> · <span class="tier-text">Free</span>
        </div>
      </div>
      <div class="floating-right-group">
        <div class="header-auth-buttons">
          <!-- Logged out (shown by default) -->
          <div id="authLoggedOut" style="display:flex; gap:6px; align-items:center;">
            <a href="login.html" class="header-auth-btn btn-login-header"><i class="fas fa-sign-in-alt"></i> Login</a>
            <a href="signup.html" class="header-auth-btn btn-signup-header">Sign Up</a>
          </div>
          <!-- Logged in (hidden by default) -->
          <div id="authLoggedIn" style="display:none; gap:6px; align-items:center;">
            <a href="operator-dashboard.html" id="dashboardHeaderBtn" class="header-auth-btn btn-dashboard-header"><i class="fas fa-th-large"></i> Dashboard</a>
            <button class="header-auth-btn btn-logout-header" onclick="window.handleLogout && window.handleLogout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
          </div>
        </div>
        <a href="cart.html" class="cart-header-link chasing-border" id="cartHeaderLink">
          <i class="fas fa-shopping-cart"></i> <span id="cartHeaderLabel">Cart</span>
          <span class="cart-count-badge" id="cartHeaderCount" style="display:none;">0</span>
        </a>
        <button class="floating-toggle" id="floatingToggle" aria-label="Menu"><i class="fas fa-bars"></i></button>
      </div>
    </div>
  `;

  // ----- Inject header -----
  function injectHeader() {
    if (document.getElementById('floatingHeader')) return; // already injected
    const container = document.createElement('div');
    container.innerHTML = HEADER_HTML;
    document.body.prepend(container.firstElementChild);
    // Also inject the sidebar toggle event listener after DOM ready
    setupSidebarToggle();
    updateCartUI();
  }

  // ----- Sidebar toggle (only one hamburger) -----
  function setupSidebarToggle() {
    const toggleBtn = document.getElementById('floatingToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!toggleBtn || !sidebar) return;

    function toggleSidebar() {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open');
      document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
    }
    function closeSidebar() {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', toggleSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Close sidebar on nav link click (mobile)
    document.querySelectorAll('.sidebar .nav-item, .sidebar .logout-link, #dashboardLinkContainer a').forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 1024) closeSidebar();
      });
    });
  }

  // ----- Cart UI -----
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('cameras_decoded_cart') || '[]');
    } catch { return []; }
  }

  function updateCartUI() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
    const countEl = document.getElementById('cartHeaderCount');
    const labelEl = document.getElementById('cartHeaderLabel');
    if (countEl) {
      countEl.textContent = totalItems;
      countEl.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
    if (labelEl) {
      labelEl.textContent = totalItems > 0 ? `Cart (${totalItems})` : 'Cart';
    }
  }

  // Listen for cart changes (storage events from other tabs)
  window.addEventListener('storage', function(e) {
    if (e.key === 'cameras_decoded_cart') updateCartUI();
  });

  // ----- Auth UI update -----
  function updateAuthUI(user, userData) {
    const loggedOut = document.getElementById('authLoggedOut');
    const loggedIn = document.getElementById('authLoggedIn');
    const badge = document.getElementById('roleTierBadge');
    const dashboardBtn = document.getElementById('dashboardHeaderBtn');

    if (user && userData) {
      loggedOut.style.display = 'none';
      loggedIn.style.display = 'flex';

      // Determine dashboard link based on role
      const role = userData.role || 'Operator';
      let dashUrl = 'operator-dashboard.html';
      if (role === 'Instructor') dashUrl = 'instructor-dashboard.html';
      else if (role === 'Partner') dashUrl = 'partner-dashboard.html';
      else if (role === 'admin' || role === 'Admin') dashUrl = 'admin-dashboard.html';
      if (dashboardBtn) dashboardBtn.href = dashUrl;

      // Update badge
      const tierLabel = userData.tier === 'pro' ? 'Pro' : 'Free';
      badge.innerHTML = `<span class="glow-role">${role}</span> · <span class="tier-text">${tierLabel}</span>`;
      badge.style.display = 'inline-flex';
    } else {
      loggedOut.style.display = 'flex';
      loggedIn.style.display = 'none';
      badge.style.display = 'none';
    }
  }

  // ================================================================
  // PUBLIC API
  // ================================================================
  const Header = {
    inject: injectHeader,
    updateAuth: updateAuthUI,
    updateCart: updateCartUI,
    // Call this when user data is loaded (from Firestore)
    setUserData: function(user, userData) {
      updateAuthUI(user, userData);
      // Optionally update dashboard link in sidebar if needed
    }
  };

  // Auto-inject on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }

  // Expose globally
  window.Header = Header;
})();