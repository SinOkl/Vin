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
- **Viktig:** Node.js og Python ble installert på denne PC-en (via `winget`, se punkt 30) —
  men prosjektet har fortsatt bevisst **ingen** build-verktøy/bundler. Hold deg til vanilla
  JS og CDN-baserte ES-module-imports (`https://www.gstatic.com/firebasejs/...`) med mindre
  Sindre eksplisitt ber om å legge til et byggetrinn — det er en egen, større beslutning som
  påvirker hele dev-/deploy-flyten, ikke noe å gjøre i forbifarten for én funksjon.

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

27. **Tre tydelige legg-til-veier på Vin/Brennevin-fanen**: `visVinliste()` viste tidligere
    kun én knapp («med bilde og skanning»), pluss den flytende bunn-CTA-en som gjorde det
    samme — i praksis to knapper for én og samme flyt. Nå viser fanen tre knapper:
    bilde+skanning (uendret, `#/registrer`), **«Legg til flere»** (ny rute
    `#/importer-flere`, evt. `/brennevin`, ny `visImporterFlere()`) og **«Legg til
    manuelt»** (ren lenke til den allerede eksisterende `#/ny`-ruten — ingen ny kode der).
    «Legg til flere» samler tre måter å registrere mange flasker på ett sted: lim inn en
    JSON-liste (kaller den eksisterende `importerFraJsonTekst`, uendret), last opp flere
    `.json`-filer samtidig (samme funksjon som Innstillinger → Sikkerhetskopi alltid har
    hatt, nå trukket ut til delt `importerFraFilerListe()` så begge stedene bruker samme
    logikk), og en egen «kopier AI-mal»-knapp som ber om en JSON-**liste** i stedet for ett
    objekt. AI-malene er refaktorert til én delt bygger, `byggAiPrompt({ flertall, ... })`
    — `byggRegistrerPrompt` (enkel flaske) og den nye `byggRegistrerFlerePrompt` (flere)
    er nå tynne wrappere rundt denne, slik at fremtidige endringer i AI-instruksjonene
    (søk-/pris-regler, `AI_JSON_SKJEMA_OG_REGLER`) automatisk følger med i begge variantene
    i stedet for å måtte oppdateres to steder. Den flytende bunn-CTA-en («Legg til
    flaske») pekte tidligere til riktig kategori ut fra hvilken fane du sto på — det er nå
    fjernet med vilje (avklart med Sindre): den peker alltid til samme sted
    (`#/registrer`, Vin) uansett hvilken side du er på, siden fanene selv nå har alle tre
    valgene tydelig framme.

28. **Punkt 27 reversert etter tilbakemelding — for mange knapper**: tre knapper på
    Vin/Brennevin-fanen ble for mye. Fanen er tilbake til kun én knapp («📷 Legg til
    vin/brennevin med bilde og skanning»), akkurat som før punkt 27. Den egne
    «Legg til flere»-siden (`#/importer-flere`, `visImporterFlere()`) og den separate
    batch-AI-malen (`byggRegistrerFlerePrompt`/`byggAiPrompt`) er fjernet igjen — koden
    fantes i ett pushet commit, men er nå slettet. I stedet:
    - **«Legg til manuelt»** ligger nå som egen knapp *under* «Hopp over bilde»/«Avbryt»
      på selve bilde-steget (`registrerBildeSteg`) — synlig idet man skal ta bildet av
      etiketten, ikke som en konkurrerende knapp på fanen. Kamera-forhåndsvisningen
      (`.kamera-boks .skann-video`) fikk redusert maks-høyde (60vh → 44vh, kun for dette
      steget, ikke skanne-steget) slik at den ekstra knapperaden får plass på skjermen
      uten scrolling.
    - **«Legg til flere» (batch)** er slått sammen tilbake inn i den ordinære AI-malen —
      `byggRegistrerPrompt` ber nå AI-en svare med en JSON-**liste** (i stedet for ett
      objekt) hvis brukeren beskriver/limer inn bilde av flere flasker i samme melding
      (flere etiketter, strekkoder eller navn). Forklaringsteksten i skjemaets AI-seksjon
      (`visSkjema`, delt av både `#/ny` og strekkode-flyten) er utvidet for å gjøre dette
      tydelig — selve import-logikken (`ai-bruk-knapp` → `importerFraJsonTekst`) var
      allerede der fra før og er uendret. `importerFraFilerListe()`-hjelperen fra punkt 27
      beholdes (brukes fortsatt av Innstillinger → Sikkerhetskopi sin fil-import).

29. **Selve «med bilde og skanning»-knappen på Vin/Brennevin-fanen er også fjernet**: etter
    punkt 28 satt fortsatt én knapp igjen øverst på fanen (i tillegg til den flytende
    bunn-CTA-en «Legg til flaske», som allerede gjorde det samme) — fortsatt to knapper for
    én og samme handling. Den er nå fjernet fra `visVinliste()`; bunn-CTA-en er bevisst
    eneste inngang for å legge til flasker.

