// Cameras Decoded — shared Firebase initialization.
// Include this AFTER the three firebase-*-compat.js SDK scripts, and BEFORE
// any page-specific script that uses `firebase`, `auth`, or `db`.
//
// This replaces copy-pasting the same firebaseConfig object and
// firebase.initializeApp() call into every page — one file, one source
// of truth. If the API key or project ever changes, this is the only
// place that needs updating.
const firebaseConfig = {
  apiKey: "AIzaSyB95Vx0i8W6WNfUy1N4TNQyfN5xCxQYnz8",
  authDomain: "cameras-decoded.firebaseapp.com",
  projectId: "cameras-decoded",
  storageBucket: "cameras-decoded.firebasestorage.app",
  messagingSenderId: "1088920052790",
  appId: "1:1088920052790:web:2177c1fb31109c1fa02497",
  measurementId: "G-YN3M01WW0B"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
