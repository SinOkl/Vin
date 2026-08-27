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
Den nye legg-til-flyten (bilde → skann → skjema, punkt 20) og fyllnivå for brennevin
(punkt 22) er live-testet på ekte telefon og justert flere runder ut fra reell bruk —
se punkt 21, 23 og 24 for hva som ble rettet underveis. Se "Kjente mangler" nederst
for det som gjenstår.

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
| `db.js` | Firestore-datalag: `KjellerDB`, `VinDB` og `ProduktDB` (delt strekkode-cache) |
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
                                       aiToppAr, aiBegrunnelse, aiKonfidens, drikkeklarKilde,
                                       fyllniva (0–100, kun brennevin — mangler felt = tolkes som 100) }
produkter/{ean}                     { kategori, navn, produsent, argang, type, land, region, druer,
                                       lagringstemperatur, lagringsfuktighet, serveringstemperatur,
                                       drikkeklarFra, drikkeklarTil, matparKategorier, matparNotater,
                                       aiToppAr, aiBegrunnelse, aiKonfidens, drikkeklarKilde, oppdatert }
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
18. **Strekkodeskanning**: live kameraskanning via ZXing (`skann.js`, CDN-importert),
    ny `#/skann`-rute. Skanning sjekker først egen kjeller for duplikat (foreslår
    «+ legg til flaske» i stedet for ny post), deretter den delte strekkode-cachen
    (`produkter/{ean}` i Firestore, se `db.js` → `ProduktDB`) — kjent fra før gir
    momentant utfylt skjema. Ukjent strekkode + innstillingen «Bruk AI-søk» (av som
    standard, se Innstillinger) tilbyr AI-identifikasjon. Alle lagringer av en vin
    med strekkode oppdaterer den delte cachen, slik at neste skann av samme flaske —
    av hvem som helst i appen — treffer momentant. Ingen ekstern API-avhengighet (se
    «Kjente mangler» for hvorfor direkte Vinmonopolet-oppslag ble valgt bort).
    AI-genererte drikkevindu-estimater merkes tydelig som estimat i detaljvisningen
    (`drikkeklarKilde: 'ai'`)
