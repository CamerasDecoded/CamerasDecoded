/* ================================================================
   CDPro — Pro upgrades, manual-fulfillment edition (v1)
   ---------------------------------------------------------------
   No backend, no Blaze plan, no Stripe secret on the client.
   The owner creates three Stripe Payment Links (weekly / monthly /
   annual) and stores them in the `config/payments` Firestore doc:

     { weekly: "https://buy.stripe.com/...",
       monthly: "https://buy.stripe.com/...",
       annual: "https://buy.stripe.com/..." }

   Flow: buyer picks a plan -> Stripe Payment Link (email prefilled)
   -> Stripe redirects to /pro-success.html?paid=1 -> the page writes
   a `proRequests/{uid}` doc -> the owner approves it in the admin
   dashboard ("Pro requests" panel) after verifying the payment in
   Stripe -> the buyer's `users/{uid}.tier` becomes 'pro' and every
   existing Pro gate lights up.

   Paid access = the `tier` field, flipped only by an admin. The
   request queue is the paper trail; Stripe's dashboard is the
   payment truth.
   ================================================================ */
window.CDPro = (function () {
  'use strict';

  function db() {
    return (typeof window.db !== 'undefined' && window.db) ? window.db : null;
  }
  function auth() {
    return (typeof window.auth !== 'undefined' && window.auth) ? window.auth : null;
  }
  function currentUser() {
    var a = auth();
    return (a && a.currentUser) ? a.currentUser : null;
  }

  function ready() {
    return new Promise(function (resolve) {
      if (db() && auth()) return resolve(true);
      var tries = 0;
      var t = setInterval(function () {
        tries++;
        if (db() && auth()) { clearInterval(t); resolve(true); }
        else if (tries > 100) { clearInterval(t); resolve(false); }
      }, 100);
    });
  }

  /* The three Stripe Payment Links, stored by the owner in Firestore. */
  async function getPaymentLinks() {
    var ok = await ready();
    var d = db();
    if (!ok || !d) throw new Error('Database unavailable');
    var snap = await d.collection('config').doc('payments').get();
    if (!snap.exists) throw new Error('not-configured');
    var data = snap.data() || {};
    return {
      weekly: data.weekly || null,
      monthly: data.monthly || null,
      annual: data.annual || null
    };
  }

  /* File a Pro upgrade request after the buyer returns from Stripe.
     One doc per user; the admin approves it in the dashboard. */
  async function requestUpgrade(plan) {
    var ok = await ready();
    var d = db();
    var user = currentUser();
    if (!ok || !d) throw new Error('Database unavailable');
    if (!user) throw new Error('Sign in required');
    var ref = d.collection('proRequests').doc(user.uid);
    var existing = null;
    try { existing = (await ref.get()).data() || null; } catch (e) {}
    if (existing && existing.status === 'active') return existing;
    var payload = {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      plan: plan,
      status: 'pending',
      createdAt: (window.firebase && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date()
    };
    await ref.set(payload, { merge: true });
    return payload;
  }

  async function getRequest() {
    var ok = await ready();
    var d = db();
    var user = currentUser();
    if (!ok || !d || !user) return null;
    try {
      var snap = await d.collection('proRequests').doc(user.uid).get();
      return snap.exists ? snap.data() : null;
    } catch (e) { return null; }
  }

  /* Live-watch the buyer's own request doc (success page uses this
     to flip to "Welcome to Pro" the moment the admin approves). */
  function watchRequest(cb) {
    var d = db();
    var user = currentUser();
    if (!d || !user) { cb(null); return function () {}; }
    return d.collection('proRequests').doc(user.uid)
      .onSnapshot(function (snap) { cb(snap.exists ? snap.data() : null); },
                  function () { cb(null); });
  }

  /* Load this module on demand (pages where master-loader hasn't yet). */
  function ensure() {
    if (window.CDPro) return Promise.resolve(window.CDPro);
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = '/scripts/pro-checkout.js?v=20260918b';
      s.onload = function () { resolve(window.CDPro || null); };
      s.onerror = function () { resolve(window.CDPro || null); };
      document.head.appendChild(s);
    });
  }

  return {
    getPaymentLinks: getPaymentLinks,
    requestUpgrade: requestUpgrade,
    getRequest: getRequest,
    watchRequest: watchRequest,
    ensure: ensure
  };
})();
