import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

const mode = process.env.NODE_ENV || "development";
const env = loadEnv(mode, process.cwd(), "VITE_");
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("環境変数が見つかりません");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

async function testProjects() {
  const { data: created, error: insErr } = await supabase
    .from("projects")
    .insert([{ name: "CRUD Test Project", is_archived: false }])
    .select("*")
    .single();
  if (insErr) throw new Error(insErr.message);
  const pid = created.id;

  const { data: got } = await supabase.from("projects").select("*").eq("id", pid).single();
  if (!got) throw new Error("select failed");

  const { data: upd } = await supabase
    .from("projects")
    .update({ description: "updated" })
    .eq("id", pid)
    .select("*")
    .single();
  if (!upd) throw new Error("update failed");

  const { error: delErr } = await supabase.from("projects").delete().eq("id", pid);
  if (delErr) throw new Error(delErr.message);
  console.log("[projects] OK");
}

async function testUsers() {
  const { data: u } = await supabase
    .from("users")
    .insert([{ email: "user@example.com", display_name: "表示名", password_hash: "x", is_active: true }])
    .select("*")
    .single();
  const uid = u.id;
  await supabase.from("users").update({ display_name: "更新" }).eq("id", uid).select("*").single();
  await supabase.from("users").delete().eq("id", uid);
  console.log("[users] OK");
}

async function testTasks() {
  const { data: p } = await supabase
    .from("projects")
    .insert([{ name: "Task CRUD", is_archived: false }])
    .select("id")
    .single();
  const pid = p.id;

  const { data: t } = await supabase
    .from("tasks")
    .insert([{ project_id: pid, task_name: "T1", progress_percent: 0, is_archived: false }])
    .select("*")
    .single();
  const tid = t.id;

  await supabase.from("tasks").update({ progress_percent: 10 }).eq("id", tid).select("*").single();
  await supabase.from("tasks").delete().eq("id", tid);
  await supabase.from("projects").delete().eq("id", pid);
  console.log("[tasks] OK");
}

async function main() {
  await testProjects();
  await testUsers();
  await testTasks();
  console.log("CRUD tests finished");
}

main().catch((e) => {
  console.error(e.message || String(e));
  process.exit(1);
});


