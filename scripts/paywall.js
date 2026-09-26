/* =====================================================================
   CAMERAS DECODED — Pro paywall overlay
   One paywall, many doors: window.CDPaywall.show({headline, sub})
   Intercepts every "Unlock with Pro" link to /pro-checkout.html and
   opens this sheet instead. Self-contained: injects its own CSS.
   Title art: /custom-site-titles/pro-paywall.png (text fallback built in).
   ===================================================================== */
(function () {
  'use strict';
  if (window.CDPaywall) return;

  var TITLE_IMG = '/custom-site-titles/pro-paywall.png';
  var WEAVE = '/media/dossier-weave.jpg';

  var FEATURES = [
    { t: 'Full Darkroom Access', s: 'Composition, Color & Field Mastery — 14 Pro skills' },
    { t: 'Unlimited Missions Library', s: 'Every track, every phase' },
    { t: 'Unlimited Exam Retakes', s: 'Retake the final any time, free' },
    { t: 'Exclusive Arcade Access', s: 'Every game, no rotation' },
    { t: 'Field Manual Unlocked', s: 'Every chapter, every lesson' },
    { t: 'Camera Confidence Guide', s: 'The $97 guide, included', tag: 'ANNUAL' }
  ];

  var PLANS = [
    { id: 'weekly',  name: 'Weekly',  price: '$4.99',  per: '/week' },
    { id: 'monthly', name: 'Monthly', price: '$14.99', per: '/month' },
    { id: 'annual',  name: 'Annual',  price: '$119',   per: '/year', badge: 'SAVE 54%', note: 'Includes the Camera Confidence Guide' }
  ];

  var CONTEXTS = [
    [/darkroom/,      'Unlock the full Darkroom',   'Composition, Color & Field Mastery — 14 Pro skills.'],
    [/field-manual/,  'Unlock the Field Manual',    'Chapter 4 and beyond — every lesson, every quiz.'],
    [/mission/,       'Unlock the mission library', 'Every track, every phase.'],
    [/arcade/,        'Unlock the full arcade',     'Every game, no rotation.'],
    [/exam/,          'Never wait to retake',       'Pro members retake the final exam any time.'],
    [/founding/,      'Claim a Founding Decoder slot', 'Locked pricing for the first 200 decoders.']
  ];
  var DEFAULT_CTX = { headline: 'Go Pro', sub: 'Everything unlocked. Cancel anytime.' };

  /* ------------------------------- CSS ------------------------------- */
  var CSS = [
    '.pw-scrim{position:fixed;inset:0;z-index:20000;display:flex;align-items:flex-end;justify-content:center;',
    'background:rgba(2,6,2,.78);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);',
    'opacity:0;transition:opacity .28s ease;}',
    '.pw-scrim.pw-open{opacity:1;}',
    '@media(min-width:640px){.pw-scrim{align-items:center;padding:24px;}}',

    '.pw-sheet{position:relative;width:100%;max-width:480px;max-height:94dvh;overflow-y:auto;overscroll-behavior:contain;',
    'border-radius:26px 26px 0 0;border:1px solid rgba(141,235,0,.20);border-bottom:0;',
    'background:linear-gradient(175deg,#0b120a 0%,#070d07 55%,#0a140a 100%);',
    'box-shadow:0 -18px 80px rgba(0,0,0,.7),0 0 60px rgba(141,235,0,.07);',
    'transform:translateY(56px);transition:transform .42s cubic-bezier(.32,.72,.35,1);',
    '-webkit-overflow-scrolling:touch;}',
    '.pw-scrim.pw-open .pw-sheet{transform:translateY(0);}',
    '@media(min-width:640px){.pw-sheet{border-radius:26px;border-bottom:1px solid rgba(141,235,0,.20);}}',

    /* drifting ambient glow + dossier weave */
    '.pw-ambient{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit;}',
    '.pw-ambient::before{content:"";position:absolute;inset:-30%;',
    'background:radial-gradient(38% 30% at 18% 12%,rgba(141,235,0,.10),transparent 70%),',
    'radial-gradient(42% 34% at 85% 30%,rgba(141,235,0,.07),transparent 70%),',
    'radial-gradient(50% 40% at 50% 95%,rgba(141,235,0,.09),transparent 70%);',
    'animation:pwDrift 26s ease-in-out infinite alternate;}',
    '@keyframes pwDrift{from{transform:translate3d(-3%,-2%,0) scale(1);}to{transform:translate3d(3%,2%,0) scale(1.06);}}',
    '.pw-weave{position:absolute;inset:0;pointer-events:none;opacity:.5;mix-blend-mode:soft-light;border-radius:inherit;',
    'background-image:url("' + WEAVE + '");background-size:640px;}',
    '.pw-body{position:relative;padding:20px 20px 26px;}',

    '.pw-x{position:absolute;top:14px;right:14px;z-index:3;width:38px;height:38px;border-radius:50%;',
    'border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.45);color:#fff;font-size:17px;line-height:1;',
    'display:flex;align-items:center;justify-content:center;cursor:pointer;}',
    '.pw-x:active{transform:scale(.94);}',

    /* title: PNG-first, text fallback */
    '.pw-title{margin:6px 0 2px;text-align:center;}',
    '.pw-title img{display:block;width:min(300px,78%);margin:0 auto;filter:drop-shadow(0 0 22px rgba(141,235,0,.35));}',
    '.pw-title-fallback{display:none;}',
    '.pw-title-fallback .pw-brand{font-weight:900;font-size:34px;letter-spacing:.06em;color:#f2ffe0;',
    'text-shadow:0 0 26px rgba(141,235,0,.55);line-height:1.05;}',
    '.pw-pro{display:inline-block;margin-top:10px;padding:7px 22px;border-radius:999px;position:relative;overflow:hidden;',
    'font-weight:800;font-size:17px;letter-spacing:.04em;color:#06130a;',
    'background:linear-gradient(180deg,#b8ff5e,#8deb00 55%,#6fc400);',
    'box-shadow:0 0 26px rgba(141,235,0,.45),inset 0 1px 0 rgba(255,255,255,.55);}',
    '.pw-pro::after{content:"";position:absolute;top:0;bottom:0;width:45%;left:-60%;',
    'background:linear-gradient(100deg,transparent,rgba(255,255,255,.65),transparent);',
    'animation:pwShimmer 3.2s ease-in-out infinite;}',
    '@keyframes pwShimmer{0%{left:-60%;}55%,100%{left:130%;}}',

    '.pw-ctx{text-align:center;margin:16px 4px 4px;}',
    '.pw-ctx h2{margin:0 0 6px;font-size:21px;font-weight:800;color:#fff;letter-spacing:.01em;}',
    '.pw-ctx p{margin:0;font-size:13.5px;color:rgba(255,255,255,.62);line-height:1.5;}',

    /* feature rows */
    '.pw-feats{margin:18px 0 6px;display:flex;flex-direction:column;gap:10px;}',
    '.pw-feat{display:flex;align-items:center;gap:14px;padding:13px 16px;border-radius:999px;position:relative;',
    'background:rgba(0,0,0,.42);border:1px solid rgba(141,235,0,.12);',
    'opacity:0;transform:translateY(12px);animation:pwRowIn .5s cubic-bezier(.3,.7,.3,1) forwards;',
    'animation-delay:calc(var(--i)*75ms + 120ms);}',
    '@keyframes pwRowIn{to{opacity:1;transform:translateY(0);}}',
    '.pw-check{flex:0 0 auto;width:40px;height:40px;border-radius:50%;background:#050805;',
    'border:1px solid rgba(141,235,0,.25);display:flex;align-items:center;justify-content:center;}',
    '.pw-check svg{width:20px;height:20px;}',
    '.pw-feat b{display:block;color:#fff;font-size:15.5px;font-weight:700;letter-spacing:.01em;}',
    '.pw-feat span{display:block;color:rgba(255,255,255,.55);font-size:12px;margin-top:2px;}',
    '.pw-tag{position:absolute;top:-9px;right:18px;padding:3px 12px;border-radius:6px 12px 6px 12px;',
    'background:linear-gradient(180deg,#ffcf7d,#f0a840);color:#2a1500;font-size:10px;font-weight:900;letter-spacing:.12em;',
    'box-shadow:0 2px 10px rgba(240,168,64,.4);}',

    /* founding strip */
    '.pw-founding{margin:14px 2px 4px;padding:11px 14px;border-radius:14px;text-align:center;',
    'border:1px dashed rgba(141,235,0,.35);background:rgba(141,235,0,.06);',
    'color:#c9f27e;font-size:12.5px;font-weight:600;letter-spacing:.02em;}',
    '.pw-founding b{color:#8deb00;}',

    /* pricing */
    '.pw-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0 6px;}',
    '.pw-plan{position:relative;border-radius:18px;padding:14px 8px 12px;text-align:center;cursor:pointer;',
    'background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.12);transition:border-color .2s,background .2s,transform .15s;}',
    '.pw-plan:active{transform:scale(.97);}',
    '.pw-plan .pw-pname{display:block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.6);}',
    '.pw-plan .pw-pprice{display:block;margin:6px 0 0;font-size:23px;font-weight:900;color:#fff;}',
    '.pw-plan .pw-pper{display:block;font-size:11px;color:rgba(255,255,255,.5);}',
    '.pw-plan.pw-sel{border:2px solid #fff;background:rgba(141,235,0,.10);padding:13px 7px 11px;',
    'box-shadow:0 0 24px rgba(141,235,0,.18);}',
    '.pw-plan.pw-sel .pw-pprice{color:#b6ff4d;}',
    '.pw-save{position:absolute;top:-11px;left:50%;transform:translateX(-50%);white-space:nowrap;',
    'background:#fff;color:#0a7a3d;font-size:10.5px;font-weight:900;letter-spacing:.04em;',
    'padding:4px 12px;border-radius:999px;box-shadow:0 2px 12px rgba(0,0,0,.35);}',
    '.pw-pnote{grid-column:1/-1;text-align:center;font-size:11.5px;color:#c9f27e;margin-top:2px;}',

    /* signature chase continue button (page-unique .pw-go) */
    '@property --pw-angle{syntax:"<angle>";initial-value:0deg;inherits:false;}',
    '@keyframes pwSpin{to{--pw-angle:360deg;}}',
    '.pw-go{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:58px;',
    'margin-top:14px;border-radius:16px;border:1px solid transparent;cursor:pointer;',
    'font-weight:800;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#8deb00;',
    'text-shadow:0 0 18px rgba(141,235,0,.45);',
    'background:linear-gradient(120deg,rgba(255,255,255,.10),rgba(255,255,255,0) 42%),',
    'linear-gradient(165deg,rgba(141,235,0,.20) 0%,rgba(141,235,0,.07) 60%,rgba(141,235,0,.13) 100%);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 6px 22px rgba(141,235,0,.10);}',
    '.pw-go::before{content:"";position:absolute;inset:-.5px;border-radius:inherit;padding:1.5px;opacity:.45;pointer-events:none;',
    'background:conic-gradient(from var(--pw-angle,120deg),transparent 20%,#8deb00 40%,transparent 60%,#8deb00 80%,transparent 100%);',
    '-webkit-mask:linear-gradient(#000,#000) content-box,linear-gradient(#000,#000);-webkit-mask-composite:xor;',
    'mask:linear-gradient(#000,#000) content-box,linear-gradient(#000,#000);mask-composite:exclude;',
    'animation:pwSpin 6s linear infinite;}',
    '.pw-go:disabled{opacity:.55;cursor:wait;}',
    '.pw-cancel{text-align:center;margin:10px 0 0;font-size:12px;color:rgba(255,255,255,.45);}',

    '.pw-foot{margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.09);',
    'display:flex;justify-content:center;gap:8px;font-size:12.5px;}',
    '.pw-foot a{color:rgba(255,255,255,.5);text-decoration:none;padding:6px 4px;}',
    '.pw-foot a:active{color:#8deb00;}',
    '.pw-foot i{font-style:normal;color:rgba(255,255,255,.22);align-self:center;}',

    /* full-bleed mobile: the PNG IS the screen, transactional bottom overlays it */
    '@media(max-width:639px){',
    '.pw-sheet.pw-bleed{max-width:none;max-height:none;height:100svh;height:100dvh;border-radius:0;border:0;overflow:hidden;}',
    '.pw-sheet.pw-bleed .pw-ambient,.pw-sheet.pw-bleed .pw-weave{display:none;}',
    '.pw-sheet.pw-bleed .pw-title{position:absolute;inset:0;margin:0;z-index:0;}',
    '.pw-sheet.pw-bleed .pw-title img{width:100%;height:100%;object-fit:cover;object-position:center bottom;margin:0;filter:none;}',
    '.pw-sheet.pw-bleed .pw-body{position:absolute;left:0;right:0;bottom:0;z-index:2;',
    'padding:0 18px calc(8px + env(safe-area-inset-bottom,0px));}',
    '.pw-sheet.pw-bleed .pw-founding,.pw-sheet.pw-bleed .pw-cancel,.pw-sheet.pw-bleed .pw-pnote{display:none;}',
    '.pw-sheet.pw-bleed .pw-plans{margin:0 0 3px;gap:8px;}',
    '.pw-sheet.pw-bleed .pw-plan{padding:6px 4px 5px;background:rgba(0,0,0,.55);}',
    '.pw-sheet.pw-bleed .pw-plan.pw-sel{padding:5px 3px 4px;}',
    '.pw-sheet.pw-bleed .pw-plan .pw-pname{font-size:9px;letter-spacing:.14em;}',
    '.pw-sheet.pw-bleed .pw-plan .pw-pprice{font-size:16px;margin-top:2px;}',
    '.pw-sheet.pw-bleed .pw-plan .pw-pper{font-size:9px;}',
    '.pw-sheet.pw-bleed .pw-plan .pw-save{top:-9px;font-size:9px;padding:3px 8px;}',
    '.pw-sheet.pw-bleed .pw-go{margin-top:6px;height:44px;font-size:14px;',
    'background:linear-gradient(165deg,rgba(12,22,9,.94),rgba(5,9,5,.96));',
    'border:1px solid rgba(141,235,0,.38);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 10px 30px rgba(0,0,0,.50),0 0 26px rgba(141,235,0,.16);}',
    '.pw-sheet.pw-bleed .pw-go::before{opacity:.65;}',
    '.pw-sheet.pw-bleed .pw-foot{margin-top:4px;padding-top:4px;font-size:12px;}',
    '.pw-sheet.pw-bleed .pw-foot a{color:rgba(255,255,255,.78);}',
    '.pw-sheet.pw-bleed .pw-x{top:calc(12px + env(safe-area-inset-top,0px));}',
    '}',
    '/* Short phones (SE): compact further so the overlay stays inside the image green zone. */',
    '@media(max-width:639px) and (max-height:740px){',
    '.pw-sheet.pw-bleed .pw-plan{padding:4px 4px 3px;}',
    '.pw-sheet.pw-bleed .pw-plan.pw-sel{padding:3px 3px 2px;}',
    '.pw-sheet.pw-bleed .pw-plan .pw-pname{font-size:8px;}',
    '.pw-sheet.pw-bleed .pw-plan .pw-pprice{font-size:14px;margin-top:2px;}',
    '.pw-sheet.pw-bleed .pw-plan .pw-pper{display:none;}',
    '.pw-sheet.pw-bleed .pw-plan .pw-save{top:-7px;font-size:8px;padding:2px 7px;}',
    '.pw-sheet.pw-bleed .pw-go{height:40px;margin-top:6px;font-size:13px;}',
    '.pw-sheet.pw-bleed .pw-foot{margin-top:4px;padding-top:4px;font-size:11px;}',
    '.pw-sheet.pw-bleed .pw-body{padding:0 18px calc(6px + env(safe-area-inset-bottom,0px));}',
    '}',

    '@media(prefers-reduced-motion:reduce){',
    '.pw-scrim,.pw-sheet{transition:none;}',
    '.pw-feat{opacity:1;transform:none;animation:none;}',
    '.pw-ambient::before,.pw-pro::after,.pw-go::before{animation:none;}',
    '}'
  ].join('\n');

  /* ------------------------------ logic ------------------------------ */
  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#8deb00" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>';

  function ensureCSS() {
    if (document.getElementById('pw-css')) return;
    var s = document.createElement('style');
    s.id = 'pw-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var scrim = null, sheet = null, selectedPlan = 'annual', busy = false;

  function build() {
    ensureCSS();
    scrim = document.createElement('div');
    scrim.className = 'pw-scrim';
    scrim.setAttribute('role', 'dialog');
    scrim.setAttribute('aria-modal', 'true');
    scrim.setAttribute('aria-label', 'Cameras Decoded Pro');

    var feats = FEATURES.map(function (f, i) {
      return '<div class="pw-feat" style="--i:' + i + '">' +
        (f.tag ? '<span class="pw-tag">' + esc(f.tag) + '</span>' : '') +
        '<span class="pw-check">' + CHECK_SVG + '</span>' +
        '<span><b>' + esc(f.t) + '</b><span>' + esc(f.s) + '</span></span></div>';
    }).join('');

    var plans = PLANS.map(function (p) {
      return '<div class="pw-plan' + (p.id === selectedPlan ? ' pw-sel' : '') + '" data-plan="' + p.id + '" role="radio" aria-checked="' + (p.id === selectedPlan) + '" tabindex="0">' +
        (p.badge ? '<span class="pw-save">' + esc(p.badge) + '</span>' : '') +
        '<span class="pw-pname">' + esc(p.name) + '</span>' +
        '<span class="pw-pprice">' + esc(p.price) + '</span>' +
        '<span class="pw-pper">' + esc(p.per) + '</span></div>';
    }).join('') +
      '<div class="pw-pnote">Annual includes the Camera Confidence Guide.</div>';

    scrim.innerHTML =
      '<div class="pw-sheet"><div class="pw-ambient"></div><div class="pw-weave"></div>' +
      '<button class="pw-x" aria-label="Close">\u2715</button>' +
      '<div class="pw-title">' +
      '<img src="' + TITLE_IMG + '" alt="Cameras Decoded Pro" onload="var s=this.closest(\'.pw-sheet\');if(s){s.classList.add(\'pw-bleed\');var f=s.querySelector(\'.pw-feats\');if(f)f.style.display=\'none\';var c=s.querySelector(\'.pw-ctx\');if(c)c.style.display=\'none\';}" onerror="this.style.display=\'none\';var f=this.parentNode.querySelector(\'.pw-title-fallback\');if(f)f.style.display=\'block\';">' +
      '<div class="pw-title-fallback"><div class="pw-brand">CAMERAS<br>DECODED</div><span class="pw-pro">Pro</span></div>' +
      '</div>' +
      '<div class="pw-body">' +
      '<div class="pw-ctx"><h2 class="pw-h"></h2><p class="pw-sub"></p></div>' +
      '<div class="pw-feats">' + feats + '</div>' +
      '<div class="pw-founding"><b>Founding Decoder</b> — locked pricing for the first 200. When they\u2019re gone, they\u2019re gone.</div>' +
      '<div class="pw-plans" role="radiogroup" aria-label="Choose a plan">' + plans + '</div>' +
      '<button class="pw-go"><span>Continue</span></button>' +
      '<p class="pw-cancel">Cancel anytime. Streaks, leaderboard and daily drill stay free forever.</p>' +
      '<div class="pw-foot"><a href="/protocols.html">Protocols</a><i>|</i><a href="/blog-updates.html">Blog</a><i>|</i><a href="/faq.html">FAQ</a></div>' +
      '</div></div>';

    document.body.appendChild(scrim);
    sheet = scrim.querySelector('.pw-sheet');

    scrim.querySelector('.pw-x').addEventListener('click', hide);
    scrim.addEventListener('click', function (e) { if (e.target === scrim) hide(); });
    scrim.querySelector('.pw-go').addEventListener('click', function () { go(selectedPlan); });

    var planEls = scrim.querySelectorAll('.pw-plan');
    function pick(id) {
      selectedPlan = id;
      for (var i = 0; i < planEls.length; i++) {
        var on = planEls[i].dataset.plan === id;
        planEls[i].classList.toggle('pw-sel', on);
        planEls[i].setAttribute('aria-checked', on ? 'true' : 'false');
      }
    }
    for (var j = 0; j < planEls.length; j++) {
      (function (el) {
        el.addEventListener('click', function () { pick(el.dataset.plan); });
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(el.dataset.plan); }
        });
      })(planEls[j]);
    }
  }

  function currentUser() {
    try { return window.auth && window.auth.currentUser ? window.auth.currentUser : null; }
    catch (e) { return null; }
  }
  function isPro() {
    try { return window.USER && String(window.USER.tier || '').toLowerCase() === 'pro'; }
    catch (e) { return false; }
  }

  function getPaymentLink(plan) {
    return new Promise(function (resolve) {
      function done(v) { resolve(v || null); }
      try {
        if (window.CDPro && window.CDPro.getPaymentLinks) {
          window.CDPro.getPaymentLinks().then(function (l) { done(l && l[plan]); }, function () { done(null); });
          return;
        }
        var db = window.db;
        if (db && db.collection) {
          db.collection('config').doc('payments').get().then(function (s) {
            var d = s.exists ? (s.data() || {}) : {};
            done(d[plan]);
          }, function () { done(null); });
          return;
        }
      } catch (e) { /* fall through */ }
      done(null);
    });
  }

  function go(plan) {
    if (busy) return;
    if (isPro()) { window.location.href = '/pro-checkout.html'; return; }
    if (!currentUser()) {
      try { sessionStorage.setItem('cd_post_login_redirect', '/pro-checkout.html?plan=' + plan); } catch (e) {}
      window.location.href = '/login.html';
      return;
    }
    busy = true;
    var btn = scrim.querySelector('.pw-go');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Loading…';
    getPaymentLink(plan).then(function (link) {
      busy = false;
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Continue';
      window.location.href = link || ('/pro-checkout.html?plan=' + plan);
    });
  }

  function contextFor(anchor) {
    var d = (anchor && anchor.dataset) || {};
    if (d.pwHeadline) return { headline: d.pwHeadline, sub: d.pwSub || '' };
    var path = '';
    try { path = window.location.pathname + ' ' + (anchor.getAttribute('href') || ''); } catch (e) {}
    for (var i = 0; i < CONTEXTS.length; i++) {
      if (CONTEXTS[i][0].test(path)) return { headline: CONTEXTS[i][1], sub: CONTEXTS[i][2] };
    }
    return DEFAULT_CTX;
  }

  function show(ctx) {
    if (isPro()) { window.location.href = '/pro-checkout.html'; return; }
    if (!scrim) build();
    ctx = ctx || DEFAULT_CTX;
    scrim.querySelector('.pw-h').textContent = ctx.headline || DEFAULT_CTX.headline;
    scrim.querySelector('.pw-sub').textContent = ctx.sub || DEFAULT_CTX.sub;
    /* restart row stagger */
    var feats = scrim.querySelectorAll('.pw-feat');
    for (var i = 0; i < feats.length; i++) {
      feats[i].style.animation = 'none';
      void feats[i].offsetWidth;
      feats[i].style.animation = '';
    }
    document.body.style.overflow = 'hidden';
    scrim.style.display = 'flex';
    requestAnimationFrame(function () { requestAnimationFrame(function () { scrim.classList.add('pw-open'); }); });
  }

  function hide() {
    if (!scrim) return;
    scrim.classList.remove('pw-open');
    document.body.style.overflow = '';
    setTimeout(function () { scrim.style.display = 'none'; }, 300);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && scrim && scrim.classList.contains('pw-open')) hide();
  });

  /* One paywall, many doors: every "Unlock with Pro" link opens the sheet. */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('a[href*="pro-checkout"]') : null;
    if (!t || t.dataset.pw === 'off') return;
    e.preventDefault();
    show(contextFor(t));
  });

  window.CDPaywall = {
    show: show,
    hide: hide,
    /* Named contexts for direct opens — the paywall IS the locked state. */
    ctx: {
      darkroom: { headline: 'Unlock the full Darkroom', sub: 'Composition, Color & Field Mastery — 14 Pro skills.' },
      ceiling:  { headline: 'You\u2019ve decoded everything free', sub: 'All 9 free lessons are done. 14 Pro skills are behind this door.' }
    }
  };
})();
