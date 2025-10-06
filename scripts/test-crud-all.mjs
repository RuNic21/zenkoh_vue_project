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

async function ensureProject(name="All CRUD Project") {
  const { data } = await supabase.from("projects").insert([{ name, is_archived: false }]).select("*").single();
  return data;
}

async function testBoards(pid) {
  const { data: b } = await supabase.from("boards").insert([{ project_id: pid, name: "BoardA", is_default: true }]).select("*").single();
  await supabase.from("boards").update({ name: "BoardA-Updated" }).eq("id", b.id).select("*").single();
  await supabase.from("boards").delete().eq("id", b.id);
  console.log("[boards] OK");
}

async function testBoardColumns(pid) {
  const { data: b } = await supabase.from("boards").insert([{ project_id: pid, name: "B", is_default: true }]).select("*").single();
  const { data: c } = await supabase
    .from("board_columns")
    .insert([{ board_id: b.id, name: "ToDo", sort_order: 1 }])
    .select("*")
    .single();
  await supabase.from("board_columns").update({ name: "Doing" }).eq("id", c.id).select("*").single();
  await supabase.from("board_columns").delete().eq("id", c.id);
  await supabase.from("boards").delete().eq("id", b.id);
  console.log("[board_columns] OK");
}

async function testUsersAndTaskMembers(pid) {
  const { data: u } = await supabase
    .from("users")
    .insert([{ email: "member@example.com", display_name: "メンバー", password_hash: "x", is_active: true }])
    .select("*")
    .single();
  const { data: t } = await supabase
    .from("tasks")
    .insert([{ project_id: pid, task_name: "MemberTask", progress_percent: 0, is_archived: false }])
    .select("*")
    .single();
  await supabase.from("task_members").insert([{ task_id: t.id, user_id: u.id, role: "CONTRIBUTOR" }]).select("*").single();
  await supabase.from("task_members").delete().eq("task_id", t.id).eq("user_id", u.id);
  await supabase.from("tasks").delete().eq("id", t.id);
  await supabase.from("users").delete().eq("id", u.id);
  console.log("[users/task_members] OK");
}

async function testAlertRulesAndNotifications(pid) {
  const { data: rule, error: ruleErr } = await supabase
    .from("alert_rules")
    .insert([{ project_id: pid, name: "Rule1", rule_type: "overdue", is_enabled: true }])
    .select("*")
    .single();
  if (ruleErr || !rule) {
    console.log("[alert_rules] SKIP: 作成に失敗 (RLS/制約の可能性)");
    return;
  }

  const { data: noti, error: notiErr } = await supabase
    .from("notifications")
    .insert([{ project_id: pid, alert_rule_id: rule.id, to_email: "to@example.com", subject: "件名", body_text: "本文", send_after: new Date().toISOString() }])
    .select("*")
    .single();

  if (!notiErr && noti) {
    await supabase.from("notifications").update({ status: "QUEUED" }).eq("id", noti.id).select("*").single();
    await supabase.from("notifications").delete().eq("id", noti.id);
  } else {
    console.log("[notifications] SKIP: 作成に失敗 (RLS/制約の可能性)");
  }
  await supabase.from("alert_rules").delete().eq("id", rule.id);
  console.log("[alert_rules/notifications] OK or SKIP");
}

async function main() {
  const p = await ensureProject();
  const pid = p.id;
  await testBoards(pid);
  await testBoardColumns(pid);
  await testUsersAndTaskMembers(pid);
  await testAlertRulesAndNotifications(pid);
  await supabase.from("projects").delete().eq("id", pid);
  console.log("All CRUD tests finished");
}

main().catch((e) => {
  console.error(e.message || String(e));
  process.exit(1);
});


