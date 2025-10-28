// UI共通ラベル/色マッピング

import type { TaskStatus, TaskPriority } from "@/types/task";
import type { AlertRuleType } from "@/types/notification";

export const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: '未開始',
  IN_PROGRESS: '進行中',
  BLOCKED: 'ブロック',
  DONE: '完了',
  CANCELLED: 'キャンセル',
  DELAYED: '遅延',
  HOLD: '保留',
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

// タスクステータスのオプション配列
export const TASK_STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: "NOT_STARTED", label: "未着手" },
  { value: "IN_PROGRESS", label: "進行中" },
  { value: "BLOCKED", label: "ブロック中" },
  { value: "DONE", label: "完了" },
  { value: "CANCELLED", label: "キャンセル" },
];

// タスク優先度のオプション配列
export const TASK_PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: "LOW", label: "低" },
  { value: "MEDIUM", label: "中" },
  { value: "HIGH", label: "高" },
  { value: "URGENT", label: "緊急" },
];

// アラートルールタイプのオプション配列
export const ALERT_RULE_TYPE_OPTIONS: Array<{ value: AlertRuleType; label: string; description: string }> = [
  { 
    value: "DUE_SOON", 
    label: "期限間近", 
    description: "タスクの期限が近づいたときに通知" 
  },
  { 
    value: "OVERDUE", 
    label: "期限超過", 
    description: "タスクの期限が過ぎたときに通知" 
  },
  { 
    value: "NO_PROGRESS", 
    label: "進捗なし", 
    description: "一定期間進捗がないタスクを通知" 
  },
  { 
    value: "CUSTOM", 
    label: "カスタム", 
    description: "自由にパラメータを設定" 
  }
];

// アラートルール用のステータスオプション（一部のみ）
export const ALERT_TARGET_STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: "NOT_STARTED", label: "未着手" },
  { value: "IN_PROGRESS", label: "進行中" },
  { value: "DONE", label: "完了" },
  { value: "DELAYED", label: "遅延" },
  { value: "HOLD", label: "保留" },
];

// メッセージ表示の期間設定（ミリ秒）
export const MESSAGE_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,  // デフォルト値
  LONG: 10000,
  PERMANENT: 0,  // 自動非表示なし
} as const;

// キャッシュTTL（Time To Live）設定
export const CACHE_TTL = {
  SHORT: 60000,      // 1分
  MEDIUM: 300000,    // 5分
  LONG: 3600000,     // 1時間
  VERY_LONG: 86400000, // 24時間
} as const;

// Z-Index値（レイヤー順序）
export const Z_INDEX = {
  MODAL: 10000,
  TOAST: 9999,
  DROPDOWN: 1000,
  OVERLAY: 999,
  HEADER: 100,
} as const;

// フィルターのデフォルト値
export const FILTER_ALL = "all" as const;

// ユーザーステータスフィルターオプション
export const USER_STATUS_FILTERS = [
  { value: "all", label: "すべて" },
  { value: "active", label: "アクティブ" },
  { value: "inactive", label: "非アクティブ" },
] as const;

// 通知ステータスフィルターオプション
export const NOTIFICATION_STATUS_FILTERS = [
  { value: "all", label: "すべて" },
  { value: "QUEUED", label: "待機中" },
  { value: "SENT", label: "送信済み" },
  { value: "FAILED", label: "失敗" },
  { value: "CANCELLED", label: "キャンセル" },
] as const;

// チームメンバーロールフィルターオプション
export const TEAM_ROLE_FILTERS = [
  { value: "all", label: "すべて" },
  { value: "OWNER", label: "オーナー" },
  { value: "CONTRIBUTOR", label: "コントリビューター" },
  { value: "REVIEWER", label: "レビュアー" },
] as const;

// プロジェクトステータスフィルターオプション
export const PROJECT_STATUS_FILTERS = [
  { value: "all", label: "すべて" },
  { value: "active", label: "アクティブ" },
  { value: "archived", label: "アーカイブ済み" },
] as const;

