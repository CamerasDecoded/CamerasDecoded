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
    const role = String(pick(userData, ['role'], '')).toLowerCase();
    const name = pick(userData, ['displayName', 'name', 'username'],
               pick(user, ['displayName', 'name'], role === 'admin' ? 'Admin' : 'Operator'));

    if (greetingEl) greetingEl.textContent = `${greetingText()}, ${name}`;

    if (isLoggedIn) {
      if (authButtons) authButtons.style.display = 'none';

      const tier = String(pick(userData, ['tier'], pick(user, ['tier'], 'free'))).toLowerCase();
      const tierLabel = role === 'admin' ? 'Admin' : (tier === 'pro' ? 'Pro' : 'Free');
      if (badge) badge.hidden = false;
      if (badgeText) badgeText.textContent = tierLabel;

      // Free tier badge is the upgrade entry point (mobile + desktop).
      if (badge) {
        const isFree = tierLabel === 'Free';
        badge.style.cursor = isFree ? 'pointer' : '';
        badge.title = isFree ? 'Go Pro' : '';
        badge.onclick = isFree ? function () {
          if (window.CDPaywall) window.CDPaywall.show();
          else window.location.href = '/pro-checkout.html';
        } : null;
      }

      console.log('[Header] Logged in:', name, '| tier:', tierLabel);
    } else {
      if (authButtons) authButtons.style.display = 'flex';
      if (badge) badge.hidden = true;
      console.log('[Header] Logged out: auth buttons shown.');
    }

    updateHeaderHero(isLoggedIn, pick(user, ['uid'], pick(userData, ['uid'], null)));
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
    // Dismissing the bell = seen: stamp broadcasts + mark inbox read only
    // AFTER the user has viewed the panel (not on open, which wipes
    // broadcasts before they can be read).
    if (window.CDNotifs && typeof window.CDNotifs.markSeen === 'function') {
      try { window.CDNotifs.markSeen(); } catch (e) {}
    }
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
          const body = n.body || '';
          const time = n.time || n.date || '';
          const inner = `<span class="announce-mark" aria-hidden="true"></span><div><p>${escapeHtml(String(text))}</p>${body ? `<span class="announce-sub">${escapeHtml(String(body))}</span>` : ''}${time ? `<time>${escapeHtml(String(time))}</time>` : ''}</div>`;
          return n.href
            ? `<a class="announce-item notif" href="${escapeHtml(String(n.href))}">${inner}</a>`
            : `<div class="announce-item notif">${inner}</div>`;
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
  // XP PILL + DASHBOARD-ONLY GREETING TRANSITION
  // The greeting lives on the dashboard only: the first dashboard visit
  // per tab session animates it in, holds ~3s, then cross-fades to the
  // persistent XP/streak pill. Everywhere else (and every repeat visit)
  // shows the pill directly. Signed-out: neither — the header stays clean.
  // ================================================================
  const HDR_GREET_KEY = 'cd_header_greeted';
  const HDR_GREET_HOLD_MS = 3000;
  const HDR_DASH_URL = '/operator-dashboard.html';
  let hdrPillVisible = false;
  let hdrXpUnsub = null;

  function hdrIsDashboard() {
    try {
      if (window.__CDHeaderDebug && typeof window.__CDHeaderDebug.isDashboard === 'boolean')
        return window.__CDHeaderDebug.isDashboard;
    } catch (e) {}
    return /(^|\/)operator-dashboard(\.html)?([?#]|$)/.test(location.pathname);
  }

  function hdrReducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  function hdrSessionGreeted() {
    try { return sessionStorage.getItem(HDR_GREET_KEY) === '1'; }
    catch (e) { return true; } // fail closed: never greet when storage is unavailable
  }

  function hdrMarkGreeted() {
    try { sessionStorage.setItem(HDR_GREET_KEY, '1'); } catch (e) {}
  }

  function hdrTodayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function ensureXpPill() {
    let pill = document.getElementById('headerXpPill');
    if (pill) return pill;
    const identity = document.querySelector('#master-floating-header .header-identity');
    if (!identity) return null;
    pill = document.createElement('a');
    pill.id = 'headerXpPill';
    pill.className = 'header-xp-pill';
    pill.href = HDR_DASH_URL;
    pill.setAttribute('aria-label', "Today's XP — open dashboard");
    pill.hidden = true;
    pill.innerHTML =
      '<span class="hxp-bolt" aria-hidden="true">⚡</span>' +
      '<span class="hxp-text" id="headerXpText">0/100</span>' +
      '<span class="hxp-bar" aria-hidden="true"><span class="hxp-fill" id="headerXpFill"></span></span>' +
      '<span class="hxp-streak" id="headerXpStreak" hidden>' +
        '<span aria-hidden="true">🔥</span><span id="headerXpStreakN">0</span>' +
      '</span>';
    identity.appendChild(pill);
    return pill;
  }

  function renderXpPill(u) {
    const pill = document.getElementById('headerXpPill');
    if (!pill || !u) return;
    // Same day authority as the dashboard: xpTodayDate (local) must match today.
    const fresh = u.xpTodayDate === hdrTodayKey();
    const xpToday = fresh ? toNum(pick(u, ['xpToday', 'dailyXp'], 0), 0) : 0;
    const xpGoal = toNum(pick(u, ['xpGoal', 'dailyXpGoal'], 100), 100) || 100;
    // Streak: read the SAME fields the dashboard reads (dailyChallengeStreak /
    // streakDays / streak). dailyStreak.count is a separate counter fed only
    // by games + missions — reading it raw here left the pill stuck on a
    // stale number the dashboard had already moved past.
    const streakN = toNum(pick(u, ['dailyChallengeStreak', 'streakDays', 'streak'], 0), 0);
    const txt = document.getElementById('headerXpText');
    const fill = document.getElementById('headerXpFill');
    const streakEl = document.getElementById('headerXpStreak');
    const streakNEl = document.getElementById('headerXpStreakN');
    if (txt) txt.textContent = xpToday + '/' + xpGoal;
    if (fill) fill.style.width = Math.min(100, xpGoal > 0 ? (xpToday / xpGoal) * 100 : 0) + '%';
    if (streakEl) streakEl.hidden = !(streakN > 0);
    if (streakNEl) streakNEl.textContent = streakN;
    pill.setAttribute('aria-label',
      `Today's XP: ${xpToday} of ${xpGoal}` + (streakN > 0 ? `, ${streakN} day streak` : '') + ' — open dashboard');
    if (hdrPillVisible) pill.hidden = false;
  }

  function subscribeXp(uid) {
    if (!uid || !ensureXpPill()) return;
    let attempts = 0;
    (function sub() {
      const db = window.db;
      if (!db || typeof db.collection !== 'function') {
        attempts++;
        if (attempts < 20) setTimeout(sub, 500);
        return; // Firestore never arrived: pill stays hidden, never a dead readout
      }
      try {
        if (hdrXpUnsub) { try { hdrXpUnsub(); } catch (e) {} hdrXpUnsub = null; }
        hdrXpUnsub = db.collection('users').doc(uid).onSnapshot(
          (doc) => { if (doc && doc.exists) renderXpPill(doc.data()); },
          () => { /* read error: stay hidden */ }
        );
      } catch (e) { /* stay hidden */ }
    })();
  }

  function hdrShowGreeting() {
    const g = document.getElementById('headerGreeting');
    hdrPillVisible = false;
    if (!g) return;
    g.classList.add('hdr-on');
    void g.offsetWidth; // restart the entrance animation
    g.classList.add('hdr-greet-in');
  }

  function hdrSwapToPill() {
    const g = document.getElementById('headerGreeting');
    const pill = document.getElementById('headerXpPill');
    hdrPillVisible = true;
    if (g) {
      g.classList.remove('hdr-greet-in');
      g.classList.add('hdr-greet-out');
      setTimeout(() => { g.classList.remove('hdr-on', 'hdr-greet-out'); }, 450);
    }
    if (pill) {
      pill.hidden = false;
      void pill.offsetWidth;
      pill.classList.add('hdr-pill-in');
    }
  }

  function hdrShowPillNow() {
    const g = document.getElementById('headerGreeting');
    const pill = document.getElementById('headerXpPill');
    hdrPillVisible = true;
    if (g) g.classList.remove('hdr-on', 'hdr-greet-in', 'hdr-greet-out');
    if (pill) {
      pill.hidden = false;
      pill.classList.add('hdr-pill-in');
    }
  }

  function hdrHideHero() {
    const g = document.getElementById('headerGreeting');
    const pill = document.getElementById('headerXpPill');
    hdrPillVisible = false;
    if (g) g.classList.remove('hdr-on', 'hdr-greet-in', 'hdr-greet-out');
    if (pill) { pill.hidden = true; pill.classList.remove('hdr-pill-in'); }
  }

  // Called from updateAuthUI once auth state resolves.
  function updateHeaderHero(isLoggedIn, uid) {
    ensureXpPill();
    if (!isLoggedIn) { hdrHideHero(); return; }
    subscribeXp(uid);
    if (hdrIsDashboard() && !hdrSessionGreeted() && !hdrReducedMotion()) {
      hdrMarkGreeted();
      hdrShowGreeting();
      setTimeout(hdrSwapToPill, HDR_GREET_HOLD_MS);
    } else {
      hdrShowPillNow();
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
    // Lets the notification engine merge page-fed items (e.g. the operator
    // dashboard) with automated ones instead of overwriting them.
    getPersonalNotifs: function() {
      return { items: personalNotifs.slice(), unread: personalUnread };
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
