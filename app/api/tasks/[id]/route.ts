import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (body.status === "done") {
    update.status = "done";
    update.completed_at = new Date().toISOString();
  } else if (body.status === "open") {
    update.status = "open";
    update.completed_at = null;
  }
  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
  if ("due_date" in body) update.due_date = body.due_date || null;
  if ([1, 2, 3].includes(body.priority)) update.priority = body.priority;
  if ("project_id" in body) update.project_id = body.project_id || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }
  const { error } = await db.from("tasks").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { error } = await db.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
