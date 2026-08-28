# Verktøy

Lokale admin-skript for Vinkjelleren, kjørt med Node.js. **Ikke** en del av selve appen —
appen er fortsatt build-fri vanilla JS servert direkte fra GitHub Pages, se
`PROSJEKTSTATUS.md`. Dette er kun et hjelpemiddel for å jobbe med Firestore-dataen (i
praksis: tilbakemeldinger) direkte fra terminalen/Claude Code, uten å måtte åpne appen.

## Engangsoppsett

1. **Hent en service account-nøkkel** (gir full admin-tilgang til Firestore — se advarsel
   under): Firebase Console → prosjektet `vinkjeller-f21b1` → ⚙️ Prosjektinnstillinger →
   fanen **Service accounts** → **Generate new private key**. Dette laster ned en
   `.json`-fil.
2. **Lagre den som `verktoy/service-account.json`** (nøyaktig dette navnet/stedet — filen
   er allerede lagt til i `.gitignore` i prosjektroten, så den havner aldri i git).
3. **Installer avhengigheten** (kun én gang, eller på nytt om `node_modules/` slettes):
   ```
   cd verktoy
   npm install
   ```

⚠️ **`service-account.json` er en hemmelighet på linje med et passord** — den omgår alle
`firestore.rules` og gir full lese-/skrivetilgang til hele databasen. Del den aldri, og
commit den aldri (selv om `.gitignore` skal fange det opp, dobbeltsjekk med `git status`
før du pusher om du noen gang flytter/omdøper filen).

## Bruk

Alt kjøres fra `verktoy/`-mappen:

```
node tilbakemeldinger-cli.js                    # list alle, nyeste først
node tilbakemeldinger-cli.js --status=ny         # kun ulest
node tilbakemeldinger-cli.js status <id> løst    # merk som løst
node tilbakemeldinger-cli.js slett <id>          # slett én
```

Vedlagte skjermbilder lagres som `verktoy/skjermbilder/<id>.jpg` (også gitignored) slik at
de kan åpnes/leses direkte i stedet for å dumpe rå base64 i terminalen.

**Vanlig arbeidsflyt med Claude Code:** be Claude kjøre `node tilbakemeldinger-cli.js` for
å hente inn nye tilbakemeldinger rett i samtalen — Claude leser teksten (og evt. vedlagte
skjermbilder) og kan foreslå/gjøre kodeendringer direkte derfra, uten at du må gå via
appens `#/tilbakemeldinger`-side eller Firebase Console.
