# タグ機能マイグレーション実行ガイド

## 概要

このガイドでは、`tasks` テーブルに `tags` カラムを追加するマイグレーションを実行する手順を説明します。

## 前提条件

- Supabase プロジェクトにアクセスできること
- Supabase Dashboard の SQL Editor にアクセスできること

## 実行手順

### ステップ1: Supabase Dashboard にアクセス

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. 対象のプロジェクトを選択
3. 左サイドバーから **SQL Editor** をクリック

### ステップ2: マイグレーションSQLを実行

1. SQL Editor で **New query** をクリック
2. 以下のSQLをコピー＆ペースト（または `scripts/migrations/2025-01-XX_add_tags_to_tasks.sql` ファイルの内容をコピー）

```sql
-- タグ機能追加: tasks テーブルに tags カラムを追加
-- 目的: タスクにタグを付与して分類・検索を可能にする

-- ========== tags カラム追加 ==========
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ========== インデックス追加（オプション） ==========
-- タグ検索の高速化のため、GIN インデックスを追加
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN (tags);

-- ========== コメント追加（ドキュメント化） ==========
COMMENT ON COLUMN tasks.tags IS 'タスクに付与されたタグの配列。分類・検索・フィルタリングに使用';

-- ========== 既存データの初期化（オプション） ==========
-- 既存タスクの tags が NULL の場合は空配列に設定
UPDATE tasks SET tags = ARRAY[]::TEXT[] WHERE tags IS NULL;
```

3. **Run** ボタンをクリックして実行

### ステップ3: 実行結果の確認

**成功時の表示**:
```
Success. No rows returned
```

または

```
Success. X rows affected
```

**エラー時の対処**:
- エラーメッセージを確認
- 既に `tags` カラムが存在する場合は、`ADD COLUMN IF NOT EXISTS` によりスキップされます
- その他のエラーは、Supabase のログを確認してください

### ステップ4: スキーマ確認

マイグレーションが正常に実行されたことを確認するため、以下のSQLを実行:

```sql
-- スキーマ確認
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'tags';
```

**期待される結果**:
- `column_name`: `tags`
- `data_type`: `ARRAY`
- `column_default`: `ARRAY[]::text[]`
- `is_nullable`: `YES`

### ステップ5: インデックス確認（オプション）

GINインデックスが作成されたことを確認:

```sql
-- インデックス確認
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'tasks' AND indexname = 'idx_tasks_tags';
```

**期待される結果**:
- `indexname`: `idx_tasks_tags`
- `indexdef`: `CREATE INDEX idx_tasks_tags ON public.tasks USING gin (tags)`

## トラブルシューティング

### 問題1: "column already exists" エラー

**原因**: 既に `tags` カラムが存在している

**解決方法**: 
- `IF NOT EXISTS` 句により自動的にスキップされるため、エラーは無視して問題ありません
- または、マイグレーションの最初の行を削除して再実行

### 問題2: "permission denied" エラー

**原因**: データベースへの書き込み権限がない

**解決方法**:
- Supabase プロジェクトの管理者に権限を確認
- または、プロジェクトのオーナーアカウントで実行

### 問題3: インデックス作成に失敗

**原因**: GIN インデックス作成に必要な権限がない、または既に存在

**解決方法**:
- `IF NOT EXISTS` 句により自動的にスキップされるため、エラーは無視して問題ありません
- インデックスはオプション機能のため、作成に失敗してもタグ機能は動作します（検索性能が低下する可能性あり）

## ロールバック（必要時）

マイグレーションを元に戻す場合:

```sql
-- インデックスを削除
DROP INDEX IF EXISTS idx_tasks_tags;

-- カラムを削除（注意: データが失われます）
ALTER TABLE tasks DROP COLUMN IF EXISTS tags;
```

**警告**: カラムを削除すると、すべてのタスクのタグデータが失われます。実行前に必ずバックアップを取得してください。

## 次のステップ

マイグレーション実行後:

1. 開発サーバーを起動: `npm run dev`
2. タスク詳細ページでタグを追加・保存
3. ページをリロードしてタグが保持されることを確認

詳細なテスト手順は `docs/tag-feature-test-guide.md` を参照してください。

