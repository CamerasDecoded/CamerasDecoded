/* Cameras Decoded — notification engine.
 *
 * Three layers, zero backend:
 *
 *  1. SMART (computed on load, no writes): streak-at-risk and resume-nudge
 *     are derived from data the client already reads. Pages can also push
 *     one-off smart items via CDNotifs.pushSmart() (e.g. drill-live).
 *  2. BROADCASTS (admin -> everyone): the `broadcasts` collection holds docs
 *     {title, body, href, createdAt, expiresAt, audience}. Items newer than
 *     the local cd_seen_broadcasts stamp (and not expired) surface in the
 *     bell — no per-user fan-out writes needed.
 *  3. INBOX (personal, event-written): `notifications/{uid}/items` docs
 *     {title, body, href, kind, createdAt, read}, written by client event
 *     hooks (badge earned, streak milestone, chapter complete). Cross-device.
 *
 * Everything merges newest-first into the header bell through the existing
 * window.Header.setNotifications(items, unread) API (cap 6). Opening the
 * bell calls CDNotifs.markSeen(): broadcasts are stamped seen and unread
 * inbox items are marked read.
 */
(function () {
  'use strict';

  var SMART_MAX = 3;
  var INBOX_LIMIT = 30;
  var BROADCAST_LIMIT = 10;
  var LS_SEEN_BC = 'cd_seen_broadcasts';
  var LS_LAST_ACT = 'cd_last_activity';
  var LS_RESUME_NUDGED = 'cd_resume_nudged';

  var uid = null, tier = 'free';
  var smartCache = [];
  var smartExtra = [];
  var inboxItems = [];
  var broadcasts = [];
  var externalItems = [];   // page-fed (e.g. operator dashboard), merged not clobbered
  var externalUnread = 0;
  var origSetNotifs = null;
  var booted = false;
  var inited = false;

  function nowMs() { return Date.now(); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function timeAgo(ms) {
    if (!ms) return '';
    var m = Math.floor((nowMs() - ms) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }
  function tsMillis(ts) {
    return (ts && typeof ts.toMillis === 'function') ? ts.toMillis() : 0;
  }

  /* ---------------- public API ---------------- */

  // Pages stamp meaningful activity so the resume nudge can point back at it.
  function stampActivity(label, href) {
    try {
      localStorage.setItem(LS_LAST_ACT, JSON.stringify({ label: label, href: href, at: nowMs() }));
    } catch (e) {}
  }

  // Pages push (or clear) one-off smart notifications, e.g. drill-live.
  function pushSmart(item) {
    if (!item || !item.id) return;
    for (var i = 0; i < smartExtra.length; i++) if (smartExtra[i].id === item.id) return;
    smartExtra.push({
      id: item.id, title: item.title || 'Heads up', body: item.body || '',
      href: item.href || '', at: nowMs(), kind: 'smart'
    });
    feed();
  }
  function clearSmart(id) {
    var kept = smartExtra.filter(function (n) { return n.id !== id; });
    if (kept.length !== smartExtra.length) { smartExtra = kept; feed(); }
  }

  // Event hooks write a personal inbox item (cross-device, survives reinstall).
  async function notify(item) {
    if (!uid) return;
    try {
      var db = window.db;
      if (!db || !db.collection) return;
      var data = {
        title: (item && item.title) || 'Notification',
        body: (item && item.body) || '',
        href: (item && item.href) || '',
        kind: (item && item.kind) || 'event',
        read: false
      };
      try { data.createdAt = firebase.firestore.FieldValue.serverTimestamp(); }
      catch (e) { data.createdAt = new Date(); }
      await db.collection('notifications').doc(uid).collection('items').add(data);
      prune(db);
    } catch (e) {}
  }

  async function prune(db) {
    try {
      var snap = await db.collection('notifications').doc(uid).collection('items')
        .orderBy('createdAt', 'desc').get();
      if (snap.size > INBOX_LIMIT) {
        var batch = db.batch();
        snap.docs.slice(INBOX_LIMIT).forEach(function (d) { batch.delete(d.ref); });
        await batch.commit();
      }
    } catch (e) {}
  }

  // Called when the bell panel opens.
  async function markSeen() {
    try { localStorage.setItem(LS_SEEN_BC, String(nowMs())); } catch (e) {}
    broadcasts = [];
    try {
      var db = window.db;
      if (db && db.collection) {
        var batch = db.batch(), any = false;
        inboxItems.forEach(function (n) {
          if (!n.read && n.docId) {
            batch.update(
              db.collection('notifications').doc(uid).collection('items').doc(n.docId),
              { read: true });
            any = true;
          }
        });
        if (any) await batch.commit();
      }
    } catch (e) {}
    feed();
  }

  /* ---------------- layer 1: smart ---------------- */

  async function computeSmart(db) {
    var out = [];
    try {
      var snap = await db.collection('users').doc(uid).get();
      var data = snap.exists ? snap.data() : {};
      var streak = data.dailyStreak || { last: null, count: 0 };
      var yest = dayKey(new Date(nowMs() - 864e5));
      if (streak.last === yest && (streak.count || 0) > 0) {
        out.push({
          id: 'streak-risk', title: 'Streak on the line',
          body: 'Your ' + streak.count + '-day streak resets if you skip today.',
          href: '/missions.html', at: nowMs(), kind: 'smart'
        });
      }
    } catch (e) {}
    try {
      var last = JSON.parse(localStorage.getItem(LS_LAST_ACT) || 'null');
      var nudged = null;
      try { nudged = localStorage.getItem(LS_RESUME_NUDGED); } catch (e2) {}
      if (last && last.at) {
        var ageH = (nowMs() - last.at) / 36e5;
        if (ageH >= 20 && ageH < 24 * 7 && nudged !== dayKey()) {
          out.push({
            id: 'resume', title: 'Pick it back up',
            body: last.label || 'Your training is waiting.',
            href: last.href || '/missions.html', at: nowMs(), kind: 'smart'
          });
          try { localStorage.setItem(LS_RESUME_NUDGED, dayKey()); } catch (e3) {}
        }
      }
    } catch (e) {}
    return out;
  }

  /* ---------------- layer 2: broadcasts ---------------- */

  function subscribeBroadcasts(db) {
    db.collection('broadcasts').orderBy('createdAt', 'desc').limit(BROADCAST_LIMIT)
      .onSnapshot(function (snap) {
        var seen = 0;
        try { seen = parseInt(localStorage.getItem(LS_SEEN_BC) || '0', 10) || 0; } catch (e) {}
        var arr = [];
        snap.forEach(function (doc) {
          var b = doc.data() || {};
          var created = tsMillis(b.createdAt);
          if (!created || created <= seen) return;
          var exp = tsMillis(b.expiresAt);
          if (exp && exp <= nowMs()) return;
          if (b.audience && b.audience !== 'all' && b.audience !== tier) return;
          arr.push({
            id: 'bc-' + doc.id, title: b.title || 'Update', body: b.body || '',
            href: b.href || '', at: created, kind: 'broadcast'
          });
        });
        broadcasts = arr;
        feed();
      }, function () { broadcasts = []; feed(); });
  }

  /* ---------------- layer 3: inbox ---------------- */

  function subscribeInbox(db) {
    db.collection('notifications').doc(uid).collection('items')
      .orderBy('createdAt', 'desc').limit(INBOX_LIMIT)
      .onSnapshot(function (snap) {
        var arr = [];
        snap.forEach(function (doc) {
          var n = doc.data() || {};
          arr.push({
            id: 'in-' + doc.id, docId: doc.id,
            title: n.title || 'Notification', body: n.body || '', href: n.href || '',
            at: tsMillis(n.createdAt), kind: 'inbox', read: n.read === true
          });
        });
        inboxItems = arr;
        feed();
      }, function () { inboxItems = []; feed(); });
  }

  /* ---------------- merge + feed the bell ---------------- */

  // Wrap window.Header.setNotifications so page-fed items (operator dashboard)
  // merge with automated ones instead of clobbering each other.
  function installMerge() {
    var H = window.Header;
    if (!H || typeof H.setNotifications !== 'function' || H.__cdNotifWrapped) return;
    try {
      if (typeof H.getPersonalNotifs === 'function') {
        var cur = H.getPersonalNotifs();
        if (cur) {
          externalItems = Array.isArray(cur.items) ? cur.items : [];
          externalUnread = Number(cur.unread) || 0;
        }
      }
    } catch (e) {}
    origSetNotifs = H.setNotifications;
    H.__cdNotifWrapped = true;
    H.setNotifications = function (items, unread) {
      externalItems = Array.isArray(items) ? items : [];
      externalUnread = Number(unread) || 0;
      feed();
    };
  }

  function feed() {
    if (!booted) return;
    var H = window.Header;
    if (!H) return;
    var seen = {}, items = [], unread = externalUnread;
    var add = function (n, isUnread) {
      if (!n || seen[n.id]) return;
      seen[n.id] = 1;
      items.push({
        text: n.title, body: n.body || '', href: n.href || '',
        time: timeAgo(n.at), kind: n.kind
      });
      if (isUnread) unread++;
    };
    var normExternal = function (n, i) {
      return {
        id: 'ext-' + i, title: n.text || n.message || n.title || 'Notification',
        body: n.body || '', href: n.href || '', at: 0, kind: 'external'
      };
    };
    externalItems.forEach(function (n, i) { add(normExternal(n, i), false); });
    inboxItems.forEach(function (n) { if (!n.read) add(n, true); });
    broadcasts.forEach(function (n) { add(n, true); });
    smartCache.slice(0, SMART_MAX).forEach(function (n) { add(n, true); });
    smartExtra.slice(0, SMART_MAX).forEach(function (n) { add(n, true); });
    inboxItems.forEach(function (n) { if (n.read) add(n, false); });
    try {
      var target = origSetNotifs || H.setNotifications;
      if (typeof target === 'function') target.call(H, items, unread);
    } catch (e) {}
  }

  /* ---------------- boot ---------------- */

  function boot() {
    installMerge();
    booted = true;
    var start = function () {
      if (uid) return;
      var u = window.USER || {};
      if (!u.isLoggedIn || !u.uid) return;
      uid = u.uid;
      tier = u.tier || 'free';
      var db = window.db;
      if (!db || !db.collection) return;
      computeSmart(db).then(function (s) {
        smartCache = s.slice(0, SMART_MAX);
        feed();
      });
      subscribeBroadcasts(db);
      subscribeInbox(db);
    };
    if (window.USER && window.USER.isLoggedIn) start();
    window.addEventListener('userStateReady', start);
  }

  function init() {
    if (inited) return;
    inited = true;
    var waits = 0;
    var tick = function () {
      if (window.Header && typeof window.Header.setNotifications === 'function') { boot(); return; }
      if (++waits < 60) setTimeout(tick, 250);
    };
    tick();
  }

  window.CDNotifs = {
    init: init,
    pushSmart: pushSmart,
    clearSmart: clearSmart,
    stampActivity: stampActivity,
    notify: notify,
    markSeen: markSeen
  };
})();
