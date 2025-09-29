import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

const mode = process.env.NODE_ENV || "development";
const env = loadEnv(mode, process.cwd(), "VITE_");
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

async function ensureProject() {
  const { data } = await supabase.from("projects").insert([{ name: "Probe AR", is_archived: false }]).select("id").single();
  return data.id;
}

async function tryRule(pid, rule_type) {
  const { data, error } = await supabase
    .from("alert_rules")
    .insert([{ project_id: pid, name: `Probe ${rule_type}`, rule_type, is_enabled: true }])
    .select("id")
    .single();
  if (!error && data) {
    await supabase.from("alert_rules").delete().eq("id", data.id);
    return { ok: true };
  }
  return { ok: false, error: error?.message };
}

async function main() {
  const pid = await ensureProject();
  const candidates = [
    "OVERDUE","DUE_SOON","ERROR","WARN","INFO",
    "overdue","due_soon","error","warn","info",
    "ALERT","REMINDER","REMIND","FAILURE","SUCCESS"
  ];
  for (const c of candidates) {
    const res = await tryRule(pid, c);
    if (res.ok) {
      console.log(`[OK] rule_type='${c}'`);
      await supabase.from("projects").delete().eq("id", pid);
      return;
    } else {
      console.log(`[NG] '${c}' -> ${res.error}`);
    }
  }
  console.log("どの候補も通りませんでした");
  await supabase.from("projects").delete().eq("id", pid);
  process.exit(1);
}

main();