19. **AI-mal og -identifikasjon delt/samkjørt, og «kopier + åpne Claude» i appen**:
    `AI_JSON_SKJEMA_OG_REGLER` er delt mellom `AI_PROMPT_MAL` (bilde-basert) og
    `byggUkjendVinPrompt` (strekkode-basert) slik at begge alltid ber om nøyaktig
    samme felter og kan parses likt (inkl. tolerant `parseAiJson` som strips
    \`\`\`json-kodeblokker). Knappen(e) i AI-seksjonen kopierer nå til utklippstavlen
    OG åpner `https://claude.ai/new` i en ny fane i samme trykk — sparer brukeren for
    å bytte fane manuelt. For strekkode-flyten (kun tekst) er dette ett trykk. For
    bilde-flyten er det to knapper i rekkefølge — «1. Kopier bilde og åpne Claude»,
    deretter «Kopier tekst også» — fordi Claude sin lim-inn-håndtering viste seg å
    plukke bildet og droppe teksten når begge lå i samme utklipp (se fallgruve under)
20. **Ny legg-til-flyt: bilde → strekkode → skjema, i ett sammenhengende forløp** (erstatter
    den gamle todelte flyten med separat «Skann strekkode»-side og gjettet «Bruk AI-søk»-bryter
    i Innstillinger, som begge er fjernet):
    - «+ Legg til vin/brennevin med bilde og skanning» (`#/registrer`, evt. `/brennevin`) åpner
      først et live kamera med en firkant-ramme-overlay og teksten «Tar bilde av etiketten»
      (`registrerBildeSteg` i `app.js`). Bildet tas med `getUserMedia` + canvas (ikke
      filopplasting), og komprimeres med samme `skalerOgKomprimerDataUrl`-logikk som
      filopplasting alltid har brukt
    - Rett etter (eller ved «Hopp over bilde») går appen automatisk videre til
      strekkodeskanning («Skanner strekkode», `registrerSkannSteg`, gjenbruker `skann.js`)
    - Treff sjekkes i `handterRegistrertEan`: egen kjeller først (duplikat-varsel), så den
      delte `produkter/{ean}`-cachen. Cache-treff hopper rett til utfylt skjema — ingen AI
      involvert. Cache-bom (eller hoppet/feilet skanning) går til skjemaet (`#/ny`) med
      bildet og en ev. strekkode med seg, klar for AI-seksjonen
    - Skjemaets AI-seksjon er nå én samlet blokk uansett inngang (direkte `#/ny`, ukjent
      strekkode, eller uten strekkode i det hele tatt): fritekstfelt («Det du vet om
      flasken», med eksplisitt hint om å oppgi årgang siden verken bilde eller strekkode
      nødvendigvis fanger den) + to knapper — «Kopier kode og åpne Claude» (kopierer
      strekkode+prompt+fritekst i én operasjon, åpner `claude.ai/new`) og «Kopier bilde»
      (egen knapp, fordi Claude sin lim-inn-håndtering ikke takler bilde+tekst i samme
      utklipp — se fallgruve). Prompten bygges nå av én funksjon, `byggRegistrerPrompt`,
      som erstattet de to gamle separate malene (`AI_PROMPT_MAL` og `byggUkjendVinPrompt`)
    - JSON-skjemaet AI-en skal svare med (`AI_JSON_SKJEMA_OG_REGLER`) og selve
      utfyllingslogikken (`parseAiJson`, `normaliserImportertVin`, `fyllSkjemaFraVin`,
      «Bruk JSON»-knappen) er **ikke** endret
    - Den manuelle «📷 Skann strekkode»-knappen inni skjemaet, den frittstående
      `#/skann`-siden og «Bruk AI-søk»-innstillingen er fjernet — skanning skjer nå alltid
      automatisk som del av legg-til-flyten i stedet for som et opt-in-tillegg
21. **Justerbare UI-detaljer etter tilbakemelding**: stor sentrert rund «lukkerknapp» for å ta
    bilde (var for liten/plassert feil for tommeltrykk), bilder beskjæres nå til 3:4-høyformat
    (`.detaljbilde`, kamera-rammen) i stedet for bredt/lavt — passer bedre til vinetiketter.
    Flasker uten eget bilde viser nå en fargekodet flaske-/glass-silhuett per type
    (`plassholderSvg` i `app.js`, farger i `TYPE_FARGE`) i stedet for samme 🍷-emoji for alt
    vin uansett type (så alt uten bilde så ut som rødvin)
22. **Fyllnivå for brennevin**: eget felt `fyllniva` (0–100 %, kun relevant for kategorien
    Brennevin — brennevin drikkes typisk over uker/måneder, ikke i én omgang som vin).
    Glidebryter (`<input type="range">`) på detaljsiden (lagrer med én gang ved slipp,
    `hentFyllniva`-hjelperen behandler eldre poster uten feltet som 100 % fulle) og i
    legg til/rediger-skjemaet (vises/skjules dynamisk ved kategoribytte via
    `byttKategoriISkjema`). Vinkort i listen viser en tynn fyllnivå-linje når < 100 %.
    Bevisst *ikke* koblet til «antall flasker»-tellingen eller «Merk som drukket» —
    to uavhengige konsepter (antall hele flasker vs. hvor mye som er igjen i den åpne)
23. **Fikset feil estimert verdi + verdi per fane**: etter at fyllnivå kom inn (punkt 22)
    telte «estimert verdi» fortsatt en anbrutt brennevinsflaske til full pris. Ny felles
    hjelper `vinVerdi(v)` regner brennevin som `(antall−1) hele + fyllnivå% av den siste`
    (vin er upåvirket — fortsatt `antall × pris`), brukt av både oversikten og detaljsiden
    (`beregnStats`-hjelperen for summering av lister). I tillegg viser nå Vin- og
    Brennevin-fanen hver sin «X flaske(r) · estimert verdi Y kr»-linje for egen kategori,
    ikke bare den kombinerte summen på oversikten
24. **Fikset race i «+ Legg til flaske»/«− Tatt ut en flaske»**: knappene leser
    `v.antallFlasker` fra rendringen de ble tegnet i (lukket over i klikk-handleren) og
    skriver `+1`/`−1` til Firestore. Trykker man raskt flere ganger — f.eks. for å gå fra
    1 til 8 flasker — rekker siden ikke tegnes på nytt med fersk `v` mellom hvert trykk, så
    hvert trykk regnet `+1` fra det SAMME gamle tallet i stedet for å akkumulere (så antallet,
    og dermed «estimert verdi», ikke gikk opp som forventet). Fikset ved å deaktivere knappen
    med én gang den trykkes (`knapp:disabled`-stil lagt til), slik at nye trykk må vente til
    en fersk rendring (med ny, ikke-deaktivert knapp) er klar. Merk: å redigere «Antall
    flasker» direkte i skjemaet er upåvirket av dette — det er alltid ett atomisk skriv

25. **Godkjenning av nye brukere**: hver ny bruker som logger inn med Google for
    første gang havner nå i `brukere/{uid}` med `status:'ventende'` (opprettet av
    klienten selv, `BrukerDB.sikreEget` i `db.js`) og ser en venteskjerm — ingen
    tilgang til å opprette eller bli med i noen kjeller (håndhevet i
    `firestore.rules` via `erGodkjent()`, ikke bare i UI). Sindre
    (`ADMIN_UID`, hardkodet konstant i både `db.js` og `firestore.rules`) ser et
    badge-tall på Innstillinger-navlenken og godkjenner/avviser på den nye siden
    `#/godkjenninger`. Sanntidsoppdatert (`onSnapshot`) begge veier — søkeren
    slippes automatisk videre uten omlasting når admin godkjenner. Frikoblet fra
    invitasjonskode-flyten med vilje: godkjenning skjer én gang per konto, ikke
    per kjeller. **Kun in-app-varsel** (badge), ingen push til telefon — det
    ble bevisst valgt bort for å slippe Cloud Functions/Blaze-betalingsplan
    (samme kostnadsavveining som Storage, se «Kjente mangler»).
    `ADMIN_UID` er satt til Sindres faktiske uid (`po4qTCXpl4W7AneJDHdc5ZpkMM22`,
    fra Firebase Console → Authentication → Users) i både `db.js` og
    `firestore.rules`. De nye reglene er limt inn og publisert i Firebase
    Console, og koden er pushet til `main` (live på GitHub Pages). **Ikke
    live-testet ennå** — neste steg er å bekrefte at Sindre går rett inn som
    admin, og at et eksisterende medlem (f.eks. Anne Marie) treffer
    venteskjermen ved neste innlogging og kan godkjennes fra
    `#/godkjenninger` uten omlasting. Kan evt. forhåndsgodkjennes i Firebase
    Console i stedet ved å opprette et
    `brukere/{uid}`-dokument med `status:'godkjent'`).

