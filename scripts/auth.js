// ================================================================
// AUTH – Cameras Decoded (Production)
// ================================================================

const firebaseConfig = {
  apiKey: "AIzaSyB95Vx0i8W6WNfUy1N4TNQyfN5xCxQYnz8",
  authDomain: "cameras-decoded.firebaseapp.com",
  projectId: "cameras-decoded",
  storageBucket: "cameras-decoded.firebasestorage.app",
  messagingSenderId: "1088920052790",
  appId: "1:1088920052790:web:2177c1fb31109c1fa02497",
  measurementId: "G-YN3M01WW0B"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

const STRIPE_CHECKOUT_URL = 'https://checkout.stripe.com/pay/placeholder';

function cdToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'error' ? ' error' : '');
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function updateLastActive(uid) {
  db.collection('users').doc(uid).set({
    lastActive: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).catch(err => console.warn('Could not update lastActive:', err));
}

function redirectToDashboard(role, uid) {
  const map = {
    'Operator': 'operator-dashboard.html',
    'Partner': 'partner-dashboard.html',
    'Instructor': 'instructor-dashboard.html',
    'Admin': 'admin-dashboard.html',
    'admin': 'admin-dashboard.html'
  };
  const url = map[role] || 'operator-dashboard.html';
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  if (redirect) {
    try {
      const dest = new URL(decodeURIComponent(redirect));
      dest.searchParams.set('opToken', uid);
      window.location.href = dest.toString();
      return;
    } catch (_) {
      window.location.href = decodeURIComponent(redirect);
      return;
    }
  }
  window.location.href = url;
}

function storeUserData(data) {
  localStorage.setItem('cameras_decoded_user', JSON.stringify(data));
}

function getStoredReferral() {
  return localStorage.getItem('signup_referral') || null;
}

function setReferralFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref');
  if (ref) localStorage.setItem('signup_referral', ref);
}

// ================================================================
// SOCIAL LOGIN HELPERS
// ================================================================
function handleSocialUser(user) {
  const uid = user.uid;
  const email = user.email || '';
  const name = user.displayName || '';
  const photoURL = user.photoURL || '';

  db.collection('users').doc(uid).get()
    .then(doc => {
      if (!doc.exists) {
        const username = email ? email.split('@')[0] : 'user' + Math.random().toString(36).substring(2, 6);
        const referralCode = username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const data = {
          displayName: name,
          email: email,
          username: username,
          photoURL: photoURL,
          role: 'Operator',
          tier: selectedTier || 'free',
          billingInterval: isWeekly ? 'weekly' : isAnnual ? 'annual' : 'monthly',
          preferences: { brands: [], lenses: [], interests: [] },
          learningJourney: {},
          totalPoints: 0,
          level: 1,
          badgesEarned: [],
          dailyChallengeStreak: 0,
          lastChallengeDate: null,
          dailyChallengesCompleted: [],
          savedProtocols: [],
          savedCards: [],
          savedBlogs: [],
          savedPodcasts: [],
          savedCommunityPosts: [],
          referralCode: referralCode,
          totalReferrals: 0,
          totalCommissionEarned: 0,
          ambassadorTier: 'signal',
          aiUsage: { total: 0, prompt: 0, snapshot: 0, ideas: 0, critique: 0 },
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          tourCompleted: false,
          referredBy: getStoredReferral() || null
        };
        return db.collection('users').doc(uid).set(data)
          .then(() => db.collection('referralCodes').doc(referralCode).set({ uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(() => {}))
          .then(() => {
            if (getStoredReferral()) {
              return db.collection('referralCodes').doc(getStoredReferral()).get()
                .then(refDoc => {
                  if (refDoc.exists) {
                    const referrerUid = refDoc.data().uid;
                    return db.collection('users').doc(referrerUid).update({ totalReferrals: firebase.firestore.FieldValue.increment(1) }).catch(() => {});
                  }
                });
            }
            return Promise.resolve();
          })
          .then(() => {
            if (selectedTier === 'pro') {
              handleProPlanRedirect(uid);
              return;
            }
            redirectToDashboard('Operator', uid);
          });
      }
      return doc;
    })
    .then(doc => {
      if (doc) {
        const data = doc.data();
        const userData = { uid, ...data };
        storeUserData(userData);
        if (selectedTier === 'pro') {
          handleProPlanRedirect(uid);
        } else {
          redirectToDashboard(data.role || 'Operator', uid);
        }
      }
    })
    .catch(err => {
      console.error('Social login error:', err);
      cdToast(err.message || 'Something went wrong.', 'error');
    });
}

function handleProPlanRedirect(uid) {
  const pending = {
    uid,
    tier: 'pro',
    billingInterval: isWeekly ? 'weekly' : isAnnual ? 'annual' : 'monthly'
  };
  localStorage.setItem('pending_pro_upgrade', JSON.stringify(pending));
  const returnUrl = window.location.origin + '/profile.html?payment=success';
  const stripeUrl = `${STRIPE_CHECKOUT_URL}?client_reference_id=${uid}&return_url=${encodeURIComponent(returnUrl)}`;
  window.location.href = stripeUrl;
}

// ================================================================
// SOCIAL SIGN-IN/UP BUTTONS
// ================================================================
window.signInWithGoogle = function() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      updateLastActive(result.user.uid);
      handleSocialUser(result.user);
    })
    .catch(err => cdToast(err.message, 'error'));
};

