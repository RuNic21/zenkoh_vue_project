// users テーブルの実際のスキーマを確認
import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

const mode = process.env.NODE_ENV || "development";
const env = loadEnv(mode, process.cwd(), "VITE_");

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ 環境変数が見つかりません: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
  console.error("   .env.local ファイルを確認してください");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("=== users テーブルスキーマ確認 ===\n");

  // 方法1: サンプルデータからカラムを推測
  console.log("1. サンプルデータからカラムを確認...");
  const { data: sample, error: sampleError } = await supabase
    .from("users")
    .select("*")
    .limit(1);

  if (sampleError) {
    console.error(`❌ エラー: ${sampleError.message}`);
    if (sampleError.code === "PGRST116") {
      console.error("   users テーブルが存在しないか、アクセス権限がありません");
    }
    process.exit(1);
  }

  if (!sample || sample.length === 0) {
    console.log("⚠️  users テーブルにデータがありません");
    console.log("   空のテーブルからはスキーマを確認できません");
    console.log("\n代わりに、information_schema から確認を試みます...\n");
    
    // 方法2: information_schema から確認
    const { data: columns, error: colsError } = await supabase
      .rpc("get_table_columns", { table_name: "users" })
      .single();
    
    if (colsError) {
      console.error(`❌ information_schema アクセスエラー: ${colsError.message}`);
      console.log("\n手動で確認してください:");
      console.log("  Supabase Dashboard > Table Editor > users テーブル");
      process.exit(1);
    }
    
    if (columns) {
      console.log("カラム一覧:");
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
    process.exit(0);
  }

  const user = sample[0];
  const columns = Object.keys(user);
  
  console.log(`✅ users テーブルから ${columns.length} 個のカラムを確認しました\n`);
  console.log("カラム一覧:");
  columns.forEach(col => {
    const value = user[col];
    const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
    const displayValue = value === null ? "NULL" : 
                       typeof value === "string" && value.length > 50 ? value.substring(0, 50) + "..." : 
                       String(value);
    console.log(`  - ${col}: ${type} = ${displayValue}`);
  });

  // 必須カラムチェック
  console.log("\n=== 必須カラムチェック ===\n");
  
  const required = {
    "id": "✅",
    "auth_id": "⚠️  (認証統合用 - 存在しない場合はマイグレーション必要)",
    "email": "✅",
    "display_name": "✅",
    "password_hash": "✅",
    "is_active": "✅",
    "role": "⚠️  (権限管理用 - 存在しない場合はマイグレーション必要)",
    "avatar_url": "ℹ️  (オプション)",
    "created_at": "✅",
    "updated_at": "✅",
  };

  const missing = [];
  const found = [];

  Object.keys(required).forEach(col => {
    if (columns.includes(col)) {
      console.log(`${required[col]} ${col}: 存在します`);
      found.push(col);
    } else {
      console.log(`❌ ${col}: 存在しません ${required[col]}`);
      missing.push(col);
    }
  });

  // 結果サマリー
  console.log("\n=== 確認結果 ===\n");
  
  if (missing.length === 0) {
    console.log("✅ すべての必須カラムが存在します！");
    console.log("✅ コードとデータベーススキーマが一致しています。");
  } else {
    console.log(`⚠️  不足しているカラム: ${missing.join(", ")}`);
    console.log("\n必要なマイグレーション:");
    
    if (missing.includes("auth_id")) {
      console.log("  📄 scripts/migrations/2025-01-XX_add_auth_id_to_users.sql");
      console.log("     → auth_id UUID カラムを追加");
    }
    
    if (missing.includes("role")) {
      console.log("  📄 scripts/migrations/2025-01-XX_add_role_to_users.sql");
      console.log("     → role TEXT カラムを追加 (admin, manager, member, viewer)");
    }
    
    console.log("\n実行方法:");
    console.log("  1. Supabase Dashboard > SQL Editor を開く");
    console.log("  2. 上記のマイグレーションファイルの内容をコピー");
    console.log("  3. SQL Editor で実行");
  }

  // 実際のデータ例
  console.log("\n=== データサンプル ===\n");
  const { data: allUsers, error: usersError } = await supabase
    .from("users")
    .select("id, email, display_name, auth_id, role, is_active")
    .limit(5);

  if (!usersError && allUsers && allUsers.length > 0) {
    console.log(`サンプルデータ (${allUsers.length}件):`);
    allUsers.forEach((u, i) => {
      console.log(`\nユーザー ${i + 1}:`);
      console.log(`  id: ${u.id}`);
      console.log(`  email: ${u.email}`);
      console.log(`  display_name: ${u.display_name}`);
      console.log(`  auth_id: ${u.auth_id || "NULL (未設定)"}`);
      console.log(`  role: ${u.role || "NULL (未設定)"}`);
      console.log(`  is_active: ${u.is_active}`);
    });
  }

  process.exit(missing.length > 0 ? 1 : 0);
}

main().catch(e => {
  console.error("❌ エラー:", e.message);
  process.exit(1);
});

