// user-state.js – Global user state management
// Loads on every page, detects auth status, fetches user data from Firestore
// Exposes window.USER with all necessary info

console.log('✅ user-state.js loading...');

// Initialize window.USER object
window.USER = {
  isLoggedIn: false,
  uid: null,
  name: null,
  email: null,
  username: null,
  role: null,
  tier: null,
  createdAt: null
};

// Wait for Firebase to be ready
function waitForFirebase(maxWaitMs = 5000) {
  return new Promise((resolve) => {
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
      resolve(true);
      return;
    }

    let elapsed = 0;
    const checkInterval = 100;
    const maxAttempts = maxWaitMs / checkInterval;
    let attempts = 0;

    const interval = setInterval(() => {
      attempts++;
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
        clearInterval(interval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        resolve(false);
      }
    }, checkInterval);
  });
}

// Load user data from Firestore
async function loadUserData(uid) {
  try {
    const doc = await firebase.firestore().collection('users').doc(uid).get();
    if (doc.exists) {
      const data = doc.data();
      window.USER = {
        isLoggedIn: true,
        uid,
        name: data.name || null,
        email: data.email || null,
        username: data.username || null,
        role: data.role || 'Operator',
        tier: data.tier || 'free',
        createdAt: data.createdAt || null
      };
      
      // Cache in sessionStorage
      sessionStorage.setItem('user_state', JSON.stringify(window.USER));
      
      console.log('✅ User data loaded:', window.USER.name, window.USER.role);
      return window.USER;
    }
  } catch (err) {
    console.error('Error loading user data:', err);
  }
  return null;
}

// Initialize user state
async function initializeUserState() {
  const firebaseReady = await waitForFirebase();
  
  if (!firebaseReady) {
    console.warn('⚠️ Firebase not ready, skipping user state init');
    return;
  }

  // Check for cached user state
  const cached = sessionStorage.getItem('user_state');
  if (cached) {
    try {
      window.USER = JSON.parse(cached);
      console.log('✅ User state restored from cache:', window.USER.name);
    } catch (e) {
      console.warn('Cache parse error:', e);
    }
  }

  // Listen to auth state changes
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      // User is logged in
      console.log('👤 Auth user found:', user.uid);
      
      // Load full user data from Firestore
      await loadUserData(user.uid);
      
      // Dispatch custom event so other scripts know user loaded
      window.dispatchEvent(new CustomEvent('userStateReady', { detail: window.USER }));
    } else {
      // User is not logged in
      console.log('⭕ No auth user');
      window.USER = {
        isLoggedIn: false,
        uid: null,
        name: null,
        email: null,
        username: null,
        role: null,
        tier: null,
        createdAt: null
      };
      sessionStorage.removeItem('user_state');
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('userStateReady', { detail: window.USER }));
    }
  });
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUserState);
} else {
  initializeUserState();
}

console.log('✅ user-state.js loaded');