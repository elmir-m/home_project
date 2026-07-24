import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deleteRecord,
  deleteContact,
  createList,
  deleteList,
  addListItem,
  toggleListItem,
  deleteListItem,
} from "./actions";
import { RecordForm, ContactForm } from "./life-forms";

type Rec = {
  id: string;
  title: string;
  category: string;
  expiry_date: string | null;
  notes: string | null;
};
type Contact = {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
};
type List = { id: string; name: string };
type Item = { id: string; list_id: string; text: string; done: boolean };

const CAT_LABEL: Record<string, string> = {
  document: "Dokument",
  warranty: "Garancija",
  renewal: "Obnova",
  other: "Ostalo",
};

const input =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50";
const btn =
  "rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white";

export default async function LifePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: records }, { data: contacts }, { data: lists }, { data: items }] =
    await Promise.all([
      supabase.from("records").select("*").order("created_at", { ascending: false }),
      supabase.from("contacts").select("*").order("name"),
      supabase.from("lists").select("id, name").order("created_at"),
      supabase.from("list_items").select("id, list_id, text, done").order("created_at"),
    ]);

  const recList = (records as Rec[]) ?? [];
  const contactList = (contacts as Contact[]) ?? [];
  const listList = (lists as List[]) ?? [];
  const itemList = (items as Item[]) ?? [];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
        Kućna evidencija
      </h1>

      {/* EVIDENCIJA */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Evidencija (dokumenti, garancije, obnove)
          </h2>
          <RecordForm />
        </div>
        <ul className="flex flex-col gap-1.5">
          {recList.map((r) => {
            const soon = r.expiry_date && r.expiry_date >= today;
            const expired = r.expiry_date && r.expiry_date < today;
            return (
              <li
                key={r.id}
                className="group flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-zinc-800 dark:bg-[#20242c]"
              >
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:text-zinc-400 dark:bg-[#2a2f39]">
                  {CAT_LABEL[r.category]}
                </span>
                <span className="text-zinc-900 dark:text-zinc-50">{r.title}</span>
                {r.notes && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {r.notes}
                  </span>
                )}
                {r.expiry_date && (
                  <span
                    className={`ml-auto text-xs ${
                      expired
                        ? "font-medium text-red-600"
                        : soon
                          ? "text-amber-600"
                          : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {expired ? "isteklo " : "ističe "}
                    {r.expiry_date}
                  </span>
                )}
                <div
                  className={`flex items-center opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100 ${
                    r.expiry_date ? "" : "ml-auto"
                  }`}
                >
                  <RecordForm record={r} />
                  <form action={deleteRecord}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
                      ✕
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
          {recList.length === 0 && (
            <li className="py-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Nema zapisa. Klikni „Novi zapis".
            </li>
          )}
        </ul>
      </section>

      {/* KONTAKTI */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Važni kontakti
          </h2>
          <ContactForm />
        </div>
        <ul className="flex flex-col gap-1.5">
          {contactList.map((c) => (
            <li
              key={c.id}
              className="group flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-zinc-800 dark:bg-[#20242c]"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {c.name}
              </span>
              {c.role && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {c.role}
                </span>
              )}
              <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
                {[c.phone, c.email].filter(Boolean).join(" · ")}
              </span>
              <div className="flex items-center opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                <ContactForm contact={c} />
                <form action={deleteContact}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
                    ✕
                  </button>
                </form>
              </div>
            </li>
          ))}
          {contactList.length === 0 && (
            <li className="py-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Nema kontakata.
            </li>
          )}
        </ul>
      </section>

      {/* LISTE */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Dijeljene liste
        </h2>
        <form action={createList} className="mb-3 flex gap-2">
          <input name="name" required placeholder="Nova lista (npr. Kupovina)" className={`flex-1 ${input}`} />
          <button className={btn}>Napravi listu</button>
        </form>

        <div className="grid gap-3 sm:grid-cols-2">
          {listList.map((l) => {
            const its = itemList.filter((i) => i.list_id === l.id);
            return (
              <div
                key={l.id}
                className="rounded-xl border border-zinc-200 bg-white shadow-sm p-3 dark:border-zinc-800 dark:bg-[#20242c]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-black dark:text-zinc-50">
                    {l.name}
                  </span>
                  <form action={deleteList}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="text-xs text-zinc-300 hover:text-red-600">
                      obriši listu
                    </button>
                  </form>
                </div>
                <ul className="flex flex-col gap-1">
                  {its.map((i) => (
                    <li key={i.id} className="flex items-center gap-2 text-sm">
                      <form action={toggleListItem}>
                        <input type="hidden" name="id" value={i.id} />
                        <input type="hidden" name="done" value={String(i.done)} />
                        <button
                          className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
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
                            ? "text-zinc-500 line-through"
                            : "text-black dark:text-zinc-50"
                        }
                      >
                        {i.text}
                      </span>
                      <form action={deleteListItem} className="ml-auto">
                        <input type="hidden" name="id" value={i.id} />
                        <button className="text-zinc-300 hover:text-red-600">✕</button>
                      </form>
                    </li>
                  ))}
                </ul>
                <form action={addListItem} className="mt-2 flex gap-1">
                  <input type="hidden" name="list_id" value={l.id} />
                  <input
                    name="text"
                    required
                    placeholder="Nova stavka…"
                    className={`flex-1 ${input} py-1`}
                  />
                  <button className="rounded-md border border-zinc-300 px-2 text-sm dark:border-zinc-700">
                    +
                  </button>
                </form>
              </div>
            );
          })}
        </div>
        {listList.length === 0 && (
          <p className="py-3 text-center text-sm text-zinc-500 dark:text-zinc-400">Nema lista.</p>
        )}
      </section>
    </main>
  );
}
