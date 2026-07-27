"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/modal";
import SubmitButton from "@/components/submit-button";
import { useT } from "@/components/locale-provider";
import { createEvent, editEvent, deleteEvent } from "./actions";

type Ev = {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
};

const input =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50";

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

export default function EventForm({
  event,
  defaultDate,
}: {
  event?: Ev;
  defaultDate?: string;
}) {
  const editing = !!event;
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Modal
      title={editing ? t("cal.editEvent") : t("cal.newEvent")}
      trigger={(open) =>
        editing ? (
          <button
            onClick={open}
            title={t("cal.editEvent")}
            className="w-full truncate rounded bg-blue-100 px-1 py-0.5 text-left text-xs text-blue-800 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300"
          >
            {event!.start_time ? event!.start_time.slice(0, 5) + " " : ""}
            {event!.title}
          </button>
        ) : (
          <button
            onClick={open}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            {t("cal.newEvent")}
          </button>
        )
      }
    >
      {(close) => (
        <form
          ref={formRef}
          action={editing ? editEvent : createEvent}
          onSubmit={() =>
            setTimeout(() => {
              if (!editing) formRef.current?.reset();
              close();
            }, 50)
          }
          className="flex flex-col gap-4"
        >
          {editing && <input type="hidden" name="id" value={event!.id} />}

          <Field label={t("field.title")}>
            <input
              name="title"
              required
              autoFocus
              defaultValue={event?.title ?? ""}
              placeholder={t("cal.titlePlaceholder")}
              className={input}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.date")}>
              <input
                type="date"
                name="event_date"
                required
                defaultValue={event?.event_date ?? defaultDate ?? ""}
                className={input}
              />
            </Field>
            <Field label={t("field.time")}>
              <input
                type="time"
                name="start_time"
                defaultValue={event?.start_time?.slice(0, 5) ?? ""}
                className={input}
              />
            </Field>
          </div>

          <div className="mt-1 flex gap-2">
            <SubmitButton
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              pendingText={editing ? t("common.saving") : t("common.adding")}
            >
              {editing ? t("common.save") : t("cal.addEvent")}
            </SubmitButton>
            {editing && (
              <SubmitButton
                formAction={deleteEvent}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                pendingText={t("common.deleting")}
              >
                {t("common.delete")}
              </SubmitButton>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
