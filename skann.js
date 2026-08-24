import { BrowserMultiFormatReader } from 'https://esm.sh/@zxing/browser@0.1.5';

// Starter live strekkodeskanning fra bakre kamera inn i et gitt <video>-element.
// Kaller onTreff(ean) ved første gyldige avlesning, deretter stoppes skanningen automatisk.
// Returnerer en stopp()-funksjon som MÅ kalles når brukeren forlater siden, ellers blir
// kameraet stående på i bakgrunnen.
export async function startSkann(videoElement, { onTreff, onFeil }) {
  const leser = new BrowserMultiFormatReader();
  let stoppet = false;
  try {
    const kontroll = await leser.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      videoElement,
      (resultat, feil, kontrollNa) => {
        if (stoppet || !resultat) return;
        stoppet = true;
        kontrollNa.stop();
        onTreff(resultat.getText());
      }
    );
    return () => {
      if (!stoppet) { stoppet = true; kontroll.stop(); }
    };
  } catch (err) {
    if (onFeil) onFeil(err);
    return () => {};
  }
}
