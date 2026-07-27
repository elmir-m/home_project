import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import EventForm from "./event-form";

const MONTHS = [
  "Januar", "Februar", "Mart", "April", "Maj", "Juni",
  "Juli", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
];
const WEEKDAYS = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

type EventRow = { id: string; title: string; event_date: string; start_time: string | null };
type TaskRow = { id: string; title: string; due_date: string; status: string };
type BillRow = { id: string; name: string; due_date: string; amount: number };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { household } = await getCurrentHousehold();

  // Odredi mjesec (iz ?month=YYYY-MM ili trenutni).
  const now = new Date();
  const param = (await searchParams).month;
  let year = now.getFullYear();
  let month = now.getMonth();
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [py, pm] = param.split("-").map(Number);
    year = py;
    month = pm - 1;
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Pon = 0
  const first = ymd(year, month, 1);
  const last = ymd(year, month, daysInMonth);
  const todayStr = ymd(now.getFullYear(), now.getMonth(), now.getDate());

  const prev = month === 0 ? `${year - 1}-12` : `${year}-${pad(month)}`;
  const next = month === 11 ? `${year + 1}-01` : `${year}-${pad(month + 2)}`;

  // Događaji + zadaci s rokom u ovom mjesecu.
  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, event_date, start_time")
    .gte("event_date", first)
    .lte("event_date", last);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, status")
    .gte("due_date", first)
    .lte("due_date", last);

  const { data: bills } = await supabase
    .from("bills")
    .select("id, name, due_date, amount")
    .gte("due_date", first)
    .lte("due_date", last);

  // Grupiši po danu.
  const byDay: Record<
    string,
    { events: EventRow[]; tasks: TaskRow[]; bills: BillRow[] }
  > = {};
  for (let d = 1; d <= daysInMonth; d++)
    byDay[ymd(year, month, d)] = { events: [], tasks: [], bills: [] };
  (events as EventRow[])?.forEach((e) => byDay[e.event_date]?.events.push(e));
  (tasks as TaskRow[])?.forEach((t) => byDay[t.due_date]?.tasks.push(t));
  (bills as BillRow[])?.forEach((b) => byDay[b.due_date]?.bills.push(b));

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-black sm:text-3xl dark:text-zinc-50">
          {MONTHS[month]} {year}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?month=${prev}`}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ←
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Danas
          </Link>
          <Link
            href={`/calendar?month=${next}`}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            →
          </Link>
          <EventForm defaultDate={first} />
        </div>
      </header>

      {/* Mreža — na mobilnom klizi horizontalno; vertikalno kliza stranica. */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="grid min-w-[680px] grid-cols-7 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-[#2a2f39]">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="bg-zinc-50 py-2.5 text-center text-sm font-semibold text-zinc-600 dark:bg-[#20242c] dark:text-zinc-300"
          >
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null)
            return <div key={i} className="min-h-24 sm:min-h-32 bg-white dark:bg-[#191c23]" />;
          const key = ymd(year, month, day);
          const cell = byDay[key];
          const isToday = key === todayStr;
          return (
            <div
              key={i}
              className="min-h-24 sm:min-h-32 bg-white p-2 dark:bg-[#191c23]"
            >
              <div
                className={`mb-1.5 text-sm font-medium ${
                  isToday
                    ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-bold text-white dark:bg-indigo-500"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {day}
              </div>
              <div className="flex flex-col gap-1">
                {cell.events.map((e) => (
                  <EventForm key={e.id} event={e} />
                ))}
                {cell.tasks.map((t) => (
                  <div
                    key={t.id}
                    title="Zadatak s rokom"
                    className={`truncate rounded px-1 py-0.5 text-xs ${
                      t.status === "done"
                        ? "bg-zinc-100 text-zinc-500 line-through dark:bg-[#20242c]"
                        : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                    }`}
                  >
                    ✓ {t.title}
                  </div>
                ))}
                {cell.bills.map((b) => (
                  <div
                    key={b.id}
                    title="Račun dospijeva"
                    className="truncate rounded bg-orange-100 px-1 py-0.5 text-xs text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                  >
                    💳 {b.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        <span className="rounded bg-blue-100 px-1 dark:bg-blue-950">plavo</span>{" "}
        = događaji ·{" "}
        <span className="rounded bg-green-100 px-1 dark:bg-green-950">
          zeleno
        </span>{" "}
        = zadaci ·{" "}
        <span className="rounded bg-orange-100 px-1 dark:bg-orange-950">
          narandžasto
        </span>{" "}
        = računi (sve automatski) · klik na događaj za uređivanje
        {household ? "" : " · pokreni migraciju 0003"}
      </p>
    </main>
  );
}
