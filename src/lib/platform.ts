import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, basicEmail } from "@/lib/email";

// Manifest je u čistom modulu (bez server importa); re-export radi kompatibilnosti.
export { BUILTIN_APPS, type AppManifest } from "@/lib/apps";

// -------- Event tipovi (za automatizacije) --------
// label = i18n ključ; prevodi se u UI-u (t(label)).
export const EVENT_TYPES: { type: string; label: string }[] = [
  { type: "task.created", label: "auto.ev.taskCreated" },
  { type: "task.completed", label: "auto.ev.taskCompleted" },
  { type: "bill.created", label: "auto.ev.billCreated" },
  { type: "transaction.created", label: "auto.ev.txCreated" },
  { type: "note.created", label: "auto.ev.noteCreated" },
  { type: "record.created", label: "auto.ev.recordCreated" },
  { type: "shopping.added", label: "auto.ev.shoppingAdded" },
];

export const ACTION_TYPES: { type: string; label: string }[] = [
  { type: "create_reminder", label: "auto.act.createReminder" },
  { type: "create_task", label: "auto.act.createTask" },
  { type: "send_email", label: "auto.act.sendEmail" },
];

// Vrati i18n ključ za tip događaja (UI ga prevodi).
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
