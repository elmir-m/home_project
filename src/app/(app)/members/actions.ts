"use server";

import { randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentHousehold } from "@/lib/household";
import { sendEmail, basicEmail } from "@/lib/email";
import { notify } from "@/lib/notifications";
import { getT } from "@/lib/i18n-server";

const enc = (s: string) => encodeURIComponent(s);

async function baseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

// Konktekst + provjera da je trenutni korisnik vlasnik aktivnog domaćinstva.
async function ownerCtx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { household, members } = await getCurrentHousehold();
  const isOwner =
    !!user && members.find((m) => m.user_id === user.id)?.role === "owner";
  return { supabase, user, household, isOwner };
}

export async function inviteMember(formData: FormData) {
  const { user, household, isOwner } = await ownerCtx();
  if (!user || !household) return;
  const t = await getT();
  if (!isOwner)
    redirect("/members?error=" + enc(t("members.err.ownerOnlyInvite")));

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;

  // Poziv je moguć samo za osobu koja VEĆ ima nalog u aplikaciji.
  const admin = createAdminClient();
  const { data: prof } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!prof) {
    redirect("/members?error=" + enc(t("members.err.notRegistered")));
  }

  const { data: already } = await admin
    .from("household_members")
    .select("user_id")
    .eq("household_id", household.id)
    .eq("user_id", prof!.id)
    .maybeSingle();
  if (already) {
    redirect("/members?error=" + enc(t("members.err.alreadyMember")));
  }

  const token = randomUUID();
  await admin.from("invitations").insert({
    household_id: household.id,
    email,
    token,
    invited_by: user.id,
  });

  // Notifikacija u aplikaciji — pozvani (koji već ima nalog) je odmah vidi i može prihvatiti.
  await notify({
    userId: prof!.id,
    type: "invite",
    title: `Pozivnica u domaćinstvo „${household.name}“`,
    body: "Klikni „Prihvati“ da se pridružiš.",
    data: { token, household_id: household.id, household_name: household.name },
  });

  const link = `${await baseUrl()}/invite/${token}`;
  await sendEmail({
    to: email,
    subject: `Pozvani ste u domaćinstvo "${household.name}" — Moj dom`,
    html: basicEmail(
      "Pozivnica u domaćinstvo",
      `Pozvani ste da se pridružite domaćinstvu <b>${household.name}</b>. Klikom na dugme ispod pridružujete se i dijelite zadatke, kalendar, finansije i ostalo.`,
      { cta: { href: link, label: "Prihvati pozivnicu" }, preview: `Pridruži se domaćinstvu ${household.name}` },
    ),
  });

  redirect("/members?invited=1");
}

// Vlasnik pravi nalog za novog člana (npr. dijete) i dodaje ga u domaćinstvo.
export async function createMember(formData: FormData) {
  const { household, isOwner } = await ownerCtx();
  if (!household) return;
  const t = await getT();
  if (!isOwner)
    redirect("/members?error=" + enc(t("members.err.ownerOnlyCreate")));

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || password.length < 6) {
    redirect(
      "/members?error=" + enc(t("members.err.emailPasswordRequired")),
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    const m = (error?.message ?? "").toLowerCase();
    const msg = m.includes("already")
      ? t("members.err.userExists")
      : t("members.err.createFailed");
    redirect("/members?error=" + enc(msg));
  }

  await admin.from("household_members").upsert(
    { household_id: household.id, user_id: data!.user.id, role: "member" },
    { onConflict: "household_id,user_id" },
  );

  revalidatePath("/members");
  revalidatePath("/", "layout");
  redirect("/members?created=" + enc(email));
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
