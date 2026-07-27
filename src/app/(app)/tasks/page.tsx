import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, User, ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold, canManage } from "@/lib/household";
import { toggleTask, deleteTask } from "./actions";
import TaskForm from "./task-form";
import { getT } from "@/lib/i18n-server";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_id: string | null;
  created_by: string | null;
};

const PRIORITY_CLS: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-600 dark:bg-[#2a2f39] dark:text-zinc-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const GROUP_KEYS = ["none", "assignee", "date"];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const group = (await searchParams).group ?? "none";
  const { household, members, userId, isOwner } = await getCurrentHousehold();
  const tr = await getT();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date, assignee_id, created_by")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const list = (tasks as Task[]) ?? [];
  const open = list.filter((t) => t.status !== "done");
  const done = list.filter((t) => t.status === "done");
  const today = new Date().toISOString().slice(0, 10);
  const nameOf = (id: string | null) => {
    const m = members.find((x) => x.user_id === id);
    return m?.profiles?.display_name ?? m?.profiles?.email ?? null;
  };

  // Grupisanje otvorenih zadataka.
  function grouped(): { label: string; tasks: Task[] }[] {
    if (group === "assignee") {
      const map = new Map<string, Task[]>();
      for (const t of open) {
        const label = nameOf(t.assignee_id) ?? tr("tasks.noAssignee");
        (map.get(label) ?? map.set(label, []).get(label)!).push(t);
      }
      return [...map.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([label, tasks]) => ({ label, tasks }));
    }
    if (group === "date") {
      const kLate = tr("tasks.bucket.late");
      const kToday = tr("tasks.bucket.today");
      const kUp = tr("tasks.bucket.upcoming");
      const kNo = tr("tasks.bucket.noDue");
      const buckets: Record<string, Task[]> = {
        [kLate]: [],
        [kToday]: [],
        [kUp]: [],
        [kNo]: [],
      };
      for (const t of open) {
        if (!t.due_date) buckets[kNo].push(t);
        else if (t.due_date < today) buckets[kLate].push(t);
        else if (t.due_date === today) buckets[kToday].push(t);
        else buckets[kUp].push(t);
      }
      return Object.entries(buckets)
        .filter(([, tasks]) => tasks.length > 0)
        .map(([label, tasks]) => ({ label, tasks }));
    }
    return [{ label: "", tasks: open }];
  }

  const groups = grouped();

  const Row = ({ t }: { t: Task }) => {
    const isDone = t.status === "done";
    const overdue = !isDone && t.due_date && t.due_date < today;
    const assignee = nameOf(t.assignee_id);
    const canEdit = canManage(t.created_by, userId, isOwner);
    return (
      <li className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-[#20242c]">
        {canEdit ? (
          <form action={toggleTask}>
            <input type="hidden" name="id" value={t.id} />
            <input type="hidden" name="done" value={String(isDone)} />
            <button
              title={isDone ? tr("tasks.markUndone") : tr("tasks.markDone")}
              className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs transition active:scale-90 ${
                isDone
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-zinc-300 hover:border-indigo-500 dark:border-zinc-600"
              }`}
            >
              {isDone ? "✓" : ""}
            </button>
          </form>
        ) : (
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs ${
              isDone
                ? "border-green-600 bg-green-600 text-white"
                : "border-zinc-300 dark:border-zinc-600"
            }`}
          >
            {isDone ? "✓" : ""}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p
            className={`truncate font-medium ${
              isDone
                ? "text-zinc-400 line-through"
                : "text-zinc-900 dark:text-zinc-50"
            }`}
          >
            {t.title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLS[t.priority]}`}
            >
              {tr(`tasks.prio.${t.priority}`)}
            </span>
            {t.due_date && (
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  overdue
                    ? "font-medium text-red-600"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                {t.due_date}
                {overdue && ` · ${tr("tasks.overdue")}`}
              </span>
            )}
            {assignee && (
              <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <User className="h-3.5 w-3.5" />
                {assignee}
              </span>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
            <TaskForm members={members} task={t} />
            <form action={deleteTask}>
              <input type="hidden" name="id" value={t.id} />
              <button
                title={tr("common.delete")}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
              >
                ✕
              </button>
            </form>
          </div>
        )}
      </li>
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {tr("tasks.title")}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tr("tasks.active", { n: open.length })} · {household?.name}
          </p>
        </div>
        <TaskForm members={members} />
      </header>

      {/* Grupisanje */}
      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 text-sm shadow-sm dark:border-zinc-800 dark:bg-[#20242c] sm:w-fit">
        {GROUP_KEYS.map((g) => {
          const active = group === g;
          return (
            <Link
              key={g}
              href={`/tasks?group=${g}`}
              className={`rounded-md px-3 py-1.5 transition ${
                active
                  ? "bg-indigo-600 font-medium text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {tr(`tasks.group.${g}`)}
            </Link>
          );
        })}
      </div>

      {list.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white/50 py-16 text-center dark:border-zinc-700 dark:bg-[#20242c]/40">
          <ListChecks className="h-8 w-8 text-zinc-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tr("tasks.empty")}
          </p>
        </div>
      )}

      {open.length > 0 &&
        groups.map((grp) => (
          <section key={grp.label} className="flex flex-col gap-2">
            {grp.label && (
              <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                {grp.label} ({grp.tasks.length})
              </h2>
            )}
            <ul className="flex flex-col gap-2">
              {grp.tasks.map((t) => (
                <Row key={t.id} t={t} />
              ))}
            </ul>
          </section>
        ))}

      {done.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {tr("tasks.done")} ({done.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {done.map((t) => (
              <Row key={t.id} t={t} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
