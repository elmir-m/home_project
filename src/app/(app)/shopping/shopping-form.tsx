"use client";

import { useRef } from "react";
import { Plus, Pencil } from "lucide-react";
import Modal from "@/components/modal";
import SubmitButton from "@/components/submit-button";
import { addShoppingItem, editShoppingItem } from "./actions";

type Item = { id: string; text: string; quantity: string | null };

const input =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function ShoppingForm({ item }: { item?: Item }) {
  const editing = !!item;
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Modal
      title={editing ? "Uredi stavku" : "Nova stavka"}
      trigger={(open) =>
        editing ? (
          <button
            onClick={open}
            title="Uredi"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-800"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={open}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nova stavka
          </button>
        )
      }
    >
      {(close) => (
        <form
          ref={formRef}
          action={editing ? editShoppingItem : addShoppingItem}
          onSubmit={() =>
            setTimeout(() => {
              if (!editing) formRef.current?.reset();
              close();
            }, 50)
          }
          className="flex flex-col gap-4"
        >
          {editing && <input type="hidden" name="id" value={item!.id} />}
          <Field label="Šta treba kupiti?">
            <input
              name="text"
              required
              autoFocus
              defaultValue={item?.text ?? ""}
              placeholder="npr. Mlijeko"
              className={input}
            />
          </Field>
          <Field label="Količina (opciono)">
            <input
              name="quantity"
              defaultValue={item?.quantity ?? ""}
              placeholder="npr. 2 l"
              className={input}
            />
          </Field>
          <SubmitButton
            className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            pendingText="Čuvam…"
          >
            {editing ? "Sačuvaj" : "Dodaj"}
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}
