// タスク型定義（Supabase tasks テーブルに対応）
// 日時は ISO 文字列（timestamptz）として扱います

// タスクステータスの型定義
export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED" | "DELAYED" | "HOLD";

// タスク優先度の型定義
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  // タスクID
  id: number;

  // プロジェクトID（必須）
  project_id: number;

  // 親タスクID（任意）
  parent_task_id?: number | null;

  // WBSコード（任意）
  wbs_code?: string | null;

  // タスク名（必須）
  task_name: string;

  // タスク内容（任意）
  description?: string | null;

  // 主担当ユーザーID（任意）
  primary_assignee_id?: number | null;

  // ステータス（必須）
  status: TaskStatus;

  // 優先度（必須）
  priority: TaskPriority;

  // 計画開始/終了（任意）
  planned_start?: string | null; // ISO
  planned_end?: string | null;   // ISO

  // 実績開始/終了（任意）
  actual_start?: string | null;  // ISO
  actual_end?: string | null;    // ISO

  // 進捗率（0-100, 必須）
  progress_percent: number; // 0-100の範囲

  // カンバン列ID（任意）
  current_column_id?: number | null;

  // 表示順（任意）
  sort_order?: number | null;

  // アーカイブ（必須）
  is_archived: boolean;

  // タグ（任意）
  tags?: string[] | null;

  // 監査情報
  created_by?: number | null;
  updated_by?: number | null;
  created_at: string; // ISO
  updated_at: string; // ISO
}

// 新規作成に使用する型
export interface TaskInsert {
  project_id: number;
  parent_task_id?: number | null;
  wbs_code?: string | null;
  task_name: string;
  description?: string | null;
  primary_assignee_id?: number | null;
  // DB 側デフォルトに任せるため任意
  status?: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  progress_percent?: number; // 省略時は 0
  current_column_id?: number | null;
  sort_order?: number | null;
  is_archived?: boolean; // 省略時は false
  tags?: string[] | null;
  created_by?: number | null;
}

// 更新に使用する型（部分更新）
export interface TaskUpdate {
  project_id?: number;
  parent_task_id?: number | null;
  wbs_code?: string | null;
  task_name?: string;
  description?: string | null;
  primary_assignee_id?: number | null;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  progress_percent?: number;
  current_column_id?: number | null;
  sort_order?: number | null;
  is_archived?: boolean;
  tags?: string[] | null;
  updated_by?: number | null;
}

// プロジェクト情報をネストで含めるビュー型（JOIN 相当）
export interface TaskWithProject extends Task {
  // Supabase のリレーション選択により `project` としてネスト
  project?: { id: number; name: string } | null;
}


