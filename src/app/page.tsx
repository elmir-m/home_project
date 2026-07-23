export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-8 text-center dark:bg-black">
      <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
        Home OS
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Hello World — platforma radi. 🎉
      </p>
      <p className="text-sm text-zinc-400">
        Next.js + Supabase · sljedeći korak: deploy pa auth
      </p>
    </main>
  );
}
