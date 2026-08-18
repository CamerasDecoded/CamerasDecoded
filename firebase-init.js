const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "camerasdecoded.firebaseapp.com",
  projectId: "camerasdecoded",
  storageBucket: "camerasdecoded.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
window.auth = firebase.auth();
window.db = firebase.firestore();
try { window.db.settings({ ignoreUndefinedProperties: true, merge: true }); } catch(e) {}