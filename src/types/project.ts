// プロジェクト型定義（Supabase projects テーブルに対応）
// 画面表示・フォーム入力の一貫性を考慮し、日付は YYYY-MM-DD、日時は ISO 文字列で扱う

export interface Project {
  // プロジェクトID（bigint）。フロントでは number として扱う
  id: number;

  // プロジェクト名（text, NOT NULL）
  name: string;

  // プロジェクト概要（text, NULL 可）
  description?: string | null;

  // 開始日（date, NULL 可）YYYY-MM-DD
  start_date?: string | null;

  // 終了日（date, NULL 可）YYYY-MM-DD
  end_date?: string | null;

  // オーナーユーザーID（bigint, NULL 可）
  owner_user_id?: number | null;

  // アーカイブフラグ（boolean, NOT NULL, デフォルト false）
  is_archived: boolean;

  // 作成日時（timestamptz, NOT NULL）。ISO 文字列で扱う
  created_at: string;

  // 更新日時（timestamptz, NOT NULL）。ISO 文字列で扱う
  updated_at: string;
}

// 新規作成時に必要な入力型（id/created_at/updated_at は DB 側で付与）
export interface ProjectInsert {
  name: string;
  description?: string | null;
  start_date?: string | null; // YYYY-MM-DD
  end_date?: string | null;   // YYYY-MM-DD
  owner_user_id?: number | null;
  is_archived?: boolean; // 省略時は false
}

// 更新時の入力型（部分更新を許可）
export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  start_date?: string | null; // YYYY-MM-DD
  end_date?: string | null;   // YYYY-MM-DD
  owner_user_id?: number | null;
  is_archived?: boolean;
}


