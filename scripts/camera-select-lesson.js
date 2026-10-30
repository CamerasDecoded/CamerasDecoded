/* Camera Select — interactive lesson engine (2026-10-30).
   Card-deck lessons with Cynetis-7 as guide: real artwork, pre-generated
   ElevenLabs voice lines, reaction clips shared across lessons
   (media/camera-select/audio/shared/), first-try scoring, Pro gate for
   deep lessons, and XP banking that mirrors the Darkroom pattern
   (scripts/darkroom-learn.js bankXp): progress + anti-farm in
   users/{uid}/learningProgress/camera-select, global ledger on users/{uid}
   (day-aware xpToday, totalPoints, xpByDay, recentActivity, day stamps),
   one atomic batch, 10s race so a hanging write never strands the learner. */
(function () {
  'use strict';

  var CSS = [
    '.csl{--csl-green:#8deb00;--csl-amber:#ffb340;--csl-red:#ff6b5e;--csl-card:#101013;--csl-border:rgba(255,255,255,.1);--csl-text2:rgba(255,255,255,.64);font-family:Montserrat,sans-serif;color:#fff}',
    '.csl-topbar{display:flex;align-items:center;gap:12px}',
    '.csl-x{font-family:"Space Mono",monospace;color:var(--csl-text2);font-size:15px;background:none;border:0;cursor:pointer;padding:4px;text-decoration:none}',
    '.csl-progress{flex:1;height:10px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}',
    '.csl-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,rgba(141,235,0,.75),var(--csl-green));border-radius:99px;transition:width .5s cubic-bezier(.2,.7,.3,1);box-shadow:0 0 12px rgba(141,235,0,.55)}',
    '.csl-score{font-family:"Space Mono",monospace;font-size:11px;letter-spacing:1px;color:var(--csl-green);border:1px solid rgba(141,235,0,.35);padding:5px 9px;border-radius:99px;white-space:nowrap}',
    '.csl-guide{display:flex;gap:13px;align-items:flex-start;margin-top:20px;min-height:104px}',
    '.csl-avatar-wrap{position:relative;flex:none}',
    '.csl-avatar{width:84px;height:84px;border-radius:50%;object-fit:cover;border:2px solid rgba(141,235,0,.55);display:block;animation:cslBob 3.6s ease-in-out infinite;background:#0c0c0e}',
    '.csl-avatar-wrap::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:1px solid rgba(141,235,0,.25);opacity:0}',
    '.csl-avatar-wrap.speaking::after{animation:cslRing 1.1s ease-out infinite}',
    '.csl-avatar-wrap.cheer .csl-avatar{animation:cslCheer .6s ease}',
    '.csl-avatar-wrap.nudge .csl-avatar{animation:cslNudge .45s ease}',
    '@keyframes cslBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',
    '@keyframes cslRing{0%{transform:scale(.92);opacity:.9}100%{transform:scale(1.25);opacity:0}}',
    '@keyframes cslCheer{0%{transform:translateY(0)}35%{transform:translateY(-13px) scale(1.05)}70%{transform:translateY(2px)}100%{transform:translateY(0)}}',
    '@keyframes cslNudge{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}',
    '.csl-bubble{flex:1;border:1px solid rgba(141,235,0,.16);border-radius:16px;border-top-left-radius:4px;padding:13px 14px;background:linear-gradient(150deg,rgba(255,255,255,.055),rgba(255,255,255,0) 45%),linear-gradient(165deg,rgba(141,235,0,.055),rgba(12,12,14,1) 55%);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 10px 30px rgba(0,0,0,.35)}',
    '.csl-who{font-family:"Space Mono",monospace;font-size:9.5px;letter-spacing:2px;color:var(--csl-green);margin-bottom:5px;display:flex;justify-content:space-between;align-items:center}',
    '.csl-eq{display:none;gap:2.5px;align-items:flex-end;height:11px}',
    '.csl-eq i{width:3px;background:var(--csl-green);border-radius:2px;animation:cslEq .7s ease-in-out infinite}',
    '.csl-eq i:nth-child(2){animation-delay:.15s}.csl-eq i:nth-child(3){animation-delay:.3s}.csl-eq i:nth-child(4){animation-delay:.45s}',
    '@keyframes cslEq{0%,100%{height:4px}50%{height:11px}}',
    '.csl-bubble.speaking .csl-eq{display:flex}',
    '.csl-line{font-size:14.5px;line-height:1.55;min-height:44px}',
    '.csl-replay{margin-top:8px;border:1px solid rgba(141,235,0,.35);color:var(--csl-green);font-family:"Space Mono",monospace;font-size:10px;letter-spacing:1px;padding:6px 11px;border-radius:99px;cursor:pointer;background:linear-gradient(165deg,rgba(141,235,0,.14),rgba(141,235,0,.04));box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}',
    '.csl-replay:active{transform:scale(.96)}',
    '.csl-stage{margin-top:18px}',
    '.csl-card{animation:cslIn .45s cubic-bezier(.2,.7,.3,1) both}',
    '@keyframes cslIn{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}',
    '.csl-kicker{font-family:"Space Mono",monospace;font-size:10.5px;letter-spacing:2.2px;color:var(--csl-green)}',
    '.csl-card h2{font-size:24px;font-weight:800;line-height:1.2;margin:7px 0 10px}',
    '.csl-card p{font-size:14.5px;line-height:1.65;color:var(--csl-text2)}',
    '.csl-card p b{color:#fff}',
    '.csl-hero{width:100%;border-radius:16px;border:1px solid var(--csl-border);margin-top:14px;display:block}',
    '.csl-path{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin:13px 0}',
    '.csl-crumb{font-family:"Space Mono",monospace;font-size:11px;font-weight:700;background:rgba(255,255,255,.07);border:1px solid var(--csl-border);border-radius:7px;padding:5px 9px}',
    '.csl-crumb.tab{color:var(--csl-green);border-color:rgba(141,235,0,.45)}',
    '.csl-arr{color:rgba(255,255,255,.35);font-size:11px}',
    '.csl-visual{border:1px solid var(--csl-border);border-radius:16px;padding:15px;background:var(--csl-card);margin-top:14px}',
    '.csl-vlabel{font-family:"Space Mono",monospace;font-size:10px;letter-spacing:1.8px;color:var(--csl-text2);margin-bottom:10px}',
    '.csl-warn{border-left:3px solid var(--csl-amber);background:rgba(255,179,64,.07);border-radius:0 10px 10px 0;padding:11px 13px;font-size:13px;line-height:1.55;color:rgba(255,255,255,.8);margin-top:14px}',
    '.csl-warn b{color:var(--csl-amber)}',
    '.csl-bar-row{display:flex;align-items:center;gap:10px;margin-top:9px;font-size:11.5px}',
    '.csl-blabel{width:118px;flex:none;color:rgba(255,255,255,.85);font-weight:600}',
    '.csl-btrack{flex:1;height:9px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}',
    '.csl-bfill{display:block;height:100%;background:var(--csl-green);border-radius:99px}',
    '.csl-bval{font-family:"Space Mono",monospace;font-size:9.5px;color:var(--csl-text2);width:74px;flex:none}',
    '.csl-fixrow{display:flex;gap:12px;padding:11px 0;border-top:1px solid rgba(255,255,255,.07);font-size:13px;line-height:1.55}',
    '.csl-fixrow:first-of-type{border-top:0}',
    '.csl-sym{width:34%;flex:none;font-weight:700;color:#fff}',
    '.csl-fix{color:var(--csl-text2)}',
    '.csl-fix b{color:#fff}',
    '.csl-opts{display:grid;gap:10px;margin-top:16px}',
    '.csl-opt{text-align:left;background:var(--csl-card);border:1.5px solid var(--csl-border);border-radius:14px;padding:15px 14px;font-family:Montserrat,sans-serif;font-size:14.5px;font-weight:600;color:#fff;cursor:pointer}',
    '.csl-opt small{display:block;font-weight:400;font-size:12px;color:var(--csl-text2);margin-top:3px;line-height:1.45}',
    '.csl-opt{transition:border-color .2s ease,background .2s ease,transform .15s ease}',
    '.csl-opt:active{transform:scale(.985)}',
    '.csl-opt.sel{border-color:rgba(141,235,0,.75);background:linear-gradient(150deg,rgba(255,255,255,.07),rgba(255,255,255,0) 45%),linear-gradient(165deg,rgba(141,235,0,.20),rgba(141,235,0,.06));box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 6px 22px rgba(141,235,0,.10)}',
    '.csl-opt.right{border-color:var(--csl-green);background:rgba(141,235,0,.13)}',
    '.csl-opt:disabled{cursor:default}',
    '.csl-slots{display:flex;flex-wrap:wrap;gap:6px;min-height:38px;border:1px dashed rgba(255,255,255,.2);border-radius:12px;padding:8px;margin-top:16px;align-items:center}',
    '.csl-slots .csl-ph{font-size:12px;color:var(--csl-text2);font-family:"Space Mono",monospace}',
    '.csl-chip{font-family:"Space Mono",monospace;font-size:12px;font-weight:700;background:rgba(141,235,0,.12);border:1px solid rgba(141,235,0,.5);color:#fff;border-radius:8px;padding:7px 10px;cursor:pointer}',
    '.csl-bank{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}',
    '.csl-bank .csl-chip{background:var(--csl-card);border-color:var(--csl-border)}',
    '.csl-bank .csl-chip.used{opacity:.25;pointer-events:none}',
    '.csl-slots.bad{animation:cslNudge .45s ease;border-color:var(--csl-red)}',
    '.csl-feedback{display:none;margin-top:14px;border-radius:12px;padding:12px 14px;font-size:13.5px;line-height:1.55}',
    '.csl-feedback.good{display:block;background:rgba(141,235,0,.1);border:1px solid rgba(141,235,0,.4)}',
    '.csl-feedback.bad{display:block;background:rgba(255,107,94,.09);border:1px solid rgba(255,107,94,.4)}',
    '.csl-actionbar{padding-top:14px;display:flex;gap:10px;align-items:stretch}',
    '/* Standard action: the CD signature glass (no chase) — green-glass gradient, inset top light, soft green shadow, neon label. */',
    '.csl-btn{flex:1;border-radius:14px;padding:16px 14px;font-family:Montserrat,sans-serif;font-size:13.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;cursor:pointer;color:var(--csl-green);text-shadow:0 0 16px rgba(141,235,0,.4);border:1px solid rgba(141,235,0,.30);background:linear-gradient(120deg,rgba(255,255,255,.10),rgba(255,255,255,0) 42%),linear-gradient(165deg,rgba(141,235,0,.20) 0%,rgba(141,235,0,.07) 60%,rgba(141,235,0,.13) 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 6px 22px rgba(141,235,0,.10);transition:transform .15s ease,filter .15s ease,opacity .2s ease}',
    '.csl-btn:active{transform:scale(.98);filter:brightness(1.22)}',
    '.csl-btn:disabled{opacity:.32;cursor:default;text-shadow:none}',
    '/* Solid bright green: reserved for the moments that need a lot of attention. */',
    '.csl-btn.solid{background:var(--csl-green);color:#0a0f0a;text-shadow:none;border-color:transparent;box-shadow:0 8px 26px rgba(141,235,0,.28)}',
    '.csl-btn.ghost{flex:none;background:none;box-shadow:none;border:0;color:var(--csl-text2);font-weight:600;font-size:13.5px;padding:10px;text-transform:none;letter-spacing:0;text-shadow:none}',
    '.csl-back{flex:none;display:none;align-items:center;gap:7px;border-radius:14px;padding:0 16px;font-family:Montserrat,sans-serif;font-size:13px;font-weight:700;letter-spacing:.03em;cursor:pointer;color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.14);background:linear-gradient(150deg,rgba(255,255,255,.08),rgba(255,255,255,.015) 55%);box-shadow:inset 0 1px 0 rgba(255,255,255,.08);transition:transform .15s ease}',
    '.csl-back:active{transform:scale(.96)}',
    '.csl-back.show{display:inline-flex}',
    '.csl-back .arrw{color:var(--csl-green);font-size:15px;line-height:1}',
    '.csl-subrow{display:block;width:100%}',
    '.csl-xp{text-align:center;margin:10px 0 4px}',
    '.csl-xp .n{font-size:44px;font-weight:800;color:var(--csl-green)}',
    '.csl-xp .l{font-family:"Space Mono",monospace;font-size:10.5px;letter-spacing:2px;color:var(--csl-text2)}',
    '.csl-scoreline{text-align:center;font-size:14px;color:var(--csl-text2);margin-top:8px}',
    '.csl-banknote{text-align:center;font-size:12.5px;color:var(--csl-text2);margin-top:10px}',
    '.csl-banknote a{color:var(--csl-green)}',
    '.csl-answer{margin-top:16px;border:1px solid rgba(141,235,0,.45);border-radius:16px;padding:16px;background:linear-gradient(160deg,rgba(141,235,0,.09),rgba(141,235,0,.02))}',
    '.csl-ahead{font-family:"Space Mono",monospace;font-size:10px;letter-spacing:2px;color:var(--csl-green)}',
    '.csl-aline{font-size:16.5px;font-weight:700;line-height:1.5;margin-top:8px}',
    '.csl-aset{font-size:12px;color:var(--csl-text2);line-height:1.65;margin-top:8px}',
    '.csl-afoot{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(141,235,0,.2);margin-top:13px;padding-top:11px;font-family:"Space Mono",monospace;font-size:9.5px;letter-spacing:1.5px;color:rgba(255,255,255,.45)}',
    '.csl-share{background:var(--csl-green);color:#0a0f0a;border:0;border-radius:99px;padding:7px 14px;font-family:"Space Mono",monospace;font-size:10.5px;font-weight:700;cursor:pointer}',
    '.csl-gate{border:1px solid rgba(255,179,64,.45);background:rgba(255,179,64,.06);border-radius:16px;padding:20px 18px}',
    '.csl-gate .pg-k{font-family:"Space Mono",monospace;font-size:10.5px;letter-spacing:2px;color:var(--csl-amber)}',
    '.csl-gate h3{font-size:19px;font-weight:800;margin:6px 0 6px}',
    '.csl-gate p{font-size:13.5px;color:rgba(255,255,255,.65);line-height:1.6}',
    '.csl-done{display:inline-block;font-family:"Space Mono",monospace;font-size:10px;letter-spacing:1.5px;color:var(--csl-green);border:1px solid rgba(141,235,0,.4);border-radius:99px;padding:4px 10px;margin-top:10px}',
    '@media (prefers-reduced-motion: reduce){.csl-avatar,.csl-card{animation:none}.csl-avatar-wrap.speaking::after{animation:none}}'
  ].join('\n');

  var SHARED = '/media/camera-select/audio/shared/';

  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function evalPro() {
    return new Promise(function (resolve) {
      try { if (window.USER && String(window.USER.tier || '').toLowerCase() === 'pro') return resolve(true); } catch (e) {}
      try { if (window.USER && window.USER.role === 'Admin') return resolve(true); } catch (e) {}
      try { if (window.CDPaywall && window.CDPaywall.isPro && window.CDPaywall.isPro()) return resolve(true); } catch (e) {}
      try {
        if (typeof firebase === 'undefined' || !firebase.auth || !window.db) return resolve(false);
        var auth = firebase.auth();
        var finish = function (user) {
          if (!user || !window.db) return resolve(false);
          window.db.collection('users').doc(user.uid).get().then(function (snap) {
            var d = (snap && snap.exists) ? (snap.data() || {}) : {};
            resolve(String(d.tier || 'free').toLowerCase() === 'pro' || d.role === 'Admin');
          }).catch(function () { resolve(false); });
        };
        if (auth.currentUser) { finish(auth.currentUser); return; }
        var unsub = auth.onAuthStateChanged(function (u) { try { unsub(); } catch (e) {} finish(u); });
        setTimeout(function () { resolve(false); }, 6000);
      } catch (e) { resolve(false); }
    });
  }

  function start(cfg) {
    var mount = document.getElementById('csPlayer');
    if (!mount) return;
    if (!document.getElementById('csl-css')) {
      var st = document.createElement('style');
      st.id = 'csl-css'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    var statik = document.getElementById('csStatic');
    if (statik) statik.style.display = 'none';

    mount.innerHTML =
      '<div class="csl">' +
      '<div class="csl-topbar"><a class="csl-x" href="/camera-select.html?brand=sony&model=a7%20IV" aria-label="Back to Camera Select">&times;</a>' +
      '<div class="csl-progress"><i id="cslBar"></i></div><div class="csl-score" id="cslScore">SCORE 0/' + cfg.scored.length + '</div></div>' +
      '<div class="csl-guide"><div class="csl-avatar-wrap" id="cslWrap"><img class="csl-avatar" src="/cynetis-avatar.png" alt="Cynetis-7"></div>' +
      '<div class="csl-bubble" id="cslBubble"><div class="csl-who"><span>CYNETIS-7</span><span class="csl-eq"><i></i><i></i><i></i><i></i></span></div>' +
      '<div class="csl-line" id="cslLine"></div><button class="csl-replay" id="cslReplay" type="button">REPLAY VOICE</button></div></div>' +
      '<div class="csl-stage" id="cslStage"></div>' +
      '<div class="csl-actionbar"><button class="csl-back" id="cslBack" type="button"><span class="arrw">&larr;</span>Back</button>' +
      '<button class="csl-btn" id="cslBtn" type="button">Begin</button></div>' +
      '<div class="csl-subrow"><button class="csl-btn ghost" id="cslSub" type="button" style="display:none">Skip for now</button></div></div>';

    var wrap = mount.querySelector('#cslWrap'), bubble = mount.querySelector('#cslBubble'),
        lineEl = mount.querySelector('#cslLine'), stage = mount.querySelector('#cslStage'),
        btn = mount.querySelector('#cslBtn'), subBtn = mount.querySelector('#cslSub'),
        backBtn = mount.querySelector('#cslBack'),
        bar = mount.querySelector('#cslBar'), chip = mount.querySelector('#cslScore');
    var player = new Audio();
    var S = { idx: 0, firstTry: {}, answered: {}, done: {}, picked: [], checked: false, pro: false, doneBefore: false, bankedNote: '' };
    var currentVoice = null, typeTimer = null;

    // prior completion (resume state)
    try {
      if (typeof firebase !== 'undefined' && firebase.auth && window.db) {
        firebase.auth().onAuthStateChanged(function (u) {
          if (!u) return;
          window.db.collection('users').doc(u.uid).collection('learningProgress').doc('camera-select').get()
            .then(function (snap) {
              var d = (snap && snap.exists) ? (snap.data() || {}) : {};
              if (d.lessons && d.lessons[cfg.slug]) { S.doneBefore = true; }
            }).catch(function () {});
        });
      }
    } catch (e) {}

    var proTries = 0;
    (function checkPro() {
      if (cfg.free) { S.pro = true; return; }
      evalPro().then(function (pro) {
        S.pro = pro;
        if (!pro && proTries < 3) { proTries++; setTimeout(checkPro, [700, 1500, 3000][proTries - 1]); }
      });
    })();

    function speak(text, voicePath) {
      clearInterval(typeTimer);
      lineEl.textContent = '';
      var i = 0;
      typeTimer = setInterval(function () {
        lineEl.textContent = text.slice(0, ++i);
        if (i >= text.length) clearInterval(typeTimer);
      }, 14);
      currentVoice = voicePath || null;
      if (!voicePath) {
        try { player.pause(); } catch (e) {}
        bubble.classList.remove('speaking'); wrap.classList.remove('speaking');
      }
      if (voicePath) {
        try {
          player.pause();
          player.src = voicePath;
          bubble.classList.add('speaking'); wrap.classList.add('speaking');
          player.onended = function () { bubble.classList.remove('speaking'); wrap.classList.remove('speaking'); };
          var p = player.play();
          if (p && p.catch) p.catch(function () { bubble.classList.remove('speaking'); wrap.classList.remove('speaking'); });
        } catch (e) {}
      }
    }
    function voiceOf(card) { return card.voice ? cfg.audioBase + card.voice : null; }
    function react(kind) {
      wrap.classList.remove('cheer', 'nudge');
      void wrap.offsetWidth;
      wrap.classList.add(kind);
      setTimeout(function () { wrap.classList.remove(kind); }, 700);
    }
    function score() { return cfg.scored.filter(function (id) { return S.firstTry[id]; }).length; }
    function chrome() {
      bar.style.width = Math.round(S.idx / (cfg.cards.length - 1) * 100) + '%';
      chip.textContent = 'SCORE ' + score() + '/' + cfg.scored.length;
    }

    function setBack(show) { backBtn.classList.toggle('show', !!show); }

    function render() {
      var c = cfg.cards[S.idx];
      if (!cfg.free && cfg.gateAfter !== null && S.idx > cfg.gateAfter && !S.pro) { renderGate(); return; }
      S.checked = false;
      var html = c.html;
      if (S.idx === 0 && S.doneBefore) html += '<span class="csl-done">COMPLETED BEFORE — XP ALREADY BANKED</span>';
      stage.innerHTML = '<div class="csl-card">' + html + '</div>';
      btn.classList.remove('solid');
      btn.textContent = c.btn || 'Continue';
      btn.disabled = c.kind === 'quiz' || c.kind === 'order';
      subBtn.style.display = c.sub ? 'block' : 'none';
      setBack(S.idx > 0 && c.kind !== 'result');
      c._say = c.say;
      var reviewed = (c.kind === 'quiz' || c.kind === 'order') && !!S.done[c.id];
      if (c.kind === 'result') buildResult(c);
      else if (reviewed) { speak(c.say, null); }
      else speak(c.say, voiceOf(c));
      if (c.kind === 'quiz') wireQuiz(c);
      if (c.kind === 'order' && !reviewed) wireOrder(c);
      if (reviewed) showReview(c);
      chrome();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showReview(c) {
      S.checked = true;
      var fb = stage.querySelector('#cslFb');
      if (fb) { fb.className = 'csl-feedback good'; fb.innerHTML = c.good; }
      if (c.kind === 'quiz') {
        stage.querySelectorAll('.csl-opt').forEach(function (o) {
          o.disabled = true;
          if (o.getAttribute('data-v') === c.correct) o.classList.add('right');
          if (o.getAttribute('data-v') === S.answered[c.id]) o.classList.add('sel');
        });
      } else {
        var slots = stage.querySelector('#cslSlots');
        var bank = stage.querySelector('#cslBank');
        var labelOf = {};
        bank.querySelectorAll('.csl-chip').forEach(function (ch) {
          labelOf[ch.getAttribute('data-v')] = ch.textContent;
          ch.classList.add('used');
        });
        slots.innerHTML = '';
        c.correct.split(',').forEach(function (v) {
          var s = document.createElement('span');
          s.className = 'csl-chip'; s.textContent = labelOf[v] || v;
          slots.appendChild(s);
        });
      }
      btn.textContent = 'Continue';
      btn.disabled = false;
    }

    function renderGate() {
      stage.innerHTML = '<div class="csl-card"><div class="csl-gate"><div class="pg-k">PRO LESSON</div>' +
        '<h3>The deep steps are Pro</h3><p>You have the opening of this lesson free. Pro opens the rest — every step, the checks, and the answer card — for this camera and every model as they ship.</p>' +
        '<p style="margin-top:10px">Already upgraded? The check runs again when you tap Continue.</p></div></div>';
      btn.textContent = 'Unlock with Pro';
      btn.classList.add('solid');
      btn.disabled = false;
      subBtn.style.display = 'none';
      setBack(true);
      speak('This is where Pro takes over. The opening was free — the deep steps are behind the door.', null);
      chrome();
    }

    function wireQuiz(c) {
      var opts = stage.querySelectorAll('.csl-opt');
      opts.forEach(function (o) {
        o.addEventListener('click', function () {
          if (S.checked) return;
          opts.forEach(function (x) { x.classList.remove('sel'); });
          o.classList.add('sel');
          S.answered[c.id] = o.getAttribute('data-v');
          btn.disabled = false;
        });
      });
      // Came back before checking? The earlier pick is still here.
      if (!S.done[c.id] && S.answered[c.id]) {
        opts.forEach(function (o) { if (o.getAttribute('data-v') === S.answered[c.id]) o.classList.add('sel'); });
        btn.disabled = false;
      }
    }
    function wireOrder(c) {
      S.picked = [];
      var slots = stage.querySelector('#cslSlots'), bank = stage.querySelector('#cslBank');
      bank.querySelectorAll('.csl-chip').forEach(function (ch) {
        ch.addEventListener('click', function () {
          if (S.checked) return;
          ch.classList.add('used');
          S.picked.push(ch.getAttribute('data-v'));
          var ph = slots.querySelector('.csl-ph'); if (ph) ph.remove();
          var s = document.createElement('span');
          s.className = 'csl-chip'; s.textContent = ch.textContent;
          slots.appendChild(s);
          btn.disabled = S.picked.length !== c.chips.length;
        });
      });
    }

    function check() {
      var c = cfg.cards[S.idx];
      var fb = stage.querySelector('#cslFb');
      var ok = c.kind === 'quiz' ? (S.answered[c.id] === c.correct) : (S.picked.join(',') === c.correct);
      if (S.firstTry[c.id] === undefined) S.firstTry[c.id] = ok;
      if (ok) {
        S.checked = true;
        S.done[c.id] = true;
        fb.className = 'csl-feedback good'; fb.innerHTML = c.good;
        if (c.kind === 'quiz') stage.querySelectorAll('.csl-opt').forEach(function (o) {
          o.disabled = true;
          if (o.getAttribute('data-v') === c.correct) o.classList.add('right');
        });
        react('cheer');
        c._say = 'Locked on. That is the one.';
        speak(c._say, SHARED + 'correct.mp3');
        btn.textContent = 'Continue'; btn.disabled = false;
      } else {
        fb.className = 'csl-feedback bad'; fb.innerHTML = c.bad;
        if (c.kind === 'order') {
          var slots = stage.querySelector('#cslSlots');
          slots.classList.add('bad');
          setTimeout(function () {
            slots.classList.remove('bad');
            slots.innerHTML = '<span class="csl-ph">TAP CHIPS IN ORDER</span>';
            stage.querySelectorAll('#cslBank .csl-chip').forEach(function (x) { x.classList.remove('used'); });
            S.picked = []; btn.disabled = true;
          }, 650);
        }
        react('nudge');
        c._say = 'Not quite. Think about what the setting actually does — and try again.';
        speak(c._say, SHARED + 'wrong.mp3');
      }
      chrome();
    }

    async function bankXp(amount, correctCount) {
      {
        var user = null;
        try { user = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null; } catch (e) {}
        if (!user || !window.db) return { banked: false, reason: 'signin' };
        var work = (async function () {
          var F = firebase.firestore.FieldValue;
          var uid = user.uid, tk = todayKey();
          var ref = window.db.collection('users').doc(uid).collection('learningProgress').doc('camera-select');
          var snap = await ref.get();
          var data = (snap && snap.exists) ? (snap.data() || {}) : {};
          var lessons = data.lessons || {};
          if (lessons[cfg.slug] && lessons[cfg.slug].xp) return { banked: false, reason: 'already' };
          var usnap = await window.db.collection('users').doc(uid).get().catch(function () { return null; });
          var udata = (usnap && usnap.exists) ? usnap.data() : null;
          var freshDay = !!udata && udata.xpTodayDate === tk;
          var globalWrite = freshDay
            ? { xpToday: F.increment(amount) }
            : { xpToday: amount, dailyXp: amount, xpTodayDate: tk };
          globalWrite.totalPoints = F.increment(amount);
          globalWrite['xpByDay.' + tk] = F.increment(amount);
          globalWrite.recentActivity = F.arrayUnion({ type: 'camera_select_lesson', lesson: cfg.slug, xp: amount, correct: correctCount, at: new Date().toISOString() });
          globalWrite.lastActivityDate = tk; globalWrite.lastActiveDate = tk; globalWrite.lastStreakDate = tk; globalWrite.lastXpDate = tk;
          var lessonPatch = {}; lessonPatch['lessons.' + cfg.slug] = { score: correctCount, xp: amount, perfect: correctCount === cfg.scored.length, at: new Date().toISOString() };
          var batch = window.db.batch();
          batch.set(ref, lessonPatch, { merge: true });
          batch.set(window.db.collection('users').doc(uid), globalWrite, { merge: true });
          await batch.commit();
          return { banked: true };
        })();
        try {
          return await Promise.race([work, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, 10000); })]);
        } catch (e) { return { banked: false, reason: 'error' }; }
      }
    }

    function buildResult(c) {
      var s = score(), total = cfg.scored.length, passed = s >= cfg.passMark, perfect = s === total;
      var xp = passed ? 20 + (perfect ? 10 : 0) : 0;
      var miss = cfg.scored.filter(function (id) { return !S.firstTry[id]; }).map(function (id) { return cfg.missNames[id] || id; });
      stage.querySelector('#cslResult').innerHTML =
        '<div class="csl-kicker">LESSON COMPLETE</div><h2>' + (passed ? 'Test passed' : 'Not yet') + '</h2>' +
        (passed ? '<div class="csl-xp"><div class="n">+' + xp + ' XP</div><div class="l">' + (perfect ? 'LESSON + PERFECT BONUS' : 'LESSON COMPLETE') + '</div></div>' : '') +
        '<p class="csl-scoreline">First-try score: <b style="color:#fff">' + s + ' of ' + total + '</b> · pass mark ' + cfg.passMark + '</p>' +
        (passed ? '' : '<p style="margin-top:10px">Your misses point at the work: <b>' + miss.join(', ') + '</b>. Run it again — the settings stick the second time.</p>') +
        '<div class="csl-banknote" id="cslBankNote"></div>' +
        '<div class="csl-answer"><div class="csl-ahead">THE ANSWER — SHARE THIS</div><div class="csl-aline">' + cfg.answer.aline + '</div>' +
        '<div class="csl-aset">' + cfg.answer.aset + '</div><div class="csl-afoot"><span>CAMERAS DECODED — CAMERA SELECT</span>' +
        '<button class="csl-share" id="cslShare" type="button">SHARE</button></div></div>';
      var line = passed ? cfg.passSay : cfg.failSay;
      c._say = line;
      speak(line, passed ? (cfg.audioBase + 'pass.mp3') : (SHARED + 'fail.mp3'));
      if (passed) {
        react('cheer');
        bankXp(xp, s).then(function (r) {
          var note = document.getElementById('cslBankNote');
          if (!note) return;
          if (r.banked) note.textContent = 'XP banked to your account.';
          else if (r.reason === 'already') note.textContent = 'You banked this XP before — re-runs are for mastery.';
          else if (r.reason === 'signin') note.innerHTML = '<a href="/login.html">Sign in</a> to bank this XP to your account.';
          else note.textContent = 'XP could not reach the ledger — your completion is saved on this screen.';
        });
      }
      btn.textContent = passed ? 'Finish' : 'Run it again';
      btn.disabled = false;
      var sh = stage.querySelector('#cslShare');
      if (sh) sh.addEventListener('click', function () {
        var text = stage.querySelector('.csl-aline').textContent;
        if (navigator.share) navigator.share({ title: document.title, text: text, url: location.href });
        else if (navigator.clipboard) navigator.clipboard.writeText(location.href);
      });
    }

    mount.querySelector('#cslReplay').addEventListener('click', function () {
      var c = cfg.cards[S.idx];
      speak(c._say || c.say, currentVoice);
    });

    btn.addEventListener('click', function () {
      var c = cfg.cards[S.idx];
      if (!cfg.free && cfg.gateAfter !== null && S.idx > cfg.gateAfter && !S.pro) {
        // gate screen is showing
        evalPro().then(function (pro) {
          if (pro) { S.pro = true; render(); return; }
          if (window.CDPaywall && window.CDPaywall.show) window.CDPaywall.show({ headline: 'Camera Select — Pro lessons', sub: 'The deep tips for your exact camera: full steps, checks, and the answer card.' });
          else window.location.href = '/pro-checkout.html';
        });
        return;
      }
      if ((c.kind === 'quiz' || c.kind === 'order') && !S.checked) { check(); return; }
      if (c.kind === 'result') {
        if (score() >= cfg.passMark) { btn.disabled = true; btn.textContent = 'Done'; speak('Saved. Next lesson when you are ready.', null); }
        else { S.idx = 0; S.firstTry = {}; S.answered = {}; S.done = {}; render(); }
        return;
      }
      S.idx++;
      render();
    });
    subBtn.addEventListener('click', function () { S.idx++; render(); });

    backBtn.addEventListener('click', function () {
      // From the gate, back lands on the last free card. Everywhere else, one card back.
      if (!cfg.free && cfg.gateAfter !== null && S.idx > cfg.gateAfter && !S.pro) S.idx = cfg.gateAfter;
      else if (S.idx > 0) S.idx--;
      render();
    });

    render();
  }

  window.CSLesson = { start: start };
})();