26. **Visuell redesign etter Claude Design-mockup**: hele fargesystemet og typografien er byttet
    ut basert på et redesign-prosjekt bygget i Claude Design («Vine cellar — warm rustic
    redesign», lys variant valgt av Sindre). `styles.css` sitt `:root` bruker nå `oklch()`-
    baserte design-tokens (varm off-white bakgrunn, bordeaux `#7a1f3d` som primærfarge), Google
    Fonts `Lora` (overskrifter/tall) + `Public Sans` (brødtekst), og automatisk mørk modus
    (`prefers-color-scheme`) er fjernet til fordel for det faste lyse temaet. Bunnmenyen gikk fra
    5 til 4 faner (Oversikt/Vin/Brennevin/Innstillinger, prikk-indikator i stedet for emoji) —
    «Legg til» er nå en fast knapp (`#cta-legg-til` i `index.html`, styrt av
    `oppdaterLeggTilCta()` i `app.js`) som følger med over bunnmenyen på alle sider unntatt selve
    legg-til/rediger-flyten, og peker automatisk mot riktig kategori (Vin/Brennevin).
    Oversikt-siden (`visOversikt()`) fikk fargede topplinjer på statkortene, en ny
    vin/brennevin-fordelingsbar, og en «Nylig aktivitet»-seksjon (`nyligAktivitet()`) — denne er
    **avledet** fra eksisterende `drukketDato`/`innkjopsdato`-felter, ikke en ny hendelseslogg
    (appen har ingen egen aktivitetstabell). Kategori-ikonene i mockupen kunne ikke lastes ned
    pikselnøyaktig som PNG via Claude Design-verktøyet her (store base64-blobs ble korrumpert i
    overføringen gjennom chat-grensesnittet) — løst med egne inline-SVG-glassmotiv i `app.js`
    (omriss + farget innhold, stil etter et referansebilde Sindre sendte med glass-ikoner per
    type). `KATEGORI_IKON_BYGGER` dekker nå de fleste typene med egen, gjenkjennelig glassform
    (vinglass for Rødvin/Hvitvin/Rosévin/Dessertvin-Portvin, flute for Musserende, eple for
    Sider, tumbler m/isbiter for Whisky, tumbler for Rom/Cognac, shotglass for Vodka/Tequila,
    cordialglass for Akevitt/Likør, cocktailskål for Gin) — kun «Annet»-typene faller nå tilbake
    på den eldre, generiske `plassholderSvg()`-silhuetten. Skjema, kamera/skanne-flyt, Innstillinger
    og Godkjenninger fikk kun de nye farge-/font-tokenene via den globale CSS-en, ingen
    strukturendring — mockupen dekket ikke disse skjermene. **Ikke testet med ekte innlogging
    ennå** (kun verifisert lokalt uten Firebase-sesjon: ingen konsoll-/serverfeil, riktige
    fonter/farger/tokens, 4-faners nav og CTA-knapp skjules korrekt på innloggingssiden) — neste
    steg er å teste Oversikt/Viner/Detalj-sidene med ekte data på telefon, og huske
    `sw.js`/versjonsmerke er allerede bumpet (v2.11.0 / `vinkjeller-v32`).

