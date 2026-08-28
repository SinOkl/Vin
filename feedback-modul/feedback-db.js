// Rent datalag for tilbakemeldingsmodulen. Tar imot en allerede initialisert Firestore
// `db`-instans (fra vertsappens egen firebase-init.js/tilsvarende) — denne filen oppretter
// ingen egen Firebase-app og vet ingenting om resten av vertsappens datamodell.
//
// Gjenbruk i en ny app: bytt evt. ut hele denne filen med en annen backend (REST-API,
// Supabase, ...) så lenge den eksporterer samme grensesnitt — {send, abonner, settStatus} —
// widget- og admin-komponentene bryr seg ikke om hvor dataen faktisk lagres.
import {
  collection, doc, addDoc, updateDoc, query, orderBy, onSnapshot, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export const TILBAKEMELDING_TYPER = ['Forslag', 'Feil', 'Annet'];
export const TILBAKEMELDING_STATUSER = ['ny', 'lest', 'løst'];

/**
 * @param {import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js').Firestore} db
 * @param {string} [samlingsnavn]
 */
export function lagFeedbackDB(db, samlingsnavn = 'tilbakemeldinger') {
  const kolleksjon = collection(db, samlingsnavn);

  return {
    /**
     * @param {{ type: string, tekst: string, bilde?: string|null, bruker?: {uid:string,navn:string,epost?:string}|null, side?: string }} data
     */
    async send({ type, tekst, bilde, bruker, side }) {
      const renTekst = (tekst || '').trim();
      if (!renTekst) throw new Error('Skriv inn en tekst før du sender.');
      await addDoc(kolleksjon, {
        type: TILBAKEMELDING_TYPER.includes(type) ? type : 'Annet',
        tekst: renTekst,
        bilde: bilde || null,
        bruker: bruker || null,
        side: side || null,
        status: 'ny',
        opprettet: serverTimestamp(),
      });
    },

    // Sanntidsabonnement, nyeste først. Returnerer avslutt-funksjon.
    abonner(callback) {
      const q = query(kolleksjon, orderBy('opprettet', 'desc'));
      return onSnapshot(q, (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }, (feil) => console.error('[tilbakemelding] abonnement feilet:', feil));
    },

    async settStatus(id, status) {
      if (!TILBAKEMELDING_STATUSER.includes(status)) throw new Error(`Ugyldig status: ${status}`);
      await updateDoc(doc(kolleksjon, id), { status });
    },
  };
}
