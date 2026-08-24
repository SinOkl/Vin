# Vinkjelleren — prosjektstatus

> Les denne filen først i en ny økt for å plukke opp tråden. Skriv f.eks.:
> «Les PROSJEKTSTATUS.md i vinkjeller-mappen og fortsett derfra.»

## Hva dette er

Delt PWA for å holde oversikt over vin og brennevin. Flere personer logger inn med
Google og deler samme "kjeller" (database), med sanntidsoppdatering.

- **Live app:** https://sinokl.github.io/Vin/
- **GitHub-repo:** https://github.com/SinOkl/Vin
- **Firebase-prosjekt:** `vinkjeller-f21b1` (console.firebase.google.com)
- **Prosjektmappe:** `C:\Users\sindr\Claude Code\vinkjeller`
- **Nåværende versjon:** se `.versjon-merke` nederst i appen (index.html) — økes ved hver endring

## Status: fungerende og i bruk

Innlogging, deling via invitasjonskode, og kjernefunksjonene er testet og virker.
Se "Kjente mangler" nederst for det som gjenstår.

## Teknologi (ingen build-verktøy)

- Ren HTML/CSS/JavaScript (ES-moduler), ingen npm/React/bundler
- Firebase: Authentication (Google-innlogging) + Firestore (database)
- Hosting: GitHub Pages (auto-deploy fra `main`-branch)
- PWA: `manifest.webmanifest` + `sw.js` gjør den installerbar + delvis offline
- **Viktig:** denne PC-en har verken Node.js, npm eller Python installert — hold deg til
  vanilla JS og CDN-baserte ES-module-imports (`https://www.gstatic.com/firebasejs/...`)

## Filer

| Fil | Ansvar |
|---|---|
| `index.html` | Sideskall, bunnavigasjon, versjonsmerke |
| `styles.css` | All visuell stil, lys/mørk modus |
| `app.js` | All logikk: ruting, visninger, skjema, filter, kjeller-UI |
| `db.js` | Firestore-datalag: `KjellerDB` og `VinDB` |
| `auth.js` | Google-innlogging/utlogging |
| `firebase-init.js` | Kobler opp Firebase (Auth + Firestore m/offline-cache) |
| `firebase-config.js` | Firebase-prosjektets offentlige nøkler (trygt at disse er i git) |
| `firestore.rules` | Sikkerhetsregler — **limes inn manuelt** i Firebase Console → Firestore → Rules |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA-installasjon og cache |
| `serve.ps1` | Lokal testserver (`http://localhost:8080`) uten Node/Python |
| `README.md` | Bruker-/installasjonsdokumentasjon |

## Datamodell (Firestore)

```
invitasjoner/{inviteKode}           { kjellerId }
kjellere/{kjellerId}                { navn, eierUid, inviteKode, medlemmer: [uid,...], opprettet }
kjellere/{kjellerId}/viner/{vinId}  { kategori, navn, produsent, argang, type, land, region, druer,
                                       antallFlasker, volumCl, innkjopspris, innkjopsdato, kjoptHos,
                                       ean, lagringssted, lagringstemperatur, lagringsfuktighet,
                                       serveringstemperatur, drikkeklarFra, drikkeklarTil,
                                       matparKategorier, matparNotater, smaksnotater, vurdering,
                                       bilde (base64), drukketDato, lagtTilAv, drukketAv,
                                       aiToppAr, aiBegrunnelse, aiKonfidens, drikkeklarKilde }
```

## Alt som er bygget (kronologisk)

1. Grunnleggende vinregistrering: navn, produsent, årgang, type, land/region, druer, pris, dato
2. Lagringsforslag per vintype (temperatur, fuktighet) + drikkeklar-vindu med statuslogikk
3. Matpar-kategorier (faste + fritekst), smaksnotater, stjernevurdering
4. Bilde av etikett (kamera → komprimert til ~900px JPEG → lagres som base64)
5. Dashboard: antall, flasker, estimert verdi, varsler om drikkevindu
6. PWA-oppsett: installerbar på Android, ikoner, service worker
7. **AI-import**: ferdig prompt-mal (Legg til → «Kopier AI-mal»), limer inn AI-ens JSON-svar —
   ett objekt fyller ut skjema, en liste importeres direkte. Malen ber AI-en bruke nettsøk og
   sjekke pris på vinmonopolet.no
8. **Batch-import**: flere JSON-filer samtidig i Innstillinger
9. **Serveringstemperatur** skilt fra lagringstemperatur
10. **Drikkehistorikk**: «Merk som drukket» flytter til egen liste (kan angres), viser dato + hvem
11. **Brennevin-kategori**: egen fane parallelt med Vin, egne typer (Whisky, Vodka, Gin, Rom,
    Cognac/Brandy, Akevitt, Tequila, Likør) og egne lagrings-/serveringsforslag
12. **Sider** lagt til som type under Vin-kategorien
13. **Verdi-visning**: «antall × pris»-regnestykke synlig på detaljsiden
14. **Firebase-migrering** (den store jobben): fra lokal IndexedDB til delt Firestore
    - Google-innlogging (obligatorisk, ingen anonym modus)
    - Kjeller-konsept: opprette, bli med via 6-tegns kode, bytte mellom flere, forlate
    - Sanntidsoppdatering (`onSnapshot`) i stedet for refetch per navigasjon
    - «Lagt til av» / «Drukket av»-sporing
    - Firebase Storage **droppet bevisst** — krever nå betalingskort (Blaze) selv på gratisnivå;
      bilder ligger fortsatt som base64 i Firestore-dokumentet
