import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkSyncSecret } from "@/lib/auth";

// Receives the nightly git-activity report from scripts/standup.mjs.
export async function POST(req: NextRequest) {
  const key = req.headers.get("authorization")?.replace("Bearer ", "") ?? null;
  if (!checkSyncSecret(key)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const day: string | undefined = body?.day;
  const entries: { repo: string; commit_count: number; summary: string }[] = body?.entries;
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day) || !Array.isArray(entries)) {
    return NextResponse.json({ error: "expected { day, entries[] }" }, { status: 400 });
  }
  if (entries.length === 0) return NextResponse.json({ saved: 0 });

  const rows = entries
    .filter((e) => e.repo && e.summary)
    .map((e) => ({
      day,
      repo: String(e.repo).slice(0, 120),
      commit_count: Number(e.commit_count) || 0,
      summary: String(e.summary).slice(0, 4000),
    }));

  const { error } = await db.from("standups").upsert(rows, { onConflict: "day,repo" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: rows.length });
}
