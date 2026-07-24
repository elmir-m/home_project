import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";
import RealtimeRefresh from "@/components/realtime-refresh";

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

  // Deinstalirane aplikacije (enabled=false) se ne prikazuju u meniju.
  const { data: installs } = await supabase
    .from("app_installs")
    .select("slug, enabled");
  const hidden = (installs ?? [])
    .filter((i) => i.enabled === false)
    .map((i) => i.slug);

  return (
    <div className="flex min-h-screen">
      <RealtimeRefresh />
      <Sidebar hidden={hidden} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
