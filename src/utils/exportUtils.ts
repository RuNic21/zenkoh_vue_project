// CSV/ダウンロードユーティリティ
// 目的: CSV生成とファイルダウンロード処理を共通化

export function toCsv(rows: Array<Array<string | number>>): string {
  return rows.map((cols) => cols.map((c) => escapeCsv(String(c))).join(",")).join("\n");
}

export function downloadFile(content: string, filename: string, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mime });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}


