"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function createReminder(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { household } = await getCurrentHousehold();
  if (!household) return;

  const title = String(formData.get("title") ?? "").trim();
  const remindAt = String(formData.get("remind_at") ?? "");
  if (!title || !remindAt) return;

  await supabase.from("reminders").insert({
    household_id: household.id,
    title,
    remind_at: new Date(remindAt).toISOString(),
    recurrence: String(formData.get("recurrence") ?? "none"),
    target_user_id: String(formData.get("target_user_id") ?? "") || null,
    notify_email: formData.get("notify_email") === "on",
    source_type: "manual",
    created_by: user.id,
  });

  revalidatePath("/reminders");
}

export async function completeReminder(formData: FormData) {
  const supabase = await createClient();
  await supabase
    .from("reminders")
    .update({ status: "done" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/reminders");
}

export async function deleteReminder(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("reminders").delete().eq("id", String(formData.get("id")));
  revalidatePath("/reminders");
}
