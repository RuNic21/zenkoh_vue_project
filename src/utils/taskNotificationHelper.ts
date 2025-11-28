// タスク通知ヘルパー
// 目的: タスク作成・更新時に自動通知を統合的に処理

import { createTask, updateTask } from "@/services/taskService";
import { getProjectById } from "@/services/projectService";
import { triggerTaskAssignedNotification } from "@/utils/notificationTrigger";
import type { TaskInsert, TaskUpdate } from "@/types/task";
import type { ServiceResult } from "@/utils/errorHandler";
import type { Task } from "@/types/task";

/**
 * タスクを作成し、割り当て通知を送信
 * @param payload タスク作成データ
 * @param assigneeName 割り当て先ユーザー名（通知用）
 * @param assigneeEmail 割り当て先メールアドレス（通知用）
 * @returns 作成されたタスク
 */
export async function createTaskWithNotification(
  payload: TaskInsert,
  assigneeName?: string,
  assigneeEmail?: string
): Promise<ServiceResult<Task | null>> {
  // タスク作成
  const result = await createTask(payload);
  
  if (result.success && result.data) {
    const task = result.data;
    
    // 割り当て先が指定されている場合は通知を送信
    if (assigneeName && assigneeEmail && task.project_id) {
      try {
        // プロジェクト名を取得
        const projectResult = await getProjectById(task.project_id);
        const projectName = projectResult.success && projectResult.data 
          ? projectResult.data.name 
          : "不明なプロジェクト";
        
        // 通知送信
        await triggerTaskAssignedNotification(
          task,
          assigneeName,
          assigneeEmail,
          projectName
        );
      } catch (error) {
        console.error("タスク割り当て通知の送信に失敗:", error);
        // 通知失敗してもタスク作成は成功として扱う
      }
    }
  }
  
  return result;
}

/**
 * タスクを更新し、必要に応じて通知を送信
 * @param taskId タスクID
 * @param payload タスク更新データ
 * @param previousAssignee 以前の割り当て先ID
 * @param newAssigneeName 新しい割り当て先ユーザー名（通知用）
 * @param newAssigneeEmail 新しい割り当て先メールアドレス（通知用）
 * @returns 更新されたタスク
 */
export async function updateTaskWithNotification(
  taskId: number,
  payload: TaskUpdate,
  previousAssignee?: number | null,
  newAssigneeName?: string,
  newAssigneeEmail?: string
): Promise<ServiceResult<Task | null>> {
  // タスク更新
  const result = await updateTask(taskId, payload);
  
  if (result.success && result.data) {
    const task = result.data;
    
    // 割り当て先が変更された場合は通知を送信
    if (
      payload.primary_assignee_id !== undefined && 
      payload.primary_assignee_id !== previousAssignee &&
      newAssigneeName && 
      newAssigneeEmail && 
      task.project_id
    ) {
      try {
        // プロジェクト名を取得
        const projectResult = await getProjectById(task.project_id);
        const projectName = projectResult.success && projectResult.data 
          ? projectResult.data.name 
          : "不明なプロジェクト";
        
        // 通知送信
        await triggerTaskAssignedNotification(
          task,
          newAssigneeName,
          newAssigneeEmail,
          projectName
        );
      } catch (error) {
        console.error("タスク割り当て通知の送信に失敗:", error);
        // 通知失敗してもタスク更新は成功として扱う
      }
    }
  }
  
  return result;
}

/**
 * タスクのステータスを完了に更新し、必要に応じて通知を送信
 * @param taskId タスクID
 * @returns 更新されたタスク
 */
export async function completeTaskWithNotification(
  taskId: number
): Promise<ServiceResult<Task | null>> {
  return updateTask(taskId, {
    status: "DONE",
    progress_percent: 100,
    actual_end: new Date().toISOString()
  });
}

