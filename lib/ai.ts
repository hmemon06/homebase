import type { Project } from "@/lib/db";
import { todayStr } from "@/lib/dates";

export type RoutedCapture = {
  project_slug: string | null;
  tasks: { title: string; due_date: string | null; priority: 1 | 2 | 3 }[];
};

/**
 * Ask Claude to file a capture: which project it belongs to and any concrete
 * tasks inside it. Returns null when no API key is configured or the call
 * fails — the capture then just sits in the inbox for manual filing.
 */
export async function routeCapture(
  content: string,
  projects: Project[]
): Promise<RoutedCapture | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const projectList = projects
    .map((p) => `- ${p.slug}: ${p.name}`)
    .join("\n");

  const system = `You file quick voice/text captures into a personal dashboard. Today is ${todayStr()}.

Projects:
${projectList}

Respond with ONLY a JSON object, no prose:
{"project_slug": "<slug or null if unclear/personal>", "tasks": [{"title": "...", "due_date": "YYYY-MM-DD or null", "priority": 1|2|3}]}

Rules:
- Extract a task only when the capture contains a concrete action item. A pure thought/note has "tasks": [].
- Clean up speech artifacts in task titles; keep them short and imperative.
- priority 1 = urgent/important, 2 = normal (default), 3 = someday.
- Resolve relative dates ("friday", "next week") to real dates.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ROUTING_MODEL || "claude-haiku-4-5",
        max_tokens: 500,
        system,
        messages: [{ role: "user", content }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    const slugs = new Set(projects.map((p) => p.slug));
    return {
      project_slug: slugs.has(parsed.project_slug) ? parsed.project_slug : null,
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks
            .filter((t: { title?: unknown }) => typeof t.title === "string" && t.title)
            .map((t: { title: string; due_date?: string; priority?: number }) => ({
              title: t.title.slice(0, 300),
              due_date: /^\d{4}-\d{2}-\d{2}$/.test(t.due_date ?? "") ? t.due_date! : null,
              priority: ([1, 2, 3].includes(t.priority ?? 0) ? t.priority : 2) as 1 | 2 | 3,
            }))
        : [],
    };
  } catch {
    return null;
  }
}
