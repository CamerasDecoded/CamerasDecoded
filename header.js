// header.js – Auth UI, cart badge, sidebar toggle (header injected by master-loader)
(function() {
  'use strict';

  // ----- Sidebar toggle (hamburger) -----
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

    document.querySelectorAll('.sidebar .nav-item, .sidebar .logout-link').forEach(link => {
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

  window.addEventListener('storage', function(e) {
    if (e.key === 'cameras_decoded_cart') updateCartUI();
  });

  // ----- Auth UI update (hides login/signup, shows badge) -----
  function updateAuthUI(user, userData) {
    const authButtons = document.getElementById('headerAuthButtons');
    const badge = document.getElementById('roleTierBadge');

    if (user && userData) {
      // Hide login/signup
      if (authButtons) authButtons.style.display = 'none';
      // Show badge with role + tier
      if (badge) {
        const role = userData.role || 'Operator';
        const tierLabel = userData.tier === 'pro' ? 'Pro' : 'Free';
        badge.innerHTML = `<span class="glow-role">${role}</span> · <span class="tier-text">${tierLabel}</span>`;
        badge.style.display = 'inline-flex';
      }
    } else {
      // Show login/signup
      if (authButtons) authButtons.style.display = 'flex';
      // Hide badge
      if (badge) badge.style.display = 'none';
    }
  }

  // ----- Public API -----
  const Header = {
    updateAuth: updateAuthUI,
    updateCart: updateCartUI,
    setUserData: function(user, userData) {
      updateAuthUI(user, userData);
    }
  };

  // Auto-setup sidebar toggle (header is already injected by master-loader)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSidebarToggle);
  } else {
    setupSidebarToggle();
  }

  // Expose globally
  window.Header = Header;
})();