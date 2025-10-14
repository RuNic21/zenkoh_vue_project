// スケジュール型定義（Task ベースの UI 表示用）
// 目的: DB の Task 型を UI で表示するための変換型として使用
// 実際のデータは Task 型で管理し、UI 表示時に ScheduleItem に変換

// データベーススキーマのstatus値に合わせて定義
export type ScheduleStatus = "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED";
// データベーススキーマのpriority値に合わせて定義  
export type SchedulePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ScheduleAttachment {
  name: string;
  size: string; // 例: "2.3MB"
  type: string; // 例: "pdf"
}

export interface ScheduleComment {
  id: number;
  author: string;
  content: string;
  timestamp: string; // ISO または ローカライズ文字列
  avatar?: string;
}

// UI 表示用のスケジュール項目（Task から変換される）
// 実際のデータソースは Task 型（src/types/task.ts）
export interface ScheduleItem {
  id: number;
  title: string;        // task_name から変換
  description: string;  // description から変換
  startDate: string;    // planned_start から変換 (YYYY-MM-DD)
  endDate: string;      // planned_end から変換 (YYYY-MM-DD)
  status: ScheduleStatus;     // status から変換
  priority: SchedulePriority; // priority から変換
  assignee: string;     // primary_assignee_id から display_name に変換
  progress: number;     // progress_percent から変換 (0-100)
  category?: string;    // project.name から変換
  tags?: string[];      // 将来の拡張用
  notes?: string;       // 将来の拡張用
  attachments?: ScheduleAttachment[]; // 将来の拡張用
  comments?: ScheduleComment[];       // 将来の拡張用
}

// 新規作成時のスケジュール項目（ID なし）
export type ScheduleItemCreate = Omit<ScheduleItem, "id">;

// 更新時のスケジュール項目（部分更新可能）
export type ScheduleItemUpdate = Partial<ScheduleItemCreate> & { id: number };


