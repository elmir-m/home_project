"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import QuickCapture from "@/components/quick-capture";

const LINKS = [
  { href: "/dashboard", label: "Danas" },
  { href: "/tasks", label: "Zadaci" },
  { href: "/kanban", label: "Kanban" },
  { href: "/calendar", label: "Kalendar" },
  { href: "/notes", label: "Bilješke" },
  { href: "/finance", label: "Finansije" },
  { href: "/reminders", label: "Podsjetnici" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-2">
        <Link href="/dashboard" className="mr-2 font-bold text-black dark:text-zinc-50">
          Home OS
        </Link>
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-black"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              {l.label}
            </Link>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <form action="/search" className="hidden sm:block">
            <input
              name="q"
              placeholder="Traži…"
              className="w-36 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:w-52 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </form>
          <QuickCapture />
          <form action={logout}>
            <button className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900">
              Odjava
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
