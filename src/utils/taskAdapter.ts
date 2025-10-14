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
//    - Task.tags (TEXT[]) ↔ ScheduleItem.tags 変換ロジック実装が必要
//    - タグ配列処理ロジック実装が必要
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
  if (status === "NOT_STARTED" || status === "TODO") return "予定";
  if (status === "IN_PROGRESS" || status === "DOING") return "進行中";
  if (status === "DONE" || status === "COMPLETED") return "完了";
  if (status === "DELAYED" || status === "HOLD") return "遅延";
  return "進行中"; // デフォルト値
}

// 日本語UIステータスをDBのステータス値に変換
export function mapStatusToDb(jaStatus: ScheduleStatus): string {
  switch (jaStatus) {
    case "予定": return "NOT_STARTED";
    case "進行中": return "IN_PROGRESS";
    case "完了": return "DONE";
    case "遅延": return "DELAYED";
    case "保留": return "HOLD";
    default: return "IN_PROGRESS";
  }
}

// DBの優先度を日本語UI優先度に変換
export function mapPriorityToJa(dbPriority: string | null | undefined): SchedulePriority {
  const priority = (dbPriority || "").toUpperCase();
  if (priority === "HIGH") return "高";
  if (priority === "LOW") return "低";
  return "中"; // デフォルト値
}

// 日本語UI優先度をDBの優先度に変換
export function mapPriorityToDb(jaPriority: SchedulePriority): string {
  switch (jaPriority) {
    case "高": return "HIGH";
    case "中": return "MEDIUM";
    case "低": return "LOW";
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
  users: Users[] = []
): ScheduleItem {
  // プロジェクト情報の抽出（TaskWithProjectの場合）
  const projectName = "project" in task && task.project ? task.project.name : "";
  
  // 日付形式変換（ISO → YYYY-MM-DD）
  const formatDate = (isoDate: string | null | undefined): string => {
    return formatIsoToDate(isoDate);
  };

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
    tags: [], // デフォルト値
    notes: "", // デフォルト値
    attachments: [], // デフォルト値
    comments: [], // デフォルト値
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
    status: mapStatusToDb(item.status),
    priority: mapPriorityToDb(item.priority),
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
    status: mapStatusToDb(item.status),
    priority: mapPriorityToDb(item.priority),
    // primary_assignee_idはユーザー名からは設定不可（IDが必要）
  };
}

// 複数のTaskをScheduleItem配列に変換
export function tasksToScheduleItems(
  tasks: (Task | TaskWithProject)[], 
  users: Users[] = []
): ScheduleItem[] {
  return tasks.map(task => taskToScheduleItem(task, users));
}

// ユーザー名からユーザーIDを検索（逆変換用）
export function findUserIdByName(userName: string, users: Users[]): number | null {
  const user = users.find(u => u.display_name === userName);
  return user?.id || null;
}
