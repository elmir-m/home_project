"use client";

import { useRef } from "react";
import { Plus, Pencil } from "lucide-react";
import Modal from "@/components/modal";
import SubmitButton from "@/components/submit-button";
import { createRecord, editRecord, createContact, editContact } from "./actions";

type Rec = {
  id: string;
  title: string;
  category: string;
  expiry_date: string | null;
  notes: string | null;
};
type Contact = {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
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

function AddBtn({ open, label }: { open: () => void; label: string }) {
  return (
    <button
      onClick={open}
      className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-[0.98]"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

function EditBtn({ open }: { open: () => void }) {
  return (
    <button
      onClick={open}
      title="Uredi"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-800"
    >
      <Pencil className="h-4 w-4" />
    </button>
  );
}

export function RecordForm({ record }: { record?: Rec }) {
  const editing = !!record;
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Modal
      title={editing ? "Uredi zapis" : "Novi zapis"}
      trigger={(open) =>
        editing ? <EditBtn open={open} /> : <AddBtn open={open} label="Novi zapis" />
      }
    >
      {(close) => (
        <form
          ref={formRef}
          action={editing ? editRecord : createRecord}
          onSubmit={() =>
            setTimeout(() => {
              if (!editing) formRef.current?.reset();
              close();
            }, 50)
          }
          className="flex flex-col gap-4"
        >
          {editing && <input type="hidden" name="id" value={record!.id} />}
          <Field label="Naziv">
            <input
              name="title"
              required
              autoFocus
              defaultValue={record?.title ?? ""}
              placeholder="npr. Registracija auta"
              className={input}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vrsta">
              <select
                name="category"
                defaultValue={record?.category ?? "document"}
                className={input}
              >
                <option value="document">Dokument</option>
                <option value="warranty">Garancija</option>
                <option value="renewal">Obnova</option>
                <option value="other">Ostalo</option>
              </select>
            </Field>
            <Field label="Rok isteka (opciono)">
              <input
                type="date"
                name="expiry_date"
                defaultValue={record?.expiry_date ?? ""}
                className={input}
              />
            </Field>
          </div>
          <Field label="Bilješka">
            <textarea
              name="notes"
              rows={2}
              defaultValue={record?.notes ?? ""}
              placeholder="Dodatne informacije…"
              className={input}
            />
          </Field>
          {!editing && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Ako uneseš rok isteka, automatski se pravi podsjetnik 7 dana ranije.
            </p>
          )}
          <SubmitButton
            className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            pendingText="Čuvam…"
          >
            {editing ? "Sačuvaj" : "Dodaj zapis"}
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}

export function ContactForm({ contact }: { contact?: Contact }) {
  const editing = !!contact;
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Modal
      title={editing ? "Uredi kontakt" : "Novi kontakt"}
      trigger={(open) =>
        editing ? <EditBtn open={open} /> : <AddBtn open={open} label="Novi kontakt" />
      }
    >
      {(close) => (
        <form
          ref={formRef}
          action={editing ? editContact : createContact}
          onSubmit={() =>
            setTimeout(() => {
              if (!editing) formRef.current?.reset();
              close();
            }, 50)
          }
          className="flex flex-col gap-4"
        >
          {editing && <input type="hidden" name="id" value={contact!.id} />}
          <Field label="Ime">
            <input
              name="name"
              required
              autoFocus
              defaultValue={contact?.name ?? ""}
              placeholder="npr. Vodoinstalater Meho"
              className={input}
            />
          </Field>
          <Field label="Uloga">
            <input
              name="role"
              defaultValue={contact?.role ?? ""}
              placeholder="npr. vodoinstalater"
              className={input}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon">
              <input
                name="phone"
                defaultValue={contact?.phone ?? ""}
                placeholder="061 …"
                className={input}
              />
            </Field>
            <Field label="Email">
              <input
                name="email"
                defaultValue={contact?.email ?? ""}
                placeholder="email@…"
                className={input}
              />
            </Field>
          </div>
          <SubmitButton
            className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            pendingText="Čuvam…"
          >
            {editing ? "Sačuvaj" : "Dodaj kontakt"}
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}
