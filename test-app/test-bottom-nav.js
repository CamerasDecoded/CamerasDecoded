// test-bottom-nav.js – Minimal version (no dynamic injection)
(function() {
  'use strict';

  function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.bottom-nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  async function updateBadges() {
    if (typeof firebase === 'undefined' || !firebase.firestore) return;
    const db = firebase.firestore();
    try {
      const annDoc = await db.collection('admin').doc('announcement').get();
      const hasAnnouncement = annDoc.exists && annDoc.data().active === true;
      const homeLink = document.querySelector('.bottom-nav a[href="test-index.html"]');
      if (homeLink) homeLink.classList.toggle('show-badge', hasAnnouncement);

      const user = firebase.auth().currentUser;
      if (user) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          const hasAlerts = !data.tourCompleted ||
                            !data.learningJourney?.primaryGoal ||
                            (data.totalPoints || 0) < 10;
          const dashboardLink = document.querySelector('.bottom-nav a[href$="-dashboard.html"]');
          const journeyLink = document.querySelector('.bottom-nav a[href="learning-journey.html"]');
          const profileLink = document.querySelector('.bottom-nav a[href$="-profile.html"]');
          if (dashboardLink) dashboardLink.classList.toggle('show-badge', hasAlerts);
          if (journeyLink) journeyLink.classList.toggle('show-badge', hasAlerts);
          if (profileLink) profileLink.classList.toggle('show-badge', hasAlerts);
        }
      }

      const hasNewFeatures = !localStorage.getItem('cynetis_visited');
      const cynetisLink = document.querySelector('.bottom-nav a[href="cynetis-7.html"]');
      if (cynetisLink) cynetisLink.classList.toggle('show-badge', hasNewFeatures);

    } catch (e) {
      console.warn('Badge update error:', e);
    }
  }

  document.addEventListener('click', function(e) {
    const link = e.target.closest('.bottom-nav a[href="cynetis-7.html"]');
    if (link) {
      localStorage.setItem('cynetis_visited', 'true');
      link.classList.remove('show-badge');
    }
  });

  window.BottomNav = {
    setActive: setActiveNav,
    updateBadges: updateBadges,
    init: function() {
      setActiveNav();
      updateBadges();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setActiveNav();
      updateBadges();
    });
  } else {
    setActiveNav();
    updateBadges();
  }

})();