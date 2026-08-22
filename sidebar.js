// ================================================================
// SHARED SIDEBAR – with real‑time announcement listener
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
        <a href="operator-dashboard.html" class="nav-item" data-page="operator-dashboard.html"><i class="fas fa-chart-simple"></i> Dashboard</a>
        <a href="index.html" class="nav-item" data-page="index.html"><i class="fas fa-home"></i> Home</a>
        <a href="journey.html" class="nav-item" data-page="journey.html"><i class="fas fa-route"></i> Journey</a>
        <a href="learning-journey.html" class="nav-item" data-page="learning-journey.html"><i class="fas fa-graduation-cap"></i> Learning</a>
        <a href="cynetis-7.html" class="nav-item" data-page="cynetis-7.html"><i class="fas fa-robot"></i> Cynetis-7</a>
        <a href="profile.html" class="nav-item" data-page="profile.html"><i class="fas fa-user"></i> Profile</a>
        <!-- Admin-only links (hidden by default, shown if user is admin) -->
        <a href="admin-dashboard.html" class="nav-item admin-only" data-page="admin-dashboard.html" style="display:none;"><i class="fas fa-chart-pie"></i> Admin</a>
        <a href="settings.html" class="nav-item" data-page="settings.html"><i class="fas fa-cog"></i> Settings</a>
        <a href="#" class="logout-link" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
      </nav>
      <!-- Announcement section -->
      <div class="sidebar-announcement" id="sidebarAnnouncementContainer">
        <div class="announcement-label"><i class="fas fa-bullhorn"></i> Announcement</div>
        <div class="announcement-text" id="sidebarAnnouncement">No active announcement</div>
      </div>
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
    const path = window.location.pathname.split('/').pop() || 'operator-dashboard.html';
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
      const href = link.getAttribute('data-page');
      if (href === path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    // Show admin links if user is admin
    checkAndShowAdminLinks();
  }

  // ---- Check admin role and show admin-only links ----
  async function checkAndShowAdminLinks() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const doc = await firebase.firestore().collection('users').doc(user.uid).get();
      if (doc.exists && doc.data().role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'flex');
      }
    } catch (e) {
      console.warn('Admin check error:', e);
    }
  }

  // ---- Load user profile into sidebar ----
  async function loadSidebarProfile() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const doc = await firebase.firestore().collection('users').doc(user.uid).get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('sidebarUsername').textContent = data.username || 'Operator';
        document.getElementById('sidebarEmail').textContent = data.email || '';
        const avatar = document.querySelector('.profile-avatar');
        if (data.photoURL) avatar.style.backgroundImage = `url(${data.photoURL})`;
      }
    } catch (e) {
      console.warn('Could not load profile:', e);
    }
  }

  // ---- Load announcement from Firestore and listen for changes ----
  function loadAndListenToAnnouncement() {
    try {
      const db = firebase.firestore();
      const announcementEl = document.getElementById('sidebarAnnouncement');
      const container = document.getElementById('sidebarAnnouncementContainer');
      if (!announcementEl || !container) return;

      // Real-time listener: updates every sidebar immediately when admin publishes
      db.collection('admin').doc('announcement').onSnapshot((doc) => {
        if (doc.exists && doc.data().active && doc.data().message) {
          announcementEl.textContent = doc.data().message;
          container.style.display = 'block';
        } else {
          announcementEl.textContent = 'No active announcement';
          container.style.display = 'block';
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
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          loadSidebarProfile();
          loadAndListenToAnnouncement();
          checkAndShowAdminLinks();
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