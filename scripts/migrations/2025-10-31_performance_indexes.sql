-- パフォーマンス最適化用インデックス

-- tasks: プロジェクト別の現役タスク取得を高速化
CREATE INDEX IF NOT EXISTS idx_tasks_project_active ON tasks(project_id) WHERE is_archived = false;

-- tasks: 状態別集計/検索
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- tasks: 担当者別検索
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(primary_assignee_id);

-- tasks: 更新日時降順利用の高速化
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at DESC);

-- boards/board_columns: リレーション辿り
CREATE INDEX IF NOT EXISTS idx_boards_project ON boards(project_id);
CREATE INDEX IF NOT EXISTS idx_board_columns_board ON board_columns(board_id);