window.signInWithFacebook = function() {
  const provider = new firebase.auth.FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');
  auth.signInWithPopup(provider)
    .then(result => {
      updateLastActive(result.user.uid);
      handleSocialUser(result.user);
    })
    .catch(err => cdToast(err.message, 'error'));
};

// ================================================================
// EMAIL/PASSWORD LOGIN
// ================================================================
window.login = function(email, password) {
  if (!email || !password) {
    cdToast('Please fill in all fields.', 'error');
    return;
  }
  auth.signInWithEmailAndPassword(email, password)
    .then(cred => {
      const uid = cred.user.uid;
      updateLastActive(uid);
      return db.collection('users').doc(uid).get().then(doc => {
        if (!doc.exists) {
          const data = {
            displayName: cred.user.displayName || '',
            email: email,
            username: email.split('@')[0],
            role: 'Operator',
            tier: 'free',
            billingInterval: 'monthly',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            referralCode: email.split('@')[0],
            totalReferrals: 0,
            totalCommissionEarned: 0,
            ambassadorTier: 'signal',
            savedCards: [],
            savedBlogs: [],
            savedPodcasts: [],
            savedCommunityPosts: [],
            preferences: { brands: [], lenses: [], interests: [] },
            learningJourney: {},
            photoURL: cred.user.photoURL || '',
            lastActive: firebase.firestore.FieldValue.serverTimestamp()
          };
          return db.collection('users').doc(uid).set(data)
            .then(() => db.collection('referralCodes').doc(data.referralCode).set({ uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(() => {}))
            .then(() => db.collection('users').doc(uid).get());
        }
        return doc;
      });
    })
    .then(doc => {
      const data = doc.data();
      const userData = { uid: doc.id, ...data };
      storeUserData(userData);
      let roles = (data.roles && Array.isArray(data.roles)) ? data.roles : [data.role || 'Operator'];
      roles = [...new Set(roles)];
      if (roles.length === 1) {
        redirectToDashboard(roles[0], doc.id);
      } else {
        if (typeof showRoleSelection === 'function') {
          showRoleSelection();
          populateRoleCards(roles, doc.id);
        } else {
          redirectToDashboard(roles[0], doc.id);
        }
      }
    })
    .catch(err => cdToast(err.message, 'error'));
};

// ================================================================
// FORGOT PASSWORD
// ================================================================
window.forgotPassword = function(email) {
  if (!email) {
    cdToast('Please enter your email address.', 'error');
    return;
  }
  auth.sendPasswordResetEmail(email)
    .then(() => cdToast('Password reset email sent!'))
    .catch(err => cdToast(err.message, 'error'));
};

// ================================================================
// SIGNUP (Operator)
// ================================================================
let selectedTier = 'free';
let isAnnual = false;
let isWeekly = false;

window.selectTier = function(tier) {
  selectedTier = tier;
  document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(`.pricing-card[data-tier="${tier}"]`);
  if (card) card.classList.add('selected');
};

window.toggleBilling = function() {
  if (isWeekly) {
    isWeekly = false;
    document.getElementById('weeklyOption')?.classList.remove('selected');
    document.getElementById('billingWrap')?.classList.remove('overridden');
  }
  isAnnual = !isAnnual;
  document.getElementById('billingToggle')?.classList.toggle('annual', isAnnual);
  updatePricingDisplay();
};

window.toggleWeekly = function() {
  const el = document.getElementById('weeklyOption');
  const wrap = document.getElementById('billingWrap');
  if (isWeekly) {
    isWeekly = false;
    el?.classList.remove('selected');
    wrap?.classList.remove('overridden');
  } else {
    isWeekly = true;
    el?.classList.add('selected');
    wrap?.classList.add('overridden');
  }
  updatePricingDisplay();
};

window.clearWeekly = function() {
  if (isWeekly) {
    isWeekly = false;
    document.getElementById('weeklyOption')?.classList.remove('selected');
    document.getElementById('billingWrap')?.classList.remove('overridden');
    updatePricingDisplay();
  }
};

function updatePricingDisplay() {
  const priceEl = document.getElementById('proPrice');
  const periodEl = document.getElementById('proPeriod');
  const badgeEl = document.getElementById('proSavingBadge');
  if (!priceEl) return;
  if (isWeekly) {
    priceEl.innerHTML = '<span class="currency">$</span>8';
    periodEl.textContent = '/ week';
    badgeEl.textContent = 'Flexible – cancel anytime';
    badgeEl.style.display = 'inline-block';
    return;
  }
  if (isAnnual) {
    priceEl.innerHTML = '<span class="currency">$</span>199';
    periodEl.textContent = '/ year';
    badgeEl.textContent = 'Save 30% vs monthly';
    badgeEl.style.display = 'inline-block';
  } else {
    priceEl.innerHTML = '<span class="currency">$</span>24';
    periodEl.textContent = '/ month';
    badgeEl.textContent = 'Save 30% yearly';
    badgeEl.style.display = 'inline-block';
  }
}

window.createAccount = function() {
  const btn = document.getElementById('createBtn');
  const spinner = document.getElementById('signupSpinner');
  const errorEl = document.getElementById('signupError');

  const displayName = document.getElementById('displayName').value.trim();
  const email = document.getElementById('email').value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  document.querySelectorAll('.error-hint').forEach(el => el.style.display = 'none');
  errorEl.style.display = 'none';

  if (!displayName) { document.getElementById('displayNameError')?.style.display = 'block'; return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('emailError').style.display = 'block'; return; }
  if (!username) { document.getElementById('usernameError').style.display = 'block'; return; }
  if (!password || password.length < 6) { document.getElementById('passwordError').style.display = 'block'; return; }
  if (password !== confirmPassword) { document.getElementById('confirmError').style.display = 'block'; return; }

  btn.disabled = true;
  btn.textContent = 'Creating...';
  spinner.style.display = 'block';

  const referralCode = username.toLowerCase().replace(/[^a-z0-9]/g, '');

  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => cred.user.updateProfile({ displayName }).then(() => cred.user))
    .then(user => {
      const userData = {
        displayName,
        email,
        username,
        photoURL: null,
        role: 'Operator',
        tier: selectedTier,
        billingInterval: isWeekly ? 'weekly' : isAnnual ? 'annual' : 'monthly',
        preferences: { brands: [], lenses: [], interests: [] },
        learningJourney: {},
        totalPoints: 0,
        level: 1,
        badgesEarned: [],
        dailyChallengeStreak: 0,
        lastChallengeDate: null,
        dailyChallengesCompleted: [],
        savedProtocols: [],
        savedCards: [],
        savedBlogs: [],
        savedPodcasts: [],
        savedCommunityPosts: [],
        referralCode,
        totalReferrals: 0,
        totalCommissionEarned: 0,
        ambassadorTier: 'signal',
        aiUsage: { total: 0, prompt: 0, snapshot: 0, ideas: 0, critique: 0 },
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        tourCompleted: false,
        referredBy: getStoredReferral() || null
      };
      return db.collection('users').doc(user.uid).set(userData, { merge: true }).then(() => user);
    })
    .then(user => db.collection('referralCodes').doc(referralCode).set({ uid: user.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(() => {}))
    .then(() => {
      const ref = getStoredReferral();
      if (ref) {
        return db.collection('referralCodes').doc(ref).get()
          .then(doc => {
            if (doc.exists) {
              return db.collection('users').doc(doc.data().uid).update({ totalReferrals: firebase.firestore.FieldValue.increment(1) }).catch(() => {});
            }
          });
      }
      return Promise.resolve();
    })
    .then(() => {
      btn.disabled = false;
      btn.textContent = 'Create Account →';
      spinner.style.display = 'none';
      localStorage.removeItem('signup_referral');

      if (selectedTier === 'pro') {
        handleProPlanRedirect(auth.currentUser.uid);
      } else {
        cdToast('Account created! Redirecting...');
        window.location.href = 'profile.html?welcome=onboarding';
      }
    })
    .catch(err => {
      btn.disabled = false;
      btn.textContent = 'Create Account →';
      spinner.style.display = 'none';
      let msg = err.message;
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please log in.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address.';
      }
      errorEl.innerHTML = msg;
      errorEl.style.display = 'block';
    });
};

// ================================================================
// AUTH STATE OBSERVER – only auto-redirect on login page
// ================================================================
auth.onAuthStateChanged(user => {
  if (user && window.location.pathname.endsWith('/login.html')) {
    updateLastActive(user.uid);
    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        let roles = (data.roles && Array.isArray(data.roles)) ? data.roles : [data.role || 'Operator'];
        roles = [...new Set(roles)];
        if (roles.length === 1) {
          redirectToDashboard(roles[0], user.uid);
        } else if (typeof showRoleSelection === 'function') {
          showRoleSelection();
          populateRoleCards(roles, user.uid);
        }
      }
    }).catch(() => {});
  }
});

setReferralFromURL();