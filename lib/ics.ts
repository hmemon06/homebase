// Minimal ICS parser for Canvas calendar feeds. Canvas assignment events
// carry a UID like "event-assignment-123456" and the due date in DTSTART.

export type IcsAssignment = {
  uid: string;
  title: string;
  course: string | null;
  due_date: string; // YYYY-MM-DD
};

function unescapeIcs(s: string): string {
  return s
    .replace(/\\n/g, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

export function parseCanvasIcs(ics: string): IcsAssignment[] {
  // unfold continuation lines (RFC 5545: lines starting with space/tab)
  const unfolded = ics.replace(/\r?\n[ \t]/g, "");
  const events = unfolded.split("BEGIN:VEVENT").slice(1);

  const out: IcsAssignment[] = [];
  for (const ev of events) {
    const uid = ev.match(/^UID:(.+)$/m)?.[1]?.trim();
    if (!uid || !uid.includes("assignment")) continue;

    const rawSummary = ev.match(/^SUMMARY:(.+)$/m)?.[1];
    if (!rawSummary) continue;
    const summary = unescapeIcs(rawSummary);

    // DTSTART;VALUE=DATE:20260615  or  DTSTART:20260615T235900Z
    const dt = ev.match(/^DTSTART[^:]*:(\d{8})/m)?.[1];
    if (!dt) continue;
    const due_date = `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`;

    // Canvas formats summaries as "Assignment Name [Course Name]"
    const m = summary.match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
    out.push({
      uid,
      title: (m ? m[1] : summary).slice(0, 300),
      course: m ? m[2] : null,
      due_date,
    });
  }
  return out;
}
