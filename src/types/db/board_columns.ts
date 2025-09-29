// 自動生成: information_schema.columns のCSVから生成（編集しないこと）
export interface BoardColumns {
  id: number;
  board_id: number;
  wip_limit?: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  name: string;
}

export interface BoardColumnsInsert {
  id?: number;
  board_id: number;
  wip_limit?: number | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  name: string;
}

export interface BoardColumnsUpdate {
  id?: number;
  board_id?: number;
  wip_limit?: number | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  name?: string;
}