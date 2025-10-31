-- task_members 拡張マイグレーション
-- 目的: 参加日時と（必要に応じて）監査用カラムを追加

-- ========== 参加日時 ==========
ALTER TABLE task_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(); -- 参加日時

-- ========== 監査（任意） ==========
ALTER TABLE task_members ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id); -- 作成者
ALTER TABLE task_members ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES users(id); -- 更新者

-- インデックス（頻出クエリ最適化）
CREATE INDEX IF NOT EXISTS idx_task_members_user ON task_members(user_id);
CREATE INDEX IF NOT EXISTS idx_task_members_task ON task_members(task_id);


