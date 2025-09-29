// 自動生成: information_schema.columns のCSVから生成（編集しないこと）
export interface Boards {
  id: number;
  project_id: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  name: string;
}

export interface BoardsInsert {
  id?: number;
  project_id: number;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  name: string;
}

export interface BoardsUpdate {
  id?: number;
  project_id?: number;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  name?: string;
}