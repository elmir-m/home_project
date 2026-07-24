import { createClient } from "@/lib/supabase/server";

// Vraća slugove aplikacija koje trenutni korisnik NE treba vidjeti u meniju:
// (a) deinstalirane na nivou domaćinstva + (b) individualno skrivene tom članu.
export async function getHiddenSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: installs }, memberHidden] = await Promise.all([
    supabase.from("app_installs").select("slug, enabled"),
    user
      ? supabase.from("member_app_hidden").select("slug").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { slug: string }[] }),
  ]);

  const hidden = new Set<string>();
  (installs ?? []).forEach((i) => {
    if (i.enabled === false) hidden.add(i.slug);
  });
  (memberHidden.data ?? []).forEach((r) => hidden.add(r.slug));
  return [...hidden];
}
