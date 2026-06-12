const TZ = process.env.HOME_TZ || "America/Chicago";

/** Today's date as YYYY-MM-DD in the user's home timezone. */
export function todayStr(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function headlineParts(): { weekday: string; rest: string } {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { timeZone: TZ, weekday: "long" });
  const rest = now.toLocaleDateString("en-US", {
    timeZone: TZ,
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return { weekday, rest };
}

/** Human label for a due date relative to today: "today", "tomorrow", "Mon", "Jun 21", "3d late" */
export function dueLabel(due: string): { label: string; overdue: boolean; today: boolean } {
  const today = todayStr();
  if (due === today) return { label: "today", overdue: false, today: true };
  const diff = Math.round(
    (new Date(due + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86_400_000
  );
  if (diff < 0) return { label: `${-diff}d late`, overdue: true, today: false };
  if (diff === 1) return { label: "tomorrow", overdue: false, today: false };
  const d = new Date(due + "T00:00:00");
  if (diff < 7)
    return { label: d.toLocaleDateString("en-US", { weekday: "short" }), overdue: false, today: false };
  return {
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    overdue: false,
    today: false,
  };
}

export function dayHeading(day: string): string {
  const today = todayStr();
  if (day === today) return "Today";
  if (day === todayStr(-1)) return "Yesterday";
  return new Date(day + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