30. **Tilbakemeldingsmodul (`feedback-modul/`) — gjenbrukbar «forslag og tilbakemelding»**:
    egen mappe, bevisst bygget som et *frittstående, gjenbrukbart* verktøy Sindre kan kopiere
    inn i fremtidige apper, ikke bare en Vinkjeller-spesifikk funksjon. Arkitekturvalget
    (etter en egen vurderingsrunde av språk/fleksibilitet) er ekte
    **Web Components (Custom Elements + Shadow DOM)** i vanilla JS — ingen npm, ingen
    byggetrinn (i tråd med "ingen build-verktøy"-prinsippet), men likevel gjenbrukbart i en
    hvilken som helst fremtidig app/rammeverk, siden Custom Elements er en nettleserstandard.
    Shadow DOM gir ekte CSS-isolasjon (kolliderer aldri med vertsappens `styles.css`), mens
    CSS custom properties (`--tbm-*`) bevisst krysser Shadow DOM-grensen slik at vertsappen
    likevel kan temae widgeten (Vinkjelleren setter `--tbm-primaer` osv. til sine egne
    `--bordo`/`--font-brod`-tokens i `monterTilbakemeldingWidget()`/`visTilbakemeldinger()`
    i `app.js`). Datalaget (`feedback-db.js`) er isolert bak et lite `{send, abonner,
    settStatus}`-grensesnitt slik at en fremtidig app uten Firebase kan bytte backend uten å
    røre UI-komponentene — se `feedback-modul/README.md` for full gjenbruksoppskrift og API.
    - `<tilbakemelding-widget>`: flytende knapp (montert i `startBrukerAbonnement()` sin
      `status === 'godkjent'`-gren, fjernet ved utlogging) → modal med type/fritekst, pluss
      valgfritt skjermbilde. Skjermbilde er **kun filopplasting**
      (`<input type="file" accept="image/*">`, bevisst uten `capture`-attributt — samme
      lærdom som er dokumentert under, se fallgruvelisten) — ikke `getDisplayMedia`, som ble
      vurdert og forkastet pga. svak/manglende støtte i installerte PWA-er på iOS Safari.
      Valgt bilde tegnes inn på et `<canvas>` med et gjennomsiktig strek-lag oppå
      (Pointer Events, fungerer likt for mus/touch/penn) hvor brukeren kan ringe inn/markere
      feil med en rød frihåndspenn («Angre strek»/«Fjern bilde» finnes). Ved innsending
      flates lagene sammen og komprimeres til JPEG (`bildeverktoy.js`, samme
      skaler-til-maks-bredde-prinsipp som `skalerOgKomprimerDataUrl` i `app.js`, men portert
      inn i modulen selv — den skal ikke importere fra `app.js`) og lagres som base64 direkte
      i Firestore-dokumentet (ingen Storage/Blaze, samme begrunnelse som etikettbilder).
    - `<tilbakemelding-admin>`: sanntidsliste med statusfilter (ny/lest/løst), miniatyrbilde
      m/lightbox og statusnedtrekk per rad. Monteres på ny rute `#/tilbakemeldinger`
      (`visTilbakemeldinger()` i `app.js`, samme admin-vaktmønster som `#/godkjenninger`:
      `if (bruker.uid !== ADMIN_UID) { location.hash = '#/'; return; }`), lenket fra et nytt
      «🗣️ Tilbakemeldinger»-avsnitt i Innstillinger (rett under Godkjenninger-boksen). Ingen
      ny navbar-badge for dette — ville krevd å flette med den eksisterende
      ventende-brukere-badgen på samme navlink, ikke verdt kompleksiteten foreløpig.
    - `firestore.rules` har fått en ny `match /tilbakemeldinger/{id}`-blokk (enhver
      `erGodkjent()`-bruker kan opprette, kun `adminUid()` kan lese/liste/endre status,
      ingen kan slette) — **må limes inn manuelt i Firebase Console** før innsending faktisk
      fungerer, se `feedback-modul/firestore-rules-tillegg.txt` for den rene,
      Vinkjeller-uavhengige originalversjonen av samme blokk (til bruk i en fremtidig app).
      **Ikke testet med ekte innlogging/innsending ennå.**
    - Node.js og Python ble installert på maskinen på Sindres forespørsel (via `winget`)
      underveis i denne økten — se fallgruve under om hvorfor det likevel ikke endrer noe i
      selve Vinkjeller-prosjektets bygge-/deploy-oppsett.

