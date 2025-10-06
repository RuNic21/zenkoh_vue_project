// プロジェクト用サービス（Supabase 連携）
// 目的: projects テーブルの基本的な select/where/create/update を提供

import type { Project, ProjectInsert, ProjectUpdate } from "../types/project";
import { supabase, selectRows, type SelectFilter, type WhereCondition } from "./supabaseClient";

const TABLE_NAME = "projects";

// 一覧取得（任意のフィルタ/条件に対応）
export async function listProjects(
  filter?: SelectFilter,
  where?: WhereCondition[]
): Promise<Project[]> {
  // 日本語エラー処理方針: 失敗時は空配列を返却し、コンソールに詳細を出力
  const res = await selectRows<Project>(TABLE_NAME, "*", filter, where);
  if (!res.ok) {
    console.error("プロジェクト一覧の取得に失敗:", res.error);
    return [];
  }
  return res.data ?? [];
}

// 単一取得（ID 指定）
export async function getProjectById(id: number): Promise<Project | null> {
  const res = await selectRows<Project>(TABLE_NAME, "*", { id });
  if (!res.ok) {
    console.error("プロジェクト取得に失敗:", res.error);
    return null;
  }
  return (res.data && res.data[0]) ?? null;
}

// 作成（INSERT）: 作成済みレコードを返す
export async function createProject(payload: ProjectInsert): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{ ...payload }])
      .select("*")
      .single();

    if (error) {
      console.error("プロジェクトの作成に失敗:", error.message);
      return null;
    }
    return data as Project;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("プロジェクト作成時に予期せぬエラー:", msg);
    return null;
  }
}

// 更新（UPDATE）: 更新後レコードを返す
export async function updateProject(id: number, payload: ProjectUpdate): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ ...payload })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("プロジェクトの更新に失敗:", error.message);
      return null;
    }
    return data as Project;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("プロジェクト更新時に予期せぬエラー:", msg);
    return null;
  }
}

// 削除（DELETE）
export async function deleteProject(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) {
      console.error("プロジェクトの削除に失敗:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("プロジェクト削除時に予期せぬエラー:", msg);
    return false;
  }
}

// where 条件ビルドの例（呼び出し側で柔軟に条件指定したい場合に利用）
export type { SelectFilter, WhereCondition };


