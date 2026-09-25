/* ================================================================
   CDFinalExams — Field Manual final exams (v1)
   ----------------------------------------------------------------
   A longer final test at the end of every guide/track. Progressive
   difficulty (Foundations -> Core Craft -> Field Challenges), 25
   questions, 70% to pass. Scores live in their own ledger —
   separate from lesson XP — so instructors get per-student insight
   later without touching the XP economy.

   Data model
   - finalExamAttempts/{uid}/attempts/{autoId}  (immutable records)
       { trackId, examVersion, score, total, pct, passed,
         parts:{1:[got,of],2:[got,of],3:[got,of]},
         answers:[{qi,picked,pickedText,correct}], startedAt, submittedAt }
   - examCertificates/{uid}_{trackId}  (one per learner/track, written by
     CDCerts on claim — separate from the attempt ledger)
       { uid, email, trackId, examTitle, examVersion, attemptId,
         name, score, total, pct, selfiePath, selfieUrl,
         certificateCode, status, createdAt, verifiedAt, verifiedBy }
     Storage: examCertificates/{uid}/selfie.jpg (live camera capture only)
   - retakeRequests/{uid}
       { trackId, status:'pending'|'approved'|'declined',
         createdAt, decidedAt, grantedAt, usedAt }

   Gating: one free attempt per 7 days. Pro members retake any time.
   A $2.99 early retake (Stripe Payment Link -> /retake-success.html)
   files a retakeRequests doc; the owner approves it in the admin
   dashboard, same paper-trail pattern as Pro upgrades.

   The question bank ships inside the curriculum JSON as
   finalExams: { "<trackId>": { title, version, passPct, questions } }
   so it rides the private Firestore delivery pipeline — never the
   public repo.
   ================================================================ */
