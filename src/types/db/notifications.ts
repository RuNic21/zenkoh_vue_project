// 自動生成: information_schema.columns のCSVから生成（編集しないこと）
export interface Notifications {
  created_at: string;
  id: number;
  project_id: number;
  task_id?: number | null;
  alert_rule_id?: number | null;
  send_after: string;
  sent_at?: string | null;
  body_text: string;
  status: string;
  last_error?: string | null;
  to_email: string;
  subject: string;
}

export interface NotificationsInsert {
  created_at?: string;
  id?: number;
  project_id: number;
  task_id?: number | null;
  alert_rule_id?: number | null;
  send_after?: string;
  sent_at?: string | null;
  body_text: string;
  status?: string;
  last_error?: string | null;
  to_email: string;
  subject: string;
}

export interface NotificationsUpdate {
  created_at?: string;
  id?: number;
  project_id?: number;
  task_id?: number | null;
  alert_rule_id?: number | null;
  send_after?: string;
  sent_at?: string | null;
  body_text?: string;
  status?: string;
  last_error?: string | null;
  to_email?: string;
  subject?: string;
}