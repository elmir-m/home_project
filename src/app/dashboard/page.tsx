import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sigurnosna provjera (middleware već štiti, ovo je dodatni sloj).
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8 text-center dark:bg-black">
      <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
        Dashboard
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Prijavljen si kao{" "}
        <span className="font-medium text-black dark:text-zinc-50">
          {user.email}
        </span>
      </p>

      <form action={logout}>
        <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800">
          Odjava
        </button>
      </form>
    </main>
  );
}
