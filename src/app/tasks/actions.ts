"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { household } = await getCurrentHousehold();
  if (!household) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const dueRaw = String(formData.get("due_date") ?? "");
  const assigneeRaw = String(formData.get("assignee_id") ?? "");

  await supabase.from("tasks").insert({
    household_id: household.id,
    title,
    priority: String(formData.get("priority") ?? "medium"),
    due_date: dueRaw || null,
    assignee_id: assigneeRaw || null,
    created_by: user.id,
  });

  revalidatePath("/tasks");
}

export async function toggleTask(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const done = String(formData.get("done")) === "true";

  await supabase
    .from("tasks")
    .update({
      status: done ? "todo" : "done",
      completed_at: done ? null : new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/tasks");
}

export async function deleteTask(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", String(formData.get("id")));
  revalidatePath("/tasks");
}
