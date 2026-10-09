/* social.js — Cameras Decoded social layer (Phase 1).
 *
 * window.CDSocial:
 *   shareProfile({uid, displayName, username, badgeCount, streak}) — native share sheet + clipboard fallback
 *   invite() — share sheet with the user's referral link (?ref=CODE)
 *   ensureReferralCode() — returns the user's referral code, generating one if missing
 *   follow(targetUid) / unfollow(targetUid) / isFollowing(targetUid) / getFollowing()
 *   getFollowerCount(uid) / getFollowingCount(uid)
 *   toggleLike(targetUid) / hasLiked(targetUid) / getLikeCount(uid)
 *   getPublicProfile(uid) — public read, works signed-out
 *   syncPublicProfile() — writes the owner's public card (call after profile renders)
 *
 * Firestore (see firestore-rules-CANONICAL.txt):
 *   publicProfiles/{uid} — public read, owner write (display fields only)
 *   follows/{followerUid}_{targetUid} — follower-managed
 *   profileLikes/{targetUid}_{likerUid} — liker-managed toggle
 *
 * Brand: #08080a / #8deb00, Space Mono labels, no emojis.
 */
(function () {
  'use strict';

  if (window.CDSocial) return;

  var NEON = '#8deb00';

  /* ---------- helpers ---------- */

  function db() {
    try {
      if (typeof firebase !== 'undefined' && firebase.firestore) return firebase.firestore();
    } catch (e) {}
    return null;
  }

  function auth() {
    try {
      if (typeof firebase !== 'undefined' && firebase.auth) return firebase.auth();
    } catch (e) {}
    return null;
  }

  function currentUid() {
    var a = auth();
    return (a && a.currentUser) ? a.currentUser.uid : null;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- toast ---------- */

  var _toast = null;
  function toast(msg) {
    if (!_toast) {
      _toast = document.createElement('div');
      _toast.className = 'cds-toast';
      document.body.appendChild(_toast);
    }
    _toast.textContent = msg;
    _toast.classList.add('cds-show');
    clearTimeout(_toast._t);
    _toast._t = setTimeout(function () { _toast.classList.remove('cds-show'); }, 2200);
  }

  /* ---------- share sheet ---------- */

  var _sheet = null, _backdrop = null;

  var CSS =
    '.cds-backdrop{position:fixed;inset:0;z-index:22000;background:rgba(0,0,0,.72);' +
    'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;' +
    'align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .22s ease}' +
    '.cds-backdrop.cds-open{opacity:1;pointer-events:auto}' +
    '.cds-sheet{width:100%;max-width:520px;max-height:92dvh;overflow-y:auto;position:relative;' +
    'background:#0b0b0b;border:1px solid rgba(141,235,0,.28);border-bottom:0;' +
    'border-radius:18px 18px 0 0;padding:14px 20px calc(20px + env(safe-area-inset-bottom));' +
    'transform:translateY(26px);transition:transform .26s cubic-bezier(.2,.9,.25,1);' +
    'box-shadow:0 -12px 60px rgba(141,235,0,.10)}' +
    '.cds-backdrop.cds-open .cds-sheet{transform:translateY(0)}' +
    '.cds-grip{width:44px;height:5px;border-radius:3px;background:#2a2a2a;margin:2px auto 14px}' +
    '.cds-eyebrow{font-family:"Space Mono",monospace;font-size:10px;letter-spacing:3px;' +
    'color:' + NEON + ';text-transform:uppercase;margin-bottom:6px;text-align:center}' +
    '.cds-sub{font-family:"Space Mono",monospace;font-size:11px;color:#888;letter-spacing:.04em;' +
    'text-align:center;margin:0 8px 16px;line-height:1.7}' +
    '.cds-sub b{color:#fff}' +
    '.cds-primary{display:block;width:100%;border-radius:12px;padding:15px 18px;' +
    'border:1px solid rgba(141,235,0,.5);cursor:pointer;margin:0 0 10px;' +
    'background:linear-gradient(135deg,' + NEON + ',' + '#b6ff4d' + ');' +
    'color:#06110a;font-family:Montserrat,sans-serif;font-size:15px;font-weight:800}' +
    '.cds-primary:active{transform:scale(.98)}' +
    '.cds-row{display:flex;gap:10px}' +
    '.cds-ghost{flex:1;border-radius:12px;padding:13px 10px;cursor:pointer;' +
    'background:transparent;border:1px solid rgba(141,235,0,.25);color:' + NEON + ';' +
    'font-family:"Space Mono",monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase}' +
    '.cds-ghost:active{background:rgba(141,235,0,.08)}' +
    '.cds-close{position:absolute;top:10px;right:14px;background:none;border:0;color:#777;' +
    'font-size:22px;cursor:pointer;line-height:1;padding:6px}' +
    '.cds-toast{position:fixed;left:50%;bottom:calc(28px + env(safe-area-inset-bottom));' +
    'transform:translateX(-50%) translateY(8px);background:#101010;color:#fff;' +
    'border:1px solid rgba(141,235,0,.4);border-radius:10px;padding:11px 18px;' +
    'font-family:"Space Mono",monospace;font-size:12px;letter-spacing:.05em;z-index:22001;' +
    'opacity:0;pointer-events:none;transition:opacity .2s ease,transform .2s ease;white-space:nowrap}' +
    '.cds-toast.cds-show{opacity:1;transform:translateX(-50%) translateY(0)}' +
    '@media (prefers-reduced-motion:reduce){.cds-backdrop,.cds-sheet,.cds-toast{transition:none}' +
    '.cds-sheet{transform:none}}' +
    '@media (min-width:560px){.cds-backdrop{align-items:center}.cds-sheet{border-bottom:1px solid rgba(141,235,0,.28);border-radius:18px}}';

  function ensureCSS() {
    if (document.getElementById('cds-css')) return;
    var s = document.createElement('style');
    s.id = 'cds-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function closeSheet() {
    if (_backdrop) _backdrop.classList.remove('cds-open');
    _backdrop = null; _sheet = null;
  }

  function openSheet(opts) {
    ensureCSS();
    closeSheet();
    _backdrop = document.createElement('div');
    _backdrop.className = 'cds-backdrop';
    _backdrop.innerHTML =
      '<div class="cds-sheet" role="dialog" aria-modal="true">' +
      '<div class="cds-grip"></div>' +
      '<button class="cds-close" aria-label="Close">&times;</button>' +
      '<div class="cds-eyebrow">' + esc(opts.eyebrow || 'Share') + '</div>' +
      '<p class="cds-sub">' + opts.subHtml + '</p>' +
      '<button class="cds-primary" data-act="share">' + esc(opts.cta || 'Share') + '</button>' +
      '<div class="cds-row">' +
      '<button class="cds-ghost" data-act="copy">Copy link</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(_backdrop);
    requestAnimationFrame(function () { _backdrop.classList.add('cds-open'); });
    _backdrop.querySelector('.cds-close').addEventListener('click', closeSheet);
    _backdrop.addEventListener('click', function (e) {
      if (e.target === _backdrop) closeSheet();
    });
    _backdrop.querySelector('[data-act="share"]').addEventListener('click', function () {
      doNativeShare(opts);
    });
    _backdrop.querySelector('[data-act="copy"]').addEventListener('click', function () {
      copyLink(opts.url, opts.copyMsg || 'Link copied');
    });
  }

  function doNativeShare(opts) {
    var payload = { title: opts.title || 'Cameras Decoded', text: opts.text || '', url: opts.url };
    if (navigator.share) {
      navigator.share(payload).then(function () { closeSheet(); }).catch(function () {});
    } else {
      copyLink(opts.url, 'Share not supported — link copied');
    }
  }

  function copyLink(url, msg) {
    function done() { toast(msg); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () { fallbackCopy(url, done); });
    } else {
      fallbackCopy(url, done);
    }
  }

  function fallbackCopy(text, cb) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    if (cb) cb();
  }

  /* ---------- referral ---------- */

  var _refCode = null, _refTried = false;

  function ensureReferralCode() {
    return new Promise(function (resolve) {
      var uid = currentUid();
      if (!uid) return resolve(null);
      if (_refTried) return resolve(_refCode);
      var d = db();
      if (!d) return resolve(null);
      d.collection('users').doc(uid).get().then(function (snap) {
        var data = snap.exists ? snap.data() : {};
        var code = data.referralCode || null;
        if (code) { _refTried = true; _refCode = code; return resolve(code); }
        // Generate one from the username, falling back to uid fragment.
        var base = String(data.username || data.displayName || 'user')
          .toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'user';
        code = base + '-' + uid.slice(0, 4).toLowerCase();
        d.collection('users').doc(uid).set(
          { referralCode: code, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
          { merge: true }
        ).then(function () {
          _refTried = true; _refCode = code; resolve(code);
        }).catch(function () { resolve(null); });
      }).catch(function () { resolve(null); });
    });
  }

  /* ---------- public profiles ---------- */

  function getPublicProfile(uid) {
    var d = db();
    if (!d || !uid) return Promise.resolve(null);
    return d.collection('publicProfiles').doc(uid).get().then(function (snap) {
      return snap.exists ? Object.assign({ uid: uid }, snap.data()) : null;
    }).catch(function () { return null; });
  }

  // Writes the signed-in user's public card. Call after the profile renders.
  // Only public-safe fields; counts are maintained by follow/like writes.
  function syncPublicProfile(data) {
    var uid = currentUid();
    var d = db();
    if (!uid || !d || !data) return Promise.resolve();
    var badges = data.badges || {};
    var payload = {
      displayName: data.displayName || data.name || '',
      username: data.username || '',
      avatarUrl: data.photoURL || '',
      badgeCount: Object.keys(badges).length,
      streakDays: (data.dailyStreak && data.dailyStreak.count) || data.streak || 0,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    return d.collection('publicProfiles').doc(uid).set(payload, { merge: true }).catch(function () {});
  }

  /* ---------- follows ---------- */

  function followId(a, b) { return a + '_' + b; }

  function follow(targetUid) {
    var uid = currentUid();
    var d = db();
    if (!uid) return Promise.reject(new Error('Sign in required'));
    if (!d || !targetUid || targetUid === uid) return Promise.reject(new Error('Invalid target'));
    var ref = d.collection('follows').doc(followId(uid, targetUid));
    var batch = d.batch();
    batch.set(ref, {
      followerUid: uid,
      targetUid: targetUid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    batch.set(d.collection('publicProfiles').doc(targetUid),
      { followerCount: firebase.firestore.FieldValue.increment(1) }, { merge: true });
    batch.set(d.collection('publicProfiles').doc(uid),
      { followingCount: firebase.firestore.FieldValue.increment(1) }, { merge: true });
    return batch.commit();
  }

  function unfollow(targetUid) {
    var uid = currentUid();
    var d = db();
    if (!uid) return Promise.reject(new Error('Sign in required'));
    if (!d || !targetUid) return Promise.reject(new Error('Invalid target'));
    var ref = d.collection('follows').doc(followId(uid, targetUid));
    var batch = d.batch();
    batch.delete(ref);
    batch.set(d.collection('publicProfiles').doc(targetUid),
      { followerCount: firebase.firestore.FieldValue.increment(-1) }, { merge: true });
    batch.set(d.collection('publicProfiles').doc(uid),
      { followingCount: firebase.firestore.FieldValue.increment(-1) }, { merge: true });
    return batch.commit();
  }

  function isFollowing(targetUid) {
    var uid = currentUid();
    var d = db();
    if (!uid || !d || !targetUid) return Promise.resolve(false);
    return d.collection('follows').doc(followId(uid, targetUid)).get()
      .then(function (s) { return s.exists; }).catch(function () { return false; });
  }

  // Returns array of target UIDs the current user follows.
  function getFollowing() {
    var uid = currentUid();
    var d = db();
    if (!uid || !d) return Promise.resolve([]);
    return d.collection('follows').where('followerUid', '==', uid).get()
      .then(function (qs) {
        var out = [];
        qs.forEach(function (doc) {
          var t = doc.data().targetUid;
          if (t) out.push(t);
        });
        return out;
      }).catch(function () { return []; });
  }

  /* ---------- profile likes ("signals") ---------- */

  function likeId(targetUid, likerUid) { return targetUid + '_' + likerUid; }

  function hasLiked(targetUid) {
    var uid = currentUid();
    var d = db();
    if (!uid || !d || !targetUid) return Promise.resolve(false);
    return d.collection('profileLikes').doc(likeId(targetUid, uid)).get()
      .then(function (s) { return s.exists; }).catch(function () { return false; });
  }

  function toggleLike(targetUid) {
    var uid = currentUid();
    var d = db();
    if (!uid) return Promise.reject(new Error('Sign in required'));
    if (!d || !targetUid || targetUid === uid) return Promise.reject(new Error('Invalid target'));
    var ref = d.collection('profileLikes').doc(likeId(targetUid, uid));
    return ref.get().then(function (snap) {
      var batch = d.batch();
      if (snap.exists) {
        batch.delete(ref);
        batch.set(d.collection('publicProfiles').doc(targetUid),
          { likeCount: firebase.firestore.FieldValue.increment(-1) }, { merge: true });
        return batch.commit().then(function () { return false; });
      }
      batch.set(ref, {
        likerUid: uid,
        targetUid: targetUid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      batch.set(d.collection('publicProfiles').doc(targetUid),
        { likeCount: firebase.firestore.FieldValue.increment(1) }, { merge: true });
      return batch.commit().then(function () { return true; });
    });
  }

  /* ---------- share entry points ---------- */

  function profileUrl(uid) {
    return 'https://camerasdecoded.com/profile.html?u=' + encodeURIComponent(uid);
  }

  function shareProfile(info) {
    var url = profileUrl(info.uid);
    var name = info.displayName || info.username || 'a photographer';
    var stats = [];
    if (info.badgeCount) stats.push(info.badgeCount + ' badges');
    if (info.streakDays) stats.push(info.streakDays + '-day streak');
    var text = 'Check out ' + name + ' on Cameras Decoded' +
      (stats.length ? ' — ' + stats.join(', ') : '') + '.';
    openSheet({
      eyebrow: 'Share profile',
      subHtml: 'Share <b>' + esc(name) + '</b>&rsquo;s profile with the world.',
      cta: 'Share profile',
      title: 'Cameras Decoded',
      text: text,
      url: url
    });
  }

  function invite() {
    var uid = currentUid();
    if (!uid) {
      toast('Sign in to invite friends');
      return;
    }
    ensureReferralCode().then(function (code) {
      if (!code) { toast('Couldn\'t load your invite link'); return; }
      var url = 'https://camerasdecoded.com/?ref=' + encodeURIComponent(code);
      openSheet({
        eyebrow: 'Invite friends',
        subHtml: 'Your personal invite link. When friends join and hit their first-week milestones, you both earn.',
        cta: 'Invite friends',
        title: 'Cameras Decoded',
        text: 'Learn photography the fun way — join me on Cameras Decoded.',
        url: url,
        copyMsg: 'Invite link copied'
      });
    });
  }

  /* ---------- public API ---------- */

  window.CDSocial = {
    shareProfile: shareProfile,
    invite: invite,
    ensureReferralCode: ensureReferralCode,
    follow: follow,
    unfollow: unfollow,
    isFollowing: isFollowing,
    getFollowing: getFollowing,
    hasLiked: hasLiked,
    toggleLike: toggleLike,
    getPublicProfile: getPublicProfile,
    syncPublicProfile: syncPublicProfile,
    profileUrl: profileUrl,
    copyLink: copyLink,
    toast: toast
  };
})();
