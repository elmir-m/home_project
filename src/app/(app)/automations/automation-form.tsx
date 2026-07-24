"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/modal";
import SubmitButton from "@/components/submit-button";
import { createAutomation } from "../apps/actions";

type Opt = { type: string; label: string };

const input =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50";

export default function AutomationForm({
  events,
  actions,
}: {
  events: Opt[];
  actions: Opt[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Modal
      title="Nova automatizacija"
      trigger={(open) => (
        <button
          onClick={open}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nova automatizacija
        </button>
      )}
    >
      {(close) => (
        <form
          ref={formRef}
          action={createAutomation}
          onSubmit={() =>
            setTimeout(() => {
              formRef.current?.reset();
              close();
            }, 50)
          }
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Kada se desi
            </span>
            <select name="trigger_type" className={input}>
              {events.map((e) => (
                <option key={e.type} value={e.type}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Onda uradi
            </span>
            <select name="action_type" className={input}>
              {actions.map((a) => (
                <option key={a.type} value={a.type}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tekst (naslov podsjetnika/zadatka ili predmet emaila)
            </span>
            <input
              name="text"
              placeholder="npr. Provjeri stanje"
              className={input}
            />
          </label>

          <SubmitButton
            className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            pendingText="Dodajem…"
          >
            Dodaj automatizaciju
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}
