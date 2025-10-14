// 活動フィード用サービス（notifications テーブル連携）
// 目的: プロジェクト・タスクの活動履歴を notifications テーブルから取得し、UI表示用に変換

// TODO: DB連携されていない機能のサービス実装が必要
// 1. コメント活動ログ
//    - コメント追加/削除/編集時の活動ログ生成実装が必要
//    - コメント関連通知システム実装が必要
//
// 2. 添付ファイル活動ログ
//    - ファイルアップロード/ダウンロード/削除時の活動ログ生成実装が必要
//    - ファイル関連通知システム実装が必要
//
// 3. タグ活動ログ
//    - タグ追加/削除時の活動ログ生成実装が必要
//    - タグ関連通知システム実装が必要
//
// 4. メモ/ノート活動ログ
//    - メモ編集時の活動ログ生成実装が必要
//    - メモ関連通知システム実装が必要
//
// 5. ユーザー活動追跡
//    - ユーザー別活動履歴管理実装が必要
//    - ユーザー活動統計生成実装が必要
//
// 6. リアルタイム通知システム
//    - WebSocketベースリアルタイム通知実装が必要
//    - 通知設定管理システム実装が必要
//    - 通知既読/未読状態管理実装が必要

import { supabase } from "./supabaseClient";

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

// notifications テーブルから活動データを取得
export async function fetchRecentActivities(limit: number = 10): Promise<ActivityLog[]> {
  try {
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
      console.error('活動データの取得に失敗:', error);
      return [];
    }

    // notifications を ActivityLog に変換
    const activities: ActivityLog[] = (notifications || []).map(notification => {
      const activityType = determineActivityType(notification.subject, notification.body_text);
      const description = generateActivityDescription(activityType, notification);
      
      return {
        id: notification.id,
        type: activityType,
        description: description,
        user: extractUserFromNotification(notification.body_text),
        timestamp: new Date(notification.created_at),
        projectId: notification.project_id,
        taskId: notification.task_id,
        projectName: (notification.projects as any)?.name,
        taskName: (notification.tasks as any)?.task_name
      };
    });

    return activities;
  } catch (error) {
    console.error('活動フィードの読み込み中にエラー:', error);
    return [];
  }
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
function generateActivityDescription(type: ActivityLog['type'], notification: any): string {
  const projectName = notification.projects?.name || 'プロジェクト';
  const taskName = notification.tasks?.task_name || 'タスク';

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

// 通知本文から 사용자명을 추출
function extractUserFromNotification(bodyText: string): string {
  // 簡単なパターンマッチでユーザー名を抽出
  // 実際にはさらに精密なパースが必要な場合があります
  const userMatch = bodyText.match(/(?:担当者|ユーザー|人):\s*([^\n,]+)/i);
  if (userMatch) {
    return userMatch[1].trim();
  }

  // 기본값
  return 'システム';
}

// 新しい活動を notifications テーブルに追加
export async function createActivityNotification(
  projectId: number,
  taskId: number | null,
  subject: string,
  bodyText: string,
  toEmail: string = 'admin@example.com'
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
  await createActivityNotification(
    projectId,
    null,
    `新しいプロジェクト作成: ${projectName}`,
    `新しいプロジェクト "${projectName}"が作成されました。\n担当者: ${ownerName}`,
    'admin@example.com'
  );
}

// タスク作成時の活動ログ生成
export async function logTaskCreated(projectId: number, taskId: number, projectName: string, taskName: string): Promise<void> {
  await createActivityNotification(
    projectId,
    taskId,
    `新しいタスク作成: ${taskName}`,
    `プロジェクト "${projectName}"に新しいタスク "${taskName}"が追加されました。`,
    'admin@example.com'
  );
}

// タスク 完了時の活動ログ生成
export async function logTaskCompleted(projectId: number, taskId: number, projectName: string, taskName: string): Promise<void> {
  await createActivityNotification(
    projectId,
    taskId,
    `タスク完了: ${taskName}`,
    `プロジェクト "${projectName}"の"${taskName}"タスクが完了しました。`,
    'admin@example.com'
  );
}
