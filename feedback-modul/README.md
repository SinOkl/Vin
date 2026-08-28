# Tilbakemeldingsmodul

Gjenbrukbar "forslag og tilbakemelding"-funksjon: en flytende knapp + modal der brukere kan
skrive en tilbakemelding, legge ved et skjermbilde og markere hva som er galt med en rød
frihånds-penn, pluss en admin-liste for å lese/behandle det som kommer inn.

Bygget som to ekte [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
med Shadow DOM — ingen npm-pakker, ingen byggetrinn, ingen avhengighet til noen bestemt
vertsapp eller UI-rammeverk. Fungerer i en vanilla-JS-app (som denne), men like gjerne inni en
React-/Vue-/Angular-app, siden Custom Elements er en nettleserstandard.

## Hurtigstart i en ny app

1. Kopiér hele `feedback-modul/`-mappen inn i det nye prosjektet.
2. Sørg for at du allerede har en initialisert Firestore-instans (`db`) — se
   `firebase-init.js` i Vinkjelleren for et eksempel om appen ikke har et fra før.
3. Lim inn `firestore-rules-tillegg.txt` sitt innhold i appens `firestore.rules` og publiser
   den i Firebase Console (ingen CLI kreves — samme manuelle steg som resten av regelfilen).
4. I appens hovedskript:

```js
import { db } from './firebase-init.js';
import './feedback-modul/tilbakemelding-widget.js';
import './feedback-modul/tilbakemelding-admin.js';

// Etter innlogging — monter knappen én gang:
const widget = document.createElement('tilbakemelding-widget');
document.body.appendChild(widget);
widget.konfigurer({
  db,
  hentBrukerInfo: () => (gjeldendeBruker() ? { uid: gjeldendeBruker().uid, navn: gjeldendeBruker().displayName, epost: gjeldendeBruker().email } : null),
});

// På en admin-beskyttet side/rute:
const adminListe = document.createElement('tilbakemelding-admin');
containerElement.appendChild(adminListe);
adminListe.konfigurer({ db });
```

Rettighetsstyring (hvem som får se admin-listen) er **vertsappens** ansvar — komponentene
sjekker ingen tilganger selv, de bare kaller Firestore, som håndhever reglene fra steg 3.

## API

### `<tilbakemelding-widget>`

`.konfigurer(konfig)`:

| Felt | Påkrevd | Standard | Beskrivelse |
|---|---|---|---|
| `db` | ja | – | Firestore-instans |
| `hentBrukerInfo` | nei | `() => null` | Returnerer `{uid, navn, epost}` eller `null` for attribusjon |
| `samlingsnavn` | nei | `'tilbakemeldinger'` | Firestore-samlingen tilbakemeldinger skrives til |
| `typer` | nei | `['Forslag','Feil','Annet']` | Valgene i type-nedtrekket |
| `knappetekst` | nei | `'💬 Tilbakemelding'` | Teksten på den flytende knappen |
| `posisjon` | nei | `'hoyre'` | `'hoyre'` eller `'venstre'` — hvilket hjørne knappen flyter i |

Temaing: sett CSS-variabler på selve elementet (de krysser Shadow DOM-grensen med vilje):

```html
<tilbakemelding-widget style="--tbm-primaer:#7a1f3d; --tbm-primaer-hover:#5c1730; --tbm-font:'Public Sans',sans-serif;"></tilbakemelding-widget>
```

Se `stiler.js` for hele listen med variabler og standardverdier.

### `<tilbakemelding-admin>`

`.konfigurer({ db, samlingsnavn })` — samme `db`/`samlingsnavn` som over. Tegner en
sanntidsliste med statusfilter (alle/ny/lest/løst), viser vedlagt skjermbilde som miniatyr
(klikk for full størrelse) og lar deg endre status per rad.

## Datamodell

Én Firestore-samling, flat struktur:

```
tilbakemeldinger/{id} {
  type: 'Forslag' | 'Feil' | 'Annet',
  tekst: string,
  bilde: string | null,       // base64 JPEG data-URL, komprimert (~900px bredde, kvalitet 0.6)
  bruker: { uid, navn, epost } | null,
  side: string | null,        // location.hash/pathname ved innsending, til feilsøking
  status: 'ny' | 'lest' | 'løst',
  opprettet: Firestore Timestamp,
}
```

## Bytte ut datalaget

`feedback-db.js` er det eneste stedet som snakker med Firestore. Skal en fremtidig app bruke
en annen backend (REST-API, Supabase, ...), lag en ny fil som eksporterer samme grensesnitt:

```js
export function lagFeedbackDB(/* dine egne parametre */) {
  return {
    async send({ type, tekst, bilde, bruker, side }) { /* ... */ },
    abonner(callback) { /* returner en avslutt-funksjon */ },
    async settStatus(id, status) { /* ... */ },
  };
}
```

og pass den inn i stedet — `tilbakemelding-widget.js`/`tilbakemelding-admin.js` bryr seg ikke
om hvor dataen faktisk lagres.

## Bevisste valg / begrensninger

- **Skjermbilder er filopplasting, ikke `getDisplayMedia`-inntak.** Brukeren tar et vanlig
  OS-skjermbilde og velger det fra galleriet (`<input type="file" accept="image/*">`, bevisst
  **uten** `capture`-attributt — det hopper forbi filvelgeren og tvinger kamera). Dette virker
  likt på iPhone, Android og desktop; `getDisplayMedia` har svak/manglende støtte i installerte
  PWA-er på iOS Safari og ble derfor valgt bort.
- **Ingen ekstern fillagring** — bilder lagres som komprimert base64 i selve Firestore-
  dokumentet, samme prinsipp som Vinkjelleren for øvrig bruker for etikettbilder (Firebase
  Storage krever betalingskort/Blaze-plan selv på gratisnivå). Firestores dokumentgrense er
  1 MB; kompresjonen (maks ~900px bredde, JPEG-kvalitet 0.6) holder god margin til det.
- **Ingen tilgangskontroll i komponentene selv** — det håndheves av Firestore-reglene
  (`firestore-rules-tillegg.txt`) og av at vertsappen kun monterer `<tilbakemelding-admin>` bak
  sin egen admin-sjekk.
