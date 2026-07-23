"use client";

import { useState } from "react";

// datetime-local nema vremensku zonu. U browseru ga pretvaramo u ISO (s tačnim
// trenutkom), pa slanje radi ispravno bez obzira na zonu servera (Vercel = UTC).
export default function RemindAtField({ defaultValue }: { defaultValue: string }) {
  const toIso = (v: string) => (v ? new Date(v).toISOString() : "");
  const [iso, setIso] = useState(() => toIso(defaultValue));

  return (
    <>
      <input
        type="datetime-local"
        required
        defaultValue={defaultValue}
        onChange={(e) => setIso(toIso(e.target.value))}
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
      <input type="hidden" name="remind_at" value={iso} />
    </>
  );
}
