-- タグ機能追加: tasks テーブルに tags カラムを追加
-- 目的: タスクにタグを付与して分類・検索を可能にする
--
-- 背景:
-- - UI レベルでは既にタグ追加/削除機能が実装済み
-- - データベースに保存されないため、ページリロード時にタグが消失
-- - tasks テーブルに tags カラムが存在しない
--
-- 解決策:
-- - tags TEXT[] カラムを追加（PostgreSQL の配列型を使用）
-- - デフォルト値は空配列
-- - 既存タスクの tags は NULL または空配列として扱われる

-- ========== tags カラム追加 ==========
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ========== インデックス追加（オプション） ==========
-- タグ検索の高速化のため、GIN インデックスを追加
-- 注意: 配列型の検索には GIN インデックスが有効
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN (tags);

-- ========== コメント追加（ドキュメント化） ==========
COMMENT ON COLUMN tasks.tags IS 'タスクに付与されたタグの配列。分類・検索・フィルタリングに使用';

-- ========== 既存データの初期化（オプション） ==========
-- 既存タスクの tags が NULL の場合は空配列に設定
UPDATE tasks SET tags = ARRAY[]::TEXT[] WHERE tags IS NULL;

-- 逆マイグレーション（必要時の参考）
-- DROP INDEX IF EXISTS idx_tasks_tags;
-- ALTER TABLE tasks DROP COLUMN IF EXISTS tags;

