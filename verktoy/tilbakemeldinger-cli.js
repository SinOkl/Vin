// Lite lokalt admin-verktøy: leser/behandler tilbakemeldinger direkte fra Firestore via
// Firebase Admin SDK, uavhengig av selve appen. Formålet er at Claude Code kan hente inn
// innsendte tilbakemeldinger rett i samtalen på forespørsel («vis tilbakemeldinger»/
// «sjekk tilbakemeldinger»), slik at Sindre og Claude kan gå gjennom og løse dem sammen
// uten å måtte åpne appen manuelt.
//
// Dette er et separat, Node-basert dev-verktøy (se verktoy/README.md for oppsett) — det er
// IKKE en del av selve Vinkjelleren, som fortsatt er build-fri vanilla JS i nettleseren.
//
// Bruk (fra verktoy/-mappen, etter npm install):
//   node tilbakemeldinger-cli.js                  → lister alle, nyeste først
//   node tilbakemeldinger-cli.js list --status=ny  → kun tilbakemeldinger med gitt status
//   node tilbakemeldinger-cli.js status <id> løst  → endre status
//   node tilbakemeldinger-cli.js slett <id>        → slett én tilbakemelding
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import admin from 'firebase-admin';

const her = path.dirname(fileURLToPath(import.meta.url));
const noekkelSti = path.join(her, 'service-account.json');

let noekkel;
try {
  noekkel = JSON.parse(readFileSync(noekkelSti, 'utf8'));
} catch {
  console.error(
    `Fant ikke ${noekkelSti}.\n\n` +
    'Last ned en service account-nøkkel: Firebase Console → ⚙️ Prosjektinnstillinger →\n' +
    'fanen "Service accounts" → "Generate new private key". Lagre den nedlastede fila som\n' +
    'nøyaktig verktoy/service-account.json (den er allerede lagt til i .gitignore — commit\n' +
    'den ALDRI).'
  );
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(noekkel) });
const db = admin.firestore();

const [, , kommandoRaw = 'list', ...resten] = process.argv;
const kommando = kommandoRaw.startsWith('--') ? 'list' : kommandoRaw;
const flagg = [kommandoRaw, ...resten].filter((a) => a.startsWith('--'));
const statusFilter = flagg.find((f) => f.startsWith('--status='))?.split('=')[1];
const args = [kommandoRaw, ...resten].filter((a) => !a.startsWith('--'));

async function list() {
  let q = db.collection('tilbakemeldinger').orderBy('opprettet', 'desc');
  const snap = await q.get();
  const rader = snap.docs.filter((d) => !statusFilter || d.data().status === statusFilter);

  if (!rader.length) {
    console.log(statusFilter ? `Ingen tilbakemeldinger med status "${statusFilter}".` : 'Ingen tilbakemeldinger.');
    return;
  }

  const bildeDir = path.join(her, 'skjermbilder');
  for (const doc of rader) {
    const f = doc.data();
    const dato = f.opprettet?.toDate ? f.opprettet.toDate().toLocaleString('nb-NO') : '(nettopp)';
    console.log('─'.repeat(64));
    console.log(`id:      ${doc.id}`);
    console.log(`type:    ${f.type}    status: ${f.status}    dato: ${dato}`);
    console.log(`bruker:  ${f.bruker ? (f.bruker.navn || f.bruker.epost || f.bruker.uid) : 'anonym'}`);
    if (f.side) console.log(`side:    ${f.side}`);
    console.log(`tekst:   ${f.tekst}`);
    if (f.bilde) {
      mkdirSync(bildeDir, { recursive: true });
      const base64 = f.bilde.replace(/^data:image\/\w+;base64,/, '');
      const filsti = path.join(bildeDir, `${doc.id}.jpg`);
      writeFileSync(filsti, Buffer.from(base64, 'base64'));
      console.log(`bilde:   verktoy/skjermbilder/${doc.id}.jpg`);
    }
  }
  console.log('─'.repeat(64));
  console.log(`${rader.length} tilbakemelding(er).`);
}

async function settStatus(id, status) {
  const gyldige = ['ny', 'lest', 'løst'];
  if (!id || !gyldige.includes(status)) {
    console.error(`Bruk: node tilbakemeldinger-cli.js status <id> <${gyldige.join('|')}>`);
    process.exit(1);
  }
  await db.collection('tilbakemeldinger').doc(id).update({ status });
  console.log(`OK — ${id} er nå "${status}".`);
}

async function slett(id) {
  if (!id) { console.error('Bruk: node tilbakemeldinger-cli.js slett <id>'); process.exit(1); }
  await db.collection('tilbakemeldinger').doc(id).delete();
  console.log(`Slettet ${id}.`);
}

if (kommando === 'list') await list();
else if (kommando === 'status') await settStatus(args[1], args[2]);
else if (kommando === 'slett') await slett(args[1]);
else { console.error(`Ukjent kommando: ${kommando}. Bruk list, status eller slett.`); process.exit(1); }

process.exit(0);
