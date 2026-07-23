"use client";

import { useRef, useState } from "react";
import { quickAdd } from "@/app/(app)/quick-actions";

// "+ Brzo" — dodaj zadatak/bilješku/podsjetnik odmah, bez otvaranja modula.
export default function QuickCapture() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
      >
        + Brzo
      </button>

      {open && (
        <>
          {/* klik izvan zatvara */}
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
            <div className="flex gap-1">
              {[
                { v: "task", l: "Zadatak" },
                { v: "note", l: "Bilješka" },
                { v: "reminder", l: "Podsjetnik" },
              ].map((o, i) => (
                <label
                  key={o.v}
                  className="flex-1 cursor-pointer rounded-md border border-zinc-200 px-2 py-1 text-center text-xs has-[:checked]:border-black has-[:checked]:bg-zinc-900 has-[:checked]:text-white dark:border-zinc-700 dark:has-[:checked]:border-zinc-50 dark:has-[:checked]:bg-zinc-50 dark:has-[:checked]:text-black"
                >
                  <input
                    type="radio"
                    name="type"
                    value={o.v}
                    defaultChecked={i === 0}
                    className="hidden"
                  />
                  {o.l}
                </label>
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
              Podsjetnik se postavlja za 1h (uredi u modulu).
            </p>
            <button className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black">
              Dodaj
            </button>
          </form>
        </>
      )}
    </div>
  );
}
