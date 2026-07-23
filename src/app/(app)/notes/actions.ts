"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function createNote(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { household } = await getCurrentHousehold();
  if (!household) return;

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title && !body) return;

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { data: note } = await supabase
    .from("notes")
    .insert({
      household_id: household.id,
      kind: String(formData.get("kind") ?? "note"),
      title: title || null,
      body: body || null,
      tags,
      created_by: user.id,
    })
    .select("id")
    .single();

  // Opciona veza: vrijednost je "task:<id>" ili "event:<id>".
  const link = String(formData.get("link") ?? "");
  if (note && link.includes(":")) {
    const [target_type, target_id] = link.split(":");
    await supabase.from("links").insert({
      household_id: household.id,
      source_type: "note",
      source_id: note.id,
      target_type,
      target_id,
      created_by: user.id,
    });
  }

  revalidatePath("/notes");
}

export async function deleteNote(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("links").delete().eq("source_type", "note").eq("source_id", id);
  await supabase.from("notes").delete().eq("id", id);
  revalidatePath("/notes");
}
