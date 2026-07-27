import { Home, UserPlus, Bell } from "lucide-react";
import { createHousehold } from "@/app/(app)/dashboard/actions";
import SubmitButton from "@/components/submit-button";
import { getT } from "@/lib/i18n-server";

// Prikazuje se kad korisnik još nije član nijednog domaćinstva.
// Bira: napraviti svoje ILI sačekati pozivnicu.
export default async function HouseholdOnboarding({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const t = await getT();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold text-black sm:text-3xl dark:text-zinc-50">
          {t("ob.welcome", { name: name ? `, ${name}` : "" })}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t("ob.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Napravi svoje */}
        <section className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#20242c]">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Home className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            {t("ob.create.title")}
          </h2>
          <p className="mt-1 mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            {t("ob.create.desc")}
          </p>
          <form action={createHousehold} className="mt-auto flex flex-col gap-2">
            <label className="text-sm font-medium text-black dark:text-zinc-50">
              {t("ob.create.nameLabel")}
            </label>
            <input
              name="name"
              required
              placeholder={t("ob.create.placeholder")}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-black dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
            />
            <SubmitButton
              className="mt-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              pendingText={t("ob.create.pending")}
            >
              {t("ob.create.btn")}
            </SubmitButton>
          </form>
        </section>

        {/* Pridruži se */}
        <section className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#20242c]">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-200 text-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-200">
            <UserPlus className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            {t("ob.join.title")}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {t("ob.join.desc")}
          </p>
          <p className="mt-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-black dark:bg-[#2a2f39] dark:text-zinc-50">
            {email}
          </p>
          <div className="mt-auto flex items-start gap-2 pt-4 text-sm text-zinc-500 dark:text-zinc-400">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
            <span>{t("ob.join.bell")}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
