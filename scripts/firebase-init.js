// ================================================================
// FIREBASE INIT – Single source of truth
// ================================================================

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB95Vx0i8W6WNfUy1N4TNQyfN5xCxQYnz8",
  authDomain: "cameras-decoded.firebaseapp.com",
  projectId: "cameras-decoded",
  storageBucket: "cameras-decoded.firebasestorage.app",
  messagingSenderId: "1088920052790",
  appId: "1:1088920052790:web:2177c1fb31109c1fa02497",
  measurementId: "G-YN3M01WW0B"
};

// Initialize Firebase (only once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Expose auth and db globally
window.auth = firebase.auth();
window.db = firebase.firestore();

// Toast function (global)
window.cdToast = function(message, type = 'success') {
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
};

// Optionally expose other helpers
window.redirectToDashboard = function(role, uid) {
  const map = {
    'Operator': 'operator-dashboard.html',
    'Partner': 'partner-dashboard.html',
    'Instructor': 'instructor-dashboard.html',
    'Admin': 'admin-dashboard.html',
    'admin': 'admin-dashboard.html'
  };
  const url = map[role] || 'operator-dashboard.html';
  window.location.href = url;
};

window.updateLastActive = function(uid) {
  window.db.collection('users').doc(uid).set({
    lastActive: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).catch(err => console.warn('Could not update lastActive:', err));
};

// Auth state listener (optional – you can keep it in pages)
console.log('✅ Firebase initialized and exposed globally.');