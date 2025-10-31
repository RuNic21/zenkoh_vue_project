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

async function clearTable(tableName) {
  console.log(`[削除中] ${tableName} テーブルのデータを削除しています...`);
  
  // task_members と project_members は複合主キーなので id カラムがない
  // それぞれのテーブルに合わせた削除条件を使用
  let query;
  if (tableName === "task_members") {
    query = supabase.from(tableName).delete().gte("task_id", 0);
  } else if (tableName === "project_members") {
    query = supabase.from(tableName).delete().gte("project_id", 0);
  } else {
    query = supabase.from(tableName).delete().neq("id", 0);
  }
  
  const { error } = await query;
  
  if (error) {
    console.error(`[エラー] ${tableName} の削除に失敗:`, error.message);
    return false;
  } else {
    console.log(`[完了] ${tableName} のデータを削除しました`);
    return true;
  }
}

async function main() {
  console.log("=== データベース全データ削除開始 ===");
  
  // 外部キー制約の順序で削除（依存関係を考慮）
  const tables = [
    "notifications",    // 他のテーブルを参照
    "task_members",     // tasks を参照
    "alert_rules",      // projects を参照
    "board_columns",    // boards を参照
    "boards",           // projects を参照
    "tasks",            // projects を参照
    "project_members",  // projects, users を参照
    "projects",         // 他のテーブルから参照される
    "users"             // 他のテーブルから参照される
  ];
  
  let allSuccess = true;
  
  for (const table of tables) {
    const success = await clearTable(table);
    if (!success) {
      allSuccess = false;
    }
  }
  
  if (allSuccess) {
    console.log("=== データベース全データ削除完了 ===");
  } else {
    console.log("=== データベース削除中にエラーが発生しました ===");
  }
}

main().catch((e) => { 
  console.error("予期せぬエラー:", e.message || String(e)); 
  process.exit(1); 
});
