"use client";

import { useRef, useState } from "react";
import { quickAdd } from "@/app/(app)/quick-actions";

const TYPES = [
  { v: "task", l: "Zadatak" },
  { v: "note", l: "Bilješka" },
  { v: "reminder", l: "Podsjetnik" },
];

// "+ Brzo" — dodaj zadatak/bilješku/podsjetnik odmah, bez otvaranja modula.
export default function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("task");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white dark:hover:bg-zinc-200"
      >
        + Brzo
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <form
            ref={formRef}
            action={quickAdd}
            onSubmit={() => {
              setTimeout(() => {
                formRef.current?.reset();
                setOpen(false);
              }, 50);
            }}
            className="absolute right-0 z-20 mt-2 flex w-72 flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >
            <input type="hidden" name="type" value={type} />
            <div className="flex gap-1">
              {TYPES.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setType(o.v)}
                  className={`flex-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                    type === o.v
                      ? "border-black bg-zinc-900 text-white dark:border-zinc-50 dark:bg-indigo-500 dark:text-white"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-indigo-700"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
            <input
              name="text"
              autoFocus
              required
              placeholder="Upiši i pritisni Enter…"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
            <p className="text-[11px] text-zinc-400">
              {type === "reminder"
                ? "Podsjetnik se postavlja za 1h (uredi u modulu)."
                : "Kreira se odmah u odabranom modulu."}
            </p>
            <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white">
              Dodaj
            </button>
          </form>
        </>
      )}
    </div>
  );
}
