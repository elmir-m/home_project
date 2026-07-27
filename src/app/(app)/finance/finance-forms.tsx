"use client";

import { useRef } from "react";
import { Plus, Pencil } from "lucide-react";
import Modal from "@/components/modal";
import SubmitButton from "@/components/submit-button";
import { useT } from "@/components/locale-provider";
import {
  createTransaction,
  editTransaction,
  createBill,
  editBill,
  saveBudget,
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
type Budget = { category: string; monthly_limit: number };

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
  const t = useT();
  return (
    <button
      onClick={open}
      title={t("common.edit")}
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
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Modal
      title={editing ? t("finance.editTx") : t("finance.newTx")}
      trigger={(open) =>
        editing ? (
          <EditBtn open={open} />
        ) : (
          <AddBtn open={open} label={t("finance.newTx")} />
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
            <Field label={t("finance.kind")}>
              <select name="kind" defaultValue={tx?.kind ?? "expense"} className={input}>
                <option value="expense">{t("finance.expense")}</option>
                <option value="income">{t("finance.income")}</option>
              </select>
            </Field>
            <Field label={t("finance.amountKm")}>
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
          <Field label={t("finance.description")}>
            <input
              name="description"
              defaultValue={tx?.description ?? ""}
              placeholder={t("finance.txDescPlaceholder")}
              className={input}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.category")}>
              <input
                name="category"
                defaultValue={tx?.category ?? ""}
                placeholder={t("finance.categoryPlaceholder")}
                className={input}
              />
            </Field>
            <Field label={t("field.date")}>
              <input
                type="date"
                name="occurred_on"
                defaultValue={tx?.occurred_on ?? today}
                className={input}
              />
            </Field>
          </div>
          <Field label={t("finance.paidBy")}>
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
            pendingText={t("common.saving")}
          >
            {editing ? t("common.save") : t("finance.addTx")}
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}

export function BudgetForm({ budget }: { budget?: Budget }) {
  const editing = !!budget;
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Modal
      title={editing ? t("finance.editBudget") : t("finance.newBudget")}
      trigger={(open) =>
        editing ? <EditBtn open={open} /> : <AddBtn open={open} label={t("finance.newBudget")} />
      }
    >
      {(close) => (
        <form
          ref={formRef}
          action={saveBudget}
          onSubmit={() =>
            setTimeout(() => {
              if (!editing) formRef.current?.reset();
              close();
            }, 50)
          }
          className="flex flex-col gap-4"
        >
          <Field label={t("field.category")}>
            <input
              name="category"
              required
              autoFocus={!editing}
              readOnly={editing}
              defaultValue={budget?.category ?? ""}
              placeholder={t("finance.categoryPlaceholder")}
              className={`${input} ${editing ? "opacity-70" : ""}`}
            />
          </Field>
          <Field label={t("finance.monthlyLimit")}>
            <input
              name="monthly_limit"
              type="number"
              step="0.01"
              min="0"
              required
              autoFocus={editing}
              defaultValue={budget?.monthly_limit ?? ""}
              className={input}
            />
          </Field>
          <SubmitButton
            className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            pendingText={t("common.saving")}
          >
            {editing ? t("common.save") : t("finance.addBudget")}
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}

export function BillForm({ today, bill }: { today: string; bill?: Bill }) {
  const editing = !!bill;
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Modal
      title={editing ? t("finance.editBill") : t("finance.newBill")}
      trigger={(open) =>
        editing ? <EditBtn open={open} /> : <AddBtn open={open} label={t("finance.newBill")} />
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
          <Field label={t("field.name")}>
            <input
              name="name"
              required
              autoFocus
              defaultValue={bill?.name ?? ""}
              placeholder={t("finance.billNamePlaceholder")}
              className={input}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("finance.amountKm")}>
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
            <Field label={t("field.dueDate")}>
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
            <Field label={t("finance.recurrenceLabel")}>
              <select
                name="recurrence"
                defaultValue={bill?.recurrence ?? "monthly"}
                className={input}
              >
                <option value="monthly">{t("finance.recur.monthly")}</option>
                <option value="yearly">{t("finance.recur.yearly")}</option>
                <option value="none">{t("finance.recur.once")}</option>
              </select>
            </Field>
            <Field label={t("field.category")}>
              <input
                name="category"
                defaultValue={bill?.category ?? ""}
                placeholder={t("finance.billCategoryPlaceholder")}
                className={input}
              />
            </Field>
          </div>
          <SubmitButton
            className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            pendingText={t("common.saving")}
          >
            {editing ? t("common.save") : t("finance.addBill")}
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}
