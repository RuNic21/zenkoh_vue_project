-- 認証システム統合: Supabase Auth UUID と users テーブル連携
-- 目的: users テーブルに auth_id カラムを追加して Supabase Auth と紐付け
--
-- 背景:
-- - Supabase Auth は UUID (例: "d07b5b84-71b0-46ae-a6e0-9407ecf282c3")
-- - users テーブルの id は BIGINT (例: 1, 2, 3)
-- - 型不一致により直接的な紐付けが不可能
--
-- 解決策:
-- - auth_id UUID カラムを追加し、Supabase Auth の ID を保存
-- - 既存の BIGINT id は内部管理用として維持
-- - projects.owner_user_id, tasks.primary_assignee_id などは既存の BIGINT id を継続使用

-- ========== auth_id カラム追加 ==========
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- ========== インデックス追加 ==========
-- auth_id は頻繁に検索されるため、インデックスを追加して高速化
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- ========== コメント追加（ドキュメント化） ==========
COMMENT ON COLUMN users.auth_id IS 'Supabase Auth の UUID と紐付けるための識別子';

-- 逆マイグレーション（必要時の参考）
-- DROP INDEX IF EXISTS idx_users_auth_id;
-- ALTER TABLE users DROP COLUMN IF EXISTS auth_id;

