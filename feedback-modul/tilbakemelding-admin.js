// Definerer <tilbakemelding-admin> — en sanntidsliste over innsendte tilbakemeldinger, med
// statusfilter og mulighet til å markere som lest/løst. Meningen er at vertsappen setter
// elementet inn på sin egen admin-beskyttede side/rute (denne komponenten sjekker ingen
// rettigheter selv — det er vertsappens ansvar, se README.md).
//
// Bruk:
//   import './feedback-modul/tilbakemelding-admin.js';
//   const a = document.createElement('tilbakemelding-admin');
//   container.appendChild(a);
//   a.konfigurer({ db, samlingsnavn: 'tilbakemeldinger' });
import { lagFeedbackDB, TILBAKEMELDING_STATUSER } from './feedback-db.js';
import { DELT_CSS } from './stiler.js';

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const MARKUP = `
  <div class="tbm-adminfilter"></div>
  <div class="tbm-adminliste"></div>
  <div class="tbm-lightbox" hidden>
    <img class="tbm-lightbox-bilde" alt="Skjermbilde i full størrelse">
  </div>
`;

const EGNE_STILER = `
  :host { display: block; }
  .tbm-adminfilter { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
  .tbm-filter-knapp { border: 1px solid var(--tbm-grense); background: var(--tbm-bg); color: var(--tbm-tekst-lys);
    border-radius: 999px; padding: 5px 12px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
  .tbm-filter-knapp.tbm-aktiv { background: var(--tbm-primaer); border-color: var(--tbm-primaer); color: #fff; }

  .tbm-adminliste { display: flex; flex-direction: column; gap: 12px; }
  .tbm-tom { color: var(--tbm-tekst-lys); font-size: 0.9rem; }

  .tbm-adminrad { border: 1px solid var(--tbm-grense); border-radius: var(--tbm-radius); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  .tbm-adminrad-topp { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .tbm-meta { font-size: 0.78rem; color: var(--tbm-tekst-lys); }
  .tbm-adminrad-tekst { margin: 0; white-space: pre-wrap; font-size: 0.92rem; }
  .tbm-miniatyr { max-width: 140px; max-height: 140px; border-radius: 8px; border: 1px solid var(--tbm-grense); cursor: zoom-in; display: block; }
  .tbm-adminrad-bunn { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .tbm-statusvelger { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--tbm-tekst-lys); font-weight: 600; }
  .tbm-statusvelger select { font: inherit; border: 1px solid var(--tbm-grense); border-radius: 8px; padding: 4px 8px; color: var(--tbm-tekst); }
  .tbm-slett-knapp { font-size: 0.8rem; padding: 5px 10px; }

  .tbm-lightbox { position: fixed; inset: 0; z-index: 2147483002; background: rgba(10,10,15,0.85);
    display: flex; align-items: center; justify-content: center; padding: 20px; cursor: zoom-out; }
  .tbm-lightbox[hidden] { display: none; }
  .tbm-lightbox-bilde { max-width: 100%; max-height: 100%; border-radius: 8px; }
`;

