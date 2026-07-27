import { redirect } from "next/navigation";
import { StickyNote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold, canManage } from "@/lib/household";
import { getT } from "@/lib/i18n-server";
import { deleteNote } from "./actions";
import NoteForm from "./note-form";

type Note = {
  id: string;
  kind: string;
  title: string | null;
  body: string | null;
  tags: string[];
  created_at: string;
  created_by: string | null;
};
type LinkRow = {
  source_id: string;
  target_type: string;
  target_id: string;
  created_by: string | null;
};

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { userId, isOwner } = await getCurrentHousehold();
  const tr = await getT();

  const [{ data: notes }, { data: tasks }, { data: events }, { data: links }] =
    await Promise.all([
      supabase
        .from("notes")
        .select("id, kind, title, body, tags, created_at, created_by")
        .order("created_at", { ascending: false }),
      supabase.from("tasks").select("id, title"),
      supabase.from("calendar_events").select("id, title"),
      supabase
        .from("links")
        .select("source_id, target_type, target_id, created_by")
        .eq("source_type", "note"),
    ]);

  const noteList = (notes as Note[]) ?? [];
  const taskMap = new Map((tasks ?? []).map((t) => [t.id, t.title]));
  const eventMap = new Map((events ?? []).map((e) => [e.id, e.title]));

  // note.id -> lista labela povezanih objekata
  const linksByNote = new Map<string, { type: string; label: string }[]>();
  ((links as LinkRow[]) ?? []).forEach((l) => {
    const label =
      l.target_type === "task"
        ? taskMap.get(l.target_id)
        : eventMap.get(l.target_id);
    if (!label) return;
    const arr = linksByNote.get(l.source_id) ?? [];
    arr.push({ type: l.target_type, label });
    linksByNote.set(l.source_id, arr);
  });

  const taskOpts = (tasks ?? []).map((t) => ({ id: t.id, title: t.title }));
  const eventOpts = (events ?? []).map((e) => ({ id: e.id, title: e.title }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {tr("notes.title")}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tr("notes.count", { n: noteList.length })}
          </p>
        </div>
        <NoteForm tasks={taskOpts} events={eventOpts} />
      </header>

      {noteList.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white/50 py-16 text-center dark:border-zinc-700 dark:bg-[#20242c]/40">
          <StickyNote className="h-8 w-8 text-zinc-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tr("notes.empty")}
          </p>
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {noteList.map((n) => {
          const noteLinks = linksByNote.get(n.id) ?? [];
          const canEdit = canManage(n.created_by, userId, isOwner);
          return (
            <li
              key={n.id}
              className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-[#20242c]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {n.kind === "journal" && (
                    <span className="mb-1 mr-2 inline-block rounded bg-purple-100 px-1.5 py-0.5 text-[11px] font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      {tr("notes.journalBadge")}
                    </span>
                  )}
                  {n.title && (
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {n.title}
                    </p>
                  )}
                  {n.body && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">
                      {n.body}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    {n.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-600 dark:bg-[#2a2f39] dark:text-zinc-300"
                      >
                        #{tag}
                      </span>
                    ))}
                    {noteLinks.map((l, i) => (
                      <span
                        key={i}
                        className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      >
                        🔗{" "}
                        {l.type === "task"
                          ? tr("notes.linkTask")
                          : tr("notes.linkEvent")}
                        : {l.label}
                      </span>
                    ))}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 items-center opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                    <NoteForm note={n} />
                    <form action={deleteNote}>
                      <input type="hidden" name="id" value={n.id} />
                      <button
                        title={tr("common.delete")}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
