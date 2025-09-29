import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

function log(message) {
  console.log(message);
}

function logError(message) {
  console.error(message);
}

async function main() {
  // 環境変数の読み込み（Vite互換）
  const mode = process.env.NODE_ENV || "development";
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    logError("環境変数が見つかりません: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  try {
    // 1) 作成（CREATE）
    const now = new Date();
    const name = `AI Test Project ${now.toISOString()}`;
    const insertPayload = {
      name,
      description: "自動テスト作成",
      is_archived: false,
    };
    log("[CREATE] プロジェクトを作成します...");
    const { data: created, error: insertError } = await supabase
      .from("projects")
      .insert([insertPayload])
      .select("*")
      .single();
    if (insertError) throw new Error(`[CREATE] 失敗: ${insertError.message}`);
    log(`[CREATE] OK id=${created.id}`);

    // 2) 取得（SELECT by id）
    log("[SELECT] 作成したIDで取得します...");
    const { data: selected, error: selectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", created.id)
      .single();
    if (selectError) throw new Error(`[SELECT] 失敗: ${selectError.message}`);
    log(`[SELECT] OK name=${selected.name}`);

    // 3) 更新（UPDATE）
    log("[UPDATE] 概要とアーカイブフラグを更新します...");
    const { data: updated, error: updateError } = await supabase
      .from("projects")
      .update({ description: "概要を更新", is_archived: true })
      .eq("id", created.id)
      .select("*")
      .single();
    if (updateError) throw new Error(`[UPDATE] 失敗: ${updateError.message}`);
    log(`[UPDATE] OK is_archived=${updated.is_archived}`);

    // 4) 条件検索（WHERE: ilike + eq）
    log("[WHERE] name ilike + is_archived=true で検索します...");
    const { data: whereList, error: whereError } = await supabase
      .from("projects")
      .select("id,name,is_archived")
      .eq("is_archived", true)
      .ilike("name", "%AI Test Project%")
      .order("id", { ascending: false })
      .limit(5);
    if (whereError) throw new Error(`[WHERE] 失敗: ${whereError.message}`);
    log(`[WHERE] ヒット件数=${whereList?.length ?? 0}`);

    // 5) 後片付け（DELETE）
    log("[CLEANUP] 作成したデータを削除します...");
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", created.id);
    if (deleteError) throw new Error(`[CLEANUP] 失敗: ${deleteError.message}`);
    log("[CLEANUP] OK 削除完了");

    log("すべてのテストが完了しました");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logError(msg);
    process.exitCode = 1;
  }
}

main();


