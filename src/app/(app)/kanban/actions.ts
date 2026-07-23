"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID = ["todo", "doing", "done"] as const;
type Status = (typeof VALID)[number];

export async function moveTask(id: string, status: Status) {
  if (!VALID.includes(status)) return;

  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  // RLS na bazi svejedno štiti: update prolazi samo za zadatke iz tvog domaćinstva.
  revalidatePath("/kanban");
  revalidatePath("/tasks");
}
