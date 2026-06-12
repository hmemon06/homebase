// Nightly auto-standup: scans every git repo in your code folder for today's
// commits and reports them to Homebase. Scheduled via Windows Task Scheduler.
//
//   node scripts/standup.mjs
//
// Reads APP_URL and SYNC_SECRET from ../.env.local (or the environment).

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const file = join(here, "..", ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim();
  }
}
loadEnv();

const APP_URL = process.env.APP_URL;
const SYNC_SECRET = process.env.SYNC_SECRET;
const CODE_DIR = process.env.CODE_DIR || join(homedir(), "Desktop", "code");

if (!APP_URL || !SYNC_SECRET) {
  console.error("APP_URL and SYNC_SECRET must be set (in .env.local or env)");
  process.exit(1);
}

const day = new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD
const since = `${day}T00:00:00`;

const entries = [];
for (const name of readdirSync(CODE_DIR)) {
  const repo = join(CODE_DIR, name);
  if (!existsSync(join(repo, ".git"))) continue;
  let out = "";
  try {
    out = execFileSync(
      "git",
      ["log", "--all", `--since=${since}`, "--no-merges", "--pretty=format:%s"],
      { cwd: repo, encoding: "utf8", timeout: 15_000 }
    ).trim();
  } catch {
    continue; // unreadable repo — skip
  }
  if (!out) continue;
  const messages = [...new Set(out.split("\n").map((s) => s.trim()).filter(Boolean))];
  entries.push({
    repo: name,
    commit_count: out.split("\n").length,
    summary: messages.slice(0, 12).join(" · "),
  });
}

if (entries.length === 0) {
  console.log(`${day}: no commits today.`);
  process.exit(0);
}

const res = await fetch(`${APP_URL.replace(/\/$/, "")}/api/standup`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${SYNC_SECRET}`,
  },
  body: JSON.stringify({ day, entries }),
});

if (!res.ok) {
  console.error(`standup post failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
console.log(`${day}: reported ${entries.length} repo(s) — ${entries.map((e) => e.repo).join(", ")}`);
