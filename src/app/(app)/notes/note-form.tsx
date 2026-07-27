"use client";

import { useRef } from "react";
import { Plus, Pencil } from "lucide-react";
import Modal from "@/components/modal";
import SubmitButton from "@/components/submit-button";
import { useT } from "@/components/locale-provider";
import { createNote, editNote } from "./actions";

type Opt = { id: string; title: string };
type Note = {
  id: string;
  kind: string;
  title: string | null;
  body: string | null;
  tags: string[];
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

export default function NoteForm({
  tasks = [],
  events = [],
  note,
}: {
  tasks?: Opt[];
  events?: Opt[];
  note?: Note;
}) {
  const editing = !!note;
  const formRef = useRef<HTMLFormElement>(null);
  const tr = useT();

  return (
    <Modal
      title={editing ? tr("notes.editNote") : tr("notes.newNote")}
      trigger={(open) =>
        editing ? (
          <button
            onClick={open}
            title={tr("common.edit")}
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
            {tr("notes.newNote")}
          </button>
        )
      }
    >
      {(close) => (
        <form
          ref={formRef}
          action={editing ? editNote : createNote}
          onSubmit={() =>
            setTimeout(() => {
              if (!editing) formRef.current?.reset();
              close();
            }, 50)
          }
          className="flex flex-col gap-4"
        >
          {editing && <input type="hidden" name="id" value={note!.id} />}

          <Field label={tr("field.title")}>
            <input
              name="title"
              autoFocus
              defaultValue={note?.title ?? ""}
              placeholder={tr("notes.titlePlaceholder")}
              className={input}
            />
          </Field>

          <Field label={tr("notes.body")}>
            <textarea
              name="body"
              rows={4}
              defaultValue={note?.body ?? ""}
              placeholder={tr("notes.bodyPlaceholder")}
              className={input}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={tr("notes.tags")}>
              <input
                name="tags"
                defaultValue={note?.tags?.join(", ") ?? ""}
                placeholder={tr("notes.tagsPlaceholder")}
                className={input}
              />
            </Field>
            <Field label={tr("notes.kind")}>
              <select
                name="kind"
                defaultValue={note?.kind ?? "note"}
                className={input}
              >
                <option value="note">{tr("notes.kindNote")}</option>
                <option value="journal">{tr("notes.kindJournal")}</option>
              </select>
            </Field>
          </div>

          {!editing && (tasks.length > 0 || events.length > 0) && (
            <Field label={tr("notes.linkTo")}>
              <select name="link" defaultValue="" className={input}>
                <option value="">{tr("notes.linkNone")}</option>
                {tasks.length > 0 && (
                  <optgroup label={tr("notes.tasksGroup")}>
                    {tasks.map((t) => (
                      <option key={t.id} value={`task:${t.id}`}>
                        {t.title}
                      </option>
                    ))}
                  </optgroup>
                )}
                {events.length > 0 && (
                  <optgroup label={tr("notes.eventsGroup")}>
                    {events.map((e) => (
                      <option key={e.id} value={`event:${e.id}`}>
                        {e.title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </Field>
          )}

          <SubmitButton
            className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            pendingText={tr("common.saving")}
          >
            {editing ? tr("common.saveChanges") : tr("notes.saveNote")}
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}
