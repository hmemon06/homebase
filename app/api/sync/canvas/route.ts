import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkSyncSecret } from "@/lib/auth";

type CanvasEvent = {
  assignment?: {
    id: number;
    name: string;
    due_at: string | null;
    html_url?: string;
  };
  context_name?: string;
};

// Pulls upcoming Canvas assignments into the School project's task list.
// Triggered daily by Supabase pg_cron; idempotent via (source, external_id).
export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ??
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    null;
  if (!checkSyncSecret(key)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const base = process.env.CANVAS_BASE_URL;
  const token = process.env.CANVAS_TOKEN;
  if (!base || !token) {
    return NextResponse.json({ error: "CANVAS_BASE_URL / CANVAS_TOKEN not configured" }, { status: 200 });
  }

  const res = await fetch(`${base.replace(/\/$/, "")}/api/v1/users/self/upcoming_events?per_page=50`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    return NextResponse.json({ error: `canvas ${res.status}` }, { status: 502 });
  }
  const events = (await res.json()) as CanvasEvent[];

  const { data: school } = await db.from("projects").select("id").eq("slug", "school").single();

  const rows = events
    .filter((e) => e.assignment?.id && e.assignment.name)
    .map((e) => ({
      title: e.assignment!.name,
      notes: [e.context_name, e.assignment!.html_url].filter(Boolean).join("\n") || null,
      due_date: e.assignment!.due_at ? e.assignment!.due_at.slice(0, 10) : null,
      project_id: school?.id ?? null,
      source: "canvas" as const,
      external_id: String(e.assignment!.id),
    }));

  if (rows.length > 0) {
    const { error } = await db
      .from("tasks")
      .upsert(rows, { onConflict: "source,external_id", ignoreDuplicates: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ synced: rows.length });
}
