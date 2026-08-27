import { VinDB, KjellerDB, ProduktDB, BrukerDB, ADMIN_UID } from './db.js';
import { loggInnMedGoogle, loggUt, paInnloggingsendring } from './auth.js';

// ---------- Konstanter ----------

const KATEGORIER = ['Vin', 'Brennevin'];

const TYPER = {
  'Vin': ['Rødvin', 'Sider', 'Hvitvin', 'Rosévin', 'Musserende', 'Dessertvin/Portvin', 'Annet'],
  'Brennevin': ['Whisky', 'Vodka', 'Gin', 'Rom', 'Cognac/Brandy', 'Akevitt', 'Tequila', 'Likør', 'Annet'],
};

const MATPAR_KATEGORIER = [
  'Rødt kjøtt', 'Lyst kjøtt/fjørfe', 'Vilt', 'Fisk', 'Skalldyr',
  'Hvit ost', 'Blåmuggost/Brunost', 'Pasta/tomatbasert', 'Asiatisk/krydret',
  'Vegetar', 'Dessert/søtt', 'Aperitif/forrett',
];

const LAGRINGSFORSLAG = {
  'Vin': {
    'Rødvin': { temp: '12–16 °C', servering: '16–18 °C', fuktighet: '60–70 %', notat: 'Liggende, mørkt og vibrasjonsfritt. Jevn temperatur er viktigere enn eksakt tall.' },
    'Sider': { temp: '8–12 °C', servering: '6–8 °C', fuktighet: '60–70 %', notat: 'Drikkes normalt ung og fersk, som rosévin — ikke beregnet for lang lagring. Server godt avkjølt, gjerne stående i kjøleskap rett før servering.' },
    'Hvitvin': { temp: '8–12 °C', servering: '8–10 °C', fuktighet: '60–70 %', notat: 'Liggende, mørkt. Kjøligere enn rødvin — bruk kjøleskap rett før servering.' },
    'Rosévin': { temp: '8–10 °C', servering: '8–10 °C', fuktighet: '60–70 %', notat: 'Drikkes normalt ung og fersk — ikke beregnet for lang lagring.' },
    'Musserende': { temp: '6–8 °C', servering: '6–8 °C', fuktighet: '60–70 %', notat: 'Stående eller liggende er begge greit. De fleste bør drikkes innen 1–3 år, årgangschampagne tåler mer.' },
    'Dessertvin/Portvin': { temp: '12–16 °C', servering: '10–14 °C', fuktighet: '60–70 %', notat: 'Tåler ofte lang lagring ubrutt. Når flasken er åpnet: drikk portvin i løpet av uker, søt dessertvin i løpet av dager-uker (kjølig og korket).' },
    'Annet': { temp: '10–14 °C', servering: '12–16 °C', fuktighet: '60–70 %', notat: 'Generelt egnet lagringsklima for de fleste viner.' },
  },
  'Brennevin': {
    'Whisky': { temp: '15–20 °C', servering: '18–20 °C (evt. med en isbit)', fuktighet: '', notat: 'Oppbevares stående, i motsetning til vin — liggende kan skade korken. Romtemperatur og unna sollys holder svært lenge, også etter åpning.' },
    'Vodka': { temp: '15–20 °C', servering: '−18–0 °C (gjerne fryser)', fuktighet: '', notat: 'Stående, tåler romtemperatur uten problem. Kald servering demper alkoholbrennet.' },
    'Gin': { temp: '15–20 °C', servering: '4–10 °C', fuktighet: '', notat: 'Stående, romtemperatur. Serveres gjerne godt avkjølt eller i en cocktail.' },
    'Rom': { temp: '15–20 °C', servering: '18–20 °C', fuktighet: '', notat: 'Stående, romtemperatur og unna sollys. Lysere rom-typer kan gjerne kjøles noe før servering.' },
    'Cognac/Brandy': { temp: '15–20 °C', servering: '18–22 °C', fuktighet: '', notat: 'Stående, romtemperatur. Server gjerne i et konjakkglass slik at aromaene får utfolde seg.' },
    'Akevitt': { temp: '12–18 °C', servering: '4–8 °C', fuktighet: '', notat: 'Stående, kjølig og mørkt. Tradisjonelt servert godt avkjølt.' },
    'Tequila': { temp: '15–20 °C', servering: '8–16 °C (avhenger av type)', fuktighet: '', notat: 'Stående, romtemperatur. Blanco/sølv serveres kjøligere enn eldre reposado/añejo.' },
    'Likør': { temp: '12–18 °C', servering: '6–10 °C', fuktighet: '', notat: 'Stående. Kremlikører bør gjerne kjøles i kjøleskap etter åpning og drikkes opp i løpet av noen måneder.' },
    'Annet': { temp: '15–20 °C', servering: '10–18 °C', fuktighet: '', notat: 'Generelt: stående, romtemperatur og unna sollys holder de fleste typer brennevin svært lenge.' },
  },
};

function hentForslag(kategori, type) {
  const gruppe = LAGRINGSFORSLAG[kategori] || LAGRINGSFORSLAG['Vin'];
  return gruppe[type] || gruppe['Annet'];
}

// Farge per type, brukt av plassholderSvg under — gir hver type sin egen fargede
// flaske-/glass-silhuett i stedet for at alt uten eget bilde ser ut som rødvin.
const TYPE_FARGE = {
  'Rødvin': '#6b1030',
  'Sider': '#9caa3c',
  'Hvitvin': '#e3d48a',
  'Rosévin': '#e2a1a6',
  'Musserende': '#d9c46a',
  'Dessertvin/Portvin': '#5a1f22',
  'Whisky': '#b5762a',
  'Vodka': '#c7d3d6',
  'Gin': '#8fae8f',
  'Rom': '#7a4a1f',
  'Cognac/Brandy': '#8a4a1f',
  'Akevitt': '#d9c98a',
  'Tequila': '#d3b768',
  'Likør': '#a13d63',
};

// Kategori-ikoner (inline SVG, omriss + farget innhold — stil etter referansebilde fra
// brukeren) for typene som har et eget, gjenkjennelig glassmotiv i redesignet. «Annet» og andre
// umappede typer faller tilbake på plassholderSvg() sin generiske fargede silhuett.
const GLASS_INK = '#2a1a20';

function glassSvgWrap(indre, merkelapp) {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${merkelapp}">${indre}</svg>`;
}

// Vinglass: bolle + stett + fot. fyllTopp styrer hvor høyt væsken står (lavere tall = fullere).
function vinglassSvg(farge, fyllTopp) {
  return `
    <path d="M34,${fyllTopp} C34,44 36,52 50,52 C64,52 66,44 66,${fyllTopp} Z" fill="${farge}"/>
    <path d="M32,16 C32,40 34,54 50,54 C66,54 68,40 68,16" fill="none" stroke="${GLASS_INK}" stroke-width="4" stroke-linecap="round"/>
    <line x1="50" y1="54" x2="50" y2="83" stroke="${GLASS_INK}" stroke-width="4"/>
    <line x1="36" y1="88" x2="64" y2="88" stroke="${GLASS_INK}" stroke-width="4" stroke-linecap="round"/>
  `;
}

// Musserende-flaske/glass (flute) med bobler.
function fluteSvg(farge) {
  return `
    <path d="M44,22 L56,22 L54,58 C54,61 46,61 46,58 Z" fill="${farge}"/>
    <path d="M42,10 L58,10 L55,58 C55,64 45,64 45,58 Z" fill="none" stroke="${GLASS_INK}" stroke-width="4" stroke-linejoin="round"/>
    <line x1="50" y1="64" x2="50" y2="83" stroke="${GLASS_INK}" stroke-width="4"/>
    <line x1="40" y1="88" x2="60" y2="88" stroke="${GLASS_INK}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="48" cy="35" r="1.6" fill="none" stroke="${GLASS_INK}" stroke-width="1.4"/>
    <circle cx="52" cy="27" r="1.3" fill="none" stroke="${GLASS_INK}" stroke-width="1.4"/>
    <circle cx="50" cy="46" r="1.3" fill="none" stroke="${GLASS_INK}" stroke-width="1.4"/>
  `;
}

// Tumbler/rocks-glass — evt. med isbiter (whisky).
function tumblerSvg(farge, isbiter) {
  return `
    <path d="M34,55 L66,55 L64,82 C64,85 36,85 36,82 Z" fill="${farge}"/>
    <path d="M30,28 L70,28 L65,82 C65,87 35,87 35,82 Z" fill="none" stroke="${GLASS_INK}" stroke-width="4" stroke-linejoin="round"/>
    ${isbiter ? `
      <rect x="39" y="44" width="11" height="11" rx="1.5" fill="#eef1ee" stroke="${GLASS_INK}" stroke-width="2.5" transform="rotate(-8 44 49)"/>
      <rect x="51" y="49" width="10" height="10" rx="1.5" fill="#eef1ee" stroke="${GLASS_INK}" stroke-width="2.5" transform="rotate(10 56 54)"/>
    ` : ''}
  `;
}

// Shots/lite glass — klart (vodka, uten fyll) eller farget, evt. med limebåt (tequila).
function shotglassSvg(farge, limebat) {
  return `
    ${farge ? `<path d="M43,45 L57,45 L54,80 C54,84 46,84 46,80 Z" fill="${farge}"/>` : ''}
    <path d="M40,22 L60,22 L57,80 C57,84 43,84 43,80 Z" fill="none" stroke="${GLASS_INK}" stroke-width="4" stroke-linejoin="round"/>
    ${limebat ? `
      <path d="M68,30 A10,10 0 0 1 78,40 L68,40 Z" fill="#c9d97a" stroke="${GLASS_INK}" stroke-width="2"/>
      <path d="M68,30 L68,40" stroke="${GLASS_INK}" stroke-width="1.2"/>
    ` : ''}
  `;
}

// Cordial-/akevittglass — lite og smalt.
function cordialSvg(farge) {
  return `
    <path d="M42,26 L58,26 L55,60 C55,63 45,63 45,60 Z" fill="${farge}"/>
    <path d="M40,18 L60,18 L56,60 C56,66 44,66 44,60 Z" fill="none" stroke="${GLASS_INK}" stroke-width="4" stroke-linejoin="round"/>
    <line x1="50" y1="66" x2="50" y2="83" stroke="${GLASS_INK}" stroke-width="4"/>
    <line x1="38" y1="88" x2="62" y2="88" stroke="${GLASS_INK}" stroke-width="4" stroke-linecap="round"/>
  `;
}

// Cocktailskål (gin) — bred, grunn bolle + sitrusskive.
function coupeSvg(farge) {
  return `
    <path d="M30,20 C30,34 38,42 50,42 C62,42 70,34 70,20 Z" fill="${farge}"/>
    <path d="M25,15 C25,35 35,45 50,45 C65,45 75,35 75,15" fill="none" stroke="${GLASS_INK}" stroke-width="4" stroke-linecap="round"/>
    <line x1="50" y1="45" x2="50" y2="80" stroke="${GLASS_INK}" stroke-width="4"/>
    <line x1="36" y1="88" x2="64" y2="88" stroke="${GLASS_INK}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="68" cy="17" r="6" fill="#c9d97a" stroke="${GLASS_INK}" stroke-width="1.6"/>
    <line x1="68" y1="12" x2="68" y2="22" stroke="${GLASS_INK}" stroke-width="1"/>
    <line x1="63" y1="17" x2="73" y2="17" stroke="${GLASS_INK}" stroke-width="1"/>
  `;
}

// Kobler type til riktig glassform. Kategorien avgjør kun fargen (TYPE_FARGE), ikke selve
// formen — de fleste kombinasjonene her er entydige typenavn uansett kategori.
const KATEGORI_IKON_BYGGER = {
  'Rødvin': (f) => vinglassSvg(f, 30),
  'Hvitvin': (f) => vinglassSvg(f, 30),
  'Rosévin': (f) => vinglassSvg(f, 30),
  'Dessertvin/Portvin': (f) => vinglassSvg(f, 38),
  'Musserende': (f) => fluteSvg(f),
  'Whisky': (f) => tumblerSvg(f, true),
  'Rom': (f) => tumblerSvg(f, false),
  'Cognac/Brandy': (f) => tumblerSvg(f, false),
  'Vodka': () => shotglassSvg(null, false),
  'Tequila': (f) => shotglassSvg(f, true),
  'Akevitt': (f) => cordialSvg(f),
  'Likør': (f) => cordialSvg(f),
  'Gin': (f) => coupeSvg(f),
};

