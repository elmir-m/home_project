import { Search, LogOut } from "lucide-react";
import QuickCapture from "@/components/quick-capture";
import ThemeToggle from "@/components/theme-toggle";
import { logout } from "@/app/login/actions";

// Gornja traka: pretraga (lijevo) + tema, brzi upis, odjava (desno).
export default function TopBar() {
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

      <ThemeToggle />
      <QuickCapture />

      <form action={logout}>
        <button
          title="Odjava"
          className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Odjava</span>
        </button>
      </form>
    </header>
  );
}
