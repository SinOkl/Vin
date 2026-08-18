import { VinDB } from './db.js';

// ---------- Konstanter ----------

const KATEGORIER = ['Vin', 'Brennevin'];

const TYPER = {
  'Vin': ['Rødvin', 'Hvitvin', 'Rosévin', 'Musserende', 'Dessertvin/Portvin', 'Annet'],
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

const dataArsnr = () => new Date().getFullYear();

const AI_PROMPT_MAL = `Du er ekspert på vin og brennevin. Jeg skal registrere en flaske i katalogen min. Se på bildet/beskrivelsen jeg gir deg, og bruk nettsøk (hvis du har mulighet til det) til å slå opp produsenten/produktet og bekrefte fakta som druesammensetning, region, typisk drikkevindu og smaksprofil — ikke bare gjett ut fra det som står på etiketten. Svar deretter KUN med gyldig JSON (ingen forklaringstekst, ingen kodeblokk-merking rundt) i nøyaktig dette formatet:

{
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
- Hvis kategori er "Vin": "type" må være én av: Rødvin, Hvitvin, Rosévin, Musserende, Dessertvin/Portvin, Annet.
- Hvis kategori er "Brennevin": "type" må være én av: Whisky, Vodka, Gin, Rom, Cognac/Brandy, Akevitt, Tequila, Likør, Annet.
- "matparKategorier" må kun inneholde verdier fra listen over, som en JSON-liste.
- "lagringstemperatur" er hvor kaldt flasken bør oppbevares over tid, "serveringstemperatur" er hvor kald den bør være når den drikkes — disse er ofte ulike, ikke forveksle dem.
- "innkjopspris" er prisen PER FLASKE i kroner. Den står ikke på etiketten, så sett den kun hvis jeg oppgir den selv i meldingen — ikke gjett eller anslå en pris.
- Bruk nettsøk til å dobbeltsjekke fakta om produktet (druer, region, drikkevindu, smaksprofil) fremfor å basere deg kun på synlig tekst på etiketten — det gir mer presise svar.
- Har du ikke tilgang til nettsøk: gjør så godt du kan ut fra bildet/beskrivelsen og din egen kunnskap, og skriv "" på felt du er usikker på — ikke gjett blindt.
- drikkeklarFra/drikkeklarTil er årstall (f.eks. 2026); for brennevin kan disse ofte stå tomme siden det sjelden er en «drikk innen»-frist.
- Skal du registrere flere flasker samtidig: svar med en JSON-liste av slike objekter i stedet for ett enkelt objekt.

Her er flasken: [lim inn bilde av etiketten, eller beskriv den (navn, produsent, årgang) her]`;

// ---------- Hjelpefunksjoner ----------

function formatKr(n) {
  if (n === undefined || n === null || n === '') return '';
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(n);
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

function komprimerBilde(file, maxDim = 900, kvalitet = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
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
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
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
    lagringssted: tekstEllerTom(raw.lagringssted),
    lagringstemperatur: tekstEllerTom(raw.lagringstemperatur),
    lagringsfuktighet: tekstEllerTom(raw.lagringsfuktighet),
    serveringstemperatur: tekstEllerTom(raw.serveringstemperatur),
    drikkeklarFra: tallEllerTom(raw.drikkeklarFra),
    drikkeklarTil: tallEllerTom(raw.drikkeklarTil),
    matparKategorier: matpar,
    matparNotater: tekstEllerTom(raw.matparNotater),
    smaksnotater: tekstEllerTom(raw.smaksnotater),
    vurdering,
    bilde: '',
    drukketDato: '',
  };
}

// Tar imot rå JSON-tekst (ett objekt eller en liste), validerer og lagrer gyldige poster.
async function importerFraJsonTekst(tekst) {
  let data;
  try {
    data = JSON.parse(tekst);
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
  const antall = await VinDB.importer(gyldige);
  return { antall, hoppetOver };
}

// ---------- App-state ----------

let alleViner = [];
const app = document.getElementById('app');

async function lastViner() {
  alleViner = await VinDB.alle();
  alleViner.sort((a, b) => (a.navn || '').localeCompare(b.navn || '', 'nb'));
}

// ---------- Routing ----------

async function rute() {
  await lastViner();
  const hash = location.hash || '#/';
  const [, path, param] = hash.match(/^#\/?([^/]*)\/?([^/]*)$/) || [];

  document.querySelectorAll('.navlink').forEach((a) => a.classList.remove('aktiv'));

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
    const post = alleViner.find((x) => x.id === Number(param));
    settAktivNav(post && post.kategori === 'Brennevin' ? '#/brennevin' : '#/viner');
    visSkjema(Number(param));
  } else if (path === 'vin' && param) {
    const post = alleViner.find((x) => x.id === Number(param));
    settAktivNav(post && post.kategori === 'Brennevin' ? '#/brennevin' : '#/viner');
    visDetalj(Number(param));
  } else if (path === 'innstillinger') {
    settAktivNav('#/innstillinger');
    visInnstillinger();
  } else {
    visOversikt();
  }
}

function settAktivNav(href) {
  const a = document.querySelector(`.navlink[href="${href}"]`);
  if (a) a.classList.add('aktiv');
}

window.addEventListener('hashchange', rute);

// ---------- Visning: Oversikt ----------

function visOversikt() {
  const iKjelleren = alleViner.filter((v) => !v.drukketDato);
  const drukket = alleViner.filter((v) => v.drukketDato);
  const vinIKjelleren = iKjelleren.filter((v) => (v.kategori || 'Vin') === 'Vin');
  const brennevinIKjelleren = iKjelleren.filter((v) => v.kategori === 'Brennevin');

  const totalFlasker = iKjelleren.reduce((s, v) => s + (Number(v.antallFlasker) || 0), 0);
  const totalVerdi = iKjelleren.reduce((s, v) => s + (Number(v.antallFlasker) || 0) * (Number(v.innkjopspris) || 0), 0);
  const unikeProdukter = iKjelleren.length;

  const klarNa = iKjelleren.filter((v) => drikkestatus(v).klasse === 'status-klar' || drikkestatus(v).klasse === 'status-snart');
  const hastesak = iKjelleren.filter((v) => drikkestatus(v).klasse === 'status-hastesak');
  const snart = iKjelleren.filter((v) => drikkestatus(v).klasse === 'status-snart');

  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <h1>🍷 Vinkjelleren</h1>
      <div class="statgrid">
        <div class="statkort"><span class="stattall">${unikeProdukter}</span><span class="statlabel">produkter</span></div>
        <div class="statkort"><span class="stattall">${totalFlasker}</span><span class="statlabel">flasker</span></div>
        <div class="statkort"><span class="stattall">${formatKr(totalVerdi) || '–'}</span><span class="statlabel">est. verdi</span></div>
      </div>
      ${unikeProdukter ? `<p class="hjelpetekst">🍷 ${vinIKjelleren.length} vin(er) · 🥃 ${brennevinIKjelleren.length} brennevin</p>` : ''}

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
        <h2>✅ Klare til drikking (${klarNa.length})</h2>
        ${klarNa.length ? listeKompakt(klarNa.slice(0, 8)) : '<p class="tom">Ingen produkter er markert som klare akkurat nå.</p>'}
      </section>

      ${unikeProdukter === 0 ? `<p class="tom">Kjelleren er tom. Trykk «Legg til» for å registrere din første vin eller flaske brennevin.</p>` : ''}

      ${drukket.length ? `<p class="hjelpetekst"><a href="#/viner">🍾 ${drukket.length} i drikkehistorikken →</a></p>` : ''}
    </div>
  `));
}

function listeKompakt(viner) {
  return `<ul class="kompaktliste">${viner.map((v) => `
    <li><a href="#/vin/${v.id}">
      <span class="kl-navn">${escapeHtml(v.navn)}${v.argang ? ' ' + escapeHtml(v.argang) : ''}</span>
      <span class="kl-info">${escapeHtml(v.type || '')} · ${v.antallFlasker || 0} stk</span>
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

  app.innerHTML = '';
  const wrap = el(`
    <div class="side">
      <h1>${erBrennevin ? '🥃 Brennevin' : '🍷 Viner'}</h1>
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
        <a class="knapp knapp-primaer" href="#/ny${erBrennevin ? '/brennevin' : ''}">+ Legg til ${erBrennevin ? 'brennevin' : 'vin'}</a>
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
  const ikon = v.kategori === 'Brennevin' ? '🥃' : '🍷';
  const badge = v.drukketDato
    ? `<span class="status-badge status-drukket">Drukket ${escapeHtml(v.drukketDato)}</span>`
    : `<span class="status-badge ${status.klasse}">${status.label}</span>`;
  return `
    <a class="vinkort ${v.drukketDato ? 'drukket' : ''}" href="#/vin/${v.id}">
      <div class="vinkort-bilde">${v.bilde ? `<img src="${v.bilde}" alt="">` : ikon}</div>
      <div class="vinkort-info">
        <div class="vinkort-navn">${escapeHtml(v.navn)}${v.argang ? ` <span class="argang">${escapeHtml(v.argang)}</span>` : ''}</div>
        <div class="vinkort-detalj">${escapeHtml(v.produsent || '')}${v.type ? ' · ' + escapeHtml(v.type) : ''}</div>
        <div class="vinkort-detalj">${v.antallFlasker || 0} flaske(r)${v.land ? ' · ' + escapeHtml(v.land) : ''}</div>
        ${badge}
      </div>
    </a>
  `;
}

// ---------- Visning: Detalj ----------

async function visDetalj(id) {
  const v = alleViner.find((x) => x.id === id) || await VinDB.hent(id);
  if (!v) { location.hash = '#/viner'; return; }
  const kategori = v.kategori || 'Vin';
  const erBrennevin = kategori === 'Brennevin';
  const status = drikkestatus(v);
  const forslag = hentForslag(kategori, v.type);
  const verdiTotal = (Number(v.antallFlasker) || 0) * (Number(v.innkjopspris) || 0);
  const tilbakeHref = erBrennevin ? '#/brennevin' : '#/viner';
  const ikon = erBrennevin ? '🥃' : '🍷';

  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <a href="${tilbakeHref}" class="tilbake">← Tilbake til ${erBrennevin ? 'brennevin' : 'viner'}</a>
      ${v.bilde ? `<img class="detaljbilde" src="${v.bilde}" alt="">` : ''}
      <h1>${ikon} ${escapeHtml(v.navn)}${v.argang ? ` <span class="argang">${escapeHtml(v.argang)}</span>` : ''}</h1>
      ${v.drukketDato
        ? `<span class="status-badge status-drukket">🍾 Drukket ${escapeHtml(v.drukketDato)}</span>`
        : `<span class="status-badge ${status.klasse}">${status.label}</span>`}

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
          ${dRad('Verdi totalt', verdiTotal ? `${formatKr(verdiTotal)}  (${v.antallFlasker} × ${formatKr(v.innkjopspris)})` : '')}
          ${dRad('Kjøpt hos', v.kjoptHos)}
          ${dRad('Innkjøpsdato', v.innkjopsdato)}
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
        ${v.drukketDato
          ? `<button class="knapp" id="angre-drukket-knapp">Legg tilbake i kjelleren</button>`
          : `<button class="knapp knapp-gull" id="drukket-knapp">🍾 Merk som drukket</button>`}
        <button class="knapp knapp-fare" id="slett-knapp">Slett</button>
      </div>
    </div>
  `));

  const drukketKnapp = document.getElementById('drukket-knapp');
  if (drukketKnapp) {
    drukketKnapp.addEventListener('click', async () => {
      const idagIso = new Date().toISOString().slice(0, 10);
      await VinDB.lagre({ ...v, drukketDato: idagIso });
      location.hash = '#/vin/' + v.id;
      rute();
    });
  }

  const angreDrukketKnapp = document.getElementById('angre-drukket-knapp');
  if (angreDrukketKnapp) {
    angreDrukketKnapp.addEventListener('click', async () => {
      await VinDB.lagre({ ...v, drukketDato: '' });
      location.hash = '#/vin/' + v.id;
      rute();
    });
  }

  document.getElementById('slett-knapp').addEventListener('click', async () => {
    if (confirm(`Slette «${v.navn}» fra kjelleren?`)) {
      await VinDB.slett(v.id);
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

// ---------- Visning: Skjema (legg til / rediger) ----------

async function visSkjema(id, forhandsvalgtKategori) {
  const eksisterende = id ? (alleViner.find((x) => x.id === id) || await VinDB.hent(id)) : null;
  const kategoriStart = eksisterende ? (eksisterende.kategori || 'Vin') : (forhandsvalgtKategori === 'Brennevin' ? 'Brennevin' : 'Vin');
  const v = eksisterende || {
    kategori: kategoriStart,
    navn: '', produsent: '', argang: '', type: TYPER[kategoriStart][0], land: '', region: '', druer: '',
    antallFlasker: 1, volumCl: 75, innkjopspris: '', innkjopsdato: '', kjoptHos: '',
    lagringssted: '', lagringstemperatur: '', lagringsfuktighet: '', serveringstemperatur: '',
    drikkeklarFra: '', drikkeklarTil: '', matparKategorier: [], matparNotater: '',
    smaksnotater: '', vurdering: '', bilde: '', drukketDato: '',
  };
  const vKategori = v.kategori || 'Vin';
  const ordKategori = vKategori === 'Brennevin' ? 'brennevin' : 'vin';
  const forslagStart = hentForslag(vKategori, v.type);

  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <h1>${eksisterende ? `Rediger ${ordKategori}` : `Legg til ${ordKategori}`}</h1>

      <div class="visning-bytter">
        <button type="button" class="visning-knapp ${vKategori === 'Vin' ? 'aktiv' : ''}" id="knapp-kat-vin">🍷 Vin</button>
        <button type="button" class="visning-knapp ${vKategori === 'Brennevin' ? 'aktiv' : ''}" id="knapp-kat-brennevin">🥃 Brennevin</button>
      </div>

      ${!eksisterende ? `
      <section class="detaljseksjon">
        <h2>🤖 Legg til med AI</h2>
        <p class="hjelpetekst">
          Ta et bilde av etiketten og send det til en AI (f.eks. Claude eller ChatGPT)
          sammen med malen under — den funker for både vin og brennevin. Lim JSON-svaret
          inn i feltet — én flaske fyller ut skjemaet under så du kan sjekke det før
          lagring, en hel liste importeres rett inn.
        </p>
        <div class="knapperad">
          <button type="button" class="knapp" id="kopier-mal-knapp">Kopier AI-mal</button>
        </div>
        <details class="mal-detaljer">
          <summary>Vis malen</summary>
          <pre class="kodeblokk">${escapeHtml(AI_PROMPT_MAL)}</pre>
        </details>
        <label class="importlabel">Lim inn JSON-svar fra AI-en
          <textarea id="ai-json-felt" rows="5" placeholder='{"kategori": "Vin", "navn": "...", ...}'></textarea>
        </label>
        <div class="knapperad">
          <button type="button" class="knapp knapp-primaer" id="ai-bruk-knapp">Bruk JSON</button>
        </div>
      </section>
      ` : ''}

      <form id="vinskjema" class="skjema">
        <input type="hidden" name="kategori" id="kategori-felt" value="${vKategori}">

        <label>Bilde av etikett
          <input type="file" accept="image/*" capture="environment" id="bilde-input">
        </label>
        <img id="bilde-forhandsvisning" class="detaljbilde" src="${v.bilde || ''}" style="${v.bilde ? '' : 'display:none'}">

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
        <div class="to-kolonner">
          <label>Pris per flaske (kr)<input type="number" min="0" name="innkjopspris" value="${escapeHtml(v.innkjopspris)}"></label>
          <label>Innkjøpsdato<input type="date" name="innkjopsdato" value="${escapeHtml(v.innkjopsdato)}"></label>
        </div>
        <label>Kjøpt hos<input name="kjoptHos" value="${escapeHtml(v.kjoptHos)}"></label>

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

  bildeInput.addEventListener('change', async () => {
    if (bildeInput.files[0]) {
      bildeData = await komprimerBilde(bildeInput.files[0]);
      bildeForhandsvisning.src = bildeData;
      bildeForhandsvisning.style.display = '';
    }
  });

  document.getElementById('knapp-kat-vin').addEventListener('click', () => byttKategoriISkjema(skjema, 'Vin'));
  document.getElementById('knapp-kat-brennevin').addEventListener('click', () => byttKategoriISkjema(skjema, 'Brennevin'));

  skjema.querySelector('select[name="type"]').addEventListener('change', (e) => {
    const kategoriNa = document.getElementById('kategori-felt').value;
    oppdaterLagringsplaceholder(kategoriNa, e.target.value);
  });

  const kopierMalKnapp = document.getElementById('kopier-mal-knapp');
  if (kopierMalKnapp) {
    kopierMalKnapp.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(AI_PROMPT_MAL);
        alert('Malen er kopiert! Lim den inn i en samtale med en AI, sammen med et bilde av etiketten.');
      } catch {
        document.querySelector('.mal-detaljer').open = true;
        alert('Fikk ikke tilgang til utklippstavlen. Malen er vist under — merk og kopier den manuelt.');
      }
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
        data = JSON.parse(tekst);
      } catch {
        alert('Dette er ikke gyldig JSON. Sjekk at du limte inn hele svaret fra AI-en, uten ekstra tekst rundt.');
        return;
      }
      const liste = Array.isArray(data) ? data : [data];

      if (liste.length === 1) {
        const vinData = normaliserImportertVin(liste[0]);
        if (!vinData) { alert('Fant ingen gyldig post i JSON-en (mangler «navn»-felt?).'); return; }
        fyllSkjemaFraVin(skjema, vinData);
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
    const nyVin = {
      ...v,
      kategori: fd.get('kategori') || 'Vin',
      navn: fd.get('navn').trim(),
      produsent: fd.get('produsent').trim(),
      argang: fd.get('argang').trim(),
      type: fd.get('type'),
      land: fd.get('land').trim(),
      region: fd.get('region').trim(),
      druer: fd.get('druer').trim(),
      antallFlasker: Number(fd.get('antallFlasker')) || 0,
      volumCl: Number(fd.get('volumCl')) || 0,
      innkjopspris: fd.get('innkjopspris') ? Number(fd.get('innkjopspris')) : '',
      innkjopsdato: fd.get('innkjopsdato'),
      kjoptHos: fd.get('kjoptHos').trim(),
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
    };
    if (eksisterende) nyVin.id = eksisterende.id;
    const id2 = await VinDB.lagre(nyVin);
    location.hash = `#/vin/${eksisterende ? eksisterende.id : id2}`;
  });
}

// ---------- Visning: Innstillinger ----------

function visInnstillinger() {
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <h1>Innstillinger</h1>

      <section class="detaljseksjon">
        <h2>Sikkerhetskopi</h2>
        <p class="hjelpetekst">Alle data lagres kun lokalt på denne telefonen/nettleseren. Eksporter jevnlig for å ta vare på dataene dine.</p>
        <div class="knapperad">
          <button class="knapp knapp-primaer" id="eksporter-knapp">Eksporter til fil</button>
        </div>
        <label class="importlabel">Importer fra fil (du kan velge flere samtidig)
          <input type="file" accept="application/json" id="importer-input" multiple>
        </label>
      </section>
      <section class="detaljseksjon">
        <h2>Faresone</h2>
        <div class="knapperad">
          <button class="knapp knapp-fare" id="slett-alt-knapp">Slett alle data</button>
        </div>
      </section>
      <section class="detaljseksjon">
        <p class="hjelpetekst">Vinkjelleren v1.0 — dine data forlater aldri denne enheten.</p>
      </section>
    </div>
  `));

  document.getElementById('eksporter-knapp').addEventListener('click', async () => {
    const data = await VinDB.alle();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vinkjeller-backup-${new Date().toISOString().slice(0, 10)}.json`;
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

  document.getElementById('slett-alt-knapp').addEventListener('click', async () => {
    if (confirm('Sikker på at du vil slette ALLE data (vin og brennevin)? Dette kan ikke angres.')) {
      await VinDB.slettAlt();
      location.hash = '#/';
    }
  });
}

// ---------- Init ----------

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

rute();
