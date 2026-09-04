// ---------- Data: Kjøletid ----------

const KJOLE_MILJOER = {
  'Kjøleskap': { temp: 4, h: 15 },
  'Isvann, uten salt': { temp: 0, h: 100 },
  'Isvann + salt': { temp: -2, h: 250 },
  'Fryser': { temp: -18, h: 18 },
  'Romtemperatur': { temp: 21, h: 10 },
};

const KJOLE_BEHOLDERE = {
  'Standard bordeauxflaske': { r: 0.038, vegg: 0.003, k: 1.0 },
  'Slank flaske (Riesling/Alsace)': { r: 0.035, vegg: 0.003, k: 1.0 },
  'Champagne/musserende': { r: 0.044, vegg: 0.005, k: 1.0 },
  'Halvflaske 375ml': { r: 0.0325, vegg: 0.003, k: 1.0 },
  'Magnum 1,5l': { r: 0.0475, vegg: 0.004, k: 1.0 },
  '1,5L brusflaske': { r: 0.045, vegg: 0.0003, k: 0.2 },
  '0,5L brusflaske': { r: 0.0325, vegg: 0.00025, k: 0.2 },
  'Ølflaske 0,33L': { r: 0.030, vegg: 0.0025, k: 1.0 },
  'Ølboks 0,33L': { r: 0.033, vegg: 0.0001, k: 200 },
  'Ølboks 0,5L': { r: 0.033, vegg: 0.0001, k: 200 },
};

const RHO_C = 4.18e6; // J/(m³K), vann/vin/brus

// ---------- Data: Dekantering ----------

const DEKANTERING_TABELL = {
  'Ung, fyldig rødvin (Cabernet, Syrah, Bordeaux-blend)': { tid: '1–2 timer', notat: 'Grov tanning trenger tid/luft.' },
  'Middels rødvin (Merlot, Chianti, Rioja)': { tid: '30–60 min', notat: 'Åpner aromaer uten å flate ut.' },
  'Lett rødvin (Pinot Noir, Gamay)': { tid: '15–30 min, evt. rett i glass', notat: 'For mye luft kan svekke frukten.' },
  'Moden rødvin (10+ år)': { tid: '15–30 min, forsiktig', notat: 'Primært for sediment, ikke over-lufting.' },
  'Vintage Port': { tid: '2–3 timer', notat: 'Tungt sediment, hell forsiktig.' },
  'Fyldig hvitvin (moden Chardonnay)': { tid: '10–15 min', notat: 'Kan myke opp oksidativ stil.' },
  'Lett hvitvin/rosé': { tid: 'Vanligvis ikke nødvendig', notat: 'Server rett fra flaske.' },
  'Musserende': { tid: 'Aldri', notat: 'Fjerner boblene.' },
};

// ---------- Felles hjelpefunksjoner ----------

const app = document.getElementById('app');

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function opsjoner(objekt, valgt) {
  return Object.keys(objekt).map((k) => `<option ${k === valgt ? 'selected' : ''}>${k}</option>`).join('');
}

function formaterMinutter(m) {
  const totalMin = Math.round(m);
  if (totalMin < 60) return `${totalMin} min`;
  const timer = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return min ? `${timer}t ${min}min` : `${timer}t`;
}

// ---------- Kalkulator-side (alle tre samlet) ----------

export function visKalkulator() {
  app.innerHTML = '';
  app.appendChild(el(`
    <div class="side">
      <h1>Kalkulator <span class="status-badge status-ny">🆕 Nytt</span></h1>
      ${kjoletidMarkup()}
      ${dekanteringMarkup()}
      ${festMarkup()}
    </div>
  `));
  kobleKjoletid();
  kobleDekantering();
  kobleFest();
}

// ---------- Kjøletid-kalkulator ----------

function beregnKjoletid(Tstart, Tmal, miljoNavn, beholderNavn, kalibrering) {
  const { temp: Tomg, h } = KJOLE_MILJOER[miljoNavn];
  const { r, vegg, k: kMat } = KJOLE_BEHOLDERE[beholderNavn];
  const diffStart = Tstart - Tomg;
  const diffMal = Tmal - Tomg;

  if (diffMal === 0 || Math.sign(diffStart) !== Math.sign(diffMal) || Math.abs(diffMal) > Math.abs(diffStart)) {
    return { feil: true };
  }
  if (Tmal === Tstart) return { feil: false, lav: 0, hoy: 0 };

  const hEff = 1 / (1 / h + vegg / kMat);
  const k = (hEff * 2 / r) / RHO_C;
  const minutter = (Math.log(diffStart / diffMal) / k / 60) * kalibrering;
  return { feil: false, lav: minutter * 0.8, hoy: minutter * 1.2 };
}

