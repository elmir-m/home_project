import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../login/actions";

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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
          Dashboard
        </h1>
        <form action={logout}>
          <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800">
            Odjava
          </button>
        </form>
      </header>

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
    </main>
  );
}
