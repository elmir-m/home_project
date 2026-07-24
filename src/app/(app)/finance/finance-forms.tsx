"use client";

import { useRef } from "react";
import { Plus, Pencil } from "lucide-react";
import Modal from "@/components/modal";
import SubmitButton from "@/components/submit-button";
import {
  createTransaction,
  editTransaction,
  createBill,
  editBill,
} from "./actions";

type Member = {
  user_id: string;
  profiles: { display_name: string | null; email: string | null } | null;
};
type Tx = {
  id: string;
  kind: string;
  amount: number;
  category: string | null;
  description: string | null;
  occurred_on: string;
  paid_by: string | null;
};
type Bill = {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  recurrence: string;
  category: string | null;
};

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

function AddBtn({ open, label }: { open: () => void; label: string }) {
  return (
    <button
      onClick={open}
      className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-[0.98]"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

function EditBtn({ open }: { open: () => void }) {
  return (
    <button
      onClick={open}
      title="Uredi"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-800"
    >
      <Pencil className="h-4 w-4" />
    </button>
  );
}

export function TransactionForm({
  members,
  userId,
  today,
  tx,
}: {
  members: Member[];
  userId: string;
  today: string;
  tx?: Tx;
}) {
  const editing = !!tx;
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Modal
      title={editing ? "Uredi transakciju" : "Nova transakcija"}
      trigger={(open) =>
        editing ? (
          <EditBtn open={open} />
        ) : (
          <AddBtn open={open} label="Nova transakcija" />
        )
      }
    >
      {(close) => (
        <form
          ref={formRef}
          action={editing ? editTransaction : createTransaction}
          onSubmit={() =>
            setTimeout(() => {
              if (!editing) formRef.current?.reset();
              close();
            }, 50)
          }
          className="flex flex-col gap-4"
        >
          {editing && <input type="hidden" name="id" value={tx!.id} />}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vrsta">
              <select name="kind" defaultValue={tx?.kind ?? "expense"} className={input}>
                <option value="expense">Trošak</option>
                <option value="income">Prihod</option>
              </select>
            </Field>
            <Field label="Iznos (KM)">
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                autoFocus
                defaultValue={tx?.amount ?? ""}
                className={input}
              />
            </Field>
          </div>
          <Field label="Opis">
            <input
              name="description"
              defaultValue={tx?.description ?? ""}
              placeholder="npr. Kupovina namirnica"
              className={input}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategorija">
              <input
                name="category"
                defaultValue={tx?.category ?? ""}
                placeholder="npr. Hrana"
                className={input}
              />
            </Field>
            <Field label="Datum">
              <input
                type="date"
                name="occurred_on"
                defaultValue={tx?.occurred_on ?? today}
                className={input}
              />
            </Field>
          </div>
          <Field label="Platio/la">
            <select
              name="paid_by"
              defaultValue={tx?.paid_by ?? userId}
              className={input}
            >
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles?.display_name ?? m.profiles?.email}
                </option>
              ))}
            </select>
          </Field>
          <SubmitButton
            className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            pendingText="Čuvam…"
          >
            {editing ? "Sačuvaj" : "Dodaj transakciju"}
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}

export function BillForm({ today, bill }: { today: string; bill?: Bill }) {
  const editing = !!bill;
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Modal
      title={editing ? "Uredi račun" : "Novi račun"}
      trigger={(open) =>
        editing ? <EditBtn open={open} /> : <AddBtn open={open} label="Novi račun" />
      }
    >
      {(close) => (
        <form
          ref={formRef}
          action={editing ? editBill : createBill}
          onSubmit={() =>
            setTimeout(() => {
              if (!editing) formRef.current?.reset();
              close();
            }, 50)
          }
          className="flex flex-col gap-4"
        >
          {editing && <input type="hidden" name="id" value={bill!.id} />}
          <Field label="Naziv">
            <input
              name="name"
              required
              autoFocus
              defaultValue={bill?.name ?? ""}
              placeholder="npr. Struja"
              className={input}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Iznos (KM)">
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={bill?.amount ?? ""}
                className={input}
              />
            </Field>
            <Field label="Rok dospijeća">
              <input
                type="date"
                name="due_date"
                required
                defaultValue={bill?.due_date ?? today}
                className={input}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ponavljanje">
              <select
                name="recurrence"
                defaultValue={bill?.recurrence ?? "monthly"}
                className={input}
              >
                <option value="monthly">Mjesečno</option>
                <option value="yearly">Godišnje</option>
                <option value="none">Jednokratno</option>
              </select>
            </Field>
            <Field label="Kategorija">
              <input
                name="category"
                defaultValue={bill?.category ?? ""}
                placeholder="npr. Režije"
                className={input}
              />
            </Field>
          </div>
          <SubmitButton
            className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            pendingText="Čuvam…"
          >
            {editing ? "Sačuvaj" : "Dodaj račun"}
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}
