import QuickCapture from "@/components/quick-capture";

// Gornja traka unutar glavnog sadržaja: pretraga + brzi unos.
export default function TopBar() {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-200 bg-white/70 px-6 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
      <form action="/search" className="flex-1">
        <input
          name="q"
          placeholder="Traži kroz sve…"
          className="w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </form>
      <QuickCapture />
    </header>
  );
}
