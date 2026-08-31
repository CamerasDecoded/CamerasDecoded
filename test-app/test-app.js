// test-app.js – Complete Firebase init + signup + login + helpers + access control
console.log('✅ test-app.js loading...');

const firebaseConfig = {
  apiKey: "AIzaSyB95Vx0i8W6WNfUy1N4TNQyfN5xCxQYnz8",
  authDomain: "cameras-decoded.firebaseapp.com",
  projectId: "cameras-decoded",
  storageBucket: "cameras-decoded.firebasestorage.app",
  messagingSenderId: "1088920052790",
  appId: "1:1088920052790:web:2177c1fb31109c1fa02497",
  measurementId: "G-YN3M01WW0B"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.firestore().settings({
  experimentalForceLongPolling: true
});

window.auth = firebase.auth();
window.db = firebase.firestore();

console.log('✅ Firebase initialized, window.auth and window.db are set');

// ================================================================
// PAGE ACCESS CONTROL – defined early
// ================================================================

const PAGE_ACCESS = {
  '/test-app/test-operator-dashboard.html': ['Operator'],
  '/test-app/test-partner-dashboard.html': ['Partner'],
  '/test-app/test-instructor-dashboard.html': ['Instructor'],
  '/test-app/test-profile.html': ['Operator'],
  '/test-app/test-partner-profile.html': ['Partner'],
  '/test-app/test-instructor-profile.html': ['Instructor'],
  '/test-app/test-admin-dashboard.html': ['Admin', 'admin'],
  '/test-app/test-admin-profile.html': ['Admin', 'admin']
};

function getDashboardUrl(role) {
  const map = {
    'Operator': '/test-app/test-operator-dashboard.html',
    'Partner': '/test-app/test-partner-dashboard.html',
    'Instructor': '/test-app/test-instructor-dashboard.html',
    'Admin': '/test-app/test-admin-dashboard.html',
    'admin': '/test-app/test-admin-dashboard.html'
  };
  return map[role] || '/test-app/test-operator-dashboard.html';
}

function checkPageAccess() {
  const user = firebase.auth().currentUser;
  if (!user) {
    window.location.href = '/test-app/test-login.html';
    return false;
  }

  let role = null;
  if (window.USER && window.USER.isLoggedIn) {
    role = window.USER.role;
  } else {
    console.warn('window.USER not ready, redirecting to login');
    window.location.href = '/test-app/test-login.html';
    return false;
  }

  const currentPath = window.location.pathname;
  const allowedRoles = PAGE_ACCESS[currentPath];
  if (!allowedRoles) return true;

  if (!allowedRoles.includes(role)) {
    const dashboardUrl = getDashboardUrl(role);
    window.location.href = dashboardUrl;
    return false;
  }

  return true;
}

// ================================================================
// TOAST NOTIFICATION
// ================================================================
function cdToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;font-family:sans-serif;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #0A0A0A;
    border: 1px solid ${type === 'error' ? '#ff4a4a' : '#8deb00'};
    color: #fff;
    font-size: 14px;
    padding: 10px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    pointer-events: auto;
    max-width: 90vw;
    text-align: center;
  `;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ================================================================
// REDIRECT HELPERS
// ================================================================
function redirectToDashboard(role) {
  const map = {
    'Operator': '/test-app/test-operator-dashboard.html',
    'Partner': '/test-app/test-partner-dashboard.html',
    'Instructor': '/test-app/test-instructor-dashboard.html',
    'Admin': '/test-app/test-admin-dashboard.html',
    'admin': '/test-app/test-admin-dashboard.html'
  };
  const url = map[role] || '/test-app/test-operator-dashboard.html';
  console.log('🔀 Redirecting to dashboard:', url);
  window.location.href = url;
}

function redirectToProfile(role) {
  const map = {
    'Operator': '/test-app/test-profile.html',
    'Partner': '/test-app/test-partner-profile.html',
    'Instructor': '/test-app/test-instructor-profile.html',
    'Admin': '/test-app/test-admin-profile.html',
    'admin': '/test-app/test-admin-profile.html'
  };
  const url = map[role] || '/test-app/test-profile.html';
  console.log('🔀 Redirecting to profile:', url);
  window.location.href = url;
}

// ================================================================
// LOGOUT
// ================================================================
window.handleLogout = function() {
  window.auth.signOut().then(() => {
    window.location.href = '/test-app/test-index.html';
  }).catch(err => {
    console.error('Logout error:', err);
    cdToast('Logout failed', 'error');
  });
};

// ================================================================
// REFERRAL CODE GENERATION
// ================================================================
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getUniqueReferralCode(attempts = 0) {
  if (attempts > 10) {
    console.warn('⚠️ Could not generate unique code after 10 attempts');
    return generateReferralCode() + 'X';
  }
  const code = generateReferralCode();
  try {
    const snapshot = await window.db.collection('users')
      .where('referralCode', '==', code)
      .get();
    if (snapshot.empty) {
      return code;
    } else {
      return getUniqueReferralCode(attempts + 1);
    }
  } catch (err) {
    console.error('Error checking referral code:', err);
    return code;
  }
}

// ================================================================
// SIGNUP STATE (UI)
// ================================================================
let selectedRole = 'Operator';
let selectedTier = 'free';

// MUST have window. prefix for onclick handlers to work
window.selectRole = function(role) {
  console.log('📝 Selected role:', role);
  selectedRole = role;
  const buttons = document.querySelectorAll('#roleOperator, #rolePartner, #roleInstructor');
  buttons.forEach(btn => {
    btn.style.background = '#333';
    btn.style.color = '#fff';
  });
  const selectedBtn = document.getElementById('role' + role);
  if (selectedBtn) {
    selectedBtn.style.background = '#8deb00';
    selectedBtn.style.color = '#000';
  }
  cdToast(`Selected ${role}`, 'success');
};

// MUST have window. prefix for onclick handlers to work
window.selectTier = function(tier) {
  console.log('💳 Selected tier:', tier);
  selectedTier = tier;
  const buttons = document.querySelectorAll('#tierFree, #tierPro');
  buttons.forEach(btn => {
    btn.style.background = '#333';
    btn.style.color = '#fff';
  });
  const selectedBtn = document.getElementById('tier' + (tier === 'free' ? 'Free' : 'Pro'));
  if (selectedBtn) {
    selectedBtn.style.background = '#8deb00';
    selectedBtn.style.color = '#000';
  }
  cdToast(`Selected ${tier.toUpperCase()} plan`, 'success');
};

// ================================================================
// SIGNUP FUNCTION
// ================================================================
// MUST have window. prefix for onclick handlers to work
window.signUp = async function() {
  try {
    const name = document.getElementById('name')?.value?.trim();
    const email = document.getElementById('email')?.value?.trim();
    const username = document.getElementById('username')?.value?.trim();
    const password = document.getElementById('password')?.value?.trim();
    const confirmPassword = document.getElementById('confirmPassword')?.value?.trim();

    if (!name || !email || !username || !password || !confirmPassword) {
      cdToast('Please fill in all fields', 'error');
      return;
    }
    if (password.length < 6) {
      cdToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (password !== confirmPassword) {
      cdToast('Passwords do not match', 'error');
      return;
    }

    console.log('🔐 Creating account:', { name, email, username, role: selectedRole, tier: selectedTier });

    const cred = await window.auth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;
    const uid = user.uid;

    await user.updateProfile({ displayName: name });

    let referralCode = await getUniqueReferralCode();
    console.log('✅ Generated referral code:', referralCode);

    const userData = {
      uid,
      name,
      email,
      username,
      role: selectedRole,
      tier: selectedTier,
      referralCode: referralCode,
      createdAt: new Date().toISOString()
    };

    await window.db.collection('users').doc(uid).set(userData);
    console.log('✅ User document saved to Firestore');

    sessionStorage.setItem('cameras_decoded_user_role', selectedRole);
    cdToast(`Account created! Welcome, ${name}!`, 'success');

    setTimeout(() => {
      redirectToDashboard(selectedRole);
    }, 1500);

  } catch (err) {
    console.error('❌ Signup error:', err);
    let message = err.message;
    if (err.code === 'auth/email-already-in-use') {
      message = 'Email already registered. Try logging in instead.';
    } else if (err.code === 'auth/weak-password') {
      message = 'Password is too weak. Use at least 6 characters.';
    } else if (err.code === 'auth/invalid-email') {
      message = 'Invalid email address.';
    }
    cdToast(message, 'error');
  }
};

// ================================================================
// LOGIN FUNCTION
// ================================================================
// MUST have window. prefix for onclick handlers to work
window.login = async function() {
  try {
    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value?.trim();

    if (!email || !password) {
      cdToast('Please fill in all fields', 'error');
      return;
    }

    console.log('🔐 Logging in:', { email });

    const cred = await window.auth.signInWithEmailAndPassword(email, password);
    const user = cred.user;
    const uid = user.uid;

    const userDoc = await window.db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      cdToast('User data not found. Please sign up first.', 'error');
      return;
    }

    const userData = userDoc.data();
    const role = userData.role || 'Operator';

    sessionStorage.setItem('cameras_decoded_user_role', role);
    cdToast(`Welcome back, ${userData.name}!`, 'success');

    setTimeout(() => {
      redirectToDashboard(role);
    }, 1500);

  } catch (err) {
    console.error('❌ Login error:', err);
    let message = err.message;
    if (err.code === 'auth/user-not-found') {
      message = 'Email not found. Please sign up first.';
    } else if (err.code === 'auth/wrong-password') {
      message = 'Incorrect password.';
    } else if (err.code === 'auth/invalid-email') {
      message = 'Invalid email address.';
    }
    cdToast(message, 'error');
  }
};

// ================================================================
// AUTH STATE OBSERVER
// ================================================================
window.auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('✅ User already logged in:', user.uid);
  } else {
    console.log('⭕ No user logged in');
  }
});

console.log('✅ test-app.js loaded successfully with all functions');
