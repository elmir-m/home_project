import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TYPES, ACTION_TYPES, eventLabel } from "@/lib/platform";
import { toggleAutomation, deleteAutomation } from "../apps/actions";
import AutomationForm from "./automation-form";

type Automation = {
  id: string;
  trigger_type: string;
  action_type: string;
  config: { text?: string };
  enabled: boolean;
};
type Event = {
  id: string;
  type: string;
  payload: { title?: string };
  created_at: string;
};

export default async function AutomationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: autos }, { data: events }] = await Promise.all([
    supabase
      .from("automations")
      .select("id, trigger_type, action_type, config, enabled")
      .order("created_at", { ascending: false }),
    supabase
      .from("app_events")
      .select("id, type, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const autoList = (autos as Automation[]) ?? [];
  const eventList = (events as Event[]) ?? [];
  const actionLabel = (t: string) =>
    ACTION_TYPES.find((a) => a.type === t)?.label ?? t;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Automatizacije
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            „Kada se nešto desi → onda automatski uradi" — aplikacije sarađuju
            bez direktne veze.
          </p>
        </div>
        <AutomationForm events={EVENT_TYPES} actions={ACTION_TYPES} />
      </header>

      {/* Lista automatizacija */}
      {autoList.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white/50 py-16 text-center dark:border-zinc-700 dark:bg-[#20242c]/40">
          <Zap className="h-8 w-8 text-zinc-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Još nema automatizacija. Npr: „Kada Zadatak završen → Pošalji email".
          </p>
          <p className="text-xs text-zinc-400">
            (Ako ostane prazno i nakon dodavanja, pokreni migraciju 0009.)
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {autoList.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-[#20242c]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Zap className="h-[18px] w-[18px]" />
              </span>
              <span className="flex-1 text-zinc-800 dark:text-zinc-100">
                Kada{" "}
                <b className="text-zinc-900 dark:text-white">
                  {eventLabel(a.trigger_type)}
                </b>{" "}
                → {actionLabel(a.action_type)}
                {a.config?.text ? (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {" "}
                    : „{a.config.text}"
                  </span>
                ) : null}
              </span>
              <form action={toggleAutomation}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="enabled" value={String(a.enabled)} />
                <button
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    a.enabled
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : "bg-zinc-100 text-zinc-500 dark:bg-[#2a2f39] dark:text-zinc-400"
                  }`}
                >
                  {a.enabled ? "uključeno" : "isključeno"}
                </button>
              </form>
              <form action={deleteAutomation}>
                <input type="hidden" name="id" value={a.id} />
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* Event feed */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Nedavni događaji
        </h2>
        <ul className="flex flex-col gap-1">
          {eventList.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm dark:bg-[#20242c]"
            >
              <span className="text-zinc-800 dark:text-zinc-100">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {eventLabel(e.type)}:
                </span>{" "}
                {e.payload?.title ?? ""}
              </span>
              <span className="text-xs text-zinc-400">
                {new Date(e.created_at).toLocaleString("bs-BA")}
              </span>
            </li>
          ))}
          {eventList.length === 0 && (
            <li className="py-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Još nema događaja. Napravi/završi nešto pa osvježi.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
