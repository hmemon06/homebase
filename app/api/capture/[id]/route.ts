import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// Resolve an inbox capture: turn it into a task, file it as a note, or dismiss.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const { data: capture } = await db.from("captures").select("*").eq("id", id).single();
  if (!capture) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (body.action === "task") {
    const { error } = await db.from("tasks").insert({
      title: capture.content.slice(0, 300),
      project_id: body.project_id ?? null,
      source: capture.kind === "voice" ? "voice" : "manual",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { error } = await db
    .from("captures")
    .update({ processed: true, project_id: body.project_id ?? capture.project_id })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { error } = await db.from("captures").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
