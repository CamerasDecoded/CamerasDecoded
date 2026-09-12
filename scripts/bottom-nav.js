// /scripts/bottom-nav.js
// Shared mobile bottom navigation for all authenticated pages EXCEPT the dashboard.
// Self-injects its own <style> + DOM. Namespaced .cd-* — do not override externally.
//
// Opt-outs:
//   <body data-no-bottomnav>       — disable per page
//   window.__BOTTOMNAV_DISABLED    — disable at runtime
//   /login.html, /signup.html      — auto-skipped
//
// Exposes window.BottomNav = { updateBadges(user), close } for callers.

(function () {
  'use strict';

  // ---------- guards ----------
  if (window.__CDBottomNav) {
    console.log('[BottomNav] already loaded — skipping');
    return;
  }
  if (window.__BOTTOMNAV_DISABLED) {
    console.log('[BottomNav] disabled by window flag');
    return;
  }
  if (document.body && document.body.hasAttribute('data-no-bottomnav')) {
    console.log('[BottomNav] disabled by data-no-bottomnav');
    return;
  }

  var path = (location.pathname || '').toLowerCase();
  if (path.endsWith('/login.html') || path.endsWith('/signup.html') ||
      path.endsWith('login.html') || path.endsWith('signup.html')) {
    console.log('[BottomNav] skipped on auth page');
    return;
  }

  // ---------- icons (inline SVG, no FontAwesome dependency) ----------
  function svg(inner) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
           'aria-hidden="true">' + inner + '</svg>';
  }
  var ICONS = {
    home:     svg('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'),
    journey:  svg('<path d="M4 19c4-1 5-8 9-9s7 1 7-4"/><circle cx="4" cy="19" r="1.6" fill="currentColor"/><circle cx="20" cy="6" r="1.6" fill="currentColor"/>'),
    practice: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
    library:  svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3.5"/>'),
    more:     svg('<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>'),
    bolt:     svg('<path d="M13 2 5 14h7l-1 8 8-12h-7l1-8z"/>'),
    zap:      svg('<path d="M13 2 5 14h7l-1 8 8-12h-7l1-8z"/>'),
    darkroom: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3v9l7.8-4.5M21 12h-9l7.8 4.5M12 21v-9l-7.8 4.5M3 12h9l-7.8-4.5"/>'),
    camera:   svg('<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2.5h5L16 7"/>'),
    comm:     svg('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.5-4.7A8.4 8.4 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/>'),
    brain:    svg('<path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 3 3h1a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a3 3 0 0 1-3 3h-1a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>'),
    user:     svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>'),
    exit:     svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>'),
    close:    svg('<path d="M6 6l12 12M18 6 6 18"/>')
  };

  // ---------- routes ----------
  var TABS = [
    { id: 'home',     label: 'Home',     href: '/operator-dashboard.html', icon: 'home' },
    { id: 'journey',  label: 'Missions',  href: '/journey.html',            icon: 'journey' },
    { id: 'practice', label: 'Practice', sheet: 'practice',                icon: 'practice' },
    { id: 'library',  label: 'Library',  href: '/protocols.html',          icon: 'library' },
    { id: 'more',     label: 'More',     sheet: 'more',                    icon: 'more' }
  ];

  var SHEETS = {
    practice: {
      title: 'Practice',
      sub: 'Quick drills and daily work.',
      rows: [
        { href: '/dailyprotocol.html', icon: 'bolt',     title: "Today's challenge", sub: 'Keep your streak alive' },
        { href: '/quiz-full.html',     icon: 'zap',      title: 'Quiz Arena',        sub: 'Test what you know' },
        { href: '/darkroom.html',      icon: 'darkroom', title: 'The Darkroom',      sub: 'Your skill tree' }
      ]
    },
    more: {
      title: 'More',
      sub: 'Secondary destinations.',
      rows: [
        { href: '/snapshot-library.html', icon: 'camera', title: 'Snapshots',    sub: 'Your saved cards' },
        { href: '/community.html',        icon: 'comm',   title: 'Community',    sub: 'Signal and discussion' },
        { href: '/ai-tools.html',         icon: 'brain',  title: 'AI Workbench', sub: 'Smart tools' },
        { href: '/profile.html',          icon: 'user',   title: 'Profile',      sub: 'Account and settings' },
        { action: 'logout',               icon: 'exit',   title: 'Log out',      sub: 'End this session' }
      ]
    }
  };

  // ---------- styles ----------
  var CSS = ''
    + ':root{--cd-bn-green:#8deb00;--cd-bn-green-dim:rgba(141,235,0,.08);'
    +   '--cd-bn-border:rgba(255,255,255,.09);--cd-bn-text:#f7f8f5;'
    +   '--cd-bn-mut:rgba(255,255,255,.55);--cd-bn-mono:"Space Mono",ui-monospace,monospace;}'
    + '.cd-bn-nav{display:none}'
    + '@media (max-width:820px){'
    +   '.cd-bn-nav{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;'
    +     'z-index:50;left:0;right:0;bottom:0;'
    +     'padding:8px 8px calc(8px + env(safe-area-inset-bottom));'
    +     'background:rgba(9,9,11,.96);backdrop-filter:blur(16px);'
    +     '-webkit-backdrop-filter:blur(16px);'
    +     'border-top:1px solid var(--cd-bn-border);'
    +     'font-family:"Montserrat",system-ui,sans-serif;'
    +     'transform:translateZ(0);}'
    +   'body{padding-bottom:calc(74px + env(safe-area-inset-bottom))}'
    + '}'
    + '.cd-bn-link{min-width:0;min-height:50px;border:0;background:transparent;'
    +   'border-radius:9px;color:var(--cd-bn-mut);'
    +   'display:flex;flex-direction:column;align-items:center;justify-content:center;'
    +   'gap:3px;cursor:pointer;font-size:8px;font-weight:700;padding:0;'
    +   'text-decoration:none;transition:color .15s,background .15s}'
    + '.cd-bn-link svg{width:18px;height:18px}'
    + '.cd-bn-link:hover{color:#fff}'
    + '.cd-bn-link.cd-active{color:var(--cd-bn-green);background:var(--cd-bn-green-dim)}'
    + '.cd-bn-link:active{transform:scale(.97)}'
    + '.cd-bn-scrim{position:fixed;inset:0;z-index:120;background:rgba(5,5,6,.72);'
    +   'backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);'
    +   'display:none;align-items:flex-end;justify-content:center}'
    + '.cd-bn-scrim.cd-open{display:flex}'
    + '.cd-bn-sheet{position:relative;width:min(560px,100%);max-height:88vh;'
    +   'overflow-y:auto;background:#0e0f11;border:1px solid var(--cd-bn-border);'
    +   'border-bottom:none;border-radius:22px 22px 0 0;padding:24px 20px 28px;'
    +   'font-family:"Montserrat",system-ui,sans-serif;color:var(--cd-bn-text);'
    +   'animation:cdBnUp .24s ease}'
    + '@keyframes cdBnUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}'
    + '.cd-bn-handle{width:40px;height:4px;border-radius:4px;background:rgba(255,255,255,.22);'
    +   'margin:0 auto 16px}'
    + '.cd-bn-close{position:absolute;top:16px;right:16px;width:44px;height:44px;'
    +   'border-radius:12px;background:transparent;border:1px solid var(--cd-bn-border);'
    +   'color:var(--cd-bn-text);cursor:pointer;display:grid;place-items:center;padding:0}'
    + '.cd-bn-close:hover{border-color:var(--cd-bn-green)}'
    + '.cd-bn-close svg{width:18px;height:18px}'
    + '.cd-bn-title{margin:0 0 4px;font-size:18px;font-weight:700;letter-spacing:-.01em}'
    + '.cd-bn-sub{margin:0 0 18px;color:var(--cd-bn-mut);font-size:12px}'
    + '.cd-bn-row{display:flex;align-items:center;gap:14px;min-height:60px;padding:12px 14px;'
    +   'border-radius:12px;border:1px solid var(--cd-bn-border);background:rgba(255,255,255,.02);'
    +   'color:var(--cd-bn-text);text-decoration:none;cursor:pointer;width:100%;'
    +   'font-family:inherit;text-align:left;margin-bottom:10px;'
    +   'transition:border-color .15s,background .15s}'
    + '.cd-bn-row:hover{border-color:rgba(141,235,0,.35);background:rgba(141,235,0,.04)}'
    + '.cd-bn-row:last-child{margin-bottom:0}'
    + '.cd-bn-row:active{transform:scale(.99)}'
    + '.cd-bn-ic{flex:0 0 40px;width:40px;height:40px;border-radius:10px;'
    +   'background:var(--cd-bn-green-dim);color:var(--cd-bn-green);'
    +   'display:grid;place-items:center}'
    + '.cd-bn-ic svg{width:20px;height:20px}'
    + '.cd-bn-rc{min-width:0}'
    + '.cd-bn-rc b{display:block;font-size:14px;font-weight:700}'
    + '.cd-bn-rc span{display:block;color:var(--cd-bn-mut);font-size:11px;margin-top:2px}'
    + '@media (prefers-reduced-motion:reduce){'
    +   '.cd-bn-sheet{animation:none}.cd-bn-link:active,.cd-bn-row:active{transform:none}}';

  // ---------- render ----------
  function injectStyles() {
    if (document.getElementById('cd-bn-styles')) return;
    var s = document.createElement('style');
    s.id = 'cd-bn-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function iconSVG(name) { return ICONS[name] || ICONS.home; }

  function buildNav() {
    var nav = document.createElement('nav');
    nav.className = 'cd-bn-nav';
    nav.setAttribute('aria-label', 'Mobile navigation');
    nav.innerHTML = TABS.map(function (t) {
      var isSheet = !!t.sheet;
      var tag = isSheet ? 'button' : 'a';
      var attrs = isSheet
        ? ' type="button" data-cd-sheet="' + t.sheet + '"'
        : ' href="' + t.href + '"';
      return '<' + tag + ' class="cd-bn-link" data-cd-tab="' + t.id + '"' + attrs + '>'
           +   iconSVG(t.icon)
           +   '<span>' + t.label + '</span>'
           + '</' + tag + '>';
    }).join('');
    return nav;
  }

  function buildSheets() {
    var wrap = document.createElement('div');
    wrap.innerHTML = Object.keys(SHEETS).map(function (key) {
      var s = SHEETS[key];
      var rows = s.rows.map(function (r) {
        if (r.action === 'logout') {
          return '<button type="button" class="cd-bn-row" data-cd-action="logout">'
               +   '<span class="cd-bn-ic">' + iconSVG(r.icon) + '</span>'
               +   '<span class="cd-bn-rc"><b>' + r.title + '</b><span>' + r.sub + '</span></span>'
               + '</button>';
        }
        return '<a class="cd-bn-row" href="' + r.href + '">'
             +   '<span class="cd-bn-ic">' + iconSVG(r.icon) + '</span>'
             +   '<span class="cd-bn-rc"><b>' + r.title + '</b><span>' + r.sub + '</span></span>'
             + '</a>';
      }).join('');
      return '<div class="cd-bn-scrim" data-cd-sheet-scrim="' + key + '" aria-hidden="true">'
           +   '<section class="cd-bn-sheet" role="dialog" aria-modal="true" '
           +     'aria-labelledby="cd-bn-title-' + key + '">'
           +     '<div class="cd-bn-handle"></div>'
           +     '<button type="button" class="cd-bn-close" data-cd-close aria-label="Close">'
           +       ICONS.close
           +     '</button>'
           +     '<h2 class="cd-bn-title" id="cd-bn-title-' + key + '">' + s.title + '</h2>'
           +     '<p class="cd-bn-sub">' + s.sub + '</p>'
           +     '<div>' + rows + '</div>'
           +   '</section>'
           + '</div>';
    }).join('');
    return wrap;
  }

  // ---------- active tab from URL ----------
  function detectActiveTab() {
    var p = (location.pathname || '').toLowerCase();
    var hash = (location.hash || '').toLowerCase();

    function matches(list, target) {
      for (var i = 0; i < list.length; i++) if (target.indexOf(list[i]) !== -1) return true;
      return false;
    }

    if (matches(['/darkroom.html', '/quiz-full.html', '/dailyprotocol.html'], p) ||
        matches(['#skill=', '#branch='], hash)) {
      return 'practice';
    }
    if (matches(['/journey.html', '/learning-guide.html', '/guide-chapter.html', '/guide-progress.html'], p)) {
      return 'journey';
    }
    if (matches(['/protocols.html', '/snapshot-library.html'], p)) {
      return 'library';
    }
    if (matches(['/community.html', '/ai-tools.html', '/profile.html'], p)) {
      return 'more';
    }
    if (matches(['/operator-dashboard.html', '/index.html'], p) || p === '/' || p === '') {
      return 'home';
    }
    return null;
  }

  function applyActive(nav) {
    var id = detectActiveTab();
    if (!id) return;
    var link = nav.querySelector('[data-cd-tab="' + id + '"]');
    if (!link) return;
    link.classList.add('cd-active');
    if (link.tagName === 'A') link.setAttribute('aria-current', 'page');
  }

  // ---------- sheet controller ----------
  var lastFocus = null;

  function openSheet(key) {
    var scrim = document.querySelector('[data-cd-sheet-scrim="' + key + '"]');
    if (!scrim) return;
    lastFocus = document.activeElement;
    scrim.classList.add('cd-open');
    scrim.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      var close = scrim.querySelector('[data-cd-close]');
      if (close) close.focus();
    }, 40);
  }

  function closeSheet(scrim) {
    if (!scrim) scrim = document.querySelector('.cd-bn-scrim.cd-open');
    if (!scrim) return;
    scrim.classList.remove('cd-open');
    scrim.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.cd-bn-scrim.cd-open')) {
      document.body.style.overflow = '';
    }
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus(); } catch (e) {}
    }
  }

  function closeAllSheets() {
    document.querySelectorAll('.cd-bn-scrim.cd-open').forEach(function (s) {
      s.classList.remove('cd-open');
      s.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
  }

  function doLogout() {
    closeAllSheets();
    function go() { location.href = '/login.html'; }
    if (window.auth && typeof window.auth.signOut === 'function') {
      window.auth.signOut().then(go, go);
    } else {
      go();
    }
  }

  // ---------- events ----------
  function wire(nav) {
    nav.addEventListener('click', function (e) {
      var sheetBtn = e.target.closest('[data-cd-sheet]');
      if (sheetBtn) {
        e.preventDefault();
        openSheet(sheetBtn.getAttribute('data-cd-sheet'));
      }
    });

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-cd-close]')) {
        e.preventDefault();
        closeSheet(e.target.closest('.cd-bn-scrim'));
        return;
      }
      var scrim = e.target.closest('.cd-bn-scrim');
      if (scrim && e.target === scrim) {
        closeSheet(scrim);
        return;
      }
      var actionBtn = e.target.closest('[data-cd-action]');
      if (actionBtn && actionBtn.getAttribute('data-cd-action') === 'logout') {
        e.preventDefault();
        doLogout();
      }
    });

    document.addEventListener('keydown', function (e) {
      var open = document.querySelector('.cd-bn-scrim.cd-open');
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeSheet(open);
        return;
      }
      if (e.key === 'Tab') {
        var focusable = open.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });

    window.addEventListener('hashchange', function () { applyActive(nav); });
  }

  // ---------- public API ----------
  function updateBadges() { /* reserved for future badge display */ }

  // ---------- boot ----------
  function boot() {
    injectStyles();

    // Remove any prior instance (defensive against double-load)
    document.querySelectorAll('.cd-bn-nav, .cd-bn-scrim').forEach(function (n) { n.remove(); });

    var nav = buildNav();
    var sheets = buildSheets();
    document.body.appendChild(sheets);
    document.body.appendChild(nav);

    applyActive(nav);
    wire(nav);

    window.__CDBottomNav = true;
    window.BottomNav = { updateBadges: updateBadges, close: closeAllSheets };
    console.log('[BottomNav] ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();