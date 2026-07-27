"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type ChatMessage = {
  id: string;
  user_id: string | null;
  body: string;
  created_at: string;
};

export type MemberInfo = { name: string; avatar: string | null };

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("bs-BA", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("bs-BA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ChatClient({
  householdId,
  householdName,
  currentUserId,
  initialMessages,
  members,
}: {
  householdId: string;
  householdName: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  members: Record<string, MemberInfo>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const seen = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));

  // Realtime: nove poruke ovog domaćinstva stižu uživo.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${householdId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          if (seen.current.has(m.id)) return;
          seen.current.add(m.id);
          setMessages((prev) => [...prev, m]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  // Auto-scroll na dno kad stigne/pošalje se poruka.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ household_id: householdId, user_id: currentUserId, body })
      .select("id, user_id, body, created_at")
      .single();
    setSending(false);
    if (error) {
      alert("Slanje nije uspjelo. Pokušaj ponovo.");
      return;
    }
    setText("");
    if (data && !seen.current.has(data.id)) {
      seen.current.add(data.id);
      setMessages((prev) => [...prev, data as ChatMessage]);
    }
  }

  let lastDay = "";

  return (
    <main className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col p-4 sm:p-6">
      <div className="mb-3 shrink-0">
        <h1 className="text-2xl font-bold text-black dark:text-zinc-50">Chat</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{householdName}</p>
      </div>

      {/* Poruke */}
      <div className="flex-1 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#20242c]">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
            Još nema poruka. Napiši prvu!
          </p>
        )}
        {messages.map((m) => {
          const mine = m.user_id === currentUserId;
          const info = m.user_id ? members[m.user_id] : undefined;
          const name = info?.name ?? "Član";
          const day = dayLabel(m.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs text-zinc-500 dark:bg-[#2a2f39] dark:text-zinc-400">
                    {day}
                  </span>
                </div>
              )}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-900 dark:bg-[#2a2f39] dark:text-zinc-50"
                  }`}
                >
                  {!mine && (
                    <p className="mb-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {name}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={`mt-0.5 text-right text-[10px] ${
                      mine ? "text-indigo-200" : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {timeLabel(m.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Slanje */}
      <form onSubmit={send} className="mt-3 flex shrink-0 items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e);
            }
          }}
          rows={1}
          placeholder="Napiši poruku…"
          className="max-h-32 flex-1 resize-none rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-black shadow-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50"
          title="Pošalji"
        >
          <Send className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </form>
    </main>
  );
}
