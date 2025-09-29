import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

function usage() {
  console.log(
    "Usage: node scripts/export-csv.mjs <table> <columns> <outfile> [filter-json]"
  );
  console.log("例: node scripts/export-csv.mjs projects 'id,name' exports/projects.csv");
  console.log(
    "例: node scripts/export-csv.mjs tasks 'id,task_name,project:projects(name)' exports/tasks_with_project.csv '{\"is_archived\":false}'"
  );
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else if (Array.isArray(v)) {
      out[key] = JSON.stringify(v);
    } else {
      out[key] = v;
    }
  }
  return out;
}

function toCsv(rows) {
  if (!rows.length) return "";
  const flatRows = rows.map((r) => flatten(r));
  const headers = Array.from(
    flatRows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );
  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n]/.test(s)) return '"' + s.replaceAll('"', '""') + '"';
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of flatRows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

async function main() {
  const [,, table, columns, outfile, filterJson] = process.argv;
  if (!table || !columns || !outfile) {
    usage();
    process.exit(1);
  }
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

  let query = supabase.from(table).select(columns);
  if (filterJson) {
    try {
      const filter = JSON.parse(filterJson);
      for (const [k, v] of Object.entries(filter)) query = query.eq(k, v);
    } catch (e) {
      console.warn("filter-json の解析に失敗しました。無視します。");
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error("エクスポート失敗:", error.message);
    process.exit(1);
  }

  ensureDir(outfile);
  const csv = toCsv(data || []);
  fs.writeFileSync(outfile, csv, "utf8");
  console.log(`CSV 出力: ${outfile} (${data?.length ?? 0} rows)`);
}

main();


