// announcement.js – Fetches and shows announcement banner (dismissible per day)

(function() {
  'use strict';

  const BANNER_ID = 'announcementBanner';
  const STORAGE_KEY = 'announcement_dismissed_date';

  function getToday() {
    return new Date().toDateString();
  }

  function isDismissedToday() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === getToday();
  }

  function setDismissedToday() {
    localStorage.setItem(STORAGE_KEY, getToday());
  }

  function showBanner(message) {
    let banner = document.getElementById(BANNER_ID);
    if (!banner) {
      banner = document.createElement('div');
      banner.id = BANNER_ID;
      banner.className = 'show';
      banner.innerHTML = `
        <span class="announcement-icon"><i class="fa-regular fa-bullhorn"></i></span>
        <span class="announcement-text"></span>
        <button class="announcement-close" aria-label="Dismiss announcement">&times;</button>
      `;
      // Insert after the top nav (or at the top of body)
      const container = document.getElementById('app-nav-container');
      if (container && container.nextSibling) {
        container.parentNode.insertBefore(banner, container.nextSibling);
      } else {
        document.body.prepend(banner);
      }
      // Dismiss handler
      banner.querySelector('.announcement-close').addEventListener('click', function() {
        banner.classList.remove('show');
        banner.style.display = 'none';
        setDismissedToday();
      });
    }
    // Update text
    const textEl = banner.querySelector('.announcement-text');
    if (textEl) textEl.textContent = message;
    banner.style.display = 'flex';
    banner.classList.add('show');
  }

  function hideBanner() {
    const banner = document.getElementById(BANNER_ID);
    if (banner) {
      banner.classList.remove('show');
      banner.style.display = 'none';
    }
  }

  // Listen to Firestore announcement
  function initAnnouncement() {
    try {
      const db = firebase.firestore();
      db.collection('admin').doc('announcement').onSnapshot((doc) => {
        if (doc.exists && doc.data().active && doc.data().message) {
          const message = doc.data().message;
          if (!isDismissedToday()) {
            showBanner(message);
          } else {
            hideBanner();
          }
        } else {
          hideBanner();
        }
      }, (err) => {
        console.warn('Announcement listener error:', err);
        hideBanner();
      });
    } catch (e) {
      console.warn('Firestore not available, announcement disabled.');
    }
  }

  // Expose init
  window.initAnnouncement = initAnnouncement;

  // Auto‑start if Firebase is ready
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    document.addEventListener('DOMContentLoaded', function() {
      initAnnouncement();
    });
  } else {
    console.warn('Firebase not available, announcement disabled.');
  }
})();