import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { completeReminder, deleteReminder } from "./actions";
import ReminderForm from "./reminder-form";

type Reminder = {
  id: string;
  title: string;
  remind_at: string;
  recurrence: string;
  target_user_id: string | null;
  notify_email: boolean;
  status: string;
};

const RECUR_LABEL: Record<string, string> = {
  none: "jednokratno",
  daily: "dnevno",
  weekly: "sedmično",
  monthly: "mjesečno",
  yearly: "godišnje",
};

const pad = (n: number) => String(n).padStart(2, "0");

function fmt(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default async function RemindersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { members } = await getCurrentHousehold();

  const { data } = await supabase
    .from("reminders")
    .select("id, title, remind_at, recurrence, target_user_id, notify_email, status")
    .order("remind_at", { ascending: true });

  const all = (data as Reminder[]) ?? [];
  const now = Date.now();
  const pending = all.filter((r) => r.status === "pending");
  const due = pending.filter((r) => new Date(r.remind_at).getTime() <= now);
  const upcoming = pending.filter((r) => new Date(r.remind_at).getTime() > now);

  const nameOf = (id: string | null) => {
    if (!id) return "Cijelo domaćinstvo";
    const m = members.find((x) => x.user_id === id);
    return m?.profiles?.display_name ?? m?.profiles?.email ?? "?";
  };

  const Row = ({ r, overdue }: { r: Reminder; overdue?: boolean }) => (
    <li
      className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm shadow-sm ${
        overdue
          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#20242c]"
      }`}
    >
      <form action={completeReminder}>
        <input type="hidden" name="id" value={r.id} />
        <button
          title="Označi obavljeno"
          className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-400 text-xs transition hover:bg-green-600 hover:text-white active:scale-90"
        >
          ✓
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          {overdue && "🔔 "}
          {r.title}
        </p>
        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{fmt(r.remind_at)}</span>
          <span>· {RECUR_LABEL[r.recurrence]}</span>
          <span>· 👤 {nameOf(r.target_user_id)}</span>
          {r.notify_email && <span>· ✉️ email</span>}
        </div>
      </div>
      <div className="flex items-center opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
        <ReminderForm members={members} reminder={r} />
        <form action={deleteReminder}>
          <input type="hidden" name="id" value={r.id} />
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
            ✕
          </button>
        </form>
      </div>
    </li>
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Podsjetnici
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {pending.length} aktivnih
          </p>
        </div>
        <ReminderForm members={members} />
      </header>

      {all.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white/50 py-16 text-center dark:border-zinc-700 dark:bg-[#20242c]/40">
          <Bell className="h-8 w-8 text-zinc-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Još nema podsjetnika. Klikni „Novi podsjetnik".
          </p>
        </div>
      )}

      {due.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-500">
            Dospjeli
          </h2>
          <ul className="flex flex-col gap-2">
            {due.map((r) => (
              <Row key={r.id} r={r} overdue />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Nadolazeći
        </h2>
        <ul className="flex flex-col gap-2">
          {upcoming.length === 0 && (
            <li className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Nema nadolazećih podsjetnika. (Ako ostane prazno, pokreni migraciju
              0006.)
            </li>
          )}
          {upcoming.map((r) => (
            <Row key={r.id} r={r} />
          ))}
        </ul>
      </section>
    </main>
  );
}
