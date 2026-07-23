"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function createAutomation(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { household } = await getCurrentHousehold();
  if (!household) return;

  await supabase.from("automations").insert({
    household_id: household.id,
    trigger_type: String(formData.get("trigger_type")),
    action_type: String(formData.get("action_type")),
    config: { text: String(formData.get("text") ?? "").trim() },
    created_by: user.id,
  });
  revalidatePath("/apps");
}

export async function toggleAutomation(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const enabled = String(formData.get("enabled")) === "true";
  await supabase.from("automations").update({ enabled: !enabled }).eq("id", id);
  revalidatePath("/apps");
}

export async function deleteAutomation(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("automations").delete().eq("id", String(formData.get("id")));
  revalidatePath("/apps");
}

export async function toggleApp(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { household } = await getCurrentHousehold();
  if (!household) return;

  const slug = String(formData.get("slug"));
  const enabled = String(formData.get("enabled")) === "true";

  // upsert instalacije s obrnutim stanjem
  await supabase.from("app_installs").upsert(
    {
      household_id: household.id,
      slug,
      enabled: !enabled,
      created_by: user.id,
    },
    { onConflict: "household_id,slug" },
  );
  revalidatePath("/apps");
  revalidatePath("/dashboard");
}
