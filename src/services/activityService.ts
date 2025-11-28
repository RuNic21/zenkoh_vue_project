// 活動フィード用サービス（notifications テーブル連携）
// 目的: プロジェクト・タスクの活動履歴を notifications テーブルから取得し、UI表示用に変換

import { supabase } from "./supabaseClient";
import { listUsers } from "./dbServices";
import type { Notifications } from "../types/db/notifications";
import type { Users } from "../types/db/users";
import { handleServiceCall, createSuccessResult, createErrorResult, translateSupabaseError, type ServiceResult } from "../utils/errorHandler";

// 活動ログの型定義
export interface ActivityLog {
  id: number;
  type: 'project_created' | 'task_completed' | 'deadline_approaching' | 'user_assigned' | 'task_created' | 'project_updated';
  description: string;
  user: string;
  timestamp: Date;
  projectId?: number;
  taskId?: number;
  projectName?: string;
  taskName?: string;
}

// Notifications テーブルに projects と tasks の関連情報を含む型
// Supabase の select クエリ結果に合わせて定義
// 注意: Supabase の join 結果は配列または単一オブジェクトの可能性があるため、型を柔軟に定義
interface NotificationWithRelations {
  id: number;
  project_id: number | null;
  task_id: number | null;
  subject: string;
  body_text: string;
  created_at: string;
  projects?: { name: string } | { name: string }[] | null;
  tasks?: { task_name: string } | { task_name: string }[] | null;
}

