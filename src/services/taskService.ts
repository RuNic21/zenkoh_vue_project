// タスク用サービス（Supabase 連携）
// 目的: tasks テーブルの select/where/create/update を提供

import type { Task, TaskInsert, TaskUpdate, TaskWithProject } from "../types/task";
import { supabase, selectRows, type SelectFilter, type WhereCondition } from "./supabaseClient";
import { handleServiceCall, createSuccessResult, createErrorResult, translateSupabaseError, type ServiceResult } from "../utils/errorHandler";

const TABLE_NAME = "tasks";

// 一覧取得（任意フィルタ/条件）
export async function listTasks(
  filter?: SelectFilter,
  where?: WhereCondition[]
): Promise<ServiceResult<Task[]>> {
  return handleServiceCall(
    async () => {
      const res = await selectRows<Task>(TABLE_NAME, "*", filter, where);
      if (!res.ok) {
        throw new Error(res.error || "タスク一覧の取得に失敗しました");
      }
      return res.data ?? [];
    },
    "タスク一覧の取得に失敗しました"
  );
}

// 単一取得
export async function getTaskById(id: number): Promise<ServiceResult<Task | null>> {
  return handleServiceCall(
    async () => {
      const res = await selectRows<Task>(TABLE_NAME, "*", { id });
      if (!res.ok) {
        throw new Error(res.error || "タスクの取得に失敗しました");
      }
      return (res.data && res.data[0]) ?? null;
    },
    "タスクの取得に失敗しました"
  );
}

// 作成
export async function createTask(payload: TaskInsert): Promise<ServiceResult<Task | null>> {
  return handleServiceCall(
    async () => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([{ progress_percent: 0, is_archived: false, ...payload }])
        .select("*")
        .single();
      if (error) {
        throw new Error(translateSupabaseError(error));
      }
      return data as Task;
    },
    "タスクの作成に失敗しました"
  );
}

// 更新
export async function updateTask(id: number, payload: TaskUpdate): Promise<ServiceResult<Task | null>> {
  return handleServiceCall(
    async () => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ ...payload })
        .eq("id", id)
        .select("*")
        .single();
      if (error) {
        throw new Error(translateSupabaseError(error));
      }
      return data as Task;
    },
    "タスクの更新に失敗しました"
  );
}

// JOIN（projects）してタスク＋プロジェクト名を取得
export async function listTasksWithProject(
  filter?: SelectFilter,
  where?: WhereCondition[]
): Promise<ServiceResult<TaskWithProject[]>> {
  return handleServiceCall(
    async () => {
      let query = supabase.from(TABLE_NAME).select("*, project:projects(id,name)");
      if (filter) {
        for (const [k, v] of Object.entries(filter)) query = query.eq(k, v as never);
      }
      if (where && where.length) {
        for (const w of where) {
          switch (w.op) {
            case "eq":
              query = query.eq(w.column, w.value as never);
              break;
            case "ilike":
              query = query.ilike(w.column, w.value as string);
              break;
            default:
              break;
          }
        }
      }
      const { data, error } = await query;
      if (error) {
        throw new Error(translateSupabaseError(error));
      }
      return (data as TaskWithProject[]) ?? [];
    },
    "タスク結合取得に失敗しました"
  );
}

// 削除（DELETE）
export async function deleteTask(id: number): Promise<ServiceResult<boolean>> {
  return handleServiceCall(
    async () => {
      const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
      if (error) {
        throw new Error(translateSupabaseError(error));
      }
      return true;
    },
    "タスクの削除に失敗しました"
  );
}

export type { SelectFilter, WhereCondition };


