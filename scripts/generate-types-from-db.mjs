import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// このスクリプトは information_schema を参照して public スキーマの各テーブルを
// TypeScript の型に落とし込みます。シンプルなマッピングのみを行い、
// NOT NULL を必須、NULLABLE を optional | null として反映します。

const TYPE_MAP = {
  // 整数系
  "smallint": "number",
  "integer": "number",
  "bigint": "number",
  "int2": "number",
  "int4": "number",
  "int8": "number",
  // 浮動小数
  "numeric": "number",
  "decimal": "number",
  "real": "number",
  "double precision": "number",
  // 文字列系
  "text": "string",
  "character varying": "string",
  "varchar": "string",
  "character": "string",
  "char": "string",
  // 真偽
  "boolean": "boolean",
  "bool": "boolean",
  // 日付/時刻
  "date": "string",
  "timestamp without time zone": "string",
  "timestamp with time zone": "string",
  "timestamptz": "string",
  // その他
  "uuid": "string",
  "json": "Record<string, unknown>",
  "jsonb": "Record<string, unknown>",
  "bytea": "string",
  "ARRAY": "unknown[]",
  "oid": "number",
};

function mapType(dataType, udtName) {
  // ARRAY 判定
  if (dataType === "ARRAY") return "unknown[]";
  const key = (dataType || udtName || "").toLowerCase();
  return TYPE_MAP[key] || "unknown";
}

function buildInterface(tableName, columns) {
  const lines = [];
  lines.push("// 自動生成: information_schema から生成（編集しないこと）");
  lines.push(`export interface ${toPascal(tableName)} {`);
  for (const col of columns) {
    const tsType = mapType(col.data_type, col.udt_name);
    const isNullable = col.is_nullable === "YES";
    const opt = isNullable ? "?" : "";
    const valueType = isNullable ? `${tsType} | null` : tsType;
    lines.push(`  ${col.column_name}${opt}: ${valueType};`);
  }
  lines.push("}");
  return lines.join("\n");
}

function toPascal(name) {
  return name
    .split(/[_-]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

async function fetchTables(client) {
  const { data, error } = await client
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public");
  if (error) throw new Error(error.message);
  return (data || []).map((r) => r.table_name);
}

async function fetchColumns(client, table) {
  const { data, error } = await client
    .from("information_schema.columns")
    .select("column_name,is_nullable,data_type,udt_name")
    .eq("table_schema", "public")
    .eq("table_name", table)
    .order("ordinal_position", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
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

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    db: { schema: "information_schema" },
  });

  // テーブル一覧
  const publicClient = createClient(supabaseUrl, supabaseAnonKey);
  const tables = await fetchTables(publicClient);
  if (tables.length === 0) {
    console.warn("public スキーマにテーブルが見つかりませんでした");
    return;
  }

  const outDir = path.resolve("src/types/db");
  fs.mkdirSync(outDir, { recursive: true });

  for (const table of tables) {
    const cols = await fetchColumns(publicClient, table);
    if (!cols.length) continue;
    const content = buildInterface(table, cols);
    fs.writeFileSync(path.join(outDir, `${table}.ts`), content, "utf8");
    console.log(`generated: ${table}`);
  }

  console.log(`型生成完了: ${outDir}`);
}

main();


