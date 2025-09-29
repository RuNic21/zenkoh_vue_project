import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

const mode = process.env.NODE_ENV || "development";
const env = loadEnv(mode, process.cwd(), "VITE_");
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("環境変数が見つかりません: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

function iso(d) {
  return d.toISOString();
}

async function main() {
  // プロジェクトが最低1件ある前提。無ければ簡易に1件作成
  let projectId = 1;
  const { data: pj, error: pjErr } = await supabase.from("projects").select("id").limit(1).single();
  if (pjErr || !pj) {
    const { data: created } = await supabase
      .from("projects")
      .insert([{ name: "Tasks Test Project", is_archived: false }])
      .select("id")
      .single();
    projectId = created.id;
  } else {
    projectId = pj.id;
  }

  // CREATE
  console.log("[CREATE] タスク作成...");
  const now = new Date();
  const { data: createdTask, error: createErr } = await supabase
    .from("tasks")
    .insert([
      {
        project_id: projectId,
        task_name: "テストタスク",
        planned_start: iso(now),
        planned_end: iso(new Date(now.getTime() + 3 * 86400000)),
        progress_percent: 0,
        is_archived: false,
      },
    ])
    .select("*")
    .single();
  if (createErr) throw new Error(createErr.message);
  console.log(`[CREATE] OK id=${createdTask.id}`);

  // SELECT by id
  console.log("[SELECT] 取得...");
  const { data: selected, error: selErr } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", createdTask.id)
    .single();
  if (selErr) throw new Error(selErr.message);
  console.log(`[SELECT] OK name=${selected.task_name}`);

  // UPDATE
  console.log("[UPDATE] 進捗/実績更新...");
  const { data: updated, error: updErr } = await supabase
    .from("tasks")
    .update({ progress_percent: 50, actual_start: iso(now) })
    .eq("id", createdTask.id)
    .select("*")
    .single();
  if (updErr) throw new Error(updErr.message);
  console.log(`[UPDATE] OK progress=${updated.progress_percent}`);

  // WHERE 検索
  console.log("[WHERE] project_id + ilike(task_name) ...");
  const { data: list, error: whereErr } = await supabase
    .from("tasks")
    .select("id,task_name,progress_percent")
    .eq("project_id", projectId)
    .ilike("task_name", "%テスト%")
    .order("id", { ascending: false })
    .limit(5);
  if (whereErr) throw new Error(whereErr.message);
  console.log(`[WHERE] ヒット件数=${list?.length ?? 0}`);

  // CLEANUP
  console.log("[CLEANUP] 作成したタスクを削除...");
  const { error: delErr } = await supabase.from("tasks").delete().eq("id", createdTask.id);
  if (delErr) throw new Error(delErr.message);
  console.log("[CLEANUP] OK 削除完了");
}

main().catch((e) => {
  console.error(e.message || String(e));
  process.exit(1);
});


