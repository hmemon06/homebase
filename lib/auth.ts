// Single-user auth: the session cookie holds SHA-256("hb:" + APP_PASSWORD).
// Works in both the edge runtime (middleware) and node (route handlers).
export async function sessionToken(): Promise<string> {
  const data = new TextEncoder().encode("hb:" + (process.env.APP_PASSWORD ?? ""));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const AUTH_COOKIE = "hb_auth";

/** For machine endpoints (sync, standup): constant-time-ish secret check. */
export function checkSyncSecret(provided: string | null): boolean {
  const expected = process.env.SYNC_SECRET ?? "";
  return expected.length > 0 && provided === expected;
}