15. **Sikkerhetsgjennomgang og -fiks**: strammet inn Firestore-regler etter at en gjennomgang
    avdekket at alle innloggede kunne liste ut alle kjelleres invitasjonskoder, og at
    medlemslister kunne manipuleres ved siden av selv-join. Løst med egen `invitasjoner`-samling
    (kun oppslåbar med kjent kode, aldri listbar) og presise array-diff-sjekker i reglene
16. **Del-invitasjon**: app-lenke + kode vises sammen i Innstillinger, med «Del»-knapp
    (Web Share API) og kort forklaring til nye brukere
17. **Flaskeantall-justering**: «+ Legg til flaske»-knapp, og «Tatt ut en flaske» som bare
    reduserer antallet (uten å flytte til historikk) helt til det er 1 igjen — da vises
    «Merk som drukket» i stedet
18. **Strekkodeskanning** (fase 1, uten Vinmonopolet-oppslag — se «Kjente mangler»):
    live kameraskanning via ZXing (`skann.js`, CDN-importert), ny `#/skann`-rute.
    Skanning finner duplikat i egen kjeller (foreslår «+ legg til flaske» i stedet for
    ny post), ellers bæres EAN-en over til det tomme skjemaet. Ny innstilling
    «Bruk AI-søk» (av som standard) tilbyr en egen AI-identifikasjons-prompt (Mal B)
    for ukjente strekkoder, med samme kopier-til-utklippstavle/lim-inn-JSON-mønster
    som «Legg til med AI» — nå med tolerant JSON-parsing (`parseAiJson`) som strips
    \`\`\`json-kodeblokker. AI-genererte drikkevindu-estimater merkes tydelig som
    estimat i detaljvisningen (`drikkeklarKilde: 'ai'`)

## Kjente fallgruver (lært på den harde måten — ikke gjenta)

- **Hash-only navigasjon laster ikke ny kode i test.** Bytter du bare `#/viner` → `#/ny` i
  nettleseren, kjøres samme (evt. gamle) JS-modul i minnet. Test alltid en fersk full
  navigasjon/reload etter kodeendringer.
- **Service worker cacher aggressivt.** Etter enhver endring i `app.js`/`styles.css`/`index.html`:
  bump `CACHE_NAVN` i `sw.js` OG versjonsstrengen i `.versjon-merke` (index.html), ellers ser
  brukeren gammel kode selv etter «refresh».
- **Firebase Storage krever nå Blaze-plan** (betalingskort) selv innenfor gratiskvote — derfor
  base64-bilder i Firestore i stedet.
- **Firestore-region er permanent** — kan ikke endres etter databasen er opprettet.
- **Ingen Firebase CLI på maskinen** — `firestore.rules` må limes inn manuelt i konsollen
  (Firestore Database → Rules → Publish) hver gang den filen endres. Jeg kan ikke deploye den
  automatisk.
- **Eksisterende kjellere trenger "Lag ny kode"** hvis `firestore.rules`/`db.js` sin
  invitasjons-logikk endres — gamle kjellere mangler bakoverkompatible data.
- **Lokal testserver (`serve.ps1`) er kun bundet til `localhost`**, ikke synlig fra andre
  enheter på nettverket (Windows URL-ACL-begrensning) — telefon-testing må skje via den
  faktiske GitHub Pages-URL-en, ikke `localhost`.
- **Push til GitHub**: `git` er tilgjengelig og autentisert på denne maskinen (fungerer uten
  ekstra oppsett) — `gh` CLI er derimot ikke installert.

## Kjente mangler / naturlige neste steg

- Eier kan ikke fjerne andre medlemmer fra en kjeller (kun selv-forlating)
- Ingen "gjenopprett slettet vin"
- Ingen egen fillagring for bilder (bevisst valg, se over)
- Sikkerhetsreglene er laget for en liten tillitsfull gruppe, ikke hardnet SaaS-nivå
- **Vinmonopolet-oppslag på skannet strekkode er bevisst utsatt** (fase 2 av
  strekkodeskanning, se punkt 18 over): api.vinmonopolet.no krever en hemmelig
  abonnementsnøkkel som ikke kan ligge i klientkoden på GitHub Pages. Neste steg når
  dette skal kobles inn:
  1. Brukeren oppretter selv utviklerkonto + abonnementsnøkkel på api.vinmonopolet.no
     (kontoopprettelse — kan ikke gjøres av meg)
  2. Brukeren oppretter en gratis Cloudflare-konto (e-post+passord, ikke kort) og en
     Worker som proxyer kallet og holder nøkkelen som en Worker-secret
  3. Deretter kan `handterSkannetEan` utvides til å slå opp mot Workeren før den
     faller tilbake til AI-identifikasjon, og resultatet caches i en ny delt
     `produkter/{ean}`-collection i Firestore (krever også en `firestore.rules`-endring
     — se skjemaet for `produkter/{ean}` beskrevet i `vinlagring-spesifikasjon.md`)
  4. Cache-oppfriskingen ble bevisst forenklet til "lat" (frisk opp ved ny skanning av
     samme EAN etter 24t) fremfor spesifikasjonens nattlige cron-jobb, for å unngå
     cron-infrastruktur + Firestore-tilgang med tjenestekonto-nøkkel i første omgang

## Andre dokumenter fra dette prosjektet

- [Slik får du Vinkjelleren på telefonen](https://claude.ai/code/artifact/6e345c3e-a7fb-43e5-9a20-979cf7f98188) — GitHub Pages-installasjon
- [Sett opp delt vinkjeller](https://claude.ai/code/artifact/37e5cafb-c7e0-4077-ad66-6c46c9bcfc23) — Firebase-oppsett fra bunnen
- [Vinkjelleren: teknisk oversikt](https://claude.ai/code/artifact/abe30dc8-5a5d-41e7-ad58-534ba03531e3) — arkitektur, stack, hvordan forklare det til andre
