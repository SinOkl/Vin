// Initialiserer Firebase-appen. Ingen npm/bundler nødvendig — SDK-en lastes som
// ES-moduler rett fra Google sitt CDN, på samme måte som resten av appen er bygget.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentSingleTabManager,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// Bilder lagres som komprimerte base64-strenger direkte i Firestore-dokumentet
// (samme prinsipp som IndexedDB-versjonen brukte) — Firebase Storage krever nå
// betalingskort (Blaze-plan) selv innenfor gratiskvoten, så vi lot være.
export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

// Lokal cache gjør at appen fortsatt viser (og køer endringer) uten nett,
// og synker automatisk når nettet er tilbake.
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
});
