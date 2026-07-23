import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Hit = { label: string; sub?: string; href: string };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const q = ((await searchParams).q ?? "").trim();

  const groups: { title: string; hits: Hit[] }[] = [];

  if (q) {
    const like = `%${q}%`;
    const [tasks, notes, events, bills, reminders] = await Promise.all([
      supabase.from("tasks").select("id, title, notes").or(`title.ilike.${like},notes.ilike.${like}`).limit(10),
      supabase.from("notes").select("id, title, body").or(`title.ilike.${like},body.ilike.${like}`).limit(10),
      supabase.from("calendar_events").select("id, title, event_date").ilike("title", like).limit(10),
      supabase.from("bills").select("id, name, amount").ilike("name", like).limit(10),
      supabase.from("reminders").select("id, title").ilike("title", like).limit(10),
    ]);

    groups.push({
      title: "Zadaci",
      hits: (tasks.data ?? []).map((t) => ({
        label: t.title,
        sub: t.notes ?? undefined,
        href: "/tasks",
      })),
    });
    groups.push({
      title: "Bilješke",
      hits: (notes.data ?? []).map((n) => ({
        label: n.title ?? "(bez naslova)",
        sub: n.body ?? undefined,
        href: "/notes",
      })),
    });
    groups.push({
      title: "Događaji",
      hits: (events.data ?? []).map((e) => ({
        label: e.title,
        sub: e.event_date,
        href: "/calendar",
      })),
    });
    groups.push({
      title: "Računi",
      hits: (bills.data ?? []).map((b) => ({
        label: b.name,
        sub: `${b.amount} KM`,
        href: "/finance",
      })),
    });
    groups.push({
      title: "Podsjetnici",
      hits: (reminders.data ?? []).map((r) => ({
        label: r.title,
        href: "/reminders",
      })),
    });
  }

  const total = groups.reduce((s, g) => s + g.hits.length, 0);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold text-black dark:text-zinc-50">Pretraga</h1>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Traži kroz sve module…"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white">
          Traži
        </button>
      </form>

      {q && (
        <p className="text-sm text-zinc-400">
          {total} rezultata za &quot;{q}&quot;
        </p>
      )}

      <div className="flex flex-col gap-5">
        {groups
          .filter((g) => g.hits.length > 0)
          .map((g) => (
            <section key={g.title}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {g.title}
              </h2>
              <ul className="flex flex-col gap-1">
                {g.hits.map((h, i) => (
                  <li key={i}>
                    <Link
                      href={h.href}
                      className="block rounded-lg border border-zinc-200 bg-white shadow-sm px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-900"
                    >
                      <span className="text-black dark:text-zinc-50">{h.label}</span>
                      {h.sub && (
                        <span className="ml-2 truncate text-xs text-zinc-400">
                          {h.sub}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        {q && total === 0 && (
          <p className="py-8 text-center text-sm text-zinc-400">
            Nema rezultata.
          </p>
        )}
      </div>
    </main>
  );
}
