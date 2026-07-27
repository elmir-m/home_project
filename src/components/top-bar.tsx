import Link from "next/link";
import { Search, LogOut } from "lucide-react";
import QuickCapture from "@/components/quick-capture";
import ThemeToggle from "@/components/theme-toggle";
import NotificationsBell, { type Notif } from "@/components/notifications-bell";
import MobileNav from "@/components/mobile-nav";
import { HelpButton } from "@/components/help-tour";
import { logout } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { getHiddenSlugs } from "@/lib/visibility";

// Gornja traka: hamburger (mobilni) + pretraga (lijevo); identitet, notifikacije,
// pomoć, tema, brzi upis, odjava (desno). `minimal` = onboarding (bez navigacije).
export default async function TopBar({ minimal = false }: { minimal?: boolean }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { household, members } = await getCurrentHousehold();
  const me = members.find((m) => m.user_id === user?.id);
  const name = me?.profiles?.display_name ?? user?.email ?? "";
  const email = user?.email ?? "";
  const role = me?.role === "owner" ? "vlasnik" : "član";
  const initial = (name || email).charAt(0).toUpperCase();

  const { data: prof } = user
    ? await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
    : { data: null };
  const avatarUrl = prof?.avatar_url ?? null;

  const { data: notifs } = user
    ? await supabase
        .from("notifications")
        .select("id, type, title, body, data, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const hidden = minimal ? [] : await getHiddenSlugs();

  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-zinc-200 bg-[var(--background)]/80 px-3 py-3 backdrop-blur sm:gap-3 sm:px-6 dark:border-zinc-800">
      {minimal ? (
        <div className="flex-1" />
      ) : (
        <>
          <MobileNav hidden={hidden} />
          <form action="/search" className="flex-1">
            <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-700 dark:bg-[#2a2f39]">
              <Search className="h-4 w-4 shrink-0 text-zinc-400" />
              <input
                name="q"
                placeholder="Traži kroz sve…"
                className="w-full border-0 bg-transparent py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
              />
            </div>
          </form>
        </>
      )}

      {/* Identitet prijavljenog korisnika (klik → profil) */}
      <Link
        href="/profile"
        title="Moj profil"
        className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-[#20242c] dark:hover:bg-[#2a2f39]"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="avatar"
            className="h-7 w-7 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            {initial}
          </span>
        )}
        <span className="hidden leading-tight sm:block">
          <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {name}
          </span>
          <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
            {role}
            {household ? ` · ${household.name}` : ""}
          </span>
        </span>
      </Link>

      {user && (
        <NotificationsBell userId={user.id} initial={(notifs as Notif[]) ?? []} />
      )}
      {!minimal && <HelpButton />}
      <ThemeToggle />
      {!minimal && <QuickCapture />}

      <form action={logout}>
        <button
          title={`Odjava (${email})`}
          className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Odjava</span>
        </button>
      </form>
    </header>
  );
}
