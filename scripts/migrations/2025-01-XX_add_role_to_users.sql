-- ユーザー権限管理: users テーブルに role カラムを追加
-- 目的: ユーザー権限（admin, manager, member, viewer）を管理
--
-- 背景:
-- - 認証システム統合により、ユーザー権限管理が必要
-- - Supabase Auth のみでは権限管理ができないため、users テーブルで管理

-- ========== role カラム追加 ==========
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer'));

-- ========== インデックス追加 ==========
-- role で検索する場合に備えてインデックスを追加
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ========== コメント追加（ドキュメント化） ==========
COMMENT ON COLUMN users.role IS 'ユーザー権限: admin, manager, member, viewer';

-- 既存ユーザーにデフォルト権限を設定（既に role が NULL の場合）
UPDATE users SET role = 'member' WHERE role IS NULL;

-- 逆マイグレーション（必要時の参考）
-- DROP INDEX IF EXISTS idx_users_role;
-- ALTER TABLE users DROP COLUMN IF EXISTS role;

