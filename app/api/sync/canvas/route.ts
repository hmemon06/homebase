import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkSyncSecret } from "@/lib/auth";
import { parseCanvasIcs } from "@/lib/ics";
import { todayStr } from "@/lib/dates";

type CanvasEvent = {
  assignment?: {
    id: number;
    name: string;
    due_at: string | null;
    html_url?: string;
  };
  context_name?: string;
};

type TaskRow = {
  title: string;
  notes: string | null;
  due_date: string | null;
  project_id: string | null;
  source: "canvas";
  external_id: string;
};

// Pulls upcoming Canvas assignments into the School project's task list.
// Two modes: CANVAS_ICS_URL (calendar feed — no API token needed) or
// CANVAS_TOKEN (REST API). Triggered daily by Supabase pg_cron; idempotent
// via the (source, external_id) unique index.
export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ??
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    null;
  if (!checkSyncSecret(key)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: school } = await db.from("projects").select("id").eq("slug", "school").single();
  const schoolId = school?.id ?? null;

  let rows: TaskRow[] = [];

  const icsUrl = process.env.CANVAS_ICS_URL;
  const base = process.env.CANVAS_BASE_URL;
  const token = process.env.CANVAS_TOKEN;

  if (icsUrl) {
    const res = await fetch(icsUrl, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return NextResponse.json({ error: `canvas feed ${res.status}` }, { status: 502 });
    const assignments = parseCanvasIcs(await res.text());
    const today = todayStr();
    rows = assignments
      .filter((a) => a.due_date >= today) // feed includes the past; only sync what's ahead
      .map((a) => ({
        title: a.title,
        notes: a.course,
        due_date: a.due_date,
        project_id: schoolId,
        source: "canvas" as const,
        external_id: a.uid,
      }));
  } else if (base && token) {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/api/v1/users/self/upcoming_events?per_page=50`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) }
    );
    if (!res.ok) return NextResponse.json({ error: `canvas ${res.status}` }, { status: 502 });
    const events = (await res.json()) as CanvasEvent[];
    rows = events
      .filter((e) => e.assignment?.id && e.assignment.name)
      .map((e) => ({
        title: e.assignment!.name,
        notes: [e.context_name, e.assignment!.html_url].filter(Boolean).join("\n") || null,
        due_date: e.assignment!.due_at ? e.assignment!.due_at.slice(0, 10) : null,
        project_id: schoolId,
        source: "canvas" as const,
        external_id: String(e.assignment!.id),
      }));
  } else {
    return NextResponse.json(
      { error: "set CANVAS_ICS_URL (calendar feed) or CANVAS_BASE_URL + CANVAS_TOKEN" },
      { status: 200 }
    );
  }

  if (rows.length > 0) {
    const { error } = await db
      .from("tasks")
      .upsert(rows, { onConflict: "source,external_id", ignoreDuplicates: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ synced: rows.length });
}
