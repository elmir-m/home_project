"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { friendlyAuthError } from "@/lib/auth-errors";

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const origin = `${host.includes("localhost") ? "http" : "https"}://${host}`;

  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset`,
    });
  } catch {
    // Ne otkrivamo da li email postoji — uvijek ista poruka.
  }

  redirect("/forgot?sent=1");
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  let errorMsg: string | null = null;
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });
    if (error) errorMsg = friendlyAuthError(error.message);
  } catch (e) {
    errorMsg = friendlyAuthError(e instanceof Error ? e.message : undefined);
  }

  if (errorMsg) {
    redirect("/login?error=" + encodeURIComponent(errorMsg));
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const supabase = await createClient();

  const fullName = String(formData.get("full_name") ?? "").trim();
  let errorMsg: string | null = null;
  let hasSession = false;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      options: { data: { full_name: fullName } },
    });
    if (error) errorMsg = friendlyAuthError(error.message);
    else hasSession = !!data.session;
  } catch (e) {
    errorMsg = friendlyAuthError(e instanceof Error ? e.message : undefined);
  }

  if (errorMsg) {
    redirect("/register?error=" + encodeURIComponent(errorMsg));
  }

  // Ako je potvrda emaila ugašena -> odmah sesija; inače prikaži "provjeri email".
  if (hasSession) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  redirect("/register?sent=1");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
