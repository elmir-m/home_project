"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Označi sve moje notifikacije kao pročitane.
export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
}

// Obriši jednu moju notifikaciju.
export async function dismissNotification(formData: FormData) {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
}

// Prihvati pozivnicu direktno iz notifikacije.
export async function acceptInviteNotif(formData: FormData) {
  const token = String(formData.get("token"));
  const notifId = String(formData.get("notif_id"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invitations")
    .select("id, household_id, status")
    .eq("token", token)
    .single();

  if (inv && inv.status === "pending") {
    await admin.from("household_members").upsert(
      { household_id: inv.household_id, user_id: user!.id, role: "member" },
      { onConflict: "household_id,user_id" },
    );
    await admin
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", inv.id);

    const cookieStore = await cookies();
    cookieStore.set("hh", inv.household_id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  if (notifId) {
    await supabase.from("notifications").delete().eq("id", notifId);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// Odbij pozivnicu iz notifikacije.
export async function declineInviteNotif(formData: FormData) {
  const token = String(formData.get("token"));
  const notifId = String(formData.get("notif_id"));

  if (token) {
    const admin = createAdminClient();
    await admin
      .from("invitations")
      .update({ status: "revoked" })
      .eq("token", token)
      .eq("status", "pending");
  }

  const supabase = await createClient();
  if (notifId) {
    await supabase.from("notifications").delete().eq("id", notifId);
  }

  revalidatePath("/", "layout");
}
