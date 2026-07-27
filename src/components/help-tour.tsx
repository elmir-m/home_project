"use client";

import { useEffect, useState } from "react";
import { HelpCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import { useT } from "@/components/locale-provider";

const SEEN_KEY = "tourSeenV1";

// slug (ikona) + prefiks ključa u rječniku (.t naslov, .b tekst)
const STEPS: { slug: string; k: string }[] = [
  { slug: "dashboard", k: "help.s1" },
  { slug: "dashboard", k: "help.s2" },
  { slug: "tasks", k: "help.s3" },
  { slug: "calendar", k: "help.s4" },
  { slug: "finance", k: "help.s5" },
  { slug: "reminders", k: "help.s6" },
  { slug: "chat", k: "help.s7" },
  { slug: "members", k: "help.s8" },
  { slug: "settings", k: "help.s9" },
];

export function HelpButton() {
  const t = useT();
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-help-tour"))}
      title={t("topbar.help")}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <HelpCircle className="h-4.5 w-4.5" strokeWidth={1.75} />
    </button>
  );
}

export default function HelpTour() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    // Auto-otvori na prvi put.
    try {
      if (localStorage.getItem(SEEN_KEY) !== "1") setOpen(true);
    } catch {}
    const onOpen = () => {
      setI(0);
      setOpen(true);
    };
    window.addEventListener("open-help-tour", onOpen);
    return () => window.removeEventListener("open-help-tour", onOpen);
  }, []);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }

  if (!open) return null;

  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#20242c]">
        <button
          onClick={close}
          title={t("common.close")}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <AppIcon slug={step.slug} className="h-6 w-6" />
        </span>

        <h2 className="text-lg font-bold text-black dark:text-zinc-50">
          {t(`${step.k}.t`)}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {t(`${step.k}.b`)}
        </p>

        {/* Tačkice */}
        <div className="mt-5 flex justify-center gap-1.5">
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? "w-5 bg-indigo-600" : "w-1.5 bg-zinc-300 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setI((v) => Math.max(0, v - 1))}
            disabled={i === 0}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-zinc-600 disabled:opacity-40 dark:text-zinc-300"
          >
            <ChevronLeft className="h-4 w-4" /> {t("help.back")}
          </button>

          {last ? (
            <button
              onClick={close}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t("help.finish")}
            </button>
          ) : (
            <button
              onClick={() => setI((v) => Math.min(STEPS.length - 1, v + 1))}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t("help.next")} <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={close}
          className="mt-3 w-full text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          {t("help.skip")}
        </button>
      </div>
    </div>
  );
}
