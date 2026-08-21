// js/firebase-init.js
const firebaseConfig = {
  apiKey: "AIzaSyB95Vx0i8W6WNfUy1N4TNQyfN5xCxQYnz8",
  authDomain: "cameras-decoded.firebaseapp.com",
  projectId: "cameras-decoded",
  storageBucket: "cameras-decoded.firebasestorage.app",
  messagingSenderId: "1088920052790",
  appId: "1:1088920052790:web:2177c1fb31109c1fa02497",
  measurementId: "G-YN3M01WW0B"
};

// Initialize Firebase (global firebase object from SDK)
firebase.initializeApp(firebaseConfig);

// Force Firestore to use HTTP long-polling (fixes CORS issues on static hosts)
firebase.firestore().settings({
  experimentalForceLongPolling: true
});

// Expose auth and db globally so every page can use them without re-declaring
window.auth = firebase.auth();
window.db = firebase.firestore();