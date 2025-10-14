// 汎用CRUDファクトリ（各テーブルの型に合わせて安全に操作するための薄いラッパー）
// 使い方: const projectsRepo = createCrudRepo<Projects, ProjectsInsert, ProjectsUpdate>("projects");

import { supabase } from "./supabaseClient";
import { handleServiceCall, createSuccessResult, createErrorResult, translateSupabaseError, type ServiceResult } from "../utils/errorHandler";

export interface CrudRepo<T, TInsert, TUpdate> {
  select(columns?: string, filter?: Record<string, unknown>): Promise<ServiceResult<T[]>>;
  where(columns: string, filter?: Record<string, unknown>): Promise<ServiceResult<T[]>>; // columns は select 互換（"*" や リレーション指定）
  insert(payload: TInsert | TInsert[]): Promise<ServiceResult<T[]>>;
  update(match: Partial<T>, payload: TUpdate): Promise<ServiceResult<T[]>>;
  remove(match: Partial<T>): Promise<ServiceResult<number>>; // 削除件数
}

export function createCrudRepo<T, TInsert, TUpdate>(table: string): CrudRepo<T, TInsert, TUpdate> {
  return {
    async select(columns: string = "*", filter?: Record<string, unknown>) {
      return handleServiceCall(
        async () => {
          let q = supabase.from(table).select(columns);
          if (filter) {
            for (const [k, v] of Object.entries(filter)) {
              q = q.eq(k, v as never);
            }
          }
          const { data, error } = await q;
          if (error) {
            throw new Error(translateSupabaseError(error));
          }
          return (data as T[]) ?? [];
        },
        `[${table}] select 失敗`
      );
    },
    async where(columns: string, filter?: Record<string, unknown>) {
      return this.select(columns, filter);
    },
    async insert(payload: TInsert | TInsert[]) {
      return handleServiceCall(
        async () => {
          const rows = Array.isArray(payload) ? payload : [payload];
          const { data, error } = await supabase.from(table).insert(rows as never).select("*");
          if (error) {
            throw new Error(translateSupabaseError(error));
          }
          return (data as T[]) ?? [];
        },
        `[${table}] insert 失敗`
      );
    },
    async update(match: Partial<T>, payload: TUpdate) {
      return handleServiceCall(
        async () => {
          let q = supabase.from(table).update(payload as never);
          for (const [k, v] of Object.entries(match)) {
            q = q.eq(k, v as never);
          }
          const { data, error } = await q.select("*");
          if (error) {
            throw new Error(translateSupabaseError(error));
          }
          return (data as T[]) ?? [];
        },
        `[${table}] update 失敗`
      );
    },
    async remove(match: Partial<T>) {
      return handleServiceCall(
        async () => {
          let q = supabase.from(table).delete();
          for (const [k, v] of Object.entries(match)) {
            q = q.eq(k, v as never);
          }
          const { count, error } = await q.select("id", { count: "exact", head: true });
          if (error) {
            throw new Error(translateSupabaseError(error));
          }
          return count ?? 0;
        },
        `[${table}] delete 失敗`
      );
    },
  };
}


