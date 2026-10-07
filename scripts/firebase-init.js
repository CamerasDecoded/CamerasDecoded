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

// Initialize only once. Guarded: if the Firebase CDN is blocked, `firebase`
// is undefined and the old bare `firebase.apps.length` threw, killing every
// page that loads this script. Pages degrade gracefully through their own
// null guards (window.auth / window.db stay null).
if (typeof firebase !== 'undefined' && firebase.apps) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // Auto-detect long-polling: use the fast WebChannel transport when it works,
  // fall back to long-polling only when the network needs it. (Forced
  // long-polling made Firestore writes crawl — votes took seconds to land.)
  firebase.firestore().settings({
    experimentalAutoDetectLongPolling: true
  });

  // Expose auth and db globally
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  console.log('Firebase initialized.');
} else {
  window.auth = null;
  window.db = null;
  console.warn('Firebase CDN unavailable — running without cloud sync.');
}

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
  if (!window.db || typeof firebase === 'undefined') return;
  window.db.collection('users').doc(uid).set({
    lastActive: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).catch(err => console.warn('Could not update lastActive:', err));
};

console.log('Firebase init script loaded.');
