// test-app.js – Shared Firebase init, auth helpers, and navigation
console.log('✅ test-app.js loading...');

const firebaseConfig = {
  apiKey: "AIzaSyB95Vx0i8W6WNfUy1N4TNQyfN5xCxQYnz8",
  authDomain: "cameras-decoded.firebaseapp.com",
  projectId: "cameras-decoded",
  storageBucket: "cameras-decoded.firebasestorage.app",
  messagingSenderId: "1088920052790",
  appId: "1:1088920052790:web:2177c1fb31109c1fa02497",
  measurementId: "G-YN3M01WW0B"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.firestore().settings({ experimentalForceLongPolling: true });

// Expose auth and db globally
window.auth = firebase.auth();
window.db = firebase.firestore();

console.log('✅ Firebase initialized, window.auth and window.db are set');

// --- Toast ---
function cdToast(message, type) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;font-family:sans-serif;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #0A0A0A;
    border: 1px solid ${type === 'error' ? '#ff4a4a' : '#8deb00'};
    color: #fff;
    font-size: 14px;
    padding: 10px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    pointer-events: auto;
    max-width: 90vw;
    text-align: center;
  `;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- Redirect to role‑specific dashboard (TEST VERSION) ---
function redirectToDashboard(role, uid) {
  const map = {
    'Operator': 'test-operator-dashboard.html',
    'Partner': 'test-partner-dashboard.html',
    'Instructor': 'test-instructor-dashboard.html'
  };
  const url = (map[role] || 'test-operator-dashboard.html') + '?uid=' + uid;
  console.log('🔀 Redirecting to dashboard:', url);
  window.location.href = url;
}

// --- Redirect to role‑specific profile (TEST VERSION) ---
function redirectToProfile(role, uid) {
  const map = {
    'Operator': 'test-profile.html',
    'Partner': 'test-partner-profile.html',
    'Instructor': 'test-instructor-profile.html'
  };
  const url = (map[role] || 'test-profile.html') + '?uid=' + uid;
  console.log('🔀 Redirecting to profile:', url);
  window.location.href = url;
}

// --- Logout (TEST VERSION) ---
function handleLogout() {
  window.auth.signOut().then(() => {
    window.location.href = 'test-index.html';
  });
}

console.log('✅ test-app.js loaded successfully');