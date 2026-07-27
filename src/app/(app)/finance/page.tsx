import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold, canManage } from "@/lib/household";
import { getT } from "@/lib/i18n-server";
import { deleteTransaction, deleteBill, deleteBudget } from "./actions";
import { TransactionForm, BillForm, BudgetForm } from "./finance-forms";

type Tx = {
  id: string;
  kind: string;
  amount: number;
  category: string | null;
  description: string | null;
  occurred_on: string;
  paid_by: string | null;
  created_by: string | null;
};
type Bill = {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  recurrence: string;
  category: string | null;
  created_by: string | null;
};
type Budget = {
  id: string;
  category: string;
  monthly_limit: number;
  created_by: string | null;
};

const money = (n: number) =>
  new Intl.NumberFormat("bs-BA", { minimumFractionDigits: 2 }).format(n) + " KM";

const pad = (n: number) => String(n).padStart(2, "0");

export default async function FinancePage() {
  const supabase = await createClient();
  const t = await getT();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { members, userId, isOwner } = await getCurrentHousehold();

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const monthEnd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
  )}`;
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const [{ data: txs }, { data: bills }, { data: budgets }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, kind, amount, category, description, occurred_on, paid_by, created_by")
      .gte("occurred_on", monthStart)
      .lte("occurred_on", monthEnd)
      .order("occurred_on", { ascending: false }),
    supabase.from("bills").select("*").order("due_date", { ascending: true }),
    supabase.from("budgets").select("id, category, monthly_limit, created_by").order("category"),
  ]);

  const txList = (txs as Tx[]) ?? [];
  const billList = (bills as Bill[]) ?? [];
  const budgetList = (budgets as Budget[]) ?? [];

  // Potrošeno po kategoriji (troškovi ovog mjeseca).
  const spentByCat = new Map<string, number>();
  txList
    .filter((t) => t.kind === "expense" && t.category)
    .forEach((t) =>
      spentByCat.set(
        t.category!,
        (spentByCat.get(t.category!) ?? 0) + Number(t.amount),
      ),
    );

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
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-black dark:text-zinc-50">{t("finance.title")}</h1>

      {/* Sažetak */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-[#20242c]">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("finance.incomeMonth")}</p>
          <p className="mt-1 text-lg font-semibold text-green-600">{money(income)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-[#20242c]">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("finance.expensesMonth")}</p>
          <p className="mt-1 text-lg font-semibold text-red-600">{money(expenses)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-[#20242c]">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("finance.net")}</p>
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
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 text-sm dark:border-zinc-800 dark:bg-[#20242c]">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {t("finance.whoPaidFairShare", { amount: money(fairShare) })}
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
                    {t("finance.paid")} {money(paid)} ·{" "}
                    <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>
                      {balance >= 0 ? t("finance.getsBack") : t("finance.owes")} {money(Math.abs(balance))}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Budžeti */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {t("finance.budgetsByCategory")}
          </h2>
          <BudgetForm />
        </div>
        {budgetList.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-white/50 py-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-[#20242c]/40 dark:text-zinc-400">
            {t("finance.budgetsEmpty")}
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {budgetList.map((b) => {
              const spent = spentByCat.get(b.category) ?? 0;
              const pct = Math.min(
                100,
                Math.round((spent / Number(b.monthly_limit)) * 100),
              );
              const over = spent > Number(b.monthly_limit);
              const canEdit = canManage(b.created_by, userId, isOwner);
              const bar = over
                ? "bg-red-500"
                : pct >= 80
                  ? "bg-amber-500"
                  : "bg-indigo-500";
              return (
                <li
                  key={b.id}
                  className="group rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-[#20242c]"
                >
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {b.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className={
                          over
                            ? "font-medium text-red-600"
                            : "text-zinc-500 dark:text-zinc-400"
                        }
                      >
                        {money(spent)} / {money(Number(b.monthly_limit))}
                      </span>
                      {canEdit && (
                        <span className="flex items-center opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                          <BudgetForm
                            budget={{
                              category: b.category,
                              monthly_limit: Number(b.monthly_limit),
                            }}
                          />
                          <form action={deleteBudget}>
                            <input type="hidden" name="id" value={b.id} />
                            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
                              ✕
                            </button>
                          </form>
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-[#2a2f39]">
                    <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  {over && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      {t("finance.overBy", { amount: money(spent - Number(b.monthly_limit)) })}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Transakcije */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {t("finance.txThisMonth")}
          </h2>
          <TransactionForm members={members} userId={user.id} today={today} />
        </div>
        <ul className="flex flex-col gap-1.5">
          {txList.length === 0 && (
            <li className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t("finance.txEmpty")}
            </li>
          )}
          {txList.map((t) => {
            const canEdit = canManage(t.created_by, userId, isOwner);
            return (
            <li
              key={t.id}
              className="group flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-zinc-800 dark:bg-[#20242c]"
            >
              <span
                className={`font-semibold ${
                  t.kind === "income" ? "text-green-600" : "text-red-600"
                }`}
              >
                {t.kind === "income" ? "+" : "−"}
                {money(Number(t.amount))}
              </span>
              <span className="text-zinc-900 dark:text-zinc-50">
                {t.description || t.category || "—"}
              </span>
              {t.category && (
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:text-zinc-400 dark:bg-[#2a2f39]">
                  {t.category}
                </span>
              )}
              <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
                {t.occurred_on} · {nameOf(t.paid_by)}
              </span>
              {canEdit && (
                <div className="flex items-center opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                  <TransactionForm
                    members={members}
                    userId={user.id}
                    today={today}
                    tx={t}
                  />
                  <form action={deleteTransaction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
                      ✕
                    </button>
                  </form>
                </div>
              )}
            </li>
            );
          })}
        </ul>
      </section>

      {/* Računi / pretplate */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {t("finance.billsSubs")}
          </h2>
          <BillForm today={today} />
        </div>
        <ul className="flex flex-col gap-1.5">
          {billList.map((b) => {
            const daysLeft = Math.ceil(
              (new Date(b.due_date).getTime() - new Date(today).getTime()) /
                86400000,
            );
            const soon = daysLeft <= 3;
            const canEdit = canManage(b.created_by, userId, isOwner);
            return (
              <li
                key={b.id}
                className="group flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-zinc-800 dark:bg-[#20242c]"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {b.name}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {money(Number(b.amount))}
                </span>
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:text-zinc-400 dark:bg-[#2a2f39]">
                  {b.recurrence === "monthly"
                    ? t("finance.recurBadge.monthly")
                    : b.recurrence === "yearly"
                      ? t("finance.recurBadge.yearly")
                      : t("finance.recurBadge.once")}
                </span>
                <span
                  className={`ml-auto text-xs ${
                    soon ? "font-medium text-red-600" : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {soon ? "⚠ " : ""}
                  {b.due_date}
                  {daysLeft >= 0 ? ` ${t("finance.dueInDays", { n: daysLeft })}` : ` ${t("finance.expired")}`}
                </span>
                {canEdit && (
                  <div className="flex items-center opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                    <BillForm today={today} bill={b} />
                    <form action={deleteBill}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
                        ✕
                      </button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
          {billList.length === 0 && (
            <li className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t("finance.billsEmpty")}
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
