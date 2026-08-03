// sidebar-auth.js — Dynamically show/hide Dashboard link in sidebar
// Assumes Firebase is already initialized by the page.

(function() {
  // 1. Check if Firebase is loaded
  if (typeof firebase === 'undefined') {
    console.warn('Firebase not loaded – Dashboard link not added.');
    return;
  }

  // 2. Check if Firebase has been initialized
  if (firebase.apps.length === 0) {
    console.warn('Firebase not initialized – Dashboard link not added.');
    return;
  }

  // 3. Now Firebase is ready
  const auth = firebase.auth();
  const db = firebase.firestore();

  function insertDashboardLink(user) {
    // Find the Home link – looks for id="nav-home" or href="index.html"
    const homeLink = document.getElementById('nav-home') || 
                     document.querySelector('a[href="index.html"]');
    if (!homeLink) return;

    // Remove any existing dynamic Dashboard link
    const existing = document.getElementById('dynamic-dashboard-node');
    if (existing) existing.remove();

    if (!user) return; // Not logged in

    // Determine correct dashboard URL based on user role
    let dashboardUrl = 'operator-dashboard.html';
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
        // Fallback if role lookup fails
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