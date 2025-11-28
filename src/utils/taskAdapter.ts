// Task ↔ ScheduleItem 変換アダプター
// 目的: DBのTask型とUIのScheduleItem型の相互変換を担当
// 新しく追加されたDB構造を既存UIと互換させるための接続

// TODO: DB連携されていない機能のアダプター実装が必要
// 1. コメントシステムアダプター
//    - Task.comments (JSONB) ↔ ScheduleItem.comments 変換ロジック実装が必要
//    - コメントデータシリアライズ/デシリアライズロジック実装が必要
//
// 2. 添付ファイルシステムアダプター
//    - Task.attachments (JSONB) ↔ ScheduleItem.attachments 変換ロジック実装が必要
//    - 添付ファイルメタデータシリアライズ/デシリアライズロジック実装が必要
//
// 3. タグシステムアダプター
//    - ✅ Task.tags (TEXT[]) ↔ ScheduleItem.tags 変換ロジック実装済み
//    - ✅ タグ配列処理ロジック実装済み
//
// 4. メモ/ノートシステムアダプター
//    - Task.notes (TEXT) ↔ ScheduleItem.notes 変換ロジック実装が必要
//    - メモデータ処理ロジック実装が必要
//
// 5. ユーザー情報アダプター改善
//    - primary_assignee_id ↔ assignee (ユーザー名) 双方向変換実装が必要
//    - ユーザーID ↔ ユーザー名マッピングキャッシュロジック実装が必要

import type { Task, TaskWithProject, TaskUpdate } from "../types/task";
import type { ScheduleItem, ScheduleStatus, SchedulePriority } from "../types/schedule";
import type { Users } from "../types/db/users";
import { formatIsoToDate, formatDateToIso } from "./dateUtils";

// DBのステータス値を日本語UIステータスに変換
export function mapStatusToJa(dbStatus: string | null | undefined): ScheduleStatus {
  const status = (dbStatus || "").toUpperCase();
  if (status === "NOT_STARTED") return "NOT_STARTED";
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "DONE") return "DONE";
  if (status === "BLOCKED") return "BLOCKED";
  if (status === "CANCELLED") return "CANCELLED";
  return "NOT_STARTED"; // デフォルト値
}

// 日本語UIステータスをDBのステータス値に変換
export function mapStatusToDb(jaStatus: ScheduleStatus): string {
  switch (jaStatus) {
    case "NOT_STARTED": return "NOT_STARTED";
    case "IN_PROGRESS": return "IN_PROGRESS";
    case "DONE": return "DONE";
    case "BLOCKED": return "BLOCKED";
    case "CANCELLED": return "CANCELLED";
    default: return "NOT_STARTED";
  }
}

// DBの優先度を日本語UI優先度に変換
export function mapPriorityToJa(dbPriority: string | null | undefined): SchedulePriority {
  const priority = (dbPriority || "").toUpperCase();
  if (priority === "HIGH") return "HIGH";
  if (priority === "MEDIUM") return "MEDIUM";
  if (priority === "LOW") return "LOW";
  if (priority === "URGENT") return "URGENT";
  return "MEDIUM"; // デフォルト値
}

// 日本語UI優先度をDBの優先度に変換
export function mapPriorityToDb(jaPriority: SchedulePriority): string {
  switch (jaPriority) {
    case "HIGH": return "HIGH";
    case "MEDIUM": return "MEDIUM";
    case "LOW": return "LOW";
    case "URGENT": return "URGENT";
    default: return "MEDIUM";
  }
}

// ユーザーIDを名前に変換するヘルパー
export function getUserDisplayName(userId: number | null | undefined, users: Users[] = []): string {
  if (!userId) return "";
  const user = users.find(u => u.id === userId);
  return user?.display_name || "";
}

