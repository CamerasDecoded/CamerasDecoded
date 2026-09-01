// ================================================================
// SHARED SIDEBAR – auth‑aware + role‑based access control
// ================================================================

(function() {
  'use strict';

  // ---- Role‑based dashboard + profile mapping ----
  const ROLE_MAP = {
    'Operator': {
      dashboard: '/test-app/test-operator-dashboard.html',
      profile: '/test-app/test-profile.html'
    },
    'Partner': {
      dashboard: '/test-app/test-partner-dashboard.html',
      profile: '/test-app/test-partner-profile.html'
    },
    'Instructor': {
      dashboard: '/test-app/test-instructor-dashboard.html',
      profile: '/test-app/test-instructor-profile.html'
    },
    'Admin': {
      dashboard: '/test-app/test-admin-dashboard.html',
      profile: '/test-app/test-admin-profile.html'
    },
    'admin': {
      dashboard: '/test-app/test-admin-dashboard.html',
      profile: '/test-app/test-admin-profile.html'
    }
  };

  // ---- HTML template (with data‑role attributes for access control) ----
  const SIDEBAR_HTML = `
    <aside class="sidebar" id="sidebar">
      <div class="logo"><a href="/test-app/test-index.html"><img src="/test-app/cameras-decoded-logo.png" alt="Cameras Decoded" /></a></div>
      <div class="sidebar-profile">
        <div class="profile-avatar" id="profileAvatar" style="background-image:url('/test-app/cameras-decoded-logo.png');"></div>
        <div class="profile-name" id="sidebarUsername">Operator</div>
        <div class="profile-email" id="sidebarEmail">loading...</div>
      </div>
      <nav class="sidebar-nav">
        <!-- Group 1: Public (visible to everyone) -->
        <div class="nav-group">
          <a href="/test-app/test-index.html" class="nav-item" data-page="test-index.html"><i class="fa-regular fa-house"></i> Home</a>
          <a href="/test-app/test-operators.html" class="nav-item" data-page="test-operators.html"><i class="fa-regular fa-user"></i> Operators</a>
          <a href="/test-app/test-community.html" class="nav-item" data-page="test-community.html"><i class="fa-regular fa-users"></i> Community</a>
          <a href="/test-app/test-educators-pdf-viewer.html" class="nav-item" data-page="test-educators-pdf-viewer.html"><i class="fa-regular fa-chalkboard-user"></i> Instructors</a>
          <a href="/test-app/test-partners.html" class="nav-item" data-page="test-partners.html"><i class="fa-regular fa-handshake"></i> Partners</a>
        </div>
        <hr class="sidebar-divider">

        <!-- Group 2: Mixed (visible to all) -->
        <div class="nav-group">
          <a href="/test-app/test-journey.html" class="nav-item" data-page="test-journey.html"><i class="fa-regular fa-route"></i> Journey</a>
          <a href="/test-app/test-learning-journey.html" class="nav-item" data-page="test-learning-journey.html"><i class="fa-regular fa-graduation-cap"></i> Learning Modules</a>
          <a href="/test-app/test-products.html" class="nav-item" data-page="test-products.html"><i class="fa-regular fa-box-open"></i> Products</a>
          <a href="/test-app/test-protocols.html" class="nav-item" data-page="test-protocols.html"><i class="fa-regular fa-code-branch"></i> Protocols</a>
          <a href="/test-app/test-snapshot-library.html" class="nav-item" data-page="test-snapshot-library.html"><i class="fa-regular fa-id-card"></i> Snapshot Cards</a>
          <a href="/test-app/test-cynetis-7.html" class="nav-item" data-page="test-cynetis-7.html"><i class="fa-regular fa-robot"></i> Cynetis-7</a>
        </div>
        <hr class="sidebar-divider">

        <!-- Group 3: Blog, Podcast, Inner Signal -->
        <div class="nav-group">
          <a href="/test-app/test-blog-updates.html" class="nav-item" data-page="test-blog-updates.html"><i class="fa-regular fa-newspaper"></i> Blog/Updates</a>
          <a href="/test-app/test-podcast.html" class="nav-item" data-page="test-podcast.html"><i class="fa-regular fa-podcast"></i> Podcast</a>
          <a href="/test-app/test-inner-signal.html" class="nav-item" data-page="test-inner-signal.html"><i class="fa-regular fa-brain"></i> Inner Signal</a>
        </div>
        <hr class="sidebar-divider">

        <!-- PRIVATE LINKS (visible only when logged in) -->
        <div class="nav-group private-links" id="privateLinks" style="display:none;">
          <!-- Dashboard – href will be updated dynamically -->
          <a href="#" class="nav-item" id="dashboardLink" data-page=""><i class="fa-regular fa-chart-simple"></i> Dashboard</a>
          <a href="#" class="nav-item" id="profileLink" data-page=""><i class="fa-regular fa-id-card"></i> Profile</a>
          <a href="/test-app/test-settings.html" class="nav-item" data-page="test-settings.html"><i class="fa-regular fa-gear"></i> Settings</a>
          <a href="/test-app/test-billing.html" class="nav-item" data-page="test-billing.html"><i class="fa-regular fa-credit-card"></i> Billing</a>
          <a href="#" class="nav-item" onclick="handleLogout(); return false;" style="color:#ff4a4a;"><i class="fa-regular fa-right-from-bracket"></i> Logout</a>
        </div>

        <!-- AUTH CTA (visible only when logged out) -->
        <div class="nav-group auth-cta" id="authCta" style="display:flex; flex-direction:column; gap:8px; padding-top:4px;">
          <a href="/test-app/test-login.html" class="nav-item" style="border:1px solid var(--green); border-radius:30px; justify-content:center; color:var(--green);"><i class="fa-regular fa-right-to-bracket"></i> Log in</a>
          <a href="/test-app/test-signup.html" class="nav-item" style="border:1px solid var(--green); border-radius:30px; justify-content:center; background:var(--green); color:#000;"><i class="fa-regular fa-user-plus"></i> Sign Up</a>
        </div>

        <!-- Admin‑only links (hidden by default) -->
        <hr class="sidebar-divider admin-only" style="display:none;">
        <div class="nav-group admin-only" style="display:none;">
          <a href="/test-app/test-admin-dashboard.html" class="nav-item" data-page="test-admin-dashboard.html"><i class="fa-regular fa-chart-pie"></i> Admin Dashboard</a>
          <a href="/test-app/test-admin-profile.html" class="nav-item" data-page="test-admin-profile.html"><i class="fa-regular fa-user-gear"></i> Admin Profile</a>
        </div>
      </nav>

      <!-- Announcement -->
      <div class="sidebar-notification" id="sidebarNotification">
        <div class="notif-header">
          <i class="fa-regular fa-bullhorn"></i>
          <span>Announcement</span>
        </div>
        <div class="notif-message empty" id="sidebarAnnouncement">No active announcement</div>
        <div class="notif-timestamp" id="sidebarAnnouncementTimestamp"></div>
      </div>
    </aside>
  `;

  // ---- Injection ----
  function injectSidebar() {
    if (document.getElementById('sidebar')) return;
    const container = document.getElementById('sidebarContainer');
    if (container) {
      container.innerHTML = SIDEBAR_HTML;
    } else {
      const div = document.createElement('div');
      div.id = 'sidebarContainer';
      div.innerHTML = SIDEBAR_HTML;
      document.body.prepend(div);
    }

    // Set active link based on current page
    setActiveNav();
    updateAuthVisibility();
    applyAccessControl();
    checkAndShowAdminLinks();
  }

  // ---- Set active link (helper) ----
  function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'test-index.html';
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
      const page = link.getAttribute('data-page');
      if (page === path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ---- Toggle auth visibility (private vs public) ----
  function updateAuthVisibility() {
    const user = firebase.auth().currentUser;
    const privateLinks = document.getElementById('privateLinks');
    const authCta = document.getElementById('authCta');
    const profileName = document.getElementById('sidebarUsername');
    const profileEmail = document.getElementById('sidebarEmail');
    const avatar = document.querySelector('.profile-avatar');

    if (user) {
      if (privateLinks) privateLinks.style.display = 'flex';
      if (authCta) authCta.style.display = 'none';
    } else {
      if (privateLinks) privateLinks.style.display = 'none';
      if (authCta) authCta.style.display = 'flex';
      if (profileName) profileName.textContent = 'Guest';
      if (profileEmail) profileEmail.textContent = 'Not logged in';
      if (avatar) avatar.style.backgroundImage = "url('/test-app/cameras-decoded-logo.png')";
    }
  }

  // ---- Access Control: Role‑based visibility of nav items ----
  function applyAccessControl() {
    const role = window.USER && window.USER.isLoggedIn ? window.USER.role : null;

    const dashboardLink = document.getElementById('dashboardLink');
    const profileLink = document.getElementById('profileLink');

    if (dashboardLink) {
      if (role && ROLE_MAP[role]) {
        dashboardLink.href = ROLE_MAP[role].dashboard;
        dashboardLink.setAttribute('data-page', ROLE_MAP[role].dashboard.split('/').pop());
        dashboardLink.style.display = 'flex';
      } else {
        dashboardLink.style.display = 'none';
      }
    }
    if (profileLink) {
      if (role && ROLE_MAP[role]) {
        profileLink.href = ROLE_MAP[role].profile;
        profileLink.setAttribute('data-page', ROLE_MAP[role].profile.split('/').pop());
        profileLink.style.display = 'flex';
      } else {
        profileLink.style.display = 'none';
      }
    }

    // Update active link after href changes
    setActiveNav();

    // Hide/show Cynetis, Products, Protocols, Snapshot Cards for Partners/Instructors
    const restrictedPages = ['test-cynetis-7.html', 'test-products.html', 'test-protocols.html', 'test-snapshot-library.html'];
    restrictedPages.forEach(page => {
      const link = document.querySelector(`.sidebar-nav a[data-page="${page}"]`);
      if (link) {
        const shouldHide = (role === 'Partner' || role === 'Instructor' || role === 'admin' || role === 'Admin');
        link.style.display = shouldHide ? 'none' : 'flex';
      }
    });
  }

  // ---- Admin links ----
  async function checkAndShowAdminLinks() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const doc = await firebase.firestore().collection('users').doc(user.uid).get();
      if (doc.exists && (doc.data().role === 'admin' || doc.data().role === 'Admin')) {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.admin-only .nav-item').forEach(el => el.style.display = 'flex');
      }
    } catch (e) {
      console.warn('Admin check error:', e);
    }
  }

  // ---- Profile info ----
  async function loadSidebarProfile() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        updateAuthVisibility();
        return;
      }
      const doc = await firebase.firestore().collection('users').doc(user.uid).get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('sidebarUsername').textContent = data.username || data.name || 'Operator';
        document.getElementById('sidebarEmail').textContent = data.email || '';
        const avatar = document.querySelector('.profile-avatar');
        if (data.photoURL) avatar.style.backgroundImage = `url(${data.photoURL})`;
      }
      updateAuthVisibility();
      applyAccessControl();
    } catch (e) {
      console.warn('Could not load profile:', e);
    }
  }

  // ---- Announcement listener ----
  function loadAndListenToAnnouncement() {
    try {
      const db = firebase.firestore();
      const announcementEl = document.getElementById('sidebarAnnouncement');
      const timestampEl = document.getElementById('sidebarAnnouncementTimestamp');
      const container = document.getElementById('sidebarNotification');
      if (!announcementEl || !container) return;

      db.collection('admin').doc('announcement').onSnapshot((doc) => {
        if (doc.exists && doc.data().active && doc.data().message) {
          const data = doc.data();
          announcementEl.textContent = data.message;
          announcementEl.className = 'notif-message';
          if (data.updatedAt) {
            const date = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
            if (timestampEl) {
              timestampEl.textContent = 'Updated ' + date.toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
              timestampEl.style.display = 'block';
            }
          }
          container.style.display = 'block';
        } else {
          announcementEl.textContent = 'No active announcement';
          announcementEl.className = 'notif-message empty';
          if (timestampEl) {
            timestampEl.textContent = '';
            timestampEl.style.display = 'none';
          }
        }
      });
    } catch (e) {
      console.warn('Announcement listener error:', e);
    }
  }

  // ---- Logout ----
  window.handleLogout = function() {
    firebase.auth().signOut().then(() => {
      window.location.href = '/test-app/test-login.html';
    }).catch(() => {
      window.location.href = '/test-app/test-login.html';
    });
  };

  // ---- Mobile bottom sheet ----
  function buildMobileSheet() {
    let overlay = document.getElementById('mobileOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mobileOverlay';
      document.body.appendChild(overlay);
    }

    let sheet = document.getElementById('mobileSheet');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'mobileSheet';
      document.body.appendChild(sheet);
    }

    // Grab the current sidebar nav HTML (already updated with correct links)
    const sidebar = document.getElementById('sidebar');
    let navHTML = '';
    if (sidebar) {
      const nav = sidebar.querySelector('.sidebar-nav');
      if (nav) navHTML = nav.outerHTML;
    } else {
      const temp = document.createElement('div');
      temp.innerHTML = SIDEBAR_HTML;
      const nav = temp.querySelector('.sidebar-nav');
      if (nav) navHTML = nav.outerHTML;
    }

    sheet.innerHTML = `
      <div class="sheet-header">
        <button class="sheet-close" id="sheetClose">&times;</button>
      </div>
      ${navHTML}
    `;

    setActiveNav(); // Also set active in sheet
    const closeBtn = sheet.querySelector('#sheetClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeMobileSheet);
    }
    overlay.addEventListener('click', closeMobileSheet);
  }

  function openMobileSheet() {
    const overlay = document.getElementById('mobileOverlay');
    const sheet = document.getElementById('mobileSheet');
    if (overlay) overlay.classList.add('open');
    if (sheet) sheet.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileSheet() {
    const overlay = document.getElementById('mobileOverlay');
    const sheet = document.getElementById('mobileSheet');
    if (overlay) overlay.classList.remove('open');
    if (sheet) sheet.classList.remove('open');
    document.body.style.overflow = '';
  }

  function createFloatingButton() {
    let fab = document.getElementById('fabToggle');
    if (fab) return;
    fab = document.createElement('button');
    fab.id = 'fabToggle';
    fab.innerHTML = '<i class="fa-regular fa-bars"></i>';
    fab.setAttribute('aria-label', 'Open menu');
    document.body.appendChild(fab);

    fab.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!document.getElementById('mobileSheet')?.children.length) {
        buildMobileSheet();
      }
      openMobileSheet();
    });
  }

  // ---- Update mobile sheet when user state changes ----
  function updateMobileSheetOnUserState() {
    const sheet = document.getElementById('mobileSheet');
    if (sheet && sheet.children.length > 0) {
      // Rebuild the sheet content with updated sidebar nav
      buildMobileSheet();
    }
  }

  // ---- Auto‑init ----
  document.addEventListener('DOMContentLoaded', function() {
    injectSidebar();
    if (window.innerWidth <= 768) {
      createFloatingButton();
      buildMobileSheet();
    }

    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          loadSidebarProfile();
          loadAndListenToAnnouncement();
          checkAndShowAdminLinks();
        } else {
          updateAuthVisibility();
          applyAccessControl();
          loadAndListenToAnnouncement();
        }
        // After auth state resolves, update mobile sheet if exists
        updateMobileSheetOnUserState();
      });
    }

    window.addEventListener('userStateReady', (e) => {
      applyAccessControl();
      checkAndShowAdminLinks();
      updateMobileSheetOnUserState();
    });
  });

  window.addEventListener('resize', function() {
    const fab = document.getElementById('fabToggle');
    if (window.innerWidth <= 768) {
      if (!fab) createFloatingButton();
    } else {
      if (fab) fab.style.display = 'none';
      closeMobileSheet();
    }
  });

  window.Sidebar = {
    inject: injectSidebar,
    loadProfile: loadSidebarProfile,
    loadAnnouncement: loadAndListenToAnnouncement,
    openMobileSheet: openMobileSheet,
    closeMobileSheet: closeMobileSheet,
    buildMobileSheet: buildMobileSheet,
    applyAccessControl: applyAccessControl
  };
})();