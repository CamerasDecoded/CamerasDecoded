// master-loader.js – Loads only shared resources (CSS, fonts, header, bottom nav)
(function() {
  'use strict';

  function loadFontAwesome() {
    if (document.querySelector('link[href*="font-awesome"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
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
      document.head.appendChild(link);
    });
    console.log('✅ Shared CSS loaded');
  }

  function loadParticles() {
    if (!document.getElementById('particles')) return;
    if (document.querySelector('script[src*="particles.js"]')) return;
    const script = document.createElement('script');
    script.src = '/scripts/particles.js';
    document.body.appendChild(script);
    console.log('✅ Particles loaded');
  }

  function injectFloatingHeader() {
    if (document.querySelector('.floating-header')) return;
    const headerHTML = `
      <div class="floating-header">
        <div class="floating-left-group">
          <a href="index.html" class="floating-home-icon" title="Home"><i class="fas fa-home"></i></a>
          <span id="roleTierBadge" class="role-tier-badge" style="display:none;">
            <span class="glow-role" id="headerRole">Operator</span> · <span class="tier-text" id="headerTier">Free</span>
          </span>
        </div>
        <div class="floating-center-group"></div>
        <div class="floating-right-group">
          <a href="cart.html" class="cart-header-link chasing-border" id="cartHeaderLink">
            <i class="fas fa-shopping-cart"></i> <span id="cartHeaderLabel">Cart</span>
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
    document.body.appendChild(script);
    console.log('✅ Bottom nav script loaded');
  }

  window.handleLogout = function() {
    if (typeof window.auth !== 'undefined' && window.auth.signOut) {
      window.auth.signOut().then(() => {
        localStorage.clear();
        window.location.href = 'login.html';
      }).catch(() => {
        localStorage.clear();
        window.location.href = 'login.html';
      });
    } else {
      localStorage.clear();
      window.location.href = 'login.html';
    }
  };

  function init() {
    loadFontAwesome();
    loadGoogleFonts();
    loadSharedCSS();
    loadParticles();
    injectFloatingHeader();
    injectBottomNavContainer();
    loadBottomNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();