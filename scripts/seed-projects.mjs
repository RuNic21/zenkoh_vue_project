import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dateAdd(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildPayloads(count = 10) {
  const names = [
    "AI 研究プロジェクト",
    "新製品ローンチ",
    "Webサイト刷新",
    "基幹システム移行",
    "モバイルアプリ開発",
    "データ分析基盤",
    "セキュリティ強化",
    "社内ポータル改善",
    "CI/CD 導入",
    "ダッシュボード構築",
    "サプライチェーン可視化",
  ];

  const today = new Date();
  const payloads = [];
  for (let i = 0; i < count; i++) {
    const offset = randInt(-60, 30);
    const duration = randInt(7, 45);
    const start = dateAdd(today, offset);
    const end = dateAdd(today, offset + duration);
    payloads.push({
      name: `${pick(names)} ${i + 1}`,
      description: "シード投入データ",
      start_date: Math.random() > 0.3 ? start : null,
      end_date: Math.random() > 0.3 ? end : null,
      owner_user_id: null,
      is_archived: Math.random() > 0.8,
    });
  }
  return payloads;
}

async function main() {
  const mode = process.env.NODE_ENV || "development";
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("環境変数が見つかりません: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const count = Number(process.env.COUNT || 10);
  const rows = buildPayloads(count);
  console.log(`[SEED] projects に ${rows.length} 件を挿入します...`);

  const { data, error } = await supabase.from("projects").insert(rows).select("id,name");
  if (error) {
    console.error("[SEED] 失敗:", error.message);
    process.exitCode = 1;
    return;
  }
  console.log(`[SEED] 完了。作成件数=${data?.length ?? 0}`);
}

main();


