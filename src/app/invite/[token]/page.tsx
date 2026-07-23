import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { acceptInvite } from "../actions";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invitations")
    .select("status, households(name)")
    .eq("token", token)
    .single();

  const householdName =
    (inv?.households as unknown as { name: string } | null)?.name ?? null;

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {children}
      </div>
    </main>
  );

  if (!inv || inv.status !== "pending") {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-black dark:text-zinc-50">
          Pozivnica nije važeća
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Možda je već iskorištena ili opozvana.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          Na početnu
        </Link>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-black dark:text-zinc-50">
          Pozivnica u domaćinstvo{householdName ? ` "${householdName}"` : ""}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Da prihvatiš, prvo se prijavi ili registruj, pa ponovo otvori ovaj
          link iz mejla.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black"
        >
          Prijava / Registracija
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold text-black dark:text-zinc-50">
        Pridruži se domaćinstvu
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Pozvani ste u{" "}
        <span className="font-medium text-black dark:text-zinc-50">
          {householdName ?? "domaćinstvo"}
        </span>
        . Pridruživanjem dijelite zadatke, kalendar, finansije i ostalo.
      </p>
      <form action={acceptInvite.bind(null, token)} className="mt-4">
        <button className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black">
          Prihvati pozivnicu
        </button>
      </form>
    </Shell>
  );
}
