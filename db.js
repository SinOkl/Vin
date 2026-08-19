// Firestore-basert datalag. Erstatter den tidligere IndexedDB-versjonen slik at
// flere personer kan dele samme kjeller. Modell:
//   kjellere/{kjellerId}                { navn, eierUid, inviteKode, medlemmer: [uid, ...], opprettet }
//   kjellere/{kjellerId}/viner/{vinId}   selve vin-/brennevindataen

import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, deleteDoc, updateDoc,
  query, where, onSnapshot, serverTimestamp, writeBatch, arrayUnion,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db } from './firebase-init.js';
import { gjeldendeBruker } from './auth.js';

function slumpKode(lengde = 6) {
  const tegn = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // uten forvekslbare tegn (0/O, 1/I)
  let kode = '';
  for (let i = 0; i < lengde; i++) kode += tegn[Math.floor(Math.random() * tegn.length)];
  return kode;
}

function brukerInfo() {
  const b = gjeldendeBruker();
  return { uid: b.uid, navn: b.displayName || b.email || 'Ukjent' };
}

// ---------- Kjellere ----------

export const KjellerDB = {
  async opprett(navn) {
    const b = brukerInfo();
    const data = {
      navn: (navn || '').trim() || 'Min kjeller',
      eierUid: b.uid,
      medlemmer: [b.uid],
      inviteKode: slumpKode(),
      opprettet: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'kjellere'), data);
    return { id: ref.id, ...data };
  },

  async hentMine() {
    const b = brukerInfo();
    const q = query(collection(db, 'kjellere'), where('medlemmer', 'array-contains', b.uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async bliMedViaKode(kode) {
    const b = brukerInfo();
    const renKode = kode.trim().toUpperCase();
    const q = query(collection(db, 'kjellere'), where('inviteKode', '==', renKode));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Fant ingen kjeller med den koden. Sjekk at du skrev riktig.');
    const kjellerDoc = snap.docs[0];
    const data = kjellerDoc.data();
    if (data.medlemmer.includes(b.uid)) {
      return { id: kjellerDoc.id, ...data };
    }
    await updateDoc(kjellerDoc.ref, { medlemmer: arrayUnion(b.uid) });
    return { id: kjellerDoc.id, ...data, medlemmer: [...data.medlemmer, b.uid] };
  },

  async nyInviteKode(kjellerId) {
    const kode = slumpKode();
    await updateDoc(doc(db, 'kjellere', kjellerId), { inviteKode: kode });
    return kode;
  },

  async forlat(kjellerId) {
    const b = brukerInfo();
    const snap = await getDoc(doc(db, 'kjellere', kjellerId));
    if (!snap.exists()) return;
    const nyeMedlemmer = snap.data().medlemmer.filter((uid) => uid !== b.uid);
    await updateDoc(doc(db, 'kjellere', kjellerId), { medlemmer: nyeMedlemmer });
  },
};

// ---------- Viner/brennevin i en kjeller ----------

function vinerCollection(kjellerId) {
  return collection(db, 'kjellere', kjellerId, 'viner');
}

export const VinDB = {
  // Abonnerer på sanntidsoppdateringer. Returnerer en funksjon som avslutter abonnementet.
  abonner(kjellerId, callback) {
    return onSnapshot(vinerCollection(kjellerId), (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (feil) => {
      console.error('Firestore-abonnement feilet:', feil);
    });
  },

  async hent(kjellerId, vinId) {
    const snap = await getDoc(doc(db, 'kjellere', kjellerId, 'viner', vinId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async lagre(kjellerId, vin) {
    const info = brukerInfo();
    const data = { ...vin };
    const erNy = !data.id;
    delete data.id;

    if (erNy) data.lagtTilAv = info;
    if (data.drukketDato && !data.drukketAv) data.drukketAv = info;
    if (!data.drukketDato) data.drukketAv = null;

    if (erNy) {
      const ref = await addDoc(vinerCollection(kjellerId), data);
      return ref.id;
    }
    await setDoc(doc(db, 'kjellere', kjellerId, 'viner', vin.id), data, { merge: true });
    return vin.id;
  },

  async slett(kjellerId, vinId) {
    await deleteDoc(doc(db, 'kjellere', kjellerId, 'viner', vinId));
  },

  // Batcher i grupper på 400 (Firestore-grensen er 500 operasjoner per batch).
  async importer(kjellerId, viner) {
    const info = brukerInfo();
    const kolleksjon = vinerCollection(kjellerId);
    let antall = 0;
    for (let i = 0; i < viner.length; i += 400) {
      const batch = writeBatch(db);
      for (const vin of viner.slice(i, i + 400)) {
        const { id, ...data } = vin;
        batch.set(doc(kolleksjon), { ...data, lagtTilAv: info });
        antall++;
      }
      await batch.commit();
    }
    return antall;
  },

  async slettAlt(kjellerId) {
    const snap = await getDocs(vinerCollection(kjellerId));
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  },
};
