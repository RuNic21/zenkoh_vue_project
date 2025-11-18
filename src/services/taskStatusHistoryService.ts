// タスク状態変更履歴サービス
// 目的: task_status_history テーブルへの保存・取得などのDB操作を集約する
// 方針: ストアやコンポーネントから直接DBへアクセスせず、本サービス経由で実行する

import { supabase } from "./supabaseClient";
import { getTaskById } from "./taskService";
import { listUsers } from "./dbServices";
import { getCurrentUser } from "./authService";
import type { Users } from "@/types/db/users";
import type { ScheduleStatus } from "@/types/schedule";
import type { TaskStatusHistory, TaskStatusHistoryViewItem } from "@/types/taskStatusHistory";

/**
 * タスク状態変更履歴を保存する
 * @param taskId 対象タスクID
 * @param toStatus 変更後ステータス
 * @returns 成否（true=成功/false=失敗）
 */
export async function saveTaskStatusHistory(taskId: number, toStatus: ScheduleStatus): Promise<boolean> {
  try {
    // タスク情報から project_id と from_status を取得
    const taskRes = await getTaskById(taskId);
    if (!taskRes.success || !taskRes.data) {
      console.warn("状態変更履歴の保存に失敗: タスク取得に失敗");
      return false;
    }

    const projectId = taskRes.data.project_id as number;
    const fromStatus = taskRes.data.status as ScheduleStatus;

    // 実行ユーザーの表示名と users.id を解決
    let changedByDisplayName = "システム";
    let changedByUserId: number | null = null;

    try {
      const authRes = await getCurrentUser();
      if (authRes.success && authRes.data) {
        changedByDisplayName = authRes.data.displayName || "ユーザー";
        // email 一致で users.id を解決（存在しない場合は null）
        const usersRes = await listUsers();
        if (usersRes.success && usersRes.data) {
          const matched = usersRes.data.find((u: Users) => u.email === authRes.data?.email);
          if (matched?.id) {
            changedByUserId = matched.id as unknown as number;
          }
        }
      }
    } catch (e) {
      // ユーザー解決に失敗しても続行
      console.warn("実行ユーザー情報の解決に失敗:", e);
    }

    // task_status_history に INSERT
    const { error } = await supabase.from("task_status_history").insert([
      {
        task_id: taskId,
        project_id: projectId,
        from_status: fromStatus,
        to_status: toStatus,
        changed_by_user_id: changedByUserId,
        changed_by_display_name: changedByDisplayName,
        reason: `${fromStatus} -> ${toStatus}`,
      },
    ]);

    if (error) {
      console.warn("状態変更履歴の保存に失敗:", error.message);
      return false;
    }

    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("状態変更履歴の保存中にエラー:", msg);
    return false;
  }
}

/**
 * タスク状態変更履歴を取得（新しい順）
 * @param taskId 対象タスクID
 * @param limit 件数制限（省略可）
 * @returns DB 行の配列（new → old）
 */
export async function listTaskStatusHistory(taskId: number, limit?: number): Promise<TaskStatusHistory[]> {
  try {
    let query = supabase
      .from("task_status_history")
      .select("*")
      .eq("task_id", taskId)
      .order("changed_at", { ascending: false });

    if (typeof limit === "number") {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("状態変更履歴の取得に失敗:", error.message);
      return [];
    }
    return (data || []) as TaskStatusHistory[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("状態変更履歴の取得中にエラー:", msg);
    return [];
  }
}

/**
 * 画面表示用アイテムへ変換
 * @param rows DB 行の配列
 * @returns タイムライン表示用配列
 */
export function mapTaskStatusHistoryToViewItems(rows: TaskStatusHistory[]): TaskStatusHistoryViewItem[] {
  return rows.map((r) => ({
    from: r.from_status,
    to: r.to_status,
    user: r.changed_by_display_name || "ユーザー",
    timestamp: new Date(r.changed_at).toLocaleString("ja-JP"),
    reason: r.reason || "",
  }));
}


