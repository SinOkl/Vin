// Små, DOM-lette bildehjelpere for skjermbilde-vedlegget. Ingen avhengighet til app.js —
// modulen skal fungere alene i en hvilken som helst vertsapp.

/**
 * Leser en valgt fil (fra <input type="file">) inn i et <canvas>, skalert ned til maks
 * `maxBredde` px på lengste side. Kaster om filen ikke er et gyldig bilde.
 * @param {File} file
 * @param {number} [maxBredde]
 * @returns {Promise<HTMLCanvasElement>}
 */
export function lastBildeTilCanvas(file, maxBredde = 900) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const skala = Math.min(1, maxBredde / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * skala);
      canvas.height = Math.round(img.height * skala);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Kunne ikke lese bildet. Prøv en annen fil.'));
    };
    img.src = url;
  });
}

/**
 * Tegner strek-laget (samme piksel-mål som bunnbildet) oppå bunnbildet og komprimerer
 * resultatet til en JPEG data-URL. Holdes lavt (kvalitet 0.6) for å ha god margin til
 * Firestores 1 MB dokumentgrense.
 * @param {HTMLCanvasElement} bunnCanvas
 * @param {HTMLCanvasElement} strekCanvas
 * @param {number} [kvalitet]
 * @returns {string}
 */
export function flatOgKomprimer(bunnCanvas, strekCanvas, kvalitet = 0.6) {
  const resultat = document.createElement('canvas');
  resultat.width = bunnCanvas.width;
  resultat.height = bunnCanvas.height;
  const ctx = resultat.getContext('2d');
  ctx.drawImage(bunnCanvas, 0, 0);
  ctx.drawImage(strekCanvas, 0, 0);
  return resultat.toDataURL('image/jpeg', kvalitet);
}
