// Cameras Decoded — shared in-brand UI utilities.
// Replaces native alert()/confirm() with styled toast + modal that match
// the site's look. Include this script on any page, then use:
//   cdToast("Message here")            — success toast (green)
//   cdToast("Message here", "error")   — error toast (red)
//   cdConfirm("Are you sure?").then(ok => { if (ok) { ... } })
//     — replaces confirm(); returns a Promise<boolean>
(function () {
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
