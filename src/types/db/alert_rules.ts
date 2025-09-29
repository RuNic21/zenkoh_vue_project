// 自動生成: information_schema.columns のCSVから生成（編集しないこと）
export interface AlertRules {
  id: number;
  project_id: number;
  params_json?: Record<string, unknown> | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  rule_type: string;
  notify_email?: string | null;
  name: string;
}

export interface AlertRulesInsert {
  id?: number;
  project_id: number;
  params_json?: Record<string, unknown> | null;
  is_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  rule_type: string;
  notify_email?: string | null;
  name: string;
}

export interface AlertRulesUpdate {
  id?: number;
  project_id?: number;
  params_json?: Record<string, unknown> | null;
  is_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  rule_type?: string;
  notify_email?: string | null;
  name?: string;
}