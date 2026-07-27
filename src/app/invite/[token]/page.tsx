import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { acceptInvite } from "../actions";
import { getT } from "@/lib/i18n-server";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getT();

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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-[#191c23]">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-sm bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-[#20242c] dark:bg-[#20242c]">
        {children}
      </div>
    </main>
  );

  if (!inv || inv.status !== "pending") {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-black dark:text-zinc-50">
          {t("auth.invite.invalidTitle")}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {t("auth.invite.invalidBody")}
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          {t("auth.invite.home")}
        </Link>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-black dark:text-zinc-50">
          {t("auth.invite.title")}
          {householdName ? ` "${householdName}"` : ""}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {t("auth.invite.loginFirst")}
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white dark:bg-indigo-500 dark:text-white"
        >
          {t("auth.invite.loginOrRegister")}
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold text-black dark:text-zinc-50">
        {t("auth.invite.joinTitle")}
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        {t("auth.invite.invitedTo")}{" "}
        <span className="font-medium text-black dark:text-zinc-50">
          {householdName ?? t("auth.invite.aHousehold")}
        </span>
        {t("auth.invite.shareNote")}
      </p>
      <form action={acceptInvite.bind(null, token)} className="mt-4">
        <button className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white">
          {t("auth.invite.accept")}
        </button>
      </form>
    </Shell>
  );
}