31. **Tilbakemeldingsmodul — to feil rettet etter live-testing på ekte telefon**:
    - Komponentens egen flytende knapp la seg oppå den eksisterende flytende
      «Legg til flaske»-CTA-en (`#cta-legg-til` i `index.html`) — samme hjørne, kolliderte
      visuelt. `tilbakemelding-widget.js` fikk et nytt `visFlytknapp`-konfigfelt (default
      `true`, men satt til `false` i `monterTilbakemeldingWidget()` i `app.js`); inngangen er
      i stedet en vanlig «Gi tilbakemelding»-knapp øverst på Innstillinger-siden (synlig for
      alle brukere, ikke bare admin), som kaller `tilbakemeldingWidget.apne()` direkte.
    - Send/Avbryt/Angre strek-knappene havnet visuelt bak det vedlagte skjermbildet. Rotårsak:
      `.tbm-canvasstack` (containeren rundt bunn-canvaset og tegne-canvaset) fikk aldri en
      egen høyde — begge canvasene var `position: absolute`, og et forsøk på å gjøre
      bunn-canvaset `position: relative` via en egen klasse (`.tbm-canvas-bunn`) tapte for
      CSS-spesifisitet mot den generelle `.tbm-canvasstack canvas`-regelen (11 vs. 10 i
      spesifisitet) og ble derfor aldri brukt. En `position: relative`-boks uten noe
      in-flow-innhold kollapser til 0 høyde, så resten av modalen «forsvant» inn i det
      (fortsatt synlige, men overlappende) bildet. Fikset ved å sette en eksplisitt
      px-bredde/-høyde på `.tbm-canvasstack` fra JS (`_settCanvasstorrelse()`, kalt når et
      bilde lastes inn) ut fra bildets faktiske proporsjoner, i stedet for å stole på at ett
      av de to overlappende canvasene skulle gi containeren størrelse.

32. **Slette tilbakemeldinger + eget CLI-verktøy for å hente dem inn i Claude Code**:
    - `firestore.rules` sin `tilbakemeldinger`-blokk tillot ikke sletting i det hele tatt
      (`allow delete: if false`). Endret til `if innlogget() && request.auth.uid ==
      adminUid()`, og `tilbakemelding-admin.js` fikk en 🗑-knapp per rad (med
      `confirm()`-bekreftelse) som kaller den nye `feedbackDB.slett(id)`
      (`feedback-db.js` fikk en `slett()`-metode i tillegg til `send/abonner/settStatus`).
      Samme endring i `feedback-modul/firestore-rules-tillegg.txt` for portabilitet.
    - Ny `verktoy/`-mappe (Node.js, **ikke** en del av selve appen — se fallgruve under):
      `verktoy/tilbakemeldinger-cli.js` bruker Firebase Admin SDK (`firebase-admin`,
      installert via `npm install` i `verktoy/`, se `verktoy/package.json`) til å
      liste/endre status/slette tilbakemeldinger direkte fra terminalen, uten å gå via
      appens UI. Krever en service account-nøkkel (`verktoy/service-account.json`,
      lastes ned fra Firebase Console → Prosjektinnstillinger → Service accounts — **denne
      filen er en hemmelighet på linje med et passord** og er lagt til i en ny
      `.gitignore` i prosjektroten sammen med `verktoy/node_modules/` og
      `verktoy/skjermbilder/`, aldri commit den). Vedlagte skjermbilder skrives ut som
      `verktoy/skjermbilder/<id>.jpg` i stedet for å dumpes som rå base64 i terminalen, slik
      at Claude kan lese dem direkte. Se `verktoy/README.md` for full oppskrift. Formålet:
      Sindre kan be Claude Code kjøre `node tilbakemeldinger-cli.js` for å hente inn nye
      tilbakemeldinger (inkl. skjermbilder) rett i samtalen og jobbe med dem sammen, i
      stedet for å måtte lese dem i appen eller Firebase Console først.

