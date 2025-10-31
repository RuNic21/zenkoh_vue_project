-- alert_rules 監査カラムとインデックス追加

-- ========== 監査 ==========
ALTER TABLE alert_rules ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id); -- 作成者
ALTER TABLE alert_rules ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES users(id); -- 更新者

-- ========== インデックス ==========
CREATE INDEX IF NOT EXISTS idx_alert_rules_project ON alert_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(is_enabled);


