// email-verification.js – Production version
console.log('🔐 Email verification module loaded');

(function() {
  'use strict';

  function init() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.warn('Firebase auth not available – retrying...');
      setTimeout(init, 500);
      return;
    }
    firebase.auth().onAuthStateChanged((user) => {
      // Remove existing button if user is verified or logged out
      const existing = document.getElementById('verifyEmailBtn');
      if (!user || user.emailVerified) {
        if (existing) existing.remove();
        const warning = document.getElementById('verifyWarning');
        if (warning) warning.remove();
        return;
      }
      // Only insert if user is unverified
      insertVerifyButton(user);
    });
  }

  function insertVerifyButton(user) {
    if (document.getElementById('verifyEmailBtn')) return;

    // Find email display on any profile
    const emailSpan = document.getElementById('displayEmail') || document.getElementById('profileEmail');
    if (!emailSpan) return;

    const container = emailSpan.parentNode;

    const btn = document.createElement('button');
    btn.id = 'verifyEmailBtn';
    btn.innerHTML = '<i class="fas fa-envelope"></i> Verify Email';
    btn.style.cssText = `
      margin-left: 12px;
      padding: 4px 14px;
      background: rgba(255, 255, 255, 0.04);
      color: var(--green, #8deb00);
      border: 1px solid var(--green, #8deb00);
      border-radius: 20px;
      cursor: pointer;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      transition: all 0.25s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    `;
    btn.onmouseover = () => {
      btn.style.background = 'rgba(141,235,0,0.1)';
      btn.style.boxShadow = '0 0 20px rgba(141,235,0,0.15)';
    };
    btn.onmouseout = () => {
      btn.style.background = 'rgba(255,255,255,0.04)';
      btn.style.boxShadow = 'none';
    };

    const warning = document.createElement('span');
    warning.id = 'verifyWarning';
    warning.style.cssText = `
      font-size: 11px;
      color: #ffaa00;
      font-family: 'Space Mono', monospace;
      margin-left: 8px;
      opacity: 0.8;
    `;
    warning.textContent = '⚠ Unverified';

    btn.addEventListener('click', async () => {
      try {
        await user.sendEmailVerification();
        if (typeof cdToast === 'function') {
          cdToast('✅ Verification email sent! Check your inbox.');
        } else {
          alert('Verification email sent!');
        }
        btn.innerHTML = '<i class="fas fa-check"></i> Sent';
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'default';
        btn.onmouseover = null;
        btn.onmouseout = null;
        warning.style.display = 'none';
      } catch (err) {
        console.error('Error sending verification email:', err);
        if (typeof cdToast === 'function') {
          cdToast('Error: ' + err.message, 'error');
        } else {
          alert('Error: ' + err.message);
        }
      }
    });

    container.insertBefore(btn, emailSpan.nextSibling);
    container.insertBefore(warning, btn.nextSibling);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();