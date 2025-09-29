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

const candidates = [
  // 英語
  "low","medium","high","urgent","critical","minor","major","normal",
  // 日本語（よくある表記）
  "低","中","高","低優先","中優先","高優先","低い","普通","高い",
  // 数値・記号
  "1","2","3","P1","P2","P3"
];

async function ensureProject() {
  const { data, error } = await supabase.from("projects").select("id").limit(1).single();
  if (data?.id) return data.id;
  const { data: created } = await supabase
    .from("projects")
    .insert([{ name: "Priority Probe", is_archived: false }])
    .select("id")
    .single();
  return created.id;
}

async function tryInsert(priority, projectId) {
  const { data, error } = await supabase
    .from("tasks")
    .insert([{ project_id: projectId, task_name: `probe ${priority}`, status: "未着手", priority }])
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  // cleanup
  await supabase.from("tasks").delete().eq("id", data.id);
  return { ok: true };
}

async function main() {
  const projectId = await ensureProject();
  for (const p of candidates) {
    const res = await tryInsert(p, projectId);
    if (res.ok) {
      console.log(`[OK] priority='${p}'`);
      process.exit(0);
      return;
    } else {
      console.log(`[NG] '${p}' -> ${res.error}`);
    }
  }
  console.log("どの候補も通りませんでした");
  process.exit(1);
}

main();


