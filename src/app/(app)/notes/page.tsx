import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { createNote, deleteNote } from "./actions";

type Note = {
  id: string;
  kind: string;
  title: string | null;
  body: string | null;
  tags: string[];
  created_at: string;
};
type LinkRow = {
  source_id: string;
  target_type: string;
  target_id: string;
};

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { household } = await getCurrentHousehold();

  const [{ data: notes }, { data: tasks }, { data: events }, { data: links }] =
    await Promise.all([
      supabase
        .from("notes")
        .select("id, kind, title, body, tags, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("tasks").select("id, title"),
      supabase.from("calendar_events").select("id, title"),
      supabase
        .from("links")
        .select("source_id, target_type, target_id")
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

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
        Bilješke
      </h1>

      <form
        action={createNote}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-[#20242c]"
      >
        <input
          name="title"
          placeholder="Naslov (opciono)"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
        />
        <textarea
          name="body"
          rows={3}
          placeholder="Sadržaj…"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
        />
        <input
          name="tags"
          placeholder="Tagovi, odvojeni zarezom (npr. kuća, hitno)"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
        />
        <div className="flex flex-wrap gap-3">
          <select
            name="kind"
            defaultValue="note"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
          >
            <option value="note">Bilješka</option>
            <option value="journal">Dnevnik</option>
          </select>
          <select
            name="link"
            defaultValue=""
            className="min-w-40 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
          >
            <option value="">Poveži sa… (opciono)</option>
            {(tasks ?? []).length > 0 && (
              <optgroup label="Zadaci">
                {(tasks ?? []).map((t) => (
                  <option key={t.id} value={`task:${t.id}`}>
                    {t.title}
                  </option>
                ))}
              </optgroup>
            )}
            {(events ?? []).length > 0 && (
              <optgroup label="Događaji">
                {(events ?? []).map((e) => (
                  <option key={e.id} value={`event:${e.id}`}>
                    {e.title}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white">
            Sačuvaj
          </button>
        </div>
      </form>

      <ul className="flex flex-col gap-3">
        {noteList.length === 0 && (
          <li className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Nema bilješki. (Ako ostane prazno, pokreni migraciju 0004.)
          </li>
        )}
        {noteList.map((n) => {
          const noteLinks = linksByNote.get(n.id) ?? [];
          return (
            <li
              key={n.id}
              className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-[#20242c]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {n.kind === "journal" && (
                    <span className="mr-2 rounded bg-purple-100 px-1.5 py-0.5 text-[11px] text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      dnevnik
                    </span>
                  )}
                  {n.title && (
                    <span className="font-semibold text-black dark:text-zinc-50">
                      {n.title}
                    </span>
                  )}
                  {n.body && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-500">
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
                        🔗 {l.type === "task" ? "Zadatak" : "Događaj"}: {l.label}
                      </span>
                    ))}
                  </div>
                </div>
                <form action={deleteNote}>
                  <input type="hidden" name="id" value={n.id} />
                  <button
                    title="Obriši"
                    className="text-zinc-300 hover:text-red-600"
                  >
                    ✕
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
