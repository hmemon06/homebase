"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } }; length: number } }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
};

export default function CaptureBar() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [hasSpeech, setHasSpeech] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const wasVoice = useRef(false);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    setHasSpeech(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  function startVoice() {
    const w = window as unknown as Record<string, { new (): SpeechRecognitionLike }>;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setValue(text);
      wasVoice.current = true;
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    recRef.current = rec;
    rec.start();
    setRecording(true);
  }

  function stopVoice() {
    recRef.current?.stop();
    setRecording(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = value.trim();
    if (!content) return;
    if (recording) stopVoice();
    setStatus("filing…");
    setValue("");
    const kind = wasVoice.current ? "voice" : "text";
    wasVoice.current = false;
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(
        data.tasks
          ? `→ ${data.filed} · ${data.tasks} task${data.tasks > 1 ? "s" : ""}`
          : `→ ${data.filed}`
      );
      router.refresh();
    } catch {
      setStatus("failed — try again");
      setValue(content);
    }
    setTimeout(() => setStatus(null), 4000);
  }

  return (
    <form className="capture rise" style={{ "--d": "0.05s" } as React.CSSProperties} onSubmit={submit}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={recording ? "listening…" : "capture anything — a task, a thought, a lead…"}
        aria-label="capture"
      />
      {status && <span className="capstatus">{status}</span>}
      {hasSpeech && (
        <button
          type="button"
          className={`micbtn ${recording ? "rec" : ""}`}
          onClick={recording ? stopVoice : startVoice}
          aria-label={recording ? "stop recording" : "start voice capture"}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
          </svg>
        </button>
      )}
    </form>
  );
}
