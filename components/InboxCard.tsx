"use client";

import { useRouter } from "next/navigation";
import type { Capture, Project } from "@/lib/db";

export default function InboxCard({
  capture,
  projects,
}: {
  capture: Capture;
  projects: Project[];
}) {
  const router = useRouter();

  async function file(action: "task" | "dismiss", projectId?: string | null) {
    await fetch(`/api/capture/${capture.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, project_id: projectId ?? null }),
    });
    router.refresh();
  }

  async function remove() {
    await fetch(`/api/capture/${capture.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="inboxcard">
      <div className="inboxtext">
        {capture.kind === "voice" && <span className="vox">VOICE</span>}
        {capture.content}
      </div>
      <div className="filerow">
        {projects.map((p) => (
          <button
            key={p.id}
            className="filechip"
            onClick={() => file("task", p.id)}
            title={`task → ${p.name}`}
          >
            <span className="pdot" style={{ background: p.color }} />
            {p.name}
          </button>
        ))}
        <button className="filechip" onClick={() => file("task", null)}>
          shared task
        </button>
        <button className="filechip ghost" onClick={() => file("dismiss")}>
          keep as note
        </button>
        <button className="filechip ghost" onClick={remove}>
          discard
        </button>
      </div>
    </div>
  );
}
