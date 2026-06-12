"use client";

import { useRef, useState } from "react";

export default function ContextNote({
  projectId,
  initial,
  color,
}: {
  projectId: string;
  initial: string;
  color: string;
}) {
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(value: string) {
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ context_note: value }),
      });
      setSaved(true);
    }, 700);
  }

  return (
    <div className="now">
      <div className="nowlabel" style={{ color }}>
        Now / Next
      </div>
      <textarea
        defaultValue={initial}
        placeholder="where you left off, what's next…"
        onChange={(e) => onChange(e.target.value)}
        rows={2}
      />
      <div className="nowhint">{saved ? "saved" : "saving…"}</div>
    </div>
  );
}
