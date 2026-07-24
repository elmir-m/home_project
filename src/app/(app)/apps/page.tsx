import Link from "next/link";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BUILTIN_APPS } from "@/lib/platform";
import { toggleApp } from "./actions";
import { AppIcon } from "@/components/app-icon";

export default async function AppsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: installs } = await supabase
    .from("app_installs")
    .select("slug, enabled");

  const installMap = new Map((installs ?? []).map((i) => [i.slug, i.enabled]));
  const isInstalled = (slug: string) => installMap.get(slug) !== false;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Aplikacije
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Instaliraj/deinstaliraj module domaćinstva. Nove aplikacije se dodaju
            na isti način i odmah rade uz postojeće.
          </p>
        </div>
        <Link
          href="/automations"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <Zap className="h-4 w-4" />
          Automatizacije
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BUILTIN_APPS.map((app) => {
          const on = isInstalled(app.slug);
          return (
            <div
              key={app.slug}
              className={`rounded-xl border p-4 ${
                on
                  ? "border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  : "border-dashed border-zinc-300 opacity-60 dark:border-zinc-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                    <AppIcon slug={app.slug} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {app.name}
                  </span>
                </span>
                <form action={toggleApp}>
                  <input type="hidden" name="slug" value={app.slug} />
                  <input type="hidden" name="enabled" value={String(on)} />
                  <button
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                      on
                        ? "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {on ? "Deinstaliraj" : "Instaliraj"}
                  </button>
                </form>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {app.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                {app.capabilities.map((c) => (
                  <span
                    key={c}
                    className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    title="koristi sposobnost"
                  >
                    ⚙ {c}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
