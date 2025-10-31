# マイグレーションガイド - スキーマ変更対応

## 📋 概要

2025年10月31日のスキーマ変更により、以下のマイグレーションを実行する必要があります:

1. **users テーブル**: `auth_id` カラム追加 (Supabase Auth 連携)
2. **project_members テーブル**: 新規作成 (プロジェクトメンバー管理)
3. **情報スキーマビュー**: `information_schema_columns` ビュー公開

## 🚀 マイグレーション手順

### 1. Supabase SQL エディタでマイグレーションを実行

#### ステップ 1: users テーブルに auth_id カラムを追加

```sql
-- scripts/migrations/2025-01-XX_add_auth_id_to_users.sql
-- Supabase Auth UUID と users テーブルを連携

-- auth_id カラム追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- インデックス追加（検索高速化）
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- コメント追加
COMMENT ON COLUMN users.auth_id IS 'Supabase Auth の UUID と紐付けるための識別子';
```

#### ステップ 2: project_members テーブルを作成

```sql
-- scripts/migrations/2025-10-31_create_project_members.sql
-- プロジェクト単位のメンバー/権限管理

CREATE TABLE IF NOT EXISTS project_members (
  project_id BIGINT NOT NULL REFERENCES projects(id), -- プロジェクトID
  user_id BIGINT NOT NULL REFERENCES users(id),       -- ユーザーID
  role TEXT NOT NULL,                                 -- 'OWNER' | 'CONTRIBUTOR' | 'REVIEWER'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),       -- 参加日時
  PRIMARY KEY (project_id, user_id)
);

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
```

#### ステップ 3: information_schema_columns ビューを公開

```sql
-- scripts/migrations/2025-10-31_expose_information_schema_columns_view.sql
-- REST API 経由でカラム情報を取得可能にする

CREATE OR REPLACE VIEW public.information_schema_columns AS
SELECT 
  c.table_schema,
  c.table_name,
  c.column_name,
  c.is_nullable,
  c.data_type,
  c.udt_name,
  c.column_default,
  c.is_identity
FROM information_schema.columns c
WHERE c.table_schema = 'public';
```

**重要**: Supabase ダッシュボードで `information_schema_columns` ビューを API に公開する設定を行ってください。

### 2. テーブル権限の設定（RLS）

project_members テーブルに RLS (Row Level Security) を設定する場合:

```sql
-- RLS を有効化
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは自分が所属するプロジェクトのメンバー情報を閲覧可能
CREATE POLICY "Users can view project members of their projects"
  ON project_members
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_id FROM users u
      INNER JOIN project_members pm ON u.id = pm.user_id
      WHERE pm.project_id = project_members.project_id
    )
  );

-- プロジェクトオーナーはメンバーを追加・削除可能
CREATE POLICY "Project owners can manage members"
  ON project_members
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT u.auth_id FROM users u
      INNER JOIN projects p ON p.owner_user_id = u.id
      WHERE p.id = project_members.project_id
    )
  );
```

### 3. データマイグレーション（既存データがある場合）

既存のプロジェクトにデフォルトメンバーを追加する場合:

```sql
-- プロジェクトオーナーを project_members に追加
INSERT INTO project_members (project_id, user_id, role)
SELECT 
  p.id AS project_id,
  p.owner_user_id AS user_id,
  'OWNER' AS role
FROM projects p
WHERE p.owner_user_id IS NOT NULL
ON CONFLICT (project_id, user_id) DO NOTHING;
```

## 🧪 マイグレーション検証

マイグレーション後、以下のスクリプトで検証してください:

```bash
# 1. 環境変数テスト
npm run test:env

# 2. データクリア（オプション - テスト環境のみ）
node scripts/clear-all-data.mjs

# 3. 新しいシードデータ投入
node scripts/seed-all.mjs

# 4. レコード数確認
node scripts/debug-count.mjs

# 5. CRUD テスト
npm run test:crud:all
```

## 📊 期待される結果

```
=== データベーステーブルのレコード数 ===
users: count=5
projects: count=3
project_members: count=11
tasks: count=30
task_members: count=30
boards: count=6
board_columns: count=18
alert_rules: count=3
notifications: count=30
==========================================
```

## ⚠️ 注意事項

1. **本番環境**: マイグレーション前に必ずバックアップを取得してください
2. **auth_id**: 既存ユーザーの auth_id は NULL のまま（Supabase Auth でサインアップ時に設定）
3. **project_members**: 既存プロジェクトの owner を自動追加する場合は上記の INSERT クエリを実行
4. **RLS**: セキュリティ要件に応じて RLS ポリシーを調整してください

## 🔄 ロールバック（必要時）

マイグレーションを元に戻す場合:

```sql
-- project_members テーブルを削除
DROP TABLE IF EXISTS project_members CASCADE;

-- users テーブルの auth_id カラムを削除
DROP INDEX IF EXISTS idx_users_auth_id;
ALTER TABLE users DROP COLUMN IF EXISTS auth_id;

-- information_schema_columns ビューを削除
DROP VIEW IF EXISTS public.information_schema_columns;
```

## 📚 関連ドキュメント

- [データベーススキーマ](./database-schema.md)
- [データベース統合ガイド](./database-integration-guide.md)
- [README](../README.md)

