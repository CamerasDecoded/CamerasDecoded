/* scripts/install.js — window.CDInstall
   "Install the app" experience: registers the service worker and opens a
   premium bottom sheet that adapts to the platform —
     • Android/desktop Chrome with an install prompt captured: true one-tap install.
     • iPhone/iPad: the Share → Add to Home Screen walkthrough (Apple allows no
       programmatic install; this is the sanctioned path).
     • Already running standalone: quiet confirmation state.
     • Anything else: generic browser-menu guidance.
   Self-contained CSS (cdi-*), reduced-motion safe, Escape/backdrop/Got-it dismiss.
   The beforeinstallprompt event is captured early by master-loader into
   window.__cdDeferredPrompt (it can fire before this script loads); a second
   listener here covers the late-fire case. */
(function () {
  'use strict';
  if (window.CDInstall) return;

  /* ---------- service worker ---------- */
  if ('serviceWorker' in navigator && /^(https?:)$/.test(location.protocol)) {
    const register = () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register);
  }

  /* ---------- install prompt capture (late-fire safety net) ---------- */
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.__cdDeferredPrompt = e;
  });

  /* ---------- platform detection ---------- */
  const ua = navigator.userAgent || '';
  const isIOS = /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true;

  function mode() {
    if (isStandalone) return 'installed';
    if (window.__cdDeferredPrompt) return 'prompt';
    if (isIOS) return 'ios';
    return 'generic';
  }

  /* ---------- styles ---------- */
  const CSS = `
.cdi-scrim{position:fixed;inset:0;z-index:400;display:flex;align-items:flex-end;justify-content:center;
  background:rgba(4,5,4,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  opacity:0;pointer-events:none;transition:opacity .28s ease}
.cdi-scrim.cdi-open{opacity:1;pointer-events:auto}
.cdi-sheet{width:min(520px,100%);max-height:88vh;max-height:88dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;
  background:linear-gradient(180deg,#101311 0%,#0a0c0a 100%);
  border:1px solid rgba(141,235,0,.22);border-bottom:none;border-radius:22px 22px 0 0;
  padding:14px 22px calc(26px + env(safe-area-inset-bottom));
  box-shadow:0 -18px 60px rgba(0,0,0,.6),0 0 40px rgba(141,235,0,.06);
  transform:translateY(48px);transition:transform .32s cubic-bezier(.32,.72,.28,1);
  color:#f2f5ee;font-family:Montserrat,system-ui,sans-serif}
.cdi-scrim.cdi-open .cdi-sheet{transform:none}
.cdi-handle{width:44px;height:5px;border-radius:5px;background:rgba(255,255,255,.22);margin:2px auto 18px}
.cdi-close{position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:12px;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);color:#cfd6c9;
  font-size:18px;line-height:1;cursor:pointer}
.cdi-close:hover{border-color:rgba(141,235,0,.5);color:#8deb00}
.cdi-hero{display:flex;gap:16px;align-items:center;margin-bottom:6px}
.cdi-icon{width:64px;height:64px;border-radius:22.5%;flex:0 0 64px;overflow:hidden;
  box-shadow:0 6px 24px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.08)}
.cdi-icon img{width:100%;height:100%;object-fit:cover;display:block}
.cdi-hero h2{margin:0;font-family:"Space Mono",ui-monospace,monospace;font-size:19px;color:#8deb00;letter-spacing:-.01em}
.cdi-hero p{margin:5px 0 0;font-size:13px;color:rgba(255,255,255,.62);line-height:1.5}
.cdi-steps{list-style:none;margin:18px 0 6px;padding:0;display:grid;gap:12px}
.cdi-steps li{display:flex;gap:13px;align-items:flex-start;background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:13px 14px}
.cdi-n{flex:0 0 30px;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;
  font-family:"Space Mono",monospace;font-size:13px;font-weight:700;color:#0a0c08;background:#8deb00;
  box-shadow:0 0 14px rgba(141,235,0,.45)}
.cdi-steps b{display:block;font-size:14px;margin-bottom:2px}
.cdi-steps span{font-size:12.5px;color:rgba(255,255,255,.6);line-height:1.55}
.cdi-steps .cdi-share-ic{display:inline-block;vertical-align:-3px;width:17px;height:17px;color:#8deb00}
.cdi-cta{display:block;width:100%;margin-top:18px;padding:15px;border:none;border-radius:14px;cursor:pointer;
  background:#8deb00;color:#0a0c08;font-family:"Space Mono",monospace;font-weight:700;font-size:15px;letter-spacing:.02em;
  box-shadow:0 8px 30px rgba(141,235,0,.35);transition:transform .15s ease,box-shadow .2s ease}
.cdi-cta:hover{box-shadow:0 8px 38px rgba(141,235,0,.5)}
.cdi-cta:active{transform:scale(.98)}
.cdi-cta:disabled{opacity:.55;cursor:default;transform:none}
.cdi-quiet{display:block;width:100%;margin-top:10px;padding:12px;background:transparent;border:none;cursor:pointer;
  color:rgba(255,255,255,.5);font-size:13px;font-family:inherit}
.cdi-quiet:hover{color:#fff}
.cdi-note{margin:14px 0 0;font-size:11.5px;color:rgba(255,255,255,.42);line-height:1.6;text-align:center}
.cdi-done{margin:20px 0 8px;text-align:center}
.cdi-done .cdi-check{width:58px;height:58px;margin:0 auto 12px;border-radius:50%;display:grid;place-items:center;
  background:rgba(141,235,0,.12);border:1px solid rgba(141,235,0,.4);color:#8deb00;font-size:24px}
.cdi-done p{font-size:13.5px;color:rgba(255,255,255,.7);line-height:1.6;margin:0}
@media (prefers-reduced-motion:reduce){
  .cdi-scrim,.cdi-sheet,.cdi-cta{transition:none}
  .cdi-scrim.cdi-open .cdi-sheet{transform:none}
}`;

  const SHARE_SVG = '<svg class="cdi-share-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8"/></svg>';

  let scrim = null;
  let lastFocus = null;

  function ensure() {
    if (scrim) return scrim;
    const st = document.createElement('style');
    st.id = 'cdi-styles';
    st.textContent = CSS;
    document.head.appendChild(st);

    scrim = document.createElement('div');
    scrim.className = 'cdi-scrim';
    scrim.setAttribute('aria-hidden', 'true');
    scrim.innerHTML =
      '<section class="cdi-sheet" role="dialog" aria-modal="true" aria-labelledby="cdiTitle" style="position:relative">' +
        '<div class="cdi-handle"></div>' +
        '<button type="button" class="cdi-close" data-cdi-close aria-label="Close">✕</button>' +
        '<div class="cdi-hero">' +
          '<span class="cdi-icon"><img src="/apple-touch-icon.png" alt="" ' +
            'onerror="this.style.display=\'none\'"></span>' +
          '<div><h2 id="cdiTitle">Install Decoded</h2>' +
          '<p>Your darkroom on the Home Screen — one tap to open, no browser chrome.</p></div>' +
        '</div>' +
        '<div data-cdi-body></div>' +
      '</section>';
    document.body.appendChild(scrim);

    scrim.addEventListener('click', (e) => {
      if (e.target === scrim || e.target.closest('[data-cdi-close]') || e.target.closest('[data-cdi-dismiss]')) {
        close();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && scrim.classList.contains('cdi-open')) close();
    });
    return scrim;
  }

  function bodyFor(m) {
    const body = scrim.querySelector('[data-cdi-body]');
    if (m === 'installed') {
      body.innerHTML =
        '<div class="cdi-done"><div class="cdi-check">✓</div>' +
        '<p>You&rsquo;re already running the installed app.<br>Decoded is on your Home Screen.</p></div>' +
        '<button type="button" class="cdi-cta" data-cdi-dismiss>Got it</button>';
      return;
    }
    if (m === 'prompt') {
      body.innerHTML =
        '<button type="button" class="cdi-cta" data-cdi-install>Install the app</button>' +
        '<button type="button" class="cdi-quiet" data-cdi-dismiss>Not now</button>' +
        '<p class="cdi-note">Adds the Decoded icon to your Home Screen for instant, full-screen access.</p>';
      const btn = body.querySelector('[data-cdi-install]');
      btn.addEventListener('click', async () => {
        const dp = window.__cdDeferredPrompt;
        if (!dp) { close(); return; }
        btn.disabled = true;
        try {
          dp.prompt();
          const choice = await dp.userChoice;
          if (choice && choice.outcome === 'accepted') window.__cdDeferredPrompt = null;
        } catch (e) { /* user dismissed or prompt failed */ }
        close();
      });
      return;
    }
    if (m === 'ios') {
      body.innerHTML =
        '<ol class="cdi-steps">' +
          '<li><span class="cdi-n">1</span><div><b>Tap the Share button ' + SHARE_SVG + '</b>' +
            '<span>In Safari&rsquo;s toolbar at the bottom of the screen.</span></div></li>' +
          '<li><span class="cdi-n">2</span><div><b>Tap &ldquo;Add to Home Screen&rdquo;</b>' +
            '<span>Scroll down the share sheet if you don&rsquo;t see it right away.</span></div></li>' +
          '<li><span class="cdi-n">3</span><div><b>Tap Add</b>' +
            '<span>Decoded lands on your Home Screen with its own icon — no App Store needed.</span></div></li>' +
        '</ol>' +
        '<button type="button" class="cdi-cta" data-cdi-dismiss>Got it</button>';
      return;
    }
    body.innerHTML =
      '<ol class="cdi-steps">' +
        '<li><span class="cdi-n">1</span><div><b>Open this site in Chrome or Safari</b>' +
          '<span>On Android use Chrome; on iPhone use Safari.</span></div></li>' +
        '<li><span class="cdi-n">2</span><div><b>Use the browser menu</b>' +
          '<span>Chrome: menu &rsaquo; <b>Install app</b>. Safari: Share ' + SHARE_SVG +
          ' &rsaquo; <b>Add to Home Screen</b>.</span></div></li>' +
      '</ol>' +
      '<button type="button" class="cdi-cta" data-cdi-dismiss>Got it</button>';
  }

  function open() {
    ensure();
    bodyFor(mode());
    lastFocus = document.activeElement;
    scrim.classList.add('cdi-open');
    scrim.setAttribute('aria-hidden', 'false');
    const btn = scrim.querySelector('.cdi-cta');
    if (btn) setTimeout(() => { try { btn.focus(); } catch (e) {} }, 60);
  }

  function close() {
    if (!scrim) return;
    scrim.classList.remove('cdi-open');
    scrim.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  window.CDInstall = { open, close, mode };
})();
