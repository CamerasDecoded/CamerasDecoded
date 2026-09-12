// header.js – Shared floating header behavior (injected by master-loader)
// Greeting, tier badge, announcements bell (Firestore), cart.
(function() {
  'use strict';

  if (window.__CDHeader) {
    console.log('[Header] already loaded — skipping');
    return;
  }
  window.__CDHeader = true;

  console.log('[Header] Loading...');

  // ================================================================
  // HELPERS
  // ================================================================
  function pick(obj, keys, fallback) {
    if (!obj) return fallback;
    for (const k of keys) {
      const v = obj[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return fallback;
  }

  function toNum(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function greetingText() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ================================================================
  // CART MANAGEMENT
  // ================================================================
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('cameras_decoded_cart') || '[]');
    } catch (e) {
      return [];
    }
  }

  function updateCartUI() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
    const countEl = document.getElementById('cartHeaderCount');
    const labelEl = document.getElementById('cartHeaderLabel');

    if (countEl) {
      countEl.textContent = totalItems;
      countEl.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
    if (labelEl) {
      labelEl.textContent = totalItems > 0 ? `Cart (${totalItems})` : 'Cart';
    }
  }

  window.addEventListener('storage', function(e) {
    if (e.key === 'cameras_decoded_cart') updateCartUI();
  });

  // ================================================================
  // AUTH UI: greeting, tier badge
  // ================================================================
  function updateAuthUI(user, userData) {
    const authButtons = document.getElementById('headerAuthButtons');
    const badge = document.getElementById('headerTierBadge');
    const badgeText = document.getElementById('headerTierText');
    const greetingEl = document.getElementById('headerGreeting');

    // NOTE: user-state.js dispatches a truthy { isLoggedIn:false, uid:null } object
    // when signed out — so "any object" is NOT a valid logged-in check.
    const signedIn = (u) => !!(u && (u.isLoggedIn === true || u.uid));
    const isLoggedIn = signedIn(user) || signedIn(userData);
    const name = pick(userData, ['displayName', 'name', 'username'],
               pick(user, ['displayName', 'name'], 'Operator'));

    if (greetingEl) greetingEl.textContent = `${greetingText()}, ${name}`;

    if (isLoggedIn) {
      if (authButtons) authButtons.style.display = 'none';

      const tier = String(pick(userData, ['tier'], pick(user, ['tier'], 'free'))).toLowerCase();
      const tierLabel = tier === 'pro' ? 'Pro' : 'Free';
      if (badge) badge.hidden = false;
      if (badgeText) badgeText.textContent = tierLabel;

      console.log('[Header] Logged in:', name, '| tier:', tierLabel);
    } else {
      if (authButtons) authButtons.style.display = 'flex';
      if (badge) badge.hidden = true;
      console.log('[Header] Logged out: auth buttons shown.');
    }
  }

  // ================================================================
  // ANNOUNCEMENTS (Firestore admin/announcement)
  // ================================================================
  const SEEN_KEY = 'cd_seen_announcement';
  let currentAnnouncement = '';
  // Personal notifications, fed by app pages (e.g. the dashboard) via
  // window.Header.setNotifications(items, unread). Pages that never call it
  // keep the announcements-only bell.
  let personalNotifs = [];
  let personalUnread = 0;
  let notifsEnabled = false;

  function getHeaderEls() {
    return {
      bell: document.getElementById('headerNoticeButton'),
      dot: document.getElementById('headerNoticeDot'),
      panel: document.getElementById('headerAnnouncePanel'),
      close: document.getElementById('headerAnnounceClose'),
      body: document.getElementById('headerAnnounceBody')
    };
  }

  function openPanel() {
    const { bell, panel } = getHeaderEls();
    if (!panel) return;
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('open'));
    if (bell) bell.setAttribute('aria-expanded', 'true');
  }

  function closePanel() {
    const { bell, panel } = getHeaderEls();
    if (!panel || panel.hidden) return;
    panel.classList.remove('open');
    if (bell) bell.setAttribute('aria-expanded', 'false');
    setTimeout(() => { panel.hidden = true; }, 180);
  }

  function isPanelOpen() {
    const { panel } = getHeaderEls();
    return !!(panel && !panel.hidden && panel.classList.contains('open'));
  }

  // X button: dismiss the announcement (persisted). The dot stays on while
  // there are unread personal notifications.
  function dismissAnnouncement() {
    try {
      if (currentAnnouncement) localStorage.setItem(SEEN_KEY, currentAnnouncement);
    } catch (e) { /* storage unavailable */ }
    renderBell();
    closePanel();
    console.log('[Header] Announcement dismissed.');
  }

  function isSeen(msg) {
    try { return localStorage.getItem(SEEN_KEY) === msg; } catch (e) { return false; }
  }

  // Single bell render: pinned announcement (if unseen) + personal notifications.
  function renderBell() {
    const { dot, body } = getHeaderEls();
    const showAnn = !!(currentAnnouncement && !isSeen(currentAnnouncement));

    if (body) {
      let html = '';
      if (showAnn) {
        html += `<div class="announce-item"><span class="announce-mark" aria-hidden="true"></span><div><p>${escapeHtml(currentAnnouncement)}</p></div></div>`;
      }
      if (personalNotifs.length) {
        html += personalNotifs.map((n) => {
          const text = n.text || n.message || n.title || 'Notification';
          const time = n.time || n.date || '';
          return `<div class="announce-item notif"><span class="announce-mark" aria-hidden="true"></span><div><p>${escapeHtml(String(text))}</p>${time ? `<time>${escapeHtml(String(time))}</time>` : ''}</div></div>`;
        }).join('');
      }
      if (!html) {
        html = notifsEnabled
          ? '<p class="announce-empty">You are all caught up.</p>'
          : '<p class="announce-empty">No announcements right now.</p>';
      }
      body.innerHTML = html;
    }

    if (dot) dot.hidden = !(personalUnread > 0 || showAnn);
  }

  // Back-compat: older callers rendered announcements directly.
  function renderAnnouncement(data) {
    currentAnnouncement = (data && data.active && data.message) ? String(data.message) : '';
    renderBell();
  }

  function initAnnouncements() {
    const { bell, close, panel } = getHeaderEls();
    if (!bell || !panel) {
      setTimeout(initAnnouncements, 500);
      return;
    }

    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      isPanelOpen() ? closePanel() : openPanel();
    });
    if (close) close.addEventListener('click', (e) => { e.stopPropagation(); dismissAnnouncement(); });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#headerAnnouncePanel') && !e.target.closest('#headerNoticeButton')) closePanel();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

    // Live Firestore listener (same doc the Missions page uses).
    let attempts = 0;
    function subscribe() {
      const db = window.db;
      if (!db || typeof db.collection !== 'function') {
        attempts++;
        if (attempts < 20) setTimeout(subscribe, 500);
        else console.warn('[Header] Firestore unavailable; announcements disabled.');
        return;
      }
      db.collection('admin').doc('announcement').onSnapshot((doc) => {
        renderAnnouncement(doc.exists ? doc.data() : null);
      }, (err) => {
        console.warn('[Header] Announcement listener error:', err && err.code);
        renderAnnouncement(null);
      });
      console.log('[Header] Announcement listener subscribed.');
    }
    subscribe();
  }

  // ================================================================
  // EVENT LISTENERS
  // ================================================================
  window.addEventListener('userStateReady', (e) => {
    const user = e.detail;
    updateAuthUI(user, user);
    updateCartUI();
  });

  let retryCount = 0;
  const maxRetries = 20;
  // Pages that hydrate after the header (e.g. the dashboard's Firestore read)
  // stash their notifications here; the header picks them up.
  function consumePendingNotifs() {
    const p = window.__CDPendingNotifs;
    if (p && window.Header && typeof window.Header.setNotifications === 'function') {
      window.__CDPendingNotifs = null;
      window.Header.setNotifications(p.items, p.unread);
    }
  }
  function checkUserReady() {
    consumePendingNotifs();
    if (window.USER && window.USER.isLoggedIn === true) {
      updateAuthUI(window.USER, window.USER);
      updateCartUI();
      return;
    }
    retryCount++;
    if (retryCount < maxRetries) {
      setTimeout(checkUserReady, 250);
    } else if (window.USER) {
      updateAuthUI(window.USER, window.USER);
      updateCartUI();
    }
  }

  // ================================================================
  // PUBLIC API
  // ================================================================
  window.Header = {
    updateAuth: updateAuthUI,
    updateCart: updateCartUI,
    setNotifications: function(items, unread) {
      personalNotifs = Array.isArray(items) ? items.slice(0, 6) : [];
      const n = Number(unread);
      personalUnread = Number.isFinite(n) && n > 0 ? n : 0;
      notifsEnabled = true;
      renderBell();
    },
    setUserData: function(user, userData) {
      updateAuthUI(user, userData);
    },
    setCartCount: function(count) {
      const countEl = document.getElementById('cartHeaderCount');
      const labelEl = document.getElementById('cartHeaderLabel');
      const n = toNum(count, 0);
      if (countEl) {
        countEl.textContent = n;
        countEl.style.display = n > 0 ? 'inline-block' : 'none';
      }
      if (labelEl) labelEl.textContent = n > 0 ? `Cart (${n})` : 'Cart';
    }
  };

  // ================================================================
  // AUTO-INIT
  // ================================================================
  function init() {
    initAnnouncements();
    updateCartUI();
    consumePendingNotifs();
    // Default greeting even before auth resolves.
    const greetingEl = document.getElementById('headerGreeting');
    if (greetingEl) greetingEl.textContent = `${greetingText()}, Operator`;
    setTimeout(checkUserReady, 300);
    console.log('[Header] Initialized.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
