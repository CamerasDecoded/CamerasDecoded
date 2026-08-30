// test-app.js – Complete Firebase init + signup + login + helpers
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
firebase.firestore().settings({ experimentalForceLongPolling: true });

// Expose auth and db globally
window.auth = firebase.auth();
window.db = firebase.firestore();

console.log('✅ Firebase initialized, window.auth and window.db are set');

// ================================================================
// REFERRAL CODE GENERATION
// ================================================================

/**
 * Generate a unique referral code
 * Format: 8 characters alphanumeric (e.g., "X7K9M2P4")
 */
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if a referral code already exists in Firestore
 * If it does, generate a new one and check again (recursive)
 * Max 10 attempts to avoid infinite loops
 */
async function getUniqueReferralCode(attempts = 0) {
  if (attempts > 10) {
    throw new Error('Failed to generate unique referral code after 10 attempts');
  }
  
  const code = generateReferralCode();
  
  try {
    // Query Firestore to see if this code already exists
    const querySnapshot = await window.db.collection('users')
      .where('referralCode', '==', code)
      .get();
    
    if (querySnapshot.empty) {
      // Code is unique – return it
      return code;
    } else {
      // Code already exists – try again
      console.log('⚠️ Referral code collision:', code, '- retrying...');
      return getUniqueReferralCode(attempts + 1);
    }
  } catch (err) {
    console.error('Error checking referral code uniqueness:', err);
    // If query fails, still return a code to avoid breaking signup
    // But log the error for debugging
    return code;
  }
}

// ================================================================
// SIGNUP/LOGIN STATE
// ================================================================
let selectedRole = 'Operator';
let selectedTier = 'free';

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
// REDIRECT HELPERS – NO MORE ?uid= 
// ================================================================
function redirectToDashboard(role) {
  const map = {
    'Operator': '/test-app/test-operator-dashboard.html',
    'Partner': '/test-app/test-partner-dashboard.html',
    'Instructor': '/test-app/test-instructor-dashboard.html'
  };
  const url = map[role] || '/test-app/test-operator-dashboard.html';
  console.log('🔀 Redirecting to dashboard:', url);
  window.location.href = url;
}

function redirectToProfile(role) {
  const map = {
    'Operator': '/test-app/test-profile.html',
    'Partner': '/test-app/test-partner-profile.html',
    'Instructor': '/test-app/test-instructor-profile.html'
  };
  const url = map[role] || '/test-app/test-profile.html';
  console.log('🔀 Redirecting to profile:', url);
  window.location.href = url;
}

// ================================================================
// LOGOUT
// ================================================================
function handleLogout() {
  window.auth.signOut().then(() => {
    window.location.href = '/test-app/test-index.html';
  }).catch(err => {
    console.error('Logout error:', err);
    cdToast('Logout failed', 'error');
  });
}

// ================================================================
// SIGNUP PAGE: SELECT ROLE
// ================================================================
function selectRole(role) {
  console.log('📝 Selected role:', role);
  selectedRole = role;
  
  // Update button styling
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
}

// ================================================================
// SIGNUP PAGE: SELECT TIER
// ================================================================
function selectTier(tier) {
  console.log('💳 Selected tier:', tier);
  selectedTier = tier;
  
  // Update button styling
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
}

// ================================================================
// SIGNUP FUNCTION
// ================================================================
async function signUp() {
  try {
    // Get form values
    const name = document.getElementById('name')?.value?.trim();
    const email = document.getElementById('email')?.value?.trim();
    const username = document.getElementById('username')?.value?.trim();
    const password = document.getElementById('password')?.value?.trim();
    const confirmPassword = document.getElementById('confirmPassword')?.value?.trim();

    // Validation
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

    // Create Firebase user
    const cred = await window.auth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;
    const uid = user.uid;

    console.log('✅ Firebase user created:', uid);

    // Update profile display name
    await user.updateProfile({ displayName: name });

    console.log('✅ Profile updated');

    // === NEW: Generate unique referral code ===
    let referralCode = null;
    try {
      referralCode = await getUniqueReferralCode();
      console.log('✅ Generated referral code:', referralCode);
    } catch (err) {
      console.warn('⚠️ Referral code generation failed:', err.message);
      // Still allow signup – we'll store a fallback
      referralCode = generateReferralCode() + 'X'; // Add a letter to make it unique-ish
    }

    // Save to Firestore
    const userData = {
      uid,
      name,
      email,
      username,
      role: selectedRole,
      tier: selectedTier,
      referralCode: referralCode, // NEW: Store the referral code
      createdAt: new Date().toISOString()
    };

    await window.db.collection('users').doc(uid).set(userData);
    console.log('✅ User document saved to Firestore');

    // Cache role in sessionStorage
    sessionStorage.setItem('cameras_decoded_user_role', selectedRole);

    cdToast(`Account created! Welcome, ${name}!`, 'success');

    // Redirect to dashboard after short delay – NO UID in URL
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
}

// ================================================================
// LOGIN FUNCTION
// ================================================================
async function login() {
  try {
    // Get form values
    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value?.trim();

    // Validation
    if (!email || !password) {
      cdToast('Please fill in all fields', 'error');
      return;
    }

    console.log('🔐 Logging in:', { email });

    // Sign in with Firebase
    const cred = await window.auth.signInWithEmailAndPassword(email, password);
    const user = cred.user;
    const uid = user.uid;

    console.log('✅ Logged in:', uid);

    // Fetch user data from Firestore to get role
    const userDoc = await window.db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      cdToast('User data not found. Please sign up first.', 'error');
      return;
    }

    const userData = userDoc.data();
    const role = userData.role || 'Operator';

    console.log('✅ User role:', role);

    // Cache role in sessionStorage
    sessionStorage.setItem('cameras_decoded_user_role', role);

    cdToast(`Welcome back, ${userData.name}!`, 'success');

    // Redirect to dashboard after short delay – NO UID in URL
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
}

// ================================================================
// CHECK AUTH STATE ON PAGE LOAD
// ================================================================
window.auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('✅ User already logged in:', user.uid);
    // Optionally redirect to dashboard on already-logged-in pages
  } else {
    console.log('⭕ No user logged in');
  }
});

console.log('✅ test-app.js loaded successfully with all functions');