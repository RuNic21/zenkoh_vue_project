// コメント機能の型定義
// 目的:
// - DBテーブル `task_comments` の行データを型で表現
// - フロントでの登録/更新用の入力型を提供
// - ユーザー情報を結合したビュー（v_task_comments）取得結果の型を提供
// 注意:
// - DBカラム名に合わせて snake_case を採用
// - 日時は ISO 文字列として扱う（timestamptz）

/**
 * task_comments テーブルの1レコードを表す型
 */
export interface TaskComment {
  // コメントID（identity）
  id: number;
  // 紐づくタスクID（外部キー: tasks.id）
  task_id: number;
  // 紐づくプロジェクトID（外部キー: projects.id）。トリガーで tasks.project_id と同期
  project_id: number;
  // 作成ユーザーID（外部キー: users.id）
  author_user_id: number;
  // コメント本文（空文字禁止）
  content: string;
  // 論理削除フラグ
  is_deleted: boolean;
  // 作成日時（ISO 文字列）
  created_at: string;
  // 更新日時（ISO 文字列）
  updated_at: string;
}

/**
 * コメント新規作成時の入力型
 * - project_id はトリガーにより自動同期されるため省略推奨
 */
export interface TaskCommentInsert {
  task_id: number;
  author_user_id: number;
  content: string;
  // 省略時は false
  is_deleted?: boolean;
  // 指定することも可能だが、通常は未指定（DB トリガーで同期）
  project_id?: number;
}

/**
 * コメント更新時の入力型（部分更新）
 */
export interface TaskCommentUpdate {
  id: number;
  content?: string;
  is_deleted?: boolean;
}

/**
 * v_task_comments ビューの1レコードを表す型
 * - ユーザーの表示名/アバターURLを含む
 * - timestamp は created_at のエイリアスとしてビュー側で提供
 */
export interface TaskCommentWithAuthor {
  id: number;
  task_id: number;
  project_id: number;
  content: string;
  // 表示用タイムスタンプ（ISO 文字列）
  timestamp: string;
  // 投稿者表示名（users.display_name）
  author: string;
  // 投稿者アバターURL（users.avatar_url, 空文字を許容）
  avatar_url: string;
}

/**
 * UI 表示用コメント型（ScheduleComment）への変換の目安
 * - schedule.ts の ScheduleComment と相互変換で使用
 *
 * 例:
 * const toScheduleComment = (row: TaskCommentWithAuthor): ScheduleComment => ({
 *   id: row.id,
 *   author: row.author,
 *   content: row.content,
 *   timestamp: row.timestamp,
 *   avatar: row.avatar_url ? row.author.slice(0, 1).toUpperCase() : undefined,
 * });
 */
export type _DocNote_TaskCommentMapping = unknown;


