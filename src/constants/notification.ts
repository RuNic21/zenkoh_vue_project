// 通知関連の定数定義
// 目的: 通知システム全体で使用する定数を一元管理

// 通知の自動チェック間隔（ミリ秒）
export const NOTIFICATION_CHECK_INTERVAL = 30000; // 30秒

// 通知の最大表示件数
export const MAX_RECENT_NOTIFICATIONS = 5;

// 通知の自動削除期間（日数）
export const NOTIFICATION_RETENTION_DAYS = 30;

// 通知音の有効/無効
export const NOTIFICATION_SOUND_ENABLED = false;

// 通知の優先度
export const NOTIFICATION_PRIORITY = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent"
} as const;

// 通知アイコン定義
export const NOTIFICATION_ICONS: Record<string, string> = {
  TASK_ASSIGNED: "fa-tasks",
  TASK_DUE_SOON: "fa-clock",
  TASK_OVERDUE: "fa-exclamation-triangle",
  PROJECT_UPDATED: "fa-project-diagram",
  TEAM_MEMBER_ADDED: "fa-user-plus",
  COMMENT_ADDED: "fa-comment",
  DEFAULT: "fa-bell"
};

// 通知タイプ別の色定義
export const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  TASK_ASSIGNED: "info",
  TASK_DUE_SOON: "warning",
  TASK_OVERDUE: "danger",
  PROJECT_UPDATED: "primary",
  TEAM_MEMBER_ADDED: "success",
  COMMENT_ADDED: "secondary",
  DEFAULT: "info"
};

// アラートルールのデフォルト設定
export const DEFAULT_ALERT_RULE_PARAMS = {
  DUE_SOON: {
    days_before: 3,
    target_status: "IN_PROGRESS"
  },
  OVERDUE: {
    days_overdue: 1,
    target_status: "IN_PROGRESS"
  },
  NO_PROGRESS: {
    days_no_progress: 7,
    min_progress_percent: 0
  }
} as const;

// 通知バッジの最大表示数
export const MAX_NOTIFICATION_BADGE_COUNT = 99;

