import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type Member = {
  user_id: string;
  role: string;
  profiles: {
    display_name: string | null;
    email: string | null;
    avatar_url?: string | null;
  } | null;
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  if (!household) {
    return {
      household: null,
      households: list,
      members: [] as Member[],
      userId,
      isOwner: false,
    };
  }

  const { data } = await supabase
    .from("household_members")
    .select("user_id, role, profiles(display_name, email, avatar_url)")
    .eq("household_id", household.id);

  const members = (data as unknown as Member[]) ?? [];
  const isOwner = members.some(
    (m) => m.user_id === userId && m.role === "owner",
  );

  return {
    household,
    households: list,
    members,
    userId,
    isOwner,
  };
}

// Pomoćnik za UI: smije li trenutni korisnik uređivati/brisati stavku.
// Pravilo (usklađeno s RLS 0021): autor stavke ILI vlasnik domaćinstva.
export function canManage(
  createdBy: string | null | undefined,
  userId: string | null,
  isOwner: boolean,
): boolean {
  return isOwner || (!!userId && createdBy === userId);
}
