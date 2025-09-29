// タスク用サービス（Supabase 連携）
// 目的: tasks テーブルの select/where/create/update を提供

import type { Task, TaskInsert, TaskUpdate, TaskWithProject } from "../types/task";
import { supabase, selectRows, type SelectFilter, type WhereCondition } from "./supabaseClient";

const TABLE_NAME = "tasks";

// 一覧取得（任意フィルタ/条件）
export async function listTasks(
  filter?: SelectFilter,
  where?: WhereCondition[]
): Promise<Task[]> {
  const res = await selectRows<Task>(TABLE_NAME, "*", filter, where);
  if (!res.ok) {
    console.error("タスク一覧の取得に失敗:", res.error);
    return [];
  }
  return res.data ?? [];
}

// 単一取得
export async function getTaskById(id: number): Promise<Task | null> {
  const res = await selectRows<Task>(TABLE_NAME, "*", { id });
  if (!res.ok) {
    console.error("タスク取得に失敗:", res.error);
    return null;
  }
  return (res.data && res.data[0]) ?? null;
}

// 作成
export async function createTask(payload: TaskInsert): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{ progress_percent: 0, is_archived: false, ...payload }])
      .select("*")
      .single();
    if (error) {
      console.error("タスク作成に失敗:", error.message);
      return null;
    }
    return data as Task;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("タスク作成時に予期せぬエラー:", msg);
    return null;
  }
}

// 更新
export async function updateTask(id: number, payload: TaskUpdate): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ ...payload })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      console.error("タスク更新に失敗:", error.message);
      return null;
    }
    return data as Task;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("タスク更新時に予期せぬエラー:", msg);
    return null;
  }
}

// JOIN（projects）してタスク＋プロジェクト名を取得
export async function listTasksWithProject(
  filter?: SelectFilter,
  where?: WhereCondition[]
): Promise<TaskWithProject[]> {
  try {
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
      console.error("タスク結合取得に失敗:", error.message);
      return [];
    }
    return (data as TaskWithProject[]) ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("タスク結合取得でエラー:", msg);
    return [];
  }
}

// 削除（DELETE）
export async function deleteTask(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) {
      console.error("タスク削除に失敗:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("タスク削除時に予期せぬエラー:", msg);
    return false;
  }
}

export type { SelectFilter, WhereCondition };


