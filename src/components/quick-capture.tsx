"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { quickAdd } from "@/app/(app)/quick-actions";
import SubmitButton from "@/components/submit-button";
import { useT } from "@/components/locale-provider";

const TYPES = [
  { v: "task", k: "qc.type.task" },
  { v: "note", k: "qc.type.note" },
  { v: "reminder", k: "qc.type.reminder" },
];

// "+ Brzo" — dodaj zadatak/bilješku/podsjetnik odmah, bez otvaranja modula.
export default function QuickCapture() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("task");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">{t("qc.button")}</span>
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
            className="absolute right-0 z-20 mt-2 flex w-72 flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-[#20242c]"
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
                  {t(o.k)}
                </button>
              ))}
            </div>
            <input
              name="text"
              autoFocus
              required
              placeholder={t("qc.placeholder")}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
            />
            <p className="text-[11px] text-zinc-400">
              {type === "reminder" ? t("qc.hint.reminder") : t("qc.hint.default")}
            </p>
            <SubmitButton className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              {t("qc.add")}
            </SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}
