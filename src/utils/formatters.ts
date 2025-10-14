// 共通フォーマッター

export function formatDateJP(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ja-JP");
}

export function formatPercent(val: number | null | undefined): string {
  if (val == null) return "0%";
  return `${val}%`;
}

export function truncate(text: string, max = 50): string {
  if (!text) return "";
  return text.length > max ? text.substring(0, max) + "..." : text;
}


