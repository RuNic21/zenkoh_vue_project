// 複合リレーション取得サービス
// 目的: Supabase のネスト select を用いて結合結果を取得

import { supabase, type SelectFilter, type WhereCondition } from "./supabaseClient";
import type { Tasks } from "../types/db/tasks";
import type { Projects } from "../types/db/projects";
import type { TaskMembers } from "../types/db/task_members";
import type { Users } from "../types/db/users";
import type { BoardColumns } from "../types/db/board_columns";
import type { Boards } from "../types/db/boards";
import type { Notifications } from "../types/db/notifications";
import type { AlertRules } from "../types/db/alert_rules";
import { handleServiceCall, createSuccessResult, createErrorResult, translateSupabaseError, type ServiceResult } from "../utils/errorHandler";

// 型: タスク + プロジェクト + メンバー(ユーザー)
export type TaskWithProjectAndMembers = Tasks & {
  project?: Pick<Projects, "id" | "name"> | null;
  members?: Array<
    TaskMembers & {
      user?: Pick<Users, "id" | "display_name" | "email"> | null;
    }
  >;
};

// 型: カラム + ボード(+プロジェクト)
export type BoardColumnWithBoardProject = BoardColumns & {
  board?: (Boards & { project?: Pick<Projects, "id" | "name"> | null }) | null;
};

// 型: 通知 + 関連
export type NotificationWithRelations = Notifications & {
  project?: Pick<Projects, "id" | "name"> | null;
  task?: Pick<Tasks, "id" | "task_name"> | null;
  alert_rule?: Pick<AlertRules, "id" | "name" | "rule_type"> | null;
};

// ユーティリティ: 簡易 where 適用（必要な一部演算子のみ）
function applyWhere(query: any, where?: WhereCondition[]) {
  if (!where) return query;
  for (const w of where) {
    switch (w.op) {
      case "eq":
        query = query.eq(w.column, w.value as never);
        break;
      case "ilike":
        query = query.ilike(w.column, w.value as string);
        break;
      case "in": {
        const vals = Array.isArray(w.value) ? (w.value as unknown[]) : [w.value];
        query = query.in(w.column, vals);
        break;
      }
      default:
        break;
    }
  }
  return query;
}

// タスク + プロジェクト + メンバー
export async function listTasksWithProjectAndMembers(
  filter?: SelectFilter,
  where?: WhereCondition[]
): Promise<ServiceResult<TaskWithProjectAndMembers[]>> {
  return handleServiceCall(
    async () => {
      let query = supabase
        .from("tasks")
        .select("*, project:projects(id,name), members:task_members(role,user:users(id,display_name,email))");

      if (filter) {
        for (const [k, v] of Object.entries(filter)) query = query.eq(k, v as never);
      }
      query = applyWhere(query, where);

      const { data, error } = await query;
      if (error) {
        throw new Error(translateSupabaseError(error));
      }
      return (data as TaskWithProjectAndMembers[]) ?? [];
    },
    "タスク結合取得に失敗しました"
  );
}

// カラム + ボード(+プロジェクト)
export async function listBoardColumnsWithBoardProject(
  filter?: SelectFilter,
  where?: WhereCondition[]
): Promise<BoardColumnWithBoardProject[]> {
  try {
    let query = supabase
      .from("board_columns")
      .select("*, board:boards(id,name,project_id, project:projects(id,name))");

    if (filter) {
      for (const [k, v] of Object.entries(filter)) query = query.eq(k, v as never);
    }
    query = applyWhere(query, where);

    const { data, error } = await query;
    if (error) {
      console.error("ボードカラム結合取得に失敗:", error.message);
      return [];
    }
    return (data as BoardColumnWithBoardProject[]) ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ボードカラム結合取得でエラー:", msg);
    return [];
  }
}

// 通知 + 関連（プロジェクト/タスク/ルール）
export async function listNotificationsWithRelations(
  filter?: SelectFilter,
  where?: WhereCondition[]
): Promise<NotificationWithRelations[]> {
  try {
    let query = supabase
      .from("notifications")
      .select("*, project:projects(id,name), task:tasks(id,task_name), alert_rule:alert_rules(id,name,rule_type)");

    if (filter) {
      for (const [k, v] of Object.entries(filter)) query = query.eq(k, v as never);
    }
    query = applyWhere(query, where);

    const { data, error } = await query;
    if (error) {
      console.error("通知結合取得に失敗:", error.message);
      return [];
    }
    return (data as NotificationWithRelations[]) ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("通知結合取得でエラー:", msg);
    return [];
  }
}

export type { SelectFilter, WhereCondition };


