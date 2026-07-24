"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

// Dugme za slanje forme s vidljivim "učitavanje" stanjem (spinner + onemogućeno).
// Kada forma ima više tipki (npr. login + registracija), loader se prikazuje samo
// na onoj koja je stvarno kliknuta (poredi se poslana akcija).
export default function SubmitButton({
  children,
  className = "",
  pendingText,
  formAction,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending, action } = useFormStatus();
  const isThis = formAction ? action === formAction : true;
  const loading = pending && isThis;

  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading && pendingText ? pendingText : children}
    </button>
  );
}
