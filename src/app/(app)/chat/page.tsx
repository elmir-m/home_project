import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import ChatClient, { type ChatMessage, type MemberInfo } from "./chat-client";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { household, members } = await getCurrentHousehold();

  if (!household) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50">Chat</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Nemaš aktivno domaćinstvo.
        </p>
      </main>
    );
  }

  const { data } = await supabase
    .from("messages")
    .select("id, user_id, body, created_at")
    .eq("household_id", household.id)
    .order("created_at", { ascending: true })
    .limit(200);

  const memberMap: Record<string, MemberInfo> = {};
  for (const m of members) {
    memberMap[m.user_id] = {
      name: m.profiles?.display_name ?? m.profiles?.email ?? "Član",
      avatar: m.profiles?.avatar_url ?? null,
    };
  }

  return (
    <ChatClient
      householdId={household.id}
      householdName={household.name}
      currentUserId={user.id}
      initialMessages={(data as ChatMessage[]) ?? []}
      members={memberMap}
    />
  );
}
