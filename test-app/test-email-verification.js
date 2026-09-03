// test-email-verification.js – Adds email verification button to profile pages
console.log('✅ test-email-verification.js loading...');

(function() {
  'use strict';

  // Wait for DOM and auth state
  function init() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user && !user.emailVerified) {
        insertVerifyButton(user);
      }
    });
  }

  function insertVerifyButton(user) {
    // Prevent duplicate buttons
    if (document.getElementById('verifyEmailBtn')) return;

    // Find the email display element (common on all profile pages)
    const emailSpan = document.getElementById('displayEmail');
    if (!emailSpan) {
      console.warn('displayEmail element not found, skipping verification button');
      return;
    }

    const btn = document.createElement('button');
    btn.id = 'verifyEmailBtn';
    btn.textContent = '📧 Verify Email';
    btn.style.cssText = `
      margin-left: 10px;
      padding: 4px 12px;
      background: #333;
      color: #8deb00;
      border: 1px solid #8deb00;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    `;
    btn.onmouseover = () => { btn.style.background = '#8deb00'; btn.style.color = '#000'; };
    btn.onmouseout = () => { btn.style.background = '#333'; btn.style.color = '#8deb00'; };

    btn.addEventListener('click', async () => {
      try {
        await user.sendEmailVerification();
        if (typeof cdToast === 'function') {
          cdToast('✅ Verification email sent! Check your inbox.');
        } else {
          alert('Verification email sent!');
        }
        btn.textContent = '✅ Sent';
        btn.disabled = true;
        btn.style.opacity = '0.6';
      } catch (err) {
        console.error('Error sending verification email:', err);
        if (typeof cdToast === 'function') {
          cdToast('Error: ' + err.message, 'error');
        } else {
          alert('Error: ' + err.message);
        }
      }
    });

    // Insert after the email span
    emailSpan.parentNode.insertBefore(btn, emailSpan.nextSibling);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();