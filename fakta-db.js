// Datalag for "fun fact"-popupen som vises ved app-åpning: ett nybegynnerfakta
// («nb»-id) og ett morofakta for entusiaster («mf»-id), vist i stokket rekkefølge
// per pool uten repetisjon før hele poolen er vist, deretter stokket på nytt.
//
// Faktapoolen (fakta.json) er statisk og bunt-lastet — 50 nb + 50 mf, allerede
// skrevet og faktasjekket. Fremdrift per bruker (hvilken stokket rekkefølge, hvor
// langt man har kommet, antall åpninger) lagres i faktafremdrift/{uid} — se
// firestore.rules for tilgangsreglene (kun eier + admin).
//
// nb/mf-tier avledes fra id-prefikset (id.startsWith('nb')/('mf')) — ikke et eget
// felt. Delt indeks/syklusteller for begge pooler er trygt fordi de alltid holdes
// like store (50 hver, se POOL_STORRELSE) — divergerer poolene i størrelse senere,
// må dette splittes i to uavhengige indeks/syklus-par (se spec).

import {
  doc, getDoc, setDoc, collection, getDocs, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db } from './firebase-init.js';

export const POOL_STORRELSE = 50;

let faktaPoolPromise = null;

async function lastFaktaPool() {
  if (!faktaPoolPromise) {
    faktaPoolPromise = fetch('./fakta.json')
      .then((svar) => {
        if (!svar.ok) throw new Error('Klarte ikke å laste fakta.json');
        return svar.json();
      })
      .catch((err) => { faktaPoolPromise = null; throw err; });
  }
  return faktaPoolPromise;
}

function stokk(liste) {
  const kopi = [...liste];
  for (let i = kopi.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopi[i], kopi[j]] = [kopi[j], kopi[i]];
  }
  return kopi;
}

export const FaktaDB = {
  // Registrerer én app-åpning for `uid` og returnerer faktaparet som skal vises:
  // { nb: {id, text, category}, mf: {...}, visFullsyklusMelding }.
  // visFullsyklusMelding er sann kun når brukeren akkurat har fullført en syklus
  // som IKKE var den aller første (cycleCount > 1 etter oppdatering).
  async registrerApning(uid) {
    const alleFakta = await lastFaktaPool();
    const nbFakta = alleFakta.filter((f) => f.id.startsWith('nb'));
    const mfFakta = alleFakta.filter((f) => f.id.startsWith('mf'));
    const faktaPerId = new Map(alleFakta.map((f) => [f.id, f]));

    const ref = doc(db, 'faktafremdrift', uid);
    const snap = await getDoc(ref);
    const eksisterende = snap.exists() ? snap.data() : null;

    let { nbShuffledFactIds, mfShuffledFactIds, currentIndex, cycleCount } = eksisterende || {};
    let visFullsyklusMelding = false;

    const trengerNyStokk = !nbShuffledFactIds || !mfShuffledFactIds
      || currentIndex === undefined || currentIndex >= POOL_STORRELSE;
    if (trengerNyStokk) {
      nbShuffledFactIds = stokk(nbFakta.map((f) => f.id));
      mfShuffledFactIds = stokk(mfFakta.map((f) => f.id));
      currentIndex = 0;
      cycleCount = (cycleCount || 0) + 1;
      visFullsyklusMelding = cycleCount > 1;
    }

    const nbId = nbShuffledFactIds[currentIndex];
    const mfId = mfShuffledFactIds[currentIndex];

    await setDoc(ref, {
      nbShuffledFactIds,
      mfShuffledFactIds,
      currentIndex: currentIndex + 1,
      cycleCount,
      totalOpens: (eksisterende?.totalOpens || 0) + 1,
      lastOpenedAt: serverTimestamp(),
    }, { merge: true });

    return { nb: faktaPerId.get(nbId), mf: faktaPerId.get(mfId), visFullsyklusMelding };
  },

  // Kun admin kan liste hele samlingen (håndhevet i firestore.rules) — brukes av
  // fakta-adminsiden til å flagge storforbrukere som nærmer seg/har passert en
  // full syklus. Rent computed flagg (se app.js) — ingen ekstra lagring.
  async hentAlleBrukerdata() {
    const snap = await getDocs(collection(db, 'faktafremdrift'));
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  },
};
