import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, basicEmail } from "@/lib/email";

// Manifest je u čistom modulu (bez server importa); re-export radi kompatibilnosti.
export { BUILTIN_APPS, type AppManifest } from "@/lib/apps";

// -------- Event tipovi (za automatizacije) --------
export const EVENT_TYPES: { type: string; label: string }[] = [
  { type: "task.created", label: "Zadatak kreiran" },
  { type: "task.completed", label: "Zadatak završen" },
  { type: "bill.created", label: "Račun dodan" },
  { type: "transaction.created", label: "Transakcija dodana" },
  { type: "note.created", label: "Bilješka kreirana" },
  { type: "record.created", label: "Zapis dodan (Kućna evidencija)" },
  { type: "shopping.added", label: "Stavka za kupovinu dodana" },
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
