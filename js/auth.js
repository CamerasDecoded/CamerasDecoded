// js/auth.js
import { auth, db } from './firebase-init.js';
import { cdToast } from './ui-helpers.js';

// Social Sign-In (used in signup and login)
export async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch (err) { cdToast(err.message, 'error'); throw err; }
}

export async function signInWithFacebook() {
  const provider = new firebase.auth.FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');
  try {
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch (err) { cdToast(err.message, 'error'); throw err; }
}

// Email/Password Sign Up
export async function signUpWithEmail(email, password) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  return cred.user;
}

// Email/Password Login
export async function loginWithEmail(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

// Logout
export async function logout() {
  await auth.signOut();
}

// Password Reset
export async function sendPasswordReset(email) {
  await auth.sendPasswordResetEmail(email);
}