"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { emitEvent } from "@/lib/platform";

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();
  return { supabase, user, household };
}

export async function addShoppingItem(formData: FormData) {
  const { supabase, user, household } = await ctx();
  if (!user || !household) return;
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  await supabase.from("shopping_items").insert({
    household_id: household.id,
    text,
    quantity: String(formData.get("quantity") ?? "").trim() || null,
    created_by: user.id,
  });

  // Objavi događaj — druge aplikacije/automatizacije mogu reagovati.
  await emitEvent(supabase, household.id, "shopping.added", { title: text }, user.id);
  revalidatePath("/shopping");
}

export async function toggleShoppingItem(formData: FormData) {
  const { supabase } = await ctx();
  const id = String(formData.get("id"));
  const done = String(formData.get("done")) === "true";
  await supabase.from("shopping_items").update({ done: !done }).eq("id", id);
  revalidatePath("/shopping");
}

export async function deleteShoppingItem(formData: FormData) {
  const { supabase } = await ctx();
  await supabase.from("shopping_items").delete().eq("id", String(formData.get("id")));
  revalidatePath("/shopping");
}

export async function clearDone() {
  const { supabase, household } = await ctx();
  if (!household) return;
  await supabase
    .from("shopping_items")
    .delete()
    .eq("household_id", household.id)
    .eq("done", true);
  revalidatePath("/shopping");
}

// Koristi zajedničku sposobnost "podsjetnici" — napravi podsjetnik za kupovinu.
export async function remindShopping() {
  const { supabase, user, household } = await ctx();
  if (!user || !household) return;

  const { count } = await supabase
    .from("shopping_items")
    .select("id", { count: "exact", head: true })
    .eq("household_id", household.id)
    .eq("done", false);

  await supabase.from("reminders").insert({
    household_id: household.id,
    title: `🛒 Kupovina — ${count ?? 0} stavki`,
    remind_at: new Date(Date.now() + 2 * 3600_000).toISOString(), // za 2h
    notify_email: true,
    source_type: "shopping",
    created_by: user.id,
  });
  revalidatePath("/shopping");
  redirect("/shopping?reminded=1");
}
