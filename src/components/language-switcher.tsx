"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useLocale, useT } from "@/components/locale-provider";
import { saveLocale } from "@/app/(app)/settings/actions";

// Kompaktni prebacivač jezika (bs/en) u gornjoj traci.
export default function LanguageSwitcher({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();

  const next = locale === "bs" ? "en" : "bs";

  function toggle() {
    start(() => {
      saveLocale(next).then(() => router.refresh());
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={`${t("language.title")} — ${next.toUpperCase()}`}
      className={
        className ??
        "flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }
    >
      <Globe className="h-4 w-4" strokeWidth={1.75} />
      {!iconOnly && locale.toUpperCase()}
    </button>
  );
}
