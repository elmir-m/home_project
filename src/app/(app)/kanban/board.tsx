"use client";

import { useState, useTransition } from "react";
import { useT } from "@/components/locale-provider";
import { moveTask } from "./actions";

export type KanbanTask = {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  status: string;
  canEdit: boolean;
};

const COLUMNS: { key: "todo" | "doing" | "done"; labelKey: string }[] = [
  { key: "todo", labelKey: "kanban.col.todo" },
  { key: "doing", labelKey: "kanban.col.doing" },
  { key: "done", labelKey: "kanban.col.done" },
];

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-zinc-400",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

export default function Board({ initial }: { initial: KanbanTask[] }) {
  const t = useT();
  const [tasks, setTasks] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function drop(status: "todo" | "doing" | "done") {
    setOver(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || !task.canEdit || task.status === status) return;

    // Optimistično pomjeri odmah, pa perzistiraj u pozadini.
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t)),
    );
    startTransition(() => {
      moveTask(id, status);
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.key);
            }}
            onDragLeave={() => setOver((o) => (o === col.key ? null : o))}
            onDrop={() => drop(col.key)}
            className={`flex min-h-[200px] flex-col gap-2 rounded-xl border p-3 transition-colors ${
              over === col.key
                ? "border-zinc-500 bg-zinc-50 dark:bg-[#20242c]"
                : "border-zinc-200 dark:border-zinc-800 dark:bg-[#20242c]"
            }`}
          >
            <h2 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t(col.labelKey)}
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500 dark:bg-[#2a2f39]">
                {items.length}
              </span>
            </h2>

            {items.map((t) => (
              <div
                key={t.id}
                draggable={t.canEdit}
                onDragStart={() => t.canEdit && setDragId(t.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOver(null);
                }}
                className={`rounded-lg border border-zinc-200 bg-white shadow-sm bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-[#2a2f39] ${
                  t.canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                }`}
              >
                <p
                  className={`text-sm ${
                    t.status === "done"
                      ? "text-zinc-500 line-through"
                      : "text-black dark:text-zinc-50"
                  }`}
                >
                  {t.title}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                  <span
                    className={`h-2 w-2 rounded-full ${PRIORITY_DOT[t.priority]}`}
                  />
                  {t.due_date && <span>{t.due_date}</span>}
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <p className="mt-2 text-center text-xs text-zinc-300 dark:text-zinc-600">
                {t("kanban.dropHere")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
