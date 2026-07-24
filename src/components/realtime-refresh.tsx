"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Sluša izmjene u bazi (Supabase Realtime) i osvježava trenutnu stranicu,
// pa promjena jednog člana odmah iskoči kod svih — bez ručnog refresha.
export default function RealtimeRefresh() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400);
    };

    const channel = supabase
      .channel("home-os-changes")
      .on("postgres_changes", { event: "*", schema: "public" }, refresh)
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
