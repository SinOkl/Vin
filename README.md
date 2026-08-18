# Vinkjelleren

En enkel app for å holde oversikt over vinene i vinkjelleren din: lagring (temperatur/fuktighet), drikkevindu, matpar og smaksnotater. Bygget som en installerbar nettapp (PWA) — ingen Google Play nødvendig, og alle data lagres kun lokalt på telefonen din.

Ingen Node.js, Python eller andre utviklerverktøy trengs for å bruke eller endre appen — det er ren HTML/CSS/JavaScript.

## Filer

- `index.html`, `styles.css`, `app.js`, `db.js` — selve appen
- `manifest.webmanifest`, `sw.js`, `icons/` — gjør appen installerbar og delvis offline-kapabel
- `serve.ps1` — en liten lokal webserver for testing (se under)

## Kom i gang: to måter å få den på telefonen

### 1. Rask test på hjemmenettverket (i dag, uten oppsett)

Denne datamaskinen kan være webserver for hjemmenettverket ditt:

1. Dobbeltklikk `serve.ps1`, eller kjør i PowerShell:
   ```powershell
   powershell -ExecutionPolicy Bypass -File serve.ps1
   ```
2. På Android-telefonen (må være på **samme WiFi**), åpne Chrome og gå til:
   ```
   http://192.168.10.108:8080
   ```
   (IP-adressen kan endre seg om ruteren tildeler ny adresse — sjekk med `ipconfig` om den slutter å virke.)
3. Du kan bruke appen slik, men fordi dette er "vanlig http" og ikke https, vil ikke Chrome tilby "Legg til på hjemskjerm" som en ordentlig app, og den fungerer ikke offline. Den er likevel fullt funksjonell for testing — alt lagres i telefonens nettleser.

Merk: Datamaskinen må stå på og kjøre `serve.ps1` for at telefonen skal nå appen.

### 2. Anbefalt: gratis, permanent hosting med HTTPS (ekte "installer app"-opplevelse)

For å få den skikkelige PWA-opplevelsen (ikon på hjemskjerm, fungerer offline, ingen adressefelt synlig) må appen ligge på en https-adresse. Enklest gratisalternativ uten noe kommandolinjeverktøy er **GitHub Pages**:

1. Opprett en gratis konto på [github.com](https://github.com) hvis du ikke har en.
2. Opprett et nytt repository (f.eks. `vinkjeller`), offentlig, uten noen init-filer.
3. Åpne repoet i nettleseren → "Add file" → "Upload files" → dra inn **alle filene** i denne mappen (`index.html`, `styles.css`, `app.js`, `db.js`, `manifest.webmanifest`, `sw.js`, og hele `icons`-mappen) → Commit.
4. Gå til repoets **Settings → Pages** → under "Build and deployment" velg **Deploy from a branch**, branch `main`, mappe `/ (root)` → Save.
5. Etter ca ett minutt får du en lenke som `https://dittbrukernavn.github.io/vinkjeller/`. Åpne den i Chrome på Android.
6. Chrome spør (eller: meny ⋮ → "Legg til på Startskjerm" / "Installer app"). Da får du et eget app-ikon som åpner appen i fullskjerm, uten adressefelt, og med offline-cache.

Når du endrer appen senere (f.eks. ber meg legge til flere felt), last opp de endrede filene på nytt til GitHub — Pages oppdaterer seg automatisk.

## Om dataene dine

Alle viner lagres i nettleserens IndexedDB **på den ene enheten/nettleseren** du bruker — de sendes ikke til noen server. Det betyr:

- Data forsvinner ikke mellom økter, men følger ikke med hvis du bytter telefon eller sletter nettleserdata.
- Bruk **Innstillinger → Eksporter til fil** jevnlig for å ta sikkerhetskopi (en `.json`-fil).
- **Innstillinger → Importer fra fil** kan lese den samme filen tilbake inn, f.eks. på en ny telefon.

## Funksjoner

- Registrer viner med produsent, årgang, type, land/region, druer, antall flasker, volum, innkjøpspris/-dato
- Lagringsinfo: sted, **lagringstemperatur** og **serveringstemperatur** hver for seg, fuktighet, drikkeklar-vindu (fra/til år) — med automatiske forslag basert på vintype som du kan overstyre
- Matpar: velg blant faste kategorier (rødt kjøtt, fisk, ost, osv.) + eget fritekstfelt
- Smaksnotater og stjernevurdering
- Bilde av etiketten (bruker telefonens kamera direkte)
- Søk og filtrering (type, matpar, drikkestatus)
- Dashboard som varsler om viner som bør drikkes snart eller er "på hell"
- **Drikkehistorikk**: «🍾 Merk som drukket» på en vin flytter den ut av kjeller-tellingene og over i en egen historikk-liste (Viner → «Drukket»), med dato for når den ble tatt ut. Kan angres med «Legg tilbake i kjelleren».
- Eksport/import for sikkerhetskopi — filimport støtter å velge **flere JSON-filer samtidig**
- **Legg til viner med AI**: Legg til-fanen → «Kopier AI-mal» gir deg en ferdig prompt du kan lime inn i Claude/ChatGPT sammen med et bilde av etiketten. Lim AI-ens JSON-svar tilbake i feltet — ett vinobjekt fyller ut skjemaet for gjennomsyn før lagring, en hel liste med viner importeres rett inn. Hopper stille over eventuelle poster som mangler navn.

## Kjent begrensning i denne test-forhåndsvisningen

Da jeg testet appen inne i utviklingsmiljøet mitt (ikke på telefonen din), ga service worker-registreringen en ufarlig konsollfeil på grunn av hvordan forhåndsvisningen er sandkasset — dette er spesifikt for testmiljøet mitt og vil ikke opptre når appen kjører på ekte hosting (GitHub Pages) eller i en vanlig nettleser.
