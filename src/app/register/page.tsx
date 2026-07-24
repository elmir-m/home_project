import Link from "next/link";
import { Home, Mail, Lock, User, MailCheck } from "lucide-react";
import { register } from "../login/actions";
import SubmitButton from "@/components/submit-button";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  const inputCls =
    "w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 p-4 dark:from-zinc-950 dark:to-black">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Home className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {sent ? "Provjeri email" : "Napravi nalog"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {sent
              ? "Poslali smo ti aktivacijski link"
              : "Registracija za tvoje domaćinstvo"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-900/5 dark:border-zinc-800 dark:bg-[#20242c]">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
                <MailCheck className="h-7 w-7" />
              </span>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Poslali smo ti email s linkom za aktivaciju naloga. Otvori ga i
                klikni na link, pa se prijavi.
              </p>
              <p className="text-xs text-zinc-400">
                Ne vidiš mejl? Provjeri i spam/promocije folder.
              </p>
              <Link
                href="/login"
                className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Idi na prijavu
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/60 dark:text-red-300">
                  {error}
                </p>
              )}
              <form action={register} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Ime i prezime
                  </span>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      name="full_name"
                      required
                      autoComplete="name"
                      placeholder="John Doe"
                      className={inputCls}
                    />
                  </div>
                </label>

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
                      autoComplete="new-password"
                      placeholder="Najmanje 6 znakova"
                      className={inputCls}
                    />
                  </div>
                </label>

                <SubmitButton
                  className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  pendingText="Kreiram nalog…"
                >
                  Registruj se
                </SubmitButton>
              </form>
            </>
          )}
        </div>

        {!sent && (
          <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Već imaš nalog?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Prijavi se
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
