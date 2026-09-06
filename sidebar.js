// sidebar.js – Shared sidebar injection + profile update support
(function() {
  'use strict';

  // ---- HTML template ----
  function buildSidebarHTML(userData) {
    const username = userData?.username || 'Guest';
    const email = userData?.email || '';
    const photoURL = userData?.photoURL || 'cameras-decoded-logo.png';
    const role = userData?.role || 'Operator';

    return `
      <aside class="sidebar" id="sidebar">
        <div class="logo"><a href="https://camerasdecoded.com"><img src="cameras-decoded-logo.png" alt="Cameras Decoded" /></a></div>
        <div class="sidebar-profile">
          <div class="profile-avatar" id="profileAvatar" style="background-image:url('${photoURL}');"></div>
          <div class="profile-name" id="sidebarUsername">${username}</div>
          <div class="profile-email" id="sidebarEmail">${email}</div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-group">
            <a href="${role.toLowerCase()}-dashboard.html" class="nav-item active"><i class="fas fa-chart-simple"></i> Dashboard</a>
            <a href="index.html" class="nav-item"><i class="fas fa-home"></i> Home</a>
          </div>
          <hr class="sidebar-divider">
          <div class="nav-group">
            <a href="operators.html" class="nav-item"><i class="fas fa-user-astronaut"></i> Operators</a>
            <a href="community.html" class="nav-item"><i class="fas fa-users"></i> Community</a>
            <a href="educators-pdf-viewer.html" class="nav-item"><i class="fas fa-chalkboard-teacher"></i> Instructors</a>
            <a href="partners.html" class="nav-item"><i class="fas fa-handshake"></i> Partners</a>
          </div>
          <hr class="sidebar-divider">
          <div class="nav-group">
            <a href="journey.html" class="nav-item"><i class="fas fa-route"></i> Journey</a>
            <a href="products.html" class="nav-item"><i class="fas fa-box-open"></i> Products</a>
            <a href="protocols.html" class="nav-item"><i class="fas fa-code-branch"></i> Protocols</a>
            <a href="snapshot-library.html" class="nav-item"><i class="fas fa-id-card"></i> Snapshot Cards</a>
            <a href="cynetis-7.html" class="nav-item"><i class="fas fa-robot"></i> Cynetis-7</a>
          </div>
          <hr class="sidebar-divider">
          <div class="nav-group">
            <a href="blog-updates.html" class="nav-item"><i class="fas fa-newspaper"></i> Blog/Updates</a>
            <a href="podcast.html" class="nav-item"><i class="fas fa-podcast"></i> Podcast</a>
            <a href="inner-signal.html" class="nav-item"><i class="fas fa-brain"></i> Inner Signal</a>
          </div>
          <hr class="sidebar-divider">
          <div class="nav-group private-links" id="privateLinks">
            <a href="${role.toLowerCase()}-profile.html" class="nav-item"><i class="fas fa-id-card"></i> Profile</a>
            <a href="#" class="nav-item"><i class="fas fa-cog"></i> Settings</a>
            <a href="#" class="nav-item"><i class="fas fa-credit-card"></i> Billing</a>
            <a href="#" class="nav-item" onclick="window.handleLogout && window.handleLogout();" style="color:#ff4a4a;"><i class="fas fa-sign-out-alt"></i> Logout</a>
          </div>
          <div class="nav-group auth-cta" id="authCta" style="display:flex; flex-direction:column; gap:8px; padding-top:4px;">
            <a href="login.html" class="nav-item"><i class="fas fa-sign-in-alt"></i> Log in</a>
            <a href="signup.html" class="nav-item signup"><i class="fas fa-user-plus"></i> Sign Up</a>
          </div>
        </nav>
        <div class="sidebar-notification" id="sidebarNotification">
          <div class="notif-header"><i class="fas fa-bullhorn"></i><span>Announcement</span></div>
          <div class="notif-message empty" id="sidebarAnnouncement">No active announcement</div>
          <div class="notif-timestamp" id="sidebarAnnouncementTimestamp"></div>
        </div>
      </aside>
    `;
  }

  // ---- Injection ----
  function injectSidebar(userData) {
    const container = document.getElementById('sidebarContainer');
    if (!container) {
      console.warn('[Sidebar] Container #sidebarContainer not found.');
      return;
    }
    const existing = container.querySelector('.sidebar');
    if (existing) existing.remove();

    container.innerHTML = buildSidebarHTML(userData);
    console.log('[Sidebar] Injected.');

    // Set up toggle with header hamburger
    setupToggle();
  }

  // ---- Toggle logic ----
  function setupToggle() {
    const toggleBtn = document.getElementById('floatingToggle');
    const sidebar = document.getElementById('sidebar');
    if (!toggleBtn || !sidebar) return;
    toggleBtn.removeEventListener('click', toggleSidebar);
    toggleBtn.addEventListener('click', toggleSidebar);
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('open');
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.classList.toggle('open');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
  }

  // ---- Profile update (new method) ----
  function updateProfile(userData) {
    const username = document.getElementById('sidebarUsername');
    const email = document.getElementById('sidebarEmail');
    const avatar = document.getElementById('profileAvatar');
    if (username) username.textContent = userData?.username || 'Guest';
    if (email) email.textContent = userData?.email || '';
    if (avatar) avatar.style.backgroundImage = `url('${userData?.photoURL || 'cameras-decoded-logo.png'}')`;
  }

  // ---- Public API ----
  window.Sidebar = {
    inject: injectSidebar,
    updateProfile: updateProfile,
    toggle: toggleSidebar
  };

  // ---- Auto-inject on DOM ready ----
  function init() {
    const userData = window.USER || null;
    injectSidebar(userData);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();