"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/lib/db";
import { dueLabel } from "@/lib/dates";

export type TaskWithProject = Task & {
  projects: { name: string; slug: string; color: string } | null;
};

export default function TaskItem({
  task,
  showProject = true,
}: {
  task: TaskWithProject;
  showProject?: boolean;
}) {
  const router = useRouter();
  const [fading, setFading] = useState(false);
  const color = task.projects?.color ?? "var(--accent)";

  async function toggle() {
    setFading(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: task.status === "open" ? "done" : "open" }),
    });
    // let the strike-through play before the row leaves
    setTimeout(() => router.refresh(), 450);
  }

  async function remove() {
    setFading(true);
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    router.refresh();
  }

  const due = task.due_date ? dueLabel(task.due_date) : null;

  return (
    <div className={`task ${fading ? "fading" : ""}`}>
      <button
        className={`taskcheck ${task.status === "done" ? "on" : ""}`}
        style={{ "--c": color } as React.CSSProperties}
        onClick={toggle}
        aria-label="toggle task"
      >
        <svg viewBox="0 0 12 12" fill="none">
          <path d="M2 6.5L4.8 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <div className="taskbody">
        <div className="tasktitle">{task.title}</div>
        <div className="taskmeta">
          {showProject && task.projects && (
            <span className="ptag">
              <span className="pdot" style={{ background: task.projects.color, color: task.projects.color }} />
              {task.projects.name}
            </span>
          )}
          {showProject && !task.projects && <span className="ptag">shared</span>}
          {due && (
            <span className={`chip ${due.overdue ? "overdue" : ""} ${due.today ? "today" : ""}`}>
              {due.label}
            </span>
          )}
          {task.priority === 1 && <span className="prio">!!</span>}
          {task.source === "canvas" && <span className="ptag">canvas</span>}
        </div>
      </div>
      <button className="taskdel" onClick={remove} aria-label="delete task">
        ×
      </button>
    </div>
  );
}
