import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

const mode = process.env.NODE_ENV || "development";
const env = loadEnv(mode, process.cwd(), "VITE_");
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

async function count(table, column = "id") {
  const { count, error } = await supabase.from(table).select(column, { count: "exact", head: true });
  return { table, count: count ?? 0, error: error?.message };
}

const tables = [
  { name: "users", column: "id" },
  { name: "projects", column: "id" },
  { name: "project_members", column: "project_id" }, // 複合キー
  { name: "tasks", column: "id" },
  { name: "task_members", column: "task_id" }, // 複合キー
  { name: "boards", column: "id" },
  { name: "board_columns", column: "id" },
  { name: "alert_rules", column: "id" },
  { name: "notifications", column: "id" }
];

console.log("=== データベーステーブルのレコード数 ===");
for (const t of tables) {
  const res = await count(t.name, t.column);
  console.log(`${res.table}: count=${res.count}${res.error ? ` error=${res.error}` : ""}`);
}
console.log("==========================================");


