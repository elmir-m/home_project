"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, Smile, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT, useLocale } from "@/components/locale-provider";
import { localeTag } from "@/lib/i18n";

export type ChatMessage = {
  id: string;
  user_id: string | null;
  body: string;
  created_at: string;
};
export type MemberInfo = { name: string; avatar: string | null };

const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎","🤔","😐",
  "😢","😭","😡","😴","🥳","🤗","🙌","👍","👎","👏",
  "🙏","💪","🔥","💯","✅","❌","❤️","🎉","🎂","☕",
  "🍺","🍕","⚽","🏠","🚗","💸","🛒","📅","⏰","👋",
];

export default function ChatWidget({
  householdId,
  currentUserId,
  initialMessages,
  members,
}: {
  householdId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  members: Record<string, MemberInfo>;
}) {
  const t = useT();
  const locale = useLocale();
  const tag = localeTag(locale);
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [unread, setUnread] = useState(0);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const seen = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));
  const openRef = useRef(open);
  openRef.current = open;

  const seenKey = `chat-lastseen-${householdId}`;

  // Inicijalno: koliko poruka je stiglo nakon zadnjeg gledanja (ne moje).
  useEffect(() => {
    const last = localStorage.getItem(seenKey) ?? "";
    const count = initialMessages.filter(
      (m) => m.user_id !== currentUserId && m.created_at > last,
    ).length;
    setUnread(count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: nove poruke stižu uživo.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-widget-${householdId}`)
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
          if (!openRef.current && m.user_id !== currentUserId) {
            setUnread((u) => u + 1);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, currentUserId]);

  // Kad je panel otvoren: skroluj na dno i označi kao pročitano.
  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    const latest = messages[messages.length - 1]?.created_at;
    if (latest) localStorage.setItem(seenKey, latest);
    setUnread(0);
  }, [messages, open, seenKey]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
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
      alert(t("chat.failed"));
      return;
    }
    setText("");
    setShowEmoji(false);
    if (data && !seen.current.has(data.id)) {
      seen.current.add(data.id);
      setMessages((prev) => [...prev, data as ChatMessage]);
    }
  }

  function insertEmoji(emoji: string) {
    setText((prev) => prev + emoji);
    textRef.current?.focus();
  }

  // Ne prikazuj mjehurić na punoj chat stranici.
  if (pathname === "/chat") return null;

  let lastDay = "";
  const dayLabel = (iso: string) =>
    new Date(iso).toLocaleDateString(tag, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[70dvh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-[#20242c] sm:right-6">
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
              {t("chat.title")}
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-3">
            {messages.length === 0 && (
              <p className="mt-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                {t("chat.empty")}
              </p>
            )}
            {messages.map((m) => {
              const mine = m.user_id === currentUserId;
              const info = m.user_id ? members[m.user_id] : undefined;
              const name = info?.name ?? t("chat.member");
              const day = dayLabel(m.created_at);
              const showDay = day !== lastDay;
              lastDay = day;
              return (
                <div key={m.id}>
                  {showDay && (
                    <div className="my-2 flex justify-center">
                      <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs text-zinc-500 dark:bg-[#2a2f39] dark:text-zinc-400">
                        {day}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${
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

          {/* Emoji paleta */}
          {showEmoji && (
            <div className="grid max-h-32 shrink-0 grid-cols-8 gap-1 overflow-y-auto border-t border-zinc-200 p-2 dark:border-zinc-800">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => insertEmoji(em)}
                  className="rounded-md p-1 text-lg transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {/* Slanje */}
          <form
            onSubmit={send}
            className="flex shrink-0 items-end gap-1.5 border-t border-zinc-200 p-2.5 dark:border-zinc-800"
          >
            <button
              type="button"
              onClick={() => setShowEmoji((s) => !s)}
              title={t("chat.emoji")}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                showEmoji ? "text-indigo-600" : "text-zinc-400"
              }`}
            >
              <Smile className="h-5 w-5" />
            </button>
            <textarea
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={t("chat.placeholder")}
              className="max-h-24 flex-1 resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50"
              title={t("chat.send")}
            >
              <Send className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      )}

      {/* Plutajuće dugme */}
      <button
        onClick={() => setOpen((o) => !o)}
        title={t("chat.open")}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700 active:scale-95 sm:right-6"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
        {!open && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
