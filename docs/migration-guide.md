# マイグレーションガイド

## 📋 概要

このガイドでは、Zenkoh Project Scheduler のデータベーススキーマ変更に伴うマイグレーション手順を説明します。

## 🚀 主要マイグレーション

### 1. 認証システム統合（users テーブル）

#### 目的
Supabase Auth と users テーブルを連携するため、`auth_id` カラムと `role` カラムを追加します。

#### 実行手順

Supabase ダッシュボードの SQL Editor で以下を実行:

```sql
-- 1. auth_id カラムの追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
COMMENT ON COLUMN users.auth_id IS 'Supabase Auth の UUID と紐付けるための識別子';

-- 2. role カラムの追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' 
  CHECK (role IN ('admin', 'manager', 'member', 'viewer'));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. 既存ユーザーにデフォルト権限を設定
UPDATE users SET role = 'member' WHERE role IS NULL;
```

または、マイグレーションスクリプトを使用:
- `scripts/migrations/2025-01-XX_add_auth_id_to_users.sql`
- `scripts/migrations/2025-01-XX_add_role_to_users.sql`

詳細は [認証システム統合ガイド](./auth-system-guide.md) を参照してください。

---

### 2. プロジェクトメンバー管理（project_members テーブル）

#### 目的
プロジェクト単位のメンバー/権限管理を実現するため、`project_members` テーブルを作成します。

#### 実行手順

```sql
-- project_members テーブル作成
CREATE TABLE IF NOT EXISTS project_members (
  project_id BIGINT NOT NULL REFERENCES projects(id),
  user_id BIGINT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL,  -- 'OWNER' | 'CONTRIBUTOR' | 'REVIEWER'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
```

#### データマイグレーション（既存データがある場合）

既存のプロジェクトにデフォルトメンバーを追加:

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

#### RLS（Row Level Security）設定（オプション）

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

---

### 3. 情報スキーマビュー公開

#### 目的
REST API 経由でカラム情報を取得可能にするため、`information_schema_columns` ビューを公開します。

#### 実行手順

```sql
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

---

### 4. タグ機能追加（tasks テーブル）

#### 目的
タスクにタグを付与して分類・検索を可能にするため、`tags` カラムを追加します。

#### 実行手順

```sql
-- tags カラム追加
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- インデックス追加（タグ検索の高速化）
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN (tags);

-- コメント追加
COMMENT ON COLUMN tasks.tags IS 'タスクに付与されたタグの配列。分類・検索・フィルタリングに使用';

-- 既存データの初期化（既存タスクの tags が NULL の場合は空配列に設定）
UPDATE tasks SET tags = ARRAY[]::TEXT[] WHERE tags IS NULL;
```

#### 検証

マイグレーションが正常に実行されたことを確認:

```sql
-- スキーマ確認
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'tags';

-- インデックス確認
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'tasks' AND indexname = 'idx_tasks_tags';

-- 既存データ確認
SELECT 
  id, 
  task_name, 
  tags,
  array_length(tags, 1) as tag_count
FROM tasks 
LIMIT 10;
```

**期待される結果**:
- `column_name`: `tags`
- `data_type`: `ARRAY`
- `column_default`: `ARRAY[]::text[]`
- `is_nullable`: `YES`
- `indexname`: `idx_tasks_tags`

詳細は [タグ機能ガイド](./tag-feature-guide.md) を参照してください。

---

## 🧪 マイグレーション検証

### 1. 環境変数テスト

```bash
npm run test:env
```

### 2. スキーマ確認

```bash
npm run check:schema
```

### 3. CRUD テスト

```bash
npm run test:crud:all
```

### 4. データ確認

```bash
npm run debug:count
```

### 5. シードデータ再生成（必要に応じて）

```bash
# データクリア（テスト環境のみ）
node scripts/clear-all-data.mjs

# シードデータ投入
npm run seed:all
```

## 📊 期待される結果

マイグレーション完了後のレコード数:

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

### 1. 本番環境

- **マイグレーション前に必ずバックアップを取得してください**
- テスト環境で先に実行して動作確認を行ってください

### 2. 既存データ

- **auth_id**: 既存ユーザーの `auth_id` は NULL のまま（Supabase Auth でサインアップ時に設定）
- **project_members**: 既存プロジェクトの owner を自動追加する場合は上記の INSERT クエリを実行
- **tags**: 既存タスクの `tags` は空配列に初期化されます

### 3. RLS（Row Level Security）

セキュリティ要件に応じて RLS ポリシーを調整してください。

### 4. 型定義の再生成

データベーススキーマ変更後、型定義を再生成:

```bash
npm run types:gen
```

**注意**: 手動で追加したフィールド（例: `role`）が上書きされる可能性があります。再生成後は必要に応じて手動で調整してください。

## 🔄 ロールバック（必要時）

### users テーブルの変更を元に戻す

```sql
-- role カラムを削除
DROP INDEX IF EXISTS idx_users_role;
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- auth_id カラムを削除
DROP INDEX IF EXISTS idx_users_auth_id;
ALTER TABLE users DROP COLUMN IF EXISTS auth_id;
```

### project_members テーブルを削除

```sql
DROP TABLE IF EXISTS project_members CASCADE;
```

### information_schema_columns ビューを削除

```sql
DROP VIEW IF EXISTS public.information_schema_columns;
```

### tags カラムを削除

```sql
-- インデックスを削除
DROP INDEX IF EXISTS idx_tasks_tags;

-- カラムを削除（注意: データが失われます）
ALTER TABLE tasks DROP COLUMN IF EXISTS tags;
```

**警告**: カラムを削除すると、すべてのデータが失われます。実行前に必ずバックアップを取得してください。

## 🐛 トラブルシューティング

### 問題1: "column already exists" エラー

**原因**: 既にカラムが存在している

**解決方法**: 
- `IF NOT EXISTS` 句により自動的にスキップされるため、エラーは無視して問題ありません
- または、マイグレーションの最初の行を削除して再実行

### 問題2: "permission denied" エラー

**原因**: データベースへの書き込み権限がない

**解決方法**:
- Supabase プロジェクトの管理者に権限を確認
- または、プロジェクトのオーナーアカウントで実行

### 問題3: インデックス作成に失敗

**原因**: インデックス作成に必要な権限がない、または既に存在

**解決方法**:
- `IF NOT EXISTS` 句により自動的にスキップされるため、エラーは無視して問題ありません
- インデックスはオプション機能のため、作成に失敗しても機能は動作します（検索性能が低下する可能性あり）

### 問題4: 型定義の不一致

**症状**: TypeScript エラー、実行時エラー

**解決方法**:
1. DBスキーマを確認
2. `npm run types:gen` で型を再生成
3. 必要に応じて手動で調整

## 📚 関連ドキュメント

- [認証システム統合ガイド](./auth-system-guide.md) - 認証システムの詳細
- [タグ機能ガイド](./tag-feature-guide.md) - タグ機能の使用方法
- [データベーススキーマ](./database-schema.md) - データベーススキーマ全体
- [データベース統合ガイド](./database-guide.md) - データベース統合の詳細
- [README](../README.md) - プロジェクト全体の説明

---

**最終更新**: 2025-01-XX  
**ステータス**: ✅ 最新

