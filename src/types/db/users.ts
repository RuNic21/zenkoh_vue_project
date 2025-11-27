// 自動生成: information_schema.columns のCSVから生成（編集しないこと）
// 注意: role カラムは 2025-01-XX_add_role_to_users.sql マイグレーションで追加
export interface Users {
  id: number;
  auth_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  skills?: Record<string, unknown> | null;
  tags?: Record<string, unknown> | null;
  last_login_at?: string | null;
  login_count: number;
  position?: string | null;
  display_name: string;
  password_hash: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  department?: string | null;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  timezone?: string | null;
  language?: string | null;
  work_hours_start?: string | null;
  work_hours_end?: string | null;
  role?: "admin" | "manager" | "member" | "viewer" | null; // マイグレーション後に追加
}

export interface UsersInsert {
  id?: number;
  auth_id?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  skills?: Record<string, unknown> | null;
  tags?: Record<string, unknown> | null;
  last_login_at?: string | null;
  login_count?: number;
  position?: string | null;
  display_name: string;
  password_hash: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  department?: string | null;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  timezone?: string | null;
  language?: string | null;
  work_hours_start?: string | null;
  work_hours_end?: string | null;
  role?: "admin" | "manager" | "member" | "viewer" | null; // マイグレーション後に追加
}

export interface UsersUpdate {
  id?: number;
  auth_id?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  skills?: Record<string, unknown> | null;
  tags?: Record<string, unknown> | null;
  last_login_at?: string | null;
  login_count?: number;
  position?: string | null;
  display_name?: string;
  password_hash?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  department?: string | null;
  email?: string;
  avatar_url?: string | null;
  bio?: string | null;
  timezone?: string | null;
  language?: string | null;
  work_hours_start?: string | null;
  work_hours_end?: string | null;
  role?: "admin" | "manager" | "member" | "viewer" | null; // マイグレーション後に追加
}