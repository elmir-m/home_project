import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type MemberRow = {
  role: string;
  profiles: { display_name: string | null; email: string | null } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Domaćinstvo (RLS vraća samo domaćinstva kojima korisnik pripada).
  const { data: households } = await supabase
    .from("households")
    .select("id, name")
    .order("created_at", { ascending: true });

  const household = households?.[0] ?? null;

  // Članovi tog domaćinstva.
  let members: MemberRow[] = [];
  if (household) {
    const { data } = await supabase
      .from("household_members")
      .select("role, profiles(display_name, email)")
      .eq("household_id", household.id);
    members = (data as unknown as MemberRow[]) ?? [];
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
        Dashboard
      </h1>

      <p className="text-sm text-zinc-500">
        Prijavljen kao{" "}
        <span className="font-medium text-black dark:text-zinc-50">
          {user.email}
        </span>
      </p>

      <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Domaćinstvo
        </h2>
        {household ? (
          <>
            <p className="mt-1 text-xl font-semibold text-black dark:text-zinc-50">
              {household.name}
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {members.map((m, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900"
                >
                  <span className="text-black dark:text-zinc-50">
                    {m.profiles?.display_name ?? m.profiles?.email ?? "?"}
                  </span>
                  <span className="text-xs text-zinc-400">{m.role}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-1 text-sm text-zinc-500">
            Nema domaćinstva. Pokreni migraciju 0001 u Supabase (SQL Editor).
          </p>
        )}
      </section>

      <nav className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Link
          href="/tasks"
          className="rounded-xl border border-zinc-200 p-4 text-sm font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          ✅ Zadaci
        </Link>
        <Link
          href="/kanban"
          className="rounded-xl border border-zinc-200 p-4 text-sm font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          📋 Kanban
        </Link>
        <Link
          href="/calendar"
          className="rounded-xl border border-zinc-200 p-4 text-sm font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          📅 Kalendar
        </Link>
        <Link
          href="/notes"
          className="rounded-xl border border-zinc-200 p-4 text-sm font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          📝 Bilješke
        </Link>
        <Link
          href="/finance"
          className="rounded-xl border border-zinc-200 p-4 text-sm font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          💰 Finansije
        </Link>
      </nav>
    </main>
  );
}
