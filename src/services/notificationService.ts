// 通知管理用サービス（Supabase 連携）
// 目的: notifications テーブルと alert_rules テーブルのCRUD操作を提供

import type { 
  Notification, 
  NotificationInsert, 
  NotificationUpdate, 
  AlertRule,
  AlertRuleInsert,
  AlertRuleUpdate,
  NotificationStats,
  NotificationFilter,
  NotificationStatus,
  AlertRuleType
} from "../types/notification";
import { supabase, selectRows, type SelectFilter, type WhereCondition } from "./supabaseClient";

// テーブル名
const NOTIFICATIONS_TABLE = "notifications";
const ALERT_RULES_TABLE = "alert_rules";

// ===== 通知管理 =====

// 通知一覧取得
export async function listNotifications(
  filter?: NotificationFilter,
  limit?: number
): Promise<Notification[]> {
  try {
    let query = supabase
      .from(NOTIFICATIONS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    // フィルター適用
    if (filter) {
      if (filter.status) {
        query = query.eq("status", filter.status);
      }
      if (filter.project_id) {
        query = query.eq("project_id", filter.project_id);
      }
      if (filter.task_id) {
        query = query.eq("task_id", filter.task_id);
      }
      if (filter.email) {
        query = query.ilike("to_email", `%${filter.email}%`);
      }
      if (filter.date_from) {
        query = query.gte("created_at", filter.date_from);
      }
      if (filter.date_to) {
        query = query.lte("created_at", filter.date_to);
      }
    }

    // 件数制限
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error("通知一覧取得に失敗:", error.message);
      return [];
    }
    
    return (data as Notification[]) ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("通知一覧取得でエラー:", msg);
    return [];
  }
}