window.CDFinalExams = (function () {
  'use strict';

  var TRACK = 'camera-confidence';
  var PASS_PCT = 70;
  var GATE_MS = 7 * 24 * 60 * 60 * 1000;
  var RETAKE_USD = '2.99';

  var C = null;          /* host context (set by init) */
  var S = null;          /* active exam session state */

  function init(ctx) { C = ctx; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function db() {
    return (typeof window.db !== 'undefined' && window.db) ? window.db : null;
  }
  /* Host context first (field-manual.html); fall back to the global auth
     state so standalone pages (retake-success.html) work without init(). */
  function user() {
    if (C && C.getUser) { var u = C.getUser(); if (u) return u; }
    return (typeof window.auth !== 'undefined' && window.auth) ? window.auth.currentUser : null;
  }

  function exam() {
    var gd = window.GUIDE_DATA;
    return (gd && gd.finalExams && gd.finalExams[TRACK]) || null;
  }

  /* Every lesson of every chapter decoded = track complete. */
  function trackProgress() {
    var gd = window.GUIDE_DATA || { chapters: [] };
    var p = (C && C.getProgress) ? C.getProgress() : { completedLessons: [] };
    var doneList = p.completedLessons || [];
    var total = 0, done = 0;
    (gd.chapters || []).forEach(function (ch) {
      (ch.lessons || []).forEach(function (l) {
        total++;
        if (doneList.indexOf(l.id) !== -1) done++;
      });
    });
    return { total: total, done: done, complete: total > 0 && done === total };
  }

  function isProCached() { return !!(C && C.isPro && C.isPro()); }

  async function fetchAttempts(uid) {
    var d = db();
    if (!d || !uid) return [];
    try {
      var snap = await d.collection('finalExamAttempts').doc(uid)
        .collection('attempts')
        .where('trackId', '==', TRACK)
        .orderBy('submittedAt', 'desc')
        .get();
      var out = [];
      snap.forEach(function (doc) { out.push(doc.data() || {}); });
      return out;
    } catch (e) { return []; }
  }

  async function getRetakeRequest(uid) {
    var d = db();
    if (!d || !uid) return null;
    try {
      var snap = await d.collection('retakeRequests').doc(uid).get();
      return snap.exists ? snap.data() : null;
    } catch (e) { return null; }
  }

  /* The single gating decision. Everything the UI shows flows from this. */
  async function getStatus() {
    var u = user();
    var tp = trackProgress();
    var ex = exam();
    if (!u) return { state: 'signin', track: tp };
    if (!tp.complete) return { state: 'locked', track: tp };
    if (!ex || !ex.questions || !ex.questions.length) return { state: 'noexam', track: tp };

    var attempts = await fetchAttempts(u.uid);
    var last = attempts[0] || null;
    var best = null;
    attempts.forEach(function (a) {
      if (!best || (a.pct || 0) > (best.pct || 0)) best = a;
    });

    var base = { state: 'ready', track: tp, exam: ex, attempts: attempts,
                 last: last, best: best, pro: isProCached() };
    if (base.pro) return base;
    if (!last || !last.submittedAt) return base;

    var lastMs = last.submittedAt.toMillis
      ? last.submittedAt.toMillis()
      : new Date(last.submittedAt).getTime();
    if (Date.now() - lastMs >= GATE_MS) return base;

    /* Inside the cooldown window: an unused approved grant still opens the door. */
    var req = await getRetakeRequest(u.uid);
    var grantedMs = req && req.grantedAt
      ? (req.grantedAt.toMillis ? req.grantedAt.toMillis() : new Date(req.grantedAt).getTime())
      : 0;
    if (req && req.status === 'approved' && !req.usedAt && grantedMs > lastMs) {
      base.grant = true;
      return base;
    }
    base.state = 'cooldown';
    base.cooldownUntil = lastMs + GATE_MS;
    base.retakeRequest = req;
    return base;
  }

  function fmtCountdown(ms) {
    if (ms <= 0) return 'now';
    var s = Math.floor(ms / 1000);
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600); s -= h * 3600;
    var m = Math.floor(s / 60);
    if (d > 0) return d + 'd ' + h + 'h';
    if (h > 0) return h + 'h ' + m + 'm';
    return m + 'm';
  }

  /* Attempt timestamps arrive as Firestore Timestamps (or plain Dates for
     same-session records). Rendered once, in the learner's locale. */
  function fmtDate(ts) {
    var d = null;
    try {
      if (ts && typeof ts.toDate === 'function') d = ts.toDate();
      else if (ts) d = new Date(ts);
    } catch (e) { d = null; }
    if (!d || isNaN(d.getTime())) return '';
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var hr = d.getHours(), ap = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12 || 12;
    var min = d.getMinutes();
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear()
      + ' · ' + hr + ':' + (min < 10 ? '0' + min : min) + ' ' + ap;
  }

  /* ------------------------------ views ------------------------------ */

  function shell(inner) {
    return '<div class="fx-wrap rise-in">' + inner + '</div>';
  }

  function metaRow(k, v) {
    return '<div class="fx-meta"><span>' + esc(k) + '</span><b>' + esc(v) + '</b></div>';
  }

  function renderIntro(st) {
    var ex = st.exam, tp = st.track;
    var h = '';
    h += '<p class="fm-kicker">Final exam</p>';
    h += '<h1 class="fm-title" style="font-size:26px">' + esc(ex.title) + '</h1>';
    h += '<p class="fm-sub">' + esc(ex.tagline || 'Twenty-five questions. Three parts. Prove the signal is yours.') + '</p>';

    h += '<div class="fx-card fx-weave">'
      + metaRow('Questions', ex.questions.length + ' · progressive')
      + metaRow('Parts', 'Foundations → Core Craft → Field Challenges')
      + metaRow('To pass', (ex.passPct || PASS_PCT) + '%')
      + metaRow('Retakes', st.pro ? 'Unlimited · Pro' : 'One free attempt per week')
      + '</div>';

    if (st.best) {
      h += '<div class="fx-card" style="text-align:center">'
        + '<p class="fm-kicker" style="margin-bottom:6px">Your best</p>'
        + '<p class="fx-bigscore">' + st.best.score + '<span>/' + st.best.total + '</span></p>'
        + '<p class="fm-sub" style="margin:4px 0 0">' + (st.best.passed ? 'Cleared' : 'Not yet cleared')
        + ' · ' + Math.round(st.best.pct) + '%</p></div>';
    }

    /* Every attempt is kept in the ledger — tap one to reopen its full
       review: score, per-part splits, and every miss with its reveal. */
    if (st.attempts && st.attempts.length) {
      h += '<p class="fm-kicker" style="margin-top:22px">Past attempts</p>';
      h += '<div class="fx-alist">' + st.attempts.map(function (a, i) {
        return '<button class="fx-arow" data-ai="' + i + '">'
          + '<span class="fx-arow-score">' + a.score + '<b>/' + a.total + '</b></span>'
          + '<span class="fx-arow-meta"><b class="' + (a.passed ? 'pass' : '') + '">'
          + Math.round(a.pct || 0) + '% · ' + (a.passed ? 'Cleared' : 'Not cleared') + '</b>'
          + '<span>' + esc(fmtDate(a.submittedAt)) + '</span></span>'
          + '<span class="fx-chev">›</span></button>';
      }).join('') + '</div>';
    }

    if (st.state === 'cooldown') {
      h += '<div class="fx-card fx-weave"><p class="fm-kicker">Next free attempt</p>'
        + '<p class="fx-bigscore" style="font-size:24px">' + fmtCountdown(st.cooldownUntil - Date.now()) + '</p>'
        + '<p class="fm-sub">Free retakes open one week after your last attempt. Want back in now?</p>'
        + '<button class="fx-chase fx-chase-static" id="fx-retake-buy"><span>Retake early — $' + RETAKE_USD + '</span></button>'
        + (st.retakeRequest && st.retakeRequest.status === 'pending'
            ? '<p class="fx-note">Request received — your retake unlocks after verification.</p>'
            : '<p class="fx-note">Pro members retake any time, free.</p>')
        + '</div>';
    } else {
      h += '<button class="fx-chase" id="fx-begin"><span>' + (st.attempts.length ? 'Retake the exam' : 'Begin final exam') + '</span></button>';
      if (!st.pro && st.attempts.length) {
        h += '<button class="fm-quiet" id="fx-retake-buy" style="background:none;border:0;width:100%;cursor:pointer">or retake early — $' + RETAKE_USD + '</button>';
      }
    }
    h += '<button class="fm-quiet" id="fx-back" style="background:none;border:0;width:100%;cursor:pointer">Back to the Manual</button>';

    C.setBody(shell(h));
    C.setDots('');
    document.title = 'Final Exam — Field Manual';
    wire('fx-begin', beginExam.bind(null, st));
    wire('fx-back', C.onExit);
    wire('fx-retake-buy', buyRetake);
    Array.prototype.forEach.call(document.querySelectorAll('.fx-arow'), function (el) {
      el.addEventListener('click', function () {
        if (C.tapFx) C.tapFx('continue');
        var i = parseInt(el.getAttribute('data-ai'), 10);
        if (st.attempts[i]) renderAttemptDetail(st.attempts[i], st);
      });
    });
  }

  function wire(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', function () { if (C.tapFx) C.tapFx('continue'); fn(); });
  }

  function partName(p) {
    return p === 1 ? 'Part 1 — Foundations' : p === 2 ? 'Part 2 — Core Craft' : 'Part 3 — Field Challenges';
  }

  /* Shuffle answer choices at session start (Fisher-Yates) so the correct
     answer isn't always in the same slot. Each question is copied and its
     `answer` index is remapped to the shuffled position — scoring, review,
     and explanations all keep working unchanged. Question order is kept:
     the exam is deliberately progressive (Foundations -> Core Craft ->
     Field Challenges). */
  function shuffleChoices(qs) {
    return (qs || []).map(function (q) {
      var nq = {}, k;
      for (k in q) if (Object.prototype.hasOwnProperty.call(q, k)) nq[k] = q[k];
      var choices = q.choices || [], n = choices.length, ans = q.answer;
      if (n < 2 || typeof ans !== 'number' || ans < 0 || ans >= n) {
        nq.choices = choices.slice();
        return nq;
      }
      var order = [], i, j, t;
      for (i = 0; i < n; i++) order.push(i);
      for (i = n - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        t = order[i]; order[i] = order[j]; order[j] = t;
      }
      nq.choices = order.map(function (oi) { return choices[oi]; });
      nq.answer = order.indexOf(ans);
      return nq;
    });
  }

  function beginExam(st) {
    var exam = {}, k;
    for (k in st.exam) if (Object.prototype.hasOwnProperty.call(st.exam, k)) exam[k] = st.exam[k];
    exam.questions = shuffleChoices(st.exam.questions);
    S = { exam: exam, status: st, qi: 0, picks: new Array(exam.questions.length).fill(null),
          startedAt: new Date() };
    renderQuestion();
  }

  function renderQuestion() {
    var qs = S.exam.questions, i = S.qi, q = qs[i];
    var total = qs.length;
    var answered = S.picks.filter(function (p) { return p !== null; }).length;

    var h = '';
    h += '<div class="fx-topbar"><span class="fm-kicker" style="margin:0">Question ' + (i + 1) + ' of ' + total + '</span>'
      + '<span class="fx-part">' + esc(partName(q.part)) + '</span></div>';
    h += '<div class="fm-bar" style="margin:8px 0 16px"><i style="width:' + Math.round(i / total * 100) + '%"></i></div>';
    h += '<div class="fx-card fx-weave"><p class="fx-q">' + esc(q.q) + '</p></div>';
    h += '<div class="fx-choices">' + q.choices.map(function (c, ci) {
      var sel = S.picks[i] === ci ? ' sel' : '';
      return '<button class="fx-choice' + sel + '" data-ci="' + ci + '">'
        + '<span class="fx-letter">' + 'ABCD'[ci] + '</span>'
        + '<span class="fx-ctext">' + esc(c) + '</span></button>';
    }).join('') + '</div>';

    var isLast = i === total - 1;
    h += '<div class="fx-nav">'
      + (i > 0 ? '<button class="fm-quiet" id="fx-prev" style="background:none;border:0;cursor:pointer;margin:0">← Back</button>' : '<span></span>')
      + '<button class="fx-chase fx-chase-static fx-inline" id="fx-next"><span>' + (isLast ? 'Review answers' : (S.picks[i] === null ? 'Skip' : 'Next')) + '</span></button>'
      + '</div>';
    h += '<p class="fx-note">' + answered + ' of ' + total + ' answered · you can change any answer before submitting</p>';

    C.setBody(shell(h));
    Array.prototype.forEach.call(document.querySelectorAll('.fx-choice'), function (el) {
      el.addEventListener('click', function () {
        S.picks[i] = parseInt(el.getAttribute('data-ci'), 10);
        if (C.sfx) C.sfx('tick');
        renderQuestion();
      });
    });
    wire('fx-prev', function () { S.qi--; renderQuestion(); });
    wire('fx-next', function () { if (isLast) renderReview(); else { S.qi++; renderQuestion(); } });
  }

  function renderReview() {
    var qs = S.exam.questions;
    var h = '<p class="fm-kicker">Review</p>'
      + '<h1 class="fm-title" style="font-size:24px">Ready to submit?</h1>'
      + '<p class="fm-sub">Unanswered questions count as misses. This is your moment — make it count.</p>';
    h += '<div class="fx-review">' + qs.map(function (q, i) {
      var ok = S.picks[i] !== null;
      return '<button class="fx-rrow' + (ok ? ' done' : '') + '" data-qi="' + i + '">'
        + '<span class="fx-rnum">' + (i + 1) + '</span>'
        + '<span class="fx-rtext">' + esc(q.q.length > 64 ? q.q.slice(0, 64) + '…' : q.q) + '</span>'
        + '<span class="fx-rstate">' + (ok ? '✓' : '○') + '</span></button>';
    }).join('') + '</div>';
    h += '<button class="fx-chase" id="fx-submit"><span>Submit exam</span></button>';
    h += '<button class="fm-quiet" id="fx-backq" style="background:none;border:0;width:100%;cursor:pointer">Back to questions</button>';
    C.setBody(shell(h));
    Array.prototype.forEach.call(document.querySelectorAll('.fx-rrow'), function (el) {
      el.addEventListener('click', function () {
        S.qi = parseInt(el.getAttribute('data-qi'), 10);
        renderQuestion();
      });
    });
    wire('fx-backq', function () { renderQuestion(); });
    /* two-tap confirm: submitting is final */
    var btn = document.getElementById('fx-submit');
    var armed = false, timer = null;
    btn.addEventListener('click', function () {
      if (C.tapFx) C.tapFx('continue');
      if (!armed) {
        armed = true;
        btn.querySelector('span').textContent = 'Tap again — this is final';
        btn.classList.add('armed');
        timer = setTimeout(function () {
          armed = false;
          btn.querySelector('span').textContent = 'Submit exam';
          btn.classList.remove('armed');
        }, 4000);
        return;
      }
      clearTimeout(timer);
      submitExam();
    });
  }

  async function submitExam() {
    var qs = S.exam.questions;
    var score = 0, parts = { 1: [0, 0], 2: [0, 0], 3: [0, 0] };
    var answers = qs.map(function (q, i) {
      var picked = S.picks[i], correct = picked === q.answer;
      if (correct) score++;
      parts[q.part][1]++;
      if (correct) parts[q.part][0]++;
      return { qi: i, picked: picked, pickedText: picked === null ? null : q.choices[picked], correct: correct };
    });
    var total = qs.length;
    var pct = Math.round(score / total * 100);
    var passPct = S.exam.passPct || PASS_PCT;
    var passed = pct >= passPct;

    var rec = {
      trackId: TRACK,
      examVersion: S.exam.version || '1',
      score: score, total: total, pct: pct, passed: passed,
      parts: parts, answers: answers,
      startedAt: S.startedAt, submittedAt: new Date()
    };
    var u = user(), d = db();
    if (u && d) {
      try {
        var aref = await d.collection('finalExamAttempts').doc(u.uid)
          .collection('attempts').add(rec);
        rec.attemptId = aref.id; /* kept so the certificate can cite the exact passing attempt */
        /* consume an approved early-retake grant, if one opened this attempt */
        if (S.status.grant) {
          await d.collection('retakeRequests').doc(u.uid)
            .set({ usedAt: new Date() }, { merge: true });
        }
      } catch (e) { /* local results still render; the ledger write is best-effort */ }
    }
    renderResults(rec, qs);
    if (passed) {
      if (C.confetti) C.confetti();
      if (C.sting) C.sting();
    } else if (C.sfx) C.sfx('wrong');
  }

  function renderResults(rec, qs) {
    var h = '';
    h += '<p class="fm-kicker">Final exam · results</p>';
    h += '<h1 class="fm-title" style="font-size:26px">'
      + (rec.passed ? '<span class="fm-shimmer">Exam cleared</span>' : 'Not yet cleared')
      + '</h1>';
    h += '<p class="fm-sub">' + esc(S.exam.title) + '</p>';

    h += '<div class="fx-score-ring' + (rec.passed ? ' pass' : '') + '">'
      + '<div class="fx-score-num">' + rec.score + '<span>/' + rec.total + '</span></div>'
      + '<div class="fx-score-pct">' + rec.pct + '% · pass at ' + (S.exam.passPct || PASS_PCT) + '%</div>'
      + '</div>';

    /* passing unlocks the certificate claim — sealed in CDCerts, separate ledger */
    if (rec.passed) {
      h += '<div class="fx-card fx-weave">'
        + '<p class="fm-kicker">Field certification</p>'
        + '<p class="fm-sub" style="margin:0 0 4px">Seal it with a certificate — your name, your score, on the record.</p>'
        + '<button class="fx-chase fx-chase-static" id="fx-cert-open"><span>Claim certificate</span></button>'
        + '</div>';
    }

    h += '<div class="fx-card fx-weave">'
      + [1, 2, 3].map(function (p) {
          var got = rec.parts[p][0], of = rec.parts[p][1];
          var wpct = of ? Math.round(got / of * 100) : 0;
          return '<div class="fx-prow"><span>' + esc(partName(p)) + '</span>'
            + '<div class="fm-bar" style="margin:6px 0"><i style="width:' + wpct + '%"></i></div>'
            + '<b>' + got + '/' + of + '</b></div>';
        }).join('')
      + '</div>';

    var missed = qs.filter(function (q, i) { return !rec.answers[i].correct; });
    if (missed.length) {
      h += '<p class="fm-kicker" style="margin-top:20px">Review the misses — this is where the learning lives</p>';
      h += missed.map(function (q) {
        var i = qs.indexOf(q);
        var picked = rec.answers[i].picked;
        return '<div class="fx-card fx-miss">'
          + '<p class="fx-q" style="font-size:15px">' + esc(q.q) + '</p>'
          + '<p class="fx-miss-line">Your answer: <b>' + (picked === null ? 'unanswered' : esc(q.choices[picked])) + '</b></p>'
          + '<p class="fx-miss-line ok">Correct: <b>' + esc(q.choices[q.answer]) + '</b></p>'
          + '<p class="fx-reveal"><b>The reveal — </b>' + esc(q.reveal) + '</p>'
          + '</div>';
      }).join('');
    } else {
      h += '<div class="fx-card" style="text-align:center"><p class="fm-shimmer" style="margin:0;font-family:var(--mono);letter-spacing:.1em">FLAWLESS — ' + rec.total + '/' + rec.total + '</p></div>';
    }

    h += '<div class="fx-card fx-weave"><p class="fm-kicker">Retakes</p>'
      + '<p class="fm-sub" style="margin:0 0 10px">Scores are kept separate from lesson XP. ' 
      + (isProCached() ? 'Pro members retake any time.' : 'One free retake per week — or jump the line for $' + RETAKE_USD + '.')
      + '</p>'
      + '<button class="fx-chase fx-chase-static" id="fx-again"><span>Back to the Manual</span></button>'
      + (!isProCached() ? '<button class="fm-quiet" id="fx-retake-buy2" style="background:none;border:0;width:100%;cursor:pointer">Retake early — $' + RETAKE_USD + '</button>' : '')
      + '</div>';

    C.setBody(shell(h));
    C.setDots('');
    document.title = (rec.passed ? 'Exam cleared' : 'Exam results') + ' — Field Manual';
    wire('fx-again', C.onExit);
    wire('fx-retake-buy2', buyRetake);
    wire('fx-cert-open', function () {
      if (!(window.CDCerts && window.CDCerts.open)) {
        if (C.toast) C.toast('Certificates are still wiring up — check back shortly.', 'error');
        return;
      }
      window.CDCerts.open({
        trackId: TRACK,
        examTitle: (S.exam && S.exam.title) || 'The Camera Confidence Guide',
        examVersion: (S.exam && S.exam.version) || '1',
        attemptId: rec.attemptId || null,
        score: rec.score, total: rec.total, pct: rec.pct
      });
    });
  }

  /* ------------------------------ attempt history ------------------------------ */

  /* Reopen a past attempt's full review. The ledger stores score, per-part
     splits, and every answer's picked text — but not the question copy.
     Question order is fixed (only choices shuffle), so the stored qi index
     maps straight back onto the current bank, and pickedText is
     shuffle-proof. If the bank version moved on since, show the summary
     without per-question review rather than a wrong one. */
  function renderAttemptDetail(rec, st) {
    var bank = (st.exam && st.exam.questions) || [];
    var bankVersion = String((st.exam && st.exam.version) || '1');
    var sameBank = String(rec.examVersion || '1') === bankVersion;
    var passPct = (st.exam && st.exam.passPct) || PASS_PCT;

    var h = '';
    h += '<p class="fm-kicker">Final exam · attempt</p>';
    h += '<h1 class="fm-title" style="font-size:24px">' + esc(fmtDate(rec.submittedAt) || 'Past attempt') + '</h1>';
    h += '<p class="fm-sub">' + esc(st.exam.title) + '</p>';

    h += '<div class="fx-score-ring' + (rec.passed ? ' pass' : '') + '">'
      + '<div class="fx-score-num">' + rec.score + '<span>/' + rec.total + '</span></div>'
      + '<div class="fx-score-pct">' + Math.round(rec.pct || 0) + '% · pass at ' + passPct + '%</div></div>';

    var parts = rec.parts || {};
    h += '<div class="fx-card fx-weave">' + [1, 2, 3].map(function (p) {
      var cell = parts[p] || parts[String(p)] || [0, 0];
      var got = cell[0] || 0, of = cell[1] || 0;
      var wpct = of ? Math.round(got / of * 100) : 0;
      return '<div class="fx-prow"><span>' + esc(partName(p)) + '</span>'
        + '<div class="fm-bar" style="margin:6px 0"><i style="width:' + wpct + '%"></i></div>'
        + '<b>' + got + '/' + of + '</b></div>';
    }).join('') + '</div>';

    var answers = rec.answers || [];
    var missed = answers.filter(function (a) { return !a.correct; });
    if (missed.length && sameBank) {
      h += '<p class="fm-kicker" style="margin-top:20px">Where this attempt slipped</p>';
      h += missed.map(function (a) {
        var q = bank[a.qi];
        if (!q) return '';
        var yourAns = (a.pickedText != null && a.pickedText !== '') ? a.pickedText : 'unanswered';
        var rightAns = (q.choices && typeof q.answer === 'number' && q.choices[q.answer] != null)
          ? q.choices[q.answer] : '';
        return '<div class="fx-card fx-miss">'
          + '<p class="fx-q" style="font-size:15px">' + esc(q.q) + '</p>'
          + '<p class="fx-miss-line">Your answer: <b>' + esc(yourAns) + '</b></p>'
          + '<p class="fx-miss-line ok">Correct: <b>' + esc(rightAns) + '</b></p>'
          + (q.reveal ? '<p class="fx-reveal"><b>The reveal — </b>' + esc(q.reveal) + '</p>' : '')
          + '</div>';
      }).join('');
    } else if (missed.length) {
      h += '<div class="fx-card" style="margin-top:20px"><p class="fm-sub" style="margin:0">'
        + 'This attempt ran on an earlier exam version — per-question review is not available for it.</p></div>';
    } else {
      h += '<div class="fx-card" style="text-align:center;margin-top:20px"><p class="fm-shimmer" style="margin:0;font-family:var(--mono);letter-spacing:.1em">FLAWLESS — '
        + rec.total + '/' + rec.total + '</p></div>';
    }

    h += '<button class="fm-quiet" id="fx-back-attempts" style="background:none;border:0;width:100%;cursor:pointer;margin-top:14px">← Past attempts</button>';

    C.setBody(shell(h));
    C.setDots('');
    document.title = 'Exam attempt — Field Manual';
    wire('fx-back-attempts', function () { renderIntro(st); });
  }

  /* ------------------------------ retakes ------------------------------ */

  async function getRetakeLink() {
    var d = db();
    if (!d) return null;
    try {
      var snap = await d.collection('config').doc('payments').get();
      var data = snap.exists ? snap.data() : {};
      return data.retake || null;
    } catch (e) { return null; }
  }

  async function buyRetake() {
    var link = await getRetakeLink();
    if (link) {
      try { localStorage.setItem('pending_exam_retake', TRACK); } catch (e) {}
      window.location.href = link;
    } else if (C.toast) {
      C.toast('Early retakes open soon — the weekly retake is free.');
    }
  }

  /* Called by /retake-success.html after the buyer returns from Stripe. */
  async function requestRetake() {
    var u = user(), d = db();
    if (!u || !d) throw new Error('Sign in required');
    var ref = d.collection('retakeRequests').doc(u.uid);
    var existing = null;
    try { existing = (await ref.get()).data() || null; } catch (e) {}
    if (existing && existing.status === 'approved' && !existing.usedAt) return existing;
    var payload = {
      uid: u.uid,
      email: u.email || null,
      trackId: TRACK,
      amountUsd: RETAKE_USD,
      status: 'pending',
      createdAt: (window.firebase && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
    };
    await ref.set(payload, { merge: true });
    return payload;
  }

  function watchRetakeRequest(cb) {
    var d = db(), u = user();
    if (!d || !u) { cb(null); return function () {}; }
    return d.collection('retakeRequests').doc(u.uid)
      .onSnapshot(function (snap) { cb(snap.exists ? snap.data() : null); },
                  function () { cb(null); });
  }

  /* ------------------------------ entry ------------------------------ */

  async function openExam() {
    if (!C) return;
    C.showView('fm-lesson');
    C.setBody(shell('<p class="fm-kicker">Final exam</p><p class="fm-sub">Checking your standing…</p>'));
    C.setDots('');
    document.title = 'Final Exam — Field Manual';
    var st = await getStatus();
    if (st.state === 'signin') {
      C.setBody(shell('<p class="fm-kicker">Final exam</p><h1 class="fm-title" style="font-size:24px">Sign in to take the exam</h1><p class="fm-sub">Exam scores are tied to your operator record.</p><button class="fx-chase fx-chase-static" id="fx-login"><span>Sign in</span></button>'));
      wire('fx-login', function () { window.location.href = '/login.html'; });
      return;
    }
    if (st.state === 'locked') {
      C.setBody(shell('<p class="fm-kicker">Final exam</p><h1 class="fm-title" style="font-size:24px">Decode every lesson first</h1><p class="fm-sub">' + st.track.done + ' of ' + st.track.total + ' lessons decoded. The exam opens when the full track is complete.</p><button class="fx-chase fx-chase-static" id="fx-back2"><span>Back to the Manual</span></button>'));
      wire('fx-back2', C.onExit);
      return;
    }
    if (st.state === 'noexam') {
      C.setBody(shell('<p class="fm-kicker">Final exam</p><h1 class="fm-title" style="font-size:24px">The exam is being prepared</h1><p class="fm-sub">Check back soon — your progress is safe.</p><button class="fx-chase fx-chase-static" id="fx-back3"><span>Back to the Manual</span></button>'));
      wire('fx-back3', C.onExit);
      return;
    }
    renderIntro(st);
  }

  return {
    TRACK: TRACK,
    PASS_PCT: PASS_PCT,
    GATE_DAYS: 7,
    RETAKE_USD: RETAKE_USD,
    init: init,
    exam: exam,
    trackProgress: trackProgress,
    getStatus: getStatus,
    openExam: openExam,
    requestRetake: requestRetake,
    watchRetakeRequest: watchRetakeRequest
  };
})();
