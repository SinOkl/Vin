// Delt CSS for begge Custom Elements i modulen. Injiseres inn i hver komponents Shadow DOM
// (ikke i det globale dokumentet) — derfor er den trygg å bruke i en hvilken som helst
// vertsapp uten å kollidere med dens egen styles.css.
//
// Temaing: vertsappen kan sette disse CSS-variablene på selve <tilbakemelding-widget>-/
// <tilbakemelding-admin>-taggen (custom properties krysser Shadow DOM-grensen), f.eks.
//   <tilbakemelding-widget style="--tbm-primaer:#7a1f3d; --tbm-font:'Lora',serif;"></tilbakemelding-widget>
// Uten noe satt brukes standardpaletten under.
export const DELT_CSS = `
  :host {
    --tbm-primaer: #4f46e5;
    --tbm-primaer-hover: #4338ca;
    --tbm-bg: #ffffff;
    --tbm-tekst: #1f2430;
    --tbm-tekst-lys: #6b7280;
    --tbm-grense: #e2e2e7;
    --tbm-radius: 12px;
    --tbm-font: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --tbm-rod: #dc2626;
    --tbm-gronn: #15803d;
    --tbm-skygge: 0 8px 30px rgba(20, 20, 30, 0.18);
    all: initial;
    font-family: var(--tbm-font);
    color: var(--tbm-tekst);
  }
  *, *::before, *::after { box-sizing: border-box; font-family: inherit; }

  .tbm-knapp {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--tbm-grense);
    background: var(--tbm-bg);
    color: var(--tbm-tekst);
    border-radius: calc(var(--tbm-radius) - 4px);
    padding: 9px 14px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    line-height: 1.2;
  }
  .tbm-knapp:disabled { opacity: 0.55; cursor: default; }
  .tbm-knapp-primaer {
    background: var(--tbm-primaer);
    border-color: var(--tbm-primaer);
    color: #fff;
  }
  .tbm-knapp-primaer:hover:not(:disabled) { background: var(--tbm-primaer-hover); }
  .tbm-knapp-fare { color: var(--tbm-rod); border-color: var(--tbm-rod); }
  .tbm-knapperad { display: flex; gap: 8px; flex-wrap: wrap; }

  .tbm-felt { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; font-weight: 600; color: var(--tbm-tekst-lys); }
  .tbm-felt select, .tbm-felt textarea {
    font: inherit;
    color: var(--tbm-tekst);
    border: 1px solid var(--tbm-grense);
    border-radius: calc(var(--tbm-radius) - 4px);
    padding: 8px 10px;
    resize: vertical;
  }

  .tbm-status { font-size: 0.85rem; margin: 0; }
  .tbm-status-feil { color: var(--tbm-rod); }
  .tbm-status-ok { color: var(--tbm-gronn); }

  .tbm-type-merke {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    background: var(--tbm-grense);
    color: var(--tbm-tekst);
  }
`;