// Flaske-/glass-ikon for en gitt kategori+type: bruker et gjenkjennelig glassmotiv for de
// typene redesignet definerer et eget ikon for (se KATEGORI_IKON_BYGGER — «Sider» beholder sitt
// egne eple-ikon under, «Annet» og resten faller tilbake på plassholderSvg()).
function flaskeIkonSvg(kategori, type) {
  if (type === 'Sider') {
    return glassSvgWrap(`
      <circle cx="38" cy="55" r="26" fill="${TYPE_FARGE.Sider}"/>
      <circle cx="62" cy="55" r="26" fill="${TYPE_FARGE.Sider}"/>
      <rect x="47" y="18" width="6" height="16" rx="2" fill="${TYPE_FARGE.Sider}"/>
    `, escapeHtml(type));
  }
  const bygger = KATEGORI_IKON_BYGGER[type];
  if (!bygger) return plassholderSvg(kategori, type);
  const farge = TYPE_FARGE[type] || (kategori === 'Brennevin' ? '#8a8a8a' : '#7a4a6b');
  return glassSvgWrap(bygger(farge), escapeHtml(type || kategori || ''));
}

// Plassholder-bilde (inline SVG) for flasker uten eget bilde — flaskesilhuett for vin,
// glass-silhuett for brennevin, farget etter type slik at ulike typer skiller seg visuelt.
function plassholderSvg(kategori, type) {
  const farge = TYPE_FARGE[type] || (kategori === 'Brennevin' ? '#8a8a8a' : '#7a4a6b');
  const merkelapp = escapeHtml(type || kategori || '');
  return kategori === 'Brennevin'
    ? `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${merkelapp}">
        <rect x="32" y="36" width="36" height="48" rx="4" fill="${farge}"/>
        <rect x="32" y="36" width="36" height="9" fill="${farge}" opacity="0.55"/>
      </svg>`
    : `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${merkelapp}">
        <rect x="44" y="6" width="12" height="22" rx="2" fill="${farge}"/>
        <path d="M40 28 C40 28 36 39 36 49 L36 89 C36 93 39 96 43 96 L57 96 C61 96 64 93 64 89 L64 49 C64 39 60 28 60 28 Z" fill="${farge}"/>
        <rect x="34" y="54" width="32" height="17" fill="#ffffff" opacity="0.18"/>
      </svg>`;
}

const dataArsnr = () => new Date().getFullYear();

// Delt av begge AI-malene under, slik at de alltid ber om nøyaktig samme JSON-form —
// det er det som gjør at samme lim-inn-flyt (og normaliserImportertVin) fungerer for begge.
const AI_JSON_SKJEMA_OG_REGLER = `{
  "kategori": "Vin | Brennevin",
  "navn": "",
  "produsent": "",
  "argang": "",
  "type": "avhenger av kategori, se regler under",
  "land": "",
  "region": "",
  "druer": "",
  "drikkeklarFra": "",
  "drikkeklarTil": "",
  "matparKategorier": ["velg fritt blant: Rødt kjøtt, Lyst kjøtt/fjørfe, Vilt, Fisk, Skalldyr, Hvit ost, Blåmuggost/Brunost, Pasta/tomatbasert, Asiatisk/krydret, Vegetar, Dessert/søtt, Aperitif/forrett"],
  "matparNotater": "",
  "smaksnotater": "",
  "lagringstemperatur": "",
  "lagringsfuktighet": "",
  "serveringstemperatur": "",
  "innkjopspris": ""
}

Regler:
- Bruk kun feltnavnene over, ikke legg til andre.
- "kategori" må være "Vin" eller "Brennevin".
- Hvis kategori er "Vin": "type" må være én av: Rødvin, Sider, Hvitvin, Rosévin, Musserende, Dessertvin/Portvin, Annet.
- Hvis kategori er "Brennevin": "type" må være én av: Whisky, Vodka, Gin, Rom, Cognac/Brandy, Akevitt, Tequila, Likør, Annet.
- "matparKategorier" må kun inneholde verdier fra listen over, som en JSON-liste.
- "lagringstemperatur" er hvor kaldt flasken bør oppbevares over tid, "serveringstemperatur" er hvor kald den bør være når den drikkes — disse er ofte ulike, ikke forveksle dem.
- "innkjopspris" er prisen PER FLASKE i kroner. Søk ALLTID opp produktet på vinmonopolet.no og bruk utsalgsprisen derfra — ikke la dette feltet stå tomt bare fordi prisen ikke står på etiketten. Oppgir jeg selv en annen pris i meldingen (f.eks. faktisk betalt pris, tilbud, eller kjøpt i utlandet), bruk min pris i stedet for Vinmonopolet sin. Finner du ikke produktet på Vinmonopolet i det hele tatt, skriv "" — ikke gjett et tall.
- Bruk nettsøk til å dobbeltsjekke fakta om produktet (druer, region, drikkevindu, smaksprofil, pris) fremfor å basere deg kun på synlig tekst på etiketten — det gir mer presise svar.`;

function naturligListe(deler) {
  const gyldige = deler.filter(Boolean);
  if (gyldige.length <= 1) return gyldige.join('');
  return gyldige.slice(0, -1).join(', ') + ' og ' + gyldige[gyldige.length - 1];
}

// Brukt av «Kopier kode og åpne Claude»-knappen i legg-til-flyten (bilde + evt. strekkode).
// Både ean og bilde er valgfrie — flyten fortsetter selv om kamera/skanning feiler eller blir
// hoppet over, så prompten tilpasser teksten etter hva vi faktisk har med oss inn hit.
function byggRegistrerPrompt(ean, brukerNotater, harBilde) {
  const grunnlag = harBilde
    ? 'Jeg limer inn et bilde av etiketten i denne meldingen.'
    : 'Jeg har ikke noe bilde av etiketten denne gangen, kun det jeg skriver under.';
  const identGrunnlag = naturligListe([harBilde && 'bildet', ean && 'strekkoden', 'det jeg skriver under']);
  return `Du er ekspert på vin og brennevin. Jeg skal registrere en flaske i katalogen min. ${grunnlag}${ean ? ` Jeg har også skannet strekkoden (EAN): ${ean}.` : ''} Bruk ${identGrunnlag} til å identifisere flasken, og bruk nettsøk til å bekrefte fakta som druesammensetning, region, typisk drikkevindu og smaksprofil — ikke bare gjett — og søk alltid opp utsalgsprisen på vinmonopolet.no. Svar deretter KUN med gyldig JSON (ingen forklaringstekst, ingen kodeblokk-merking rundt) i nøyaktig dette formatet:

${AI_JSON_SKJEMA_OG_REGLER}
- Har du ikke tilgang til nettsøk i det hele tatt, eller finner ikke produktet: gjør så godt du kan ut fra det jeg skriver under, og skriv "" på felt (inkludert innkjopspris) du er usikker på — ikke gjett blindt.

Det jeg selv vet om flasken: ${brukerNotater || '(ingenting mer)'}`;
}

// ---------- Hjelpefunksjoner ----------

function formatKr(n) {
  if (n === undefined || n === null || n === '') return '';
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(n);
}

// Prosentandel igjen i flasken som er i bruk (brennevin drikkes gjerne over uker/måneder,
// i motsetning til vin — derfor et eget fyllnivå fremfor bare antall hele flasker).
// Eldre poster mangler feltet — de regnes som fulle (100 %) helt til noen justerer glidebryteren.
function hentFyllniva(v) {
  const n = Number(v.fyllniva);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 100;
}

// Estimert verdi for én post. For brennevin telles kun én av flaskene som «i bruk» —
// den følger fyllnivået — resten regnes som fulle/uåpnede. Uten dette ville en flaske med
// f.eks. 20 % igjen fortsatt telle som en hel, ubrukt flaske i den estimerte verdien.
function vinVerdi(v) {
  const antall = Number(v.antallFlasker) || 0;
  const pris = Number(v.innkjopspris) || 0;
  if (antall <= 0) return 0;
  if (v.kategori === 'Brennevin') {
    return (antall - 1) * pris + pris * (hentFyllniva(v) / 100);
  }
  return antall * pris;
}

function beregnStats(liste) {
  const totalFlasker = liste.reduce((s, v) => s + (Number(v.antallFlasker) || 0), 0);
  const totalVerdi = liste.reduce((s, v) => s + vinVerdi(v), 0);
  return { unikeProdukter: liste.length, totalFlasker, totalVerdi };
}

function drikkestatus(vin) {
  const ar = dataArsnr();
  const fra = vin.drikkeklarFra ? Number(vin.drikkeklarFra) : null;
  const til = vin.drikkeklarTil ? Number(vin.drikkeklarTil) : null;
  if (!fra && !til) return { label: 'Ukjent vindu', klasse: 'status-ukjent' };
  if (fra && ar < fra) return { label: `Ikke klar før ${fra}`, klasse: 'status-venter' };
  if (til && ar > til) return { label: 'På hell — bør drikkes', klasse: 'status-hastesak' };
  if (til && til - ar <= 1) return { label: `Drikk snart (siste år ${til})`, klasse: 'status-snart' };
  return { label: 'Klar til drikking', klasse: 'status-klar' };
}

// Skalerer ned og komprimerer et bilde som allerede er en data-URL (brukt både for opplastede
// filer og for bilder tatt direkte med kamera-canvasen i legg-til-flyten).
function skalerOgKomprimerDataUrl(dataUrl, maxDim = 900, kvalitet = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', kvalitet));
    };
    img.src = dataUrl;
  });
}

function komprimerBilde(file, maxDim = 900, kvalitet = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(skalerOgKomprimerDataUrl(reader.result, maxDim, kvalitet));
    reader.readAsDataURL(file);
  });
}

