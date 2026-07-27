"use client";

import { useRef } from "react";
import { Plus, Pencil } from "lucide-react";
import Modal from "@/components/modal";
import SubmitButton from "@/components/submit-button";
import { useT } from "@/components/locale-provider";
import { createTask, editTask } from "./actions";

type Member = {
  user_id: string;
  profiles: { display_name: string | null; email: string | null } | null;
};
type Task = {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  assignee_id: string | null;
};

const input =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-[#2a2f39] dark:text-zinc-50";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function TaskForm({
  members,
  task,
}: {
  members: Member[];
  task?: Task;
}) {
  const editing = !!task;
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Modal
      title={editing ? t("tasks.edit") : t("tasks.new")}
      trigger={(open) =>
        editing ? (
          <button
            onClick={open}
            title={t("common.edit")}
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
            {t("tasks.new")}
          </button>
        )
      }
    >
      {(close) => (
        <form
          ref={formRef}
          action={editing ? editTask : createTask}
          onSubmit={() =>
            setTimeout(() => {
              if (!editing) formRef.current?.reset();
              close();
            }, 50)
          }
          className="flex flex-col gap-4"
        >
          {editing && <input type="hidden" name="id" value={task!.id} />}

          <Field label={t("field.title")}>
            <input
              name="title"
              required
              autoFocus
              defaultValue={task?.title ?? ""}
              placeholder={t("tasks.titlePlaceholder")}
              className={input}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.priority")}>
              <select
                name="priority"
                defaultValue={task?.priority ?? "medium"}
                className={input}
              >
                <option value="low">{t("tasks.prio.low")}</option>
                <option value="medium">{t("tasks.prio.medium")}</option>
                <option value="high">{t("tasks.prio.high")}</option>
              </select>
            </Field>
            <Field label={t("field.dueDate")}>
              <input
                type="date"
                name="due_date"
                defaultValue={task?.due_date ?? ""}
                className={input}
              />
            </Field>
          </div>

          <Field label={t("field.assignee")}>
            <select
              name="assignee_id"
              defaultValue={task?.assignee_id ?? ""}
              className={input}
            >
              <option value="">{t("tasks.noAssigneeOption")}</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles?.display_name ?? m.profiles?.email}
                </option>
              ))}
            </select>
          </Field>

          <SubmitButton
            className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            pendingText={editing ? t("common.saving") : t("common.adding")}
          >
            {editing ? t("common.saveChanges") : t("tasks.add")}
          </SubmitButton>
        </form>
      )}
    </Modal>
  );
}
