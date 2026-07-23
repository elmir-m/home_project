"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

// Brzi unos zadatka / bilješke / podsjetnika s bilo koje stranice.
export async function quickAdd(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { household } = await getCurrentHousehold();
  if (!household) return;

  const type = String(formData.get("type") ?? "task");
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  if (type === "note") {
    await supabase.from("notes").insert({
      household_id: household.id,
      kind: "note",
      title: text,
      created_by: user.id,
    });
  } else if (type === "reminder") {
    await supabase.from("reminders").insert({
      household_id: household.id,
      title: text,
      remind_at: new Date(Date.now() + 3600_000).toISOString(), // za 1h
      notify_email: true,
      source_type: "manual",
      created_by: user.id,
    });
  } else {
    await supabase.from("tasks").insert({
      household_id: household.id,
      title: text,
      created_by: user.id,
    });
  }

  revalidatePath("/", "layout");
}
