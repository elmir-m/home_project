"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AvatarUpload({
  userId,
  avatarUrl,
  initial,
}: {
  userId: string;
  avatarUrl: string | null;
  initial: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Odaberi sliku.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErr("Slika mora biti manja od 3 MB.");
      return;
    }
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (upErr) {
      setLoading(false);
      setErr("Upload nije uspio. Provjeri da je pokrenuta migracija 0015.");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);

    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => (avatarUrl ? setPreview(true) : fileRef.current?.click())}
        title={avatarUrl ? "Pregledaj sliku" : "Dodaj sliku"}
        className="group relative h-16 w-16 overflow-hidden rounded-full"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="avatar" className="h-16 w-16 object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-semibold text-white">
            {initial}
          </span>
        )}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </span>
        )}
      </button>

      <div>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-[#2a2f39]"
        >
          <Camera className="h-4 w-4" />
          {loading ? "Učitavam…" : "Promijeni sliku"}
        </button>
        {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />

      {/* Uvećani pregled */}
      {preview && avatarUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreview(false)}
        >
          <button
            onClick={() => setPreview(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt="avatar"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