function kjoletidMarkup() {
  return `
    <section class="detaljseksjon">
      <h2>🌡️ Kjøletid</h2>
      <p class="hjelpetekst">Anslå hvor lang tid flasken trenger for å nå ønsket temperatur — fungerer for både kjøling og oppvarming.</p>

      <label class="importlabel">Starttemperatur</label>
      <div class="kalk-slider-rad">
        <input type="range" min="-5" max="30" step="1" id="kjole-start-slider" value="21">
        <span class="kalk-slider-tall" id="kjole-start-tall">21°C</span>
      </div>

      <label class="importlabel">Ønsket temperatur</label>
      <div class="kalk-slider-rad">
        <input type="range" min="-5" max="30" step="1" id="kjole-mal-slider" value="8">
        <span class="kalk-slider-tall" id="kjole-mal-tall">8°C</span>
      </div>

      <label class="importlabel">Miljø</label>
      <select id="kjole-miljo-select">${opsjoner(KJOLE_MILJOER, 'Kjøleskap')}</select>

      <label class="importlabel">Flaske/beholder</label>
      <select id="kjole-beholder-select">${opsjoner(KJOLE_BEHOLDERE, 'Standard bordeauxflaske')}</select>

      <div id="kjole-varsel-plass"></div>
      <div id="kjole-resultat-plass"></div>

      <details class="mal-detaljer">
        <summary>Kalibrering</summary>
        <p class="hjelpetekst" style="margin-top:8px;">Vinen min kjøler <strong id="kjole-kalibrering-tekst">som forventet</strong>.</p>
        <div class="kalk-slider-rad">
          <input type="range" min="0.6" max="1.6" step="0.05" id="kjole-kalibrering-slider" value="1">
        </div>
      </details>
    </section>
  `;
}

function startKlokkeNedtelling(minutter, tekstPlass) {
  const erAndroid = /Android/i.test(navigator.userAgent);
  if (erAndroid) {
    const sekunder = minutter * 60;
    const lenke = document.createElement('a');
    lenke.href = `intent:#Intent;action=android.intent.action.SET_TIMER;i.android.intent.extra.alarm.LENGTH=${sekunder};S.android.intent.extra.alarm.SKIP_UI=true;end`;
    document.body.appendChild(lenke);
    lenke.click();
    lenke.remove();
    tekstPlass.textContent = `Fikk du ikke opp klokke-appen? Sett en ${formaterMinutter(minutter)}-nedtelling manuelt — noen telefoner/klokke-apper støtter ikke automatisk oppstart fra en installert app på hjemskjermen.`;
  } else {
    tekstPlass.textContent = `Automatisk oppstart av klokke-timer virker foreløpig bare i Chrome på Android — sett en ${formaterMinutter(minutter)}-nedtelling manuelt i klokke-appen din.`;
  }
}

function kobleKjoletid() {
  const startSlider = document.getElementById('kjole-start-slider');
  const malSlider = document.getElementById('kjole-mal-slider');
  const miljoSelect = document.getElementById('kjole-miljo-select');
  const beholderSelect = document.getElementById('kjole-beholder-select');
  const kalibreringSlider = document.getElementById('kjole-kalibrering-slider');
  const startTall = document.getElementById('kjole-start-tall');
  const malTall = document.getElementById('kjole-mal-tall');
  const kalibreringTekst = document.getElementById('kjole-kalibrering-tekst');
  const varselPlass = document.getElementById('kjole-varsel-plass');
  const resultatPlass = document.getElementById('kjole-resultat-plass');

  function oppdater() {
    const Tstart = Number(startSlider.value);
    const Tmal = Number(malSlider.value);
    const kalibrering = Number(kalibreringSlider.value);
    startTall.textContent = `${Tstart}°C`;
    malTall.textContent = `${Tmal}°C`;

    const prosent = Math.round(Math.abs((kalibrering - 1) * 100));
    kalibreringTekst.textContent = kalibrering === 1 ? 'som forventet' : `${prosent}% ${kalibrering > 1 ? 'tregere' : 'raskere'} enn estimert`;

    varselPlass.innerHTML = miljoSelect.value === 'Fryser'
      ? '<section class="varselboks varsel-hastesak"><h2>⚠️ Fryser valgt</h2><p>Sett en alarm. Glemmer du flasken i fryseren kan den fryse og sprekke.</p></section>'
      : '';

    const res = beregnKjoletid(Tstart, Tmal, miljoSelect.value, beholderSelect.value, kalibrering);
    if (res.feil) {
      resultatPlass.innerHTML = '<p class="tom">Umulig med valgt miljø og temperatur — sjekk retning (kjøler du eller varmer du?) og at måltemperaturen ikke er lik miljøtemperaturen.</p>';
      return;
    }
    const retning = Tmal < Tstart ? 'kjøletid' : Tmal > Tstart ? 'oppvarmingstid' : 'tid';
    const midtMinutter = Math.max(1, Math.round((res.lav + res.hoy) / 2));
    resultatPlass.innerHTML = `
      <div class="statkort">
        <span class="stattall">${formaterMinutter(res.lav)}–${formaterMinutter(res.hoy)}</span>
        <span class="statlabel">estimert ${retning}</span>
      </div>
      <p class="hjelpetekst">Estimatet er mer usikkert tidlig i forløpet enn mot slutten — modellen antar jevn temperatur i hele væsken.</p>
      <button type="button" class="knapp knapp-primaer" id="kjole-timer-knapp" data-minutter="${midtMinutter}">⏰ Start nedtelling på klokken (${formaterMinutter(midtMinutter)})</button>
      <p class="hjelpetekst" id="kjole-timer-tekst"></p>
    `;
  }

  [startSlider, malSlider, miljoSelect, beholderSelect, kalibreringSlider].forEach((elm) => {
    elm.addEventListener('input', oppdater);
  });
  resultatPlass.addEventListener('click', (e) => {
    const knapp = e.target.closest('#kjole-timer-knapp');
    if (!knapp) return;
    startKlokkeNedtelling(Number(knapp.dataset.minutter), document.getElementById('kjole-timer-tekst'));
  });
  oppdater();
}

