"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Project } from "@/lib/db";

export default function Sidebar({
  projects,
  counts,
}: {
  projects: Project[];
  counts: Record<string, number>;
}) {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        home<em>base</em>
      </Link>
      <Link href="/" className={`navlink ${pathname === "/" ? "active" : ""}`}>
        Today
      </Link>
      <Link href="/log" className={`navlink ${pathname === "/log" ? "active" : ""}`}>
        Ship log
      </Link>
      <div className="navsec">Projects</div>
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/p/${p.slug}`}
          className={`navlink ${pathname === `/p/${p.slug}` ? "active" : ""}`}
        >
          <span className="navdot" style={{ background: p.color, color: p.color }} />
          {p.name}
          {counts[p.id] ? <span className="navcount">{counts[p.id]}</span> : null}
        </Link>
      ))}
    </aside>
  );
}
