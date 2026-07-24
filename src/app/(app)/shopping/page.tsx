import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  toggleShoppingItem,
  deleteShoppingItem,
  clearDone,
  remindShopping,
} from "./actions";
import ShoppingForm from "./shopping-form";
import SubmitButton from "@/components/submit-button";

type Item = {
  id: string;
  text: string;
  quantity: string | null;
  done: boolean;
};

export default async function ShoppingPage({
  searchParams,
}: {
  searchParams: Promise<{ reminded?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const reminded = (await searchParams).reminded === "1";

  const { data } = await supabase
    .from("shopping_items")
    .select("id, text, quantity, done")
    .order("done", { ascending: true })
    .order("created_at", { ascending: true });

  const items = (data as Item[]) ?? [];
  const openCount = items.filter((i) => !i.done).length;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            🛒 Kupovina
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {openCount} za kupiti · dijeljeno s cijelim domaćinstvom
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={remindShopping}>
            <SubmitButton
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              pendingText="Pravim…"
            >
              🔔 Podsjeti me
            </SubmitButton>
          </form>
          <form action={clearDone}>
            <SubmitButton
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              pendingText="Čistim…"
            >
              Očisti kupljeno
            </SubmitButton>
          </form>
          <ShoppingForm />
        </div>
      </div>

      {reminded && (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          ✓ Podsjetnik za kupovinu je napravljen (za 2h, uz email).{" "}
          <Link href="/reminders" className="font-medium underline">
            Otvori Podsjetnike
          </Link>
        </div>
      )}

      {items.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white/50 py-16 text-center dark:border-zinc-700 dark:bg-[#20242c]/40">
          <span className="text-3xl">🛒</span>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Lista je prazna. Klikni „Nova stavka".
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-1.5">
        {items.map((i) => (
          <li
            key={i.id}
            className="group flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-zinc-800 dark:bg-[#20242c]"
          >
            <form action={toggleShoppingItem}>
              <input type="hidden" name="id" value={i.id} />
              <input type="hidden" name="done" value={String(i.done)} />
              <button
                className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs transition active:scale-90 ${
                  i.done
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-zinc-300 hover:border-indigo-500 dark:border-zinc-600"
                }`}
              >
                {i.done ? "✓" : ""}
              </button>
            </form>
            <span
              className={
                i.done
                  ? "text-zinc-400 line-through"
                  : "text-zinc-900 dark:text-zinc-50"
              }
            >
              {i.text}
            </span>
            {i.quantity && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:text-zinc-400 dark:bg-[#2a2f39]">
                {i.quantity}
              </span>
            )}
            <div className="ml-auto flex items-center opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
              <ShoppingForm item={i} />
              <form action={deleteShoppingItem}>
                <input type="hidden" name="id" value={i.id} />
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
                  ✕
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
