"use client";

import { useState } from "react";

function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noreferrer" className="notelink">
            {p.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
          </a>
        ) : (
          p
        )
      )}
    </>
  );
}

export default function ContextNote({
  projectId,
  initial,
  color,
}: {
  projectId: string;
  initial: string;
  color: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initial);

  async function save(value: string) {
    setEditing(false);
    const trimmed = value.trimEnd();
    setText(trimmed);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ context_note: trimmed }),
    });
  }

  return (
    <div className="now">
      <div className="nowlabel" style={{ color }}>
        Now / Next
      </div>
      {editing ? (
        <textarea
          autoFocus
          defaultValue={text}
          onBlur={(e) => save(e.target.value)}
          rows={Math.max(2, text.split("\n").length)}
          placeholder="where you left off, what's next…"
        />
      ) : (
        <div
          className="nownote"
          onClick={(e) => {
            if ((e.target as HTMLElement).tagName !== "A") setEditing(true);
          }}
        >
          {text ? (
            <Linkified text={text} />
          ) : (
            <span className="notehint">where you left off, what's next… (click to write)</span>
          )}
        </div>
      )}
      <div className="nowhint">{editing ? "click away to save" : "click to edit"}</div>
    </div>
  );
}
