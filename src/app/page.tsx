export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-8 text-center dark:bg-black">
      <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
        Home OS
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Hello World — platforma radi. 🎉
      </p>
      <a
        href="/login"
        className="mt-2 rounded-md bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
      >
        Prijava
      </a>
    </main>
  );
}