// ---------- Dekanteringstid-kalkulator ----------

function dekanteringMarkup() {
  const forsteType = Object.keys(DEKANTERING_TABELL)[0];
  return `
    <section class="detaljseksjon">
      <h2>🍷 Dekanteringstid</h2>
      <label class="importlabel">Vintype</label>
      <select id="dekant-select">${opsjoner(DEKANTERING_TABELL, forsteType)}</select>

      <div id="dekant-resultat-plass"></div>

      <p class="hjelpetekst">Dette er et utgangspunkt, ikke en fasit — smak deg gjerne frem. Faktisk tid påvirkes av årgang og lagringsforhold, hvor mye tanniner og syre vinen har, og hvor bred åpningen på karaffelen er.</p>
    </section>
  `;
}

function kobleDekantering() {
  const select = document.getElementById('dekant-select');
  const resultatPlass = document.getElementById('dekant-resultat-plass');

  function oppdater() {
    const { tid, notat } = DEKANTERING_TABELL[select.value];
    resultatPlass.innerHTML = `
      <div class="statkort">
        <span class="stattall">${tid}</span>
        <span class="statlabel">anbefalt dekanteringstid</span>
      </div>
      <p class="hjelpetekst">${notat}</p>
    `;
  }

  select.addEventListener('input', oppdater);
  oppdater();
}

// ---------- Flasker-til-fest-kalkulator ----------

function beregnFlasker(gjester, glassPerPerson) {
  const volumMl = gjester * glassPerPerson * 150;
  return { liter: volumMl / 1000, flasker: Math.ceil(volumMl / 750) };
}

function festMarkup() {
  return `
    <section class="detaljseksjon">
      <h2>🥂 Flasker til fest</h2>
      <label class="importlabel">Antall gjester som drikker vin</label>
      <div class="kalk-slider-rad">
        <input type="range" min="2" max="25" step="1" id="fest-gjester-slider" value="8">
        <span class="kalk-slider-tall" id="fest-gjester-tall">8</span>
      </div>

      <label class="importlabel">Glass per person</label>
      <div class="kalk-slider-rad">
        <input type="range" min="1" max="8" step="1" id="fest-glass-slider" value="3">
        <span class="kalk-slider-tall" id="fest-glass-tall">3</span>
      </div>

      <div id="fest-resultat-plass"></div>

      <p class="hjelpetekst">Antar 150 ml per glass, ca. 5 glass per 750 ml-flaske.</p>
    </section>
  `;
}

function kobleFest() {
  const gjesterSlider = document.getElementById('fest-gjester-slider');
  const glassSlider = document.getElementById('fest-glass-slider');
  const gjesterTall = document.getElementById('fest-gjester-tall');
  const glassTall = document.getElementById('fest-glass-tall');
  const resultatPlass = document.getElementById('fest-resultat-plass');

  function oppdater() {
    const gjester = Number(gjesterSlider.value);
    const glassPerPerson = Number(glassSlider.value);
    gjesterTall.textContent = gjester;
    glassTall.textContent = glassPerPerson;

    const { liter, flasker } = beregnFlasker(gjester, glassPerPerson);
    resultatPlass.innerHTML = `
      <div class="statkort">
        <span class="stattall stattall-stor">${flasker}</span>
        <span class="statlabel">flasker</span>
      </div>
      <p class="hjelpetekst">${glassPerPerson} glass per person à 150 ml — ${liter} liter totalt</p>
    `;
  }

  [gjesterSlider, glassSlider].forEach((s) => s.addEventListener('input', oppdater));
  oppdater();
}
