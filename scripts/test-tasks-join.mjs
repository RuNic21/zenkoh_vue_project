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

async function ensure() {
  const { data: pj } = await supabase.from("projects").select("id,name").limit(1).single();
  let projectId = pj?.id;
  if (!projectId) {
    const { data } = await supabase.from("projects").insert([{ name: "Join Test", is_archived: false }]).select("id").single();
    projectId = data.id;
  }
  const { data: tk } = await supabase
    .from("tasks")
    .select("id")
    .eq("project_id", projectId)
    .limit(1)
    .maybeSingle();
  if (!tk) {
    await supabase
      .from("tasks")
      .insert([{ project_id: projectId, task_name: "Join サンプル", progress_percent: 0, is_archived: false }]);
  }
  return projectId;
}

async function main() {
  await ensure();
  const { data, error } = await supabase
    .from("tasks")
    .select("id,task_name,project:projects(id,name)")
    .order("id", { ascending: false })
    .limit(5);
  if (error) throw new Error(error.message);
  for (const row of data) {
    console.log(`task=${row.task_name} project=${row.project?.name}`);
  }
}

main().catch((e) => {
  console.error(e.message || String(e));
  process.exit(1);
});


