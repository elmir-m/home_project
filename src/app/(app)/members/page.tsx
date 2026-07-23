import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import {
  inviteMember,
  revokeInvite,
  renameHousehold,
  setActiveHousehold,
} from "./actions";

type Invitation = {
  id: string;
  email: string;
  token: string;
  status: string;
};

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { household, households, members } = await getCurrentHousehold();

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const base = `${host.includes("localhost") ? "http" : "https"}://${host}`;

  const { data: invs } = household
    ? await supabase
        .from("invitations")
        .select("id, email, token, status")
        .eq("household_id", household.id)
        .eq("status", "pending")
    : { data: [] };
  const pending = (invs as Invitation[]) ?? [];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
        Domaćinstvo i članovi
      </h1>

      {/* Prebacivanje aktivnog domaćinstva */}
      {households.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white shadow-sm p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-zinc-400">Aktivno:</span>
          {households.map((hh) => (
            <form key={hh.id} action={setActiveHousehold}>
              <input type="hidden" name="id" value={hh.id} />
              <button
                className={`rounded-md px-3 py-1 ${
                  hh.id === household?.id
                    ? "bg-zinc-900 text-white dark:bg-indigo-500 dark:text-white"
                    : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                {hh.name}
              </button>
            </form>
          ))}
        </div>
      )}

      {/* Naziv domaćinstva */}
      <section className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Naziv domaćinstva
        </h2>
        <form action={renameHousehold} className="flex gap-2">
          <input
            name="name"
            defaultValue={household?.name ?? ""}
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white dark:bg-indigo-500 dark:text-white">
            Sačuvaj
          </button>
        </form>
      </section>

      {/* Članovi */}
      <section className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Članovi ({members.length})
        </h2>
        <ul className="flex flex-col gap-1">
          {members.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900"
            >
              <span className="text-black dark:text-zinc-50">
                {m.profiles?.display_name ?? m.profiles?.email}
              </span>
              <span className="text-xs text-zinc-400">{m.role}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pozovi člana */}
      <section className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Pozovi člana
        </h2>
        <form action={inviteMember} className="flex gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="email@primjer.com"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white dark:bg-indigo-500 dark:text-white">
            Pozovi
          </button>
        </form>

        {pending.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {pending.map((inv) => (
              <li
                key={inv.id}
                className="rounded-md border border-zinc-200 bg-white shadow-sm p-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-black dark:text-zinc-50">{inv.email}</span>
                  <form action={revokeInvite}>
                    <input type="hidden" name="id" value={inv.id} />
                    <button className="text-xs text-zinc-400 hover:text-red-600">
                      opozovi
                    </button>
                  </form>
                </div>
                <input
                  readOnly
                  value={`${base}/invite/${inv.token}`}
                  className="mt-1 w-full rounded bg-zinc-50 px-2 py-1 text-xs text-zinc-500 dark:bg-zinc-900"
                />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-zinc-400">
          Poziv se šalje mejlom. Na Resend free tieru mejl stiže samo na tvoju
          adresu — zato je link iznad tu da ga možeš proslijediti ručno.
        </p>
      </section>
    </main>
  );
}
