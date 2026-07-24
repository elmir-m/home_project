import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import {
  inviteMember,
  createMember,
  revokeInvite,
  renameHousehold,
  setActiveHousehold,
  setMemberAppHidden,
} from "./actions";
import { BUILTIN_APPS } from "@/lib/apps";
import { AppIcon } from "@/components/app-icon";
import SubmitButton from "@/components/submit-button";

type Invitation = {
  id: string;
  email: string;
  token: string;
  status: string;
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invited?: string; created?: string }>;
}) {
  const sp = await searchParams;
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

  // Dozvole po članu (vidi/mijenja samo vlasnik).
  const myRole = members.find((m) => m.user_id === user.id)?.role;
  const isOwner = myRole === "owner";
  const { data: mah } = isOwner
    ? await supabase.from("member_app_hidden").select("user_id, slug")
    : { data: [] };
  const hiddenSet = new Set(
    (mah ?? []).map((r) => `${r.user_id}:${r.slug}`),
  );

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
        Domaćinstvo i članovi
      </h1>

      {sp.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {sp.error}
        </p>
      )}
      {sp.invited && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/50 dark:text-green-300">
          ✓ Pozivnica poslana.
        </p>
      )}
      {sp.created && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/50 dark:text-green-300">
          ✓ Član kreiran ({sp.created}) i dodan u domaćinstvo. Daj mu email i
          lozinku za prijavu.
        </p>
      )}

      {/* Prebacivanje aktivnog domaćinstva */}
      {households.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white shadow-sm p-3 text-sm dark:border-zinc-800 dark:bg-[#20242c]">
          <span className="text-zinc-500">Aktivno:</span>
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

      {/* Naziv domaćinstva (samo vlasnik) */}
      {isOwner && (
        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-[#20242c]">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Naziv domaćinstva
          </h2>
          <form action={renameHousehold} className="flex gap-2">
            <input
              name="name"
              defaultValue={household?.name ?? ""}
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
            />
            <SubmitButton
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              pendingText="Čuvam…"
            >
              Sačuvaj
            </SubmitButton>
          </form>
        </section>
      )}

      {/* Članovi */}
      <section className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-[#20242c]">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Članovi ({members.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {members.map((m) => (
            <li
              key={m.user_id}
              className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-[#2a2f39]/40"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-black dark:text-zinc-50">
                  {m.profiles?.display_name ?? m.profiles?.email}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    m.role === "owner"
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {m.role === "owner" ? "vlasnik" : "član"}
                </span>
              </div>

              {/* Vlasnik bira šta ovaj član vidi u meniju */}
              {isOwner && m.role !== "owner" && (
                <div className="mt-2.5">
                  <p className="mb-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Vidljive aplikacije (klikni za uključi/isključi):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {BUILTIN_APPS.map((app) => {
                      const isHidden = hiddenSet.has(`${m.user_id}:${app.slug}`);
                      return (
                        <form key={app.slug} action={setMemberAppHidden}>
                          <input type="hidden" name="user_id" value={m.user_id} />
                          <input type="hidden" name="slug" value={app.slug} />
                          <input
                            type="hidden"
                            name="hide"
                            value={String(!isHidden)}
                          />
                          <button
                            title={isHidden ? "Uključi" : "Isključi"}
                            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                              isHidden
                                ? "border-zinc-200 text-zinc-400 line-through dark:border-zinc-700"
                                : "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300"
                            }`}
                          >
                            <AppIcon slug={app.slug} className="h-3.5 w-3.5" />
                            {app.name}
                          </button>
                        </form>
                      );
                    })}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Kreiraj člana (samo vlasnik) */}
      {isOwner && (
        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-[#20242c]">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Kreiraj člana
          </h2>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            Napravi nalog za nekoga ko još nije u aplikaciji (npr. dijete). Odmah
            se dodaje u domaćinstvo.
          </p>
          <form action={createMember} className="flex flex-wrap items-end gap-2">
            <input
              name="full_name"
              placeholder="Ime i prezime"
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="email@primjer.com"
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
            />
            <input
              name="password"
              type="text"
              required
              minLength={6}
              placeholder="Lozinka (min 6)"
              className="w-40 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
            />
            <SubmitButton
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              pendingText="Kreiram…"
            >
              Kreiraj
            </SubmitButton>
          </form>
        </section>
      )}

      {/* Pozovi člana (samo vlasnik) */}
      {isOwner && (
        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 dark:border-zinc-800 dark:bg-[#20242c]">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Pozovi postojećeg korisnika
          </h2>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            Za osobu koja se već registrovala u aplikaciji.
          </p>
          <form action={inviteMember} className="flex gap-2">
            <input
              name="email"
              type="email"
              required
              placeholder="email@primjer.com"
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
            />
            <SubmitButton
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              pendingText="Šaljem…"
            >
              Pozovi
            </SubmitButton>
          </form>

        {pending.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {pending.map((inv) => (
              <li
                key={inv.id}
                className="rounded-md border border-zinc-200 bg-white shadow-sm p-2 text-sm dark:border-zinc-800 dark:bg-[#20242c]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-black dark:text-zinc-50">{inv.email}</span>
                  <form action={revokeInvite}>
                    <input type="hidden" name="id" value={inv.id} />
                    <button className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-red-600">
                      opozovi
                    </button>
                  </form>
                </div>
                <input
                  readOnly
                  value={`${base}/invite/${inv.token}`}
                  className="mt-1 w-full rounded bg-zinc-50 px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400 dark:bg-[#20242c]"
                />
              </li>
            ))}
          </ul>
        )}
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Poziv se šalje mejlom na adresu pozvane osobe. Link iznad možeš i
            ručno proslijediti ako želiš.
          </p>
        </section>
      )}
    </main>
  );
}