export class TilbakemeldingAdmin extends HTMLElement {
  constructor() {
    super();
    this._feedbackDB = null;
    this._avslutt = null;
    this._liste = [];
    this._filter = 'alle';

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${DELT_CSS}${EGNE_STILER}</style>${MARKUP}`;
    this._filterEl = shadow.querySelector('.tbm-adminfilter');
    this._listeEl = shadow.querySelector('.tbm-adminliste');
    this._lightbox = shadow.querySelector('.tbm-lightbox');
    this._lightboxBilde = shadow.querySelector('.tbm-lightbox-bilde');

    this._lightbox.addEventListener('click', () => { this._lightbox.hidden = true; });

    const alternativer = ['alle', ...TILBAKEMELDING_STATUSER];
    this._filterEl.innerHTML = alternativer.map((v) => `<button type="button" class="tbm-filter-knapp" data-filter="${v}">${v === 'alle' ? 'Alle' : v}</button>`).join('');
    this._filterEl.querySelectorAll('.tbm-filter-knapp').forEach((knapp) => {
      knapp.addEventListener('click', () => { this._filter = knapp.dataset.filter; this._tegn(); });
    });
  }

  /** @param {{ db: object, samlingsnavn?: string }} konfig */
  konfigurer(konfig) {
    if (!konfig || !konfig.db) throw new Error('tilbakemelding-admin: konfigurer() krever minst { db }.');
    if (this._avslutt) this._avslutt();
    this._feedbackDB = lagFeedbackDB(konfig.db, konfig.samlingsnavn || 'tilbakemeldinger');
    this._avslutt = this._feedbackDB.abonner((liste) => {
      this._liste = liste;
      this._tegn();
    });
  }

  disconnectedCallback() {
    if (this._avslutt) { this._avslutt(); this._avslutt = null; }
  }

  _tegn() {
    this._filterEl.querySelectorAll('.tbm-filter-knapp').forEach((knapp) => {
      knapp.classList.toggle('tbm-aktiv', knapp.dataset.filter === this._filter);
    });

    const synlige = this._filter === 'alle' ? this._liste : this._liste.filter((f) => f.status === this._filter);
    if (!synlige.length) {
      this._listeEl.innerHTML = '<p class="tbm-tom">Ingen tilbakemeldinger her ennå.</p>';
      return;
    }
    this._listeEl.innerHTML = synlige.map((f) => this._rad(f)).join('');

    this._listeEl.querySelectorAll('[data-status-id]').forEach((select) => {
      select.addEventListener('change', () => {
        this._feedbackDB.settStatus(select.dataset.statusId, select.value).catch((err) => alert(err.message));
      });
    });
    this._listeEl.querySelectorAll('.tbm-miniatyr').forEach((img) => {
      img.addEventListener('click', () => {
        this._lightboxBilde.src = img.src;
        this._lightbox.hidden = false;
      });
    });
    this._listeEl.querySelectorAll('[data-slett-id]').forEach((knapp) => {
      knapp.addEventListener('click', () => {
        if (!confirm('Slette denne tilbakemeldingen? Dette kan ikke angres.')) return;
        knapp.disabled = true;
        this._feedbackDB.slett(knapp.dataset.slettId).catch((err) => { alert(err.message); knapp.disabled = false; });
      });
    });
  }

  _rad(f) {
    const dato = f.opprettet && typeof f.opprettet.toDate === 'function' ? f.opprettet.toDate().toLocaleString('nb-NO') : 'nettopp';
    const bruker = (f.bruker && (f.bruker.navn || f.bruker.epost)) || 'Anonym';
    return `
      <div class="tbm-adminrad">
        <div class="tbm-adminrad-topp">
          <span class="tbm-type-merke">${escapeHtml(f.type)}</span>
          <span class="tbm-meta">${escapeHtml(bruker)} · ${escapeHtml(dato)}${f.side ? ' · ' + escapeHtml(f.side) : ''}</span>
        </div>
        <p class="tbm-adminrad-tekst">${escapeHtml(f.tekst)}</p>
        ${f.bilde ? `<img class="tbm-miniatyr" src="${f.bilde}" alt="Vedlagt skjermbilde">` : ''}
        <div class="tbm-adminrad-bunn">
          <label class="tbm-statusvelger">Status
            <select data-status-id="${escapeHtml(f.id)}">
              ${TILBAKEMELDING_STATUSER.map((s) => `<option value="${s}" ${s === f.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </label>
          <button type="button" class="tbm-knapp tbm-knapp-fare tbm-slett-knapp" data-slett-id="${escapeHtml(f.id)}">🗑 Slett</button>
        </div>
      </div>
    `;
  }
}

customElements.define('tilbakemelding-admin', TilbakemeldingAdmin);
