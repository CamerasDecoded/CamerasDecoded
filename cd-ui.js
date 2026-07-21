// Cameras Decoded — shared in-brand UI utilities.
// Replaces native alert()/confirm() with styled toast + modal that match
// the site's look. Include this script on any page, then use:
//   cdToast("Message here")            — success toast (green)
//   cdToast("Message here", "error")   — error toast (red)
//   cdConfirm("Are you sure?").then(ok => { if (ok) { ... } })
//     — replaces confirm(); returns a Promise<boolean>
//
// This file injects its own CSS, so it works correctly on any page just by
// adding <script src="cd-ui.js"></script> — no need to also copy styles
// into that page's stylesheet.
(function () {
  const styleTag = document.createElement('style');
  styleTag.id = 'cd-ui-styles';
  styleTag.textContent = `
    #cd-toast-container { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; flex-direction: column; gap: 10px; align-items: center; pointer-events: none; }
    .cd-toast { background: #0A0A0A; border: 1px solid #8deb00; color: #ffffff; font-family: 'Space Mono', monospace; font-size: 13px; padding: 12px 22px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 15px rgba(141, 235, 0, 0.15); opacity: 0; transform: translateY(-10px); transition: all 0.3s ease; pointer-events: auto; max-width: 90vw; text-align: center; }
    .cd-toast.show { opacity: 1; transform: translateY(0); }
    .cd-toast.error { border-color: #ff4a4a; box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 15px rgba(255, 74, 74, 0.15); }
    #cd-confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 10001; display: none; align-items: center; justify-content: center; }
    #cd-confirm-overlay.show { display: flex; }
    .cd-confirm-box { background: #0A0A0A; border: 1px solid #8deb00; border-radius: 10px; padding: 28px 30px; max-width: 380px; text-align: center; box-shadow: 0 0 30px rgba(141, 235, 0, 0.15); }
    .cd-confirm-box p { color: #ffffff; font-size: 14px; margin-bottom: 22px; font-family: 'Montserrat', sans-serif; line-height: 1.5; }
    .cd-confirm-actions { display: flex; gap: 12px; justify-content: center; }
    .cd-confirm-btn { font-family: 'Space Mono', monospace; font-size: 13px; padding: 10px 24px; border-radius: 30px; cursor: pointer; transition: 0.2s; border: 1px solid #8deb00; background: transparent; color: #8deb00; }
    .cd-confirm-btn:hover { background: #8deb00; color: #000000; }
    .cd-confirm-btn.danger { border-color: #ff4a4a; color: #ff4a4a; }
    .cd-confirm-btn.danger:hover { background: #ff4a4a; color: #000000; }
  `;
  document.head.appendChild(styleTag);

  // --- TOAST CONTAINER ---
  const toastContainer = document.createElement('div');
  toastContainer.id = 'cd-toast-container';
  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(toastContainer);
  });

  window.cdToast = function (message, type) {
    type = type === 'error' ? 'error' : 'success';
    const toast = document.createElement('div');
    toast.className = 'cd-toast' + (type === 'error' ? ' error' : '');
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Trigger the transition on the next frame so it actually animates in
    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3200);
  };

  // --- CONFIRM MODAL ---
  const overlay = document.createElement('div');
  overlay.id = 'cd-confirm-overlay';
  overlay.innerHTML =
    '<div class="cd-confirm-box">' +
      '<p id="cd-confirm-message"></p>' +
      '<div class="cd-confirm-actions">' +
        '<button class="cd-confirm-btn" id="cd-confirm-cancel">Cancel</button>' +
        '<button class="cd-confirm-btn danger" id="cd-confirm-ok">Remove</button>' +
      '</div>' +
    '</div>';

  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(overlay);
  });

  window.cdConfirm = function (message) {
    return new Promise(function (resolve) {
      const show = function () {
        document.getElementById('cd-confirm-message').textContent = message;
        overlay.classList.add('show');

        const okBtn = document.getElementById('cd-confirm-ok');
        const cancelBtn = document.getElementById('cd-confirm-cancel');

        function cleanup(result) {
          overlay.classList.remove('show');
          okBtn.removeEventListener('click', onOk);
          cancelBtn.removeEventListener('click', onCancel);
          resolve(result);
        }
        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
      };

      // If DOM isn't ready yet (unlikely, since this fires on click), wait for it
      if (document.body.contains(overlay)) {
        show();
      } else {
        document.addEventListener('DOMContentLoaded', show, { once: true });
      }
    });
  };
})();
