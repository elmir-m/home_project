"use client";

import { useRef, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import Modal from "@/components/modal";
import SubmitButton from "@/components/submit-button";
import { createReminder, editReminder } from "./actions";

type Member = {
  user_id: string;
  profiles: { display_name: string | null; email: string | null } | null;
};
type Reminder = {
  id: string;
  title: string;
  remind_at: string;
  recurrence: string;
  target_user_id: string | null;
  notify_email: boolean;
};

const input =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50";

const pad = (n: number) => String(n).padStart(2, "0");
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function ReminderForm({
  members,
  reminder,
}: {
  members: Member[];
  reminder?: Reminder;
}) {
  const editing = !!reminder;
  const formRef = useRef<HTMLFormElement>(null);

  const defaultLocal = editing
    ? toLocalInput(new Date(reminder!.remind_at))
    : toLocalInput(new Date(Date.now() + 3600_000));
  const [iso, setIso] = useState(() => new Date(defaultLocal).toISOString());

  return (
    <Modal
      title={editing ? "Uredi podsjetnik" : "Novi podsjetnik"}
      trigger={(open) =>
        editing ? (
          <button
            onClick={open}
            title="Uredi"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-800"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={open}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Novi podsjetnik
          </button>
        )
      }
    >
      {(close) => (
        <form
          ref={formRef}
          action={editing ? editReminder : createReminder}
          onSubmit={() =>
            setTimeout(() => {
              close();
            }, 50)
          }
          className="flex flex-col gap-4"
        >
          {editing && <input type="hidden" name="id" value={reminder!.id} />}
          <input type="hidden" name="remind_at" value={iso} />

          <Field label="Na šta te podsjetiti?">
            <input
              name="title"
              required
              autoFocus
              defaultValue={reminder?.title ?? ""}
              placeholder="npr. Platiti kiriju"
              className={input}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Kada">
              <input
                type="datetime-local"
                required
                defaultValue={defaultLocal}
                onChange={(e) =>
                  setIso(e.target.value ? new Date(e.target.value).toISOString() : "")
                }
                className={input}
              />
            </Field>
            <Field label="Ponavljanje">
              <select
                name="recurrence"
                defaultValue={reminder?.recurrence ?? "none"}
                className={input}
              >
                <option value="none">Jednokratno</option>
                <option value="daily">Dnevno</option>
                <option value="weekly">Sedmično</option>
                <option value="monthly">Mjesečno</option>
                <option value="yearly">Godišnje</option>
              </select>
            </Field>
          </div>

          <Field label="Za koga">
            <select
              name="target_user_id"
              defaultValue={reminder?.target_user_id ?? ""}
              className={input}
            >
              <option value="">Cijelo domaćinstvo</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles?.display_name ?? m.profiles?.email}
                </option>
              ))}
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="notify_email"
              defaultChecked={reminder?.notify_email ?? true}
              className="h-4 w-4"
            />
            Pošalji i email obavijest
          </label>

          <SubmitButton
            className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            pendingText="Čuvam…"
          >
            {editing ? "Sačuvaj" : "Dodaj podsjetnik"}
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}