// navigator.clipboard.write() støtter i praksis kun image/png på tvers av nettlesere
// (bl.a. Safari avviser image/jpeg) — komprimerBilde lagrer som JPEG for å holde
// Firestore-dokumentet lite, så konverter om til PNG kun for selve utklippet.
function jpegDataUrlTilPngBlob(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob ga ingen blob'))), 'image/png');
    };
    img.src = dataUrl;
  });
}

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function escapeHtml(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function tallEllerTom(v) {
  if (v === undefined || v === null || v === '') return '';
  const n = Number(v);
  return Number.isNaN(n) ? '' : n;
}

function tekstEllerTom(v) {
  return v === undefined || v === null ? '' : String(v).trim();
}

// Tar imot tekst som (forhåpentligvis) er JSON fra en AI, og tåler at den er pakket inn i
// ```json ... ```-kodeblokk-markører selv om vi ber AI-en la være.
function parseAiJson(tekst) {
  const renset = tekst.trim().replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(renset);
}

// Gjør om et løst/upresist objekt (typisk fra en AI) til en gyldig vin/brennevin. Returnerer null hvis navn mangler.
function normaliserImportertVin(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const navn = tekstEllerTom(raw.navn || raw.name);
  if (!navn) return null;

  let kategori = raw.kategori;
  if (!KATEGORIER.includes(kategori)) kategori = 'Vin';

  let matpar = raw.matparKategorier;
  if (typeof matpar === 'string') matpar = matpar.split(',').map((s) => s.trim());
  if (!Array.isArray(matpar)) matpar = [];
  matpar = matpar.filter((m) => MATPAR_KATEGORIER.includes(m));

  let type = raw.type;
  if (!TYPER[kategori].includes(type)) type = 'Annet';

  let vurdering = tallEllerTom(raw.vurdering);
  if (vurdering) vurdering = Math.min(5, Math.max(1, Math.round(vurdering)));

  // Mal B (ukjend-vin-identifikasjon etter strekkodeskanning) svarer på engelsk med
  // drinkFrom/drinkUntil/peakYear/reasoning/confidence i stedet for de norske feltnavnene.
  const erAiEstimat = raw.peakYear !== undefined || raw.reasoning !== undefined || raw.confidence !== undefined;

  return {
    kategori,
    navn,
    produsent: tekstEllerTom(raw.produsent),
    argang: tekstEllerTom(raw.argang),
    type,
    land: tekstEllerTom(raw.land),
    region: tekstEllerTom(raw.region),
    druer: tekstEllerTom(raw.druer),
    antallFlasker: tallEllerTom(raw.antallFlasker) || 1,
    volumCl: tallEllerTom(raw.volumCl) || 75,
    innkjopspris: tallEllerTom(raw.innkjopspris),
    innkjopsdato: tekstEllerTom(raw.innkjopsdato),
    kjoptHos: tekstEllerTom(raw.kjoptHos),
    ean: tekstEllerTom(raw.ean),
    lagringssted: tekstEllerTom(raw.lagringssted),
    lagringstemperatur: tekstEllerTom(raw.lagringstemperatur),
    lagringsfuktighet: tekstEllerTom(raw.lagringsfuktighet),
    serveringstemperatur: tekstEllerTom(raw.serveringstemperatur),
    drikkeklarFra: tallEllerTom(raw.drikkeklarFra ?? raw.drinkFrom),
    drikkeklarTil: tallEllerTom(raw.drikkeklarTil ?? raw.drinkUntil),
    matparKategorier: matpar,
    matparNotater: tekstEllerTom(raw.matparNotater),
    smaksnotater: tekstEllerTom(raw.smaksnotater),
    vurdering,
    bilde: '',
    drukketDato: '',
    aiToppAr: tallEllerTom(raw.peakYear),
    aiBegrunnelse: tekstEllerTom(raw.reasoning),
    aiKonfidens: tekstEllerTom(raw.confidence),
    drikkeklarKilde: erAiEstimat ? 'ai' : '',
  };
}

// Tar imot rå JSON-tekst (ett objekt eller en liste), validerer og lagrer gyldige poster i aktiv kjeller.
async function importerFraJsonTekst(tekst) {
  let data;
  try {
    data = parseAiJson(tekst);
  } catch {
    throw new Error('Dette er ikke gyldig JSON. Sjekk at du limte inn hele svaret fra AI-en, uten ekstra tekst rundt.');
  }
  if (!Array.isArray(data)) data = [data];

  const gyldige = [];
  let hoppetOver = 0;
  for (const raw of data) {
    const v = normaliserImportertVin(raw);
    if (v) gyldige.push(v);
    else hoppetOver++;
  }
  if (!gyldige.length) {
    throw new Error('Fant ingen gyldige poster i JSON-en (mangler "navn"-felt?).');
  }
  const antall = await VinDB.importer(aktivKjeller.id, gyldige);
  return { antall, hoppetOver };
}

// ---------- App-state ----------

let bruker = null;
let mineKjellere = [];
let aktivKjeller = null;
let alleViner = [];
let vinerAvslutt = null; // avslutter aktivt Firestore-abonnement ved kjellerbytte
let stoppSkann = null; // stopper aktiv kameraskanning ved rutebytte
let ventendeSkannData = null; // { ean, bilde, viaRegistrerFlyt, harCacheTreff, ...kjenteFakta? } — bæres over fra #/registrer til skjemaet (#/ny)
let brukerAvslutt = null; // avslutter abonnement på eget brukere/{uid}-dokument ved ut-/innlogging
let sisteBrukerStatus = null; // forrige kjente status, for å unngå å restarte lastKjellereOgStart() på hver snapshot
let ventendeAvslutt = null; // avslutter admins abonnement på ventende brukere ved utlogging
let ventendeBrukere = []; // ventende brukere, kun populert/relevant for ADMIN_UID
const app = document.getElementById('app');
const bunnav = document.querySelector('.bunnav');

function visBunnav(vis) {
  bunnav.style.display = vis ? '' : 'none';
  const cta = document.getElementById('cta-legg-til');
  if (cta) cta.style.display = vis ? '' : 'none';
}

// Styrer den faste «Legg til flaske»-knappen over bunnmenyen: skjules helt inni selve
// legg-til/rediger-flyten (der den ville vært forstyrrende/overflødig), ellers pekes den mot
// riktig kategori (Vin/Brennevin) ut fra hvilken side vi står på.
function oppdaterLeggTilCta(path, param) {
  const cta = document.getElementById('cta-legg-til');
  if (!cta || bunnav.style.display === 'none') return; // pre-innlogging: visBunnav() styrer synligheten
  if (path === 'ny' || path === 'rediger' || path === 'registrer') {
    cta.style.display = 'none';
    return;
  }
  cta.style.display = '';
  let kategori = filterState.kategori || 'Vin';
  if (path === 'brennevin') kategori = 'Brennevin';
  else if (path === 'viner') kategori = 'Vin';
  else if (path === 'vin' && param) {
    const post = alleViner.find((x) => x.id === param);
    kategori = post && post.kategori === 'Brennevin' ? 'Brennevin' : 'Vin';
  }
  document.getElementById('cta-legg-til-lenke').href = kategori === 'Brennevin' ? '#/registrer/brennevin' : '#/registrer';
}

// ---------- Routing ----------

function rute() {
  try {
    ruteIndre();
  } catch (err) {
    console.error('[vinkjeller] Feil under visning:', err);
    app.innerHTML = '';
    app.appendChild(el(`
      <div class="side">
        <h1>Noe gikk galt</h1>
        <p class="tom">${escapeHtml(err.message || String(err))}</p>
        <div class="knapperad"><button class="knapp knapp-primaer" id="prov-igjen-knapp-rute">Prøv igjen</button></div>
      </div>
    `));
    document.getElementById('prov-igjen-knapp-rute').addEventListener('click', () => location.reload());
  }
}

function ruteIndre() {
  if (stoppSkann) { stoppSkann(); stoppSkann = null; }

  // Sperre mot manuell hash-navigasjon (adresselinje/tilbake-knapp) forbi venteskjermen
  // — bruker/aktivKjeller/alleViner er ikke satt opp før status er 'godkjent'.
  if (bruker && sisteBrukerStatus !== 'godkjent') {
    visVenteskjerm(sisteBrukerStatus || 'ventende');
    return;
  }

  const hash = location.hash || '#/';
  const [, path, param] = hash.match(/^#\/?([^/]*)\/?([^/]*)$/) || [];

  document.querySelectorAll('.navlink').forEach((a) => a.classList.remove('aktiv'));
  oppdaterLeggTilCta(path, param);

  if (!path || path === '') {
    settAktivNav('#/');
    visOversikt();
  } else if (path === 'viner') {
    settAktivNav('#/viner');
    visVinliste('Vin');
  } else if (path === 'brennevin') {
    settAktivNav('#/brennevin');
    visVinliste('Brennevin');
  } else if (path === 'ny') {
    settAktivNav(param === 'brennevin' ? '#/brennevin' : '#/viner');
    visSkjema(null, param === 'brennevin' ? 'Brennevin' : 'Vin');
  } else if (path === 'rediger' && param) {
    const post = alleViner.find((x) => x.id === param);
    settAktivNav(post && post.kategori === 'Brennevin' ? '#/brennevin' : '#/viner');
    visSkjema(param);
  } else if (path === 'vin' && param) {
    const post = alleViner.find((x) => x.id === param);
    settAktivNav(post && post.kategori === 'Brennevin' ? '#/brennevin' : '#/viner');
    visDetalj(param);
  } else if (path === 'innstillinger') {
    settAktivNav('#/innstillinger');
    visInnstillinger();
  } else if (path === 'godkjenninger') {
    settAktivNav('#/innstillinger');
    visGodkjenninger();
  } else if (path === 'registrer') {
    settAktivNav(param === 'brennevin' ? '#/brennevin' : '#/viner');
    visRegistrer(param === 'brennevin' ? 'Brennevin' : 'Vin');
  } else {
    visOversikt();
  }
}

function settAktivNav(href) {
  const a = document.querySelector(`.navlink[href="${href}"]`);
  if (a) a.classList.add('aktiv');
}

window.addEventListener('hashchange', rute);

// ---------- Innlogging og kjeller-oppstart ----------

function abonnerPaAktivKjeller() {
  if (vinerAvslutt) vinerAvslutt();
  app.innerHTML = '<div class="side"><p class="tom">Laster kjelleren…</p></div>';
  vinerAvslutt = VinDB.abonner(aktivKjeller.id, (liste) => {
    alleViner = liste.sort((a, b) => (a.navn || '').localeCompare(b.navn || '', 'nb'));
    rute();
  });
}

function byttAktivKjeller(kjellerId) {
  aktivKjeller = mineKjellere.find((k) => k.id === kjellerId);
  if (!aktivKjeller) return;
  localStorage.setItem('vinkjeller-aktiv-kjeller', kjellerId);
  visBunnav(true);
  location.hash = '#/';
  abonnerPaAktivKjeller();
}

async function lastKjellereOgStart() {
  mineKjellere = await KjellerDB.hentMine();
  if (!mineKjellere.length) {
    visBunnav(false);
    visKjellerOnboarding();
    return;
  }
  const lagretId = localStorage.getItem('vinkjeller-aktiv-kjeller');
  aktivKjeller = mineKjellere.find((k) => k.id === lagretId) || mineKjellere[0];
  visBunnav(true);
  abonnerPaAktivKjeller();
}

function visOppstartsfeil(err) {
  console.error('[vinkjeller] Feil ved oppstart etter innlogging:', err);
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <h1>Noe gikk galt</h1>
      <p class="tom">${escapeHtml(err.message || String(err))}</p>
      <div class="knapperad"><button class="knapp knapp-primaer" id="prov-igjen-knapp">Prøv igjen</button></div>
    </div>
  `));
  document.getElementById('prov-igjen-knapp').addEventListener('click', () => location.reload());
}

// Starter admins sanntidsabonnement på ventende brukere (badge + Godkjenninger-siden).
// Kalles kun når innlogget bruker er ADMIN_UID.
function startVentendeAbonnement() {
  if (ventendeAvslutt) return;
  ventendeAvslutt = BrukerDB.abonnerVentende((liste) => {
    ventendeBrukere = liste;
    oppdaterGodkjenningsBadge();
    if (location.hash.startsWith('#/godkjenninger')) rute();
  });
}

function oppdaterGodkjenningsBadge() {
  const lenke = document.querySelector('.navlink[href="#/innstillinger"]');
  if (!lenke) return;
  let badge = lenke.querySelector('.nav-badge');
  if (ventendeBrukere.length > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'nav-badge';
      lenke.appendChild(badge);
    }
    badge.textContent = String(ventendeBrukere.length);
  } else if (badge) {
    badge.remove();
  }
}

// Abonnerer på eget brukere/{uid}-dokument og styrer om appen viser venteskjerm
// eller går videre til vanlig kjeller-oppstart. Kjøres for alle innloggede, hver
// gang innloggingsstatus endres.
function startBrukerAbonnement() {
  if (brukerAvslutt) brukerAvslutt();
  brukerAvslutt = BrukerDB.abonnerEget(bruker.uid, (brukerDok) => {
    if (!brukerDok) return; // venter på at BrukerDB.sikreEget() fullfører opprettelsen
    if (brukerDok.status === 'godkjent') {
      if (bruker.uid === ADMIN_UID) startVentendeAbonnement();
      if (sisteBrukerStatus !== 'godkjent') {
        sisteBrukerStatus = 'godkjent';
        lastKjellereOgStart().catch(visOppstartsfeil);
      }
    } else {
      sisteBrukerStatus = brukerDok.status;
      visVenteskjerm(brukerDok.status);
    }
  });
}

function visVenteskjerm(status) {
  visBunnav(false);
  const avvist = status === 'avvist';
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side innlogging-side">
      <div class="innlogging-boks">
        <div class="innlogging-ikon">${avvist ? '🚫' : '⏳'}</div>
        <h1>${avvist ? 'Ikke godkjent' : 'Venter på godkjenning'}</h1>
        <p class="hjelpetekst">${avvist
          ? 'Forespørselen din om tilgang til Vinkjelleren ble avslått.'
          : 'Sindre må godkjenne deg før du får tilgang. Du trenger ikke laste siden på nytt — du slippes automatisk videre så snart det skjer.'}</p>
        <div class="knapperad">
          <button class="knapp" id="logg-ut-knapp-venteskjerm">Logg ut</button>
        </div>
      </div>
    </div>
  `));
  document.getElementById('logg-ut-knapp-venteskjerm').addEventListener('click', () => loggUt());
}

paInnloggingsendring((innloggetBruker) => {
  console.log('[vinkjeller] innloggingsstatus endret:', innloggetBruker ? innloggetBruker.uid : 'utlogget');
  bruker = innloggetBruker;
  if (vinerAvslutt) { vinerAvslutt(); vinerAvslutt = null; }
  if (brukerAvslutt) { brukerAvslutt(); brukerAvslutt = null; }
  if (ventendeAvslutt) { ventendeAvslutt(); ventendeAvslutt = null; }
  sisteBrukerStatus = null;
  ventendeBrukere = [];

  if (!bruker) {
    visBunnav(false);
    visInnlogging();
    return;
  }

  visBunnav(false);
  app.innerHTML = '<div class="side"><p class="tom">Logger inn…</p></div>';
  BrukerDB.sikreEget(bruker)
    .then(() => startBrukerAbonnement())
    .catch(visOppstartsfeil);
});