// notifications テーブルから活動データを取得
export async function fetchRecentActivities(limit: number = 10): Promise<ServiceResult<ActivityLog[]>> {
  return handleServiceCall(
    async () => {
      // notifications テーブルから最新の活動を取得
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select(`
          id,
          project_id,
          task_id,
          subject,
          body_text,
          created_at,
          projects!inner(name),
          tasks(task_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(translateSupabaseError(error));
      }

      // notifications を ActivityLog に変換
      const activities: ActivityLog[] = (notifications || []).map((notification: any) => {
        // Supabase の join 結果からプロジェクト名とタスク名を取得
        // projects と tasks は配列または単一オブジェクトの可能性がある
        const projectName = Array.isArray(notification.projects) 
          ? notification.projects[0]?.name 
          : notification.projects?.name;
        const taskName = Array.isArray(notification.tasks)
          ? notification.tasks[0]?.task_name
          : notification.tasks?.task_name;
        
        const activityType = determineActivityType(notification.subject, notification.body_text);
        const description = generateActivityDescription(activityType, {
          ...notification,
          projects: projectName ? { name: projectName } : null,
          tasks: taskName ? { task_name: taskName } : null
        } as NotificationWithRelations);
        
        return {
          id: notification.id,
          type: activityType,
          description: description,
          user: extractUserFromNotification(notification.body_text),
          timestamp: new Date(notification.created_at),
          projectId: notification.project_id ?? undefined,
          taskId: notification.task_id ?? undefined,
          projectName: projectName,
          taskName: taskName
        };
      });

      return activities;
    },
    "活動データ取得に失敗しました"
  );
}

// 通知の件名・本文から活動タイプを判定
function determineActivityType(subject: string, bodyText: string): ActivityLog['type'] {
  const subjectLower = subject.toLowerCase();
  const bodyLower = bodyText.toLowerCase();

  if (subjectLower.includes('プロジェクト') && (subjectLower.includes('作成') || subjectLower.includes('追加'))) {
    return 'project_created';
  }
  if (subjectLower.includes('タスク') && (subjectLower.includes('完了') || subjectLower.includes('完了'))) {
    return 'task_completed';
  }
  if (subjectLower.includes('締切') || subjectLower.includes('期限') || subjectLower.includes('deadline')) {
    return 'deadline_approaching';
  }
  if (subjectLower.includes('担当者') || subjectLower.includes('割当') || subjectLower.includes('assign')) {
    return 'user_assigned';
  }
  if (subjectLower.includes('タスク') && (subjectLower.includes('作成') || subjectLower.includes('追加'))) {
    return 'task_created';
  }
  if (subjectLower.includes('プロジェクト') && (subjectLower.includes('修正') || subjectLower.includes('更新'))) {
    return 'project_updated';
  }

  // デフォルトは task_created
  return 'task_created';
}

// 活動タイプに基づいて説明文を生成
function generateActivityDescription(type: ActivityLog['type'], notification: NotificationWithRelations): string {
  // projects と tasks が配列または単一オブジェクトの可能性があるため、安全に取得
  const projectName = Array.isArray(notification.projects)
    ? notification.projects[0]?.name
    : notification.projects?.name || 'プロジェクト';
  const taskName = Array.isArray(notification.tasks)
    ? notification.tasks[0]?.task_name
    : notification.tasks?.task_name || 'タスク';

  switch (type) {
    case 'project_created':
      return `新しいプロジェクト "${projectName}"が作成されました`;
    case 'task_completed':
      return `プロジェクト "${projectName}"の"${taskName}"タスクが完了しました`;
    case 'deadline_approaching':
      return `プロジェクト "${projectName}"の締切が近づいています`;
    case 'user_assigned':
      return `プロジェクト "${projectName}"に新しい担当者が割り当てられました`;
    case 'task_created':
      return `プロジェクト "${projectName}"に新しいタスク "${taskName}"が追加されました`;
    case 'project_updated':
      return `プロジェクト "${projectName}"が更新されました`;
    default:
      return notification.subject || '新しい活動が発生しました';
  }
}

// 通知本文からユーザー名を抽出
function extractUserFromNotification(bodyText: string): string {
  // 簡単なパターンマッチでユーザー名を抽出
  // 実際にはさらに精密なパースが必要な場合があります
  const userMatch = bodyText.match(/(?:担当者|ユーザー|人):\s*([^\n,]+)/i);
  if (userMatch) {
    return userMatch[1].trim();
  }

  // デフォルト値
  return 'システム';
}

// 新しい活動を notifications テーブルに追加
export async function createActivityNotification(
  projectId: number,
  taskId: number | null,
  subject: string,
  bodyText: string,
  toEmail: string = 'system@zenkoh.com'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        project_id: projectId,
        task_id: taskId,
        to_email: toEmail,
        subject: subject,
        body_text: bodyText,
        status: 'SENT' // 活動フィードは即座に表示されるためSENTに設定
      }]);

    if (error) {
      console.error('活動通知の作成に失敗:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('活動通知の作成中にエラー:', error);
    return false;
  }
}

// プロジェクト作成時の活動ログ生成
export async function logProjectCreated(projectId: number, projectName: string, ownerName: string): Promise<void> {
  // 実際のユーザー情報を取得してから通知を作成
  const usersResult = await listUsers();
  const users = usersResult.success && usersResult.data ? usersResult.data : [];
  const adminUser = users.find((user: Users) => user.display_name === ownerName) || users[0];
  const toEmail = adminUser ? adminUser.email : 'system@zenkoh.com';
  
  await createActivityNotification(
    projectId,
    null,
    `新しいプロジェクト作成: ${projectName}`,
    `新しいプロジェクト "${projectName}"が作成されました。\n担当者: ${ownerName}`,
    toEmail
  );
}

// タスク作成時の活動ログ生成
export async function logTaskCreated(projectId: number, taskId: number, projectName: string, taskName: string): Promise<void> {
  // 実際のユーザー情報を取得してから通知を作成
  const usersResult = await listUsers();
  const users = usersResult.success && usersResult.data ? usersResult.data : [];
  const toEmail = users.length > 0 ? users[0].email : 'system@zenkoh.com';
  
  await createActivityNotification(
    projectId,
    taskId,
    `新しいタスク作成: ${taskName}`,
    `プロジェクト "${projectName}"に新しいタスク "${taskName}"が追加されました。`,
    toEmail
  );
}

// タスク完了時の活動ログ生成
export async function logTaskCompleted(projectId: number, taskId: number, projectName: string, taskName: string): Promise<void> {
  // 実際のユーザー情報を取得してから通知を作成
  const usersResult = await listUsers();
  const users = usersResult.success && usersResult.data ? usersResult.data : [];
  const toEmail = users.length > 0 ? users[0].email : 'system@zenkoh.com';
  
  await createActivityNotification(
    projectId,
    taskId,
    `タスク完了: ${taskName}`,
    `プロジェクト "${projectName}"の"${taskName}"タスクが完了しました。`,
    toEmail
  );
}
