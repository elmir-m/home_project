import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";
import RealtimeRefresh from "@/components/realtime-refresh";
import HouseholdOnboarding from "@/components/household-onboarding";
import HelpTour from "@/components/help-tour";
import { LocaleProvider } from "@/components/locale-provider";
import { getHiddenSlugs } from "@/lib/visibility";
import { getCurrentHousehold } from "@/lib/household";
import { getLocale } from "@/lib/i18n-server";

// Layout za sve prijavljene stranice: sidebar + gornja traka + provjera sesije.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { households } = await getCurrentHousehold();
  const locale = await getLocale();

  // Korisnik još nije član nijednog domaćinstva -> onboarding (napravi ili se pridruži).
  if (households.length === 0) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    return (
      <LocaleProvider locale={locale}>
        <div className="flex min-h-screen flex-col">
          <RealtimeRefresh />
          <TopBar minimal />
          <HouseholdOnboarding
            name={prof?.display_name ?? ""}
            email={user.email ?? ""}
          />
        </div>
      </LocaleProvider>
    );
  }

  // Skrivene aplikacije za ovog korisnika (household deinstalirane + individualno skrivene).
  const hidden = await getHiddenSlugs();

  return (
    <LocaleProvider locale={locale}>
      <div className="flex min-h-screen">
        <RealtimeRefresh />
        <HelpTour />
        <Sidebar hidden={hidden} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </LocaleProvider>
  );
}
