import CaptureBar from "@/components/CaptureBar";
import InboxCard from "@/components/InboxCard";
import TaskItem, { type TaskWithProject } from "@/components/TaskItem";
import AddTask from "@/components/AddTask";
import { db, type Capture, type Project, type Standup } from "@/lib/db";
import { headlineParts, todayStr, dayHeading } from "@/lib/dates";
import { checkHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

export default async function Today() {
  const today = todayStr();
  const weekOut = todayStr(7);

  const [{ data: tasks }, { data: inbox }, { data: ships }, { data: projects }, health] =
    await Promise.all([
      db
        .from("tasks")
        .select("*, projects(name, slug, color)")
        .eq("status", "open")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("priority")
        .order("created_at"),
      db
        .from("captures")
        .select("*")
        .eq("processed", false)
        .order("created_at", { ascending: false })
        .limit(12),
      db.from("standups").select("*").order("day", { ascending: false }).limit(40),
      db.from("projects").select("*").eq("archived", false).order("sort_order"),
      checkHealth(),
    ]);

  const all = (tasks ?? []) as TaskWithProject[];
  const dueNow = all.filter((t) => t.due_date && t.due_date <= today);
  const thisWeek = all.filter((t) => t.due_date && t.due_date > today && t.due_date <= weekOut);
  const later = all.filter((t) => !t.due_date || t.due_date > weekOut);

  const latestShipDay = (ships ?? [])[0]?.day as string | undefined;
  const latestShips = ((ships ?? []) as Standup[]).filter((s) => s.day === latestShipDay);

  const { weekday, rest } = headlineParts();
  let delay = 0;
  const d = () => ({ "--d": `${(delay += 0.07)}s` } as React.CSSProperties);

  return (
    <>
      <header className="rise" style={d()}>
        <div className="eyebrow">Home base</div>
        <h1 className="masthead">
          {weekday}
          <span className="it">, {rest}</span>
        </h1>
        <p className="subhead">
          {dueNow.length === 0
            ? "Nothing due. Pick a front and push it forward."
            : `${dueNow.length} due now · ${thisWeek.length} this week`}
          {health.map((h) => (
            <span key={h.name} className={`status ${h.up ? "up" : "down"}`}>
              <span className="statusdot" />
              {h.name} {h.up ? `${h.ms}ms` : "down"}
            </span>
          ))}
        </p>
      </header>

      <CaptureBar />

      {(inbox ?? []).length > 0 && (
        <section className="section rise" style={d()}>
          <div className="seclabel">
            <h2>Inbox</h2>
            <span className="seccount">{(inbox ?? []).length}</span>
          </div>
          {(inbox as Capture[]).map((c) => (
            <InboxCard key={c.id} capture={c} projects={(projects ?? []) as Project[]} />
          ))}
        </section>
      )}

      <section className="section rise" style={d()}>
        <div className="seclabel">
          <h2>Due now</h2>
          <span className="seccount">{dueNow.length}</span>
        </div>
        {dueNow.length === 0 && <div className="empty">Clear. Nothing overdue, nothing due today.</div>}
        {dueNow.map((t) => (
          <TaskItem key={t.id} task={t} />
        ))}
      </section>

      <section className="section rise" style={d()}>
        <div className="seclabel">
          <h2>This week</h2>
          <span className="seccount">{thisWeek.length}</span>
        </div>
        {thisWeek.length === 0 && <div className="empty">An open week.</div>}
        {thisWeek.map((t) => (
          <TaskItem key={t.id} task={t} />
        ))}
        {later.length > 0 && (
          <details className="later">
            <summary>later & undated ({later.length})</summary>
            {later.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </details>
        )}
        <AddTask projectId={null} />
      </section>

      {latestShips.length > 0 && (
        <section className="section rise" style={d()}>
          <div className="seclabel">
            <h2>Shipped {dayHeading(latestShipDay!).toLowerCase()}</h2>
            <span className="seccount">
              {latestShips.reduce((n, s) => n + s.commit_count, 0)} commits
            </span>
          </div>
          {latestShips.map((s) => (
            <div className="ship" key={s.id}>
              <span className="shiprepo">{s.repo}</span>
              <span className="shipmsg">{s.summary}</span>
              <span className="shipcount">×{s.commit_count}</span>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
