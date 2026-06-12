import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  const { error } = await db.from("tasks").insert({
    title: body.title.trim().slice(0, 300),
    project_id: body.project_id ?? null,
    due_date: body.due_date ?? null,
    priority: [1, 2, 3].includes(body.priority) ? body.priority : 2,
    notes: body.notes ?? null,
    source: "manual",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
