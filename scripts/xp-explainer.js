/* ============================================================================
   CDXpExplainer — "How XP works" scrollable bottom-sheet modal.
   Shared, self-contained (injects its own CSS). No dependencies.
   Usage: window.CDXpExplainer.open() / .close()
   Entry points: Darkroom locked-skill sheet, dashboard XP detail modal.
   ============================================================================ */
(function () {
  'use strict';
  if (window.CDXpExplainer) return;

  var GREEN = '#8deb00';
  var IMG_NUMBERS = '/media/xp-two-numbers.jpg';
  var IMG_CLIMB = '/media/xp-the-climb.jpg';

  var CSS = [
    '.xpx-scrim{position:fixed;inset:0;z-index:1200;display:flex;align-items:flex-end;justify-content:center;',
    'background:rgba(4,6,3,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);',
    'opacity:0;transition:opacity .28s ease;}',
    '.xpx-scrim.on{opacity:1;}',
    '.xpx-scrim[hidden]{display:none;}',
    '.xpx-sheet{width:100%;max-width:560px;max-height:88vh;max-height:88dvh;background:#0b0e08;',
    'border:1px solid rgba(141,235,0,.22);border-bottom:none;border-radius:20px 20px 0 0;',
    'box-shadow:0 -18px 60px rgba(0,0,0,.6),0 0 40px rgba(141,235,0,.08);',
    'transform:translateY(36px);transition:transform .32s cubic-bezier(.22,.9,.28,1);',
    'display:flex;flex-direction:column;overflow:hidden;position:relative;}',
    '.xpx-scrim.on .xpx-sheet{transform:translateY(0);}',
    '.xpx-grab{width:44px;height:5px;border-radius:3px;background:rgba(255,255,255,.22);margin:10px auto 0;flex:none;}',
    '.xpx-close{position:absolute;top:12px;right:12px;z-index:2;width:36px;height:36px;border-radius:50%;',
    'border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.5);color:#fff;font-size:18px;line-height:1;',
    'display:flex;align-items:center;justify-content:center;cursor:pointer;}',
    '.xpx-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;padding:18px 20px 26px;}',
    '.xpx-kicker{font-size:11px;letter-spacing:.28em;color:' + GREEN + ';font-weight:700;margin:0 0 8px;}',
    '.xpx-title{font-size:30px;line-height:1.1;margin:0 0 6px;color:#fff;font-weight:800;letter-spacing:-.01em;}',
    '.xpx-sub{color:rgba(255,255,255,.62);font-size:14.5px;line-height:1.55;margin:0 0 18px;}',
    '.xpx-banner{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:14px;display:block;',
    'border:1px solid rgba(141,235,0,.16);margin:0 0 18px;background:#000;}',
    '.xpx-h{font-size:12px;letter-spacing:.22em;color:rgba(255,255,255,.55);font-weight:700;margin:26px 0 12px;}',
    '.xpx-h:first-of-type{margin-top:0;}',
    '.xpx-duo{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
    '.xpx-card{background:rgba(141,235,0,.05);border:1px solid rgba(141,235,0,.18);border-radius:14px;padding:14px;}',
    '.xpx-card b{display:block;color:' + GREEN + ';font-size:12px;letter-spacing:.14em;margin-bottom:6px;}',
    '.xpx-card p{margin:0;color:rgba(255,255,255,.72);font-size:13.5px;line-height:1.5;}',
    '.xpx-card p strong{color:#fff;}',
    '.xpx-rows{display:flex;flex-direction:column;gap:8px;}',
    '.xpx-row{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.03);',
    'border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:11px 12px;}',
    '.xpx-amt{flex:none;min-width:64px;text-align:center;font-weight:800;color:' + GREEN + ';font-size:14px;',
    'background:rgba(141,235,0,.09);border:1px solid rgba(141,235,0,.25);border-radius:9px;padding:6px 4px;}',
    '.xpx-what{flex:1;min-width:0;}',
    '.xpx-what b{display:block;color:#fff;font-size:13.5px;font-weight:700;}',
    '.xpx-what span{color:rgba(255,255,255,.55);font-size:12.5px;}',
    '.xpx-ladder{display:flex;flex-direction:column;gap:0;margin:4px 0 6px;}',
    '.xpx-rung{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:12px;',
    'border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);position:relative;}',
    '.xpx-rung + .xpx-rung{margin-top:8px;}',
    '.xpx-lvl{flex:none;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
    'font-weight:800;font-size:15px;color:#fff;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.04);}',
    '.xpx-rung b{display:block;color:#fff;font-size:14px;}',
    '.xpx-rung span{color:rgba(255,255,255,.55);font-size:12.5px;}',
    '.xpx-rung.gate{border-color:rgba(141,235,0,.55);background:rgba(141,235,0,.07);',
    'box-shadow:0 0 24px rgba(141,235,0,.12);}',
    '.xpx-rung.gate .xpx-lvl{color:#0b0e08;background:' + GREEN + ';border-color:' + GREEN + ';}',
    '.xpx-tag{position:absolute;top:-9px;right:12px;font-size:10px;font-weight:800;letter-spacing:.18em;',
    'color:#0b0e08;background:' + GREEN + ';border-radius:6px;padding:3px 8px;}',
    '.xpx-note{color:rgba(255,255,255,.66);font-size:13.5px;line-height:1.6;margin:12px 2px 0;}',
    '.xpx-note strong{color:' + GREEN + ';}',
    '.xpx-why{display:flex;flex-direction:column;gap:10px;}',
    '.xpx-why div{background:rgba(255,255,255,.03);border-left:2px solid ' + GREEN + ';border-radius:0 10px 10px 0;',
    'padding:11px 13px;color:rgba(255,255,255,.78);font-size:13.5px;line-height:1.55;}',
    '.xpx-why div b{color:#fff;}',
    '.xpx-cta{display:block;width:100%;margin:24px 0 4px;padding:15px;border:none;border-radius:14px;cursor:pointer;',
    'background:' + GREEN + ';color:#0b0e08;font-size:16px;font-weight:800;letter-spacing:.02em;}',
    '.xpx-cta:active{transform:scale(.985);}',
    '.xpx-fine{text-align:center;color:rgba(255,255,255,.38);font-size:12px;margin:10px 0 0;}',
    '.xpx-inline-link{background:none;border:none;padding:0;margin:10px 0 0;color:' + GREEN + ';' +
    'font-size:13px;font-weight:700;cursor:pointer;text-decoration:underline;text-underline-offset:3px;' +
    'display:inline-block;font-family:inherit;}',
    '@media (prefers-reduced-motion:reduce){.xpx-scrim,.xpx-sheet{transition:none;}}'
  ].join('\n');

  var EARN = [
    { amt: '+20', what: 'Darkroom lesson', rule: 'Once per skill · banked at the check' },
    { amt: '+10', what: 'Darkroom drill', rule: 'Once per skill, per day · finishing is enough' },
    { amt: '+20', what: 'Field Manual lesson', rule: 'Once per lesson' },
    { amt: '+10', what: 'Field Manual perfect quiz', rule: 'Once per lesson · all answers right' },
    { amt: '+25', what: 'Field Manual chapter', rule: 'Once per chapter' },
    { amt: '+10', what: "Today's Challenge", rule: 'Once per day · extends your streak' },
    { amt: 'varies', what: 'Game Arcade', rule: 'First scored play per game, per day' },
    { amt: '+10', what: 'Snapshot save', rule: 'Once ever · your first saved card' }
  ];

  var RUNGS = [
    { lvl: 1, xp: 20, name: 'Started', sub: 'One lesson in. You have seen the shape of it.' },
    { lvl: 2, xp: 40, name: 'Functional', sub: 'Working knowledge. This is the gate.', gate: true },
    { lvl: 3, xp: 140, name: 'Solid', sub: 'Instinct is forming. Keep the reps coming.' },
    { lvl: 4, xp: 260, name: 'Advanced', sub: 'You see light before you raise the camera.' },
    { lvl: 5, xp: 400, name: 'Mastered', sub: 'The skill is yours. It does not fade.' }
  ];

  var WHY = [
    '<b>Advancement is earned, never automatic.</b> The next skill opens only when the one before it is functional — not when you have merely visited it.',
    '<b>Daily-scoped earning keeps it honest.</b> Drills, challenges and arcade banks refresh each day, so consistency beats grinding.',
    '<b>Streaks and the leaderboard are never gated.</b> The loop that brings you back every day stays free for everyone.',
    '<b>Free to play, pay to master.</b> Foundations are free; the deep craft — Composition, Color, Field Mastery — is Pro.'
  ];

  var scrim = null, lastFocus = null, cssInjected = false;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function injectCss() {
    if (cssInjected) return;
    cssInjected = true;
    var st = document.createElement('style');
    st.setAttribute('data-xpx', '1');
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function build() {
    injectCss();
    var earnHtml = EARN.map(function (r) {
      return '<div class="xpx-row"><div class="xpx-amt">' + esc(r.amt) + '</div>' +
        '<div class="xpx-what"><b>' + esc(r.what) + '</b><span>' + esc(r.rule) + '</span></div></div>';
    }).join('');
    var rungHtml = RUNGS.map(function (r) {
      return '<div class="xpx-rung' + (r.gate ? ' gate' : '') + '">' +
        (r.gate ? '<span class="xpx-tag">THE GATE</span>' : '') +
        '<div class="xpx-lvl">' + r.lvl + '</div>' +
        '<div><b>' + esc(r.name) + ' · ' + r.xp + ' XP</b><span>' + esc(r.sub) + '</span></div></div>';
    }).join('');
    var whyHtml = WHY.map(function (w) { return '<div>' + w + '</div>'; }).join('');

    scrim = document.createElement('div');
    scrim.className = 'xpx-scrim';
    scrim.hidden = true;
    scrim.innerHTML =
      '<div class="xpx-sheet" role="dialog" aria-modal="true" aria-labelledby="xpxTitle">' +
      '<div class="xpx-grab"></div>' +
      '<button class="xpx-close" type="button" aria-label="Close">\u00d7</button>' +
      '<div class="xpx-scroll">' +
      '<p class="xpx-kicker">THE XP SYSTEM</p>' +
      '<h2 class="xpx-title" id="xpxTitle">How XP works</h2>' +
      '<p class="xpx-sub">Two numbers, five levels, one rule: nothing here is given. It is earned.</p>' +
      '<img class="xpx-banner" src="' + IMG_NUMBERS + '" alt="" loading="lazy">' +
      '<p class="xpx-h">TWO NUMBERS</p>' +
      '<div class="xpx-duo">' +
      '<div class="xpx-card"><b>TODAY\u2019S XP</b><p>Resets at midnight. The ring on your dashboard. <strong>Goal: 100.</strong></p></div>' +
      '<div class="xpx-card"><b>TOTAL POINTS</b><p>Never resets. Your lifetime signal. <strong>Drives your rank.</strong></p></div>' +
      '</div>' +
      '<p class="xpx-h">WHERE XP COMES FROM</p>' +
      '<div class="xpx-rows">' + earnHtml + '</div>' +
      '<img class="xpx-banner" src="' + IMG_CLIMB + '" alt="" loading="lazy" style="margin-top:22px">' +
      '<p class="xpx-h">THE CLIMB</p>' +
      '<div class="xpx-ladder">' + rungHtml + '</div>' +
      '<p class="xpx-note"><strong>Level 2 (40 XP) is the gate.</strong> The next skill unlocks only when the one before it reaches Functional. A lesson alone (+20) will not do it — daily drills carry you the rest of the way. That is deliberate.</p>' +
      '<p class="xpx-h">WHY IT IS BUILT THIS WAY</p>' +
      '<div class="xpx-why">' + whyHtml + '</div>' +
      '<button class="xpx-cta" type="button">Got it</button>' +
      '<p class="xpx-fine">Cameras Decoded · Develop your eye</p>' +
      '</div></div>';
    document.body.appendChild(scrim);
    scrim.querySelector('.xpx-close').addEventListener('click', close);
    scrim.querySelector('.xpx-cta').addEventListener('click', close);
    scrim.addEventListener('click', function (e) { if (e.target === scrim) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && scrim && !scrim.hidden) close();
    });
  }

  function open() {
    if (!scrim) build();
    lastFocus = document.activeElement;
    scrim.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { scrim.classList.add('on'); });
    var c = scrim.querySelector('.xpx-close');
    if (c) { try { c.focus({ preventScroll: true }); } catch (e) { try { c.focus(); } catch (e2) {} } }
    var sc = scrim.querySelector('.xpx-scroll');
    if (sc) sc.scrollTop = 0;
  }

  function close() {
    if (!scrim || scrim.hidden) return;
    scrim.classList.remove('on');
    document.body.style.overflow = '';
    setTimeout(function () { scrim.hidden = true; }, 300);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  }

  window.CDXpExplainer = { open: open, close: close };
})();
