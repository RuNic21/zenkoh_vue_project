// users テーブルのスキーマを確認するスクリプト
// 目的: 実際のデータベーススキーマとコードの仮定を比較

import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

const mode = process.env.NODE_ENV || "development";
const env = loadEnv(mode, process.cwd(), "VITE_");

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function log(message) {
  console.log(message);
}

function logError(message) {
  console.error(message);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logWarning(message) {
  console.warn(`⚠️  ${message}`);
}

async function checkUsersSchema() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      logError("環境変数が見つかりません: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
      process.exitCode = 1;
      return;
    }

    log("=== users テーブルスキーマ確認 ===\n");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // information_schema から users テーブルのカラム情報を取得
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema_columns")
      .select("column_name, data_type, is_nullable, column_default")
      .eq("table_name", "users")
      .eq("table_schema", "public")
      .order("ordinal_position");

    if (columnsError) {
      logError("スキーマ情報の取得に失敗しました");
      logError(`詳細: ${columnsError.message}`);
      
      // 代替方法: 実際に users テーブルから1件取得してカラムを確認
      log("\n代替方法: users テーブルからサンプルデータを取得して確認します...");
      const { data: sample, error: sampleError } = await supabase
        .from("users")
        .select("*")
        .limit(1);
      
      if (sampleError) {
        logError(`サンプルデータ取得エラー: ${sampleError.message}`);
        process.exitCode = 1;
        return;
      }
      
      if (sample && sample.length > 0) {
        log("\nサンプルデータから確認されたカラム:");
        Object.keys(sample[0]).forEach((key) => {
          const value = sample[0][key];
          const type = value === null ? "null" : typeof value;
          log(`  - ${key}: ${type}`);
        });
      } else {
        logWarning("users テーブルにデータがありません");
      }
      process.exitCode = 1;
      return;
    }

    if (!columns || columns.length === 0) {
      logError("users テーブルのカラム情報が見つかりませんでした");
      process.exitCode = 1;
      return;
    }

    log("users テーブルのカラム一覧:");
    const columnNames = columns.map((col) => col.column_name);
    columns.forEach((col) => {
      const nullable = col.is_nullable === "YES" ? "NULL可" : "NOT NULL";
      const defaultVal = col.column_default ? ` (デフォルト: ${col.column_default})` : "";
      log(`  - ${col.column_name}: ${col.data_type} [${nullable}]${defaultVal}`);
    });

    log("\n=== 必須カラムの確認 ===\n");

    // 必須カラムチェック
    const requiredColumns = {
      id: "BIGINT または INTEGER",
      auth_id: "UUID (認証統合用)",
      email: "TEXT または VARCHAR",
      display_name: "TEXT または VARCHAR",
      password_hash: "TEXT または VARCHAR",
      is_active: "BOOLEAN",
      role: "TEXT (admin, manager, member, viewer)",
      avatar_url: "TEXT (オプション)",
      created_at: "TIMESTAMPTZ",
      updated_at: "TIMESTAMPTZ",
    };

    const missingColumns = [];
    const foundColumns = {};

    Object.keys(requiredColumns).forEach((colName) => {
      const found = columnNames.includes(colName);
      foundColumns[colName] = found;
      if (found) {
        logSuccess(`${colName}: 存在します`);
      } else {
        logWarning(`${colName}: 存在しません (期待: ${requiredColumns[colName]})`);
        missingColumns.push(colName);
      }
    });

    // 特に重要なカラムの確認
    log("\n=== 認証統合関連カラムの確認 ===\n");

    if (foundColumns.auth_id) {
      logSuccess("auth_id カラムが存在します - 認証統合が可能です");
      
      // auth_id の型確認
      const authIdCol = columns.find((col) => col.column_name === "auth_id");
      if (authIdCol) {
        if (authIdCol.data_type === "uuid" || authIdCol.data_type.includes("uuid")) {
          logSuccess(`auth_id の型: ${authIdCol.data_type} (正しい型です)`);
        } else {
          logWarning(`auth_id の型: ${authIdCol.data_type} (UUID が期待されます)`);
        }
      }
    } else {
      logError("auth_id カラムが存在しません - 認証統合ができません");
      log("  解決方法: scripts/migrations/2025-01-XX_add_auth_id_to_users.sql を実行してください");
    }

    if (foundColumns.role) {
      logSuccess("role カラムが存在します - 権限管理が可能です");
      
      // role の型確認
      const roleCol = columns.find((col) => col.column_name === "role");
      if (roleCol) {
        logSuccess(`role の型: ${roleCol.data_type}`);
      }
    } else {
      logWarning("role カラムが存在しません - デフォルト権限のみ使用されます");
      log("  解決方法: scripts/migrations/2025-01-XX_add_role_to_users.sql を実行してください");
    }

    // サマリー
    log("\n=== 確認結果サマリー ===\n");
    if (missingColumns.length === 0) {
      logSuccess("すべての必須カラムが存在します！");
      logSuccess("コードとデータベーススキーマが一致しています。");
    } else {
      logWarning(`不足しているカラム: ${missingColumns.join(", ")}`);
      log("\n必要なマイグレーション:");
      if (missingColumns.includes("auth_id")) {
        log("  - scripts/migrations/2025-01-XX_add_auth_id_to_users.sql");
      }
      if (missingColumns.includes("role")) {
        log("  - scripts/migrations/2025-01-XX_add_role_to_users.sql");
      }
    }

    // 実際のデータサンプル確認
    log("\n=== データサンプル確認 ===\n");
    const { data: sampleData, error: sampleError } = await supabase
      .from("users")
      .select("*")
      .limit(3);

    if (sampleError) {
      logWarning(`サンプルデータ取得エラー: ${sampleError.message}`);
    } else if (sampleData && sampleData.length > 0) {
      log(`サンプルデータ (${sampleData.length}件):`);
      sampleData.forEach((user, index) => {
        log(`\nユーザー ${index + 1}:`);
        log(`  - id: ${user.id}`);
        log(`  - email: ${user.email}`);
        log(`  - display_name: ${user.display_name}`);
        log(`  - auth_id: ${user.auth_id || "NULL (未設定)"}`);
        log(`  - role: ${user.role || "NULL (未設定)"}`);
        log(`  - is_active: ${user.is_active}`);
      });
    } else {
      logWarning("users テーブルにデータがありません");
    }

    process.exitCode = missingColumns.length > 0 ? 1 : 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logError("エラーが発生しました");
    logError(`詳細: ${msg}`);
    process.exitCode = 1;
  }
}

checkUsersSchema();

