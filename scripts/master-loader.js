// master-loader.js – loads shared resources and injects header/bottom nav
(function() {
  'use strict';

  // Capture the PWA install prompt the moment it fires — it can arrive
  // before scripts/install.js loads. install.js picks it up from here.
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    window.__cdDeferredPrompt = e;
  });

  /* ============================================================
     BRANDED BOOT VEIL
     Every page load – even a glimpse – shows one RANDOM loading
     video from /media. Runs synchronously in <head> so the veil
     exists before first paint. Pages with slow hydration (e.g.
     operator-dashboard) call CDLoading.hold() early and
     CDLoading.done() when ready; everyone else auto-hides on
     window load. 8s backstop guarantees it can never trap.
     ============================================================ */
  const VEIL_VIDEOS = ['/media/loading-success.mp4', '/media/loading-v2-success.mp4'];
  const VEIL_MIN_MS = 600;
  const VEIL_MAX_MS = 8000;
  const veilT0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  let veilHeld = false;
  let veilHidden = false;
  let veilAwaitingTap = false; // tap-to-enter: only the tap or the backstop dismisses

  const veilCSS = [
    '#cdBootVeil{position:fixed;inset:0;z-index:9999;background:#070708;margin:0;padding:0;overflow:hidden}',
    '#cdBootVeil.cd-bv-hide{opacity:0;pointer-events:none;transition:opacity .35s ease}',
    '#cdBootVeil video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#070708}',
    '.cd-bv-scrim{position:absolute;left:0;right:0;bottom:0;height:38%;background:linear-gradient(to bottom,rgba(0,0,0,0),rgba(0,0,0,.6));pointer-events:none}',
    '.cd-bv-label{position:absolute;left:0;right:0;bottom:max(52px,env(safe-area-inset-bottom));text-align:center;font-family:"Space Mono",ui-monospace,monospace;font-size:11px;font-weight:700;letter-spacing:4px;color:#8deb00;text-transform:uppercase;text-shadow:0 1px 8px rgba(0,0,0,.8)}',
    '.cd-bv-dot{position:absolute;left:50%;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#8deb00;box-shadow:0 0 22px #8deb00;animation:cdBvPulse 1.1s ease-in-out infinite}',
    '@keyframes cdBvPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.55);opacity:.45}}',
    '#cdBootVeil.cd-bv-tap{cursor:pointer}',
    '#cdBootVeil.cd-bv-tap .cd-bv-label{animation:cdBvPulse 1.6s ease-in-out infinite}',
    '@media (prefers-reduced-motion:reduce){#cdBootVeil.cd-bv-hide{transition:none}.cd-bv-dot{animation:none}#cdBootVeil.cd-bv-tap .cd-bv-label{animation:none}}'
  ].join('\n');

  function injectVeilCSS() {
    if (document.getElementById('cdBootVeilCSS')) return;
    const s = document.createElement('style');
    s.id = 'cdBootVeilCSS';
    s.textContent = veilCSS;
    (document.head || document.documentElement).appendChild(s);
  }

  // App icons: favicon + iOS home-screen icon + web manifest, injected
  // synchronously in <head> so every page (and Add to Home Screen) picks
  // them up. Artwork: the Cameras Decoded logo mark.
  function injectIconLinks() {
    if (document.querySelector('link[rel="apple-touch-icon"]')) return;
    const head = document.head || document.documentElement;
    const add = (attrs) => {
      const l = document.createElement('link');
      Object.keys(attrs).forEach((k) => l.setAttribute(k, attrs[k]));
      head.appendChild(l);
    };
    add({ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' });
    add({ rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' });
    add({ rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' });
    add({ rel: 'manifest', href: '/site.webmanifest' });
    const meta = (name, content) => {
      if (document.querySelector('meta[name="' + name + '"]')) return;
      const m = document.createElement('meta');
      m.setAttribute('name', name);
      m.setAttribute('content', content);
      head.appendChild(m);
    };
    meta('theme-color', '#070708');
    meta('apple-mobile-web-app-title', 'Cameras Decoded');
    // Standalone launch from the Home Screen: no Safari chrome.
    meta('mobile-web-app-capable', 'yes');
    meta('apple-mobile-web-app-capable', 'yes');
    meta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  }

  // No-repeat rotation: never show the same video twice in a row in a
  // session, so both files visibly take turns. Falls back to plain
  // random when sessionStorage is unavailable.
  function pickVideo() {
    let last = null;
    try { last = sessionStorage.getItem('cd_veil_last'); } catch (e) { /* private mode */ }
    const pool = VEIL_VIDEOS.filter((v) => v !== last);
    const src = (pool.length ? pool : VEIL_VIDEOS)[Math.floor(Math.random() * (pool.length ? pool.length : VEIL_VIDEOS.length))];
    try { sessionStorage.setItem('cd_veil_last', src); } catch (e) { /* private mode */ }
    return src;
  }

  function buildVeil(labelText) {
    const veil = document.createElement('div');
    veil.id = 'cdBootVeil';
    veil.setAttribute('aria-hidden', 'true');
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Fullscreen video carries the brand. If the picked file fails, try
    // the other one(s) before falling back to a pulsing dot, so one bad
    // file can never silently halve the rotation or break the page.
    veil.innerHTML =
      '<video muted loop playsinline preload="auto" ' + (reduceMotion ? '' : 'autoplay ') + 'aria-hidden="true"></video>' +
      '<div class="cd-bv-scrim"></div>' +
      '<div class="cd-bv-label">' + (labelText || 'Tuning signal&hellip;') + '</div>';
    const vid = veil.querySelector('video');
    if (vid) {
      const first = pickVideo();
      const queue = VEIL_VIDEOS.slice().sort((a, b) => (a === first ? -1 : b === first ? 1 : 0));
      const showDot = () => {
        const dot = document.createElement('div');
        dot.className = 'cd-bv-dot';
        vid.replaceWith(dot);
      };
      // One source at a time: on failure, drop it and try the next file.
      // Only the dot remains when every file has failed.
      const tryNext = () => {
        vid.querySelectorAll('source').forEach((s) => s.remove());
        if (!queue.length) { showDot(); return; }
        const s = document.createElement('source');
        s.src = queue.shift();
        s.type = 'video/mp4';
        s.addEventListener('error', tryNext);
        vid.appendChild(s);
        try { vid.load(); } catch (e) { /* ignore */ }
      };
      tryNext();
    }
    return veil;
  }

  function getVeil() { return document.getElementById('cdBootVeil'); }

  function hideVeil(force) {
    if (veilHidden) return;
    if (veilAwaitingTap && !force) return; // tap-to-enter owns the veil until the tap
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const wait = Math.max(0, VEIL_MIN_MS - (now - veilT0));
    veilHidden = true;
    setTimeout(() => {
      if (!veilHidden) return; // a show() arrived while we waited – stand down
      const v = getVeil();
      if (!v) return;
      v.classList.add('cd-bv-hide');
      setTimeout(() => { if (veilHidden) v.remove(); }, 450);
    }, wait);
  }

  // Boot: create the veil immediately (documentElement exists even
  // before <body> is parsed; fixed positioning is viewport-relative).
  injectVeilCSS();
  injectIconLinks();
  (document.documentElement).appendChild(buildVeil());

  window.CDLoading = {
    // Keep the veil up past window load until done() is called.
    hold() { veilHeld = true; },
    // Release a held veil (also fine to call without hold()).
    done() { veilHeld = false; hideVeil(); },
    // Manual in-app loading state with an optional label.
    show(label) {
      veilHidden = false;
      let v = getVeil();
      if (!v) { v = buildVeil(label); document.documentElement.appendChild(v); }
      else { v.classList.remove('cd-bv-hide'); }
    },
    hide() { hideVeil(); }
  };

  // ---- Tap-to-enter: once per browser session, the boot veil becomes a
  // game-style entry moment. The tap is what legally unlocks audio
  // (autoplay policy), so this is the only reliable "sound on open".
  // Skipped when the user muted sound or already entered this session.
  function soundEnabled() {
    try { return localStorage.getItem('cd_sound') !== '0'; } catch (e) { return true; }
  }
  function markEntered() {
    try { sessionStorage.setItem('cd_entered', '1'); } catch (e) { /* private mode */ }
  }
  (function maybeTapToEnter() {
    let entered = false;
    try { entered = sessionStorage.getItem('cd_entered') === '1'; } catch (e) {}
    if (entered || !soundEnabled()) return;
    const v = getVeil();
    if (!v) return;
    veilAwaitingTap = true;
    v.classList.add('cd-bv-tap');
    const label = v.querySelector('.cd-bv-label');
    if (label) label.textContent = 'Tap to tune in';
    v.addEventListener('click', function onTap() {
      v.removeEventListener('click', onTap);
      veilAwaitingTap = false;
      markEntered();
      if (window.CDSound) window.CDSound.start(); // inside the gesture: audio unlocks
      else window.__cdSoundPendingStart = true;   // sound.js not loaded yet: start on load
      hideVeil(true);
    });
  })();

  window.addEventListener('load', () => {
    // Let first paint + fonts settle so the glimpse registers, then
    // release unless a page explicitly held the veil.
    setTimeout(() => { if (!veilHeld && !veilAwaitingTap) hideVeil(); }, 150);
  });
  // Hard backstop: the veil can never trap the user.
  setTimeout(() => {
    if (veilAwaitingTap) { veilAwaitingTap = false; markEntered(); }
    hideVeil(true);
  }, VEIL_MAX_MS);

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
      '/header.css?v=20260919a'
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
          <button class="icon-btn" id="headerSoundButton" type="button" aria-label="Mute background sound" aria-pressed="true">
            <i class="fas fa-volume-high" aria-hidden="true"></i>
          </button>
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
    script.src = '/header.js?v=20260918b';
    document.body.appendChild(script);
  }

  function loadNotifications() {
    if (document.querySelector('script[src*="notifications.js"]')) return;
    const script = document.createElement('script');
    script.src = '/scripts/notifications.js?v=20260917a';
    script.onload = () => {
      try { if (window.CDNotifs) window.CDNotifs.init(); } catch (e) {}
    };
    document.body.appendChild(script);
  }

  function loadSound() {
    if (document.querySelector('script[src*="sound.js"]')) return;
    if (window.CDSound) { wireSoundToggle(); return; }
    const script = document.createElement('script');
    script.src = '/scripts/sound.js?v=20260918a';
    script.onload = () => {
      try {
        if (window.__cdSoundPendingStart && window.CDSound) {
          window.__cdSoundPendingStart = false;
          window.CDSound.start();
        }
        wireSoundToggle();
      } catch (e) {}
    };
    document.body.appendChild(script);
  }

  function wireSoundToggle() {
    const btn = document.getElementById('headerSoundButton');
    if (!btn || !window.CDSound || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    const render = () => {
      const on = window.CDSound.isOn();
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on ? 'Mute background sound' : 'Unmute background sound');
      const icon = btn.querySelector('i');
      if (icon) icon.className = on ? 'fas fa-volume-high' : 'fas fa-volume-xmark';
    };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.CDSound.toggle(); // a click is a gesture, so unmuting can restart audio
      render();
    });
    render();
  }

  function loadProCheckout() {
    if (document.querySelector('script[src*="pro-checkout.js"]')) return;
    if (window.CDPro) return;
    const script = document.createElement('script');
    script.src = '/scripts/pro-checkout.js?v=20260918b';
    document.body.appendChild(script);
  }

  function loadBottomNav() {
    if (document.querySelector('script[src*="bottom-nav.js"]')) return;
    const script = document.createElement('script');
    // ✅ absolute path — dashboard nav, site-wide
    script.src = '/scripts/bottom-nav.js?v=20260919a';
    document.body.appendChild(script);
  }

  function loadInstall() {
    if (document.querySelector('script[src*="install.js"]')) return;
    if (window.CDInstall) return;
    const script = document.createElement('script');
    script.src = '/scripts/install.js?v=20260919a';
    document.body.appendChild(script);
  }

  function init() {
    loadFontAwesome();
    loadGoogleFonts();
    loadSharedCSS();
    loadParticles();
    injectFloatingHeader();
    loadHeaderBehavior();
    loadProCheckout();
    loadNotifications();
    loadSound();
    injectBottomNavContainer();
    loadBottomNav();
    loadInstall();
    // Ambient sound: (re)start the loop on the first tap of every page.
    // A tap is a gesture, so this is where audio is allowed to begin;
    // CDSound restores the position the last page left off.
    window.addEventListener('pointerdown', function mlAudioStart() {
      window.removeEventListener('pointerdown', mlAudioStart);
      try { if (window.CDSound) window.CDSound.start(); } catch (e) {}
    });
    console.log('✅ Master loader complete.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();