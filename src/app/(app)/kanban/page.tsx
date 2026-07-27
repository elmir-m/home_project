import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold, canManage } from "@/lib/household";
import { getT } from "@/lib/i18n-server";
import Board, { type KanbanTask } from "./board";

type TaskRow = {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  status: string;
  created_by: string | null;
};

export default async function KanbanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { userId, isOwner } = await getCurrentHousehold();
  const t = await getT();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, priority, due_date, status, created_by")
    .order("created_at", { ascending: false });

  const cards: KanbanTask[] = ((tasks as TaskRow[]) ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    due_date: t.due_date,
    status: t.status,
    canEdit: canManage(t.created_by, userId, isOwner),
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
          {t("app.kanban")}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("kanban.subtitle")}
        </p>
      </header>

      <Board initial={cards} />
    </main>
  );
}
