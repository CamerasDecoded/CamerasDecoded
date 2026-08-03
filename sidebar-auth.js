// sidebar-auth.js — Dynamically show/hide Dashboard link in sidebar
// Assumes Firebase is already initialized on the page

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
  const db = firebase.firestore();
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

// Listen to auth state changes (only if Firebase is available)
if (typeof firebase !== 'undefined' && firebase.auth) {
  const auth = firebase.auth();
  auth.onAuthStateChanged((user) => {
    insertDashboardLink(user);
  });
} else {
  console.warn('Firebase not initialized – Dashboard link not added.');
}