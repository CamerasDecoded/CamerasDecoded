// ============================================================
// TOAST & CONFIRM SYSTEM – self‑contained (injects CSS)
// ============================================================
(function() {
  // --- Inject CSS dynamically ---
  const style = document.createElement('style');
  style.textContent = `
    .toast-container {
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      pointer-events: none;
    }
    .toast {
      background: #0A0A0A;
      border: 1px solid #8deb00;
      color: #8deb00;
      font-family: 'Space Mono', monospace;
      font-size: 14px;
      padding: 14px 28px;
      border-radius: 8px;
      box-shadow: 0 0 30px rgba(141, 235, 0, 0.15);
      pointer-events: auto;
      animation: toastSlideIn 0.3s ease-out;
      text-align: center;
      max-width: 90vw;
    }
    .toast-out {
      animation: toastSlideOut 0.3s ease-in forwards;
    }
    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes toastSlideOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-20px); }
    }
    .confirm-overlay {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      animation: fadeInOverlay 0.2s;
    }
    @keyframes fadeInOverlay {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .confirm-modal {
      background: #0A0A0A;
      border: 1px solid #8deb00;
      border-radius: 12px;
      padding: 30px 40px;
      max-width: 480px;
      width: 90%;
      text-align: center;
      box-shadow: 0 0 60px rgba(141, 235, 0, 0.2);
    }
    .confirm-modal p {
      color: #ffffff;
      font-family: 'Space Mono', monospace;
      font-size: 16px;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .confirm-modal .btn-group {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .confirm-modal .btn {
      background: transparent;
      border: 1px solid #8deb00;
      color: #8deb00;
      font-family: 'Space Mono', monospace;
      font-size: 14px;
      padding: 10px 30px;
      border-radius: 30px;
      cursor: pointer;
      transition: 0.2s;
      min-width: 100px;
    }
    .confirm-modal .btn-cancel {
      border-color: #555;
      color: #999;
    }
    .confirm-modal .btn-cancel:hover {
      background: rgba(255,255,255,0.05);
      border-color: #888;
    }
    .confirm-modal .btn-confirm:hover {
      background: #8deb00;
      color: #000;
      box-shadow: 0 0 20px rgba(141, 235, 0, 0.4);
    }
  `;
  document.head.appendChild(style);

  // --- Create toast container ---
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);

  // --- Toast function ---
  window.showToast = function(message, duration = 2500) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // --- Confirm modal function ---
  window.showConfirm = function(message, onConfirm, onCancel) {
    const oldOverlay = document.querySelector('.confirm-overlay');
    if (oldOverlay) oldOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-modal">
        <p>${message}</p>
        <div class="btn-group">
          <button class="btn btn-cancel" id="confirm-cancel">Cancel</button>
          <button class="btn btn-confirm" id="confirm-ok">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const cancelBtn = overlay.querySelector('#confirm-cancel');
    const confirmBtn = overlay.querySelector('#confirm-ok');
    const cleanup = () => overlay.remove();

    cancelBtn.addEventListener('click', () => {
      cleanup();
      if (typeof onCancel === 'function') onCancel();
    });
    confirmBtn.addEventListener('click', () => {
      cleanup();
      if (typeof onConfirm === 'function') onConfirm();
    });
  };
})();