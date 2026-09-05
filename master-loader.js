// master-loader.js – Loads shared resources with proper loading order
(function() {
  'use strict';

  function loadFontAwesome() {
    if (document.querySelector('link[href*="font-awesome"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    link.onerror = () => console.warn('⚠️ Font Awesome CDN failed, but nav icons are SVG-based');
    document.head.appendChild(link);
    console.log('✅ Font Awesome loaded');
  }

  function loadGoogleFonts() {
    if (document.querySelector('link[href*="fonts.googleapis.com"]')) return;
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Montserrat:wght@300;400;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    console.log('✅ Google Fonts loaded');
  }

  function loadSharedCSS() {
    const files = [
      '/styles/design-system.css',
      '/styles/components.css',
      'bottom-nav.css'
    ];
    files.forEach(href => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onerror = () => console.warn(`⚠️ Failed to load ${href}`);
      document.head.appendChild(link);
    });
    console.log('✅ Shared CSS loaded');
  }

  function loadParticles() {
    if (!document.getElementById('particles')) return;
    if (document.querySelector('script[src*="particles.js"]')) return;
    const script = document.createElement('script');
    script.src = '/scripts/particles.js';
    script.onerror = () => console.warn('⚠️ Particles script failed to load');
    document.body.appendChild(script);
    console.log('✅ Particles loaded');
  }

  function injectFloatingHeader() {
  if (document.querySelector('.floating-header')) return;
  const headerHTML = `
    <div class="floating-header">
      <!-- LEFT: Role/Tier Badge (visible when logged in) -->
      <div class="floating-left-group">
        <span id="roleTierBadge" class="role-tier-badge" style="display:none;">
          <span class="glow-role" id="headerRole">Operator</span> · <span class="tier-text" id="headerTier">Free</span>
        </span>
      </div>

      <!-- CENTER: (empty) -->
      <div class="floating-center-group"></div>

      <!-- RIGHT: Auth buttons (if logged out) + Cart + Toggle -->
      <div class="floating-right-group">
        <div id="headerAuthButtons" style="display:flex; gap:6px; align-items:center;">
          <a href="login.html" class="header-auth-btn btn-login-header">Log in</a>
          <a href="signup.html" class="header-auth-btn btn-signup-header">Sign Up</a>
        </div>
        <a href="cart.html" class="cart-header-link chasing-border" id="cartHeaderLink">
          <i class="fas fa-shopping-cart"></i>
          <span id="cartHeaderLabel">Cart</span>
          <span class="cart-count-badge" id="cartHeaderCount" style="display:none;">0</span>
        </a>
        <button class="floating-toggle" id="floatingToggle" aria-label="Menu" style="margin-left: 6px;">
          <i class="fas fa-bars"></i>
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', headerHTML);
}

  function injectBottomNavContainer() {
    if (document.getElementById('bottomNavContainer')) return;
    const container = document.createElement('div');
    container.id = 'bottomNavContainer';
    document.body.appendChild(container);
    console.log('✅ Bottom nav container injected');
  }

  function loadBottomNav() {
    if (document.querySelector('script[src*="bottom-nav.js"]')) return;
    const script = document.createElement('script');
    script.src = 'bottom-nav.js';
    script.onerror = () => console.error('❌ Bottom nav failed to load');
    document.body.appendChild(script);
    console.log('✅ Bottom nav script queued');
  }

  window.handleLogout = function() {
    if (typeof window.auth !== 'undefined' && window.auth.signOut) {
      window.auth.signOut().then(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'login.html';
      }).catch(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'login.html';
      });
    } else {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = 'login.html';
    }
  };

  function init() {
    console.log('🔄 Master loader starting...');
    
    // Load in order: fonts → CSS → DOM injections → scripts
    loadFontAwesome();
    loadGoogleFonts();
    loadSharedCSS();
    loadParticles();
    injectBottomNavContainer();
    loadBottomNav();
    
    console.log('✅ Master loader complete');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
