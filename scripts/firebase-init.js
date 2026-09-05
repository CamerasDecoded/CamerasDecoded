// ================================================================
// FIREBASE INIT – Single source of truth (v2)
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

// Initialize only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Force long-polling to avoid CORS issues on static hosts
firebase.firestore().settings({
  experimentalForceLongPolling: true
});

// Expose auth and db globally
window.auth = firebase.auth();
window.db = firebase.firestore();

// Helpers (no UI)
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

console.log('✅ Firebase initialized.');
