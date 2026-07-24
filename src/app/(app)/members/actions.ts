"use server";

import { randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { sendEmail, basicEmail } from "@/lib/email";

async function baseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

export async function inviteMember(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { household } = await getCurrentHousehold();
  if (!household) return;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;

  const token = randomUUID();
  await supabase.from("invitations").insert({
    household_id: household.id,
    email,
    token,
    invited_by: user.id,
  });

  const link = `${await baseUrl()}/invite/${token}`;
  await sendEmail({
    to: email,
    subject: `Pozvani ste u domaćinstvo "${household.name}" — Home OS`,
    html: basicEmail(
      "Pozivnica u domaćinstvo",
      `Pozvani ste da se pridružite domaćinstvu <b>${household.name}</b>.<br/><br/>
       <a href="${link}">Prihvati pozivnicu</a><br/><br/>
       Ako dugme ne radi, otvori: ${link}`,
    ),
  });

  revalidatePath("/members");
}

export async function revokeInvite(formData: FormData) {
  const supabase = await createClient();
  await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/members");
}

export async function renameHousehold(formData: FormData) {
  const supabase = await createClient();
  const { household } = await getCurrentHousehold();
  if (!household) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await supabase.from("households").update({ name }).eq("id", household.id);
  revalidatePath("/members");
  revalidatePath("/dashboard");
}

// Vlasnik uključuje/isključuje pojedinu aplikaciju određenom članu.
export async function setMemberAppHidden(formData: FormData) {
  const supabase = await createClient();
  const { household } = await getCurrentHousehold();
  if (!household) return;

  const userId = String(formData.get("user_id"));
  const slug = String(formData.get("slug"));
  const hide = String(formData.get("hide")) === "true";

  if (hide) {
    await supabase.from("member_app_hidden").upsert(
      { household_id: household.id, user_id: userId, slug },
      { onConflict: "household_id,user_id,slug" },
    );
  } else {
    await supabase
      .from("member_app_hidden")
      .delete()
      .eq("household_id", household.id)
      .eq("user_id", userId)
      .eq("slug", slug);
  }
  revalidatePath("/members");
  revalidatePath("/", "layout");
}

export async function setActiveHousehold(formData: FormData) {
  const cookieStore = await cookies();
  cookieStore.set("hh", String(formData.get("id")), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
