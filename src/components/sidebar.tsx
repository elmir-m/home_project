"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PanelLeftClose, PanelLeft } from "lucide-react";
import { BUILTIN_APPS } from "@/lib/apps";
import { AppIcon } from "@/components/app-icon";

type Item = { href: string; label: string; slug: string };

export default function Sidebar({ hidden = [] }: { hidden?: string[] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("sb_collapsed") === "1");
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("sb_collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  };

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
      items: [
        { href: "/profile", label: "Moj profil", slug: "profile" },
        { href: "/settings", label: "Postavke", slug: "settings" },
      ],
    },
  ];

  // Klase za labele/naslove: kad je skupljeno — sakriveno; inače od md naviše.
  const labelCls = collapsed ? "hidden" : "hidden md:inline";
  const groupLabelCls = collapsed ? "hidden" : "hidden md:block";

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-r border-zinc-800/60 bg-[#1b1f29] px-2 py-4 transition-all ${
        collapsed ? "w-16" : "w-16 md:w-60 md:px-3"
      }`}
    >
      <div className="mb-6 flex items-center justify-between px-2">
        <Link href="/dashboard" className="flex items-center gap-2.5 text-white">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
            <Home className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className={`text-[15px] font-semibold tracking-tight ${labelCls}`}>
            Moj dom
          </span>
        </Link>
        <button
          onClick={toggle}
          title={collapsed ? "Proširi meni" : "Skupi meni"}
          className={`hidden h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-white md:flex ${
            collapsed ? "md:hidden" : ""
          }`}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Dugme za proširivanje kad je skupljeno */}
      {collapsed && (
        <button
          onClick={toggle}
          title="Proširi meni"
          className="mb-2 hidden h-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white md:flex"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      )}

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-4" : ""}>
            {group.label ? (
              <p
                className={`mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 ${groupLabelCls}`}
              >
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
                    <AppIcon slug={l.slug} className="h-[18px] w-[18px] shrink-0" />
                    <span className={labelCls}>{l.label}</span>
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