// TaskをScheduleItemに変換
export function taskToScheduleItem(
  task: Task | TaskWithProject, 
  users: Users[] = [],
  allTasks: Task[] = [] // 親タスク名を取得するために全タスクリストを渡す
): ScheduleItem {
  // プロジェクト情報の抽出（TaskWithProjectの場合）
  const projectName = "project" in task && task.project ? task.project.name : "";
  
  // 日付形式変換（ISO → YYYY-MM-DD）
  const formatDate = (isoDate: string | null | undefined): string => {
    return formatIsoToDate(isoDate);
  };

  // 親タスク名を取得
  const parentTaskName = task.parent_task_id 
    ? allTasks.find(t => t.id === task.parent_task_id)?.task_name || ""
    : "";

  return {
    id: task.id,
    title: task.task_name || "(無題)",
    description: task.description || "",
    startDate: formatDate(task.planned_start),
    endDate: formatDate(task.planned_end),
    status: mapStatusToJa(task.status),
    priority: mapPriorityToJa(task.priority),
    assignee: getUserDisplayName(task.primary_assignee_id, users),
    progress: task.progress_percent || 0,
    category: projectName, // プロジェクト名をカテゴリとして使用
    tags: Array.isArray(task.tags) ? task.tags : [], // DBのtags配列をそのまま使用、なければ空配列
    notes: "", // デフォルト値
    attachments: [], // デフォルト値
    comments: [], // デフォルト値
    parentTaskId: task.parent_task_id || undefined, // 親タスクIDを保持
    parentTaskName: parentTaskName, // 親タスク名を保持
    updated_at: task.updated_at || task.created_at || new Date().toISOString(), // 更新日時を保持（ソート用）
  };
}

// ScheduleItemをTaskUpdateに変換（更新用）
export function scheduleItemToTaskUpdate(item: ScheduleItem): TaskUpdate {
  // 日付形式変換（YYYY-MM-DD → ISO）
  const formatToIso = (dateStr: string): string | null => {
    return formatDateToIso(dateStr);
  };

  return {
    task_name: item.title,
    description: item.description || null,
    planned_start: formatToIso(item.startDate),
    planned_end: formatToIso(item.endDate),
    progress_percent: item.progress,
    status: mapStatusToDb(item.status) as "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED",
    priority: mapPriorityToDb(item.priority) as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    tags: Array.isArray(item.tags) ? item.tags : null, // ScheduleItemのtagsをTaskUpdateに変換
    parent_task_id: item.parentTaskId || null, // 親タスクIDを更新
    // primary_assignee_idはユーザー名からは更新不可（IDが必要）
    // 必要な場合は別途ユーザー名→ID変換ロジックが必要
  };
}

// ScheduleItemをTaskInsertに変換（新規作成用）
export function scheduleItemToTaskInsert(
  item: Omit<ScheduleItem, "id">, 
  projectId: number
): import("../types/task").TaskInsert {
  const formatToIso = (dateStr: string): string | null => {
    return formatDateToIso(dateStr);
  };

  return {
    project_id: projectId,
    task_name: item.title,
    description: item.description || null,
    planned_start: formatToIso(item.startDate),
    planned_end: formatToIso(item.endDate),
    progress_percent: item.progress,
    status: mapStatusToDb(item.status) as "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED",
    priority: mapPriorityToDb(item.priority) as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    tags: Array.isArray(item.tags) ? item.tags : null, // ScheduleItemのtagsをTaskInsertに変換
    parent_task_id: item.parentTaskId || null, // 親タスクIDを設定
    // primary_assignee_idはユーザー名からは設定不可（IDが必要）
  };
}

// 複数のTaskをScheduleItem配列に変換
export function tasksToScheduleItems(
  tasks: (Task | TaskWithProject)[], 
  users: Users[] = [],
  allTasks: Task[] = [] // 親タスク名を取得するために全タスクリストを渡す（オプション）
): ScheduleItem[] {
  // allTasksが空の場合は、tasks自体を使用
  const taskListForParentLookup = allTasks.length > 0 ? allTasks : tasks as Task[];
  return tasks.map(task => taskToScheduleItem(task, users, taskListForParentLookup));
}

// ユーザー名からユーザーIDを検索（逆変換用）
export function findUserIdByName(userName: string, users: Users[]): number | null {
  const user = users.find(u => u.display_name === userName);
  return user?.id || null;
}
