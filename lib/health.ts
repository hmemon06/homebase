export type HealthResult = { name: string; up: boolean; ms: number };

/**
 * Ping self-hosted services (e.g. Synk's LiveKit box) and report status.
 * Configured via HEALTH_CHECKS env: "synk=https://host/healthz,other=https://…"
 */
export async function checkHealth(): Promise<HealthResult[]> {
  const spec = process.env.HEALTH_CHECKS;
  if (!spec) return [];

  const targets = spec
    .split(",")
    .map((pair) => {
      const i = pair.indexOf("=");
      return i > 0 ? { name: pair.slice(0, i).trim(), url: pair.slice(i + 1).trim() } : null;
    })
    .filter((t): t is { name: string; url: string } => Boolean(t?.url));

  return Promise.all(
    targets.map(async ({ name, url }) => {
      const start = Date.now();
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3500), cache: "no-store" });
        return { name, up: res.ok, ms: Date.now() - start };
      } catch {
        return { name, up: false, ms: Date.now() - start };
      }
    })
  );
}
