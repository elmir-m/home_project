"use client";

import { useRef } from "react";
import { Plus, Pencil } from "lucide-react";
import Modal from "@/components/modal";
import SubmitButton from "@/components/submit-button";
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

  return (
    <Modal
      title={editing ? "Uredi bilješku" : "Nova bilješka"}
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
            Nova bilješka
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

          <Field label="Naslov">
            <input
              name="title"
              autoFocus
              defaultValue={note?.title ?? ""}
              placeholder="Naslov (opciono)"
              className={input}
            />
          </Field>

          <Field label="Sadržaj">
            <textarea
              name="body"
              rows={4}
              defaultValue={note?.body ?? ""}
              placeholder="Tekst bilješke…"
              className={input}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tagovi (zarezom)">
              <input
                name="tags"
                defaultValue={note?.tags?.join(", ") ?? ""}
                placeholder="kuća, hitno"
                className={input}
              />
            </Field>
            <Field label="Tip">
              <select
                name="kind"
                defaultValue={note?.kind ?? "note"}
                className={input}
              >
                <option value="note">Bilješka</option>
                <option value="journal">Dnevnik</option>
              </select>
            </Field>
          </div>

          {!editing && (tasks.length > 0 || events.length > 0) && (
            <Field label="Poveži sa (opciono)">
              <select name="link" defaultValue="" className={input}>
                <option value="">— ništa —</option>
                {tasks.length > 0 && (
                  <optgroup label="Zadaci">
                    {tasks.map((t) => (
                      <option key={t.id} value={`task:${t.id}`}>
                        {t.title}
                      </option>
                    ))}
                  </optgroup>
                )}
                {events.length > 0 && (
                  <optgroup label="Događaji">
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
            pendingText={editing ? "Čuvam…" : "Čuvam…"}
          >
            {editing ? "Sačuvaj izmjene" : "Sačuvaj bilješku"}
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}
