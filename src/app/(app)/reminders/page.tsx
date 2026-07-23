import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { createReminder, completeReminder, deleteReminder } from "./actions";

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

  // Default vrijeme: sad + 1h.
  const def = new Date(now + 3600_000);
  const defStr = `${def.getFullYear()}-${pad(def.getMonth() + 1)}-${pad(
    def.getDate(),
  )}T${pad(def.getHours())}:${pad(def.getMinutes())}`;

  const Row = ({ r, overdue }: { r: Reminder; overdue?: boolean }) => (
    <li
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
        overdue
          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <form action={completeReminder}>
        <input type="hidden" name="id" value={r.id} />
        <button
          title="Označi obavljeno"
          className="flex h-5 w-5 items-center justify-center rounded border border-zinc-400 text-xs hover:bg-green-600 hover:text-white"
        >
          ✓
        </button>
      </form>
      <div className="flex-1">
        <p className="text-black dark:text-zinc-50">
          {overdue && "🔔 "}
          {r.title}
        </p>
        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-zinc-400">
          <span>{fmt(r.remind_at)}</span>
          <span>· {RECUR_LABEL[r.recurrence]}</span>
          <span>· 👤 {nameOf(r.target_user_id)}</span>
          {r.notify_email && <span>· ✉️ email</span>}
        </div>
      </div>
      <form action={deleteReminder}>
        <input type="hidden" name="id" value={r.id} />
        <button className="text-zinc-300 hover:text-red-600">✕</button>
      </form>
    </li>
  );

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
        Podsjetnici
      </h1>

      <form
        action={createReminder}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <input
          name="title"
          required
          placeholder="Na šta te podsjetiti?"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <div className="flex flex-wrap gap-3">
          <input
            type="datetime-local"
            name="remind_at"
            required
            defaultValue={defStr}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <select
            name="recurrence"
            defaultValue="none"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="none">Jednokratno</option>
            <option value="daily">Dnevno</option>
            <option value="weekly">Sedmično</option>
            <option value="monthly">Mjesečno</option>
            <option value="yearly">Godišnje</option>
          </select>
          <select
            name="target_user_id"
            defaultValue=""
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Cijelo domaćinstvo</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.profiles?.display_name ?? m.profiles?.email}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" name="notify_email" defaultChecked />
            email
          </label>
          <button className="ml-auto rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black">
            Dodaj
          </button>
        </div>
      </form>

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
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Nadolazeći
        </h2>
        <ul className="flex flex-col gap-2">
          {upcoming.length === 0 && (
            <li className="py-4 text-center text-sm text-zinc-400">
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
