"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function acceptInvite(token: string) {
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

  if (!inv || inv.status !== "pending") redirect("/dashboard");

  await admin.from("household_members").upsert(
    { household_id: inv.household_id, user_id: user.id, role: "member" },
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

  redirect("/dashboard");
}
