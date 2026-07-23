import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, basicEmail } from "@/lib/email";

// -------- Manifest ugrađenih aplikacija (registar) --------
// Nove aplikacije se dodaju ovdje na isti način — bez posebnog tretmana.
export type AppManifest = {
  slug: string;
  name: string;
  icon: string;
  href: string;
  description: string;
  emits: string[]; // event tipovi koje objavljuje
  capabilities: string[]; // dijeljene sposobnosti koje koristi
};

export const BUILTIN_APPS: AppManifest[] = [
  { slug: "tasks", name: "Zadaci", icon: "✅", href: "/tasks", description: "Zadaci s rokom, prioritetom i zaduženjem.", emits: ["task.created", "task.completed"], capabilities: ["members", "reminders"] },
  { slug: "kanban", name: "Kanban", icon: "📋", href: "/kanban", description: "Tabla nad istim zadacima.", emits: [], capabilities: ["tasks"] },
  { slug: "calendar", name: "Kalendar", icon: "📅", href: "/calendar", description: "Događaji + zadaci + računi po datumu.", emits: ["event.created"], capabilities: ["tasks", "finance"] },
  { slug: "notes", name: "Bilješke", icon: "📝", href: "/notes", description: "Bilješke, tagovi, dnevnik, veze.", emits: ["note.created"], capabilities: ["links"] },
  { slug: "finance", name: "Finansije", icon: "💰", href: "/finance", description: "Troškovi, prihodi, računi, podjela.", emits: ["bill.created", "transaction.created"], capabilities: ["members", "calendar"] },
  { slug: "reminders", name: "Podsjetnici", icon: "🔔", href: "/reminders", description: "Jednokratni i ponavljajući, email.", emits: ["reminder.created"], capabilities: ["email", "members"] },
  { slug: "life", name: "Life admin", icon: "🗂️", href: "/life", description: "Evidencija, kontakti, liste.", emits: ["record.created"], capabilities: ["reminders"] },
];

// -------- Event tipovi (za automatizacije) --------
export const EVENT_TYPES: { type: string; label: string }[] = [
  { type: "task.created", label: "Zadatak kreiran" },
  { type: "task.completed", label: "Zadatak završen" },
  { type: "bill.created", label: "Račun dodan" },
  { type: "transaction.created", label: "Transakcija dodana" },
  { type: "note.created", label: "Bilješka kreirana" },
  { type: "record.created", label: "Zapis dodan (Life admin)" },
];

export const ACTION_TYPES: { type: string; label: string }[] = [
  { type: "create_reminder", label: "Napravi podsjetnik" },
  { type: "create_task", label: "Napravi zadatak" },
  { type: "send_email", label: "Pošalji email domaćinstvu" },
];

export function eventLabel(type: string) {
  return EVENT_TYPES.find((e) => e.type === type)?.label ?? type;
}

// -------- Engine --------
type Client = SupabaseClient;

// Aplikacija objavljuje događaj; platforma ga zapiše i pokrene automatizacije.
export async function emitEvent(
  supabase: Client,
  household_id: string,
  type: string,
  payload: Record<string, unknown>,
  actor: string | null,
) {
  await supabase.from("app_events").insert({ household_id, type, payload, actor });

  const { data: autos } = await supabase
    .from("automations")
    .select("id, action_type, config")
    .eq("household_id", household_id)
    .eq("trigger_type", type)
    .eq("enabled", true);

  for (const a of autos ?? []) {
    await runAction(supabase, household_id, a, payload, actor);
  }
}

async function runAction(
  supabase: Client,
  household_id: string,
  automation: { action_type: string; config: Record<string, unknown> },
  payload: Record<string, unknown>,
  actor: string | null,
) {
  const cfg = automation.config ?? {};
  const subject = String(cfg.text ?? "Home OS automatizacija");
  const title =
    String(cfg.text ?? "") ||
    `Automatski: ${String(payload.title ?? "događaj")}`;

  try {
    if (automation.action_type === "create_reminder") {
      const offset = Number(cfg.offsetMinutes ?? 60);
      await supabase.from("reminders").insert({
        household_id,
        title,
        remind_at: new Date(Date.now() + offset * 60000).toISOString(),
        notify_email: true,
        source_type: "automation",
        created_by: actor,
      });
    } else if (automation.action_type === "create_task") {
      await supabase.from("tasks").insert({
        household_id,
        title,
        created_by: actor,
      });
    } else if (automation.action_type === "send_email") {
      const { data: members } = await supabase
        .from("household_members")
        .select("profiles(email)")
        .eq("household_id", household_id);
      const emails = ((members ?? []) as unknown as {
        profiles: { email: string | null } | null;
      }[])
        .map((m) => m.profiles?.email)
        .filter((e): e is string => !!e);
      if (emails.length) {
        await sendEmail({
          to: emails,
          subject,
          html: basicEmail(subject, `Pokrenuto automatizacijom.`),
        });
      }
    }
  } catch (e) {
    console.error("Automatizacija greška:", e);
  }
}
