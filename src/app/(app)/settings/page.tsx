import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveNotificationPrefs } from "./actions";
import Appearance from "./appearance";

type Prefs = {
  email_reminders: boolean;
  email_tasks: boolean;
  email_bills: boolean;
  email_shared: boolean;
  digest: string;
};

const DEFAULTS: Prefs = {
  email_reminders: true,
  email_tasks: true,
  email_bills: true,
  email_shared: true,
  digest: "none",
};

const CATEGORIES: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: "email_reminders", label: "Podsjetnici", desc: "Kada podsjetnik dospije." },
  { key: "email_tasks", label: "Zadaci", desc: "Kada ti je zadatak dodijeljen." },
  { key: "email_bills", label: "Računi", desc: "Kada račun uskoro dospijeva." },
  { key: "email_shared", label: "Dijeljenje", desc: "Kada je nešto podijeljeno s tobom." },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("notification_prefs")
    .select("email_reminders, email_tasks, email_bills, email_shared, digest")
    .eq("user_id", user.id)
    .single();

  const prefs = { ...DEFAULTS, ...(data as Prefs | null) };

  const { data: appearance } = await supabase
    .from("profiles")
    .select("font_size, accent")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
          Postavke
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Prijavljen kao {user.email}. Ove postavke vrijede samo za tebe.
        </p>
      </div>

      <Appearance
        initialFont={(appearance?.font_size as string) ?? "md"}
        initialAccent={(appearance?.accent as string) ?? "indigo"}
      />

      <form
        action={saveNotificationPrefs}
        className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#20242c]"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Email obavijesti
        </h2>

        {CATEGORIES.map((c) => (
          <label
            key={c.key}
            className="flex items-start gap-3 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
          >
            <input
              type="checkbox"
              name={c.key}
              defaultChecked={prefs[c.key] as boolean}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-medium text-black dark:text-zinc-50">
                {c.label}
              </span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">{c.desc}</span>
            </span>
          </label>
        ))}

        <div className="mt-2">
          <label className="block text-sm font-medium text-black dark:text-zinc-50">
            Sažetak (digest)
          </label>
          <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
            Povremeni email s pregledom onoga što slijedi.
          </p>
          <select
            name="digest"
            defaultValue={prefs.digest}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
          >
            <option value="none">Isključeno</option>
            <option value="daily">Dnevni</option>
            <option value="weekly">Sedmični</option>
          </select>
        </div>

        <button className="mt-2 self-start rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white">
          Sačuvaj
        </button>
      </form>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Emailove šaljemo s verifikovanog domena (emurgic.info) — stižu svim
        članovima.
      </p>
    </main>
  );
}
