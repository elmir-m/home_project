import { createAdminClient } from "@/lib/supabase/admin";

// Kreira notifikaciju za bilo kojeg korisnika (npr. primaoca pozivnice).
// Koristi admin klijent jer RLS insert za tuđi user_id ne bi prošao.
// SAMO za server (server actions / rute).
export async function notify(params: {
  userId: string;
  type?: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: params.userId,
    type: params.type ?? "generic",
    title: params.title,
    body: params.body ?? null,
    data: params.data ?? {},
  });
}
