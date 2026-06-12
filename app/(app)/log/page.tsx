import { db, type Standup } from "@/lib/db";
import { dayHeading } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function ShipLog() {
  const { data } = await db
    .from("standups")
    .select("*")
    .order("day", { ascending: false })
    .order("repo")
    .limit(400);

  const ships = (data ?? []) as Standup[];
  const days = new Map<string, Standup[]>();
  for (const s of ships) {
    if (!days.has(s.day)) days.set(s.day, []);
    days.get(s.day)!.push(s);
  }

  return (
    <>
      <header className="rise">
        <div className="eyebrow">Ship log</div>
        <h1 className="masthead">
          What <span className="it">actually</span> got done
        </h1>
        <p className="subhead">Auto-collected from your repos every night. No self-reporting.</p>
      </header>

      {days.size === 0 && (
        <div className="empty">
          Nothing yet — the standup script reports here after its first nightly run.
        </div>
      )}

      {[...days.entries()].map(([day, items], i) => (
        <section key={day} className="rise" style={{ "--d": `${0.1 + i * 0.05}s` } as React.CSSProperties}>
          <div className="logday">{dayHeading(day)}</div>
          {items.map((s) => (
            <div className="ship" key={s.id}>
              <span className="shiprepo">{s.repo}</span>
              <span className="shipmsg">{s.summary}</span>
              <span className="shipcount">×{s.commit_count}</span>
            </div>
          ))}
        </section>
      ))}
    </>
  );
}
