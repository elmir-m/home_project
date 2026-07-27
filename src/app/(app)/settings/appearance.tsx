"use client";

import { useState, useTransition } from "react";
import { saveAppearance } from "./actions";

const FONTS: { key: string; label: string; sample: string }[] = [
  { key: "sm", label: "Mala", sample: "text-sm" },
  { key: "md", label: "Srednja", sample: "text-base" },
  { key: "lg", label: "Velika", sample: "text-xl" },
];

// value = ime palete (data-accent); swatch = boja kruga (600 nijansa).
const ACCENTS: { key: string; label: string; swatch: string }[] = [
  { key: "indigo", label: "Indigo", swatch: "#4f46e5" },
  { key: "blue", label: "Plava", swatch: "#2563eb" },
  { key: "violet", label: "Ljubičasta", swatch: "#7c3aed" },
  { key: "emerald", label: "Zelena", swatch: "#059669" },
  { key: "teal", label: "Tirkizna", swatch: "#0d9488" },
  { key: "rose", label: "Roze", swatch: "#e11d48" },
  { key: "amber", label: "Narandžasta", swatch: "#d97706" },
];

export default function Appearance({
  initialFont,
  initialAccent,
}: {
  initialFont: string;
  initialAccent: string;
}) {
  const [font, setFont] = useState(initialFont);
  const [accent, setAccent] = useState(initialAccent);
  const [saving, startSaving] = useTransition();

  function persist(nextFont: string, nextAccent: string) {
    startSaving(() => {
      saveAppearance(nextFont, nextAccent);
    });
  }

  function chooseFont(v: string) {
    setFont(v);
    document.documentElement.setAttribute("data-font", v);
    persist(v, accent);
  }

  function chooseAccent(v: string) {
    setAccent(v);
    if (v === "indigo") document.documentElement.removeAttribute("data-accent");
    else document.documentElement.setAttribute("data-accent", v);
    persist(font, v);
  }

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#20242c]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Izgled
        </h2>
        {saving && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">Čuvam…</span>
        )}
      </div>

      {/* Veličina fonta */}
      <div>
        <p className="mb-2 text-sm font-medium text-black dark:text-zinc-50">
          Veličina slova
        </p>
        <div className="flex flex-wrap gap-2">
          {FONTS.map((f) => {
            const active = font === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => chooseFont(f.key)}
                className={`flex h-20 w-24 flex-col items-center justify-center gap-1 rounded-lg border transition ${
                  active
                    ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/30 dark:border-indigo-400 dark:bg-indigo-950/40"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-[#2a2f39] dark:hover:border-zinc-600"
                }`}
              >
                <span
                  className={`font-semibold leading-none text-black dark:text-zinc-50 ${f.sample}`}
                >
                  Tt
                </span>
                <span
                  className={`text-xs ${
                    active
                      ? "font-medium text-indigo-700 dark:text-indigo-300"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Akcentna boja */}
      <div>
        <p className="mb-2 text-sm font-medium text-black dark:text-zinc-50">
          Akcentna boja
        </p>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => {
            const active = accent === a.key;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => chooseAccent(a.key)}
                title={a.label}
                aria-label={a.label}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                  active
                    ? "ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100 dark:ring-offset-[#20242c]"
                    : ""
                }`}
                style={{ backgroundColor: a.swatch }}
              >
                {active && (
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-5 w-5 text-white"
                  >
                    <path
                      d="M5 10.5l3.5 3.5L15 6.5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Vezano za tvoj nalog — vrijedi na svim uređajima. Primjenjuje se odmah.
      </p>
    </section>
  );
}
