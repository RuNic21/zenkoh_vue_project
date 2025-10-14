// UI ヘルパー関数群
// 目的: ステータス/進捗率に応じたクラス名を一元管理して重複を排除

// ステータスに応じたバッジクラスを返す
export const getStatusBadgeClass = (status: string): string => {
  if (!status) return "badge bg-secondary";
  if (status === "DONE") return "badge bg-gradient-success";
  if (status === "IN_PROGRESS") return "badge bg-gradient-info";
  if (status === "BLOCKED") return "badge bg-gradient-danger";
  if (status === "CANCELLED") return "badge bg-gradient-warning";
  if (status === "NOT_STARTED") return "badge bg-gradient-secondary";
  return "badge bg-secondary";
};

// 進捗率に応じたプログレスバー色を返す
export const getProgressBarClass = (progress: number): string => {
  const safe = Number.isFinite(progress) ? progress : 0;
  if (safe >= 100) return "progress-bar bg-gradient-success";
  if (safe >= 70) return "progress-bar bg-gradient-info";
  if (safe >= 40) return "progress-bar bg-gradient-warning";
  return "progress-bar bg-gradient-danger";
};

// 優先度に応じたテキスト色を返す
export const getPriorityColorClass = (priority: string): string => {
  if (!priority) return "text-secondary";
  if (priority === "URGENT") return "text-danger";
  if (priority === "HIGH") return "text-danger";
  if (priority === "MEDIUM") return "text-warning";
  if (priority === "LOW") return "text-success";
  return "text-secondary";
};


