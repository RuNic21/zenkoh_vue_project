import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

const mode = process.env.NODE_ENV || "development";
const env = loadEnv(mode, process.cwd(), "VITE_");
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

async function count(table) {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
  return { table, count: count ?? 0, error: error?.message };
}

const tables = ["alert_rules", "notifications", "projects", "tasks"];
for (const t of tables) {
  const res = await count(t);
  console.log(`${res.table}: count=${res.count}${res.error ? ` error=${res.error}` : ""}`);
}


