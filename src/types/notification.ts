// 通知管理用の型定義
// 目的: notifications テーブルと alert_rules テーブルの型を定義

// 通知基本情報
export interface Notification {
  id: number;
  project_id: number;
  task_id?: number;
  alert_rule_id?: number;
  to_email: string;
  subject: string;
  body_text: string;
  send_after: string;
  sent_at?: string;
  status: NotificationStatus;
  last_error?: string;
  created_at: string;
}

// 通知作成用
export interface NotificationInsert {
  project_id: number;
  task_id?: number;
  alert_rule_id?: number;
  to_email: string;
  subject: string;
  body_text: string;
  send_after?: string;
  status?: NotificationStatus;
}

// 通知更新用
export interface NotificationUpdate {
  status?: NotificationStatus;
  sent_at?: string;
  last_error?: string;
  to_email?: string;
  subject?: string;
  body_text?: string;
}

// 通知状態
export type NotificationStatus = "QUEUED" | "SENT" | "FAILED" | "CANCELLED";

// アラートルール基本情報
export interface AlertRule {
  id: number;
  project_id: number;
  name: string;
  rule_type: AlertRuleType;
  params_json?: Record<string, any>;
  is_enabled: boolean;
  notify_email?: string;
  created_at: string;
  updated_at: string;
}

// アラートルール作成用
export interface AlertRuleInsert {
  project_id: number;
  name: string;
  rule_type: AlertRuleType;
  params_json?: Record<string, any>;
  is_enabled?: boolean;
  notify_email?: string;
}

// アラートルール更新用
export interface AlertRuleUpdate {
  name?: string;
  rule_type?: AlertRuleType;
  params_json?: Record<string, any>;
  is_enabled?: boolean;
  notify_email?: string;
}

// アラートルールタイプ
export type AlertRuleType = "DUE_SOON" | "OVERDUE" | "NO_PROGRESS" | "CUSTOM";

// 通知統計情報
export interface NotificationStats {
  total_notifications: number;
  queued_notifications: number;
  sent_notifications: number;
  failed_notifications: number;
  cancelled_notifications: number;
  success_rate: number;
}

// 通知フィルター
export interface NotificationFilter {
  status?: NotificationStatus;
  project_id?: number;
  task_id?: number;
  date_from?: string;
  date_to?: string;
  email?: string;
}

// 通知テンプレート
export interface NotificationTemplate {
  id: string;
  name: string;
  subject_template: string;
  body_template: string;
  variables: string[];
}

// 通知状態の日本語表示用
export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
  QUEUED: "送信待ち",
  SENT: "送信済み",
  FAILED: "送信失敗",
  CANCELLED: "キャンセル"
};

// 通知状態の色定義
export const NOTIFICATION_STATUS_COLORS: Record<NotificationStatus, string> = {
  QUEUED: "bg-gradient-warning",
  SENT: "bg-gradient-success",
  FAILED: "bg-gradient-danger",
  CANCELLED: "bg-gradient-secondary"
};

// アラートルールタイプの日本語表示用
export const ALERT_RULE_TYPE_LABELS: Record<AlertRuleType, string> = {
  DUE_SOON: "期限間近",
  OVERDUE: "期限超過",
  NO_PROGRESS: "進捗なし",
  CUSTOM: "カスタム"
};

// アラートルールタイプの色定義
export const ALERT_RULE_TYPE_COLORS: Record<AlertRuleType, string> = {
  DUE_SOON: "bg-gradient-warning",
  OVERDUE: "bg-gradient-danger",
  NO_PROGRESS: "bg-gradient-info",
  CUSTOM: "bg-gradient-primary"
};
