import Sidebar from "@/components/Sidebar";
import { db, type Project, type Task } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ data: projects }, { data: openTasks }] = await Promise.all([
    db.from("projects").select("*").eq("archived", false).order("sort_order"),
    db.from("tasks").select("project_id").eq("status", "open"),
  ]);

  const counts: Record<string, number> = {};
  for (const t of (openTasks ?? []) as Pick<Task, "project_id">[]) {
    if (t.project_id) counts[t.project_id] = (counts[t.project_id] ?? 0) + 1;
  }

  return (
    <div className="shell">
      <Sidebar projects={(projects ?? []) as Project[]} counts={counts} />
      <main className="main">{children}</main>
    </div>
  );
}
