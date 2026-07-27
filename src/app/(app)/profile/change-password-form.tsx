"use client";

import { KeyRound } from "lucide-react";
import Modal from "@/components/modal";
import SubmitButton from "@/components/submit-button";
import { useT } from "@/components/locale-provider";
import { changePassword } from "./actions";

const input =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function ChangePasswordForm() {
  const t = useT();
  return (
    <Modal
      title={t("pwd.title")}
      trigger={(open) => (
        <button
          onClick={open}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-[#2a2f39]"
        >
          <KeyRound className="h-4 w-4" />
          {t("pwd.change")}
        </button>
      )}
    >
      {() => (
        <form action={changePassword} className="flex flex-col gap-4">
          <Field label={t("pwd.current")}>
            <input type="password" name="old_password" required autoFocus className={input} />
          </Field>
          <Field label={t("pwd.new")}>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder={t("pwd.min")}
              className={input}
            />
          </Field>
          <Field label={t("pwd.repeat")}>
            <input type="password" name="password2" required minLength={6} className={input} />
          </Field>
          <SubmitButton
            className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            pendingText={t("pwd.changing")}
          >
            {t("pwd.change")}
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}
