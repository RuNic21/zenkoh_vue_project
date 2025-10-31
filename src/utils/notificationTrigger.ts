// 自動通知トリガーユーティリティ
// 目的: タスク・プロジェクトイベントに基づいて自動通知を送信

import { createNotificationFromTemplate } from "@/services/notificationService";
import type { Task } from "@/types/task";
import type { Project } from "@/types/project";

/**
 * タスク割り当て時の通知を送信
 * @param task タスク情報
 * @param assigneeName 割り当て先ユーザー名
 * @param assigneeEmail 割り当て先メールアドレス
 * @param projectName プロジェクト名
 */
export async function triggerTaskAssignedNotification(
  task: Task,
  assigneeName: string,
  assigneeEmail: string,
  projectName: string
): Promise<void> {
  try {
    if (!assigneeEmail || !task.project_id) {
      console.warn("タスク割り当て通知: 必要な情報が不足しています");
      return;
    }

    const variables = {
      user_name: assigneeName,
      task_name: task.task_name,
      project_name: projectName,
      due_date: task.planned_end ? new Date(task.planned_end).toLocaleDateString("ja-JP") : "未設定",
      priority: getPriorityLabel(task.priority)
    };

    const result = await createNotificationFromTemplate(
      "task_assigned",
      variables,
      assigneeEmail,
      task.project_id,
      task.id
    );

    if (result) {
      console.log("✅ タスク割り当て通知を作成しました:", task.task_name);
    } else {
      console.error("❌ タスク割り当て通知の作成に失敗しました");
    }
  } catch (error) {
    console.error("タスク割り当て通知の送信中にエラーが発生:", error);
  }
}

/**
 * タスク期限間近の通知を送信
 * @param task タスク情報
 * @param assigneeName 割り当て先ユーザー名
 * @param assigneeEmail 割り当て先メールアドレス
 * @param projectName プロジェクト名
 * @param daysRemaining 残り日数
 */
export async function triggerTaskDueSoonNotification(
  task: Task,
  assigneeName: string,
  assigneeEmail: string,
  projectName: string,
  daysRemaining: number
): Promise<void> {
  try {
    if (!assigneeEmail || !task.project_id) {
      console.warn("タスク期限間近通知: 必要な情報が不足しています");
      return;
    }

    const variables = {
      user_name: assigneeName,
      task_name: task.task_name,
      project_name: projectName,
      due_date: task.planned_end ? new Date(task.planned_end).toLocaleDateString("ja-JP") : "未設定",
      days_remaining: daysRemaining.toString(),
      progress: task.progress_percent.toString()
    };

    const result = await createNotificationFromTemplate(
      "task_due_soon",
      variables,
      assigneeEmail,
      task.project_id,
      task.id
    );

    if (result) {
      console.log("✅ タスク期限間近通知を作成しました:", task.task_name);
    } else {
      console.error("❌ タスク期限間近通知の作成に失敗しました");
    }
  } catch (error) {
    console.error("タスク期限間近通知の送信中にエラーが発生:", error);
  }
}

/**
 * タスク期限超過の通知を送信
 * @param task タスク情報
 * @param assigneeName 割り当て先ユーザー名
 * @param assigneeEmail 割り当て先メールアドレス
 * @param projectName プロジェクト名
 * @param daysOverdue 超過日数
 */
export async function triggerTaskOverdueNotification(
  task: Task,
  assigneeName: string,
  assigneeEmail: string,
  projectName: string,
  daysOverdue: number
): Promise<void> {
  try {
    if (!assigneeEmail || !task.project_id) {
      console.warn("タスク期限超過通知: 必要な情報が不足しています");
      return;
    }

    const variables = {
      user_name: assigneeName,
      task_name: task.task_name,
      project_name: projectName,
      due_date: task.planned_end ? new Date(task.planned_end).toLocaleDateString("ja-JP") : "未設定",
      days_overdue: daysOverdue.toString(),
      progress: task.progress_percent.toString()
    };

    const result = await createNotificationFromTemplate(
      "task_overdue",
      variables,
      assigneeEmail,
      task.project_id,
      task.id
    );

    if (result) {
      console.log("✅ タスク期限超過通知を作成しました:", task.task_name);
    } else {
      console.error("❌ タスク期限超過通知の作成に失敗しました");
    }
  } catch (error) {
    console.error("タスク期限超過通知の送信中にエラーが発生:", error);
  }
}

/**
 * プロジェクト更新の通知を送信
 * @param project プロジェクト情報
 * @param recipientName 受信者名
 * @param recipientEmail 受信者メールアドレス
 * @param updateDescription 更新内容の説明
 * @param updatedBy 更新者名
 */
export async function triggerProjectUpdatedNotification(
  project: Project,
  recipientName: string,
  recipientEmail: string,
  updateDescription: string,
  updatedBy: string
): Promise<void> {
  try {
    if (!recipientEmail) {
      console.warn("プロジェクト更新通知: 受信者のメールアドレスが不足しています");
      return;
    }

    const variables = {
      user_name: recipientName,
      project_name: project.name,
      update_description: updateDescription,
      updated_by: updatedBy,
      updated_at: new Date().toLocaleString("ja-JP")
    };

    const result = await createNotificationFromTemplate(
      "project_updated",
      variables,
      recipientEmail,
      project.id
    );

    if (result) {
      console.log("✅ プロジェクト更新通知を作成しました:", project.name);
    } else {
      console.error("❌ プロジェクト更新通知の作成に失敗しました");
    }
  } catch (error) {
    console.error("プロジェクト更新通知の送信中にエラーが発生:", error);
  }
}

/**
 * タスクの期限をチェックして通知を送信
 * @param tasks タスクリスト
 * @param daysBeforeDeadline 期限何日前に通知するか
 */
export async function checkAndNotifyTaskDeadlines(
  tasks: Task[],
  daysBeforeDeadline: number = 3
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const task of tasks) {
    // 完了済みタスクはスキップ
    if (task.status === "DONE") {
      continue;
    }

    // 期限が設定されていないタスクはスキップ
    if (!task.planned_end) {
      continue;
    }

    const deadline = new Date(task.planned_end);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 期限超過チェック
    if (diffDays < 0) {
      // TODO: assignee情報とメールアドレスを取得してtriggerTaskOverdueNotificationを呼び出す
      console.log(`⚠️ タスク「${task.task_name}」は期限を${Math.abs(diffDays)}日超過しています`);
    }
    // 期限間近チェック
    else if (diffDays <= daysBeforeDeadline && diffDays >= 0) {
      // TODO: assignee情報とメールアドレスを取得してtriggerTaskDueSoonNotificationを呼び出す
      console.log(`⏰ タスク「${task.task_name}」の期限まであと${diffDays}日です`);
    }
  }
}

/**
 * 優先度ラベルを取得
 */
function getPriorityLabel(priority?: string): string {
  switch (priority) {
    case "URGENT":
      return "緊急";
    case "HIGH":
      return "高";
    case "MEDIUM":
      return "中";
    case "LOW":
      return "低";
    default:
      return "未設定";
  }
}

/**
 * ステータスラベルを取得
 */
function getStatusLabel(status?: string): string {
  switch (status) {
    case "NOT_STARTED":
      return "未着手";
    case "IN_PROGRESS":
      return "進行中";
    case "DONE":
      return "完了";
    case "HOLD":
      return "保留";
    case "CANCELLED":
      return "キャンセル";
    case "BLOCKED":
      return "ブロック";
    case "DELAYED":
      return "遅延";
    default:
      return "未設定";
  }
}

