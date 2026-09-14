// desktop-sidebar.js — shared desktop sidebar for app pages.
//
// Replaces the legacy root sidebar.js on pages that adopt it. Unlike sidebar.js,
// this component is fully self-contained: it injects its own prefixed CSS
// (cd-ds-*), needs no per-page stylesheet surgery, and never touches the
// firebase global. It mirrors the mobile bottom nav's destinations (flattened),
// stays role-aware like bottom-nav.js, and only renders on desktop (>820px) —
// on mobile the bottom nav takes over.
//
// Usage: add <script src="/scripts/desktop-sidebar.js"></script> to the page.
// Optional: window.DesktopSidebar.setRole('Admin') to switch role-aware links.

(function () {
  'use strict';

  var SIDEBAR_WIDTH = 256;
  var DESKTOP_MIN = 821; // matches bottom-nav's mobile breakpoint (max-width:820px)

  // ---------- role-aware routes (mirrors scripts/bottom-nav.js) ----------
  var ROLE_MAP = {
    'Operator':   { dashboard: '/operator-dashboard.html',   profile: '/profile.html' },
    'Partner':    { dashboard: '/partner-dashboard.html',    profile: '/partner-profile.html' },
    'Instructor': { dashboard: '/instructor-dashboard.html', profile: '/instructor-profile.html' },
    'Admin':      { dashboard: '/admin-dashboard.html',      profile: '/admin-profile.html' }
  };
  var currentRole = 'Operator';
  function normalizeRole(role) {
    var r = String(role || 'Operator').toLowerCase();
    var keys = Object.keys(ROLE_MAP);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === r) return keys[i];
    }
    return 'Operator';
  }
  function roleConfig() { return ROLE_MAP[currentRole] || ROLE_MAP['Operator']; }
  function detectInitialRole() {
    if (window.USER && window.USER.role) return window.USER.role;
    return 'Operator';
  }

  // ---------- links (bottom-nav IA, flattened; Community cut for launch) ----------
  // role:'dashboard' / role:'profile' marks role-aware destinations.
  var GROUPS = [
    { label: 'Navigate', links: [
      { id: 'home',     label: 'Home',          icon: 'fa-grid-2',           href: '/operator-dashboard.html', role: 'dashboard' },
      { id: 'missions', label: 'Missions',      icon: 'fa-route',            href: '/journey.html' },
      { id: 'library',  label: 'Library',       icon: 'fa-book-open',        href: '/protocols.html' }
    ]},
    { label: 'Practice', links: [
      { id: 'darkroom', label: 'The Darkroom',  icon: 'fa-circle-notch',     href: '/darkroom.html' },
      { id: 'challenge',label: "Today's Challenge", icon: 'fa-bolt',        href: '/dailyprotocol.html' },
      { id: 'quiz',     label: 'Quiz Arena',    icon: 'fa-clipboard-question', href: '/quiz-full.html' }
    ]},
    { label: 'More', links: [
      { id: 'snapshots',label: 'Snapshots',     icon: 'fa-camera',           href: '/snapshot-library.html' },
      { id: 'ai',       label: 'AI Workbench',  icon: 'fa-brain',            href: '/ai-tools.html' },
      { id: 'profile',  label: 'Profile',       icon: 'fa-circle-user',      href: '/profile.html', role: 'profile' }
    ]}
  ];

  // ---------- self-contained styles (cd-ds-* prefix; no page CSS needed) ----------
  var CSS = ''
    + '.cd-ds-sidebar{display:none}'
    + '@media (min-width:' + DESKTOP_MIN + 'px){'
    +   'body.cd-ds-on{padding-left:' + SIDEBAR_WIDTH + 'px}'
    +   '.cd-ds-sidebar{display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;'
    +     'width:' + SIDEBAR_WIDTH + 'px;z-index:60;'
    +     'background:rgba(10,10,12,.97);border-right:1px solid rgba(255,255,255,.08);'
    +     'padding:22px 14px 18px;overflow-y:auto;overflow-x:hidden;'
    +     'font-family:"Montserrat",system-ui,-apple-system,sans-serif}'
    +   '.cd-ds-brand{display:flex;align-items:center;gap:10px;padding:2px 8px 16px;'
    +     'border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:14px}'
    +   '.cd-ds-brand img{width:34px;height:34px;object-fit:contain;flex:0 0 auto}'
    +   '.cd-ds-brand span{font-family:"Space Mono",ui-monospace,monospace;font-size:11px;'
    +     'letter-spacing:2.5px;text-transform:uppercase;color:#f7f8f5}'
    +   '.cd-ds-label{font-family:"Space Mono",ui-monospace,monospace;font-size:9px;'
    +     'letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,.38);'
    +     'padding:12px 12px 6px}'
    +   '.cd-ds-link{display:flex;align-items:center;gap:12px;padding:10px 12px;'
    +     'border-radius:10px;color:rgba(255,255,255,.62);text-decoration:none;'
    +     'font-size:13px;font-weight:600;position:relative;transition:background .15s ease,color .15s ease}'
    +   '.cd-ds-link i{width:20px;text-align:center;font-size:15px;color:rgba(255,255,255,.45);'
    +     'transition:color .15s ease;flex:0 0 auto}'
    +   '.cd-ds-link:hover{background:rgba(255,255,255,.05);color:#f7f8f5}'
    +   '.cd-ds-link:hover i{color:#8deb00}'
    +   '.cd-ds-link:focus-visible{outline:2px solid #8deb00;outline-offset:2px}'
    +   '.cd-ds-link[aria-current="page"]{background:rgba(141,235,0,.09);color:#f7f8f5}'
    +   '.cd-ds-link[aria-current="page"] i{color:#8deb00}'
    +   '.cd-ds-link[aria-current="page"]::before{content:"";position:absolute;left:0;top:8px;bottom:8px;'
    +     'width:3px;border-radius:3px;background:#8deb00;box-shadow:0 0 10px rgba(141,235,0,.7)}'
    +   '.cd-ds-foot{margin-top:auto;padding:14px 8px 0;border-top:1px solid rgba(255,255,255,.07);'
    +     'font-family:"Space Mono",ui-monospace,monospace;font-size:9px;letter-spacing:1.5px;'
    +     'text-transform:uppercase;color:rgba(255,255,255,.3)}'
    + '}'
    + '@media (prefers-reduced-motion:reduce){.cd-ds-link{transition:none}}';

  function injectStyles() {
    if (document.getElementById('cd-ds-styles')) return;
    var s = document.createElement('style');
    s.id = 'cd-ds-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function currentPage() {
    return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function resolveHref(link) {
    if (link.role === 'dashboard') return roleConfig().dashboard;
    if (link.role === 'profile') return roleConfig().profile;
    return link.href;
  }

  function buildSidebar() {
    var page = currentPage();
    var html = '<aside class="cd-ds-sidebar" aria-label="Primary navigation">';
    html += '<div class="cd-ds-brand"><img src="/cameras-decoded-logo.png" alt="" aria-hidden="true" /><span>Cameras<br/>Decoded</span></div>';
    html += '<nav>';
    GROUPS.forEach(function (g) {
      html += '<div class="cd-ds-label">' + g.label + '</div>';
      g.links.forEach(function (l) {
        var href = resolveHref(l);
        var active = page === href.split('/').pop().toLowerCase();
        html += '<a class="cd-ds-link" data-cd-ds="' + l.id + '" href="' + href + '"'
          + (active ? ' aria-current="page"' : '')
          + (l.role ? ' data-cd-ds-role="' + l.role + '"' : '')
          + '><i class="fas ' + l.icon + '" aria-hidden="true"></i><span>' + l.label + '</span></a>';
      });
    });
    html += '</nav>';
    html += '<div class="cd-ds-foot">Operator workspace</div>';
    html += '</aside>';
    return html;
  }

  function setRole(role) {
    currentRole = normalizeRole(role);
    var cfg = roleConfig();
    document.querySelectorAll('[data-cd-ds-role="dashboard"]').forEach(function (a) { a.setAttribute('href', cfg.dashboard); });
    document.querySelectorAll('[data-cd-ds-role="profile"]').forEach(function (a) { a.setAttribute('href', cfg.profile); });
  }

  function boot() {
    injectStyles();
    // Defensive against double-load.
    document.querySelectorAll('.cd-ds-sidebar').forEach(function (n) { n.remove(); });
    currentRole = normalizeRole(detectInitialRole());
    window.addEventListener('userStateReady', function (e) {
      var r = e && e.detail && e.detail.role;
      if (r) setRole(r);
    });
    var tmp = document.createElement('div');
    tmp.innerHTML = buildSidebar();
    document.body.prepend(tmp.firstElementChild);
    // cd-ds-on means "the desktop sidebar is actually visible". Gate it on the
    // desktop breakpoint: on mobile the sidebar is display:none, and shared
    // chrome (e.g. the floating header's --hdr-left) keys off this class.
    // A stray class on mobile would squash the header to a sliver.
    var desktopMQ = window.matchMedia('(min-width:' + DESKTOP_MIN + 'px)');
    function syncSidebarClass() {
      document.body.classList.toggle('cd-ds-on', desktopMQ.matches);
    }
    syncSidebarClass();
    if (typeof desktopMQ.addEventListener === 'function') {
      desktopMQ.addEventListener('change', syncSidebarClass);
    } else if (typeof desktopMQ.addListener === 'function') {
      desktopMQ.addListener(syncSidebarClass);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.DesktopSidebar = { setRole: setRole, refresh: boot };
})();
