/* ================================================================
   CDReviews – in-app review capture (private bank, not public yet)
   window.CDReviews.maybePrompt(context)

   Anti-nag contract (the whole point):
   - Only fires at win moments, and only when maybePrompt() is called.
   - Never after the user submitted a review.
   - Max 2 dismissals, ever — then it retires permanently.
   - Minimum 30 days between asks.
   - Once per page load, max.
   - Signed-in users only (the write needs a uid).
   ================================================================ */
(function () {
  'use strict';

  var LS_KEY = 'cd_review_v1';
  var ASK_COOLDOWN = 30 * 24 * 60 * 60 * 1000; // 30 days
  var MAX_DISMISS = 2;
  var WIN_DELAY = 1500; // let the celebration land first

  var askedThisLoad = false;
  var scrim = null;
  var stars = 5;

  function state() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveState(s) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {}
  }

  function eligible() {
    if (askedThisLoad) return false;
    var s = state();
    if (s.submitted) return false;
    if ((s.dismissed || 0) >= MAX_DISMISS) return false;
    if (s.lastAsked && (Date.now() - s.lastAsked) < ASK_COOLDOWN) return false;
    try {
      var u = window.firebase && firebase.auth && firebase.auth().currentUser;
      if (!u) return false;
    } catch (e) { return false; }
    return true;
  }

  var CSS = [
    '.cdr-scrim{position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.6);',
    'display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .25s ease}',
    '.cdr-scrim.cdr-open{opacity:1;pointer-events:auto}',
    '.cdr-sheet{width:100%;max-width:480px;background:#0b0f0a;border:1px solid rgba(141,235,0,.25);',
    'border-bottom:none;border-radius:20px 20px 0 0;padding:14px 22px calc(26px + env(safe-area-inset-bottom));',
    'transform:translateY(24px);transition:transform .28s cubic-bezier(.34,1.3,.64,1);color:#fff;text-align:center}',
    '.cdr-scrim.cdr-open .cdr-sheet{transform:translateY(0)}',
    '.cdr-handle{width:44px;height:5px;border-radius:3px;background:#2a2a2a;margin:2px auto 14px}',
    '.cdr-title{font-family:"Space Mono",monospace;font-size:17px;margin:0 0 6px}',
    '.cdr-title b{color:#8deb00}',
    '.cdr-sub{font-size:13px;color:#b4b4b4;margin:0 0 14px;line-height:1.5}',
    '.cdr-stars{display:flex;gap:10px;justify-content:center;margin:0 0 14px}',
    '.cdr-star{background:none;border:none;font-size:34px;line-height:1;cursor:pointer;color:#333;padding:4px;transition:transform .15s ease,color .15s ease}',
    '.cdr-star.on{color:#8deb00;text-shadow:0 0 14px rgba(141,235,0,.5)}',
    '.cdr-star:active{transform:scale(1.25)}',
    '.cdr-text{width:100%;min-height:74px;resize:vertical;background:#101410;border:1px solid #222;border-radius:12px;',
    'color:#fff;font:inherit;font-size:14px;padding:12px;margin:0 0 14px;box-sizing:border-box}',
    '.cdr-text::placeholder{color:#666}',
    '.cdr-text:focus{outline:none;border-color:rgba(141,235,0,.5)}',
    '.cdr-cta{display:block;width:100%;padding:14px;border:none;border-radius:14px;cursor:pointer;',
    'background:#8deb00;color:#06110a;font-weight:800;font-size:15px;font-family:inherit;margin:0 0 10px}',
    '.cdr-cta:active{transform:scale(.98)}',
    '.cdr-quiet{display:block;width:100%;background:none;border:none;color:#888;font-size:13px;cursor:pointer;padding:6px;font-family:inherit}',
    '@media (prefers-reduced-motion: reduce){.cdr-scrim,.cdr-sheet,.cdr-star{transition:none}}'
  ].join('\n');

  function ensure() {
    if (scrim) return scrim;
    var st = document.createElement('style');
    st.id = 'cdr-styles';
    st.textContent = CSS;
    document.head.appendChild(st);

    scrim = document.createElement('div');
    scrim.className = 'cdr-scrim';
    scrim.setAttribute('aria-hidden', 'true');
    scrim.innerHTML =
      '<section class="cdr-sheet" role="dialog" aria-modal="true" aria-label="Leave a review">' +
        '<div class="cdr-handle"></div>' +
        '<h2 class="cdr-title">Feeling the <b>signal</b>?</h2>' +
        '<p class="cdr-sub">Quick one — how is Cameras Decoded treating you? Your words power the launch.</p>' +
        '<div class="cdr-stars" role="radiogroup" aria-label="Star rating">' +
          [1, 2, 3, 4, 5].map(function (n) {
            return '<button type="button" class="cdr-star' + (n <= 5 ? ' on' : '') +
              '" data-star="' + n + '" role="radio" aria-checked="' + (n === 5) +
              '" aria-label="' + n + ' star' + (n > 1 ? 's' : '') + '">★</button>';
          }).join('') +
        '</div>' +
        '<textarea class="cdr-text" data-cdr-text maxlength="500" placeholder="What clicked for you? (optional)"></textarea>' +
        '<button type="button" class="cdr-cta" data-cdr-send>Send it</button>' +
        '<button type="button" class="cdr-quiet" data-cdr-dismiss>Not now</button>' +
      '</section>';
    document.body.appendChild(scrim);

    scrim.querySelectorAll('[data-star]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        stars = Number(btn.getAttribute('data-star'));
        scrim.querySelectorAll('[data-star]').forEach(function (b) {
          var on = Number(b.getAttribute('data-star')) <= stars;
          b.classList.toggle('on', on);
          b.setAttribute('aria-checked', on && Number(b.getAttribute('data-star')) === stars ? 'true' : 'false');
        });
        tick();
      });
    });
    scrim.querySelector('[data-cdr-send]').addEventListener('click', submit);
    scrim.querySelector('[data-cdr-dismiss]').addEventListener('click', function () { dismiss(); });
    scrim.addEventListener('click', function (e) { if (e.target === scrim) dismiss(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && scrim.classList.contains('cdr-open')) dismiss();
    });
    return scrim;
  }

  function tick() {
    try { if (window.CDHaptics) window.CDHaptics.tick(); } catch (e) {}
  }

  function open() {
    ensure();
    askedThisLoad = true;
    var s = state();
    s.lastAsked = Date.now();
    saveState(s);
    stars = 5;
    scrim.classList.add('cdr-open');
    scrim.setAttribute('aria-hidden', 'false');
    tick();
  }

  function close() {
    if (!scrim) return;
    scrim.classList.remove('cdr-open');
    scrim.setAttribute('aria-hidden', 'true');
  }

  function dismiss() {
    var s = state();
    s.dismissed = (s.dismissed || 0) + 1;
    saveState(s);
    close();
  }

  function displayName(uid) {
    return new Promise(function (resolve) {
      try {
        window.db.collection('users').doc(uid).get().then(function (snap) {
          var u = snap.exists ? snap.data() : {};
          resolve(u.displayName || u.name || u.callsign || 'Operator');
        }).catch(function () { resolve('Operator'); });
      } catch (e) { resolve('Operator'); }
    });
  }

  async function submit() {
    var s = state();
    var text = '';
    try { text = scrim.querySelector('[data-cdr-text]').value.trim(); } catch (e) {}
    var uid = null;
    try { uid = firebase.auth().currentUser.uid; } catch (e) {}
    if (!uid) { close(); return; }
    var name = await displayName(uid);
    try {
      await window.db.collection('reviews').doc(uid).set({
        uid: uid,
        displayName: name,
        rating: stars,
        text: text,
        context: submit._ctx || 'general',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      // Offline or rules not published yet — count it as asked, don't nag.
      close();
      return;
    }
    s.submitted = true;
    saveState(s);
    close();
    try { if (window.CDHaptics) window.CDHaptics.success(); } catch (e) {}
    if (window.cdToast) window.cdToast('Thanks — that keeps the signal alive.');
    else if (window.showToast) window.showToast('Thanks — that keeps the signal alive.');
  }

  function maybePrompt(context) {
    if (!eligible()) return;
    submit._ctx = context || 'general';
    setTimeout(function () {
      if (document.hidden) return;
      open();
    }, WIN_DELAY);
  }

  window.CDReviews = { maybePrompt: maybePrompt };
})();
