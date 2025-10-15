// UI共通ラベル/色マッピング

export const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: '未開始',
  IN_PROGRESS: '進行中',
  BLOCKED: 'ブロック',
  DONE: '完了',
  CANCELLED: 'キャンセル',
  active: 'アクティブ',
  inactive: '非アクティブ'
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '緊急'
};

export const BADGE_COLORS: Record<string, string> = {
  完了: 'success',
  進行中: 'primary',
  ブロック: 'warning',
  未開始: 'secondary',
  期限切れ: 'danger',
  アクティブ: 'success',
  非アクティブ: 'secondary'
};


