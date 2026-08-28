// Definerer <tilbakemelding-widget> — en flytende knapp + modal for å sende inn forslag/
// tilbakemeldinger, med valgfritt skjermbilde-vedlegg som kan markeres med en rød frihånds-
// penn. Bygget som et ekte Custom Element med Shadow DOM slik at den kan droppes inn i en
// hvilken som helst app (vanilla JS, React, Vue, ...) uten byggetrinn og uten å kollidere med
// vertsappens egen CSS. Se README.md for gjenbruksoppskrift.
//
// Bruk:
//   import './feedback-modul/tilbakemelding-widget.js';
//   const w = document.createElement('tilbakemelding-widget');
//   document.body.appendChild(w);
//   w.konfigurer({ db, hentBrukerInfo: () => ({ uid, navn, epost }) });
import { lagFeedbackDB, TILBAKEMELDING_TYPER } from './feedback-db.js';
import { lastBildeTilCanvas, flatOgKomprimer } from './bildeverktoy.js';
import { DELT_CSS } from './stiler.js';

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const MARKUP = `
  <button type="button" class="tbm-flytknapp"></button>
  <div class="tbm-overlay" hidden>
    <div class="tbm-modal" role="dialog" aria-modal="true" aria-labelledby="tbm-tittel">
      <h2 id="tbm-tittel">Send tilbakemelding</h2>

      <label class="tbm-felt">Type
        <select class="tbm-type"></select>
      </label>

      <label class="tbm-felt">Hva vil du fortelle oss?
        <textarea class="tbm-tekst" rows="4" placeholder="Skriv gjerne så konkret du kan..."></textarea>
      </label>

      <div class="tbm-felt">
        <span>Skjermbilde (valgfritt)</span>
        <label class="tbm-knapp tbm-legg-ved-knapp">
          📎 Legg ved skjermbilde
          <input type="file" accept="image/*" class="tbm-filinput" hidden>
        </label>
        <div class="tbm-canvaswrap" hidden>
          <p class="tbm-hjelp">Tegn for å markere hva som er galt.</p>
          <div class="tbm-canvasstack">
            <canvas class="tbm-canvas-bunn"></canvas>
            <canvas class="tbm-canvas-strek"></canvas>
          </div>
          <div class="tbm-knapperad">
            <button type="button" class="tbm-knapp tbm-angre-knapp">↩ Angre strek</button>
            <button type="button" class="tbm-knapp tbm-fjern-bilde-knapp">✕ Fjern bilde</button>
          </div>
        </div>
      </div>

      <p class="tbm-status" hidden></p>
      <div class="tbm-knapperad tbm-bunnknapper">
        <button type="button" class="tbm-knapp tbm-avbryt-knapp">Avbryt</button>
        <button type="button" class="tbm-knapp tbm-knapp-primaer tbm-send-knapp">Send</button>
      </div>
    </div>
  </div>
`;

const EGNE_STILER = `
  .tbm-flytknapp {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 2147483000;
    border: none;
    border-radius: 999px;
    padding: 12px 18px;
    background: var(--tbm-primaer);
    color: #fff;
    font-weight: 700;
    font-size: 0.9rem;
    box-shadow: var(--tbm-skygge);
    cursor: pointer;
  }
  .tbm-flytknapp:hover { background: var(--tbm-primaer-hover); }
  .tbm-flytknapp.tbm-venstre { right: auto; left: 18px; }

  .tbm-overlay {
    position: fixed;
    inset: 0;
    z-index: 2147483001;
    background: rgba(20, 20, 30, 0.45);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0;
  }
  @media (min-width: 560px) {
    .tbm-overlay { align-items: center; padding: 16px; }
  }
  .tbm-overlay[hidden] { display: none; }

  .tbm-modal {
    background: var(--tbm-bg);
    color: var(--tbm-tekst);
    border-radius: var(--tbm-radius) var(--tbm-radius) 0 0;
    padding: 20px;
    width: 100%;
    max-width: 420px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--tbm-skygge);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  @media (min-width: 560px) {
    .tbm-modal { border-radius: var(--tbm-radius); }
  }
  .tbm-modal h2 { margin: 0; font-size: 1.15rem; }

  .tbm-canvaswrap { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
  .tbm-canvaswrap[hidden] { display: none; }
  .tbm-hjelp { margin: 0; font-size: 0.8rem; color: var(--tbm-tekst-lys); }
  /* Bredde/høyde settes eksplisitt i px fra JS (se _settCanvasstørrelse) ut fra det faktiske
     bildet — en position:relative-boks uten annet innhold gir ingen egen høyde, og begge
     canvasene MÅ være position:absolute (oppå hverandre) for at tegne-laget skal ligge
     nøyaktig over bunnbildet. Uten eksplisitt størrelse her kollapser boksen til 0 høyde og
     resten av modalen (Send/Avbryt-knappene) havner visuelt bak det (fortsatt synlige, men
     overlappede) bildet. */
  .tbm-canvasstack { position: relative; flex: none; }
  .tbm-canvasstack canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    border: 1px solid var(--tbm-grense);
    border-radius: 8px;
    touch-action: none;
  }

  .tbm-legg-ved-knapp { display: inline-flex; width: fit-content; }
`;

