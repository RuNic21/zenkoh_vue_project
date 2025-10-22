// プロジェクト用サービス（Supabase 連携）
// 目的: projects テーブルの基本的な select/where/create/update を提供

import type { Project, ProjectInsert, ProjectUpdate } from "../types/project";
import { supabase, selectRows, type SelectFilter, type WhereCondition } from "./supabaseClient";
import { handleServiceCall, createSuccessResult, createErrorResult, translateSupabaseError, type ServiceResult } from "../utils/errorHandler";

const TABLE_NAME = "projects";

// 一覧取得（任意のフィルタ/条件に対応）
export async function listProjects(
  filter?: SelectFilter,
  where?: WhereCondition[]
): Promise<ServiceResult<Project[]>> {
  return handleServiceCall(
    async () => {
      const res = await selectRows<Project>(TABLE_NAME, "*", filter, where);
      if (!res.ok) {
        throw new Error(res.error || "プロジェクト一覧の取得に失敗しました");
      }
      return res.data ?? [];
    },
    "プロジェクト一覧の取得に失敗しました"
  );
}

// 単一取得（ID 指定）
export async function getProjectById(id: number): Promise<ServiceResult<Project | null>> {
  return handleServiceCall(
    async () => {
      const res = await selectRows<Project>(TABLE_NAME, "*", { id });
      if (!res.ok) {
        throw new Error(res.error || "プロジェクト取得に失敗しました");
      }
      return (res.data && res.data[0]) ?? null;
    },
    "プロジェクト取得に失敗しました"
  );
}

// 作成（INSERT）: 作成済みレコードを返す
export async function createProject(payload: ProjectInsert): Promise<ServiceResult<Project | null>> {
  return handleServiceCall(
    async () => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([{ ...payload }])
        .select("*")
        .single();

      if (error) {
        throw new Error(translateSupabaseError(error));
      }
      return data as Project;
    },
    "プロジェクトの作成に失敗しました"
  );
}

// 更新（UPDATE）: 更新後レコードを返す
export async function updateProject(id: number, payload: ProjectUpdate): Promise<ServiceResult<Project | null>> {
  return handleServiceCall(
    async () => {
      // updated_at を現在時刻に自動設定（DB の trigger がない場合のため）
      const updatePayload = {
        ...payload,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updatePayload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        throw new Error(translateSupabaseError(error));
      }
      return data as Project;
    },
    "プロジェクトの更新に失敗しました"
  );
}

// 削除（DELETE）
export async function deleteProject(id: number): Promise<ServiceResult<boolean>> {
  return handleServiceCall(
    async () => {
      const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
      if (error) {
        throw new Error(translateSupabaseError(error));
      }
      return true;
    },
    "プロジェクトの削除に失敗しました"
  );
}

// where 条件ビルドの例（呼び出し側で柔軟に条件指定したい場合に利用）
export type { SelectFilter, WhereCondition };


