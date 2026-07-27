"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  markAllNotificationsRead,
  acceptInviteNotif,
  declineInviteNotif,
  dismissNotification,
} from "@/app/(app)/notifications/actions";

export type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
};

function ago(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "upravo sad";
  if (diff < 3600) return `prije ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `prije ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString("bs-BA", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificationsBell({
  userId,
  initial,
}: {
  userId: string;
  initial: Notif[];
}) {
  const [items, setItems] = useState<Notif[]>(initial);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const boxRef = useRef<HTMLDivElement | null>(null);

  const unread = items.filter((n) => !n.read).length;

  // Realtime: nove/izmijenjene/obrisane notifikacije za mene.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const n = payload.new as Notif;
            setItems((prev) =>
              prev.some((p) => p.id === n.id) ? prev : [n, ...prev],
            );
          } else if (payload.eventType === "UPDATE") {
            const n = payload.new as Notif;
            setItems((prev) => prev.map((p) => (p.id === n.id ? n : p)));
          } else if (payload.eventType === "DELETE") {
            const id = (payload.old as { id: string }).id;
            setItems((prev) => prev.filter((p) => p.id !== id));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Zatvori dropdown na klik van njega.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    // Kad otvorim — označi sve kao pročitane (optimistično + na serveru).
    if (next && unread > 0) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      startTransition(() => {
        markAllNotificationsRead();
      });
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={toggle}
        title="Notifikacije"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <Bell className="h-4.5 w-4.5" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-20 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-[#20242c]">
          <div className="border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
            <p className="text-sm font-semibold text-black dark:text-zinc-50">
              Notifikacije
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                Nemaš notifikacija.
              </p>
            )}

            {items.map((n) => {
              const token =
                typeof n.data?.token === "string" ? n.data.token : "";
              return (
                <div
                  key={n.id}
                  className={`flex gap-2 border-b border-zinc-50 px-4 py-3 last:border-0 dark:border-zinc-800/60 ${
                    !n.read ? "bg-indigo-50/50 dark:bg-indigo-950/20" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-black dark:text-zinc-50">
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                      {ago(n.created_at)}
                    </p>

                    {n.type === "invite" && token && (
                      <div className="mt-2 flex gap-2">
                        <form action={acceptInviteNotif}>
                          <input type="hidden" name="token" value={token} />
                          <input type="hidden" name="notif_id" value={n.id} />
                          <button className="flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700">
                            <Check className="h-3.5 w-3.5" /> Prihvati
                          </button>
                        </form>
                        <form action={declineInviteNotif}>
                          <input type="hidden" name="token" value={token} />
                          <input type="hidden" name="notif_id" value={n.id} />
                          <button className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                            Odbij
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Obriši (za sve osim aktivne pozivnice) */}
                  {!(n.type === "invite" && token) && (
                    <form action={dismissNotification}>
                      <input type="hidden" name="id" value={n.id} />
                      <button
                        title="Ukloni"
                        className="mt-0.5 shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
