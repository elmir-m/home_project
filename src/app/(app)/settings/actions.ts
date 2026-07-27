"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveNotificationPrefs(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notification_prefs").upsert(
    {
      user_id: user.id,
      email_reminders: formData.get("email_reminders") === "on",
      email_tasks: formData.get("email_tasks") === "on",
      email_bills: formData.get("email_bills") === "on",
      email_shared: formData.get("email_shared") === "on",
      digest: String(formData.get("digest") ?? "none"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/settings");
}

const FONTS = ["sm", "md", "lg"];
const ACCENTS = ["indigo", "blue", "violet", "emerald", "teal", "rose", "amber"];

// Sprema izgled (veličina fonta + akcent) na profil korisnika — sinhronizuje se
// preko svih uređaja. Poziva se iz klijentske komponente s običnim argumentima.
export async function saveAppearance(font: string, accent: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const safeFont = FONTS.includes(font) ? font : "md";
  const safeAccent = ACCENTS.includes(accent) ? accent : "indigo";

  await supabase
    .from("profiles")
    .update({ font_size: safeFont, accent: safeAccent })
    .eq("id", user.id);

  // Da SSR (root layout) na sljedećoj navigaciji odmah pročita nove vrijednosti.
  revalidatePath("/", "layout");
}

// Promjena jezika — pamti se na profilu (nalog) i u kolačiću (brzo čitanje na serveru).
export async function saveLocale(locale: string) {
  const safe = locale === "en" ? "en" : "bs";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ locale: safe }).eq("id", user.id);

  const cookieStore = await cookies();
  cookieStore.set("locale", safe, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  revalidatePath("/", "layout");
}
