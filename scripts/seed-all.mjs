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

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function isoAdd(days) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString(); }

async function main() {
  const projects = [];
  for (let i = 0; i < 3; i++) {
    const { data } = await supabase
      .from("projects")
      .insert([{ name: `Seed PJ ${i+1}`, description: "サンプル", is_archived: false }])
      .select("*")
      .single();
    projects.push(data);
  }

  for (const pj of projects) {
    // boards
    const boards = [];
    for (let b = 0; b < 2; b++) {
      const { data } = await supabase
        .from("boards")
        .insert([{ project_id: pj.id, name: `Board ${b+1}`, is_default: b===0 }])
        .select("*")
        .single();
      boards.push(data);
    }
    // columns
    for (const bd of boards) {
      const cols = ["ToDo","Doing","Done"];
      let order = 1;
      for (const name of cols) {
        await supabase
          .from("board_columns")
          .insert([{ board_id: bd.id, name, sort_order: order++ }]);
      }
    }
    // tasks
    for (let t = 0; t < 10; t++) {
      await supabase
        .from("tasks")
        .insert([{ project_id: pj.id, task_name: `Task ${t+1}`, description: "説明", planned_start: isoAdd(-randInt(0,10)), planned_end: isoAdd(randInt(1,15)), progress_percent: randInt(0,100), is_archived: false }]);
    }

    // alert_rules（失敗しても続行）
    {
      const { error } = await supabase
        .from("alert_rules")
        .insert([{ project_id: pj.id, name: `Overdue Rule PJ${pj.id}` , rule_type: "OVERDUE", is_enabled: true }]);
      if (error) console.warn(`[seed] alert_rules insert failed pj=${pj.id}:`, error.message);
    }
  }

  // users
  for (let u = 0; u < 5; u++) {
    await supabase
      .from("users")
      .insert([{ email: `user${u+1}@example.com`, display_name: `ユーザー${u+1}`, password_hash: "x", is_active: true }]);
  }

  // メンバー割当と通知生成（失敗は無視）
  const { data: usersList } = await supabase.from("users").select("id").order("id", { ascending: false }).limit(10);
  for (const pj of projects) {
    const { data: tasks } = await supabase.from("tasks").select("id").eq("project_id", pj.id).order("id", { ascending: false }).limit(10);
    const { data: rules } = await supabase.from("alert_rules").select("id").eq("project_id", pj.id).limit(1);
    const ruleId = rules && rules[0]?.id;
    if (tasks && usersList) {
      for (const tk of tasks) {
        const u1 = usersList[randInt(0, usersList.length - 1)];
        const u2 = usersList[randInt(0, usersList.length - 1)];
        if (u1) await supabase.from("task_members").insert([{ task_id: tk.id, user_id: u1.id, role: "CONTRIBUTOR" }]);
        if (u2 && u2.id !== u1?.id) await supabase.from("task_members").insert([{ task_id: tk.id, user_id: u2.id, role: "VIEWER" }]);
        if (ruleId) {
          const { error } = await supabase
            .from("notifications")
            .insert([{ project_id: pj.id, task_id: tk.id, alert_rule_id: ruleId, to_email: "notify@example.com", subject: `通知 ${tk.id}`, body_text: "タスク通知", send_after: new Date().toISOString() }]);
          if (error) console.warn(`[seed] notifications insert failed pj=${pj.id} task=${tk.id}:`, error.message);
        }
      }
    }
  }

  console.log("シード投入が完了しました");
}

main().catch((e) => { console.error(e.message || String(e)); process.exit(1); });


