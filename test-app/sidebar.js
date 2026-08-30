// ================================================================
// SHARED SIDEBAR – auth‑aware (hides Dashboard/Profile/Settings/Billing/Logout for guests)
// ================================================================

(function() {
  'use strict';

  const SIDEBAR_HTML = `
    <aside class="sidebar" id="sidebar">
      <div class="logo"><a href="index.html"><img src="cameras-decoded-logo.png" alt="Cameras Decoded" /></a></div>
      <div class="sidebar-profile">
        <div class="profile-avatar" id="profileAvatar" style="background-image:url('cameras-decoded-logo.png');"></div>
        <div class="profile-name" id="sidebarUsername">Operator</div>
        <div class="profile-email" id="sidebarEmail">loading...</div>
      </div>
      <nav class="sidebar-nav">
        <!-- Group 1: Public -->
        <div class="nav-group">
          <a href="index.html" class="nav-item" data-page="index.html"><i class="fa-regular fa-house"></i> Home</a>
          <a href="operators.html" class="nav-item" data-page="operators.html"><i class="fa-regular fa-user"></i> Operators</a>
          <a href="community.html" class="nav-item" data-page="community.html"><i class="fa-regular fa-users"></i> Community</a>
          <a href="educators-pdf-viewer.html" class="nav-item" data-page="educators-pdf-viewer.html"><i class="fa-regular fa-chalkboard-user"></i> Instructors</a>
          <a href="partners.html" class="nav-item" data-page="partners.html"><i class="fa-regular fa-handshake"></i> Partners</a>
        </div>
        <hr class="sidebar-divider">

        <!-- Group 2: Mixed -->
        <div class="nav-group">
          <a href="journey.html" class="nav-item" data-page="journey.html"><i class="fa-regular fa-route"></i> Journey</a>
          <a href="learning-journey.html" class="nav-item" data-page="learning-journey.html"><i class="fa-regular fa-graduation-cap"></i> Learning Modules</a>
          <a href="products.html" class="nav-item" data-page="products.html"><i class="fa-regular fa-box-open"></i> Products</a>
          <a href="protocols.html" class="nav-item" data-page="protocols.html"><i class="fa-regular fa-code-branch"></i> Protocols</a>
          <a href="snapshot-library.html" class="nav-item" data-page="snapshot-library.html"><i class="fa-regular fa-id-card"></i> Snapshot Cards</a>
          <a href="cynetis-7.html" class="nav-item" data-page="cynetis-7.html"><i class="fa-regular fa-robot"></i> Cynetis-7</a>
        </div>
        <hr class="sidebar-divider">

        <!-- Group 3: Blog, Podcast, Inner Signal -->
        <div class="nav-group">
          <a href="blog-updates.html" class="nav-item" data-page="blog-updates.html"><i class="fa-regular fa-newspaper"></i> Blog/Updates</a>
          <a href="podcast.html" class="nav-item" data-page="podcast.html"><i class="fa-regular fa-podcast"></i> Podcast</a>
          <a href="inner-signal.html" class="nav-item" data-page="inner-signal.html"><i class="fa-regular fa-brain"></i> Inner Signal</a>
        </div>
        <hr class="sidebar-divider">

        <!-- PRIVATE LINKS -->
        <div class="nav-group private-links" id="privateLinks" style="display:none;">
          <a href="operator-dashboard.html" class="nav-item" data-page="operator-dashboard.html"><i class="fa-regular fa-chart-simple"></i> Dashboard</a>
          <a href="profile.html" class="nav-item" data-page="profile.html"><i class="fa-regular fa-id-card"></i> Profile</a>
          <a href="#" class="nav-item" data-page="settings.html"><i class="fa-regular fa-gear"></i> Settings</a>
          <a href="#" class="nav-item" data-page="billing.html"><i class="fa-regular fa-credit-card"></i> Billing</a>
          <a href="#" class="nav-item" onclick="handleLogout(); return false;" style="color:#ff4a4a;"><i class="fa-regular fa-right-from-bracket"></i> Logout</a>
        </div>

        <!-- AUTH CTA -->
        <div class="nav-group auth-cta" id="authCta" style="display:flex; flex-direction:column; gap:8px; padding-top:4px;">
          <a href="login.html" class="nav-item" style="border:1px solid var(--green); border-radius:30px; justify-content:center; color:var(--green);"><i class="fa-regular fa-right-to-bracket"></i> Log in</a>
          <a href="signup.html" class="nav-item" style="border:1px solid var(--green); border-radius:30px; justify-content:center; background:var(--green); color:#000;"><i class="fa-regular fa-user-plus"></i> Sign Up</a>
        </div>

        <!-- Admin-only -->
        <hr class="sidebar-divider admin-only" style="display:none;">
        <div class="nav-group admin-only" style="display:none;">
          <a href="admin-dashboard.html" class="nav-item" data-page="admin-dashboard.html"><i class="fa-regular fa-chart-pie"></i> Admin Dashboard</a>
          <a href="admin-profile.html" class="nav-item" data-page="admin-profile.html"><i class="fa-regular fa-user-gear"></i> Admin Profile</a>
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
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
      const href = link.getAttribute('data-page');
      if (href === path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    updateAuthVisibility();
    checkAndShowAdminLinks();
  }

  // ---- Toggle visibility ----
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
      if (avatar) avatar.style.backgroundImage = "url('cameras-decoded-logo.png')";
    }
  }

  async function checkAndShowAdminLinks() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const doc = await firebase.firestore().collection('users').doc(user.uid).get();
      if (doc.exists && doc.data().role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.admin-only .nav-item').forEach(el => el.style.display = 'flex');
      }
    } catch (e) {
      console.warn('Admin check error:', e);
    }
  }

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
        document.getElementById('sidebarUsername').textContent = data.username || 'Operator';
        document.getElementById('sidebarEmail').textContent = data.email || '';
        const avatar = document.querySelector('.profile-avatar');
        if (data.photoURL) avatar.style.backgroundImage = `url(${data.photoURL})`;
      }
      updateAuthVisibility();
    } catch (e) {
      console.warn('Could not load profile:', e);
    }
  }

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

  window.handleLogout = function() {
    firebase.auth().signOut().then(() => {
      window.location.href = 'login.html';
    }).catch(() => {
      window.location.href = 'login.html';
    });
  };

  // ============================================================
  // MOBILE BOTTOM SHEET
  // ============================================================

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

    // Clone the sidebar-nav from the desktop sidebar
    const sidebar = document.getElementById('sidebar');
    let navHTML = '';
    if (sidebar) {
      const nav = sidebar.querySelector('.sidebar-nav');
      if (nav) navHTML = nav.outerHTML;
    } else {
      // Fallback: use the raw nav from SIDEBAR_HTML
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

    // Update nav-item hrefs and active state
    const path = window.location.pathname.split('/').pop() || 'index.html';
    sheet.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
      const href = link.getAttribute('data-page');
      if (href === path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Close handlers
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

  // ---- Auto‑init ----
  document.addEventListener('DOMContentLoaded', function() {
    injectSidebar();
    // Setup mobile if on small screen
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
          loadAndListenToAnnouncement();
        }
      });
    }
  });

  // On resize, toggle FAB visibility
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
    buildMobileSheet: buildMobileSheet
  };
})();