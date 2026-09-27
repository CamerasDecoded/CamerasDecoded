/* Protocol save button — toggles users/{uid}.savedProtocols for the current
   protocol page. Quiet ghost control; signed-out users are sent to /login.html.
   Deferred Firebase compat scripts run before DOMContentLoaded, so init waits
   for it when the document is still parsing. */
(function () {
  'use strict';

  function init() {
    var btn = document.querySelector('[data-save-protocol]');
    if (!btn) return;
    var pid = btn.getAttribute('data-pid');
    if (!pid) { btn.style.display = 'none'; return; }
    var label = btn.querySelector('.prp-sv-label');

    function firebaseReady() {
      return (typeof firebase !== 'undefined') && firebase.auth && firebase.firestore;
    }
    if (!firebaseReady()) { btn.style.display = 'none'; return; }

    function setState(saved) {
      btn.classList.toggle('saved', !!saved);
      btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
      if (label) label.textContent = saved ? 'Saved to library' : 'Save protocol';
    }

    function refresh() {
      var user = firebase.auth().currentUser;
      if (!user) { setState(false); return; }
      firebase.firestore().collection('users').doc(user.uid).get()
        .then(function (snap) {
          var data = snap.exists ? snap.data() : {};
          setState((data.savedProtocols || []).indexOf(pid) !== -1);
        })
        .catch(function () { /* silent: keep last known state */ });
    }

    var busy = false;
    btn.addEventListener('click', function () {
      if (busy || !firebaseReady()) return;
      var user = firebase.auth().currentUser;
      if (!user) { window.location.href = '/login.html'; return; }
      busy = true;
      var ref = firebase.firestore().collection('users').doc(user.uid);
      var F = firebase.firestore.FieldValue;
      ref.get().then(function (snap) {
        var data = snap.exists ? snap.data() : {};
        var isSaved = (data.savedProtocols || []).indexOf(pid) !== -1;
        /* set-with-merge, not update: a fresh user doc must not throw */
        return ref.set(
          { savedProtocols: isSaved ? F.arrayRemove(pid) : F.arrayUnion(pid) },
          { merge: true }
        ).then(function () { setState(!isSaved); });
      }).catch(function () { /* silent */ })
        .then(function () { busy = false; });
    });

    firebase.auth().onAuthStateChanged(function () { refresh(); });
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
