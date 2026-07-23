"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { emitEvent } from "@/lib/platform";

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

  await emitEvent(supabase, household.id, "task.created", { title }, user.id);
  revalidatePath("/tasks");
}

export async function toggleTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const id = String(formData.get("id"));
  const done = String(formData.get("done")) === "true";

  const { data: task } = await supabase
    .from("tasks")
    .update({
      status: done ? "todo" : "done",
      completed_at: done ? null : new Date().toISOString(),
    })
    .eq("id", id)
    .select("household_id, title")
    .single();

  // Prelazak u "završeno" -> objavi događaj (za automatizacije).
  if (!done && task) {
    await emitEvent(
      supabase,
      task.household_id,
      "task.completed",
      { title: task.title },
      user?.id ?? null,
    );
  }

  revalidatePath("/tasks");
}

export async function deleteTask(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", String(formData.get("id")));
  revalidatePath("/tasks");
}
