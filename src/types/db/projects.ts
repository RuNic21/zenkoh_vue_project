// 自動生成: information_schema.columns のCSVから生成（編集しないこと）
export interface Projects {
  id: number;
  start_date?: string | null;
  end_date?: string | null;
  owner_user_id?: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string | null;
}

export interface ProjectsInsert {
  id?: number;
  start_date?: string | null;
  end_date?: string | null;
  owner_user_id?: number | null;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
  name: string;
  description?: string | null;
}

export interface ProjectsUpdate {
  id?: number;
  start_date?: string | null;
  end_date?: string | null;
  owner_user_id?: number | null;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
  name?: string;
  description?: string | null;
}