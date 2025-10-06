// 自動生成: information_schema.columns のCSVから生成（編集しないこと）
export interface Users {
  id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email: string;
  display_name: string;
  password_hash: string;
}

export interface UsersInsert {
  id?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  email: string;
  display_name: string;
  password_hash: string;
}

export interface UsersUpdate {
  id?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  email?: string;
  display_name?: string;
  password_hash?: string;
}