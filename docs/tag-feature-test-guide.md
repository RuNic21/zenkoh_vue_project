# タグ機能テストガイド

## 実装完了内容

1. ✅ データベースマイグレーション: `scripts/migrations/2025-01-XX_add_tags_to_tasks.sql`
2. ✅ 型定義更新: `src/types/task.ts` (Task, TaskInsert, TaskUpdate)
3. ✅ データ変換ロジック: `src/utils/taskAdapter.ts`

## テスト手順

### ステップ1: データベースマイグレーション実行

Supabase Dashboard の SQL Editor で以下を実行:

```sql
-- scripts/migrations/2025-01-XX_add_tags_to_tasks.sql の内容を実行
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN (tags);
COMMENT ON COLUMN tasks.tags IS 'タスクに付与されたタグの配列。分類・検索・フィルタリングに使用';
UPDATE tasks SET tags = ARRAY[]::TEXT[] WHERE tags IS NULL;
```

**確認方法**:
```sql
-- スキーマ確認
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'tags';

-- 期待される結果: data_type = 'ARRAY', column_default = 'ARRAY[]::text[]'
```

### ステップ2: 開発サーバー起動

```bash
npm run dev
```

### ステップ3: タグ保存テスト

1. ブラウザでダッシュボードを開く
2. 任意のタスクの詳細ページに移動
3. 「編集」ボタンをクリック
4. 「タグを管理」ボタンをクリック
5. タグを追加（例: "重要", "緊急", "バグ修正"）
6. 「保存」ボタンをクリック

**確認方法**:
```sql
-- DBで直接確認
SELECT id, task_name, tags FROM tasks WHERE id = <タスクID>;

-- 期待される結果: tags = ARRAY['重要', '緊急', 'バグ修正']
```

### ステップ4: タグロードテスト

1. ブラウザでページをリロード（F5）
2. 同じタスクの詳細ページを開く
3. タグが表示されていることを確認

**確認ポイント**:
- タグが正しく表示される
- タグの削除ボタンが機能する
- 編集モードでタグを追加/削除できる

### ステップ5: 複数タスクでのテスト

1. 異なるタスクでタグを追加
2. 各タスクのタグが独立して保存されることを確認
3. タスク一覧ページでタグが表示されるか確認（該当機能がある場合）

## トラブルシューティング

### 問題1: タグが保存されない

**確認事項**:
- マイグレーションが正常に実行されたか確認
- ブラウザのコンソールでエラーがないか確認
- ネットワークタブでAPIリクエストが成功しているか確認

**解決方法**:
```sql
-- タグカラムが存在するか確認
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'tags';

-- 存在しない場合はマイグレーションを再実行
```

### 問題2: タグが表示されない

**確認事項**:
- `taskAdapter.ts` の `taskToScheduleItem` 関数が正しく実装されているか
- DBから取得したタスクデータに `tags` フィールドが含まれているか

**デバッグ方法**:
```javascript
// ブラウザのコンソールで確認
console.log('Task data:', taskData);
console.log('Tags:', taskData.tags);
```

### 問題3: 型エラーが発生する

**確認事項**:
- `src/types/task.ts` に `tags?: string[] | null` が追加されているか
- TypeScript の型チェックを実行: `npm run type-check` (存在する場合)

**解決方法**:
```bash
# 型定義を再生成（オプション）
npm run types:gen
```

## 期待される動作

1. ✅ タグを追加して保存すると、DBに保存される
2. ✅ ページをリロードしてもタグが保持される
3. ✅ 複数のタグを追加できる
4. ✅ タグを削除できる
5. ✅ 空のタグは追加できない（既存の `addTag` 関数で処理済み）

## 次のステップ（オプション）

- タグによるフィルタリング機能の実装
- タグ別の統計情報表示
- 人気タグの自動補完機能の改善
- タグの色分け表示

