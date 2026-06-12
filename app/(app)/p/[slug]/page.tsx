import { notFound } from "next/navigation";
import TaskItem, { type TaskWithProject } from "@/components/TaskItem";
import AddTask from "@/components/AddTask";
import ContextNote from "@/components/ContextNote";
import { db, type Project } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: project } = await db.from("projects").select("*").eq("slug", slug).single();
  if (!project) notFound();
  const p = project as Project;

  const [{ data: open }, { data: done }] = await Promise.all([
    db
      .from("tasks")
      .select("*, projects(name, slug, color)")
      .eq("project_id", p.id)
      .eq("status", "open")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("priority")
      .order("created_at"),
    db
      .from("tasks")
      .select("*, projects(name, slug, color)")
      .eq("project_id", p.id)
      .eq("status", "done")
      .order("completed_at", { ascending: false })
      .limit(10),
  ]);

  let delay = 0;
  const d = () => ({ "--d": `${(delay += 0.07)}s` } as React.CSSProperties);

  return (
    <>
      <header className="rise" style={d()}>
        <div className="eyebrow" style={{ color: p.color }}>
          Project
        </div>
        <h1 className="masthead">{p.name}</h1>
      </header>

      <div className="rise" style={d()}>
        <ContextNote projectId={p.id} initial={p.context_note ?? ""} color={p.color} />
      </div>

      <section className="section rise" style={d()}>
        <div className="seclabel">
          <h2>Open</h2>
          <span className="seccount">{(open ?? []).length}</span>
        </div>
        {(open ?? []).length === 0 && <div className="empty">Nothing open. Capture the next move.</div>}
        {((open ?? []) as TaskWithProject[]).map((t) => (
          <TaskItem key={t.id} task={t} showProject={false} />
        ))}
        <AddTask projectId={p.id} />
      </section>

      {(done ?? []).length > 0 && (
        <section className="section rise" style={d()}>
          <details className="later">
            <summary>recently done ({(done ?? []).length})</summary>
            {((done ?? []) as TaskWithProject[]).map((t) => (
              <TaskItem key={t.id} task={t} showProject={false} />
            ))}
          </details>
        </section>
      )}
    </>
  );
}
