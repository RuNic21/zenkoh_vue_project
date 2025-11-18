// タスク状態変更履歴の型定義（public.task_status_history テーブルに対応）
// 目的: DB行の型安全な表現と、アプリ側で扱う補助型を提供する
// 日時は ISO 文字列（timestamptz）として扱います

// 履歴で使用するコアステータス（DB制約に一致）
// 注意: tasks の UI などで補助的に使う DELAYED/HOLD は含めない
export type TaskCoreStatus = "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED";

/**
 * DB 行そのものの型（public.task_status_history）
 * - カラム名は DB に合わせて snake_case を採用
 * - 画面表示やAPI I/Oではこのまま利用可能
 */
export interface TaskStatusHistory {
  // 履歴ID（自動採番）
  id: number;
  // 対象タスクID（tasks.id への外部キー）
  task_id: number;
  // 対象プロジェクトID（履歴時点のスナップショット。projects.id への外部キー）
  project_id: number;
  // 変更前ステータス
  from_status: TaskCoreStatus;
  // 変更後ステータス
  to_status: TaskCoreStatus;
  // 変更実行ユーザーID（users.id への外部キー）
  changed_by_user_id?: number | null;
  // 変更実行ユーザーの表示名（冗長化して高速表示に使用）
  changed_by_display_name?: string | null;
  // 状態変更の理由や補足メモ
  reason?: string | null;
  // 変更が行われた日時（作成時刻, ISO 文字列）
  changed_at: string;
}

/**
 * INSERT 用の型
 * - DB 側で DEFAULT now() を持つため changed_at は任意
 */
export interface TaskStatusHistoryInsert {
  task_id: number;
  project_id: number;
  from_status: TaskCoreStatus;
  to_status: TaskCoreStatus;
  changed_by_user_id?: number | null;
  changed_by_display_name?: string | null;
  reason?: string | null;
  changed_at?: string; // 省略時は DB が now() を設定
}

/**
 * 画面表示用（`ScheduleDetail.vue` のタイムライン表示に合わせたキー名）
 * - DB 行からのマッピングに使用
 */
export interface TaskStatusHistoryViewItem {
  // 変更前ステータス
  from: TaskCoreStatus;
  // 変更後ステータス
  to: TaskCoreStatus;
  // 変更実行者の表示名
  user: string;
  // 表示用の日時文字列（例: toLocaleString('ja-JP') 済み）
  timestamp: string;
  // 理由やメモ
  reason?: string;
}


