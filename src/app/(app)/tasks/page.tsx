import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { createTask, toggleTask, deleteTask } from "./actions";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_id: string | null;
};

const PRIORITY_STYLE: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { household, members } = await getCurrentHousehold();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date, assignee_id")
    .order("status", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const list = (tasks as Task[]) ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const nameOf = (id: string | null) => {
    const m = members.find((x) => x.user_id === id);
    return m?.profiles?.display_name ?? m?.profiles?.email ?? null;
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
          Zadaci
        </h1>
        <span className="text-xs text-zinc-400">{household?.name}</span>
      </header>

      {/* Forma za dodavanje */}
      <form
        action={createTask}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <input
          name="title"
          required
          placeholder="Novi zadatak…"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <div className="flex flex-wrap gap-3">
          <select
            name="priority"
            defaultValue="medium"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="low">Nizak</option>
            <option value="medium">Srednji</option>
            <option value="high">Visok</option>
          </select>
          <input
            type="date"
            name="due_date"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <select
            name="assignee_id"
            defaultValue=""
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Bez zaduženja</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.profiles?.display_name ?? m.profiles?.email}
              </option>
            ))}
          </select>
          <button className="ml-auto rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200">
            Dodaj
          </button>
        </div>
      </form>

      {/* Lista */}
      <ul className="flex flex-col gap-2">
        {list.length === 0 && (
          <li className="py-8 text-center text-sm text-zinc-400">
            Nema zadataka. Dodaj prvi gore. (Ako je prazno i nakon dodavanja,
            pokreni migraciju 0002 u Supabase.)
          </li>
        )}
        {list.map((t) => {
          const done = t.status === "done";
          const overdue = !done && t.due_date && t.due_date < today;
          return (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              <form action={toggleTask}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="done" value={String(done)} />
                <button
                  title={done ? "Vrati u nezavršeno" : "Označi završeno"}
                  className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                    done
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-zinc-400"
                  }`}
                >
                  {done ? "✓" : ""}
                </button>
              </form>

              <div className="flex-1">
                <p
                  className={`text-sm ${
                    done
                      ? "text-zinc-400 line-through"
                      : "text-black dark:text-zinc-50"
                  }`}
                >
                  {t.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded px-1.5 py-0.5 ${PRIORITY_STYLE[t.priority]}`}
                  >
                    {t.priority}
                  </span>
                  {t.due_date && (
                    <span
                      className={
                        overdue
                          ? "font-medium text-red-600"
                          : "text-zinc-400"
                      }
                    >
                      {overdue ? "⚠ " : ""}
                      {t.due_date}
                    </span>
                  )}
                  {t.assignee_id && (
                    <span className="text-zinc-400">
                      👤 {nameOf(t.assignee_id)}
                    </span>
                  )}
                </div>
              </div>

              <form action={deleteTask}>
                <input type="hidden" name="id" value={t.id} />
                <button
                  title="Obriši"
                  className="text-zinc-300 hover:text-red-600"
                >
                  ✕
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
