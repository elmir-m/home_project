"use server";

import { revalidatePath } from "next/cache";
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

export async function createTransaction(formData: FormData) {
  const { supabase, user, household } = await ctx();
  if (!user || !household) return;

  const amount = Number(formData.get("amount"));
  if (!amount || amount <= 0) return;

  await supabase.from("transactions").insert({
    household_id: household.id,
    kind: String(formData.get("kind") ?? "expense"),
    amount,
    category: String(formData.get("category") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    occurred_on: String(formData.get("occurred_on") || "") || undefined,
    paid_by: String(formData.get("paid_by") ?? "") || user.id,
    created_by: user.id,
  });
  await emitEvent(
    supabase,
    household.id,
    "transaction.created",
    { title: String(formData.get("description") ?? "transakcija"), amount },
    user.id,
  );
  revalidatePath("/finance");
}

export async function editTransaction(formData: FormData) {
  const { supabase, household } = await ctx();
  if (!household) return;
  const id = String(formData.get("id"));
  const amount = Number(formData.get("amount"));
  if (!id || !amount || amount <= 0) return;

  await supabase
    .from("transactions")
    .update({
      kind: String(formData.get("kind") ?? "expense"),
      amount,
      category: String(formData.get("category") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      occurred_on: String(formData.get("occurred_on") || "") || undefined,
      paid_by: String(formData.get("paid_by") ?? "") || null,
    })
    .eq("id", id);
  revalidatePath("/finance");
}

export async function deleteTransaction(formData: FormData) {
  const { supabase } = await ctx();
  await supabase.from("transactions").delete().eq("id", String(formData.get("id")));
  revalidatePath("/finance");
}

export async function createBill(formData: FormData) {
  const { supabase, user, household } = await ctx();
  if (!user || !household) return;

  const amount = Number(formData.get("amount"));
  const name = String(formData.get("name") ?? "").trim();
  const due = String(formData.get("due_date") ?? "");
  if (!name || !amount || !due) return;

  await supabase.from("bills").insert({
    household_id: household.id,
    name,
    amount,
    due_date: due,
    recurrence: String(formData.get("recurrence") ?? "monthly"),
    category: String(formData.get("category") ?? "").trim() || null,
    created_by: user.id,
  });
  await emitEvent(supabase, household.id, "bill.created", { title: name, amount }, user.id);
  revalidatePath("/finance");
}

export async function editBill(formData: FormData) {
  const { supabase, household } = await ctx();
  if (!household) return;
  const id = String(formData.get("id"));
  const amount = Number(formData.get("amount"));
  const name = String(formData.get("name") ?? "").trim();
  const due = String(formData.get("due_date") ?? "");
  if (!id || !name || !amount || !due) return;

  await supabase
    .from("bills")
    .update({
      name,
      amount,
      due_date: due,
      recurrence: String(formData.get("recurrence") ?? "monthly"),
      category: String(formData.get("category") ?? "").trim() || null,
    })
    .eq("id", id);
  revalidatePath("/finance");
}

export async function deleteBill(formData: FormData) {
  const { supabase } = await ctx();
  await supabase.from("bills").delete().eq("id", String(formData.get("id")));
  revalidatePath("/finance");
}
