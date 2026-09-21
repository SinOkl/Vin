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
        // Leseren tolker også QR, Code128 osv. Bare EAN/UPC (8–14 siffer) er nyttig her — alt annet
        // ignoreres slik at skanningen fortsetter i stedet for å stoppe på en strekkode appen ikke kan bruke.
        const tekst = resultat.getText();
        if (!/^[0-9]{8,14}$/.test(tekst)) return;
        stoppet = true;
        kontrollNa.stop();
        onTreff(tekst);
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
