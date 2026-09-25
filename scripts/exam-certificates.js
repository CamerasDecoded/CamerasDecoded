/* ================================================================
   CDCerts — final-exam certificates with optional live selfie (v1)
   ----------------------------------------------------------------
   A pass on the final exam unlocks a certificate claim. The learner
   enters the name for the record and may attach a LIVE front-camera
   photo — camera capture only, no file picker, no gallery. Skipping
   is always allowed and never blocks the claim.

   Data model
   - examCertificates/{uid}_{trackId}   (one record per learner/track)
       { uid, email, trackId, examTitle, examVersion, attemptId,
         name, score, total, pct,
         selfiePath, selfieUrl,               (null when skipped)
         certificateCode, status,              ('issued'|'verified'|'revoked')
         createdAt, verifiedAt, verifiedBy }
     Separate from finalExamAttempts — the attempt ledger never changes.
   - Storage: examCertificates/{uid}/selfie.jpg
       Canvas-encoded JPEG from the live stream. The camera is stopped
       after capture, skip, exit, and page lifecycle changes.

   Hosted inside the Field Manual (renders into #fm-lesson-body via
   the host context, same shape as CDFinalExams.init). Verified in the
   admin dashboard's Certificates panel.
   ================================================================ */
window.CDCerts = (function () {
  'use strict';

  var TRACK = 'camera-confidence';
  var EXAM_TITLE = 'The Camera Confidence Guide';
  var SELFIE_SIZE = 768;

  var C = null;   /* host context (set by init) */
  var S = null;   /* active claim session */

  function init(ctx) { C = ctx; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function db() {
    return (typeof window.db !== 'undefined' && window.db) ? window.db : null;
  }

  function user() {
    if (C && C.getUser) { var u = C.getUser(); if (u) return u; }
    return (typeof window.auth !== 'undefined' && window.auth) ? window.auth.currentUser : null;
  }

  function hasStorage() {
    return (typeof firebase !== 'undefined') && !!firebase.storage;
  }

  function serverTs() {
    try {
      return firebase.firestore.FieldValue.serverTimestamp();
    } catch (e) { return new Date(); }
  }

  function certDocId(uid, trackId) { return uid + '_' + (trackId || TRACK); }

  function makeCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = '';
    for (var i = 0; i < 6; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return 'CD-' + out;
  }

  function fmtDate(ts) {
    try {
      var d = ts && ts.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts));
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return ''; }
  }

  function toast(msg, type) { if (C && C.toast) C.toast(msg, type); }

  function shell(inner) { return '<div class="fx-wrap rise-in">' + inner + '</div>'; }

  function show(html) {
    if (C && C.showView) C.showView('fm-lesson');
    if (C && C.setBody) C.setBody(shell(html));
    if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  }

  function wire(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', function () { if (C && C.tapFx) C.tapFx('continue'); fn(); });
  }

  function exit() { stopCamera(); if (C && C.onExit) C.onExit(); }

  /* ------------------------------ camera ------------------------------ */
  var stream = null;

  function stopCamera() {
    try {
      if (stream) stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
    } catch (e) {}
    stream = null;
    try {
      var v = document.getElementById('fx-cert-video');
      if (v) v.srcObject = null;
    } catch (e) {}
  }

  function pauseCamera(paused) {
    if (!stream) return;
    stream.getVideoTracks().forEach(function (t) { t.enabled = !paused; });
    var ov = document.getElementById('fx-cam-paused');
    if (ov) ov.hidden = !paused;
    var pb = document.getElementById('fx-cert-pause');
    if (pb) pb.querySelector('span').textContent = paused ? 'Resume camera' : 'Pause camera';
    S.camPaused = paused;
  }

  /* If the page hides mid-capture, release the camera and drop the
     photo step back to its idle prompt — no dead video on return. */
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden || !S || S.step !== 'photo') return;
      var wasLive = !!stream;
      stopCamera();
      if (wasLive) { S.stage = 'idle'; renderPhoto(); }
    });
    window.addEventListener('pagehide', stopCamera);
  }

  function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      S.stage = 'denied';
      S.deniedMsg = 'This browser can\u2019t reach the camera here. Skip the photo — the certificate stands without it.';
      renderPhoto();
      return;
    }
    S.stage = 'starting';
    renderPhoto();
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 1280 } },
      audio: false
    }).then(function (s) {
      if (!S || S.step !== 'photo') { /* user moved on while permission was pending */
        s.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
        return;
      }
      stream = s;
      S.camPaused = false;
      S.stage = 'live';
      renderPhoto();
      var v = document.getElementById('fx-cert-video');
      if (v) {
        v.muted = true;
        v.srcObject = s;
        var pr = v.play();
        if (pr && pr.catch) pr.catch(function () {});
      }
    }).catch(function () {
      stopCamera();
      S.stage = 'denied';
      S.deniedMsg = 'Camera access was blocked. Skip the photo — the certificate stands without it.';
      renderPhoto();
    });
  }

  function capturePhoto() {
    var v = document.getElementById('fx-cert-video');
    if (!v || !v.videoWidth) { toast('Camera isn\u2019t ready yet — one more second.', 'error'); return; }
    var cw = document.createElement('canvas');
    cw.width = SELFIE_SIZE; cw.height = SELFIE_SIZE;
    var cx = cw.getContext('2d');
    var vw = v.videoWidth, vh = v.videoHeight;
    var side = Math.min(vw, vh);
    cx.drawImage(v, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, SELFIE_SIZE, SELFIE_SIZE);
    stopCamera();
    var done = function (blob) {
      if (!blob) { toast('Capture failed — try again.', 'error'); S.stage = 'idle'; renderPhoto(); return; }
      if (S.photoUrl) { try { URL.revokeObjectURL(S.photoUrl); } catch (e) {} }
      S.photoBlob = blob;
      S.photoUrl = URL.createObjectURL(blob);
      S.stage = 'captured';
      renderPhoto();
    };
    if (cw.toBlob) cw.toBlob(function (b) { done(b); }, 'image/jpeg', 0.85);
    else done(null);
  }

  /* ------------------------------ screens ------------------------------ */

  function kickerRow(step) {
    return '<p class="fm-kicker">Field certification' + (step ? ' · ' + step : '') + '</p>';
  }

  function backRow() {
    return '<p style="text-align:center;margin:18px 0 0">'
      + '<button class="fm-quiet" id="fx-cert-back" style="background:none;border:0;cursor:pointer">Back to the Manual</button></p>';
  }

  function renderName(prefill) {
    var p = S.pass;
    show(
      kickerRow('step 1 of 3')
      + '<h1 class="fm-title" style="font-size:26px"><span class="fm-shimmer">Seal the signal</span></h1>'
      + '<p class="fm-sub">' + esc(p.examTitle || EXAM_TITLE) + ' — cleared ' + p.score + '/' + p.total + ' · ' + p.pct + '%</p>'
      + '<div class="fx-card fx-weave">'
      + '<div class="fx-field"><label for="fx-cert-name">Your name on the record</label>'
      + '<input id="fx-cert-name" type="text" maxlength="60" autocomplete="name" placeholder="Your full name" value="' + esc(prefill || '') + '"></div>'
      + '<p class="fm-sub" style="margin:10px 0 0">Printed exactly as entered. This is the name on your certificate.</p>'
      + '<button class="fx-chase fx-chase-static" id="fx-cert-name-go"><span>Continue</span></button>'
      + '</div>'
      + backRow()
    );
    wire('fx-cert-back', exit);
    wire('fx-cert-name-go', function () {
      var inp = document.getElementById('fx-cert-name');
      var name = inp ? inp.value.trim() : '';
      if (name.length < 2) { toast('Enter the name for your certificate.', 'error'); if (inp) inp.focus(); return; }
      S.name = name;
      S.step = 'photo';
      S.stage = 'idle';
      renderPhoto();
    });
    var inp0 = document.getElementById('fx-cert-name');
    if (inp0) inp0.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var g = document.getElementById('fx-cert-name-go'); if (g) g.click(); }
    });
  }

  function stageHtml() {
    if (S.stage === 'captured' && S.photoUrl) {
      return '<img class="fx-shot" src="' + S.photoUrl + '" alt="Your certificate photo">';
    }
    if (S.stage === 'live' || S.stage === 'starting') {
      return '<div class="fx-cam"><video id="fx-cert-video" class="fx-cam-video" playsinline muted autoplay></video>'
        + '<div class="fx-cam-paused" id="fx-cam-paused" hidden><span>Camera paused</span></div></div>';
    }
    var msg = S.stage === 'denied'
      ? '<p class="fm-sub" style="margin:0">' + esc(S.deniedMsg || 'Camera unavailable.') + '</p>'
      : S.stage === 'starting'
        ? '<p class="fm-sub" style="margin:0">Starting camera…</p>'
        : '<p class="fm-sub" style="margin:0 0 4px">A live photo from your camera — never your gallery.</p>'
          + '<p class="fm-sub" style="margin:0;color:var(--faint);font-size:12px">Square crop · stored privately · shown on your certificate only.</p>';
    return '<div class="fx-cam-idle">' + msg + '</div>';
  }

  function actionsHtml() {
    var a = '';
    if (S.stage === 'idle') {
      a = '<button class="fx-chase fx-chase-static" id="fx-cert-cam-on"><span>Turn on camera</span></button>'
        + '<button class="fm-quiet" id="fx-cert-skip" style="background:none;border:0;width:100%;cursor:pointer;margin-top:10px">Skip photo — issue without it</button>';
    } else if (S.stage === 'starting') {
      a = '<button class="fm-quiet" id="fx-cert-skip" style="background:none;border:0;width:100%;cursor:pointer">Skip photo — issue without it</button>';
    } else if (S.stage === 'live') {
      a = '<button class="fx-chase fx-chase-static" id="fx-cert-shoot"><span>Capture</span></button>'
        + '<button class="fm-quiet" id="fx-cert-pause" style="background:none;border:0;width:100%;cursor:pointer;margin-top:10px"><span>Pause camera</span></button>'
        + '<button class="fm-quiet" id="fx-cert-skip" style="background:none;border:0;width:100%;cursor:pointer;margin-top:10px">Skip photo — issue without it</button>';
    } else if (S.stage === 'denied') {
      a = '<button class="fx-chase fx-chase-static" id="fx-cert-cam-on"><span>Try again</span></button>'
        + '<button class="fm-quiet" id="fx-cert-skip" style="background:none;border:0;width:100%;cursor:pointer;margin-top:10px">Skip photo — issue without it</button>';
    } else if (S.stage === 'captured') {
      a = '<button class="fx-chase fx-chase-static" id="fx-cert-use"><span>Use this photo</span></button>'
        + '<button class="fm-quiet" id="fx-cert-retake" style="background:none;border:0;width:100%;cursor:pointer;margin-top:10px">Retake</button>';
    }
    return '<div class="fx-actions">' + a + '</div>';
  }

  function renderPhoto() {
    show(
      kickerRow('step 2 of 3')
      + '<h1 class="fm-title" style="font-size:26px">Put a face to the name</h1>'
      + '<p class="fm-sub">Optional. The photo prints on your certificate — or skip it entirely.</p>'
      + '<div id="fx-cert-stage" style="margin:0 0 14px">' + stageHtml() + '</div>'
      + actionsHtml()
      + backRow()
    );
    wire('fx-cert-back', exit);
    wire('fx-cert-cam-on', startCamera);
    wire('fx-cert-shoot', capturePhoto);
    wire('fx-cert-pause', function () { pauseCamera(!S.camPaused); });
    wire('fx-cert-retake', function () {
      if (S.photoUrl) { try { URL.revokeObjectURL(S.photoUrl); } catch (e) {} }
      S.photoBlob = null; S.photoUrl = null;
      startCamera();
    });
    wire('fx-cert-skip', function () {
      stopCamera();
      if (S.photoUrl) { try { URL.revokeObjectURL(S.photoUrl); } catch (e) {} }
      S.photoBlob = null; S.photoUrl = null;
      S.step = 'review';
      renderReview();
    });
    wire('fx-cert-use', function () { S.step = 'review'; renderReview(); });
  }

  function certCard(doc) {
    var photo = doc.selfieUrl
      ? '<img class="fx-cert-photo" src="' + esc(doc.selfieUrl) + '" alt="Certificate photo">'
      : '';
    return '<div class="fx-cert fx-weave">'
      + '<p class="fm-kicker">Cameras Decoded · field certification</p>'
      + '<p class="fx-cert-title"><span class="fm-shimmer">Certificate of Mastery</span></p>'
      + photo
      + '<p class="fx-cert-name">' + esc(doc.name) + '</p>'
      + '<p class="fm-sub" style="margin:8px 0 0">cleared the ' + esc(doc.examTitle || EXAM_TITLE) + ' final exam</p>'
      + '<p class="fx-q" style="text-align:center;margin-top:6px">' + doc.score + '<span style="color:var(--faint)">/' + doc.total + '</span>'
      + ' <span style="font-size:13px;color:var(--faint)">· ' + doc.pct + '%</span></p>'
      + '<p class="fx-cert-code">' + esc(doc.certificateCode || '') + ' · ' + esc(fmtDate(doc.createdAt)) + '</p>'
      + '</div>';
  }

  function renderReview() {
    var doc = {
      name: S.name,
      examTitle: S.pass.examTitle || EXAM_TITLE,
      score: S.pass.score, total: S.pass.total, pct: S.pass.pct,
      selfieUrl: S.photoUrl, certificateCode: 'CD-······', createdAt: new Date()
    };
    show(
      kickerRow('step 3 of 3')
      + '<h1 class="fm-title" style="font-size:26px">One look before it\u2019s sealed</h1>'
      + '<p class="fm-sub">' + (S.photoBlob ? 'Photo attached.' : 'No photo — name and score only.') + ' Issuing writes the record; it can\u2019t be edited after.</p>'
      + certCard(doc)
      + '<button class="fx-chase fx-chase-static" id="fx-cert-issue"><span>Issue certificate</span></button>'
      + '<p style="text-align:center;margin:12px 0 0">'
      + '<button class="fm-quiet" id="fx-cert-change-photo" style="background:none;border:0;cursor:pointer">' + (S.photoBlob ? 'Change photo' : 'Add a photo') + '</button>'
      + '<span class="fm-dot" aria-hidden="true"> · </span>'
      + '<button class="fm-quiet" id="fx-cert-change-name" style="background:none;border:0;cursor:pointer">Edit name</button>'
      + '</p>'
      + backRow()
    );
    wire('fx-cert-back', exit);
    wire('fx-cert-change-photo', function () { S.step = 'photo'; S.stage = 'idle'; renderPhoto(); });
    wire('fx-cert-change-name', function () { S.step = 'name'; renderName(S.name); });
    wire('fx-cert-issue', issueCertificate);
  }

  async function uploadSelfie(uid, blob) {
    if (!hasStorage()) throw new Error('Photo storage isn\u2019t available on this page.');
    var path = 'examCertificates/' + uid + '/selfie.jpg';
    var ref = firebase.storage().ref(path);
    await ref.put(blob, { contentType: 'image/jpeg' });
    var url = await ref.getDownloadURL();
    return { path: path, url: url };
  }

  async function issueCertificate() {
    var btn = document.getElementById('fx-cert-issue');
    if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'Issuing…'; }
    var u = user(), d = db();
    if (!u || !d) {
      toast('Sign in to issue your certificate.', 'error');
      if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Issue certificate'; }
      return;
    }
    try {
      var selfie = null;
      if (S.photoBlob) selfie = await uploadSelfie(u.uid, S.photoBlob);
      var doc = {
        uid: u.uid,
        email: u.email || null,
        trackId: S.pass.trackId || TRACK,
        examTitle: S.pass.examTitle || EXAM_TITLE,
        examVersion: S.pass.examVersion || '1',
        attemptId: S.pass.attemptId || null,
        name: S.name,
        score: S.pass.score, total: S.pass.total, pct: S.pass.pct,
        selfiePath: selfie ? selfie.path : null,
        selfieUrl: selfie ? selfie.url : null,
        certificateCode: makeCode(),
        status: 'issued',
        createdAt: serverTs(),
        verifiedAt: null,
        verifiedBy: null
      };
      await d.collection('examCertificates').doc(certDocId(u.uid, doc.trackId)).set(doc);
      stopCamera();
      if (S.photoUrl) { try { URL.revokeObjectURL(S.photoUrl); } catch (e) {} }
      S.photoBlob = null; S.photoUrl = null;
      S.step = 'done';
      if (C.confetti) C.confetti();
      if (C.sting) C.sting(); else if (C.sfx) C.sfx('success');
      show(
        kickerRow()
        + '<h1 class="fm-title" style="font-size:26px"><span class="fm-shimmer">On the record</span></h1>'
        + '<p class="fm-sub">Certificate ' + esc(doc.certificateCode) + ' is issued. The owner verifies each certificate by hand.</p>'
        + certCard(doc)
        + '<p style="text-align:center"><span class="fx-pill">Pending verification</span></p>'
        + '<button class="fx-chase fx-chase-static" id="fx-cert-done"><span>Back to the Manual</span></button>'
      );
      wire('fx-cert-done', exit);
    } catch (e) {
      toast((e && e.message) || 'Issuing failed — try again.', 'error');
      if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Issue certificate'; }
    }
  }

  function renderView(doc) {
    var pill;
    if (doc.status === 'verified') pill = '<span class="fx-pill ok">Verified</span>';
    else if (doc.status === 'revoked') pill = '<span class="fx-pill bad">Revoked</span>';
    else pill = '<span class="fx-pill">Pending verification</span>';
    show(
      kickerRow()
      + '<h1 class="fm-title" style="font-size:26px">Your certificate</h1>'
      + '<p class="fm-sub">Issued ' + esc(fmtDate(doc.createdAt)) + ' · ' + esc(doc.certificateCode || '') + '</p>'
      + certCard(doc)
      + '<p style="text-align:center">' + pill + '</p>'
      + '<button class="fx-chase fx-chase-static" id="fx-cert-done"><span>Back to the Manual</span></button>'
    );
    wire('fx-cert-done', exit);
  }

  /* ------------------------------ entry ------------------------------ */

  function startClaim(pass) {
    S = { pass: pass, name: '', step: 'name', stage: 'idle', camPaused: false, photoBlob: null, photoUrl: null, deniedMsg: '' };
    var u = user();
    var guess = (u && u.displayName) || '';
    renderName(guess);
    /* prefill from the operator profile when the auth name is blank */
    var d = db();
    if (d && u && !guess) {
      d.collection('users').doc(u.uid).get().then(function (snap) {
        if (!S || S.step !== 'name') return;
        var data = snap.exists ? snap.data() : null;
        var p = data && data.profile;
        var n = (p && (p.displayName || p.name)) || '';
        if (n) {
          var inp = document.getElementById('fx-cert-name');
          if (inp && !inp.value) inp.value = n;
        }
      }).catch(function () {});
    }
  }

  async function open(passInfo) {
    var u = user();
    if (!u) { toast('Sign in to claim your certificate.', 'error'); return; }
    var trackId = (passInfo && passInfo.trackId) || TRACK;
    var d = db(), existing = null;
    if (d) {
      try {
        var snap = await d.collection('examCertificates').doc(certDocId(u.uid, trackId)).get();
        if (snap.exists) existing = snap.data() || null;
      } catch (e) { /* offline — fall through to claim; set() enforces the rules */ }
    }
    if (existing && existing.status && existing.status !== 'revoked') { renderView(existing); return; }
    startClaim(passInfo || { trackId: trackId, examTitle: EXAM_TITLE, score: 0, total: 0, pct: 0 });
  }

  return { init: init, open: open };
})();
