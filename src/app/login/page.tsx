import Link from "next/link";
import { Home, Mail, Lock } from "lucide-react";
import { login } from "./actions";
import SubmitButton from "@/components/submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  const inputCls =
    "w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50 dark:placeholder:text-zinc-500";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 p-4 dark:from-zinc-950 dark:to-black">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Home className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Moj dom
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Prijavi se ili napravi nalog za svoje domaćinstvo
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-900/5 dark:border-zinc-800 dark:bg-[#20242c]">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/60 dark:text-red-300">
              {error}
            </p>
          )}
          {message && (
            <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/60 dark:text-green-300">
              {message}
            </p>
          )}

          <form className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="ti@primjer.com"
                  className={inputCls}
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Lozinka
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>
            </label>

            <div className="-mt-1 text-right">
              <Link
                href="/forgot"
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Zaboravljena lozinka?
              </Link>
            </div>

            <SubmitButton
              formAction={login}
              className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              pendingText="Prijava…"
            >
              Prijava
            </SubmitButton>

            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-[#2a2f39]" />
              ili
              <span className="h-px flex-1 bg-zinc-200 dark:bg-[#2a2f39]" />
            </div>

            <Link
              href="/register"
              className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-center text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Napravi novi nalog
            </Link>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-400">
          Zajednički kućni sistem — zadaci, kalendar, finansije i još.
        </p>
      </div>
    </main>
  );
}
