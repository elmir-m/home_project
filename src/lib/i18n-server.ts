import { cookies } from "next/headers";
import { DEFAULT_LOCALE, type Locale, translate } from "@/lib/i18n";

// Aktivni jezik — čita se iz kolačića `locale` (postavlja ga login/promjena jezika).
export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get("locale")?.value;
  return v === "en" || v === "bs" ? v : DEFAULT_LOCALE;
}

// `t` funkcija vezana za trenutni jezik (za server komponente).
export async function getT() {
  const locale = await getLocale();
  return (key: string, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
}