// 通知作成
export async function createNotification(payload: NotificationInsert): Promise<Notification | null> {
  try {
    const { data, error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .insert([{
        status: "QUEUED",
        send_after: new Date().toISOString(),
        ...payload
      }])
      .select("*")
      .single();
    
    if (error) {
      console.error("通知作成に失敗:", error.message);
      return null;
    }
    return data as Notification;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("通知作成時に予期せぬエラー:", msg);
    return null;
  }
}

// 通知更新
export async function updateNotification(
  id: number, 
  payload: NotificationUpdate
): Promise<Notification | null> {
  try {
    const { data, error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    
    if (error) {
      console.error("通知更新に失敗:", error.message);
      return null;
    }
    return data as Notification;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("通知更新時に予期せぬエラー:", msg);
    return null;
  }
}

// 通知削除
export async function deleteNotification(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("通知削除に失敗:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("通知削除時に予期せぬエラー:", msg);
    return false;
  }
}

// 通知再送信
export async function resendNotification(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .update({
        status: "QUEUED",
        sent_at: null,
        last_error: null,
        send_after: new Date().toISOString()
      })
      .eq("id", id);
    
    if (error) {
      console.error("通知再送信に失敗:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("通知再送信時に予期せぬエラー:", msg);
    return false;
  }
}

// ===== アラートルール管理 =====

// アラートルール一覧取得
export async function listAlertRules(
  projectId?: number
): Promise<AlertRule[]> {
  try {
    let query = supabase
      .from(ALERT_RULES_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error("アラートルール一覧取得に失敗:", error.message);
      return [];
    }
    
    return (data as AlertRule[]) ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("アラートルール一覧取得でエラー:", msg);
    return [];
  }
}

// アラートルール作成
export async function createAlertRule(payload: AlertRuleInsert): Promise<AlertRule | null> {
  try {
    const { data, error } = await supabase
      .from(ALERT_RULES_TABLE)
      .insert([{
        is_enabled: true,
        ...payload
      }])
      .select("*")
      .single();
    
    if (error) {
      console.error("アラートルール作成に失敗:", error.message);
      return null;
    }
    return data as AlertRule;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("アラートルール作成時に予期せぬエラー:", msg);
    return null;
  }
}

// アラートルール更新
export async function updateAlertRule(
  id: number, 
  payload: AlertRuleUpdate
): Promise<AlertRule | null> {
  try {
    const { data, error } = await supabase
      .from(ALERT_RULES_TABLE)
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    
    if (error) {
      console.error("アラートルール更新に失敗:", error.message);
      return null;
    }
    return data as AlertRule;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("アラートルール更新時に予期せぬエラー:", msg);
    return null;
  }
}

// アラートルール削除
export async function deleteAlertRule(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(ALERT_RULES_TABLE)
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("アラートルール削除に失敗:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("アラートルール削除時に予期せぬエラー:", msg);
    return false;
  }
}

// ===== 統計情報 =====

// 通知統計情報取得
export async function getNotificationStats(): Promise<NotificationStats> {
  try {
    const { data, error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .select("status");
    
    if (error) {
      console.error("通知統計取得に失敗:", error.message);
      return {
        total_notifications: 0,
        queued_notifications: 0,
        sent_notifications: 0,
        failed_notifications: 0,
        cancelled_notifications: 0,
        success_rate: 0
      };
    }
    
    const notifications = data || [];
    const total = notifications.length;
    const queued = notifications.filter(n => n.status === "QUEUED").length;
    const sent = notifications.filter(n => n.status === "SENT").length;
    const failed = notifications.filter(n => n.status === "FAILED").length;
    const cancelled = notifications.filter(n => n.status === "CANCELLED").length;
    const success_rate = total > 0 ? Math.round((sent / total) * 100) : 0;
    
    return {
      total_notifications: total,
      queued_notifications: queued,
      sent_notifications: sent,
      failed_notifications: failed,
      cancelled_notifications: cancelled,
      success_rate
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("通知統計取得でエラー:", msg);
    return {
      total_notifications: 0,
      queued_notifications: 0,
      sent_notifications: 0,
      failed_notifications: 0,
      cancelled_notifications: 0,
      success_rate: 0
    };
  }
}

// ===== 通知テンプレート =====

// 通知テンプレート一覧
export const NOTIFICATION_TEMPLATES = {
  TASK_ASSIGNED: {
    id: "task_assigned",
    name: "タスク割り当て",
    subject_template: "新しいタスクが割り当てられました: {{task_name}}",
    body_template: "{{user_name}}さん、新しいタスク「{{task_name}}」が割り当てられました。\n\nプロジェクト: {{project_name}}\n期限: {{due_date}}\n優先度: {{priority}}\n\n詳細はシステムにログインしてご確認ください。",
    variables: ["user_name", "task_name", "project_name", "due_date", "priority"]
  },
  TASK_DUE_SOON: {
    id: "task_due_soon",
    name: "タスク期限間近",
    subject_template: "タスクの期限が間近です: {{task_name}}",
    body_template: "{{user_name}}さん、タスク「{{task_name}}」の期限が{{days_remaining}}日後に迫っています。\n\nプロジェクト: {{project_name}}\n期限: {{due_date}}\n進捗: {{progress}}%\n\nお忙しいとは思いますが、進捗の確認をお願いします。",
    variables: ["user_name", "task_name", "project_name", "due_date", "days_remaining", "progress"]
  },
  TASK_OVERDUE: {
    id: "task_overdue",
    name: "タスク期限超過",
    subject_template: "タスクの期限が超過しました: {{task_name}}",
    body_template: "{{user_name}}さん、タスク「{{task_name}}」の期限が{{days_overdue}}日超過しています。\n\nプロジェクト: {{project_name}}\n期限: {{due_date}}\n進捗: {{progress}}%\n\n至急対応をお願いします。",
    variables: ["user_name", "task_name", "project_name", "due_date", "days_overdue", "progress"]
  },
  PROJECT_UPDATED: {
    id: "project_updated",
    name: "プロジェクト更新",
    subject_template: "プロジェクトが更新されました: {{project_name}}",
    body_template: "{{user_name}}さん、プロジェクト「{{project_name}}」に更新がありました。\n\n更新内容: {{update_description}}\n更新者: {{updated_by}}\n更新日時: {{updated_at}}\n\n詳細はシステムにログインしてご確認ください。",
    variables: ["user_name", "project_name", "update_description", "updated_by", "updated_at"]
  }
};

// テンプレートから通知作成
export async function createNotificationFromTemplate(
  templateId: string,
  variables: Record<string, string>,
  toEmail: string,
  projectId: number,
  taskId?: number
): Promise<Notification | null> {
  const template = Object.values(NOTIFICATION_TEMPLATES).find(t => t.id === templateId);
  if (!template) {
    console.error("テンプレートが見つかりません:", templateId);
    return null;
  }

  // テンプレート変数を置換
  let subject = template.subject_template;
  let body = template.body_template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
    body = body.replace(new RegExp(placeholder, 'g'), value);
  }

  return await createNotification({
    project_id: projectId,
    task_id: taskId,
    to_email: toEmail,
    subject,
    body_text: body
  });
}

export type { SelectFilter, WhereCondition };
