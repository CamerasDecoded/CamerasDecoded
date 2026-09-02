// nav-header.js – Global navigation header
// Injects on every page, shows user info, logout button, and role-aware links

console.log('✅ nav-header.js loading...');

// Role to dashboard/profile mapping
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
  }
};

// Build nav HTML based on user state
function buildNavHTML(user) {
  if (!user.isLoggedIn) {
    // Not logged in - minimal nav
    return `
      <header id="app-nav-header" style="background:#0A0A0A;border-bottom:1px solid #1A1A1A;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;">
        <a href="/test-app/test-index.html" title="Home" style="font-size:24px;color:#8deb00;text-decoration:none;">🏠</a>
        <div style="flex:1;text-align:center;color:#999;font-size:14px;">
          <a href="/test-app/test-login.html" style="color:#8deb00;text-decoration:none;margin:0 8px;">Log In</a>
          <a href="/test-app/test-signup.html" style="color:#8deb00;text-decoration:none;margin:0 8px;">Sign Up</a>
        </div>
        <div style="width:24px;"></div>
      </header>
    `;
  }

  // Logged in - full nav
  const roleConfig = ROLE_MAP[user.role] || ROLE_MAP['Operator'];
  const dashboardLink = roleConfig.dashboard;
  const profileLink = roleConfig.profile;

  return `
    <header id="app-nav-header" style="background:#0A0A0A;border-bottom:1px solid #1A1A1A;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;font-family:sans-serif;">
      <a href="/test-app/test-index.html" title="Home" style="font-size:24px;color:#8deb00;text-decoration:none;">🏠</a>
      
      <div style="flex:1;margin-left:20px;display:flex;gap:16px;align-items:center;">
        <span style="color:#999;font-size:13px;">
          👤 <strong style="color:#fff;">${user.name}</strong> 
          <span style="color:#666;margin-left:8px;">${user.role}</span>
          <span style="color:#666;margin-left:4px;">• ${user.tier}</span>
        </span>
      </div>
      
      <div style="display:flex;gap:12px;align-items:center;">
        <a href="${dashboardLink}" style="color:#8deb00;text-decoration:none;font-size:13px;padding:6px 12px;border:1px solid #333;border-radius:4px;transition:all 0.3s;">Dashboard</a>
        <a href="${profileLink}" style="color:#8deb00;text-decoration:none;font-size:13px;padding:6px 12px;border:1px solid #333;border-radius:4px;transition:all 0.3s;">Profile</a>
        <button onclick="appLogout()" style="color:#ff4a4a;background:transparent;border:1px solid #ff4a4a;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px;transition:all 0.3s;">Logout</button>
      </div>
    </header>
  `;
}

// Logout function
window.appLogout = function() {
  if (confirm('Log out?')) {
    firebase.auth().signOut().then(() => {
      window.location.href = '/test-app/test-index.html';
    }).catch(err => {
      console.error('Logout error:', err);
      alert('Logout failed: ' + err.message);
    });
  }
};

// Inject nav into page
function injectNav(user) {
  let container = document.getElementById('app-nav-container');
  
  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement('div');
    container.id = 'app-nav-container';
    document.body.insertBefore(container, document.body.firstChild);
  }

  // Inject nav HTML
  container.innerHTML = buildNavHTML(user);
  console.log('✅ Nav injected for user:', user.isLoggedIn ? user.name : 'guest');
}

// Listen for user state to be ready
window.addEventListener('userStateReady', (e) => {
  const user = e.detail;
  injectNav(user);
});

// If user state was already loaded before this script, inject immediately
if (window.USER && window.USER.uid) {
  injectNav(window.USER);
} else if (!window.USER) {
  // Fallback: inject with empty user state
  window.USER = {
    isLoggedIn: false,
    uid: null,
    name: null,
    email: null,
    username: null,
    role: null,
    tier: null,
    createdAt: null
  };
  injectNav(window.USER);
}

console.log('✅ nav-header.js loaded');