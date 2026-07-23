import { createClient } from "@/lib/supabase/server";

export type Member = {
  user_id: string;
  role: string;
  profiles: { display_name: string | null; email: string | null } | null;
};

// Vraća trenutno (prvo) domaćinstvo korisnika + njegove članove.
// RLS garantuje da korisnik dobije samo domaćinstva kojima pripada.
export async function getCurrentHousehold() {
  const supabase = await createClient();

  const { data: households } = await supabase
    .from("households")
    .select("id, name")
    .order("created_at", { ascending: true })
    .limit(1);

  const household = households?.[0] ?? null;
  if (!household) return { household: null, members: [] as Member[] };

  const { data } = await supabase
    .from("household_members")
    .select("user_id, role, profiles(display_name, email)")
    .eq("household_id", household.id);

  return { household, members: (data as unknown as Member[]) ?? [] };
}