function visInnlogging() {
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side innlogging-side">
      <div class="innlogging-boks">
        <div class="innlogging-ikon">🍷</div>
        <h1>Vinkjelleren</h1>
        <p class="hjelpetekst">Logg inn for å se og dele vinkjelleren med de du inviterer.</p>
        <button class="knapp knapp-primaer" id="google-logg-inn-knapp">Logg inn med Google</button>
      </div>
    </div>
  `));
  document.getElementById('google-logg-inn-knapp').addEventListener('click', async () => {
    try {
      await loggInnMedGoogle();
    } catch (err) {
      alert('Kunne ikke logge inn: ' + err.message);
    }
  });
}

function visKjellerOnboarding() {
  const fornavn = (bruker.displayName || '').split(' ')[0] || 'Min';
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <h1>Velkommen, ${escapeHtml(bruker.displayName || '')}!</h1>
      <p class="hjelpetekst">Du er ikke medlem av noen kjeller ennå. Opprett en ny, eller bli med i en du har fått invitasjonskode til.</p>

      <section class="detaljseksjon">
        <h2>Opprett ny kjeller</h2>
        <label>Navn på kjelleren<input id="ny-kjeller-navn" placeholder="${escapeHtml(fornavn)} sin kjeller"></label>
        <div class="knapperad">
          <button class="knapp knapp-primaer" id="opprett-kjeller-knapp">Opprett</button>
        </div>
      </section>

      <section class="detaljseksjon">
        <h2>Bli med i en kjeller</h2>
        <label>Invitasjonskode<input id="bli-med-kode" placeholder="f.eks. A3F9K2"></label>
        <div class="knapperad">
          <button class="knapp knapp-primaer" id="bli-med-knapp">Bli med</button>
        </div>
      </section>

      <div class="knapperad">
        <button class="knapp" id="logg-ut-knapp-onboarding">Logg ut</button>
      </div>
    </div>
  `));

  document.getElementById('opprett-kjeller-knapp').addEventListener('click', async () => {
    const navn = document.getElementById('ny-kjeller-navn').value.trim();
    const ny = await KjellerDB.opprett(navn || `${fornavn} sin kjeller`);
    mineKjellere.push(ny);
    byttAktivKjeller(ny.id);
  });

  document.getElementById('bli-med-knapp').addEventListener('click', async () => {
    const kode = document.getElementById('bli-med-kode').value.trim();
    if (!kode) { alert('Skriv inn koden du har fått.'); return; }
    try {
      const kjeller = await KjellerDB.bliMedViaKode(kode);
      mineKjellere.push(kjeller);
      byttAktivKjeller(kjeller.id);
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('logg-ut-knapp-onboarding').addEventListener('click', () => loggUt());
}

// ---------- Visning: Oversikt ----------

// Relativ dato («I dag», «I går», «N dager siden») for aktivitetsfeeden under, regnet ut fra
// en ISO-dato (yyyy-mm-dd).
function relativDato(iso) {
  const da = new Date(iso);
  if (Number.isNaN(da.getTime())) return '';
  const dagerSiden = Math.round((new Date(new Date().toDateString()) - new Date(da.toDateString())) / 86400000);
  if (dagerSiden <= 0) return 'I dag';
  if (dagerSiden === 1) return 'I går';
  if (dagerSiden < 14) return `${dagerSiden} dager siden`;
  if (dagerSiden < 60) return `${Math.round(dagerSiden / 7)} uker siden`;
  return `${Math.round(dagerSiden / 30)} måneder siden`;
}

// «Nylig aktivitet» avledes av eksisterende felter (drukketDato/innkjopsdato) — appen har ingen
// egen hendelseslogg, så dette er en tolkning av mockupens aktivitetsfeed, ikke en direkte port.
// Eldre poster uten innkjopsdato dukker naturlig nok ikke opp som «lagt til»-hendelser.
function nyligAktivitet(alle, antall) {
  const hendelser = [];
  for (const v of alle) {
    if (v.drukketDato) hendelser.push({ v, verb: 'Drukket', dato: v.drukketDato });
    else if (v.innkjopsdato) hendelser.push({ v, verb: 'Lagt til', dato: v.innkjopsdato });
  }
  hendelser.sort((a, b) => b.dato.localeCompare(a.dato));
  return hendelser.slice(0, antall);
}

function visOversikt() {
  const iKjelleren = alleViner.filter((v) => !v.drukketDato);
  const drukket = alleViner.filter((v) => v.drukketDato);
  const vinIKjelleren = iKjelleren.filter((v) => (v.kategori || 'Vin') === 'Vin');
  const brennevinIKjelleren = iKjelleren.filter((v) => v.kategori === 'Brennevin');

  const { unikeProdukter, totalFlasker, totalVerdi } = beregnStats(iKjelleren);

  const klarNa = iKjelleren.filter((v) => drikkestatus(v).klasse === 'status-klar' || drikkestatus(v).klasse === 'status-snart');
  const hastesak = iKjelleren.filter((v) => drikkestatus(v).klasse === 'status-hastesak');
  const snart = iKjelleren.filter((v) => drikkestatus(v).klasse === 'status-snart');

  const flaskerVin = vinIKjelleren.reduce((s, v) => s + (Number(v.antallFlasker) || 0), 0);
  const flaskerBrennevin = brennevinIKjelleren.reduce((s, v) => s + (Number(v.antallFlasker) || 0), 0);
  const flaskerTotalt = flaskerVin + flaskerBrennevin;
  const andelVin = flaskerTotalt ? Math.round((flaskerVin / flaskerTotalt) * 100) : 0;

  const aktivitet = nyligAktivitet(alleViner, 4);

  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <h1>${escapeHtml(aktivKjeller.navn)}</h1>
      <div class="statgrid">
        <div class="statkort statkort-produkter"><span class="stattall">${unikeProdukter}</span><span class="statlabel">produkter</span></div>
        <div class="statkort statkort-flasker"><span class="stattall">${totalFlasker}</span><span class="statlabel">flasker</span></div>
        <div class="statkort statkort-verdi"><span class="stattall">${formatKr(totalVerdi) || '–'}</span><span class="statlabel">est. verdi</span></div>
      </div>
      ${unikeProdukter ? `<p class="hjelpetekst">${vinIKjelleren.length} vin(er) · ${brennevinIKjelleren.length} brennevin · ${(aktivKjeller.medlemmer || []).length} medlem(mer)</p>` : `<p class="hjelpetekst">${(aktivKjeller.medlemmer || []).length} medlem(mer) i denne kjelleren</p>`}
      ${flaskerTotalt ? `<div class="fordelingsbar"><div class="fordelingsbar-vin" style="width:${andelVin}%"></div><div class="fordelingsbar-brennevin" style="width:${100 - andelVin}%"></div></div>` : ''}

      ${aktivitet.length ? `
        <section>
          <h2>Nylig aktivitet</h2>
          <ul class="aktivitet-liste">${aktivitet.map((h) => `
            <li class="aktivitet-rad">
              <span class="aktivitet-ikon">${flaskeIkonSvg(h.v.kategori, h.v.type)}</span>
              <span class="aktivitet-info">
                <span class="aktivitet-navn">${escapeHtml(h.v.navn)}</span>
                <div class="aktivitet-verb ${h.verb === 'Drukket' ? 'aktivitet-verb-drukket' : 'aktivitet-verb-lagt'}">${h.verb} · ${relativDato(h.dato)}</div>
              </span>
            </li>
          `).join('')}</ul>
        </section>` : ''}

      ${hastesak.length ? `
        <section class="varselboks varsel-hastesak">
          <h2>⚠️ Bør drikkes snart</h2>
          ${listeKompakt(hastesak)}
        </section>` : ''}

      ${snart.length ? `
        <section class="varselboks varsel-snart">
          <h2>⏳ Nærmer seg siste år</h2>
          ${listeKompakt(snart)}
        </section>` : ''}

      <section>
        <h2>Klare til drikking (${klarNa.length})</h2>
        ${klarNa.length ? listeKompakt(klarNa.slice(0, 8)) : '<p class="tom">Ingen produkter er markert som klare akkurat nå.</p>'}
      </section>

      ${unikeProdukter === 0 ? `<p class="tom">Kjelleren er tom. Trykk «Legg til flaske» for å registrere den første vinen eller flasken brennevin.</p>` : ''}

      ${drukket.length ? `<p class="hjelpetekst"><a href="#/viner">${drukket.length} i drikkehistorikken →</a></p>` : ''}
    </div>
  `));
}

function listeKompakt(viner) {
  return `<ul class="kompaktliste">${viner.map((v) => `
    <li><a href="#/vin/${v.id}">
      <span class="kl-ikon">${flaskeIkonSvg(v.kategori, v.type)}</span>
      <span class="kl-tekst">
        <span class="kl-navn">${escapeHtml(v.navn)}${v.argang ? ' ' + escapeHtml(v.argang) : ''}</span>
        <span class="kl-info">${escapeHtml(v.type || '')} · ${v.antallFlasker || 0} stk</span>
      </span>
    </a></li>
  `).join('')}</ul>`;
}

// ---------- Visning: Vinliste (delt mellom Vin og Brennevin) ----------

let filterState = { sok: '', type: '', matpar: '', status: '', visning: 'kjeller', kategori: 'Vin' };

function visVinliste(kategori) {
  if (kategori) {
    if (kategori !== filterState.kategori) filterState.type = '';
    filterState.kategori = kategori;
  }
  const erBrennevin = filterState.kategori === 'Brennevin';
  const iKjellerenKategori = alleViner.filter((v) => (v.kategori || 'Vin') === filterState.kategori && !v.drukketDato);
  const { totalFlasker: flaskerKategori, totalVerdi: verdiKategori } = beregnStats(iKjellerenKategori);

  app.innerHTML = '';
  const wrap = el(`
    <div class="side">
      <h1>${erBrennevin ? '🥃 Brennevin' : '🍷 Viner'}</h1>
      ${filterState.visning === 'kjeller' && iKjellerenKategori.length ? `<p class="hjelpetekst">${flaskerKategori} flaske(r) · estimert verdi ${formatKr(verdiKategori) || '–'}</p>` : ''}
      <div class="visning-bytter">
        <button type="button" class="visning-knapp ${filterState.visning === 'kjeller' ? 'aktiv' : ''}" id="knapp-kjeller">${erBrennevin ? '🥃' : '🍷'} I kjelleren</button>
        <button type="button" class="visning-knapp ${filterState.visning === 'drukket' ? 'aktiv' : ''}" id="knapp-drukket">🍾 Drukket</button>
      </div>
      <div class="filterrad">
        <input type="search" id="sok" placeholder="Søk navn, produsent, druer..." value="${escapeHtml(filterState.sok)}">
        <div class="filterrad2">
          <select id="filter-type">
            <option value="">Alle typer</option>
            ${TYPER[filterState.kategori].map((t) => `<option value="${t}" ${filterState.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
          <select id="filter-matpar">
            <option value="">Alle matpar</option>
            ${MATPAR_KATEGORIER.map((m) => `<option value="${m}" ${filterState.matpar === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
          <select id="filter-status" ${filterState.visning === 'drukket' ? 'disabled' : ''}>
            <option value="">Alle statuser</option>
            <option value="status-klar" ${filterState.status === 'status-klar' ? 'selected' : ''}>Klar til drikking</option>
            <option value="status-snart" ${filterState.status === 'status-snart' ? 'selected' : ''}>Drikk snart</option>
            <option value="status-hastesak" ${filterState.status === 'status-hastesak' ? 'selected' : ''}>På hell</option>
            <option value="status-venter" ${filterState.status === 'status-venter' ? 'selected' : ''}>Ikke klar ennå</option>
          </select>
        </div>
      </div>
      <div class="knapperad">
        <a class="knapp knapp-primaer" href="#/registrer${erBrennevin ? '/brennevin' : ''}">📷 Legg til ${erBrennevin ? 'brennevin' : 'vin'} med bilde og skanning</a>
      </div>
      <div id="vinliste-resultat"></div>
    </div>
  `);
  app.appendChild(wrap);

  document.getElementById('sok').addEventListener('input', (e) => { filterState.sok = e.target.value; renderVinlisteResultat(); });
  document.getElementById('filter-type').addEventListener('change', (e) => { filterState.type = e.target.value; renderVinlisteResultat(); });
  document.getElementById('filter-matpar').addEventListener('change', (e) => { filterState.matpar = e.target.value; renderVinlisteResultat(); });
  document.getElementById('filter-status').addEventListener('change', (e) => { filterState.status = e.target.value; renderVinlisteResultat(); });
  document.getElementById('knapp-kjeller').addEventListener('click', () => bytVisning('kjeller'));
  document.getElementById('knapp-drukket').addEventListener('click', () => bytVisning('drukket'));

  renderVinlisteResultat();
}

function bytVisning(visning) {
  filterState.visning = visning;
  visVinliste();
}

function renderVinlisteResultat() {
  const resultat = document.getElementById('vinliste-resultat');
  const sok = filterState.sok.trim().toLowerCase();
  let filtrert = alleViner.filter((v) => {
    if ((v.kategori || 'Vin') !== filterState.kategori) return false;
    if (filterState.visning === 'drukket' ? !v.drukketDato : !!v.drukketDato) return false;
    if (filterState.type && v.type !== filterState.type) return false;
    if (filterState.matpar && !(v.matparKategorier || []).includes(filterState.matpar)) return false;
    if (filterState.visning === 'kjeller' && filterState.status && drikkestatus(v).klasse !== filterState.status) return false;
    if (sok) {
      const felt = `${v.navn} ${v.produsent} ${v.druer} ${v.region} ${v.land}`.toLowerCase();
      if (!felt.includes(sok)) return false;
    }
    return true;
  });

  if (filterState.visning === 'drukket') {
    filtrert.sort((a, b) => (b.drukketDato || '').localeCompare(a.drukketDato || ''));
  }

  if (!filtrert.length) {
    resultat.innerHTML = `<p class="tom">${filterState.visning === 'drukket' ? 'Ingen i drikkehistorikken ennå.' : 'Ingen treffer filteret.'}</p>`;
    return;
  }

  resultat.innerHTML = `<div class="vinkort-liste">${filtrert.map(vinkortHtml).join('')}</div>`;
}

function vinkortHtml(v) {
  const status = drikkestatus(v);
  const badge = v.drukketDato
    ? `<span class="status-badge status-drukket">Drukket ${escapeHtml(v.drukketDato)}</span>`
    : `<span class="status-badge ${status.klasse}">${status.label}</span>`;
  const fyllniva = hentFyllniva(v);
  const visFyllniva = v.kategori === 'Brennevin' && !v.drukketDato && fyllniva < 100;
  return `
    <a class="vinkort ${v.drukketDato ? 'drukket' : ''}" href="#/vin/${v.id}">
      <div class="vinkort-bilde">${v.bilde ? `<img src="${v.bilde}" alt="">` : flaskeIkonSvg(v.kategori, v.type)}</div>
      <div class="vinkort-info">
        <div class="vinkort-navn">${escapeHtml(v.navn)}${v.argang ? ` <span class="argang">${escapeHtml(v.argang)}</span>` : ''}</div>
        <div class="vinkort-detalj">${escapeHtml(v.produsent || '')}${v.type ? ' · ' + escapeHtml(v.type) : ''}</div>
        <div class="vinkort-detalj">${v.antallFlasker || 0} flaske(r)${v.land ? ' · ' + escapeHtml(v.land) : ''}</div>
        ${visFyllniva ? `<div class="fyllniva-bar-liten" title="${fyllniva}% igjen"><div class="fyllniva-bar-indre" style="width:${fyllniva}%"></div></div>` : ''}
        ${badge}
      </div>
    </a>
  `;
}

// ---------- Visning: Detalj ----------

function visDetalj(id) {
  const v = alleViner.find((x) => x.id === id);
  if (!v) { location.hash = '#/viner'; return; }
  const kategori = v.kategori || 'Vin';
  const erBrennevin = kategori === 'Brennevin';
  const status = drikkestatus(v);
  const forslag = hentForslag(kategori, v.type);
  const verdiTotal = vinVerdi(v);
  const fyllnivaForVerdi = hentFyllniva(v);
  const verdiForklaring = erBrennevin && fyllnivaForVerdi < 100 && (Number(v.antallFlasker) || 0) > 0
    ? `${(Number(v.antallFlasker) || 0) > 1 ? `${Number(v.antallFlasker) - 1} hel(e) á ${formatKr(v.innkjopspris)} + ` : ''}${fyllnivaForVerdi}% av 1 á ${formatKr(v.innkjopspris)}`
    : `${v.antallFlasker} × ${formatKr(v.innkjopspris)}`;
  const tilbakeHref = erBrennevin ? '#/brennevin' : '#/viner';
  const ikon = erBrennevin ? '🥃' : '🍷';

  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <a href="${tilbakeHref}" class="tilbake">← Tilbake til ${erBrennevin ? 'brennevin' : 'viner'}</a>
      ${v.bilde ? `<img class="detaljbilde" src="${v.bilde}" alt="">` : `<div class="detaljbilde detaljbilde-plassholder">${plassholderSvg(kategori, v.type)}</div>`}
      <h1>${ikon} ${escapeHtml(v.navn)}${v.argang ? ` <span class="argang">${escapeHtml(v.argang)}</span>` : ''}</h1>
      ${v.drukketDato
        ? `<span class="status-badge status-drukket">🍾 Drukket ${escapeHtml(v.drukketDato)}${v.drukketAv ? ' av ' + escapeHtml(v.drukketAv.navn) : ''}</span>`
        : `<span class="status-badge ${status.klasse}">${status.label}</span>`}

      <div class="knapperad">
        ${v.drukketDato
          ? `<button class="knapp" id="angre-drukket-knapp">Legg tilbake i kjelleren</button>`
          : `
            <button class="knapp" id="legg-til-flaske-knapp">+ Legg til flaske</button>
            ${(Number(v.antallFlasker) || 0) > 1
              ? `<button class="knapp" id="ta-ut-flaske-knapp">− Tatt ut en flaske</button>`
              : `<button class="knapp knapp-gull" id="drukket-knapp">🍾 Merk som drukket</button>`}
          `}
      </div>
      <div class="vurdering-rad">
        <span class="vurdering-stjerner" id="vurdering-stjerner">${v.vurdering ? '★'.repeat(v.vurdering) + '☆'.repeat(5 - v.vurdering) : 'Ingen vurdering'}</span>
        <input type="range" min="0" max="5" step="1" id="vurdering-slider" value="${v.vurdering || 0}">
      </div>

      ${erBrennevin && !v.drukketDato ? `
      <section class="detaljseksjon">
        <h2>🧪 Fyllnivå</h2>
        <div class="fyllniva-rad">
          <input type="range" min="0" max="100" step="5" id="fyllniva-slider" value="${hentFyllniva(v)}">
          <span class="fyllniva-tall" id="fyllniva-tall">${hentFyllniva(v)}%</span>
        </div>
        <p class="hjelpetekst">Hvor mye er igjen i flasken som er i bruk nå.</p>
      </section>
      ` : ''}

      <section class="detaljseksjon">
        <h2>Om ${erBrennevin ? 'flasken' : 'vinen'}</h2>
        <dl class="detaljliste">
          ${dRad('Kategori', kategori)}
          ${dRad('Produsent', v.produsent)}
          ${dRad('Type', v.type)}
          ${dRad('Land / region', [v.land, v.region].filter(Boolean).join(' – '))}
          ${dRad('Druer', v.druer)}
          ${dRad('Antall flasker', v.antallFlasker)}
          ${dRad('Volum', v.volumCl ? v.volumCl + ' cl' : '')}
          ${dRad('Pris per flaske', formatKr(v.innkjopspris))}
          ${dRad('Verdi totalt', verdiTotal ? `${formatKr(verdiTotal)}  (${verdiForklaring})` : '')}
          ${dRad('Kjøpt hos', v.kjoptHos)}
          ${dRad('Innkjøpsdato', v.innkjopsdato)}
          ${dRad('Strekkode (EAN)', v.ean)}
          ${dRad('Lagt til av', v.lagtTilAv?.navn)}
        </dl>
      </section>

      <section class="detaljseksjon">
        <h2>🌡️ Lagring &amp; servering</h2>
        <dl class="detaljliste">
          ${dRad('Lagringssted', v.lagringssted)}
          ${dRad('Lagringstemperatur', v.lagringstemperatur || forslag.temp)}
          ${dRad('Fuktighet', v.lagringsfuktighet || forslag.fuktighet)}
          ${dRad('Serveringstemperatur', v.serveringstemperatur || forslag.servering)}
          ${dRad('Drikkeklar fra', v.drikkeklarFra)}
          ${dRad('Siste år', v.drikkeklarTil)}
        </dl>
        <p class="hjelpetekst">💡 ${escapeHtml(forslag.notat)}</p>
        ${v.drikkeklarKilde === 'ai' ? `<p class="hjelpetekst">🤖 Drikkevinduet er et AI-generert estimat${v.aiToppAr ? `, med antatt toppår ${escapeHtml(v.aiToppAr)}` : ''}${v.aiKonfidens ? ` (sikkerhet: ${escapeHtml(v.aiKonfidens)})` : ''}.${v.aiBegrunnelse ? ` ${escapeHtml(v.aiBegrunnelse)}` : ''}</p>` : ''}
      </section>

      <section class="detaljseksjon">
        <h2>🍽️ Passer til</h2>
        ${(v.matparKategorier || []).length ? `<div class="tags">${v.matparKategorier.map((m) => `<span class="tag">${escapeHtml(m)}</span>`).join('')}</div>` : '<p class="tom">Ingen kategorier valgt.</p>'}
        ${v.matparNotater ? `<p>${escapeHtml(v.matparNotater)}</p>` : ''}
      </section>

      ${v.smaksnotater || v.vurdering ? `
      <section class="detaljseksjon">
        <h2>📝 Smaksnotater</h2>
        ${v.vurdering ? `<p class="stjerner">${'★'.repeat(v.vurdering)}${'☆'.repeat(5 - v.vurdering)}</p>` : ''}
        ${v.smaksnotater ? `<p>${escapeHtml(v.smaksnotater)}</p>` : ''}
      </section>` : ''}

      <div class="knapperad">
        <a class="knapp" href="#/rediger/${v.id}">Rediger</a>
        <button class="knapp knapp-fare" id="slett-knapp">Slett</button>
      </div>
    </div>
  `));

  const fyllnivaSlider = document.getElementById('fyllniva-slider');
  if (fyllnivaSlider) {
    const fyllnivaTall = document.getElementById('fyllniva-tall');
    fyllnivaSlider.addEventListener('input', () => {
      fyllnivaTall.textContent = `${fyllnivaSlider.value}%`;
    });
    fyllnivaSlider.addEventListener('change', async () => {
      await VinDB.lagre(aktivKjeller.id, { ...v, fyllniva: Number(fyllnivaSlider.value) });
    });
  }

  const vurderingSlider = document.getElementById('vurdering-slider');
  if (vurderingSlider) {
    const vurderingStjerner = document.getElementById('vurdering-stjerner');
    vurderingSlider.addEventListener('input', () => {
      const n = Number(vurderingSlider.value);
      vurderingStjerner.textContent = n ? '★'.repeat(n) + '☆'.repeat(5 - n) : 'Ingen vurdering';
    });
    vurderingSlider.addEventListener('change', async () => {
      const n = Number(vurderingSlider.value);
      await VinDB.lagre(aktivKjeller.id, { ...v, vurdering: n || '' });
    });
  }

  // Knappen leser v.antallFlasker fra denne rendringen (lukket over i klikk-handleren) —
  // uten å deaktivere den med én gang ville rask gjentatt trykking (f.eks. for å gå fra
  // 1 til 8 flasker) bare skrevet det SAMME +1-resultatet om igjen for hvert trykk, siden
  // siden ikke rekker å tegnes på nytt med fersk v mellom hvert trykk.
  const leggTilFlaskeKnapp = document.getElementById('legg-til-flaske-knapp');
  if (leggTilFlaskeKnapp) {
    leggTilFlaskeKnapp.addEventListener('click', async () => {
      leggTilFlaskeKnapp.disabled = true;
      await VinDB.lagre(aktivKjeller.id, { ...v, antallFlasker: (Number(v.antallFlasker) || 0) + 1 });
    });
  }

  const taUtFlaskeKnapp = document.getElementById('ta-ut-flaske-knapp');
  if (taUtFlaskeKnapp) {
    taUtFlaskeKnapp.addEventListener('click', async () => {
      taUtFlaskeKnapp.disabled = true;
      await VinDB.lagre(aktivKjeller.id, { ...v, antallFlasker: Math.max(0, (Number(v.antallFlasker) || 0) - 1) });
    });
  }

  const drukketKnapp = document.getElementById('drukket-knapp');
  if (drukketKnapp) {
    drukketKnapp.addEventListener('click', async () => {
      const idagIso = new Date().toISOString().slice(0, 10);
      await VinDB.lagre(aktivKjeller.id, { ...v, antallFlasker: 0, drukketDato: idagIso });
    });
  }

  const angreDrukketKnapp = document.getElementById('angre-drukket-knapp');
  if (angreDrukketKnapp) {
    angreDrukketKnapp.addEventListener('click', async () => {
      await VinDB.lagre(aktivKjeller.id, { ...v, antallFlasker: Math.max(1, Number(v.antallFlasker) || 0), drukketDato: '' });
    });
  }

  document.getElementById('slett-knapp').addEventListener('click', async () => {
    if (confirm(`Slette «${v.navn}» fra kjelleren?`)) {
      await VinDB.slett(aktivKjeller.id, v.id);
      location.hash = tilbakeHref;
    }
  });
}

function dRad(label, verdi) {
  if (verdi === undefined || verdi === null || verdi === '') return '';
  return `<dt>${label}</dt><dd>${escapeHtml(verdi)}</dd>`;
}

// Bytter kategori i det åpne skjemaet: oppdaterer skjult felt, aktiv-knapp, type-valg og lagringsforslag.
function byttKategoriISkjema(skjema, kategori, forhandsvalgtType) {
  const kategoriFelt = document.getElementById('kategori-felt');
  const knappVin = document.getElementById('knapp-kat-vin');
  const knappBrennevin = document.getElementById('knapp-kat-brennevin');
  const typeSelect = skjema.querySelector('select[name="type"]');

  if (kategoriFelt) kategoriFelt.value = kategori;
  if (knappVin) knappVin.classList.toggle('aktiv', kategori === 'Vin');
  if (knappBrennevin) knappBrennevin.classList.toggle('aktiv', kategori === 'Brennevin');

  const fyllnivaRad = document.getElementById('fyllniva-rad-skjema');
  if (fyllnivaRad) fyllnivaRad.style.display = kategori === 'Brennevin' ? '' : 'none';

  const typer = TYPER[kategori] || TYPER['Vin'];
  const valgtType = typer.includes(forhandsvalgtType) ? forhandsvalgtType : typer[0];
  if (typeSelect) {
    typeSelect.innerHTML = typer.map((t) => `<option ${t === valgtType ? 'selected' : ''}>${t}</option>`).join('');
  }

  oppdaterLagringsplaceholder(kategori, valgtType);
}

function oppdaterLagringsplaceholder(kategori, type) {
  const forslag = hentForslag(kategori, type);
  const tempFelt = document.getElementById('temp-felt');
  const fuktFelt = document.getElementById('fukt-felt');
  const serveFelt = document.getElementById('serve-felt');
  if (forslag && tempFelt) tempFelt.placeholder = forslag.temp;
  if (forslag && fuktFelt) fuktFelt.placeholder = forslag.fuktighet;
  if (forslag && serveFelt) serveFelt.placeholder = forslag.servering;
}

// Fyller det synlige skjemaet med felter fra et (allerede normalisert) objekt.
function fyllSkjemaFraVin(skjema, data) {
  const settVerdi = (navn, verdi) => {
    const felt = skjema.elements.namedItem(navn);
    if (felt) felt.value = verdi ?? '';
  };

  byttKategoriISkjema(skjema, data.kategori || 'Vin', data.type);

  settVerdi('navn', data.navn);
  settVerdi('produsent', data.produsent);
  settVerdi('argang', data.argang);
  settVerdi('land', data.land);
  settVerdi('region', data.region);
  settVerdi('druer', data.druer);
  settVerdi('antallFlasker', data.antallFlasker || 1);
  settVerdi('volumCl', data.volumCl || 75);
  settVerdi('innkjopspris', data.innkjopspris);
  settVerdi('lagringssted', data.lagringssted);
  settVerdi('lagringstemperatur', data.lagringstemperatur);
  settVerdi('lagringsfuktighet', data.lagringsfuktighet);
  settVerdi('serveringstemperatur', data.serveringstemperatur);
  settVerdi('drikkeklarFra', data.drikkeklarFra);
  settVerdi('drikkeklarTil', data.drikkeklarTil);
  settVerdi('matparNotater', data.matparNotater);
  settVerdi('smaksnotater', data.smaksnotater);
  settVerdi('vurdering', data.vurdering);

  skjema.querySelectorAll('input[name="matpar"]').forEach((cb) => {
    cb.checked = (data.matparKategorier || []).includes(cb.value);
  });
}

// ---------- Visning: Legg til med bilde + skanning ----------

// Tar imot en avlest/inntastet EAN fra legg-til-flyten. Finnes den allerede i egen kjeller,
// åpnes den vinen i stedet for å opprette en duplikat. Ellers sjekkes den delte
// strekkode-cachen — finnes fakta om flasken der fra før (noen andre har identifisert den),
// bæres de med videre slik at skjemaet forhåndsutfylles og AI ikke er nødvendig. Uansett
// bæres EAN-en og bildet som ble tatt videre til skjemaet (#/ny).
async function handterRegistrertEan(ean, bildeData) {
  const funnet = alleViner.find((v) => v.ean === ean && !v.drukketDato);
  if (funnet) {
    alert(`«${funnet.navn}» finnes allerede i kjelleren. Bruk «+ Legg til flaske» på vinen for å øke antallet.`);
    location.hash = `#/vin/${funnet.id}`;
    return;
  }
  let kjenteFakta = null;
  try {
    kjenteFakta = await ProduktDB.hentByEan(ean);
  } catch (err) {
    console.error('[vinkjeller] Kunne ikke slå opp strekkode i delt cache:', err);
  }
  ventendeSkannData = {
    ean,
    bilde: bildeData || '',
    viaRegistrerFlyt: true,
    harCacheTreff: !!kjenteFakta,
    ...(kjenteFakta || {}),
  };
  location.hash = '#/ny';
}

// Steg 1: kamera rettet mot etiketten med en firkant-ramme som veiledning for hva som blir
// synlig i appen. Går automatisk videre til strekkodeskanning når bildet er tatt (eller
// steget er hoppet over).
function visRegistrer(forhandsvalgtKategori) {
  registrerBildeSteg(forhandsvalgtKategori);
}

function registrerBildeSteg(forhandsvalgtKategori) {
  const ordKategori = forhandsvalgtKategori === 'Brennevin' ? 'brennevin' : 'vin';
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <h1>📷 Legg til ${ordKategori}</h1>
      <div class="kamera-boks">
        <video id="foto-video" class="skann-video" autoplay playsinline muted></video>
        <div class="kamera-ramme" aria-hidden="true"></div>
      </div>
      <p class="hjelpetekst" id="foto-status">Tar bilde av etiketten</p>
      <div class="lukker-rad">
        <button type="button" class="knapp-lukker" id="foto-ta-knapp" disabled aria-label="Ta bilde"></button>
      </div>
      <div class="knapperad">
        <button type="button" class="knapp" id="foto-hopp-knapp">Hopp over bilde</button>
        <a class="knapp" href="#/${forhandsvalgtKategori === 'Brennevin' ? 'brennevin' : 'viner'}">Avbryt</a>
      </div>
    </div>
  `));

  const video = document.getElementById('foto-video');
  const status = document.getElementById('foto-status');
  const taKnapp = document.getElementById('foto-ta-knapp');
  const hoppKnapp = document.getElementById('foto-hopp-knapp');
  let stream = null;

  const gaVidereTilSkann = (bildeData) => {
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    stoppSkann = null;
    registrerSkannSteg(forhandsvalgtKategori, bildeData);
  };

  hoppKnapp.addEventListener('click', () => gaVidereTilSkann(''));

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((s) => {
    if (!location.hash.startsWith('#/registrer')) { s.getTracks().forEach((t) => t.stop()); return; } // rakk å navigere bort før kameraet var klart
    stream = s;
    video.srcObject = stream;
    taKnapp.disabled = false;
    stoppSkann = () => { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } };
  }).catch((err) => {
    console.error('[vinkjeller] Kunne ikke starte kameraet for bilde:', err);
    status.textContent = 'Fikk ikke tilgang til kameraet. Du kan hoppe over bildet og fortsette.';
  });

  taKnapp.addEventListener('click', async () => {
    // Beskjærer til samme høyreist 3:4-format som rammen på skjermen viser, slik at bildet
    // som lagres faktisk matcher det brukeren ser — og passer bedre til en vinetikett enn
    // hele (ofte bredere) kamerabildet.
    const RAMME_ASPEKT = 3 / 4;
    const vb = video.videoWidth, vh = video.videoHeight;
    let bredde = vb, hoyde = vb / RAMME_ASPEKT;
    if (hoyde > vh) { hoyde = vh; bredde = vh * RAMME_ASPEKT; }
    const sx = (vb - bredde) / 2, sy = (vh - hoyde) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = bredde;
    canvas.height = hoyde;
    canvas.getContext('2d').drawImage(video, sx, sy, bredde, hoyde, 0, 0, bredde, hoyde);
    const bildeData = await skalerOgKomprimerDataUrl(canvas.toDataURL('image/jpeg', 0.92));
    gaVidereTilSkann(bildeData);
  });
}

// Steg 2: strekkodeskanning, starter automatisk rett etter bildet. Treff sjekkes mot egen
// kjeller og den delte strekkode-cachen i handterRegistrertEan over.
function registrerSkannSteg(forhandsvalgtKategori, bildeData) {
  const ordKategori = forhandsvalgtKategori === 'Brennevin' ? 'brennevin' : 'vin';
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <h1>📷 Legg til ${ordKategori}</h1>
      ${bildeData ? `<img class="detaljbilde" src="${bildeData}" alt="Bilde av etiketten">` : ''}
      <p class="hjelpetekst" id="skann-status">Skanner strekkode</p>
      <video id="skann-video" class="skann-video" autoplay playsinline muted></video>
      <div class="knapperad">
        <button type="button" class="knapp" id="skann-hopp-knapp">Hopp over skanning</button>
      </div>
      <details class="mal-detaljer" id="skann-manuell-detaljer">
        <summary>Skriv inn strekkode manuelt i stedet</summary>
        <label>Strekkode (EAN)<input id="skann-manuell-input" inputmode="numeric" placeholder="f.eks. 7311041012345"></label>
        <div class="knapperad">
          <button type="button" class="knapp" id="skann-manuell-knapp">Bruk denne koden</button>
        </div>
      </details>
    </div>
  `));

  document.getElementById('skann-hopp-knapp').addEventListener('click', () => {
    ventendeSkannData = { ean: '', bilde: bildeData || '', viaRegistrerFlyt: true };
    location.hash = '#/ny';
  });

  document.getElementById('skann-manuell-knapp').addEventListener('click', () => {
    const ean = document.getElementById('skann-manuell-input').value.trim();
    if (!ean) { alert('Skriv inn strekkoden først.'); return; }
    handterRegistrertEan(ean, bildeData);
  });

  import('./skann.js').then(({ startSkann }) => {
    if (!location.hash.startsWith('#/registrer')) return; // brukeren rakk å navigere bort før modulen lastet
    const video = document.getElementById('skann-video');
    const status = document.getElementById('skann-status');
    startSkann(video, {
      onTreff: (ean) => {
        status.textContent = `Fant strekkode ${ean}`;
        handterRegistrertEan(ean, bildeData);
      },
      onFeil: (err) => {
        console.error('[vinkjeller] Kunne ikke starte kameraet for skanning:', err);
        status.textContent = 'Klarte ikke å skanne strekkoden. Kopier malen og bildet separat på neste side, og lim begge inn i en AI-chat manuelt — eller skriv inn koden manuelt under.';
        document.getElementById('skann-manuell-detaljer').open = true;
      },
    }).then((stopp) => {
      if (location.hash.startsWith('#/registrer')) stoppSkann = stopp;
      else stopp();
    });
  });
}

// ---------- Visning: Skjema (legg til / rediger) ----------

function visSkjema(id, forhandsvalgtKategori) {
  const skannData = ventendeSkannData;
  ventendeSkannData = null;
  const eksisterende = id ? alleViner.find((x) => x.id === id) : null;
  const forhandsutfyltEan = !eksisterende && skannData ? skannData.ean : '';
  const fraSkann = !!forhandsutfyltEan;
  const fraCache = fraSkann && !!skannData.harCacheTreff;
  const kategoriStart = eksisterende
    ? (eksisterende.kategori || 'Vin')
    : (fraCache && skannData.kategori) || (forhandsvalgtKategori === 'Brennevin' ? 'Brennevin' : 'Vin');
  const v = eksisterende || {
    kategori: kategoriStart,
    navn: '', produsent: '', argang: '', type: TYPER[kategoriStart][0], land: '', region: '', druer: '',
    antallFlasker: 1, volumCl: 75, innkjopspris: '', innkjopsdato: '', kjoptHos: '',
    lagringssted: '', lagringstemperatur: '', lagringsfuktighet: '', serveringstemperatur: '',
    drikkeklarFra: '', drikkeklarTil: '', matparKategorier: [], matparNotater: '',
    smaksnotater: '', vurdering: '', bilde: '', drukketDato: '',
    aiToppAr: '', aiBegrunnelse: '', aiKonfidens: '', drikkeklarKilde: '',
    ...(fraCache ? skannData : {}),
    ean: forhandsutfyltEan,
    bilde: (skannData && skannData.bilde) || '',
  };
  const vKategori = v.kategori || 'Vin';
  const ordKategori = vKategori === 'Brennevin' ? 'brennevin' : 'vin';
  const forslagStart = hentForslag(vKategori, v.type);
  const visAiSeksjon = !eksisterende && !fraCache;

  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <h1>${eksisterende ? `Rediger ${ordKategori}` : `Legg til ${ordKategori}`}</h1>

      <div class="visning-bytter">
        <button type="button" class="visning-knapp ${vKategori === 'Vin' ? 'aktiv' : ''}" id="knapp-kat-vin">🍷 Vin</button>
        <button type="button" class="visning-knapp ${vKategori === 'Brennevin' ? 'aktiv' : ''}" id="knapp-kat-brennevin">🥃 Brennevin</button>
      </div>

      <label>Bilde av etikett (kamera eller fra galleriet)
        <input type="file" accept="image/*" id="bilde-input">
      </label>
      <img id="bilde-forhandsvisning" class="detaljbilde" src="${v.bilde || ''}" style="${v.bilde ? '' : 'display:none'}">

      ${fraCache ? `
      <p class="hjelpetekst">✅ Strekkoden <strong>${escapeHtml(forhandsutfyltEan)}</strong> er kjent fra før — feltene under er forhåndsutfylt. Sjekk at alt stemmer før du lagrer.</p>
      ` : ''}

      ${visAiSeksjon ? `
      <section class="detaljseksjon">
        <h2>🤖 ${forhandsutfyltEan ? 'Ukjent strekkode — identifiser med AI' : 'Legg til med AI'}</h2>
        <p class="hjelpetekst">
          ${forhandsutfyltEan ? `Fant ikke strekkoden <strong>${escapeHtml(forhandsutfyltEan)}</strong> i noen database. ` : ''}Skriv inn det du vet om flasken under, og trykk «Kopier kode og åpne Claude» —
          den kopierer strekkode, forespørsel og det du skrev i én operasjon, og åpner Claude i
          en ny fane klar til å lime inn.${v.bilde ? ' Trykk deretter «Kopier bilde» og lim det inn i samme melding — det gir ekstra treffsikkerhet.' : ''}
          Lim JSON-svaret AI-en gir tilbake inn i feltet under — én flaske fyller ut skjemaet så
          du kan sjekke det før lagring, en hel liste importeres rett inn.
        </p>
        <label>Det du vet om flasken (valgfritt)
          <textarea id="ai-notater-felt" rows="2" placeholder="f.eks. rødvin, italiensk, kjøpt på ferie"></textarea>
        </label>
        <p class="hjelpetekst">💡 Legg gjerne på årgangen her — verken bildet eller strekkoden fanger nødvendigvis opp den.</p>
        <div class="knapperad">
          <button type="button" class="knapp knapp-primaer" id="kopier-mal-knapp">Kopier kode og åpne Claude</button>
          <button type="button" class="knapp" id="kopier-bilde-knapp" style="${v.bilde ? '' : 'display:none'}">🖼️ Kopier bilde</button>
        </div>
        <p class="hjelpetekst" id="kopier-bilde-notat" style="${v.bilde ? '' : 'display:none'}">Bildet må kopieres separat — Claude sin lim-inn-håndtering plukker bare det ene om bilde og tekst ligger i samme utklipp. Det gir ekstra treffsikkerhet å ta det med.</p>
        <details class="mal-detaljer">
          <summary>Vis malen</summary>
          <pre class="kodeblokk">${escapeHtml(byggRegistrerPrompt(forhandsutfyltEan, '', !!v.bilde))}</pre>
        </details>
        <label class="importlabel">Lim inn JSON-svar fra AI-en
          <textarea id="ai-json-felt" rows="5" placeholder='{"navn": "...", ...}'></textarea>
        </label>
        <div class="knapperad">
          <button type="button" class="knapp knapp-primaer" id="ai-bruk-knapp">Bruk JSON</button>
        </div>
      </section>
      ` : ''}

      <form id="vinskjema" class="skjema">
        <input type="hidden" name="kategori" id="kategori-felt" value="${vKategori}">

        <label>Navn *<input required name="navn" value="${escapeHtml(v.navn)}"></label>
        <label>Produsent<input name="produsent" value="${escapeHtml(v.produsent)}"></label>
        <div class="to-kolonner">
          <label>Årgang (blank = NV)<input name="argang" inputmode="numeric" value="${escapeHtml(v.argang)}"></label>
          <label>Type
            <select name="type">${TYPER[vKategori].map((t) => `<option ${v.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
          </label>
        </div>
        <div class="to-kolonner">
          <label>Land<input name="land" value="${escapeHtml(v.land)}"></label>
          <label>Region<input name="region" value="${escapeHtml(v.region)}"></label>
        </div>
        <label>Druer<input name="druer" placeholder="f.eks. Pinot Noir, Syrah" value="${escapeHtml(v.druer)}"></label>

        <div class="to-kolonner">
          <label>Antall flasker<input type="number" min="0" name="antallFlasker" value="${escapeHtml(v.antallFlasker)}"></label>
          <label>Volum (cl)<input type="number" min="0" name="volumCl" value="${escapeHtml(v.volumCl)}"></label>
        </div>
        <label id="fyllniva-rad-skjema" style="${vKategori === 'Brennevin' ? '' : 'display:none'}">Fyllnivå — hvor mye er igjen i flasken som er i bruk
          <div class="fyllniva-rad">
            <input type="range" min="0" max="100" step="5" name="fyllniva" id="fyllniva-input" value="${hentFyllniva(v)}">
            <span class="fyllniva-tall" id="fyllniva-input-tall">${hentFyllniva(v)}%</span>
          </div>
        </label>
        <div class="to-kolonner">
          <label>Pris per flaske (kr)<input type="number" min="0" name="innkjopspris" value="${escapeHtml(v.innkjopspris)}"></label>
          <label>Innkjøpsdato<input type="date" name="innkjopsdato" value="${escapeHtml(v.innkjopsdato)}"></label>
        </div>
        <div class="to-kolonner">
          <label>Kjøpt hos<input name="kjoptHos" value="${escapeHtml(v.kjoptHos)}"></label>
          <label>Strekkode (EAN)<input name="ean" inputmode="numeric" value="${escapeHtml(v.ean)}"></label>
        </div>

        <h2 class="skjema-seksjon">🌡️ Lagring &amp; servering</h2>
        <label>Lagringssted<input name="lagringssted" placeholder="f.eks. Reol A, hylle 3" value="${escapeHtml(v.lagringssted)}"></label>
        <div class="to-kolonner">
          <label>Lagringstemperatur<input name="lagringstemperatur" id="temp-felt" placeholder="${forslagStart.temp || ''}" value="${escapeHtml(v.lagringstemperatur)}"></label>
          <label>Fuktighet<input name="lagringsfuktighet" id="fukt-felt" placeholder="${forslagStart.fuktighet || ''}" value="${escapeHtml(v.lagringsfuktighet)}"></label>
        </div>
        <label>Serveringstemperatur<input name="serveringstemperatur" id="serve-felt" placeholder="${forslagStart.servering || ''}" value="${escapeHtml(v.serveringstemperatur)}"></label>
        <div class="to-kolonner">
          <label>Drikkeklar fra (år)<input type="number" name="drikkeklarFra" value="${escapeHtml(v.drikkeklarFra)}"></label>
          <label>Siste år<input type="number" name="drikkeklarTil" value="${escapeHtml(v.drikkeklarTil)}"></label>
        </div>

        <h2 class="skjema-seksjon">🍽️ Passer til</h2>
        <div class="checkbox-grid">
          ${MATPAR_KATEGORIER.map((m) => `
            <label class="checkbox-label">
              <input type="checkbox" name="matpar" value="${m}" ${(v.matparKategorier || []).includes(m) ? 'checked' : ''}>
              ${m}
            </label>
          `).join('')}
        </div>
        <label>Egne notater om matpar<textarea name="matparNotater">${escapeHtml(v.matparNotater)}</textarea></label>

        <h2 class="skjema-seksjon">📝 Smaksnotater</h2>
        <label>Vurdering
          <select name="vurdering">
            <option value="">–</option>
            ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${String(v.vurdering) === String(n) ? 'selected' : ''}>${'★'.repeat(n)}</option>`).join('')}
          </select>
        </label>
        <label>Notater<textarea name="smaksnotater">${escapeHtml(v.smaksnotater)}</textarea></label>

        <div class="knapperad">
          <button type="submit" class="knapp knapp-primaer">Lagre</button>
          <a class="knapp" href="${eksisterende ? '#/vin/' + v.id : (vKategori === 'Brennevin' ? '#/brennevin' : '#/viner')}">Avbryt</a>
        </div>
      </form>
    </div>
  `));

  const skjema = document.getElementById('vinskjema');
  const bildeInput = document.getElementById('bilde-input');
  const bildeForhandsvisning = document.getElementById('bilde-forhandsvisning');
  let bildeData = v.bilde || '';
  let aiEkstraFelt = { aiToppAr: v.aiToppAr || '', aiBegrunnelse: v.aiBegrunnelse || '', aiKonfidens: v.aiKonfidens || '', drikkeklarKilde: v.drikkeklarKilde || '' };

  bildeInput.addEventListener('change', async () => {
    if (bildeInput.files[0]) {
      bildeData = await komprimerBilde(bildeInput.files[0]);
      bildeForhandsvisning.src = bildeData;
      bildeForhandsvisning.style.display = '';
      const kopierBildeKnapp = document.getElementById('kopier-bilde-knapp');
      const kopierBildeNotat = document.getElementById('kopier-bilde-notat');
      if (kopierBildeKnapp) kopierBildeKnapp.style.display = '';
      if (kopierBildeNotat) kopierBildeNotat.style.display = '';
    }
  });

  document.getElementById('knapp-kat-vin').addEventListener('click', () => byttKategoriISkjema(skjema, 'Vin'));
  document.getElementById('knapp-kat-brennevin').addEventListener('click', () => byttKategoriISkjema(skjema, 'Brennevin'));

  skjema.querySelector('select[name="type"]').addEventListener('change', (e) => {
    const kategoriNa = document.getElementById('kategori-felt').value;
    oppdaterLagringsplaceholder(kategoriNa, e.target.value);
  });

  document.getElementById('fyllniva-input').addEventListener('input', (e) => {
    document.getElementById('fyllniva-input-tall').textContent = `${e.target.value}%`;
  });

  // Claude sin lim-inn-håndtering ser ut til å prioritere bildet og droppe teksten når
  // begge ligger i samme utklipp — derfor er «kopier kode/tekst» og «kopier bilde» to
  // separate knapper/kopieringer i stedet for ett kombinert clipboard.write()-kall.
  const feiletKopiering = () => {
    document.querySelector('.mal-detaljer').open = true;
    alert('Fikk ikke tilgang til utklippstavlen. Malen er vist under — merk og kopier den manuelt, og lim den inn i Claude (eller en annen AI-chat).');
  };

  const kopierMalKnapp = document.getElementById('kopier-mal-knapp');
  if (kopierMalKnapp) {
    kopierMalKnapp.addEventListener('click', () => {
      // window.open MÅ kalles synkront i selve klikk-handleren, før noen await — ellers
      // regnes det ikke lenger som utløst av et brukertrykk, og nettleseren blokkerer
      // den som en uønsket popup.
      window.open('https://claude.ai/new', '_blank', 'noopener');

      const notater = (document.getElementById('ai-notater-felt')?.value || '').trim();
      const promptTekst = byggRegistrerPrompt(forhandsutfyltEan, notater, !!bildeData);

      navigator.clipboard.writeText(promptTekst)
        .then(() => alert(`Koden og forespørselen er kopiert, og Claude åpnes i en ny fane — lim inn der.${bildeData ? ' Trykk deretter «Kopier bilde» og lim inn bildet i samme melding.' : ''}`))
        .catch(feiletKopiering);
    });
  }

  const kopierBildeKnapp = document.getElementById('kopier-bilde-knapp');
  if (kopierBildeKnapp) {
    kopierBildeKnapp.addEventListener('click', () => {
      if (!bildeData) return;
      jpegDataUrlTilPngBlob(bildeData)
        .then((pngBlob) => navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]))
        .then(() => alert('Bildet er kopiert — lim det inn i samme melding som teksten i Claude.'))
        .catch(feiletKopiering);
    });
  }

  const aiBrukKnapp = document.getElementById('ai-bruk-knapp');
  if (aiBrukKnapp) {
    aiBrukKnapp.addEventListener('click', async () => {
      const felt = document.getElementById('ai-json-felt');
      const tekst = felt.value.trim();
      if (!tekst) { alert('Lim inn JSON-teksten fra AI-en først.'); return; }

      let data;
      try {
        data = parseAiJson(tekst);
      } catch {
        alert('Dette er ikke gyldig JSON. Sjekk at du limte inn hele svaret fra AI-en, uten ekstra tekst rundt.');
        return;
      }
      const liste = Array.isArray(data) ? data : [data];

      if (liste.length === 1) {
        const vinData = normaliserImportertVin(liste[0]);
        if (!vinData) { alert('Fant ingen gyldig post i JSON-en (mangler «navn»-felt?).'); return; }
        fyllSkjemaFraVin(skjema, vinData);
        aiEkstraFelt = { aiToppAr: vinData.aiToppAr, aiBegrunnelse: vinData.aiBegrunnelse, aiKonfidens: vinData.aiKonfidens, drikkeklarKilde: vinData.drikkeklarKilde };
        felt.value = '';
      } else {
        try {
          const { antall, hoppetOver } = await importerFraJsonTekst(tekst);
          alert(`Importerte ${antall} post(er) direkte.${hoppetOver ? ` Hoppet over ${hoppetOver} som manglet navn.` : ''}`);
          location.hash = '#/viner';
        } catch (err) {
          alert('Kunne ikke importere: ' + err.message);
        }
      }
    });
  }

  skjema.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(skjema);
    const matparKategorier = fd.getAll('matpar');
    const kategoriValgt = fd.get('kategori') || 'Vin';
    const nyVin = {
      ...v,
      kategori: kategoriValgt,
      navn: fd.get('navn').trim(),
      produsent: fd.get('produsent').trim(),
      argang: fd.get('argang').trim(),
      type: fd.get('type'),
      land: fd.get('land').trim(),
      region: fd.get('region').trim(),
      druer: fd.get('druer').trim(),
      antallFlasker: Number(fd.get('antallFlasker')) || 0,
      volumCl: Number(fd.get('volumCl')) || 0,
      fyllniva: kategoriValgt === 'Brennevin' ? Number(fd.get('fyllniva')) : '',
      innkjopspris: fd.get('innkjopspris') ? Number(fd.get('innkjopspris')) : '',
      innkjopsdato: fd.get('innkjopsdato'),
      kjoptHos: fd.get('kjoptHos').trim(),
      ean: fd.get('ean').trim(),
      lagringssted: fd.get('lagringssted').trim(),
      lagringstemperatur: fd.get('lagringstemperatur').trim(),
      lagringsfuktighet: fd.get('lagringsfuktighet').trim(),
      serveringstemperatur: fd.get('serveringstemperatur').trim(),
      drikkeklarFra: fd.get('drikkeklarFra') ? Number(fd.get('drikkeklarFra')) : '',
      drikkeklarTil: fd.get('drikkeklarTil') ? Number(fd.get('drikkeklarTil')) : '',
      matparKategorier,
      matparNotater: fd.get('matparNotater').trim(),
      smaksnotater: fd.get('smaksnotater').trim(),
      vurdering: fd.get('vurdering') ? Number(fd.get('vurdering')) : '',
      bilde: bildeData,
      ...aiEkstraFelt,
    };
    if (eksisterende) nyVin.id = eksisterende.id;
    const id2 = await VinDB.lagre(aktivKjeller.id, nyVin);

    if (nyVin.ean) {
      const produktFakta = {
        kategori: nyVin.kategori, navn: nyVin.navn, produsent: nyVin.produsent, argang: nyVin.argang,
        type: nyVin.type, land: nyVin.land, region: nyVin.region, druer: nyVin.druer,
        lagringstemperatur: nyVin.lagringstemperatur, lagringsfuktighet: nyVin.lagringsfuktighet,
        serveringstemperatur: nyVin.serveringstemperatur, drikkeklarFra: nyVin.drikkeklarFra, drikkeklarTil: nyVin.drikkeklarTil,
        matparKategorier: nyVin.matparKategorier, matparNotater: nyVin.matparNotater,
        aiToppAr: nyVin.aiToppAr, aiBegrunnelse: nyVin.aiBegrunnelse, aiKonfidens: nyVin.aiKonfidens, drikkeklarKilde: nyVin.drikkeklarKilde,
      };
      ProduktDB.lagre(nyVin.ean, produktFakta).catch((err) => console.error('[vinkjeller] Kunne ikke oppdatere delt strekkode-cache:', err));
    }

    location.hash = `#/vin/${eksisterende ? eksisterende.id : id2}`;
  });
}

