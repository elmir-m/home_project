// Pretvara sirove (engleske) auth greške u kontrolisane poruke na našem jeziku.
export function friendlyAuthError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();

  if (m.includes("invalid login credentials"))
    return "Pogrešan email ili lozinka.";
  if (m.includes("email not confirmed"))
    return "Email još nije potvrđen — provjeri inbox za aktivacijski link.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Nalog s ovim emailom već postoji. Pokušaj prijavu.";
  if (m.includes("password") && (m.includes("6") || m.includes("short") || m.includes("weak")))
    return "Lozinka mora imati najmanje 6 znakova.";
  if (m.includes("invalid format") || m.includes("unable to validate email"))
    return "Email adresa nije ispravnog formata.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("for security purposes"))
    return "Previše pokušaja. Sačekaj malo pa pokušaj ponovo.";
  if (m.includes("fetch failed") || m.includes("network") || m.includes("timeout") || m.includes("timed out"))
    return "Trenutno ne možemo obraditi zahtjev. Pokušaj ponovo za koji trenutak ili kontaktiraj administratora.";

  return "Došlo je do greške. Pokušaj ponovo ili kontaktiraj administratora.";
}
