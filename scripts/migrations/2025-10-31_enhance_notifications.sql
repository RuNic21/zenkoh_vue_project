-- notifications 強化マイグレーション
-- 目的: テンプレート/メタ/リトライ/監査の拡張

-- ========== テンプレート/メタ ==========
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS template_id BIGINT;         -- テンプレートID（将来の templates 参照を想定）
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata_json JSONB;        -- 任意メタデータ

-- ========== リトライ管理 ==========
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0; -- リトライ回数

-- ========== 監査 ==========
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id); -- 作成者
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES users(id); -- 更新者


