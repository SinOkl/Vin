import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { auth, googleProvider } from './firebase-init.js';

export function loggInnMedGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function loggUt() {
  return firebaseSignOut(auth);
}

// Kaller `callback(bruker)` med gjeldende bruker (eller null) med det samme, og igjen hver gang innloggingsstatus endres.
export function paInnloggingsendring(callback) {
  return onAuthStateChanged(auth, callback);
}

export function gjeldendeBruker() {
  return auth.currentUser;
}
