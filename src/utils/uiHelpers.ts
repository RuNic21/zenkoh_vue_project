// UI ヘルパー関数群
// 目的: ステータス/進捗率に応じたクラス名を一元管理して重複を排除

// ステータスに応じたバッジクラスを返す
export const getStatusBadgeClass = (status: string): string => {
  if (!status) return "badge bg-secondary";
  if (status === "完了") return "badge bg-gradient-success";
  if (status === "進行中") return "badge bg-gradient-info";
  if (status === "遅延") return "badge bg-gradient-danger";
  if (status === "保留") return "badge bg-gradient-warning";
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


