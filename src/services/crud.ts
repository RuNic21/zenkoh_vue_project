// 汎用CRUDファクトリ（各テーブルの型に合わせて安全に操作するための薄いラッパー）
// 使い方: const projectsRepo = createCrudRepo<Projects, ProjectsInsert, ProjectsUpdate>("projects");

import { supabase } from "./supabaseClient";

export interface CrudRepo<T, TInsert, TUpdate> {
  select(columns?: string, filter?: Record<string, unknown>): Promise<T[]>;
  where(columns: string, filter?: Record<string, unknown>): Promise<T[]>; // columns は select 互換（"*" や リレーション指定）
  insert(payload: TInsert | TInsert[]): Promise<T[]>;
  update(match: Partial<T>, payload: TUpdate): Promise<T[]>;
  remove(match: Partial<T>): Promise<number>; // 削除件数
}

export function createCrudRepo<T, TInsert, TUpdate>(table: string): CrudRepo<T, TInsert, TUpdate> {
  return {
    async select(columns: string = "*", filter?: Record<string, unknown>) {
      let q = supabase.from(table).select(columns);
      if (filter) {
        for (const [k, v] of Object.entries(filter)) q = q.eq(k, v as never);
      }
      const { data, error } = await q;
      if (error) {
        console.error(`[${table}] select 失敗:`, error.message);
        return [] as T[];
      }
      return (data as T[]) ?? [];
    },
    async where(columns: string, filter?: Record<string, unknown>) {
      return this.select(columns, filter);
    },
    async insert(payload: TInsert | TInsert[]) {
      const rows = Array.isArray(payload) ? payload : [payload];
      const { data, error } = await supabase.from(table).insert(rows as never).select("*");
      if (error) {
        console.error(`[${table}] insert 失敗:`, error.message);
        return [] as T[];
      }
      return (data as T[]) ?? [];
    },
    async update(match: Partial<T>, payload: TUpdate) {
      let q = supabase.from(table).update(payload as never);
      for (const [k, v] of Object.entries(match)) q = q.eq(k, v as never);
      const { data, error } = await q.select("*");
      if (error) {
        console.error(`[${table}] update 失敗:`, error.message);
        return [] as T[];
      }
      return (data as T[]) ?? [];
    },
    async remove(match: Partial<T>) {
      let q = supabase.from(table).delete();
      for (const [k, v] of Object.entries(match)) q = q.eq(k, v as never);
      const { count, error } = await q.select("id", { count: "exact", head: true });
      if (error) {
        console.error(`[${table}] delete 失敗:`, error.message);
        return 0;
      }
      return count ?? 0;
    },
  };
}


