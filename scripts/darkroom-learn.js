// ================================================================
// DARKROOM LEARN — inline cinematic lessons & drills.
// Runs INSIDE the Darkroom sheet. No redirects, no page changes.
// Expects (resolved at call time): window.firebase compat, skillMap,
// showToast(), closeSheet() from scripts/darkroom.js, plus
// window.DARKROOM_LESSONS from scripts/darkroom-lessons.js.
// ================================================================
window.CDLearn = (() => {
  'use strict';

  const LESSON_XP = 20;
  const DRILL_XP = 10;
  const DRILL_CONSOLATION = 5;
  const LESSON_KEY = 'core'; // lessonsDone entry for the single core lesson

  const $ = (id) => document.getElementById(id);
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chimeOn = () => { try { return localStorage.getItem('cd_chime') !== 'off'; } catch (e) { return true; } };
  const hapticsOn = () => { try { return localStorage.getItem('cd_haptics') !== 'off'; } catch (e) { return true; } };
  const tickH = () => { if (hapticsOn() && window.CDHaptics) window.CDHaptics.tick(); };
  const bigH = () => { if (hapticsOn() && window.CDHaptics) window.CDHaptics.bigSuccess(); };

  /* ---------- tiny WebAudio: tick + completion chime ---------- */
  let AC = null;
  function ac() {
    if (AC || !chimeOn()) return AC;
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; }
    return AC;
  }
  function blip(freq, t0, dur, gain) {
    const ctx = ac(); if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    const t = ctx.currentTime + t0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  const sfxTick = () => blip(660, 0, 0.12, 0.08);
  const sfxGood = () => { blip(523, 0, 0.14, 0.09); blip(784, 0.07, 0.16, 0.09); };
  const sfxBad = () => blip(220, 0, 0.18, 0.07);
  const sfxWin = () => { blip(523, 0, 0.16, 0.1); blip(659, 0.1, 0.16, 0.1); blip(880, 0.2, 0.3, 0.11); };

  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  // Adapters to the Darkroom page's own globals (resolved at call time).
  const fb = () => (window.firebase && firebase.auth && firebase.firestore) ? firebase : null;
  const me = () => { const f = fb(); return f ? f.auth().currentUser : null; };
  const fdb = () => { const f = fb(); return f ? f.firestore() : null; };
  const skillOf = (id) => ((typeof skillMap !== 'undefined' && skillMap[id]) || { id, name: id, desc: '' });
  const say = (m) => { if (typeof showToast === 'function') showToast(m); };

  /* ================= ACCESS GATE =================
     Free tier: Foundations + Light & Exposure (9 skills), lessons and
     drills. Composition and beyond is Pro. Signed-out: nothing opens —
     the paywall decides. Upgrade goes to /products.html. */
  const FREE_BRANCHES = ['foundations', 'light'];
  const _branchOf = {};
  function branchOf(skillId){
    if (skillId in _branchOf) return _branchOf[skillId];
    let found = null;
    try {
      const trees = (typeof SKILL_TREES !== 'undefined') ? SKILL_TREES : {};
      Object.keys(trees).forEach(k => (trees[k].branches || []).forEach(b => {
        if ((b.skills || []).some(s => s.id === skillId)) found = b.id;
      }));
    } catch(e){}
    _branchOf[skillId] = found;
    return found;
  }
  function isFreeSkill(skillId){ return FREE_BRANCHES.indexOf(branchOf(skillId)) !== -1; }
  let tierCache = null; // null = unknown, 'pro' | 'free'
  async function proTier() {
    const user = me();
    if (!user) return null;
    if (tierCache) return tierCache;
    try {
      const s = await fdb().collection('users').doc(user.uid).get();
      tierCache = (s.exists && s.data().tier) || 'free';
    } catch (e) { tierCache = 'free'; }
    return tierCache;
  }
  function prefetchTier() { proTier().catch(() => {}); }

  // Returns true when the user may enter this lesson/drill; otherwise renders
  // the appropriate paywall inside the sheet and returns false.
  async function gated(skillId, kind) {
    const user = me();
    const t = user ? await proTier() : null;
    if (user && (t === 'pro' || isFreeSkill(skillId))) return true;
    showLearn();
    if (!user) {
      try { sessionStorage.setItem('cd_post_login_redirect', '/darkroom.html'); } catch (e) {}
      stage().innerHTML = `
        <div class="dl-stage">
          <button class="dl-back" data-dl="home">‹ Skill</button>
          <p class="dl-eyebrow">Pro</p>
          <h3 class="dl-title">The Darkroom goes deeper.</h3>
          <p class="dl-sub">Log in to check your access — Foundations and Light &amp; Exposure are free for every operator.</p>
          <button class="btn btn-primary dl-cta" data-dl="login">Log In</button>
          <div class="dl-row dl-alt"><button class="btn btn-ghost" data-dl="home2">Keep exploring</button></div>
        </div>`;
      wire(null, {
        login: () => { location.href = '/login.html'; },
        home2: () => showHome()
      });
      return false;
    }
    stage().innerHTML = `
      <div class="dl-stage">
        <button class="dl-back" data-dl="home">‹ Skill</button>
        <p class="dl-eyebrow">Pro</p>
        <h3 class="dl-title">Composition and beyond is Pro.</h3>
        <p class="dl-sub">Foundations and Light &amp; Exposure are free forever — the other 14 skills unlock with Pro.</p>
        <a class="btn btn-primary dl-cta dl-plan-pick" href="/pro-checkout.html">Unlock with Pro</a>
        <p class="dl-fine">$119/year · just $9.92/mo · 30-day money-back guarantee</p>
        <div class="dl-row dl-alt"><button class="btn btn-ghost" data-dl="home2">Keep exploring</button></div>
      </div>`;
    wire(null, {
      home2: () => showHome()
    });
    return false;
  }

  // PRO pill on the sheet buttons for non-Pro users (called from openSheet).
  // Buttons for free-branch skills stay clean for signed-in free users.
  function decorateButtons(skillId) {
    const bl = $('btnLesson'), bd = $('btnDrill');
    if (!bl || !bd || !document.createElement) return;
    const pill = (btn, show) => {
      const old = btn.querySelector('.dl-pro');
      if (old) old.remove();
      if (show) {
        const s = document.createElement('span');
        s.className = 'dl-pro'; s.textContent = 'PRO';
        btn.appendChild(s);
      }
    };
    const apply = (t) => {
      const pro = t === 'pro';
      const gatedSkill = !pro && !isFreeSkill(skillId);
      pill(bl, gatedSkill);
      pill(bd, gatedSkill);
    };
    if (!me()) { apply('free'); return; }
    if (tierCache) apply(tierCache);
    else proTier().then(apply).catch(() => apply('free'));
  }

  function stage() { return $('sheetLearn'); }
  function home() { return $('sheetHome'); }

  function showLearn() {
    home().hidden = true;
    const s = stage(); s.hidden = false;
    s.classList.remove('dl-enter');
    if (!reduced()) { void s.offsetWidth; s.classList.add('dl-enter'); }
    const sheetEl = s.closest('.sheet');
    if (sheetEl) sheetEl.scrollTop = 0;
  }
  function showHome() {
    stage().hidden = true; stage().innerHTML = '';
    home().hidden = false;
  }

  function progressHTML(done, total) {
    let dots = '';
    for (let i = 0; i < total; i++) dots += `<i class="${i < done ? 'on' : ''}"></i>`;
    return `<div class="dl-progress" aria-hidden="true">${dots}</div>`;
  }

  /* ================= LESSON ================= */
  async function openLesson(skillId) {
    const content = (window.DARKROOM_LESSONS || {})[skillId];
    if (!content) { say('Lesson not ready for this skill yet.'); return; }
    if (!(await gated(skillId, 'lesson'))) return;
    const skill = skillOf(skillId);
    const state = { skillId, skill, mode: 'lesson', card: 0, checkAnswered: false, checkRight: false, done: false };
    showLearn();
    renderLessonIntro(state);
  }

  function renderLessonIntro(st) {
    const c = st.skill;
    stage().innerHTML = `
      <div class="dl-stage">
        <button class="dl-back" data-dl="home">‹ Skill</button>
        <p class="dl-eyebrow">Lesson · ${esc(c.name)}</p>
        <h3 class="dl-title">Three cards.<br>One check.</h3>
        <p class="dl-sub">${esc(c.desc || '')}</p>
        <div class="dl-meta"><span>+${LESSON_XP} XP</span><span>·</span><span>~2 min</span></div>
        <button class="btn btn-primary dl-cta" data-dl="begin">Begin lesson</button>
      </div>`;
    wire(st, { begin: () => renderLessonCard(st, 0) });
  }

  function renderLessonCard(st, i) {
    const card = st.skill && (window.DARKROOM_LESSONS[st.skillId].lesson.cards[i]);
    st.card = i;
    stage().innerHTML = `
      <div class="dl-stage">
        <button class="dl-back" data-dl="home">‹ Skill</button>
        ${progressHTML(i, 4)}
        <p class="dl-eyebrow">Card ${i + 1} of 3</p>
        <h3 class="dl-card-h">${esc(card.h)}</h3>
        <p class="dl-card-p">${esc(card.p)}</p>
        <div class="dl-row">
          ${i > 0 ? '<button class="btn btn-ghost" data-dl="prev">Back</button>' : '<span></span>'}
          <button class="btn btn-primary" data-dl="next">${i === 2 ? 'Take the check' : 'Next'}</button>
        </div>
      </div>`;
    wire(st, {
      prev: () => { sfxTick(); renderLessonCard(st, i - 1); },
      next: () => { sfxTick(); tickH(); i === 2 ? renderCheck(st) : renderLessonCard(st, i + 1); }
    });
  }

  function renderCheck(st) {
    const check = window.DARKROOM_LESSONS[st.skillId].lesson.check;
    stage().innerHTML = `
      <div class="dl-stage">
        <button class="dl-back" data-dl="home">‹ Skill</button>
        ${progressHTML(3, 4)}
        <p class="dl-eyebrow">The check</p>
        <h3 class="dl-q">${esc(check.q)}</h3>
        <div class="dl-opts">${check.options.map((o, i) =>
          `<button class="dl-opt" data-i="${i}"><span class="dl-key">${'ABCD'[i]}</span>${esc(o)}</button>`).join('')}
        </div>
        <div class="dl-why" hidden></div>
        <button class="btn btn-primary dl-cta" data-dl="finish" hidden>See results</button>
      </div>`;
    const opts = stage().querySelectorAll('.dl-opt');
    const why = stage().querySelector('.dl-why');
    const fin = stage().querySelector('[data-dl="finish"]');
    opts.forEach(btn => btn.addEventListener('click', () => {
      if (st.checkAnswered) return;
      st.checkAnswered = true;
      const i = +btn.dataset.i, right = i === check.answer;
      st.checkRight = right;
      opts.forEach((b, j) => {
        b.disabled = true;
        if (j === check.answer) b.classList.add('right');
        else if (j === i) b.classList.add('wrong');
      });
      why.hidden = false;
      why.innerHTML = `<strong>${right ? 'Correct.' : 'Not quite.'}</strong> ${esc(check.why)}`;
      fin.hidden = false;
      // Bank the moment the check is answered — not on the next tap — so any
      // exit from here on preserves the earned XP.
      st.bankPromise = bankXp(st.skillId, 'lesson', LESSON_XP, 0);
      right ? (sfxGood(), tickH()) : sfxBad();
    }, { once: false }));
    wire(st, { finish: () => finishLesson(st) });
  }

  async function finishLesson(st) {
    if (st.done) return; st.done = true;
    // XP was already banked when the check was answered; this just awaits it.
    const award = await (st.bankPromise || bankXp(st.skillId, 'lesson', LESSON_XP, 0));
    if (award && award.banked && window.CDGear) {
      try { window.CDGear.trackLesson(fdb(), me() && me().uid, isFreeSkill(st.skillId)); } catch (e) { /* best-effort */ }
    }
    sfxWin(); bigH();
    renderResult(st, {
      headline: 'Lesson complete.',
      sub: st.checkRight ? 'Check passed on the first read.' : 'Read through — the check is there when you want it again.',
      xp: award,
      cta: { label: 'Back to the map', act: () => { closeLearn(); } },
      alt: { label: 'Run the drill', act: () => openDrill(st.skillId) }
    });
    if (window.CDReviews) window.CDReviews.maybePrompt('darkroom-lesson');
  }

  /* ================= DRILL ================= */
  async function openDrill(skillId) {
    const content = (window.DARKROOM_LESSONS || {})[skillId];
    if (!content) { say('Drill not ready for this skill yet.'); return; }
    if (!(await gated(skillId, 'drill'))) return;
    const skill = skillOf(skillId);
    const state = { skillId, skill, mode: 'drill', qi: 0, correct: 0, answered: false, done: false };
    showLearn();
    renderDrillIntro(state);
  }

  function renderDrillIntro(st) {
    stage().innerHTML = `
      <div class="dl-stage">
        <button class="dl-back" data-dl="home">‹ Skill</button>
        <p class="dl-eyebrow">Drill · ${esc(st.skill.name)}</p>
        <h3 class="dl-title">Four questions.<br>Full speed.</h3>
        <p class="dl-sub">Rapid-fire application. Trust your eye, answer fast.</p>
        <div class="dl-meta"><span>+${DRILL_XP} XP</span><span>·</span><span>~1 min</span></div>
        <button class="btn btn-primary dl-cta" data-dl="begin">Start drill</button>
      </div>`;
    wire(st, { begin: () => renderDrillQ(st, 0) });
  }

  function renderDrillQ(st, i) {
    const qs = window.DARKROOM_LESSONS[st.skillId].drill;
    const q = qs[i];
    st.qi = i; st.answered = false;
    stage().innerHTML = `
      <div class="dl-stage">
        <button class="dl-back" data-dl="home">‹ Skill</button>
        ${progressHTML(i, qs.length)}
        <p class="dl-eyebrow">Question ${i + 1} of ${qs.length}</p>
        <h3 class="dl-q">${esc(q.q)}</h3>
        <div class="dl-opts">${q.options.map((o, k) =>
          `<button class="dl-opt" data-i="${k}"><span class="dl-key">${'ABCD'[k]}</span>${esc(o)}</button>`).join('')}
        </div>
        <div class="dl-why" hidden></div>
        <button class="btn btn-primary dl-cta" data-dl="next" hidden>${i === qs.length - 1 ? 'See results' : 'Next question'}</button>
      </div>`;
    const opts = stage().querySelectorAll('.dl-opt');
    const why = stage().querySelector('.dl-why');
    const next = stage().querySelector('[data-dl="next"]');
    opts.forEach(btn => btn.addEventListener('click', () => {
      if (st.answered) return;
      st.answered = true;
      const k = +btn.dataset.i, right = k === q.answer;
      if (right) st.correct++;
      opts.forEach((b, j) => {
        b.disabled = true;
        if (j === q.answer) b.classList.add('right');
        else if (j === k) b.classList.add('wrong');
      });
      why.hidden = false;
      why.innerHTML = `<strong>${right ? 'Correct.' : 'Not quite.'}</strong> ${esc(q.why)}`;
      next.hidden = false;
      // On the final question the XP is decided — bank it now so any exit
      // from here on preserves what was earned.
      if (i === qs.length - 1) {
        const xp = st.correct >= 3 ? DRILL_XP : DRILL_CONSOLATION;
        st.bankPromise = bankXp(st.skillId, 'drill', xp, st.correct);
      }
      right ? (sfxGood(), tickH()) : sfxBad();
    }));
    wire(st, { next: () => { sfxTick(); i === qs.length - 1 ? finishDrill(st) : renderDrillQ(st, i + 1); } });
  }

  async function finishDrill(st) {
    if (st.done) return; st.done = true;
    const total = window.DARKROOM_LESSONS[st.skillId].drill.length;
    const xp = st.correct >= 3 ? DRILL_XP : DRILL_CONSOLATION;
    // XP was already banked when the last question was answered; await it.
    const award = await (st.bankPromise || bankXp(st.skillId, 'drill', xp, st.correct));
    sfxWin(); bigH();
    renderResult(st, {
      headline: `${st.correct} of ${total}.`,
      sub: st.correct >= 3 ? 'Sharp. That is drill-ready shooting.' : 'Reps build instinct. Run it again tomorrow.',
      xp: award,
      cta: { label: 'Back to the map', act: () => { closeLearn(); } },
      alt: { label: 'Replay drill', act: () => openDrill(st.skillId) }
    });
    if (window.CDReviews) window.CDReviews.maybePrompt('darkroom-drill');
  }

  /* ================= RESULT ================= */
  function renderResult(st, r) {
    const a = r.xp;
    stage().innerHTML = `
      <div class="dl-stage dl-result">
        <p class="dl-eyebrow">${st.mode === 'lesson' ? 'Lesson' : 'Drill'} · ${esc(st.skill.name)}</p>
        <h3 class="dl-title">${esc(r.headline)}</h3>
        <p class="dl-sub">${esc(r.sub)}</p>
        <div class="dl-xp ${a.banked ? '' : 'flat'}">
          <span class="dl-xp-n">${a.banked ? '+' + a.amount : '±0'}</span>
          <span class="dl-xp-l">${a.banked ? 'XP banked' : a.reason}</span>
        </div>
        <button class="btn btn-primary dl-cta" data-dl="cta">${esc(r.cta.label)}</button>
        <div class="dl-row dl-alt">
          <button class="btn btn-ghost" data-dl="alt">${esc(r.alt.label)}</button>
          <button class="btn btn-ghost" data-dl="home2">Skill sheet</button>
        </div>
      </div>`;
    wire(st, { cta: r.cta.act, alt: r.alt.act, home2: () => showHome() });
  }

  function wire(st, handlers) {
    stage().querySelectorAll('[data-dl]').forEach(el => {
      const k = el.dataset.dl;
      if (k === 'home') el.addEventListener('click', () => { sfxTick(); showHome(); });
      else if (handlers[k]) el.addEventListener('click', handlers[k]);
    });
  }

  function closeLearn() {
    showHome();
    closeSheet();
  }

  /* ================= XP =================
     Skill XP -> userSkills/{uid}.skills.<id>
     Global XP -> users/{uid} (xpToday, totalPoints, xpByDay, recentActivity)
     Anti-farm: lesson once per skill; drill once per skill per day. */
  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  async function bankXp(skillId, kind, amount, correct) {
    const user = me();
    const db = fdb();
    if (!user || !db) return { banked: false, amount: 0, reason: 'Log in to bank XP' };
    // The ledger write races a timeout — a hanging Firestore must never
    // strand the user on a dead screen. Anti-farm checks live inside the
    // work itself, so a slow write that lands late still can't double-bank.
    const work = (async () => {
      const uid = user.uid;
      const ref = db.collection('userSkills').doc(uid);
      const snap = await ref.get();
      const sk = (snap.exists && snap.data().skills && snap.data().skills[skillId]) || {};
      const tk = todayKey();
      if (kind === 'lesson' && (sk.lessonsDone || []).includes(LESSON_KEY))
        return { banked: false, amount: 0, reason: 'XP already banked for this lesson' };
      if (kind === 'drill' && (sk.drillDays || []).includes(tk))
        return { banked: false, amount: 0, reason: 'Drill XP already banked today' };

      const F = firebase.firestore.FieldValue;
      const skillPatch = { xp: F.increment(amount), updatedAt: F.serverTimestamp() };
      if (kind === 'lesson') skillPatch.lessonsDone = F.arrayUnion(LESSON_KEY);
      else skillPatch.drillDays = F.arrayUnion(tk);

      // global XP ledger (dashboard ring, today's goal)
      const globalWrite = {
        xpToday: F.increment(amount),
        totalPoints: F.increment(amount),
        ['xpByDay.' + tk]: F.increment(amount),
        recentActivity: F.arrayUnion({
          type: kind === 'lesson' ? 'darkroom_lesson' : 'darkroom_drill',
          skillId, xp: amount, correct: correct || 0,
          at: new Date().toISOString()
        })
      };
      // Stamp the day keys RewardEngine.award() uses for its day-rollover
      // reset. Without these, a later award() call sees a stale "last
      // active" date, assumes a new day, and resets xpToday to 0 + its own
      // XP — silently wiping the XP banked here from the daily total.
      globalWrite.lastActivityDate = tk;
      globalWrite.lastActiveDate = tk;
      globalWrite.lastStreakDate = tk;
      globalWrite.lastXpDate = tk;

      // Commit skill + global writes atomically. A half-banked state (skill
      // XP written, global XP not) can never be retried cleanly, because the
      // anti-farm flag would already be set above.
      const batch = db.batch();
      batch.set(ref, { updatedAt: F.serverTimestamp(), skills: { [skillId]: skillPatch } }, { merge: true });
      batch.set(db.collection('users').doc(uid), globalWrite, { merge: true });
      await batch.commit();
      return { banked: true, amount, reason: '' };
    })();
    try {
      return await Promise.race([
        work,
        new Promise((_, rej) => setTimeout(() => rej(new Error('ledger timeout')), 10000))
      ]);
    } catch (e) {
      console.warn('[learn] xp write failed', e);
      return { banked: false, amount: 0, reason: 'Could not reach the darkroom ledger' };
    }
  }

  return { openLesson, openDrill, closeLearn, prefetchTier, decorateButtons, isFreeSkill };
})();
