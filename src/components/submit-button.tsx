"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

// Dugme za slanje forme s vidljivim "učitavanje" stanjem (spinner + onemogućeno).
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
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