## Kjente fallgruver (lært på den harde måten — ikke gjenta)

- **`<input type="file" capture="...">` hopper forbi filvelgeren og går rett til kameraet**
  på mobil — fjern `capture`-attributtet helt hvis brukeren skal kunne velge mellom kamera
  og galleri/album (som på bilde-feltet i legg til/rediger-skjemaet).

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
- **`navigator.clipboard`/`window.open` krever et ekte, synkront brukertrykk.** Begge kastes
  ut («NotAllowedError», eller popupen blokkeres) hvis det er en `await` (eller annen
  async-runde) mellom klikket og kallet — kall dem synkront først i klikk-handleren, gjør
  eventuell async-jobb (bildekomprimering, Firestore-oppslag) enten før (så resultatet
  ligger klart) eller vit at man mister brukerhandlingen om man venter etterpå.
- **`navigator.clipboard.write()` med bilde: bruk `image/png`, ikke `image/jpeg`** — ikke
  alle nettlesere (bl.a. Safari) godtar jpeg som representasjon i et `ClipboardItem`.
  Konverter via `<canvas>.toBlob(cb, 'image/png')` rett før kopiering, ikke lagringsformatet.
- **Kombinert tekst+bilde i ett `ClipboardItem` fungerer teknisk, men Claude sin
  lim-inn-håndtering plukker bildet og dropper teksten** når begge er representasjoner av
  samme utklipp. Løsningen ble to separate knapper/kopieringer (bilde for seg, tekst for
  seg) i stedet for å stole på at mottakeren håndterer flere formater i samme utklipp.

## Kjente mangler / naturlige neste steg

- Eier kan ikke fjerne andre medlemmer fra en kjeller (kun selv-forlating)
- Ingen "gjenopprett slettet vin"
- Ingen egen fillagring for bilder (bevisst valg, se over)
- Sikkerhetsreglene er laget for en liten tillitsfull gruppe, ikke hardnet SaaS-nivå
- **Direkte Vinmonopolet-oppslag på skannet strekkode er bevisst valgt bort**, ikke
  bare utsatt — undersøkt grundig (hentet den faktiske OpenAPI-spesifikasjonen deres
  direkte) og funnet at det offisielle API-et (`api.vinmonopolet.no`) verken støtter
  strekkode/EAN som søkefelt, eller gir noe mer enn `productId` + kort produktnavn per
  produkt (ingen pris, land, druer o.l.) — ville krevd nøkkel + backend-proxy for
  praktisk talt ingenting igjen. Det finnes et uoffisielt, udokumentert endepunkt
  (`app.vinmonopolet.no/vmpws/v2/vmp/products/barCodeSearch/{ean}`, brukt av npm-pakken
  `vinmonopolet`) som *har* støttet strekkode historisk, men denne hosten svarer ikke
  lenger (DNS finner den ikke) — trolig migrert bort siden pakken sist ble oppdatert i
  2023. Selve vinmonopolet.no sin egne nettside har fortsatt en fungerende
  strekkode-skanner (bruker forøvrig ZXing, akkurat som `skann.js`), men det
  bakenforliggende kallet er ikke kartlagt og ville uansett vært en uoffisiell,
  når-som-helst-kan-forsvinne-avhengighet.
- **Løsningen i stedet**: delt strekkode-cache i Firestore (`produkter/{ean}`, se
  `db.js` → `ProduktDB` og `firestore.rules`). Når noen lagrer en vin med strekkode —
  enten identifisert via AI-flyten eller fylt inn manuelt — lagres produktfakta
  (ikke personlige felt som antall/pris/bilde) i denne delte samlingen. Neste skann av
  samme strekkode, av hvem som helst i appen, gir treff momentant uten noen ekstern
  API-avhengighet i det hele tatt. Cachen "friskes" naturlig opp ved at nye redigeringer
  overskriver (merge) gamle fakta — ingen egen oppfriskingsjobb er bygget eller trengs.

## Andre dokumenter fra dette prosjektet

- [Slik får du Vinkjelleren på telefonen](https://claude.ai/code/artifact/6e345c3e-a7fb-43e5-9a20-979cf7f98188) — GitHub Pages-installasjon
- [Sett opp delt vinkjeller](https://claude.ai/code/artifact/37e5cafb-c7e0-4077-ad66-6c46c9bcfc23) — Firebase-oppsett fra bunnen
- [Vinkjelleren: teknisk oversikt](https://claude.ai/code/artifact/abe30dc8-5a5d-41e7-ad58-534ba03531e3) — arkitektur, stack, hvordan forklare det til andre