33. **Dagens fakta på Oversikt**: én gang per app-åpning (idet en godkjent bruker akkurat er
    logget inn og går videre til appen, i `startBrukerAbonnement()` i `app.js`) hentes og
    registreres et faktapar — ett **nybegynnerfakta** og ett **morofakta** for entusiaster —
    og vises øverst på Oversikt-siden, rett under flaskeantallet/fordelingsbaren
    (`.fakta-boks` i `visOversikt()`), ikke som en popup. Datalaget:
    - `fakta.json`: statisk, bunt-lastet pool på 50 nybegynner- (`nb`-id-prefiks) + 50
      moro-fakta (`mf`-id-prefiks), allerede skrevet og faktasjekket på norsk bokmål —
      ingen `level`-felt, tier avledes av id-prefikset.
    - `fakta-db.js`: henter poolen (`fetch('./fakta.json')`, cachet i modulen) og fører
      per-bruker fremdrift i en ny samling `faktafremdrift/{uid}` — stokket rekkefølge for
      hver pool (`nbShuffledFactIds`/`mfShuffledFactIds`), delt `currentIndex`/`cycleCount`
      (trygt fordi begge poolene alltid er like store, se `POOL_STORRELSE`), `totalOpens`,
      `lastOpenedAt`. Ved fullført syklus (index når 50) stokkes begge poolene på nytt og
      `cycleCount` økes; en «du har sett alle fakta igjen»-melding vises kun fra og med
      andre fullførte syklus (ikke ved aller første). `FaktaDB.registrerApning(uid)` gjør
      alt dette og returnerer et ferdig faktapar — ingen egen UI-modul (`fakta.js` ble
      vurdert, men droppet: visningen er nå bare et par ekstra linjer inni `visOversikt()`,
      ikke stor nok til å rettferdiggjøre en egen fil).
    - Resultatet caches i en ny modul-variabel (`dagensFakta` i `app.js`), satt via
      `hentDagensFakta()` (kalt fra `startBrukerAbonnement()`, samme vaktledd som
      `lastKjellereOgStart()` — kun én gang per innlogging). Siden Firestore-kallet er
      asynkront og kan komme etter at Oversikt allerede er tegnet, trigges et nytt `rute()`
      når svaret er klart (kun dersom brukeren fortsatt står på Oversikt). `dagensFakta`
      nullstilles ved utlogging (samme opprydding som `sisteBrukerStatus`/`ventendeBrukere`)
      slik at neste bruker på samme enhet ikke ser forrige brukers fakta før eget kall er
      hentet. Feil her (f.eks. `fakta.json` som ikke laster) logges bare til konsoll —
      fakta er en bonus, ikke kritisk, og blokkerer aldri resten av appen.
    - Ny **admin-side** `#/fakta-brukere` (lenket fra et nytt «🎲 Fakta-bruk»-avsnitt i
      Innstillinger, samme admin-vaktmønster som Godkjenninger/Tilbakemeldinger): flagger
      «storforbrukere» der `totalOpens` nærmer seg (innen 5) eller har passert
      `cycleCount * 50` — rent computed ut fra felter som allerede lagres, ingen egen
      lagring for flagget. Bruker en ny `BrukerDB.hentAlle()` (db.js) til å slå opp
      navn/e-post for uid-ene.
    - `firestore.rules` har fått en ny `match /faktafremdrift/{uid}`-blokk (samme mønster
      som `brukere/{uid}`: kun eier selv kan opprette/endre sitt eget dokument, kun admin
      kan liste hele samlingen) — **må limes inn manuelt i Firebase Console** før dette
      faktisk kan lagre fremdrift. `sw.js` (`CACHE_NAVN` bumpet) og versjonsmerket i
      `index.html` er oppdatert til å inkludere de nye filene.
    - Verifisert lokalt uten Firebase-sesjon (`.fakta-boks`-CSS-en sett i nettleseren med
      simulert data, ser riktig ut på mobilbredde — bordo/serif-tokens, badge-farger, ikke
      overflow). **Ikke testet med ekte innlogging/skriving til `faktafremdrift/` ennå** —
      neste steg er å bekrefte at fakta-boksen faktisk dukker opp på Oversikt ved ekte
      app-åpning og at fremdriften lagres riktig i Firestore.

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
- **To `position: absolute`-elementer oppå hverandre uten en `aspect-ratio`/eksplisitt
  størrelse gir en usynlig 0×0-forelder.** En `position: relative`-container med bare
  absolutt-posisjonerte barn får ingen egen høyde (de bidrar ikke til auto-høyde), så resten
  av siden "forsvinner" visuelt bak/inni det overflytende innholdet i stedet for å bli
  dyttet under det. Sett eksplisitt bredde/høyde (fra JS, ut fra faktisk innhold) på
  containeren i stedet for å stole på at ett av barna skal gi den størrelse — se
  `_settCanvasstorrelse()` i `feedback-modul/tilbakemelding-widget.js` (punkt 31).
- **CSS-spesifisitet slår kildeorden.** En senere regel med LAVERE spesifisitet (f.eks. én
  enkelt klasse) taper mot en tidligere regel med HØYERE spesifisitet (f.eks. klasse +
  type-selektor), uansett rekkefølge i filen — akkurat dette var årsaken til punktet over.
  Dobbeltsjekk spesifisitet, ikke bare kildeorden, når en "override"-regel ikke later til å
  ha noen effekt.
- **`verktoy/`-mappen (Node-baserte admin-skript, se punkt 32) er bevisst holdt utenfor
  selve appen** — `node_modules/`, `package-lock.json` og `service-account.json` ligger kun
  lokalt (gitignored) og lastes aldri av nettleseren/GitHub Pages. Service account-nøkkelen
  gir full tilgang til Firestore uavhengig av `firestore.rules` — den er like sensitiv som
  et passord.

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
