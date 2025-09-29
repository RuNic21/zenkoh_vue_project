import fs from "fs";
import path from "path";

// 簡易CSVパーサ（ダブルクォート対応）
function parseCsv(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => (row[h] = cols[i] ?? ""));
    return row;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

const TYPE_MAP = {
  smallint: "number",
  integer: "number",
  bigint: "number",
  int2: "number",
  int4: "number",
  int8: "number",
  numeric: "number",
  decimal: "number",
  real: "number",
  "double precision": "number",
  text: "string",
  "character varying": "string",
  varchar: "string",
  character: "string",
  char: "string",
  boolean: "boolean",
  bool: "boolean",
  date: "string",
  "timestamp with time zone": "string",
  "timestamp without time zone": "string",
  timestamptz: "string",
  uuid: "string",
  json: "Record<string, unknown>",
  jsonb: "Record<string, unknown>",
  bytea: "string",
  oid: "number",
  ARRAY: "unknown[]",
};

function tsTypeOf(dataType, udtName) {
  const key = (dataType || udtName || "").toLowerCase();
  return TYPE_MAP[key] || "unknown";
}

function toPascal(name) {
  return name
    .split(/[_-]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function buildInterfaces(table, rows) {
  const iface = [];
  const pas = toPascal(table);
  iface.push("// 自動生成: information_schema.columns のCSVから生成（編集しないこと）");
  iface.push(`export interface ${pas} {`);
  for (const r of rows) {
    const t = tsTypeOf(r.data_type, r.udt_name);
    const isNullable = (r.is_nullable || "").toUpperCase() === "YES";
    const opt = isNullable ? "?" : "";
    const vt = isNullable ? `${t} | null` : t;
    iface.push(`  ${r.column_name}${opt}: ${vt};`);
  }
  iface.push("}");

  const ins = [];
  ins.push(`export interface ${pas}Insert {`);
  for (const r of rows) {
    const t = tsTypeOf(r.data_type, r.udt_name);
    const isNullable = (r.is_nullable || "").toUpperCase() === "YES";
    const hasDefault = r.column_default && r.column_default.toLowerCase() !== "null";
    const isIdentity = (r.is_identity || "").toUpperCase() === "YES" || /nextval\(/i.test(r.column_default || "");
    const optional = isNullable || hasDefault || isIdentity;
    const opt = optional ? "?" : "";
    const vt = isNullable ? `${t} | null` : t;
    ins.push(`  ${r.column_name}${opt}: ${vt};`);
  }
  ins.push("}");

  const upd = [];
  upd.push(`export interface ${pas}Update {`);
  for (const r of rows) {
    const t = tsTypeOf(r.data_type, r.udt_name);
    const isNullable = (r.is_nullable || "").toUpperCase() === "YES";
    const vt = isNullable ? `${t} | null` : t;
    upd.push(`  ${r.column_name}?: ${vt};`);
  }
  upd.push("}");

  return [iface.join("\n"), ins.join("\n"), upd.join("\n")].join("\n\n");
}

function main() {
  const [,, csvPath, schema = "public", outDirArg] = process.argv;
  if (!csvPath) {
    console.log("Usage: node scripts/columns-csv-to-types.mjs <columns.csv> [schema=public] [outDir=src/types/db]");
    process.exit(1);
  }
  const text = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(text);
  const outDir = path.resolve(outDirArg || "src/types/db");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const filtered = rows.filter((r) => (r.table_schema || "").toLowerCase() === schema.toLowerCase());
  if (filtered.length === 0) {
    console.warn(`スキーマ '${schema}' に該当する行がありません。CSVを確認してください。`);
  }
  const grouped = new Map();
  for (const r of filtered) {
    const key = r.table_name;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(r);
  }
  for (const [table, cols] of grouped.entries()) {
    const content = buildInterfaces(table, cols);
    fs.writeFileSync(path.join(outDir, `${table}.ts`), content, "utf8");
    console.log(`generated: ${schema}.${table}`);
  }
  console.log(`出力先: ${outDir}`);
}

main();


