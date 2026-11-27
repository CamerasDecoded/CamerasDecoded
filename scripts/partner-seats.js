// partner-seats.js — Partner tenant seat system (pilot slice).
//
// Phase 1 of partner-tenant-seat-plan.md: one settings record per partner
// (partners/{PART-XXXXXX}), members claim seats themselves through a join
// link (join.html?p=CODE), and the seat counter only ever moves inside a
// claim/release transaction — member doc + counter + user link, atomic.
// No hand-provisioning: the owner creates the tenant record once (admin
// dashboard), members do the rest themselves.
//
// Loaded site-wide by master-loader.js (claim pickup after signup +
// loader-applied branding) and directly by join.html / partner-dashboard.
// Exposes window.CDPartner. Also loadable in Node for the claim-flow
// harness (createPartnerSeats with injected db/firebase).
(function (global) {
  'use strict';

  var STASH_KEY = 'signup_partner';

  // Tier table (owner decisions, 2026-11-26): Signal 100 seats,
  // Operator 300, Enterprise unlimited. seatPool null = unlimited.
  var TIERS = {
    signal:     { label: 'Signal',     seatPool: 100,  monthly: 175, annual: 1680 },
    operator:   { label: 'Operator',   seatPool: 300,  monthly: 495, annual: 4750 },
    enterprise: { label: 'Enterprise', seatPool: null, monthly: 995, annual: 9550 }
  };
  var TIER_ORDER = ['signal', 'operator', 'enterprise'];

  // Add-seat packs: $2/seat/mo (owner decision, 2026-11-26) — priced
  // above the tier per-seat rate so upgrading stays the better deal.
  var SEAT_PACKS = [10, 25, 50];
  var SEAT_PRICE = 2;

  function effectivePool(p) {
    if (!p || p.seatPool === null || p.seatPool === undefined) return null;
    return p.seatPool + (p.seatsAddon || 0);
  }
  function seatsLeft(p) {
    var pool = effectivePool(p);
    if (pool === null) return null;
    return Math.max(0, pool - (p.seatsUsed || 0));
  }
  function nextTier(tier) {
    var i = TIER_ORDER.indexOf(tier);
    return (i >= 0 && i < TIER_ORDER.length - 1) ? TIER_ORDER[i + 1] : null;
  }

  function createPartnerSeats(deps) {
    var db = deps.db;
    var firebase = deps.firebase;
    var storage = deps.storage || null; // localStorage-like, optional
    var session = deps.session || null; // sessionStorage-like, optional

    function ts() { return firebase.firestore.FieldValue.serverTimestamp(); }
    function stashGet() { try { return storage ? storage.getItem(STASH_KEY) : null; } catch (e) { return null; } }
    function stashSet(code) { try { if (storage) storage.setItem(STASH_KEY, code); } catch (e) {} }
    function stashClear() { try { if (storage) storage.removeItem(STASH_KEY); } catch (e) {} }

    // Resolve a join code to its public subset (no auth required — the
    // partnerJoinCodes doc carries only public branding + pool state).
    function resolveJoinCode(code) {
      if (!code) return Promise.resolve(null);
      return db.collection('partnerJoinCodes').doc(code).get().then(function (snap) {
        if (!snap.exists) return null;
        var d = snap.data() || {};
        d.code = code;
        return d;
      });
    }

    // The seat claim. Runs as one Firestore transaction: member doc +
    // seatsUsed (+1 on partners and its joinCodes mirror) + the user
    // link. Idempotent: an existing member doc is a no-op success.
    // Pool full -> waitlist doc; the account is never blocked or undone.
    // Returns { ok, reason, partnerId } — reasons: 'claimed',
    // 'already-member', 'full', 'closed', 'bad-code', 'no-partner',
    // 'other-partner', 'error'.
    function claimSeat(code, user) {
      if (!code || !user || !user.uid) return Promise.resolve({ ok: false, reason: 'bad-code' });
      var uid = user.uid;
      return resolveJoinCode(code).then(function (pub) {
        if (!pub || !pub.partnerId) { stashClear(); return { ok: false, reason: 'bad-code' }; }
        var partnerId = pub.partnerId;
        var pRef = db.collection('partners').doc(partnerId);
        var mRef = pRef.collection('members').doc(uid);
        var uRef = db.collection('users').doc(uid);
        var cRef = db.collection('partnerJoinCodes').doc(code);
        return db.runTransaction(function (tx) {
          return Promise.all([tx.get(pRef), tx.get(mRef), tx.get(uRef), tx.get(cRef)]).then(function (snaps) {
            var pSnap = snaps[0], mSnap = snaps[1], uSnap = snaps[2], cSnap = snaps[3];
            if (!pSnap.exists) return { ok: false, reason: 'no-partner', partnerId: partnerId };
            var p = pSnap.data() || {};
            var u = uSnap.exists ? (uSnap.data() || {}) : {};
            if (mSnap.exists) {
              // Idempotent re-join: heal the user link if it drifted.
              if (u.partnerId !== partnerId) {
                tx.update(uRef, { partnerId: partnerId, partnerRole: 'member',
                  partnerJoinedAt: ts(), updatedAt: ts() });
              }
              return { ok: true, reason: 'already-member', partnerId: partnerId, partner: p };
            }
            if (p.joinEnabled === false || p.status === 'suspended' || p.status === 'closed') {
              return { ok: false, reason: 'closed', partnerId: partnerId, partner: p };
            }
            // One partner seat per user (plan §11.11): a live seat with
            // another partner blocks a second claim; a stale link (no
            // member doc there) does not.
            if (u.partnerId && u.partnerId !== partnerId) {
              return tx.get(db.collection('partners').doc(u.partnerId).collection('members').doc(uid))
                .then(function (otherSnap) {
                  if (otherSnap.exists) return { ok: false, reason: 'other-partner', partnerId: partnerId, partner: p };
                  return doClaim(tx, p, u);
                });
            }
            return doClaim(tx, p, u);

            function doClaim(tx, p, u) {
              var pool = effectivePool(p);
              if (pool !== null && (p.seatsUsed || 0) >= pool) {
                tx.set(pRef.collection('waitlist').doc(uid),
                  { uid: uid, joinedAt: ts() }, { merge: true });
                return { ok: false, reason: 'full', partnerId: partnerId, partner: p };
              }
              tx.set(mRef, { uid: uid, claimedAt: ts(), via: 'join_link',
                status: 'active', lastActiveAt: ts() });
              tx.update(pRef, { seatsUsed: (p.seatsUsed || 0) + 1, updatedAt: ts() });
              var cUsed = cSnap.exists ? ((cSnap.data() || {}).seatsUsed || 0) : (p.seatsUsed || 0);
              tx.update(cRef, { seatsUsed: cUsed + 1 });
              tx.update(uRef, { partnerId: partnerId, partnerRole: 'member',
                partnerJoinedAt: ts(), updatedAt: ts() });
              return { ok: true, reason: 'claimed', partnerId: partnerId, partner: p };
            }
          });
        }).then(function (result) {
          if (result.reason === 'claimed' || result.reason === 'already-member' ||
              result.reason === 'full' || result.reason === 'closed' ||
              result.reason === 'other-partner' || result.reason === 'no-partner') {
            stashClear();
          }
          if (result.reason === 'claimed' && result.partner && result.partner.groupId) {
            // Home-group membership is best-effort after the claim: the
            // seat is the record of truth, the group is the room.
            db.collection('groups').doc(result.partner.groupId)
              .collection('members').doc(uid)
              .set({ role: 'member', joinedAt: ts() }, { merge: true })
              .catch(function () {});
          }
          return result;
        });
      }).catch(function (err) {
        // Rules not pasted yet, offline, contention — never block the
        // account. Keep the stash for a later retry (session-guarded
        // by the bootstrap so it cannot loop).
        return { ok: false, reason: 'error', error: err };
      });
    }

    // Release a seat: delete the member doc + seatsUsed -1 (partners +
    // joinCodes mirror), one transaction. When the actor IS the member
    // (self-leave), their user link clears in the same transaction.
    // When the partner owner removes someone, the removed user's link
    // self-heals on their next load (membership verify in bootstrap).
    function releaseSeat(partnerId, memberUid, actorUid) {
      if (!partnerId || !memberUid) return Promise.resolve({ ok: false, reason: 'bad-args' });
      var pRef = db.collection('partners').doc(partnerId);
      var mRef = pRef.collection('members').doc(memberUid);
      return db.runTransaction(function (tx) {
        return Promise.all([tx.get(pRef), tx.get(mRef)]).then(function (snaps) {
          var pSnap = snaps[0], mSnap = snaps[1];
          if (!pSnap.exists) return { ok: false, reason: 'no-partner' };
          var p = pSnap.data() || {};
          if (!mSnap.exists) return { ok: true, reason: 'already-released', partner: p };
          var cRef = p.joinCode ? db.collection('partnerJoinCodes').doc(p.joinCode) : null;
          var finish = function (cSnap) {
            tx.delete(mRef);
            tx.update(pRef, { seatsUsed: Math.max(0, (p.seatsUsed || 0) - 1), updatedAt: ts() });
            if (cRef && cSnap && cSnap.exists) {
              tx.update(cRef, { seatsUsed: Math.max(0, ((cSnap.data() || {}).seatsUsed || 0) - 1) });
            }
            if (actorUid && actorUid === memberUid) {
              tx.update(db.collection('users').doc(memberUid),
                { partnerId: null, partnerRole: null, partnerJoinedAt: null, updatedAt: ts() });
            }
            return { ok: true, reason: 'released', partner: p };
          };
          if (cRef) return tx.get(cRef).then(finish);
          return finish(null);
        });
      }).then(function (result) {
        if (result.reason === 'released' && result.partner && result.partner.groupId) {
          db.collection('groups').doc(result.partner.groupId)
            .collection('members').doc(memberUid).delete().catch(function () {});
        }
        return result;
      }).catch(function (err) { return { ok: false, reason: 'error', error: err }; });
    }

    // Apply partner branding from the config record: CSS variables +
    // data attributes on <html>, cached in localStorage. Surfaces that
    // consume the vars (join page, partner dashboard) paint from them.
    function applyBranding(partnerId, branding, mode) {
      if (typeof document === 'undefined' || !branding) return;
      var root = document.documentElement;
      var colors = branding.colors || {};
      if (colors.primary) root.style.setProperty('--partner-primary', colors.primary);
      if (colors.accent) root.style.setProperty('--partner-accent', colors.accent);
      if (colors.background) root.style.setProperty('--partner-bg', colors.background);
      if (colors.nameText) root.style.setProperty('--partner-name-ink', colors.nameText);
      root.dataset.partnerId = partnerId || '';
      root.dataset.partnerMode = mode || 'shared';
      try {
        global.dispatchEvent(new CustomEvent('partnerBrandingReady', {
          detail: { partnerId: partnerId, branding: branding, mode: mode || 'shared' }
        }));
      } catch (e) {}
    }

    function cacheBranding(partnerId, branding, mode) {
      try {
        if (storage) storage.setItem('cd_partner_branding', JSON.stringify({
          partnerId: partnerId, branding: branding, mode: mode || 'shared', at: Date.now()
        }));
      } catch (e) {}
    }
    function cachedBranding() {
      try {
        var raw = storage && storage.getItem('cd_partner_branding');
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    }
    function clearBranding() {
      try { if (storage) storage.removeItem('cd_partner_branding'); } catch (e) {}
      if (typeof document !== 'undefined') {
        var root = document.documentElement;
        ['--partner-primary', '--partner-accent', '--partner-bg', '--partner-name-ink']
          .forEach(function (v) { root.style.removeProperty(v); });
        delete root.dataset.partnerId;
        delete root.dataset.partnerMode;
      }
    }

    // Load + apply branding for a signed-in member. Verifies the seat
    // still exists once per session; a stale partnerId (removed by the
    // partner) self-heals: link cleared, branding dropped.
    function loadBrandingForUser(user) {
      if (!user || !user.uid) return Promise.resolve(null);
      var uid = user.uid;
      return db.collection('users').doc(uid).get().then(function (uSnap) {
        if (!uSnap.exists) return null;
        var u = uSnap.data() || {};
        if (!u.partnerId) { clearBranding(); return null; }
        var partnerId = u.partnerId;
        var verifiedKey = 'cd_partner_verified_' + uid;
        var alreadyVerified = false;
        try { alreadyVerified = session && session.getItem(verifiedKey) === partnerId; } catch (e) {}
        var memberCheck = alreadyVerified ? Promise.resolve(true)
          : db.collection('partners').doc(partnerId).collection('members').doc(uid).get()
              .then(function (mSnap) {
                // Partner admins hold no seat (plan §11.12): ownerUid
                // access does not need a member doc.
                if (mSnap.exists) return true;
                return u.partnerRole === 'partner_admin';
              })
              .catch(function () { return true; }); // offline/rules: keep branding, retry later
        return memberCheck.then(function (isMember) {
          if (!isMember) {
            clearBranding();
            return db.collection('users').doc(uid).update({
              partnerId: null, partnerRole: null, partnerJoinedAt: null, updatedAt: ts()
            }).catch(function () {}).then(function () { return null; });
          }
          try { if (session) session.setItem(verifiedKey, partnerId); } catch (e) {}
          return db.collection('partners').doc(partnerId).get().then(function (pSnap) {
            if (!pSnap.exists) return null;
            var p = pSnap.data() || {};
            var branding = p.branding || null;
            if (branding) { cacheBranding(partnerId, branding, p.mode); applyBranding(partnerId, branding, p.mode); }
            return p;
          }).catch(function () {
            var c = cachedBranding();
            if (c && c.partnerId === partnerId) applyBranding(partnerId, c.branding, c.mode);
            return null;
          });
        });
      }).catch(function () { return null; });
    }

    return {
      TIERS: TIERS, TIER_ORDER: TIER_ORDER, SEAT_PACKS: SEAT_PACKS, SEAT_PRICE: SEAT_PRICE,
      STASH_KEY: STASH_KEY,
      effectivePool: effectivePool, seatsLeft: seatsLeft, nextTier: nextTier,
      stashGet: stashGet, stashSet: stashSet, stashClear: stashClear,
      resolveJoinCode: resolveJoinCode, claimSeat: claimSeat, releaseSeat: releaseSeat,
      applyBranding: applyBranding, loadBrandingForUser: loadBrandingForUser,
      cachedBranding: cachedBranding, clearBranding: clearBranding
    };
  }

  var api = { createPartnerSeats: createPartnerSeats, TIERS: TIERS,
    TIER_ORDER: TIER_ORDER, SEAT_PACKS: SEAT_PACKS, SEAT_PRICE: SEAT_PRICE,
    effectivePool: effectivePool, seatsLeft: seatsLeft, nextTier: nextTier, STASH_KEY: STASH_KEY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  // ---- Browser bootstrap (skipped in Node) ----
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  function boot() {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) return;
    var db = window.db || firebase.firestore();
    var auth = window.auth || firebase.auth();
    if (!db || !auth) return;
    var seats = createPartnerSeats({
      db: db, firebase: firebase,
      storage: window.localStorage, session: window.sessionStorage
    });
    window.CDPartner = seats;

    // Paint cached branding immediately (no flash of unbranded chrome),
    // then verify + refresh once auth resolves.
    var cached = seats.cachedBranding();
    if (cached && cached.branding) seats.applyBranding(cached.partnerId, cached.branding, cached.mode);

    var claimAttempted = false;
    auth.onAuthStateChanged(function (user) {
      if (!user) return;
      // Post-signup pickup: a stashed join code claims its seat on
      // whatever page the new account lands on. One attempt per page
      // load; failures keep the stash for the next load.
      var code = seats.stashGet();
      if (code && !claimAttempted) {
        claimAttempted = true;
        seats.claimSeat(code, user).then(function (result) {
          if (result && result.ok) seats.loadBrandingForUser(user);
        }).catch(function () {});
      } else {
        seats.loadBrandingForUser(user);
      }
    });
  }

  // Firebase may load after this script (loader order): poll briefly,
  // same shape as user-state.js's waitForFirebase.
  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      clearInterval(iv); boot();
    } else if (tries > 50) {
      clearInterval(iv);
    }
  }, 100);
})(typeof window !== 'undefined' ? window : globalThis);
