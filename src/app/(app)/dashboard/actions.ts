"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Kreira novo domaćinstvo (trenutni korisnik postaje vlasnik) i postavlja ga kao aktivno.
export async function createHousehold(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim() || "Moje domaćinstvo";

  const { data: newId, error } = await supabase.rpc("create_household", {
    p_name: name,
  });

  if (error || !newId) {
    redirect(
      "/dashboard?error=" +
        encodeURIComponent("Nije moguće kreirati domaćinstvo. Pokušaj ponovo."),
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("hh", String(newId), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  redirect("/dashboard?welcome=1");
}
