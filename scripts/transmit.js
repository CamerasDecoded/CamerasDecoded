/* transmit.js — "Transmit this protocol" share sheet.
   window.CDTransmit.open({ n: '007', title: '...', hook: '...' })
   Renders the static dossier card (/media/protocol-cards/protocol-NNN.png),
   shares it via the native share sheet, saves it, or copies the link.
   Signed-in users get ?ref=<referralCode> appended when available. */
(function () {
  'use strict';

  var NEON = '#8deb00';
  var _refCode = null;      // cached referral code
  var _refTried = false;
  var _sheet = null, _backdrop = null, _toast = null, _cur = null;

  var CSS =
    '.cdt-backdrop{position:fixed;inset:0;z-index:12000;background:rgba(0,0,0,.72);' +
    'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;' +
    'align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .22s ease}' +
    '.cdt-backdrop.cdt-open{opacity:1;pointer-events:auto}' +
    '.cdt-sheet{width:100%;max-width:520px;max-height:92dvh;overflow-y:auto;' +
    'background:#0b0b0b;border:1px solid rgba(141,235,0,.28);border-bottom:0;' +
    'border-radius:18px 18px 0 0;padding:14px 20px calc(20px + env(safe-area-inset-bottom));' +
    'transform:translateY(26px);transition:transform .26s cubic-bezier(.2,.9,.25,1);' +
    'box-shadow:0 -12px 60px rgba(141,235,0,.10)}' +
    '.cdt-backdrop.cdt-open .cdt-sheet{transform:translateY(0)}' +
    '.cdt-grip{width:44px;height:5px;border-radius:3px;background:#2a2a2a;margin:2px auto 14px}' +
    '.cdt-eyebrow{font-family:"Space Mono",monospace;font-size:10px;letter-spacing:3px;' +
    'color:' + NEON + ';text-transform:uppercase;margin-bottom:12px;text-align:center}' +
    '.cdt-card{display:block;width:100%;height:auto;border-radius:10px;' +
    'border:1px solid rgba(141,235,0,.22);box-shadow:0 8px 34px rgba(0,0,0,.6)}' +
    '.cdt-title{font-family:"Space Mono",monospace;font-size:12px;color:#cfcfcf;' +
    'letter-spacing:.04em;margin:14px 2px 16px;text-align:center}' +
    '.cdt-title b{color:#fff}' +
    '@property --cdt-angle{syntax:"<angle>";initial-value:0deg;inherits:false}' +
    '@keyframes cdtSpin{to{--cdt-angle:360deg}}' +
    '.cdt-primary{position:relative;display:block;width:100%;border-radius:12px;padding:15px 18px;' +
    'border:1px solid transparent;cursor:pointer;margin:0 0 10px;' +
    'background:linear-gradient(120deg,rgba(255,255,255,.10),rgba(255,255,255,0) 42%),' +
    'linear-gradient(165deg,rgba(141,235,0,.20) 0%,rgba(141,235,0,.07) 60%,rgba(141,235,0,.13) 100%);' +
    'color:#fff;font-family:"Space Mono",monospace;font-size:13px;letter-spacing:2px;text-transform:uppercase}' +
    '.cdt-primary::before{content:"";position:absolute;inset:-0.5px;border-radius:inherit;padding:0.5px;' +
    'background:conic-gradient(from var(--cdt-angle),transparent 20%,' + NEON + ' 40%,transparent 60%,' + NEON + ' 80%,transparent 100%);' +
    '-webkit-mask:linear-gradient(#000,#000) content-box,linear-gradient(#000,#000);' +
    '-webkit-mask-composite:xor;mask:linear-gradient(#000,#000) content-box,linear-gradient(#000,#000);' +
    'mask-composite:exclude;pointer-events:none;opacity:.4}' +
    '@media (prefers-reduced-motion:no-preference){.cdt-primary::before{animation:cdtSpin 6s linear infinite}}' +
    '.cdt-row{display:flex;gap:10px}' +
    '.cdt-ghost{flex:1;border-radius:12px;padding:13px 10px;cursor:pointer;' +
    'background:transparent;border:1px solid rgba(141,235,0,.25);color:' + NEON + ';' +
    'font-family:"Space Mono",monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase}' +
    '.cdt-ghost:active{background:rgba(141,235,0,.08)}' +
    '.cdt-note{font-family:"Space Mono",monospace;font-size:10.5px;color:#777;letter-spacing:.04em;' +
    'text-align:center;margin:14px 4px 0;line-height:1.6}' +
    '.cdt-close{position:absolute;top:10px;right:14px;background:none;border:0;color:#777;' +
    'font-size:22px;cursor:pointer;line-height:1;padding:6px}' +
    '.cdt-toast{position:fixed;left:50%;bottom:calc(28px + env(safe-area-inset-bottom));' +
    'transform:translateX(-50%) translateY(8px);background:#101010;color:#fff;' +
    'border:1px solid rgba(141,235,0,.4);border-radius:10px;padding:11px 18px;' +
    'font-family:"Space Mono",monospace;font-size:12px;letter-spacing:.05em;z-index:12001;' +
    'opacity:0;pointer-events:none;transition:opacity .2s ease,transform .2s ease;white-space:nowrap}' +
    '.cdt-toast.cdt-show{opacity:1;transform:translateX(-50%) translateY(0)}' +
    '@media (prefers-reduced-motion:reduce){.cdt-backdrop,.cdt-sheet,.cdt-toast{transition:none}' +
    '.cdt-sheet{transform:none}}' +
    '@media (min-width:560px){.cdt-backdrop{align-items:center}.cdt-sheet{border-bottom:1px solid rgba(141,235,0,.28);border-radius:18px}}';

  function ensureCSS() {
    if (document.getElementById('cdt-css')) return;
    var s = document.createElement('style');
    s.id = 'cdt-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function toast(msg) {
    if (!_toast) {
      _toast = document.createElement('div');
      _toast.className = 'cdt-toast';
      document.body.appendChild(_toast);
    }
    _toast.textContent = msg;
    _toast.classList.add('cdt-show');
    clearTimeout(_toast._t);
    _toast._t = setTimeout(function () { _toast.classList.remove('cdt-show'); }, 2200);
  }

  function user() {
    return (typeof window.USER !== 'undefined' && window.USER) || null;
  }

  function referralCode() {
    return new Promise(function (resolve) {
      if (_refTried) return resolve(_refCode);
      _refTried = true;
      var u = user();
      if (!u || !u.isLoggedIn || !u.uid) return resolve(null);
      try {
        if (typeof firebase === 'undefined' || !firebase.firestore) return resolve(null);
        firebase.firestore().collection('users').doc(u.uid).get().then(function (doc) {
          _refCode = (doc.exists && doc.data().referralCode) || null;
          resolve(_refCode);
        }).catch(function () { resolve(null); });
      } catch (e) { resolve(null); }
    });
  }

  function link() {
    return referralCode().then(function (code) {
      var url = 'https://camerasdecoded.com/protocol-' + _cur.n + '.html';
      if (code) url += '?ref=' + encodeURIComponent(code);
      return url;
    });
  }

  function shareText() {
    var hook = (_cur.hook || '').trim();
    if (hook.length > 140) hook = hook.slice(0, 137).trim() + '…';
    return 'Protocol ' + _cur.n + ': ' + _cur.title + (hook ? ' — ' + hook : '');
  }

  function copyText(str, okMsg) {
    function done() { toast(okMsg); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(str).then(done, function () { fallback(); });
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = str;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); }
      catch (e) { toast('Copy failed — long-press the link'); }
      document.body.removeChild(ta);
    }
  }

  function shareCard() {
    var urlP = link();
    var text = shareText();
    var img = '/media/protocol-cards/protocol-' + _cur.n + '.png';
    urlP.then(function (url) {
      fetch(img).then(function (r) { return r.blob(); }).then(function (blob) {
        var file = new File([blob], 'protocol-' + _cur.n + '.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          return navigator.share({ files: [file], title: 'Protocol ' + _cur.n, text: text, url: url });
        }
        throw new Error('no-file-share');
      }).catch(function () {
        if (navigator.share) return navigator.share({ title: 'Protocol ' + _cur.n, text: text, url: url });
        throw new Error('no-share');
      }).catch(function (e) {
        if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) return; // user dismissed
        copyText(url, 'Link copied — transmit away');
      });
    });
  }

  function saveImage() {
    var img = '/media/protocol-cards/protocol-' + _cur.n + '.png';
    fetch(img).then(function (r) { return r.blob(); }).then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'protocol-' + _cur.n + '-cameras-decoded.png';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
      toast('Card saved');
    }).catch(function () { toast('Could not save — try again'); });
  }

  function build() {
    _backdrop = document.createElement('div');
    _backdrop.className = 'cdt-backdrop';
    _backdrop.innerHTML =
      '<div class="cdt-sheet" role="dialog" aria-modal="true" aria-label="Transmit protocol">' +
      '<button class="cdt-close" aria-label="Close">×</button>' +
      '<div class="cdt-grip"></div>' +
      '<div class="cdt-eyebrow">Transmit protocol</div>' +
      '<img class="cdt-card" alt="">' +
      '<div class="cdt-title"></div>' +
      '<button class="cdt-primary" data-act="share">⇪&nbsp; Share card</button>' +
      '<div class="cdt-row">' +
      '<button class="cdt-ghost" data-act="save">Save image</button>' +
      '<button class="cdt-ghost" data-act="copy">Copy link</button>' +
      '</div>' +
      '<div class="cdt-note"></div>' +
      '</div>';
    document.body.appendChild(_backdrop);
    _sheet = _backdrop.firstElementChild;
    _backdrop.addEventListener('click', function (e) {
      if (e.target === _backdrop) close();
    });
    _sheet.querySelector('.cdt-close').addEventListener('click', close);
    _sheet.querySelector('[data-act="share"]').addEventListener('click', shareCard);
    _sheet.querySelector('[data-act="save"]').addEventListener('click', saveImage);
    _sheet.querySelector('[data-act="copy"]').addEventListener('click', function () {
      link().then(function (url) { copyText(url, 'Link copied — transmit away'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _backdrop.classList.contains('cdt-open')) close();
    });
  }

  function open(opts) {
    if (!opts || !opts.n) return;
    ensureCSS();
    if (!_backdrop) build();
    _cur = { n: opts.n, title: opts.title || '', hook: opts.hook || '' };
    var img = _sheet.querySelector('.cdt-card');
    img.src = '/media/protocol-cards/protocol-' + _cur.n + '.png';
    img.alt = 'Protocol ' + _cur.n + ' share card';
    _sheet.querySelector('.cdt-title').innerHTML =
      'N° <b>' + _cur.n + '</b> · ' + escapeHtml(_cur.title);
    var u = user();
    _sheet.querySelector('.cdt-note').textContent =
      (u && u.isLoggedIn)
        ? 'Your link carries your referral code.'
        : 'Tip: sign in and your link will carry your referral code.';
    _backdrop.classList.add('cdt-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!_backdrop) return;
    _backdrop.classList.remove('cdt-open');
    document.body.style.overflow = '';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Auto-bind: any [data-transmit] element opens the sheet.
  // data-n="007" data-title="..." data-hook="..."
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-transmit]') : null;
    if (!el) return;
    e.preventDefault();
    open({ n: el.getAttribute('data-n'), title: el.getAttribute('data-title'), hook: el.getAttribute('data-hook') });
  });

  window.CDTransmit = { open: open, close: close };
})();
