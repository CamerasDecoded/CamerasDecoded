// ================================================================
// AUTH – Cameras Decoded (Production)
// Single source of truth – no duplicate declarations
// ================================================================

const firebaseConfig = {
  apiKey: "AIzaSyB95Vx0i8W6WNfUy1N4TNQyfN5xCxQYnz8",
  authDomain: "cameras-decoded.firebaseapp.com",
  projectId: "cameras-decoded",
  storageBucket: "cameras-decoded.firebasestorage.app",
  messagingSenderId: "1088920052790",
  appId: "1:1088920052790:web:2177c1fb31109c1fa02497",
  measurementId: "G-YN3M01WW0B"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Set auth and db directly on window – no `const` to avoid redeclaration
window.auth = firebase.auth();
window.db = firebase.firestore();
const STRIPE_CHECKOUT_URL = 'https://checkout.stripe.com/pay/placeholder';

// ---------- Toast ----------
function cdToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
      pointer-events: none;
      font-family: 'Space Mono', monospace;
    `;
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'error' ? ' error' : '');
  toast.style.cssText = `
    background: rgba(10, 10, 10, 0.92);
    border: 1px solid ${type === 'error' ? '#ff4a4a' : '#8deb00'};
    color: #fff;
    font-size: 13px;
    padding: 10px 22px;
    border-radius: 8px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.4);
    opacity: 0;
    transform: translateY(-8px);
    transition: all 0.3s ease;
    pointer-events: auto;
    text-align: center;
    max-width: 90vw;
    font-family: 'Space Mono', monospace;
  `;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
window.cdToast = cdToast;

// ---------- Helpers ----------
function updateLastActive(uid) {
  window.db.collection('users').doc(uid).set({
    lastActive: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).catch(err => console.warn('Could not update lastActive:', err));
}

function redirectToDashboard(role, uid) {
  const map = {
    'Operator': 'operator-dashboard.html',
    'Partner': 'partner-dashboard.html',
    'Instructor': 'instructor-dashboard.html',
    'Admin': 'admin-dashboard.html',
    'admin': 'admin-dashboard.html'
  };
  const url = map[role] || 'operator-dashboard.html';
  window.location.href = url;
}
window.redirectToDashboard = redirectToDashboard;

function storeUserData(data) {
  localStorage.setItem('cameras_decoded_user', JSON.stringify(data));
}

function getStoredReferral() {
  return localStorage.getItem('signup_referral') || null;
}

function setReferralFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref');
  if (ref) localStorage.setItem('signup_referral', ref);
}

// ===== SOCIAL HELPERS =====
function handleSocialUser(user) {
  // ... (keep your existing code, use window.db and window.auth)
}
window.signInWithGoogle = function() { /* ... */ };
window.signInWithFacebook = function() { /* ... */ };
window.login = function(email, password) { /* ... */ };
window.forgotPassword = function(email) { /* ... */ };
window.createAccount = function() { /* ... */ };

// ===== AUTH STATE LISTENER =====
window.auth.onAuthStateChanged(user => {
  if (user && window.location.pathname.endsWith('/login.html')) {
    updateLastActive(user.uid);
    window.db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        let roles = (data.roles && Array.isArray(data.roles)) ? data.roles : [data.role || 'Operator'];
        roles = [...new Set(roles)];
        if (roles.length === 1) {
          redirectToDashboard(roles[0], user.uid);
        } else if (typeof showRoleSelection === 'function') {
          showRoleSelection();
          populateRoleCards(roles, user.uid);
        }
      }
    }).catch(() => {});
  }
});

setReferralFromURL();

// Expose everything else you need on window
// (already have window.auth, window.db, window.cdToast)