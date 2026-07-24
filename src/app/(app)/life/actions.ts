"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();
  return { supabase, user, household };
}

export async function createRecord(formData: FormData) {
  const { supabase, user, household } = await ctx();
  if (!user || !household) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const expiry = String(formData.get("expiry_date") ?? "");

  const { data: rec } = await supabase
    .from("records")
    .insert({
      household_id: household.id,
      title,
      category: String(formData.get("category") ?? "document"),
      expiry_date: expiry || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  // Obnova/istek automatski pravi podsjetnik 7 dana ranije (u 09:00).
  if (rec && expiry) {
    const d = new Date(expiry + "T09:00:00");
    d.setDate(d.getDate() - 7);
    await supabase.from("reminders").insert({
      household_id: household.id,
      title: `Uskoro ističe: ${title}`,
      remind_at: d.toISOString(),
      notify_email: true,
      source_type: "record",
      source_id: rec.id,
      created_by: user.id,
    });
  }

  revalidatePath("/life");
}

export async function editRecord(formData: FormData) {
  const { supabase } = await ctx();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return;
  await supabase
    .from("records")
    .update({
      title,
      category: String(formData.get("category") ?? "document"),
      expiry_date: String(formData.get("expiry_date") ?? "") || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", id);
  revalidatePath("/life");
}

export async function deleteRecord(formData: FormData) {
  const { supabase } = await ctx();
  await supabase.from("records").delete().eq("id", String(formData.get("id")));
  revalidatePath("/life");
}

export async function createContact(formData: FormData) {
  const { supabase, user, household } = await ctx();
  if (!user || !household) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await supabase.from("contacts").insert({
    household_id: household.id,
    name,
    role: String(formData.get("role") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    created_by: user.id,
  });
  revalidatePath("/life");
}

export async function editContact(formData: FormData) {
  const { supabase } = await ctx();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await supabase
    .from("contacts")
    .update({
      name,
      role: String(formData.get("role") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
    })
    .eq("id", id);
  revalidatePath("/life");
}

export async function deleteContact(formData: FormData) {
  const { supabase } = await ctx();
  await supabase.from("contacts").delete().eq("id", String(formData.get("id")));
  revalidatePath("/life");
}

export async function createList(formData: FormData) {
  const { supabase, user, household } = await ctx();
  if (!user || !household) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await supabase
    .from("lists")
    .insert({ household_id: household.id, name, created_by: user.id });
  revalidatePath("/life");
}

export async function deleteList(formData: FormData) {
  const { supabase } = await ctx();
  await supabase.from("lists").delete().eq("id", String(formData.get("id")));
  revalidatePath("/life");
}

export async function addListItem(formData: FormData) {
  const { supabase, user, household } = await ctx();
  if (!user || !household) return;
  const text = String(formData.get("text") ?? "").trim();
  const listId = String(formData.get("list_id") ?? "");
  if (!text || !listId) return;
  await supabase.from("list_items").insert({
    household_id: household.id,
    list_id: listId,
    text,
    created_by: user.id,
  });
  revalidatePath("/life");
}

export async function toggleListItem(formData: FormData) {
  const { supabase } = await ctx();
  const id = String(formData.get("id"));
  const done = String(formData.get("done")) === "true";
  await supabase.from("list_items").update({ done: !done }).eq("id", id);
  revalidatePath("/life");
}

export async function deleteListItem(formData: FormData) {
  const { supabase } = await ctx();
  await supabase.from("list_items").delete().eq("id", String(formData.get("id")));
  revalidatePath("/life");
}
