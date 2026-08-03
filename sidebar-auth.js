// sidebar-auth.js — Dynamically show/hide Dashboard link in sidebar

// Firebase config (must match your existing config)
const firebaseConfig = {
  apiKey: "AIzaSyB95Vx0i8W6WNfUy1N4TNQyfN5xCxQYnz8",
  authDomain: "cameras-decoded.firebaseapp.com",
  projectId: "cameras-decoded",
  storageBucket: "cameras-decoded.firebasestorage.app",
  messagingSenderId: "1088920052790",
  appId: "1:1088920052790:web:2177c1fb31109c1fa02497",
  measurementId: "G-YN3M01WW0B"
};

// Initialize Firebase (only if not already initialized)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Insert Dashboard link just above the Home link
function insertDashboardLink(user) {
  // Find the Home link – assumes it has id="nav-home" OR href="index.html"
  const homeLink = document.getElementById('nav-home') || 
                   document.querySelector('a[href="index.html"]');
  
  if (!homeLink) return; // Home link not found, skip

  // Remove any existing dynamic Dashboard link to avoid duplicates
  const existing = document.getElementById('dynamic-dashboard-node');
  if (existing) existing.remove();

  if (!user) return; // Not logged in → no dashboard link

  // Determine correct dashboard URL based on user role
  let dashboardUrl = 'operator-dashboard.html'; // default
  db.collection('users').doc(user.uid).get()
    .then((doc) => {
      if (doc.exists) {
        const role = doc.data().role || 'Operator';
        if (role === 'Instructor') dashboardUrl = 'instructor-dashboard.html';
        else if (role === 'Partner') dashboardUrl = 'partner-dashboard.html';
        else dashboardUrl = 'operator-dashboard.html';
      }
      // Create and insert the dashboard link
      const newLink = document.createElement('a');
      newLink.id = 'dynamic-dashboard-node';
      newLink.className = 'nav-item';
      newLink.innerText = 'Dashboard';
      newLink.href = dashboardUrl;
      homeLink.parentNode.insertBefore(newLink, homeLink);
    })
    .catch(() => {
      // Fallback: use operator dashboard if role lookup fails
      const newLink = document.createElement('a');
      newLink.id = 'dynamic-dashboard-node';
      newLink.className = 'nav-item';
      newLink.innerText = 'Dashboard';
      newLink.href = 'operator-dashboard.html';
      homeLink.parentNode.insertBefore(newLink, homeLink);
    });
}

// Listen to auth state changes
auth.onAuthStateChanged((user) => {
  insertDashboardLink(user);
});