// ---------- Visning: Innstillinger ----------

function visInnstillinger() {
  const erEier = aktivKjeller.eierUid === bruker.uid;
  const appUrl = location.origin + location.pathname.replace(/index\.html$/, '');
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <h1>Innstillinger</h1>

      <section class="detaljseksjon">
        <h2>👥 Kjeller: ${escapeHtml(aktivKjeller.navn)}</h2>
        <p class="hjelpetekst">${(aktivKjeller.medlemmer || []).length} medlem(mer). Del lenken og koden under for å invitere flere.</p>

        <label class="importlabel" style="margin-top:2px;">App-lenke</label>
        <div class="knapperad">
          <span class="field invite-lenke">${escapeHtml(appUrl)}</span>
          <button class="knapp" id="kopier-lenke-knapp">Kopier lenke</button>
        </div>

        <label class="importlabel">Invitasjonskode</label>
        <div class="knapperad">
          <span class="field invite-kode">${escapeHtml(aktivKjeller.inviteKode)}</span>
          <button class="knapp" id="kopier-kode-knapp">Kopier kode</button>
        </div>

        <div class="knapperad">
          <button class="knapp knapp-primaer" id="del-invitasjon-knapp">📤 Del invitasjon</button>
        </div>

        <p class="hjelpetekst">
          Slik blir noen med: de åpner lenken → trykker «Logg inn med Google» →
          velger «Bli med i en kjeller» → limer inn koden.
        </p>

        ${erEier ? `<div class="knapperad"><button class="knapp" id="ny-kode-knapp">Lag ny kode</button></div>` : ''}

        ${mineKjellere.length > 1 ? `
        <p class="hjelpetekst" style="margin-top:14px;">Bytt kjeller:</p>
        <div class="knapperad">
          ${mineKjellere.map((k) => `<button class="knapp ${k.id === aktivKjeller.id ? 'knapp-primaer' : ''}" data-bytt-kjeller="${k.id}">${escapeHtml(k.navn)}</button>`).join('')}
        </div>` : ''}

        <div class="knapperad" style="margin-top:14px;">
          <button class="knapp" id="ny-kjeller-knapp">+ Opprett ny kjeller</button>
          <button class="knapp" id="bli-med-knapp-innst">Bli med via kode</button>
        </div>

        ${!erEier ? `<div class="knapperad"><button class="knapp knapp-fare" id="forlat-kjeller-knapp">Forlat denne kjelleren</button></div>` : ''}
      </section>

      <section class="detaljseksjon">
        <h2>Sikkerhetskopi</h2>
        <p class="hjelpetekst">Eksporter jevnlig som en ekstra trygghet, i tillegg til at data ligger delt i skyen.</p>
        <div class="knapperad">
          <button class="knapp knapp-primaer" id="eksporter-knapp">Eksporter til fil</button>
        </div>
        <label class="importlabel">Importer fra fil (du kan velge flere samtidig)
          <input type="file" accept="application/json" id="importer-input" multiple>
        </label>
      </section>

      ${bruker.uid === ADMIN_UID ? `
      <section class="detaljseksjon">
        <h2>👤 Godkjenninger</h2>
        <p class="hjelpetekst">${ventendeBrukere.length
          ? `${ventendeBrukere.length} ny(e) bruker(e) venter på godkjenning.`
          : 'Ingen ventende forespørsler akkurat nå.'}</p>
        <div class="knapperad">
          <a class="knapp knapp-primaer" href="#/godkjenninger">Se godkjenninger</a>
        </div>
      </section>` : ''}

      <section class="detaljseksjon">
        <h2>Konto</h2>
        <p class="hjelpetekst">Innlogget som ${escapeHtml(bruker.displayName || bruker.email)}</p>
        <div class="knapperad">
          <button class="knapp" id="logg-ut-knapp">Logg ut</button>
        </div>
      </section>

      <section class="detaljseksjon">
        <h2>Faresone</h2>
        <div class="knapperad">
          <button class="knapp knapp-fare" id="slett-alt-knapp">Slett alle data i denne kjelleren</button>
        </div>
      </section>
      <section class="detaljseksjon">
        <p class="hjelpetekst">Vinkjelleren — delt via Firebase, synlig for medlemmene av kjelleren din.</p>
      </section>
    </div>
  `));

  document.getElementById('kopier-lenke-knapp').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      alert('Lenken er kopiert!');
    } catch {
      alert(`Kunne ikke kopiere automatisk. Lenken er: ${appUrl}`);
    }
  });

  document.getElementById('kopier-kode-knapp').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(aktivKjeller.inviteKode);
      alert('Koden er kopiert! Del den med de du vil invitere.');
    } catch {
      alert(`Kunne ikke kopiere automatisk. Koden er: ${aktivKjeller.inviteKode}`);
    }
  });

  document.getElementById('del-invitasjon-knapp').addEventListener('click', async () => {
    const delTekst = `Bli med i vinkjelleren «${aktivKjeller.navn}»!\n1. Åpne lenken\n2. Logg inn med Google\n3. Velg «Bli med i en kjeller» og lim inn koden: ${aktivKjeller.inviteKode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Invitasjon til Vinkjelleren', text: delTekst, url: appUrl });
      } catch {
        // Brukeren avbrøt delingen — ikke noe å varsle om.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${delTekst}\n${appUrl}`);
      alert('Denne telefonen/nettleseren støtter ikke direkte deling, så invitasjonsteksten er kopiert i stedet — lim den inn der du vil sende den.');
    } catch {
      alert(`${delTekst}\n${appUrl}`);
    }
  });

  const nyKodeKnapp = document.getElementById('ny-kode-knapp');
  if (nyKodeKnapp) {
    nyKodeKnapp.addEventListener('click', async () => {
      if (!confirm('Lage ny kode? Den gamle koden slutter å virke.')) return;
      const kode = await KjellerDB.nyInviteKode(aktivKjeller.id, aktivKjeller.inviteKode);
      aktivKjeller.inviteKode = kode;
      visInnstillinger();
    });
  }

  document.querySelectorAll('[data-bytt-kjeller]').forEach((knapp) => {
    knapp.addEventListener('click', () => byttAktivKjeller(knapp.dataset.byttKjeller));
  });

  document.getElementById('ny-kjeller-knapp').addEventListener('click', async () => {
    const navn = prompt('Navn på den nye kjelleren:');
    if (navn === null) return;
    const ny = await KjellerDB.opprett(navn);
    mineKjellere.push(ny);
    byttAktivKjeller(ny.id);
  });

  document.getElementById('bli-med-knapp-innst').addEventListener('click', async () => {
    const kode = prompt('Invitasjonskode:');
    if (!kode) return;
    try {
      const kjeller = await KjellerDB.bliMedViaKode(kode);
      if (!mineKjellere.find((k) => k.id === kjeller.id)) mineKjellere.push(kjeller);
      byttAktivKjeller(kjeller.id);
    } catch (err) {
      alert(err.message);
    }
  });

  const forlatKnapp = document.getElementById('forlat-kjeller-knapp');
  if (forlatKnapp) {
    forlatKnapp.addEventListener('click', async () => {
      if (!confirm(`Forlate «${aktivKjeller.navn}»? Du mister tilgang til denne kjellerens data.`)) return;
      const forlattId = aktivKjeller.id;
      await KjellerDB.forlat(forlattId);
      mineKjellere = mineKjellere.filter((k) => k.id !== forlattId);
      if (mineKjellere.length) {
        byttAktivKjeller(mineKjellere[0].id);
      } else {
        aktivKjeller = null;
        visBunnav(false);
        visKjellerOnboarding();
      }
    });
  }

  document.getElementById('eksporter-knapp').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(alleViner, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${aktivKjeller.navn}-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  });

  document.getElementById('importer-input').addEventListener('change', async (e) => {
    const filer = Array.from(e.target.files || []);
    if (!filer.length) return;

    let totalAntall = 0;
    let totalHoppetOver = 0;
    const feilFiler = [];

    for (const file of filer) {
      try {
        const tekst = await file.text();
        const { antall, hoppetOver } = await importerFraJsonTekst(tekst);
        totalAntall += antall;
        totalHoppetOver += hoppetOver;
      } catch (err) {
        feilFiler.push(`${file.name}: ${err.message}`);
      }
    }

    let melding = `Importerte ${totalAntall} post(er) fra ${filer.length} fil(er).`;
    if (totalHoppetOver) melding += ` Hoppet over ${totalHoppetOver} som manglet navn.`;
    if (feilFiler.length) melding += `\n\nFeil i ${feilFiler.length} fil(er):\n${feilFiler.join('\n')}`;
    alert(melding);
    if (totalAntall) location.hash = '#/viner';
  });

  document.getElementById('logg-ut-knapp').addEventListener('click', () => loggUt());

  document.getElementById('slett-alt-knapp').addEventListener('click', async () => {
    if (confirm(`Sikker på at du vil slette ALT (vin og brennevin) i «${aktivKjeller.navn}»? Dette kan ikke angres, og påvirker alle medlemmer.`)) {
      await VinDB.slettAlt(aktivKjeller.id);
      location.hash = '#/';
    }
  });
}

