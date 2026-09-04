// ================================================================
// BOTTOM NAV – Production, role‑aware, premium icons
// ================================================================

(function() {
  'use strict';

  // Map role → dashboard URL
  const ROLE_DASHBOARD = {
    'Operator': 'operator-dashboard.html',
    'Partner': 'partner-dashboard.html',
    'Instructor': 'instructor-dashboard.html',
    'Admin': 'admin-dashboard.html',
    'admin': 'admin-dashboard.html'
  };

  // Icon mapping – using far (regular) for thinner, premium feel
  const NAV_ITEMS = [
    { id: 'home', label: 'Home', icon: 'fa-house', url: 'index.html' },
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', url: null }, // dynamic
    { id: 'profile', label: 'Profile', icon: 'fa-user', url: 'profile.html' },
    { id: 'cart', label: 'Cart', icon: 'fa-cart-shopping', url: 'cart.html' }
  ];

  // Cache DOM elements
  let container = document.getElementById('bottomNavContainer');
  let currentRole = 'Operator';

  // ================================================================
  // Helper: get user role from Firebase or localStorage
  // ================================================================
  function getUserRole() {
    try {
      const user = JSON.parse(localStorage.getItem('cameras_decoded_user') || '{}');
      if (user && user.role) return user.role;
      // Fallback: check if uid is stored, then fetch from Firestore
      const uid = localStorage.getItem('cameras_decoded_uid');
      if (uid && typeof firebase !== 'undefined' && firebase.firestore) {
        // We'll fetch asynchronously, but for now return 'Operator'
        return 'Operator';
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // ================================================================
  // Build navigation items
  // ================================================================
  function buildNav(role) {
    if (!container) {
      container = document.getElementById('bottomNavContainer');
      if (!container) return;
    }

    // Determine dashboard URL
    const dashboardUrl = ROLE_DASHBOARD[role] || 'operator-dashboard.html';

    // Prepare items
    const items = NAV_ITEMS.map(item => {
      let url = item.url;
      if (item.id === 'dashboard') url = dashboardUrl;
      return { ...item, url };
    });

    // Build HTML – use far (regular) icon prefix
    const navHtml = items.map(item => {
      const iconClass = `far ${item.icon}`;
      return `<a href="${item.url}" class="bottom-nav-item" data-id="${item.id}">
                <i class="${iconClass}"></i>
                <span>${item.label}</span>
              </a>`;
    }).join('');

    container.innerHTML = navHtml;

    // Mark active item based on current page
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    container.querySelectorAll('.bottom-nav-item').forEach(el => {
      const href = el.getAttribute('href');
      if (href === currentPath) {
        el.classList.add('active');
      }
    });
  }

  // ================================================================
  // Public API
  // ================================================================
  window.BottomNav = {
    init: function() {
      const role = getUserRole() || 'Operator';
      this.setRole(role);
    },
    setRole: function(role) {
      currentRole = role;
      buildNav(role);
    },
    updateBadges: function(userData) {
      // Update cart badge count
      const cart = JSON.parse(localStorage.getItem('cameras_decoded_cart') || '[]');
      const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
      const cartItem = container?.querySelector('.bottom-nav-item[data-id="cart"]');
      if (cartItem) {
        // Remove existing badge
        const oldBadge = cartItem.querySelector('.bottom-nav-badge');
        if (oldBadge) oldBadge.remove();
        if (totalItems > 0) {
          const badge = document.createElement('span');
          badge.className = 'bottom-nav-badge';
          badge.textContent = totalItems;
          cartItem.appendChild(badge);
        }
      }
      // Could also update other badges (e.g., notifications) here
    },
    // For compatibility with old test code
    setActive: function() {
      // already done in buildNav
    }
  };

  // ================================================================
  // Auto‑init when DOM ready
  // ================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.BottomNav.init();
      // If Firebase auth state changes, re‑fetch role
      if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            // Fetch role from Firestore
            const db = firebase.firestore();
            db.collection('users').doc(user.uid).get().then(doc => {
              if (doc.exists) {
                const role = doc.data().role || 'Operator';
                window.BottomNav.setRole(role);
                // Also update badges if data available
                window.BottomNav.updateBadges(doc.data());
              }
            }).catch(() => {});
          } else {
            window.BottomNav.setRole('Operator');
          }
        });
      }
    });
  } else {
    window.BottomNav.init();
  }

  // ================================================================
  // Cart badge – listen for storage changes (if cart updated in other tab)
  // ================================================================
  window.addEventListener('storage', (e) => {
    if (e.key === 'cameras_decoded_cart') {
      window.BottomNav.updateBadges();
    }
  });

  // Also update cart badge whenever we load the page
  document.addEventListener('DOMContentLoaded', function() {
    // Fetch user data if available
    const uid = localStorage.getItem('cameras_decoded_uid');
    if (uid && typeof firebase !== 'undefined' && firebase.firestore) {
      firebase.firestore().collection('users').doc(uid).get().then(doc => {
        if (doc.exists) {
          window.BottomNav.updateBadges(doc.data());
        }
      }).catch(() => {});
    } else {
      window.BottomNav.updateBadges();
    }
  });

})();