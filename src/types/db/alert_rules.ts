// 自動生成: information_schema.columns のCSVから生成（編集しないこと）
export interface AlertRules {
  created_by?: number | null;
  id: number;
  project_id: number;
  params_json?: Record<string, unknown> | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: number | null;
  notify_email?: string | null;
  rule_type: string;
  name: string;
}

export interface AlertRulesInsert {
  created_by?: number | null;
  id?: number;
  project_id: number;
  params_json?: Record<string, unknown> | null;
  is_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  updated_by?: number | null;
  notify_email?: string | null;
  rule_type: string;
  name: string;
}

export interface AlertRulesUpdate {
  created_by?: number | null;
  id?: number;
  project_id?: number;
  params_json?: Record<string, unknown> | null;
  is_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  updated_by?: number | null;
  notify_email?: string | null;
  rule_type?: string;
  name?: string;
}