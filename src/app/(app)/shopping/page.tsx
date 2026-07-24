import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  clearDone,
  remindShopping,
} from "./actions";

type Item = {
  id: string;
  text: string;
  quantity: string | null;
  done: boolean;
};

export default async function ShoppingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
          <p className="text-sm text-zinc-400">
            {openCount} za kupiti · dijeljeno s cijelim domaćinstvom
          </p>
        </div>
        <div className="flex gap-2">
          <form action={remindShopping}>
            <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              🔔 Podsjeti me
            </button>
          </form>
          <form action={clearDone}>
            <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              Očisti kupljeno
            </button>
          </form>
        </div>
      </div>

      <form
        action={addShoppingItem}
        className="flex gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <input
          name="text"
          required
          placeholder="Šta treba kupiti?"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <input
          name="quantity"
          placeholder="Količina"
          className="w-28 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500">
          Dodaj
        </button>
      </form>

      <ul className="flex flex-col gap-1.5">
        {items.length === 0 && (
          <li className="py-8 text-center text-sm text-zinc-400">
            Lista je prazna. (Ako ostane prazno nakon dodavanja, pokreni migraciju
            0012.)
          </li>
        )}
        {items.map((i) => (
          <li
            key={i.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <form action={toggleShoppingItem}>
              <input type="hidden" name="id" value={i.id} />
              <input type="hidden" name="done" value={String(i.done)} />
              <button
                className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                  i.done
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-zinc-400"
                }`}
              >
                {i.done ? "✓" : ""}
              </button>
            </form>
            <span
              className={
                i.done
                  ? "text-zinc-400 line-through"
                  : "text-black dark:text-zinc-50"
              }
            >
              {i.text}
            </span>
            {i.quantity && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                {i.quantity}
              </span>
            )}
            <form action={deleteShoppingItem} className="ml-auto">
              <input type="hidden" name="id" value={i.id} />
              <button className="text-zinc-300 hover:text-red-600">✕</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
