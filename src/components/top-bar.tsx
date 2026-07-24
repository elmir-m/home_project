import Link from "next/link";
import { Search, LogOut } from "lucide-react";
import QuickCapture from "@/components/quick-capture";
import ThemeToggle from "@/components/theme-toggle";
import { logout } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

// Gornja traka: pretraga (lijevo) + identitet, tema, brzi upis, odjava (desno).
export default async function TopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { household, members } = await getCurrentHousehold();
  const me = members.find((m) => m.user_id === user?.id);
  const name = me?.profiles?.display_name ?? user?.email ?? "";
  const email = user?.email ?? "";
  const role = me?.role === "owner" ? "vlasnik" : "član";
  const initial = (name || email).charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-200 bg-[var(--background)]/80 px-4 py-3 backdrop-blur sm:px-6 dark:border-zinc-800">
      <form action="/search" className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          name="q"
          placeholder="Traži kroz sve…"
          className="w-full max-w-md rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
        />
      </form>

      {/* Identitet prijavljenog korisnika (klik → profil) */}
      <Link
        href="/profile"
        title="Moj profil"
        className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-[#20242c] dark:hover:bg-[#2a2f39]"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
          {initial}
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {name}
          </span>
          <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
            {role}
            {household ? ` · ${household.name}` : ""}
          </span>
        </span>
      </Link>

      <ThemeToggle />
      <QuickCapture />

      <form action={logout}>
        <button
          title={`Odjava (${email})`}
          className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Odjava</span>
        </button>
      </form>
    </header>
  );
}
