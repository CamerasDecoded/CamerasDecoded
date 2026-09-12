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
    // ✅ All paths are now absolute (start with /)
    const files = [
      '/styles/design-system.css',
      '/styles/components.css',
      '/bottom-nav.css?v=20260912d',
      '/header.css?v=20260912e'
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

  // ----- HEADER INJECTION -----
  function injectFloatingHeader() {
    // Remove any existing header to avoid duplicates
    const oldHeaders = document.querySelectorAll('.floating-header');
    oldHeaders.forEach(el => el.remove());

    const headerHTML = `
      <div id="master-floating-header" class="floating-header">
        <!-- LEFT: Logo + time-based greeting -->
        <div class="floating-left-group">
          <a href="/index.html" class="header-logo-link" aria-label="Cameras Decoded home">
            <img src="/cameras-decoded-logo.png" alt="Cameras Decoded" class="header-logo" />
          </a>
          <div class="header-identity">
            <strong id="headerGreeting">Good morning, Operator</strong>
          </div>
        </div>
        <div class="floating-center-group"></div>
        <div class="floating-right-group">
          <span class="tier-badge" id="headerTierBadge" hidden><i class="fas fa-circle" aria-hidden="true"></i><span id="headerTierText">Free</span></span>
          <button class="icon-btn" id="headerNoticeButton" type="button" aria-label="Open announcements" aria-expanded="false">
            <i class="fas fa-bell" aria-hidden="true"></i>
            <span class="alert-dot" id="headerNoticeDot" aria-hidden="true" hidden></span>
          </button>
          <div id="headerAuthButtons" class="header-auth-buttons">
            <a href="/login.html" class="header-auth-btn btn-login-header">Log in</a>
            <a href="/signup.html" class="header-auth-btn btn-signup-header">Sign Up</a>
          </div>
          <a href="/cart.html" class="cart-header-link" id="cartHeaderLink" aria-label="Cart">
            <i class="fas fa-shopping-cart" aria-hidden="true"></i>
            <span id="cartHeaderLabel">Cart</span>
            <span class="cart-count-badge" id="cartHeaderCount" style="display:none;">0</span>
          </a>
        </div>
      </div>
      <div class="announce-popover" id="headerAnnouncePanel" role="dialog" aria-labelledby="headerAnnounceTitle" hidden>
        <div class="announce-head">
          <h2 id="headerAnnounceTitle">Announcements</h2>
          <button class="announce-close" id="headerAnnounceClose" type="button" aria-label="Dismiss announcements">
            <i class="fas fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        <div class="announce-body" id="headerAnnounceBody">
          <p class="announce-empty">No announcements right now.</p>
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

  function loadHeaderBehavior() {
    if (document.querySelector('script[src*="header.js"]')) return;
    const script = document.createElement('script');
    script.src = '/header.js?v=20260912e';
    document.body.appendChild(script);
  }

  function loadBottomNav() {
    if (document.querySelector('script[src*="bottom-nav.js"]')) return;
    const script = document.createElement('script');
    // ✅ absolute path — dashboard nav, site-wide
    script.src = '/scripts/bottom-nav.js?v=20260912d';
    document.body.appendChild(script);
  }

  function init() {
    loadFontAwesome();
    loadGoogleFonts();
    loadSharedCSS();
    loadParticles();
    injectFloatingHeader();
    loadHeaderBehavior();
    injectBottomNavContainer();
    loadBottomNav();
    console.log('✅ Master loader complete.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();