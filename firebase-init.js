// firebase-init.js - CLEAN, NO SYNTAX ERRORS
const firebaseConfig = {
  apiKey: "AIzaSyC-REAL-KEY-REPLACE-ME",
  authDomain: "camerasdecoded.firebaseapp.com",
  projectId: "camerasdecoded",
  storageBucket: "camerasdecoded.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456",
  measurementId: "G-ABC123XYZ"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

try {
  db.settings({
    ignoreUndefinedProperties: true,
    merge: true
  });
} catch (e) {
  console.log("Firestore settings already set");
}

window.auth = auth;
window.db = db;
window.firebase = firebase;
