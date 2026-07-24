import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import {
  createTransaction,
  deleteTransaction,
  createBill,
  deleteBill,
} from "./actions";

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

const money = (n: number) =>
  new Intl.NumberFormat("bs-BA", { minimumFractionDigits: 2 }).format(n) + " KM";

const pad = (n: number) => String(n).padStart(2, "0");

export default async function FinancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { members } = await getCurrentHousehold();

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const monthEnd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
  )}`;
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const [{ data: txs }, { data: bills }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, kind, amount, category, description, occurred_on, paid_by")
      .gte("occurred_on", monthStart)
      .lte("occurred_on", monthEnd)
      .order("occurred_on", { ascending: false }),
    supabase.from("bills").select("*").order("due_date", { ascending: true }),
  ]);

  const txList = (txs as Tx[]) ?? [];
  const billList = (bills as Bill[]) ?? [];

  const income = txList
    .filter((t) => t.kind === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expenses = txList
    .filter((t) => t.kind === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const net = income - expenses;

  const nameOf = (id: string | null) => {
    const m = members.find((x) => x.user_id === id);
    return m?.profiles?.display_name ?? m?.profiles?.email ?? "?";
  };

  // Ko je platio (samo troškovi) + ko duguje (pravedan udio).
  const paidBy = new Map<string, number>();
  txList
    .filter((t) => t.kind === "expense")
    .forEach((t) =>
      paidBy.set(t.paid_by ?? "", (paidBy.get(t.paid_by ?? "") ?? 0) + Number(t.amount)),
    );
  const fairShare = members.length ? expenses / members.length : 0;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold text-black dark:text-zinc-50">Finansije</h1>

      {/* Sažetak */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500">Prihodi (mjesec)</p>
          <p className="mt-1 text-lg font-semibold text-green-600">{money(income)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500">Troškovi (mjesec)</p>
          <p className="mt-1 text-lg font-semibold text-red-600">{money(expenses)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500">Neto</p>
          <p
            className={`mt-1 text-lg font-semibold ${
              net >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {money(net)}
          </p>
        </div>
      </div>

      {/* Ko je platio / ko duguje */}
      {members.length > 1 && expenses > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Ko je platio · pravedan udio {money(fairShare)}
          </p>
          <ul className="flex flex-col gap-1">
            {members.map((m) => {
              const paid = paidBy.get(m.user_id) ?? 0;
              const balance = paid - fairShare; // + dobija nazad, - duguje
              return (
                <li key={m.user_id} className="flex justify-between">
                  <span className="text-black dark:text-zinc-50">
                    {m.profiles?.display_name ?? m.profiles?.email}
                  </span>
                  <span className="text-zinc-500">
                    platio {money(paid)} ·{" "}
                    <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>
                      {balance >= 0 ? "dobija" : "duguje"} {money(Math.abs(balance))}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Dodaj transakciju */}
      <form
        action={createTransaction}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <select
          name="kind"
          defaultValue="expense"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="expense">Trošak</option>
          <option value="income">Prihod</option>
        </select>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Iznos"
          className="w-28 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <input
          name="category"
          placeholder="Kategorija"
          className="w-32 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <input
          name="description"
          placeholder="Opis"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <input
          name="occurred_on"
          type="date"
          defaultValue={today}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <select
          name="paid_by"
          defaultValue={user.id}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.profiles?.display_name ?? m.profiles?.email}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white">
          Dodaj
        </button>
      </form>

      {/* Transakcije */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Transakcije ovog mjeseca
        </h2>
        <ul className="flex flex-col gap-1">
          {txList.length === 0 && (
            <li className="py-4 text-center text-sm text-zinc-500">
              Nema transakcija. (Ako ostane prazno, pokreni migraciju 0005.)
            </li>
          )}
          {txList.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white shadow-sm px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span
                className={`font-semibold ${
                  t.kind === "income" ? "text-green-600" : "text-red-600"
                }`}
              >
                {t.kind === "income" ? "+" : "−"}
                {money(Number(t.amount))}
              </span>
              <span className="text-black dark:text-zinc-50">
                {t.description || t.category || "—"}
              </span>
              {t.category && (
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                  {t.category}
                </span>
              )}
              <span className="ml-auto text-xs text-zinc-500">
                {t.occurred_on} · {nameOf(t.paid_by)}
              </span>
              <form action={deleteTransaction}>
                <input type="hidden" name="id" value={t.id} />
                <button className="text-zinc-300 hover:text-red-600">✕</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      {/* Računi / pretplate */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Računi i pretplate
        </h2>
        <form
          action={createBill}
          className="mb-3 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <input
            name="name"
            required
            placeholder="Naziv (npr. Struja)"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="Iznos"
            className="w-28 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <input
            name="due_date"
            type="date"
            required
            defaultValue={today}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <select
            name="recurrence"
            defaultValue="monthly"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="monthly">Mjesečno</option>
            <option value="yearly">Godišnje</option>
            <option value="none">Jednokratno</option>
          </select>
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white">
            Dodaj
          </button>
        </form>
        <ul className="flex flex-col gap-1">
          {billList.map((b) => {
            const daysLeft = Math.ceil(
              (new Date(b.due_date).getTime() - new Date(today).getTime()) /
                86400000,
            );
            const soon = daysLeft <= 3;
            return (
              <li
                key={b.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white shadow-sm px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="font-medium text-black dark:text-zinc-50">
                  {b.name}
                </span>
                <span className="text-zinc-500">{money(Number(b.amount))}</span>
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                  {b.recurrence === "monthly"
                    ? "mjesečno"
                    : b.recurrence === "yearly"
                      ? "godišnje"
                      : "jednokratno"}
                </span>
                <span
                  className={`ml-auto text-xs ${
                    soon ? "font-medium text-red-600" : "text-zinc-500"
                  }`}
                >
                  {soon ? "⚠ " : ""}
                  {b.due_date}
                  {daysLeft >= 0 ? ` (za ${daysLeft}d)` : " (isteklo)"}
                </span>
                <form action={deleteBill}>
                  <input type="hidden" name="id" value={b.id} />
                  <button className="text-zinc-300 hover:text-red-600">✕</button>
                </form>
              </li>
            );
          })}
          {billList.length === 0 && (
            <li className="py-4 text-center text-sm text-zinc-500">
              Nema računa.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
