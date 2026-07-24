import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eventLabel } from "@/lib/platform";

type MemberRow = {
  role: string;
  profiles: { display_name: string | null; email: string | null } | null;
};
type ActEvent = {
  id: string;
  type: string;
  payload: { title?: string };
  created_at: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const in7 = new Date(now.getTime() + 7 * 86400000);
  const week = `${in7.getFullYear()}-${pad(in7.getMonth() + 1)}-${pad(in7.getDate())}`;
  const in24hISO = new Date(now.getTime() + 86400000).toISOString();

  const [
    { data: households },
    { data: dueTasks },
    { data: todayEvents },
    { data: soonBills },
    { data: dueReminders },
    { data: recentEvents },
  ] = await Promise.all([
    supabase.from("households").select("id, name").order("created_at").limit(1),
    supabase
      .from("tasks")
      .select("id, title, due_date, priority")
      .neq("status", "done")
      .lte("due_date", today)
      .order("due_date", { ascending: true }),
    supabase
      .from("calendar_events")
      .select("id, title, start_time")
      .eq("event_date", today)
      .order("start_time", { ascending: true }),
    supabase
      .from("bills")
      .select("id, name, amount, due_date")
      .gte("due_date", today)
      .lte("due_date", week)
      .order("due_date", { ascending: true }),
    supabase
      .from("reminders")
      .select("id, title, remind_at")
      .eq("status", "pending")
      .lte("remind_at", in24hISO)
      .order("remind_at", { ascending: true }),
    supabase
      .from("app_events")
      .select("id, type, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const household = households?.[0] ?? null;

  let members: MemberRow[] = [];
  if (household) {
    const { data } = await supabase
      .from("household_members")
      .select("role, profiles(display_name, email)")
      .eq("household_id", household.id);
    members = (data as unknown as MemberRow[]) ?? [];
  }

  const money = (n: number) =>
    new Intl.NumberFormat("bs-BA", { minimumFractionDigits: 2 }).format(n) + " KM";
  const timeOf = (iso: string) => {
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const Card = ({
    title,
    href,
    empty,
    children,
  }: {
    title: string;
    href: string;
    empty: boolean;
    children: React.ReactNode;
  }) => (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm p-5 dark:border-zinc-800 dark:bg-[#20242c]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          {title}
        </h2>
        <Link href={href} className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-indigo-600">
          otvori →
        </Link>
      </div>
      {empty ? (
        <p className="py-2 text-sm text-zinc-500 dark:text-zinc-400">Ništa za sad 🎉</p>
      ) : (
        <ul className="flex flex-col gap-1.5 text-sm">{children}</ul>
      )}
    </section>
  );

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50">Danas</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {now.toLocaleDateString("bs-BA", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          title="Zadaci — dospjeli / danas"
          href="/tasks"
          empty={!dueTasks?.length}
        >
          {dueTasks?.map((t) => {
            const overdue = t.due_date < today;
            return (
              <li key={t.id} className="flex items-center justify-between gap-2">
                <span className="text-black dark:text-zinc-50">{t.title}</span>
                <span
                  className={`text-xs ${overdue ? "font-medium text-red-600" : "text-zinc-500"}`}
                >
                  {overdue ? "⚠ " : ""}
                  {t.due_date}
                </span>
              </li>
            );
          })}
        </Card>

        <Card
          title="Danas u kalendaru"
          href="/calendar"
          empty={!todayEvents?.length}
        >
          {todayEvents?.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2">
              <span className="text-black dark:text-zinc-50">{e.title}</span>
              {e.start_time && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {String(e.start_time).slice(0, 5)}
                </span>
              )}
            </li>
          ))}
        </Card>

        <Card
          title="Računi — narednih 7 dana"
          href="/finance"
          empty={!soonBills?.length}
        >
          {soonBills?.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-2">
              <span className="text-black dark:text-zinc-50">{b.name}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {money(Number(b.amount))} · {b.due_date}
              </span>
            </li>
          ))}
        </Card>

        <Card
          title="Podsjetnici — uskoro"
          href="/reminders"
          empty={!dueReminders?.length}
        >
          {dueReminders?.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2">
              <span className="text-black dark:text-zinc-50">{r.title}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{timeOf(r.remind_at)}</span>
            </li>
          ))}
        </Card>
      </div>

      {/* Domaćinstvo */}
      <section className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-[#20242c]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Domaćinstvo
          </h2>
          <Link
            href="/members"
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-indigo-600"
          >
            članovi / pozovi →
          </Link>
        </div>
        {household ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-black dark:text-zinc-50">
              {household.name}
            </span>
            {members.map((m, i) => (
              <span
                key={i}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-[#2a2f39] dark:text-zinc-300"
              >
                {m.profiles?.display_name ?? m.profiles?.email} · {m.role}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Nema domaćinstva. Pokreni migraciju 0001.
          </p>
        )}
      </section>

      {/* Nedavna aktivnost */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#20242c]">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Nedavna aktivnost
        </h2>
        {((recentEvents as ActEvent[]) ?? []).length === 0 ? (
          <p className="py-2 text-sm text-zinc-500 dark:text-zinc-400">
            Još nema aktivnosti. Kad neko doda zadatak, račun ili bilješku,
            pojaviće se ovdje.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {((recentEvents as ActEvent[]) ?? []).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2">
                <span className="text-zinc-800 dark:text-zinc-100">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {eventLabel(e.type)}:
                  </span>{" "}
                  {e.payload?.title ?? ""}
                </span>
                <span className="shrink-0 text-xs text-zinc-400">
                  {new Date(e.created_at).toLocaleString("bs-BA")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
