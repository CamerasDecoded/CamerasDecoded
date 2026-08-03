// sidebar-auth.js — Dynamically show/hide Dashboard link in sidebar
// Self‑contained: initializes Firebase if not already done.

(function() {
  // 1. Ensure Firebase is loaded
  if (typeof firebase === 'undefined') {
    console.warn('Firebase not loaded – Dashboard link not added.');
    return;
  }

  // 2. Initialize Firebase only if no app exists
  if (!firebase.apps.length) {
    const config = {
      apiKey: "AIzaSyB95Vx0i8W6WNfUy1N4TNQyfN5xCxQYnz8",
      authDomain: "cameras-decoded.firebaseapp.com",
      projectId: "cameras-decoded",
      storageBucket: "cameras-decoded.firebasestorage.app",
      messagingSenderId: "1088920052790",
      appId: "1:1088920052790:web:2177c1fb31109c1fa02497",
      measurementId: "G-YN3M01WW0B"
    };
    firebase.initializeApp(config);
  }

  const auth = firebase.auth();
  const db = firebase.firestore();

  function insertDashboardLink(user) {
    // Find the Home link – assumes id="nav-home" OR href="index.html"
    const homeLink = document.getElementById('nav-home') || 
                     document.querySelector('a[href="index.html"]');
    if (!homeLink) return;

    // Remove any existing dynamic Dashboard link
    const existing = document.getElementById('dynamic-dashboard-node');
    if (existing) existing.remove();

    if (!user) return; // Not logged in

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
})();