// 自動生成: information_schema.columns のCSVから生成（編集しないこと）
export interface Tasks {
  sort_order?: number | null;
  is_archived: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  created_at: string;
  updated_at: string;
  id: number;
  project_id: number;
  parent_task_id?: number | null;
  primary_assignee_id?: number | null;
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  progress_percent: number;
  current_column_id?: number | null;
  priority: string;
  wbs_code?: string | null;
  task_name: string;
  description?: string | null;
  status: string;
}

export interface TasksInsert {
  sort_order?: number | null;
  is_archived?: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
  id?: number;
  project_id: number;
  parent_task_id?: number | null;
  primary_assignee_id?: number | null;
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  progress_percent?: number;
  current_column_id?: number | null;
  priority?: string;
  wbs_code?: string | null;
  task_name: string;
  description?: string | null;
  status?: string;
}

export interface TasksUpdate {
  sort_order?: number | null;
  is_archived?: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
  id?: number;
  project_id?: number;
  parent_task_id?: number | null;
  primary_assignee_id?: number | null;
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  progress_percent?: number;
  current_column_id?: number | null;
  priority?: string;
  wbs_code?: string | null;
  task_name?: string;
  description?: string | null;
  status?: string;
}