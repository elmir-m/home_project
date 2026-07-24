"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveNotificationPrefs(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notification_prefs").upsert(
    {
      user_id: user.id,
      email_reminders: formData.get("email_reminders") === "on",
      email_tasks: formData.get("email_tasks") === "on",
      email_bills: formData.get("email_bills") === "on",
      email_shared: formData.get("email_shared") === "on",
      digest: String(formData.get("digest") ?? "none"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/settings");
}
