// master-loader.js – loads shared resources and injects header/bottom nav
(function() {
  'use strict';

  function loadFontAwesome() {
    if (document.querySelector('link[href*="font-awesome"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    document.head.appendChild(link);
  }

  function loadGoogleFonts() {
    if (document.querySelector('link[href*="fonts.googleapis.com"]')) return;
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Montserrat:wght@300;400;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  function loadSharedCSS() {
    const files = [
      '/styles/design-system.css',
      '/styles/components.css',
      'bottom-nav.css',
      'header.css'
    ];
    files.forEach(href => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });
  }

  function loadParticles() { /* optional – skip if not used */ }

  // ----- NEW HEADER INJECTION -----
  function injectFloatingHeader() {
    // Remove any existing header to avoid duplicates
    const oldHeaders = document.querySelectorAll('.floating-header');
    oldHeaders.forEach(el => el.remove());

    const headerHTML = `
      <div id="master-floating-header" class="floating-header">
        <!-- LEFT: Role/Tier Badge -->
        <div class="floating-left-group">
          <span id="roleTierBadge" class="role-tier-badge" style="display:none;">
            <span class="glow-role" id="headerRole">Operator</span> · <span class="tier-text" id="headerTier">Free</span>
          </span>
        </div>
        <div class="floating-center-group"></div>
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
    console.log('✅ Master header injected.');
  }

  function injectBottomNavContainer() {
    if (document.getElementById('bottomNavContainer')) return;
    const container = document.createElement('div');
    container.id = 'bottomNavContainer';
    document.body.appendChild(container);
  }

  function loadBottomNav() {
    if (document.querySelector('script[src*="bottom-nav.js"]')) return;
    const script = document.createElement('script');
    script.src = 'bottom-nav.js?v=' + Date.now();
    document.body.appendChild(script);
  }

  function loadCriticalScripts() {
    const scripts = [
      'firebase-init.js',
      'user-state.js',
      'header.js',
      'sidebar.js'
    ];
    
    scripts.forEach(src => {
      if (document.querySelector(`script[src*="${src}"]`)) return;
      const script = document.createElement('script');
      script.src = src;
      document.body.appendChild(script);
    });
  }

  function init() {
    loadFontAwesome();
    loadGoogleFonts();
    loadSharedCSS();
    loadParticles();
    injectFloatingHeader();
    injectBottomNavContainer();
    loadBottomNav();
    loadCriticalScripts();  // ← ADD THIS LINE HERE
    console.log('✅ Master loader complete.');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();