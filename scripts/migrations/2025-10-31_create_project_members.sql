-- project_members 新規作成マイグレーション
-- 目的: プロジェクト単位のメンバー/権限管理を実現

CREATE TABLE IF NOT EXISTS project_members (
  project_id BIGINT NOT NULL REFERENCES projects(id), -- プロジェクトID
  user_id BIGINT NOT NULL REFERENCES users(id),       -- ユーザーID
  role TEXT NOT NULL,                                 -- 'OWNER' | 'CONTRIBUTOR' | 'REVIEWER'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),       -- 参加日時
  PRIMARY KEY (project_id, user_id)
);

-- アクセス頻度の高い組み合わせにインデックスを付与
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);


