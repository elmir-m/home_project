"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, X } from "lucide-react";
import { BUILTIN_APPS } from "@/lib/apps";
import { AppIcon } from "@/components/app-icon";
import { useT } from "@/components/locale-provider";

type Item = { href: string; label: string; slug: string };

// Hamburger + klizni meni za mobilne uređaje (skriveno na md+ gdje je sidebar).
// `children` = pomoćne kontrole (jezik, tema, pomoć, odjava) prikazane u podnožju.
export default function MobileNav({
  hidden = [],
  children,
}: {
  hidden?: string[];
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal se renderuje tek na klijentu (nema document tokom SSR).
  useEffect(() => {
    setMounted(true);
  }, []);

  // Zatvori pri promjeni rute.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Zaključaj scroll pozadine dok je meni otvoren.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const groups: { label: string | null; items: Item[] }[] = [
    {
      label: null,
      items: [
        { href: "/dashboard", label: t("nav.dashboard"), slug: "dashboard" },
        ...BUILTIN_APPS.filter((a) => !hidden.includes(a.slug)).map((a) => ({
          href: a.href,
          label: t(`app.${a.slug}`),
          slug: a.slug,
        })),
      ],
    },
    {
      label: t("group.admin"),
      items: [
        { href: "/members", label: t("nav.members"), slug: "members" },
        { href: "/apps", label: t("nav.apps"), slug: "apps" },
        { href: "/automations", label: t("nav.automations"), slug: "automations" },
      ],
    },
    {
      label: t("group.settings"),
      items: [
        { href: "/profile", label: t("nav.profile"), slug: "profile" },
        { href: "/settings", label: t("nav.settings"), slug: "settings" },
      ],
    },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Meni"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 md:hidden dark:border-zinc-700 dark:text-zinc-300"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[60] md:hidden">
          {/* Zatamnjenje */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-[#1b1f29] px-3 py-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                  <Home className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="text-[15px] font-semibold tracking-tight">
                  Moj dom
                </span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                title="Zatvori"
                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
              {groups.map((group, gi) => (
                <div key={gi} className={gi > 0 ? "mt-4" : ""}>
                  {group.label && (
                    <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      {group.label}
                    </p>
                  )}
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((l) => {
                      const active = pathname === l.href;
                      return (
                        <Link
                          key={l.href}
                          href={l.href}
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
                          <span>{l.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {children && (
              <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
                {children}
              </div>
            )}
          </aside>
        </div>,
          document.body,
        )}
    </>
  );
}
