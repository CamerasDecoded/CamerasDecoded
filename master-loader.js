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
        <div class="floating-left-group">
          <a href="index.html" class="floating-home-icon" title="Home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 10h18M3 10l2-6h14l2 6M3 10v9a1 1 0 001 1h16a1 1 0 001-1v-9M9 14v3M15 14v3"/>
            </svg>
          </a>
          <span id="roleTierBadge" class="role-tier-badge" style="display:none;">
            <span class="glow-role" id="headerRole">Operator</span> · <span class="tier-text" id="headerTier">Free</span>
          </span>
        </div>
        <div class="floating-center-group"></div>
        <div class="floating-right-group">
          <a href="cart.html" class="cart-header-link chasing-border" id="cartHeaderLink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            <span id="cartHeaderLabel">Cart</span>
            <span class="cart-count-badge" id="cartHeaderCount" style="display:none;">0</span>
          </a>
          <button class="logout-btn" id="floatingLogoutBtn" style="display:none;" onclick="handleLogout()">Logout</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    console.log('✅ Floating header injected');
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
    injectFloatingHeader();
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
