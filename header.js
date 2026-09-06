// header.js – Auth UI, cart badge, sidebar toggle (header injected by master-loader)
(function() {
  'use strict';

  console.log('[Header] Loading...');

  // ================================================================
  // SIDEBAR TOGGLE – WITH RETRY
  // ================================================================
  function setupSidebarToggle() {
    const toggleBtn = document.getElementById('floatingToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (!toggleBtn || !sidebar) {
      console.warn('[Header] Elements not ready yet, retrying in 500ms...');
      setTimeout(setupSidebarToggle, 500);
      return;
    }

    function toggleSidebar() {
      sidebar.classList.toggle('open');
      document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', toggleSidebar);

    document.querySelectorAll('.sidebar .nav-item, .sidebar .logout-link').forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 1024) closeSidebar();
      });
    });

    console.log('[Header] ✅ Sidebar toggle set up.');
  }

  // ================================================================
  // CART MANAGEMENT
  // ================================================================
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('cameras_decoded_cart') || '[]');
    } catch (e) {
      return [];
    }
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

    console.log('[Header] Cart updated:', totalItems, 'items');
  }

  // Listen for cart changes in localStorage
  window.addEventListener('storage', function(e) {
    if (e.key === 'cameras_decoded_cart') {
      updateCartUI();
    }
  });

  // ================================================================
  // AUTH UI MANAGEMENT
  // ================================================================
  function updateAuthUI(user, userData) {
    const authButtons = document.getElementById('headerAuthButtons');
    const badge = document.getElementById('roleTierBadge');

    // SIMPLIFIED: If user or userData exists, user is logged in
    const isLoggedIn = !!(user || userData);

    if (isLoggedIn) {
      console.log('[Header] ✅ User logged in. Updating UI...');
      
      // Hide login/signup buttons
      if (authButtons) {
        authButtons.style.display = 'none';
      }

      // Show role/tier badge
      if (badge) {
        const role = (userData && userData.role) || (user && user.role) || 'Operator';
        const tier = (userData && userData.tier) || (user && user.tier) || 'free';
        const tierLabel = (tier === 'pro' || tier === 'Pro') ? 'Pro' : 'Free';
        
        badge.innerHTML = `<span class="glow-role">${role}</span> · <span class="tier-text">${tierLabel}</span>`;
        badge.style.display = 'inline-flex';
        console.log('[Header] ✅ Badge shown:', role, tierLabel);
      }
    } else {
      console.log('[Header] ❌ User not logged in. Showing auth buttons...');
      
      // Show login/signup buttons
      if (authButtons) {
        authButtons.style.display = 'flex';
      }

      // Hide badge
      if (badge) {
        badge.style.display = 'none';
      }
    }
  }

  // ================================================================
  // EVENT LISTENERS
  // ================================================================

  // Listen for userStateReady event from user-state.js
  window.addEventListener('userStateReady', (e) => {
    console.log('[Header] 🎯 userStateReady event received');
    const user = e.detail;
    updateAuthUI(user, user);
    updateCartUI();
  });

  // Fallback: if window.USER is already set when header loads
  setTimeout(() => {
    if (window.USER && typeof window.USER === 'object') {
      console.log('[Header] ✅ window.USER already exists, updating UI');
      updateAuthUI(window.USER, window.USER);
      updateCartUI();
    } else {
      console.log('[Header] ⏳ window.USER not ready yet');
    }
  }, 500);

  // ================================================================
  // PUBLIC API
  // ================================================================
  window.Header = {
    updateAuth: updateAuthUI,
    updateCart: updateCartUI,
    setUserData: function(user, userData) {
      updateAuthUI(user, userData);
    }
  };

  // ================================================================
  // AUTO-INIT
  // ================================================================
  function init() {
    console.log('[Header] Initializing...');
    setupSidebarToggle();
    updateCartUI();
    console.log('[Header] ✅ Initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[Header] ✅ Script loaded');
})();
