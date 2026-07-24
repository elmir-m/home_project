import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";
import SubmitButton from "@/components/submit-button";
import ChangePasswordForm from "./change-password-form";
import AvatarUpload from "./avatar-upload";

const input =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50";
const label = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();
  const name = profile?.display_name ?? "";
  const initial = (name || user.email || "?").charAt(0).toUpperCase();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Moj profil
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
      </div>

      <AvatarUpload
        userId={user.id}
        avatarUrl={profile?.avatar_url ?? null}
        initial={initial}
      />

      {sp.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {sp.error}
        </p>
      )}
      {sp.ok === "name" && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/50 dark:text-green-300">
          ✓ Profil ažuriran.
        </p>
      )}
      {sp.ok === "pass" && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/50 dark:text-green-300">
          ✓ Lozinka promijenjena.
        </p>
      )}

      {/* Podaci */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#20242c]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Osnovni podaci
        </h2>
        <form action={updateProfile} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={label}>Ime i prezime</span>
            <input name="display_name" defaultValue={name} required className={input} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Email (ne može se mijenjati)</span>
            <input defaultValue={user.email ?? ""} disabled className={input} />
          </label>
          <SubmitButton
            className="self-start rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            pendingText="Čuvam…"
          >
            Sačuvaj
          </SubmitButton>
        </form>
      </section>

      {/* Lozinka */}
      <section className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#20242c]">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Lozinka
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Za promjenu je potrebna trenutna lozinka.
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
