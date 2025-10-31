// 自動生成: information_schema.columns のCSVから生成（編集しないこと）
export interface TaskMembers {
  task_id: number;
  user_id: number;
  joined_at: string;
  created_by?: number | null;
  updated_by?: number | null;
  role: string;
}

export interface TaskMembersInsert {
  task_id: number;
  user_id: number;
  joined_at?: string;
  created_by?: number | null;
  updated_by?: number | null;
  role?: string;
}

export interface TaskMembersUpdate {
  task_id?: number;
  user_id?: number;
  joined_at?: string;
  created_by?: number | null;
  updated_by?: number | null;
  role?: string;
}