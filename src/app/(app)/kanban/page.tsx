import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Board, { type KanbanTask } from "./board";

export default async function KanbanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, priority, due_date, status")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
          Kanban
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Isti zadaci kao na stranici Zadaci — prevuci kartice između kolona.
        </p>
      </header>

      <Board initial={(tasks as KanbanTask[]) ?? []} />
    </main>
  );
}
