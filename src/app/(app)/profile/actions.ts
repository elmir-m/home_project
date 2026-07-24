"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyAuthError } from "@/lib/auth-errors";

const enc = (s: string) => encodeURIComponent(s);

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("display_name") ?? "").trim();
  if (!name) redirect("/profile?error=" + enc("Ime ne može biti prazno."));

  await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
  await supabase.auth.updateUser({ data: { full_name: name } });

  revalidatePath("/", "layout");
  redirect("/profile?ok=name");
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();
  const pw = String(formData.get("password") ?? "");
  const pw2 = String(formData.get("password2") ?? "");

  if (pw.length < 6)
    redirect("/profile?error=" + enc("Lozinka mora imati najmanje 6 znakova."));
  if (pw !== pw2)
    redirect("/profile?error=" + enc("Lozinke se ne poklapaju."));

  let errorMsg: string | null = null;
  try {
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) errorMsg = friendlyAuthError(error.message);
  } catch (e) {
    errorMsg = friendlyAuthError(e instanceof Error ? e.message : undefined);
  }

  if (errorMsg) redirect("/profile?error=" + enc(errorMsg));
  redirect("/profile?ok=pass");
}
