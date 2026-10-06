/* ================================================================
   CAMERAS DECODED — Site-Wide User Ledger (client library)
   Shared CDLedger.write(event) module for all surfaces.
   Spec: ~/workspace/your_files/ledger-arch/SITE_LEDGER_SPEC.md

   Topology: users/{uid}/ledger/{eventId} with tier field
   ("teaching" | "platform"). Tier splitting happens at emission:
   teaching-tier docs contain ONLY instructor-visible fields;
   platform-only fields go in a separate platform-tier doc.

   Trust model: client writes are observations, not authorities.
   XP, exam passes, and homework completion remain with their
   source systems. The ledger narrates; it never contradicts.

   Usage:
     <script src="/scripts/ledger.js"></script>
     CDLedger.write({
       type: 'arcade.session.scored',
       surface: 'arcade',
       xp: 25, xpBanked: true,
       summary: 'Scored 87 in Exposure Lab',
       skillTags: ['exposure'],
       detail: { slotId: 'exp-01', score: 87 }
     });
   ================================================================ */
(function () {
  'use strict';

  /* ---------- Type allowlist (spec Appendix B, canonical) ---------- */
  var TEACHING_TYPES = [
    'fm.lesson.completed', 'fm.quiz.attempted', 'fm.chapter.completed',
    'fm.exam.attempted', 'arcade.session.scored', 'arcade.shot.graded',
    'arena.entry.submitted', 'darkroom.lesson.completed',
    'darkroom.drill.completed', 'badge.earned', 'streak.milestone',
    'homework.assigned', 'homework.completed', 'user.enrolled'
  ];
  var PLATFORM_TYPES = [
    'fm.lesson.started', 'arcade.session.started', 'user.signup',
    'tier.changed', 'notification.interaction', 'ai.workbench.used',
    'referral.completed', 'arena.round.swept', 'device.registered',
    'system.xp.adjusted', 'arena.vote.cast'
  ];
  var ALL_TYPES = {};
  TEACHING_TYPES.forEach(function (t) { ALL_TYPES[t] = 'teaching'; });
  PLATFORM_TYPES.forEach(function (t) { ALL_TYPES[t] = 'platform'; });

  /* ---------- Skill vocabulary (spec Appendix A, controlled) ---------- */
  var SKILL_VOCAB = [
    'exposure', 'iso', 'shutter', 'aperture', 'white-balance',
    'focus', 'composition', 'lighting', 'gear', 'editing',
    'audio', 'video', 'business'
  ];

  var SURFACES = [
    'field-manual', 'arcade', 'arena', 'darkroom',
    'system', 'instructor', 'admin', 'ai-workbench'
  ];

  var SCHEMA_V = 1;
  var QUEUE_KEY = 'cdledger_queue';
  var MAX_QUEUE = 200;

  /* ---------- Helpers ---------- */
  function uuid() {
    // RFC4122 v4 UUID from crypto API, Math.random fallback
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      var b = new Uint8Array(16);
      crypto.getRandomValues(b);
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      var h = Array.prototype.map.call(b, function (x) {
        return ('0' + x.toString(16)).slice(-2);
      }).join('');
      return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) +
             '-' + h.slice(16, 20) + '-' + h.slice(20);
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3f | 0x80)).toString(16);
    });
  }

  function chicagoDay(d) {
    // YYYY-MM-DD in America/Chicago (platform TZ)
    try {
      var parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Chicago',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(d);
      var y, m, day;
      parts.forEach(function (p) {
        if (p.type === 'year') y = p.value;
        if (p.type === 'month') m = p.value;
        if (p.type === 'day') day = p.value;
      });
      return y + '-' + m + '-' + day;
    } catch (e) {
      return d.toISOString().slice(0, 10);
    }
  }

  function getDb() {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      if (window.db) return window.db;
      try { return firebase.firestore(); } catch (e) { return null; }
    }
    return null;
  }

  function getUid() {
    // Prefer the auth state; fall back to nothing (write fails loudly).
    if (window.auth && window.auth.currentUser) return window.auth.currentUser.uid;
    if (typeof firebase !== 'undefined' && firebase.auth) {
      try {
        var u = firebase.auth().currentUser;
        if (u) return u.uid;
      } catch (e) { /* fall through */ }
    }
    return null;
  }

  function getServerTimestamp() {
    if (typeof firebase !== 'undefined' && firebase.firestore &&
        firebase.firestore.FieldValue) {
      return firebase.firestore.FieldValue.serverTimestamp();
    }
    return null;
  }

  /* ---------- Offline queue (localStorage) ---------- */
  function loadQueue() {
    try {
      var raw = localStorage.getItem(QUEUE_KEY);
      var q = raw ? JSON.parse(raw) : [];
      return Array.isArray(q) ? q : [];
    } catch (e) { return []; }
  }
  function saveQueue(q) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE)));
    } catch (e) { /* storage full or blocked: drop silently, log loudly */ 
      if (typeof console !== 'undefined') console.warn('[CDLedger] queue persist failed', e);
    }
  }
  function enqueue(doc) {
    var q = loadQueue();
    q.push(doc);
    saveQueue(q);
  }

  /* ---------- Tier splitting ----------
     Teaching-tier docs contain ONLY instructor-visible fields.
     Platform-only fields are extracted into a separate platform-tier
     doc written alongside. Writers declare platform-only fields in
     opts.platformDetail; everything else in detail stays teaching. */
  var PLATFORM_ONLY_KEYS = ['device', 'costMicros', 'utm', 'ipHash', 'rawDialPositions'];

  function splitTiers(event, uid, eventId, now) {
    var tier = ALL_TYPES[event.type]; // 'teaching' | 'platform' (validated)
    var base = {
      uid: uid,
      tier: tier,
      type: event.type,
      surface: event.surface,
      ts: getServerTimestamp(),
      clientTs: now,
      day: chicagoDay(new Date(now)),
      xp: typeof event.xp === 'number' ? event.xp : 0,
      xpBanked: event.xpBanked === true,
      sessionId: event.sessionId || null,
      summary: String(event.summary || ''),
      skillTags: Array.isArray(event.skillTags)
        ? event.skillTags.filter(function (t) { return SKILL_VOCAB.indexOf(t) !== -1; })
        : [],
      homeworkIds: Array.isArray(event.homeworkIds) ? event.homeworkIds.slice() : [],
      schemaV: SCHEMA_V
    };

    var detail = (event.detail && typeof event.detail === 'object')
      ? JSON.parse(JSON.stringify(event.detail)) : {};

    // Extract platform-only keys into a separate doc if present.
    var platformDetail = {};
    var hasPlatformFields = false;
    PLATFORM_ONLY_KEYS.forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(detail, k)) {
        platformDetail[k] = detail[k];
        delete detail[k];
        hasPlatformFields = true;
      }
    });

    var docs = [];
    var mainDoc = Object.assign({}, base, {
      id: eventId,
      detail: detail
    });
    docs.push(mainDoc);

    if (hasPlatformFields) {
      // Platform twin: same envelope, tier flipped, admin-only fields.
      // Uses a derived ID so retries stay idempotent.
      docs.push(Object.assign({}, base, {
        id: eventId + '_platform',
        tier: 'platform',
        summary: base.summary + ' [platform twin]',
        detail: platformDetail,
        xp: 0,
        xpBanked: false
      }));
    }
    return docs;
  }

  /* ---------- Validation (fail loudly on bad input) ---------- */
  function validate(event) {
    if (!event || typeof event !== 'object') {
      throw new Error('[CDLedger] event must be an object');
    }
    if (typeof event.type !== 'string' || !ALL_TYPES[event.type]) {
      throw new Error('[CDLedger] unknown event type: ' + event.type +
        ' (must be in the spec Appendix B allowlist)');
    }
    if (SURFACES.indexOf(event.surface) === -1) {
      throw new Error('[CDLedger] unknown surface: ' + event.surface);
    }
    if (typeof event.xp === 'number' &&
        (event.xp < -1000 || event.xp > 500)) {
      throw new Error('[CDLedger] xp out of bounds (-1000..500): ' + event.xp);
    }
    if (event.skillTags !== undefined && !Array.isArray(event.skillTags)) {
      throw new Error('[CDLedger] skillTags must be an array');
    }
    if (event.detail !== undefined &&
        (typeof event.detail !== 'object' || event.detail === null)) {
      throw new Error('[CDLedger] detail must be an object');
    }
  }

  /* ---------- Write ---------- */
  function write(event) {
    validate(event);

    var uid = getUid();
    if (!uid) {
      throw new Error('[CDLedger] no signed-in user; cannot write ledger event');
    }
    var db = getDb();
    var now = Date.now();
    var eventId = event.id || uuid();
    var docs = splitTiers(event, uid, eventId, now);

    if (!db) {
      // Firestore not ready: queue everything, flush later.
      docs.forEach(enqueue);
      return { queued: true, ids: docs.map(function (d) { return d.id; }) };
    }

    var results = [];
    docs.forEach(function (doc) {
      var ref = db.collection('users').doc(uid).collection('ledger').doc(doc.id);
      var payload = Object.assign({}, doc);
      delete payload.id;
      results.push(
        ref.set(payload).then(
          function () { return { id: doc.id, ok: true }; },
          function (err) {
            // Failed write: queue for retry. Create-only rules make this safe.
            enqueue(doc);
            if (typeof console !== 'undefined') {
              console.warn('[CDLedger] write failed, queued for retry', doc.id, err);
            }
            return { id: doc.id, ok: false, queued: true };
          }
        )
      );
    });
    return Promise.all(results);
  }

  /* ---------- Flush queued events (call on reconnect / page show) ---------- */
  function flush() {
    var db = getDb();
    var uid = getUid();
    if (!db || !uid) return Promise.resolve({ flushed: 0 });

    var q = loadQueue();
    if (!q.length) return Promise.resolve({ flushed: 0 });

    // Only flush this user's own queued docs.
    var mine = q.filter(function (d) { return d.uid === uid; });
    var rest = q.filter(function (d) { return d.uid !== uid; });

    var batch = db.batch();
    var flushedIds = {};
    mine.forEach(function (doc) {
      var ref = db.collection('users').doc(uid).collection('ledger').doc(doc.id);
      var payload = Object.assign({}, doc);
      delete payload.id;
      // set() with create-only rules: use create via set + merge false.
      // A duplicate ID collides harmlessly (same content).
      batch.set(ref, payload, { merge: false });
      flushedIds[doc.id] = true;
    });

    return batch.commit().then(function () {
      saveQueue(rest); // keep other users' docs (shouldn't happen, but safe)
      return { flushed: mine.length };
    }, function (err) {
      if (typeof console !== 'undefined') {
        console.warn('[CDLedger] flush failed, queue retained', err);
      }
      return { flushed: 0, error: String(err && err.message || err) };
    });
  }

  /* ---------- Auto-flush on reconnect ---------- */
  if (typeof window !== 'undefined') {
    window.addEventListener('online', function () { flush(); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') flush();
    });
  }

  /* ---------- Public API ---------- */
  window.CDLedger = {
    write: write,
    flush: flush,
    queueLength: function () { return loadQueue().length; },
    // Exposed for tests and debugging only.
    _validate: validate,
    _splitTiers: splitTiers,
    _allTypes: ALL_TYPES,
    _skillVocab: SKILL_VOCAB,
    _schemaV: SCHEMA_V
  };
})();
