// 自動生成: information_schema.columns のCSVから生成（編集しないこと）
export interface Notifications {
  id: number;
  project_id: number;
  task_id?: number | null;
  alert_rule_id?: number | null;
  send_after: string;
  sent_at?: string | null;
  created_at: string;
  template_id?: number | null;
  metadata_json?: Record<string, unknown> | null;
  retry_count: number;
  created_by?: number | null;
  updated_by?: number | null;
  status: string;
  last_error?: string | null;
  to_email: string;
  subject: string;
  body_text: string;
}

export interface NotificationsInsert {
  id?: number;
  project_id: number;
  task_id?: number | null;
  alert_rule_id?: number | null;
  send_after?: string;
  sent_at?: string | null;
  created_at?: string;
  template_id?: number | null;
  metadata_json?: Record<string, unknown> | null;
  retry_count?: number;
  created_by?: number | null;
  updated_by?: number | null;
  status?: string;
  last_error?: string | null;
  to_email: string;
  subject: string;
  body_text: string;
}

export interface NotificationsUpdate {
  id?: number;
  project_id?: number;
  task_id?: number | null;
  alert_rule_id?: number | null;
  send_after?: string;
  sent_at?: string | null;
  created_at?: string;
  template_id?: number | null;
  metadata_json?: Record<string, unknown> | null;
  retry_count?: number;
  created_by?: number | null;
  updated_by?: number | null;
  status?: string;
  last_error?: string | null;
  to_email?: string;
  subject?: string;
  body_text?: string;
}