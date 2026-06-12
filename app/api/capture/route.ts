import { NextRequest, NextResponse } from "next/server";
import { db, type Project } from "@/lib/db";
import { routeCapture } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
  const kind = body.kind === "voice" ? "voice" : "text";

  const { data: projects } = await db
    .from("projects")
    .select("*")
    .eq("archived", false)
    .order("sort_order");

  const routed = await routeCapture(content, (projects ?? []) as Project[]);

  if (!routed) {
    // No AI configured (or it failed): park it in the inbox for manual filing.
    const { error } = await db.from("captures").insert({ content, kind });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ filed: "inbox" });
  }

  const project = (projects ?? []).find((p) => p.slug === routed.project_slug) ?? null;

  if (routed.tasks.length > 0) {
    const { error } = await db.from("tasks").insert(
      routed.tasks.map((t) => ({
        title: t.title,
        due_date: t.due_date,
        priority: t.priority,
        project_id: project?.id ?? null,
        source: kind,
      }))
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await db.from("captures").insert({
      content,
      kind,
      project_id: project?.id ?? null,
      processed: true,
    });
    return NextResponse.json({
      filed: project?.name ?? "Shared",
      tasks: routed.tasks.length,
    });
  }

  // A note, not a task: keep it in the inbox (assigned if Claude was sure).
  const { error } = await db.from("captures").insert({
    content,
    kind,
    project_id: project?.id ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ filed: project ? `${project.name} (note)` : "inbox" });
}
