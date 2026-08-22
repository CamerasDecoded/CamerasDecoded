// ================================================================
// SHARED SIDEBAR – injected into admin dashboard and other pages
// ================================================================

(function() {
  'use strict';

  const SIDEBAR_HTML = `
    <aside class="sidebar" id="sidebar">
      <div class="logo"><a href="index.html"><img src="cameras-decoded-logo.png" alt="Cameras Decoded" /></a></div>
      <div class="sidebar-profile">
        <div class="profile-avatar" id="profileAvatar" style="background-image:url('cameras-decoded-logo.png');"></div>
        <div class="profile-name" id="sidebarUsername">Admin</div>
        <div class="profile-email" id="sidebarEmail">loading...</div>
      </div>
      <nav class="sidebar-nav">
        <a href="admin-dashboard.html" class="nav-item active"><i class="fas fa-chart-pie"></i> Dashboard</a>
        <a href="index.html" class="nav-item"><i class="fas fa-home"></i> Home</a>
        <a href="users.html" class="nav-item"><i class="fas fa-users"></i> Users</a>
        <a href="modules.html" class="nav-item"><i class="fas fa-book"></i> Modules</a>
        <a href="notifications.html" class="nav-item"><i class="fas fa-bell"></i> Notifications</a>
        <a href="settings.html" class="nav-item"><i class="fas fa-cog"></i> Settings</a>
        <a href="#" class="nav-item" onclick="handleLogout(); return false;" style="color:#ff4a4a; margin-top:auto;"><i class="fas fa-sign-out-alt"></i> Logout</a>
      </nav>
    </aside>
  `;

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
    const path = window.location.pathname.split('/').pop() || 'admin-dashboard.html';
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
      const href = link.getAttribute('href');
      if (href === path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ---- Load user profile into sidebar ----
  async function loadSidebarProfile() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const doc = await firebase.firestore().collection('users').doc(user.uid).get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('sidebarUsername').textContent = data.username || 'Admin';
        document.getElementById('sidebarEmail').textContent = data.email || 'admin@example.com';
        const avatar = document.querySelector('.profile-avatar');
        if (data.photoURL) avatar.style.backgroundImage = `url(${data.photoURL})`;
      }
    } catch (e) {
      console.warn('Could not load profile:', e);
    }
  }

  // ---- Logout ----
  window.handleLogout = function() {
    firebase.auth().signOut().then(() => {
      window.location.href = 'login.html';
    });
  };

  // ---- Auto‑init ----
  document.addEventListener('DOMContentLoaded', function() {
    injectSidebar();
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().onAuthStateChanged(user => {
        if (user) loadSidebarProfile();
      });
    }
  });

  // Expose for later use
  window.Sidebar = {
    inject: injectSidebar,
    loadProfile: loadSidebarProfile
  };
})();