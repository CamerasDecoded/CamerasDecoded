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
        <!-- Group 1: Public (always visible) -->
        <div class="nav-group">
          <a href="index.html" class="nav-item" data-page="index.html"><i class="fas fa-home"></i> Home</a>
          <a href="operators.html" class="nav-item" data-page="operators.html"><i class="fas fa-user-astronaut"></i> Operators</a>
          <a href="community.html" class="nav-item" data-page="community.html"><i class="fas fa-users"></i> Community</a>
          <a href="educators-pdf-viewer.html" class="nav-item" data-page="educators-pdf-viewer.html"><i class="fas fa-chalkboard-teacher"></i> Instructors</a>
          <a href="partners.html" class="nav-item" data-page="partners.html"><i class="fas fa-handshake"></i> Partners</a>
        </div>
        <hr class="sidebar-divider">

        <!-- Group 2: Mixed (Journey, Learning Modules, Products, Protocols, Snapshot, Cynetis-7) -->
        <div class="nav-group">
          <a href="journey.html" class="nav-item" data-page="journey.html"><i class="fas fa-route"></i> Journey</a>
          <a href="learning-journey.html" class="nav-item" data-page="learning-journey.html"><i class="fas fa-graduation-cap"></i> Learning Modules</a>
          <a href="products.html" class="nav-item" data-page="products.html"><i class="fas fa-box-open"></i> Products</a>
          <a href="protocols.html" class="nav-item" data-page="protocols.html"><i class="fas fa-code-branch"></i> Protocols</a>
          <a href="snapshot-library.html" class="nav-item" data-page="snapshot-library.html"><i class="fas fa-id-card"></i> Snapshot Cards</a>
          <a href="cynetis-7.html" class="nav-item" data-page="cynetis-7.html"><i class="fas fa-robot"></i> Cynetis-7</a>
        </div>
        <hr class="sidebar-divider">

        <!-- Group 3: Blog, Podcast, Inner Signal -->
        <div class="nav-group">
          <a href="blog-updates.html" class="nav-item" data-page="blog-updates.html"><i class="fas fa-newspaper"></i> Blog/Updates</a>
          <a href="podcast.html" class="nav-item" data-page="podcast.html"><i class="fas fa-podcast"></i> Podcast</a>
          <a href="inner-signal.html" class="nav-item" data-page="inner-signal.html"><i class="fas fa-brain"></i> Inner Signal</a>
        </div>
        <hr class="sidebar-divider">

        <!-- PRIVATE LINKS (hidden when logged out) -->
        <div class="nav-group private-links" id="privateLinks" style="display:none;">
          <a href="operator-dashboard.html" class="nav-item" data-page="operator-dashboard.html"><i class="fas fa-chart-simple"></i> Dashboard</a>
          <a href="profile.html" class="nav-item" data-page="profile.html"><i class="fas fa-id-card"></i> Profile</a>
          <a href="#" class="nav-item" data-page="settings.html"><i class="fas fa-cog"></i> Settings</a>
          <a href="#" class="nav-item" data-page="billing.html"><i class="fas fa-credit-card"></i> Billing</a>
          <a href="#" class="nav-item" onclick="handleLogout(); return false;" style="color:#ff4a4a;"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </div>

        <!-- AUTH CTA (shown when logged out) -->
        <div class="nav-group auth-cta" id="authCta" style="display:flex; flex-direction:column; gap:8px; padding-top:4px;">
          <a href="login.html" class="nav-item" style="border:1px solid var(--green); border-radius:30px; justify-content:center; color:var(--green);"><i class="fas fa-sign-in-alt"></i> Log in</a>
          <a href="signup.html" class="nav-item" style="border:1px solid var(--green); border-radius:30px; justify-content:center; background:var(--green); color:#000;"><i class="fas fa-user-plus"></i> Sign Up</a>
        </div>

        <!-- Admin-only links (hidden by default, shown if user is admin) -->
        <hr class="sidebar-divider admin-only" style="display:none;">
        <div class="nav-group admin-only" style="display:none;">
          <a href="admin-dashboard.html" class="nav-item" data-page="admin-dashboard.html"><i class="fas fa-chart-pie"></i> Admin Dashboard</a>
          <a href="admin-profile.html" class="nav-item" data-page="admin-profile.html"><i class="fas fa-user-cog"></i> Admin Profile</a>
        </div>
      </nav>

      <!-- Announcement section (pinned to bottom) -->
      <div class="sidebar-notification" id="sidebarNotification">
        <div class="notif-header">
          <i class="fas fa-bullhorn"></i>
          <span>Announcement</span>
        </div>
        <div class="notif-message empty" id="sidebarAnnouncement">No active announcement</div>
        <div class="notif-timestamp" id="sidebarAnnouncementTimestamp"></div>
      </div>
    </aside>
  `;

  // ---- Inject sidebar into page ----
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

    // Update visibility based on auth state
    updateAuthVisibility();
    checkAndShowAdminLinks();

    // ---- Mobile toggle (floating header button) ----
    const floatingToggle = document.getElementById('floatingToggle');
    if (floatingToggle) {
      floatingToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('open');
      });
    }
  }

  // ---- Toggle private links vs auth CTA based on user ----
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

  // ---- Check admin role and show admin-only links ----
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

  // ---- Load user profile into sidebar ----
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

  // ---- Load announcement from Firestore and listen for changes ----
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
      window.location.href = 'login.html';
    }).catch(() => {
      window.location.href = 'login.html';
    });
  };

  // ---- Auto‑init ----
  document.addEventListener('DOMContentLoaded', function() {
    injectSidebar();

    // Ensure sidebar gets proper styling from the dashboard's CSS
    // The dashboard's CSS already has .sidebar styles; we just need to make sure it applies.

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

  // Expose for later use
  window.Sidebar = {
    inject: injectSidebar,
    loadProfile: loadSidebarProfile,
    loadAnnouncement: loadAndListenToAnnouncement
  };
})();