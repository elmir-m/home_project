import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveNotificationPrefs } from "./actions";
import Appearance from "./appearance";
import { getT } from "@/lib/i18n-server";

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

const CATEGORIES: { key: keyof Prefs; i18n: string }[] = [
  { key: "email_reminders", i18n: "reminders" },
  { key: "email_tasks", i18n: "tasks" },
  { key: "email_bills", i18n: "bills" },
  { key: "email_shared", i18n: "shared" },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getT();

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
        <h1 className="text-2xl font-bold text-black sm:text-3xl dark:text-zinc-50">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("settings.loggedAs", { email: user.email ?? "" })}
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
          {t("notif.title")}
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
                {t(`notif.${c.i18n}`)}
              </span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {t(`notif.${c.i18n}.desc`)}
              </span>
            </span>
          </label>
        ))}

        <div className="mt-2">
          <label className="block text-sm font-medium text-black dark:text-zinc-50">
            {t("notif.digest")}
          </label>
          <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("notif.digest.desc")}
          </p>
          <select
            name="digest"
            defaultValue={prefs.digest}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
          >
            <option value="none">{t("digest.none")}</option>
            <option value="daily">{t("digest.daily")}</option>
            <option value="weekly">{t("digest.weekly")}</option>
          </select>
        </div>

        <button className="mt-2 self-start rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white">
          {t("common.save")}
        </button>
      </form>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {t("settings.emailFooter")}
      </p>
    </main>
  );
}
