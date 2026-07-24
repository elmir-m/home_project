"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { BUILTIN_APPS } from "@/lib/apps";
import { AppIcon } from "@/components/app-icon";

export default function Sidebar({ hidden = [] }: { hidden?: string[] }) {
  const pathname = usePathname();

  // Navigacija se izvodi iz manifesta; deinstalirane aplikacije se izostave.
  const links = [
    { href: "/dashboard", label: "Danas", slug: "dashboard" },
    ...BUILTIN_APPS.filter((a) => !hidden.includes(a.slug)).map((a) => ({
      href: a.href,
      label: a.name,
      slug: a.slug,
    })),
    { href: "/apps", label: "Aplikacije", slug: "apps" },
    { href: "/settings", label: "Postavke", slug: "settings" },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-16 flex-col border-r border-zinc-800/60 bg-[#12141c] px-2 py-4 md:w-60 md:px-3">
      <Link
        href="/dashboard"
        className="mb-6 flex items-center gap-2.5 px-2 text-white"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Home className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="hidden text-[15px] font-semibold tracking-tight md:inline">
          Moj dom
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5">
        {links.map((l) => {
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
              <AppIcon slug={l.slug} className="h-[18px] w-[18px] shrink-0" />
              <span className="hidden md:inline">{l.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