// ---------- Visning: Godkjenninger (kun ADMIN_UID) ----------

function visGodkjenninger() {
  if (bruker.uid !== ADMIN_UID) { location.hash = '#/'; return; }
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <h1>Godkjenninger</h1>
      ${!ventendeBrukere.length
        ? '<p class="tom">Ingen ventende forespørsler akkurat nå.</p>'
        : `<ul class="godkjenning-liste">${ventendeBrukere.map((b) => `
            <li class="godkjenning-rad">
              ${b.foto ? `<img class="godkjenning-foto" src="${escapeHtml(b.foto)}" alt="">` : '<span class="godkjenning-foto godkjenning-foto-tom">👤</span>'}
              <div class="godkjenning-info">
                <strong>${escapeHtml(b.navn || 'Ukjent')}</strong><br>
                <span class="hjelpetekst">${escapeHtml(b.epost || '')}</span>
              </div>
              <div class="knapperad">
                <button class="knapp knapp-primaer godkjenn-knapp" data-uid="${escapeHtml(b.id)}">Godkjenn</button>
                <button class="knapp knapp-fare avvis-knapp" data-uid="${escapeHtml(b.id)}">Avvis</button>
              </div>
            </li>
          `).join('')}</ul>`}
      <div class="knapperad" style="margin-top:14px;"><a class="knapp" href="#/innstillinger">Tilbake</a></div>
    </div>
  `));

  app.querySelectorAll('.godkjenn-knapp').forEach((knapp) => {
    knapp.addEventListener('click', async () => {
      knapp.disabled = true;
      try { await BrukerDB.godkjenn(knapp.dataset.uid); }
      catch (err) { alert(err.message); knapp.disabled = false; }
    });
  });
  app.querySelectorAll('.avvis-knapp').forEach((knapp) => {
    knapp.addEventListener('click', async () => {
      knapp.disabled = true;
      try { await BrukerDB.avvis(knapp.dataset.uid); }
      catch (err) { alert(err.message); knapp.disabled = false; }
    });
  });
}

// ---------- Init ----------

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