export class TilbakemeldingWidget extends HTMLElement {
  constructor() {
    super();
    this._konfig = null;
    this._feedbackDB = null;
    this._strekLag = []; // liste av strøk, hvert strøk er en liste av {x,y}
    this._tegner = false;
    this._harBilde = false;

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${DELT_CSS}${EGNE_STILER}</style>${MARKUP}`;

    this._flytknapp = shadow.querySelector('.tbm-flytknapp');
    this._overlay = shadow.querySelector('.tbm-overlay');
    this._typeSelect = shadow.querySelector('.tbm-type');
    this._tekstFelt = shadow.querySelector('.tbm-tekst');
    this._filInput = shadow.querySelector('.tbm-filinput');
    this._canvasWrap = shadow.querySelector('.tbm-canvaswrap');
    this._canvasStack = shadow.querySelector('.tbm-canvasstack');
    this._bunnCanvas = shadow.querySelector('.tbm-canvas-bunn');
    this._strekCanvas = shadow.querySelector('.tbm-canvas-strek');
    this._statusEl = shadow.querySelector('.tbm-status');
    this._sendKnapp = shadow.querySelector('.tbm-send-knapp');

    this._flytknapp.addEventListener('click', () => this.apne());
    this._overlay.addEventListener('click', (e) => { if (e.target === this._overlay) this.lukk(); });
    shadow.querySelector('.tbm-avbryt-knapp').addEventListener('click', () => this.lukk());
    shadow.querySelector('.tbm-angre-knapp').addEventListener('click', () => this._angreStrek());
    shadow.querySelector('.tbm-fjern-bilde-knapp').addEventListener('click', () => this._fjernBilde());
    this._filInput.addEventListener('change', (e) => this._pahandterFilvalg(e));
    this._sendKnapp.addEventListener('click', () => this._send());

    this._koblePeker();
  }

  /**
   * @param {{ db: object, hentBrukerInfo?: () => (object|null), samlingsnavn?: string,
   *   typer?: string[], knappetekst?: string, posisjon?: 'hoyre'|'venstre',
   *   visFlytknapp?: boolean }} konfig
   */
  konfigurer(konfig) {
    if (!konfig || !konfig.db) throw new Error('tilbakemelding-widget: konfigurer() krever minst { db }.');
    this._konfig = {
      hentBrukerInfo: () => null,
      samlingsnavn: 'tilbakemeldinger',
      typer: TILBAKEMELDING_TYPER,
      knappetekst: '💬 Tilbakemelding',
      posisjon: 'hoyre',
      visFlytknapp: true,
      ...konfig,
    };
    this._feedbackDB = lagFeedbackDB(konfig.db, this._konfig.samlingsnavn);
    this._flytknapp.textContent = this._konfig.knappetekst;
    this._flytknapp.classList.toggle('tbm-venstre', this._konfig.posisjon === 'venstre');
    // Flytknappen er valgfri — en vertsapp kan i stedet kalle .apne() fra en egen knapp den
    // allerede har (f.eks. i en innstillinger-side), og la modalen være eneste synlige del.
    // Nyttig når appen har annet fastmontert UI (f.eks. en egen flytende CTA-knapp) som en
    // ekstra flytende knapp ellers ville kollidert visuelt med.
    this._flytknapp.hidden = !this._konfig.visFlytknapp;
    this._typeSelect.innerHTML = this._konfig.typer.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  }

  apne() {
    this._overlay.hidden = false;
    this._tekstFelt.focus();
  }

  lukk() {
    this._overlay.hidden = true;
    this._tekstFelt.value = '';
    this._settStatus('');
    this._fjernBilde();
  }

  // ---------- Skjermbilde ----------

  async _pahandterFilvalg(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const canvas = await lastBildeTilCanvas(file);
      this._bunnCanvas.width = canvas.width;
      this._bunnCanvas.height = canvas.height;
      this._bunnCanvas.getContext('2d').drawImage(canvas, 0, 0);
      this._strekCanvas.width = canvas.width;
      this._strekCanvas.height = canvas.height;
      this._strekLag = [];
      this._harBilde = true;
      this._canvasWrap.hidden = false;
      this._settCanvasstorrelse(canvas.width, canvas.height);
    } catch (err) {
      this._settStatus(err.message, true);
    } finally {
      this._filInput.value = '';
    }
  }

  // Setter en eksplisitt px-bredde/høyde på .tbm-canvasstack ut fra bildets faktiske
  // proporsjoner, begrenset til maks 320×360px på skjermen. Nødvendig fordi begge canvasene
  // ligger oppå hverandre med position:absolute (se stilkommentaren) — uten dette kollapser
  // boksen til 0 høyde og skjuler seg selv bak resten av modalen i stedet for omvendt.
  _settCanvasstorrelse(bredde, hoyde) {
    const maksBredde = 320;
    const maksHoyde = 360;
    const skala = Math.min(maksBredde / bredde, maksHoyde / hoyde, 1);
    this._canvasStack.style.width = Math.round(bredde * skala) + 'px';
    this._canvasStack.style.height = Math.round(hoyde * skala) + 'px';
  }

  _fjernBilde() {
    this._harBilde = false;
    this._strekLag = [];
    this._canvasWrap.hidden = true;
    this._canvasStack.style.width = '';
    this._canvasStack.style.height = '';
    this._bunnCanvas.getContext('2d').clearRect(0, 0, this._bunnCanvas.width, this._bunnCanvas.height);
    this._strekCanvas.getContext('2d').clearRect(0, 0, this._strekCanvas.width, this._strekCanvas.height);
  }

  _angreStrek() {
    this._strekLag.pop();
    this._tegnAlleStrek();
  }

  _tegnAlleStrek() {
    const ctx = this._strekCanvas.getContext('2d');
    ctx.clearRect(0, 0, this._strekCanvas.width, this._strekCanvas.height);
    ctx.strokeStyle = getComputedStyle(this).getPropertyValue('--tbm-rod') || '#dc2626';
    ctx.lineWidth = Math.max(3, this._strekCanvas.width / 120);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const strøk of this._strekLag) {
      ctx.beginPath();
      strøk.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }
  }

  _koblePeker() {
    const kanvasPunkt = (e) => {
      const rect = this._strekCanvas.getBoundingClientRect();
      const skalaX = this._strekCanvas.width / rect.width;
      const skalaY = this._strekCanvas.height / rect.height;
      return { x: (e.clientX - rect.left) * skalaX, y: (e.clientY - rect.top) * skalaY };
    };

    this._strekCanvas.addEventListener('pointerdown', (e) => {
      if (!this._harBilde) return;
      this._tegner = true;
      this._strekCanvas.setPointerCapture(e.pointerId);
      this._strekLag.push([kanvasPunkt(e)]);
    });
    this._strekCanvas.addEventListener('pointermove', (e) => {
      if (!this._tegner) return;
      this._strekLag[this._strekLag.length - 1].push(kanvasPunkt(e));
      this._tegnAlleStrek();
    });
    const avslutt = () => { this._tegner = false; };
    this._strekCanvas.addEventListener('pointerup', avslutt);
    this._strekCanvas.addEventListener('pointercancel', avslutt);
    this._strekCanvas.addEventListener('pointerleave', avslutt);
  }

  // ---------- Innsending ----------

  _settStatus(tekst, erFeil = false) {
    this._statusEl.textContent = tekst;
    this._statusEl.hidden = !tekst;
    this._statusEl.classList.toggle('tbm-status-feil', erFeil);
    this._statusEl.classList.toggle('tbm-status-ok', !erFeil && !!tekst);
  }

  async _send() {
    if (!this._feedbackDB) { this._settStatus('Widgeten er ikke konfigurert (mangler db).', true); return; }
    this._sendKnapp.disabled = true;
    try {
      const bilde = this._harBilde ? flatOgKomprimer(this._bunnCanvas, this._strekCanvas) : null;
      await this._feedbackDB.send({
        type: this._typeSelect.value,
        tekst: this._tekstFelt.value,
        bilde,
        bruker: this._konfig.hentBrukerInfo(),
        side: location.hash || location.pathname,
      });
      this._settStatus('Takk! Tilbakemeldingen er sendt.');
      setTimeout(() => this.lukk(), 1200);
    } catch (err) {
      this._settStatus(err.message || 'Noe gikk galt.', true);
    } finally {
      this._sendKnapp.disabled = false;
    }
  }
}

customElements.define('tilbakemelding-widget', TilbakemeldingWidget);
