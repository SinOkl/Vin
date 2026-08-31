# Spec: Tre kalkulatorer for vinappen
Status: alle tre er prototypet og testet som interaktive widgets, verifisert med bruker. Ingen er implementert i faktisk appkode ennå. Denne filen erstatter tidligere `kjolekalkulator-spec.md`, som var utdatert (reflekterte ikke plastflaske-tillegget eller at flaskevalg ligger synlig i UI).
---
## 1. Kjøletid-kalkulator
**Formål:** Anslå hvor lang tid en flaske trenger i et gitt miljø for å nå ønsket temperatur. Fungerer begge veier (kjøling og oppvarming) — samme formel, avhenger av om miljøtemperaturen er over eller under starttemperaturen.
**Fysisk modell:** Newtons avkjølingslov, med k beregnet fra en to-motstands-modell (varmeovergang miljø→flaske + varmeledning gjennom vegg, i serie):
```
t = ln((T_start − T_omgivelse) / (T_mål − T_omgivelse)) / k
h_eff = 1 / (1/h_miljø + t_vegg / k_materiale)
k = (h_eff × 2/r) / (ρc)     [ρc ≈ 4,18×10⁶ J/(m³K) for vann/vin/brus]
```
**Inputs (alle synlige):**
1. Starttemperatur (glidebryter, -5 til 30 °C)
2. Ønsket temperatur (glidebryter, -5 til 30 °C)
3. Miljø (nedtrekksmeny)
4. Flaske/beholder (nedtrekksmeny, default: standard bordeauxflaske)
**Miljø-presets:**
| Miljø | Temp | h (W/m²K) |
|---|---|---|
| Kjøleskap | 4°C | 15 |
| Isvann, uten salt | 0°C | 100 |
| Isvann + salt | -2°C | 250 |
| Fryser | -18°C | 18 |
| Romtemperatur | 21°C | 10 |
**Flaske/beholder-presets:**
| Type | Radius | Veggtykkelse | Materiale k (W/m·K) |
|---|---|---|---|
| Standard bordeauxflaske | 38 mm | 3 mm | 1,0 (glass) |
| Slank flaske (Riesling/Alsace) | 35 mm | 3 mm | 1,0 (glass) |
| Champagne/musserende | 44 mm | 5 mm | 1,0 (glass) |
| Halvflaske 375ml | 32,5 mm | 3 mm | 1,0 (glass) |
| Magnum 1,5l | 47,5 mm | 4 mm | 1,0 (glass) |
| 1,5L brusflaske | 45 mm | 0,3 mm | 0,2 (plast/PET) |
| 0,5L brusflaske | 32,5 mm | 0,25 mm | 0,2 (plast/PET) |
**Resultatvisning:**
- Vis som intervall, ikke eksakt tall: base-estimat ±20% (`low = t × 0.8`, `high = t × 1.2`)
- Under resultatet: fast tekst om at estimatet er mer usikkert tidlig i forløpet enn mot slutten (lumped-capacitance-modellen antar uniform temperatur i væsken, stemmer dårligst tidlig)
- Når "Fryser" er valgt: vis advarselboks (varning-farge) — "Sett en alarm. Glemmer du flasken i fryseren kan den fryse og sprekke."
- Feilhåndtering: vis feilmelding (ikke tall) hvis måltemperatur er utenfor det som er fysisk mulig i valgt miljø (feil retning, eller lik omgivelsestemperatur)
**Kalibrering (skjult bak knapp/toggle, ikke default synlig):**
- Glidebryter 0,6–1,6, default 1,0, som multipliseres inn i sluttresultatet
- Label: "Vinen min kjøler..." med tekst som viser prosent raskere/tregere enn estimert
- Lar bruker justere basert på egne målinger uten å eksponere rå k-verdi
**Kjente/aksepterte svakheter (ikke løst, bevisst valg):**
- h-verdiene per miljø er erfaringsbaserte anslag, ikke målt i lab — derfor intervall + kalibrering i stedet for eksakt tall
- Modellen antar uniform temperatur i hele væsken, ikke faktisk gradient/konveksjon — nevnt i UI-tekst
- Ingen automatisk kalibrering fra faktiske brukermålinger over tid — kun manuell justering per økt
---
## 2. Dekanteringstid-kalkulator
**Formål:** Foreslå dekanteringstid basert på vintype. Lookup-basert (ikke formeldrevet) — dekantering handler mer om stil/erfaring enn presis fysikk.
**Input:** Vintype (nedtrekksmeny, eneste input — ingen aldersfelt)
**Output:** Anbefalt tid + kort forklaring, hentet direkte fra tabellen basert på valgt type
| Vintype | Anbefalt tid | Notat |
|---|---|---|
| Ung, fyldig rødvin (Cabernet, Syrah, Bordeaux-blend) | 1–2 timer | Grov tanning trenger tid/luft |
| Middels rødvin (Merlot, Chianti, Rioja) | 30–60 min | Åpner aromaer uten å flate ut |
| Lett rødvin (Pinot Noir, Gamay) | 15–30 min, evt. rett i glass | For mye luft kan svekke frukten |
| Moden rødvin (10+ år) | 15–30 min, forsiktig | Primært for sediment, ikke over-lufting |
| Vintage Port | 2–3 timer | Tungt sediment, hell forsiktig |
| Fyldig hvitvin (moden Chardonnay) | 10–15 min | Kan myke opp oksidativ stil |
| Lett hvitvin/rosé | Vanligvis ikke nødvendig | Server rett fra flaske |
| Musserende | Aldri | Fjerner boblene |
**Fast forklaringstekst under resultatet (vises alltid, uavhengig av valg):**
"Dette er et utgangspunkt, ikke en fasit — smak deg gjerne frem. Faktisk tid påvirkes av årgang og lagringsforhold, hvor mye tanniner og syre vinen har, og hvor bred åpningen på karaffelen er."
**Eksplisitt ikke inkludert (bevisst valgt bort):**
- Aldersfelt / årgang som input — vurdert og forkastet, føltes som å be brukeren fylle ut noe uten reell effekt på flertallet av valgene
- Eget valg for karaffelform (bred/lav vs. smal/høy) — dekket i forklaringsteksten i stedet for som eget UI-element. Vurdert som unødvendig kompleksitet: krever at brukeren vet egen karaffelform og hvorfor det betyr noe
---
## 3. Flasker-til-fest-kalkulator
**Formål:** Anslå hvor mange flasker som trengs til et arrangement.
**Inputs:**
1. Antall gjester som drikker vin (glidebryter, 2–25)
2. Glass per person (glidebryter, 1–8, default 3)
**Beregning:**
```
totalt volum (ml) = gjester × glass per person × 150 ml
antall flasker = opprundet(totalt volum / 750 ml)
```
**Output:**
- Antall flasker (stort tall)
- Forklaringstekst: "X glass per person à 150 ml — Y liter totalt"
- Fast infolinje nederst (alltid synlig, mindre/dempet stil): "Antar 150 ml per glass, ca. 5 glass per 750 ml-flaske."
**Eksplisitt ikke inkludert (bevisst valgt bort):**
- Ingen egen sikkerhetsmargin-avhukning (+1 flaske) — vurdert og fjernet. Brukeren kan selv legge til én flaske i hodet; unødvendig UI-element
- Ingen note/tips om å kjøre kalkulatoren samlet ved flere vintyper per kveld — vurdert og fjernet, ansett som å undervurdere brukeren
- Ingen egen modus for ulik vin per rett i UI — hvis ønskelig, kjør kalkulatoren på nytt per vin med samme gjestetall
---
## Generelt for alle tre
- Ingen av kalkulatorene er implementert i faktisk appkode — kun prototypet/verifisert som interaktive widgets
- Design-prinsipp brukt gjennomgående: vis usikkerhet der modellen faktisk er usikker (kjøletid: intervall), men ikke lag ekstra UI-elementer eller inputs som ikke endrer utfallet for de fleste brukere (dekantering: droppet alder-felt; fest: droppet margin-avhukning)
