// 自動生成: information_schema.columns のCSVから生成（編集しないこと）
export interface ProjectMembers {
  project_id: number;
  user_id: number;
  joined_at: string;
  role: string;
}

export interface ProjectMembersInsert {
  project_id: number;
  user_id: number;
  joined_at?: string;
  role: string;
}

export interface ProjectMembersUpdate {
  project_id?: number;
  user_id?: number;
  joined_at?: string;
  role?: string;
}