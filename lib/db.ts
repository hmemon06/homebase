import { createClient } from "@supabase/supabase-js";

// Server-side only. The service role key bypasses RLS — never import this
// from a client component.
export const db = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export type Project = {
  id: string;
  name: string;
  slug: string;
  color: string;
  context_note: string | null;
  sort_order: number;
  archived: boolean;
};

export type Task = {
  id: string;
  project_id: string | null;
  title: string;
  notes: string | null;
  status: "open" | "done";
  priority: 1 | 2 | 3;
  due_date: string | null;
  source: "manual" | "voice" | "canvas";
  external_id: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Capture = {
  id: string;
  content: string;
  kind: "text" | "voice";
  project_id: string | null;
  processed: boolean;
  created_at: string;
};

export type Standup = {
  id: string;
  day: string;
  repo: string;
  commit_count: number;
  summary: string;
};
