import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isoAdd(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function makeTasks(projectId, count) {
  const statuses = [null];
  const priorities = [null];
  const rows = [];
  for (let i = 0; i < count; i++) {
    const startOffset = randInt(-10, 10);
    const endOffset = startOffset + randInt(1, 14);
    rows.push({
      project_id: projectId,
      task_name: `シードタスク ${i + 1}`,
      ...(statuses[0] !== null ? { status: statuses[randInt(0, statuses.length - 1)] } : {}),
      ...(priorities[0] !== null ? { priority: priorities[randInt(0, priorities.length - 1)] } : {}),
      planned_start: isoAdd(startOffset),
      planned_end: isoAdd(endOffset),
      progress_percent: randInt(0, 100),
      is_archived: false,
      sort_order: i + 1,
    });
  }
  return rows;
}

async function main() {
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

  // 対象プロジェクトの取得 or 自動作成
  let projectId = 1;
  const { data: pj, error: pjErr } = await supabase.from("projects").select("id").limit(1).single();
  if (pjErr || !pj) {
    const { data: created } = await supabase
      .from("projects")
      .insert([{ name: "Tasks Seed Project", is_archived: false }])
      .select("id")
      .single();
    projectId = created.id;
  } else {
    projectId = pj.id;
  }

  const count = Number(process.env.COUNT || 10);
  const rows = makeTasks(projectId, count);
  console.log(`[SEED:TASKS] project_id=${projectId} に ${rows.length} 件挿入します...`);
  const { data, error } = await supabase.from("tasks").insert(rows).select("id,task_name");
  if (error) {
    console.error("[SEED:TASKS] 失敗:", error.message);
    process.exit(1);
  }
  console.log(`[SEED:TASKS] 完了。作成件数=${data?.length ?? 0}`);
}

main();


