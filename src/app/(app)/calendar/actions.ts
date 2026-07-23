"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { household } = await getCurrentHousehold();
  if (!household) return;

  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("event_date") ?? "");
  if (!title || !date) return;

  const start = String(formData.get("start_time") ?? "");

  await supabase.from("calendar_events").insert({
    household_id: household.id,
    title,
    event_date: date,
    start_time: start || null,
    created_by: user.id,
  });

  revalidatePath("/calendar");
}

export async function deleteEvent(formData: FormData) {
  const supabase = await createClient();
  await supabase
    .from("calendar_events")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidatePath("/calendar");
}
