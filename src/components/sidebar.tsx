"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const LINKS = [
  { href: "/dashboard", label: "Danas", icon: "🏠" },
  { href: "/tasks", label: "Zadaci", icon: "✅" },
  { href: "/kanban", label: "Kanban", icon: "📋" },
  { href: "/calendar", label: "Kalendar", icon: "📅" },
  { href: "/notes", label: "Bilješke", icon: "📝" },
  { href: "/finance", label: "Finansije", icon: "💰" },
  { href: "/reminders", label: "Podsjetnici", icon: "🔔" },
  { href: "/life", label: "Life admin", icon: "🗂️" },
  { href: "/apps", label: "Aplikacije", icon: "🧩" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-16 flex-col bg-[#151823] px-2 py-4 text-zinc-300 md:w-60 md:px-3">
      <Link
        href="/dashboard"
        className="mb-6 flex items-center gap-2 px-2 text-white"
      >
        <span className="text-xl">🏡</span>
        <span className="hidden text-lg font-bold md:inline">Home OS</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              title={l.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-indigo-600 font-medium text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-base">{l.icon}</span>
              <span className="hidden md:inline">{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <form action={logout} className="mt-2 border-t border-white/10 pt-3">
        <button
          title="Odjava"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <span className="text-base">🚪</span>
          <span className="hidden md:inline">Odjava</span>
        </button>
      </form>
    </aside>
  );
}
