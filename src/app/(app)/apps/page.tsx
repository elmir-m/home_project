import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BUILTIN_APPS,
  EVENT_TYPES,
  ACTION_TYPES,
  eventLabel,
} from "@/lib/platform";
import {
  createAutomation,
  toggleAutomation,
  deleteAutomation,
  toggleApp,
} from "./actions";
import { AppIcon } from "@/components/app-icon";

type Automation = {
  id: string;
  trigger_type: string;
  action_type: string;
  config: { text?: string };
  enabled: boolean;
};
type Event = { id: string; type: string; payload: { title?: string }; created_at: string };

export default async function AppsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: installs }, { data: autos }, { data: events }] =
    await Promise.all([
      supabase.from("app_installs").select("slug, enabled"),
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

  const installMap = new Map(
    (installs ?? []).map((i) => [i.slug, i.enabled]),
  );
  const isInstalled = (slug: string) => installMap.get(slug) !== false;

  const autoList = (autos as Automation[]) ?? [];
  const eventList = (events as Event[]) ?? [];
  const actionLabel = (t: string) =>
    ACTION_TYPES.find((a) => a.type === t)?.label ?? t;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
          Aplikacije i platforma
        </h1>
        <p className="text-sm text-zinc-500">
          Sve gradi na dijeljenim sposobnostima. Nove aplikacije se dodaju na
          isti način i odmah rade uz postojeće.
        </p>
      </div>

      {/* REGISTAR */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Instalirane aplikacije
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUILTIN_APPS.map((app) => {
            const on = isInstalled(app.slug);
            return (
              <div
                key={app.slug}
                className={`rounded-xl border p-4 ${
                  on
                    ? "border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                    : "border-dashed border-zinc-300 opacity-60 dark:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                      <AppIcon slug={app.slug} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {app.name}
                    </span>
                  </span>
                  <form action={toggleApp}>
                    <input type="hidden" name="slug" value={app.slug} />
                    <input type="hidden" name="enabled" value={String(on)} />
                    <button
                      className={`rounded-md px-2 py-1 text-xs ${
                        on
                          ? "border border-zinc-300 text-zinc-500 dark:border-zinc-700"
                          : "bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white"
                      }`}
                    >
                      {on ? "Deinstaliraj" : "Instaliraj"}
                    </button>
                  </form>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{app.description}</p>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                  {app.emits.map((e) => (
                    <span
                      key={e}
                      className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      title="objavljuje događaj"
                    >
                      ↑ {e}
                    </span>
                  ))}
                  {app.capabilities.map((c) => (
                    <span
                      key={c}
                      className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-500 dark:bg-zinc-800"
                      title="koristi sposobnost"
                    >
                      ⚙ {c}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AUTOMATIZACIJE */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Automatizacije — &quot;kad ovo → onda ono&quot;
        </h2>
        <form
          action={createAutomation}
          className="mb-3 flex flex-wrap items-end gap-2 rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span className="text-sm text-zinc-500">Kada</span>
          <select
            name="trigger_type"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            {EVENT_TYPES.map((e) => (
              <option key={e.type} value={e.type}>
                {e.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-zinc-500">onda</span>
          <select
            name="action_type"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            {ACTION_TYPES.map((a) => (
              <option key={a.type} value={a.type}>
                {a.label}
              </option>
            ))}
          </select>
          <input
            name="text"
            placeholder="Tekst (naslov / predmet)"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white dark:bg-indigo-500 dark:text-white">
            Dodaj
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          {autoList.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white shadow-sm px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-black dark:text-zinc-50">
                Kada <b>{eventLabel(a.trigger_type)}</b> → {actionLabel(a.action_type)}
                {a.config?.text ? `: "${a.config.text}"` : ""}
              </span>
              <form action={toggleAutomation} className="ml-auto">
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="enabled" value={String(a.enabled)} />
                <button
                  className={`rounded px-2 py-0.5 text-xs ${
                    a.enabled
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                  }`}
                >
                  {a.enabled ? "uključeno" : "isključeno"}
                </button>
              </form>
              <form action={deleteAutomation}>
                <input type="hidden" name="id" value={a.id} />
                <button className="text-zinc-300 hover:text-red-600">✕</button>
              </form>
            </li>
          ))}
          {autoList.length === 0 && (
            <li className="py-3 text-center text-sm text-zinc-500">
              Nema automatizacija. Npr: kada &quot;Zadatak završen&quot; → &quot;Pošalji
              email domaćinstvu&quot;. (Prazno i nakon dodavanja? Pokreni migraciju 0009.)
            </li>
          )}
        </ul>
      </section>

      {/* EVENT FEED */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Nedavni događaji (event bus)
        </h2>
        <ul className="flex flex-col gap-1">
          {eventList.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-1.5 text-sm dark:bg-zinc-900"
            >
              <span className="text-black dark:text-zinc-50">
                <span className="text-zinc-500">{eventLabel(e.type)}:</span>{" "}
                {e.payload?.title ?? ""}
              </span>
              <span className="text-xs text-zinc-500">
                {new Date(e.created_at).toLocaleString("bs-BA")}
              </span>
            </li>
          ))}
          {eventList.length === 0 && (
            <li className="py-3 text-center text-sm text-zinc-500">
              Još nema događaja. Napravi/završi zadatak pa osvježi.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
