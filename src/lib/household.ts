import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type Member = {
  user_id: string;
  role: string;
  profiles: { display_name: string | null; email: string | null } | null;
};

export type Household = { id: string; name: string };

// Vraća aktivno domaćinstvo (iz kolačića 'hh', ili prvo), sve članove i listu svih
// domaćinstava kojima korisnik pripada (za prebacivanje). RLS garantuje pristup.
export async function getCurrentHousehold() {
  const supabase = await createClient();

  const { data: households } = await supabase
    .from("households")
    .select("id, name")
    .order("created_at", { ascending: true });

  const list = (households as Household[]) ?? [];

  const cookieStore = await cookies();
  const active = cookieStore.get("hh")?.value;
  const household = list.find((h) => h.id === active) ?? list[0] ?? null;

  if (!household) {
    return { household: null, households: list, members: [] as Member[] };
  }

  const { data } = await supabase
    .from("household_members")
    .select("user_id, role, profiles(display_name, email)")
    .eq("household_id", household.id);

  return {
    household,
    households: list,
    members: (data as unknown as Member[]) ?? [],
  };
}
