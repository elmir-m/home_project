"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { BUILTIN_APPS } from "@/lib/apps";
import { AppIcon } from "@/components/app-icon";

type Item = { href: string; label: string; slug: string };

export default function Sidebar({ hidden = [] }: { hidden?: string[] }) {
  const pathname = usePathname();

  // Meni grupisan: aplikacije / administracija / postavke.
  const groups: { label: string | null; items: Item[] }[] = [
    {
      label: null,
      items: [
        { href: "/dashboard", label: "Danas", slug: "dashboard" },
        ...BUILTIN_APPS.filter((a) => !hidden.includes(a.slug)).map((a) => ({
          href: a.href,
          label: a.name,
          slug: a.slug,
        })),
      ],
    },
    {
      label: "Administracija",
      items: [
        { href: "/members", label: "Članovi", slug: "members" },
        { href: "/apps", label: "Aplikacije", slug: "apps" },
        { href: "/automations", label: "Automatizacije", slug: "automations" },
      ],
    },
    {
      label: "Postavke",
      items: [{ href: "/settings", label: "Postavke", slug: "settings" }],
    },
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

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-4" : ""}>
            {group.label ? (
              <p className="mb-1 hidden px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 md:block">
                {group.label}
              </p>
            ) : (
              gi > 0 && <div className="mx-3 mb-3 h-px bg-white/10" />
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((l) => {
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
                    <AppIcon
                      slug={l.slug}
                      className="h-[18px] w-[18px] shrink-0"
                    />
                    <span className="hidden md:inline">{l.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
