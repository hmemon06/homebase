"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddTask({ projectId }: { projectId: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    setValue("");
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, project_id: projectId }),
    });
    router.refresh();
  }

  return (
    <form className="addtask" onSubmit={submit}>
      <span className="ring" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="add a task…"
        aria-label="add a task"
      />
    </form>
  );
}
