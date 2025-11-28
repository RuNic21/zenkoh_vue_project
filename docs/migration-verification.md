# タグ機能マイグレーション検証ガイド

## マイグレーション完了後の確認事項

### 1. データベーススキーマ確認

Supabase Dashboard の SQL Editor で以下を実行して、`tags` カラムが正しく追加されたことを確認:

```sql
-- スキーマ確認
SELECT 
  column_name, 
  data_type, 
  udt_name,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'tags';
```

**期待される結果**:
- `column_name`: `tags`
- `data_type`: `ARRAY`
- `udt_name`: `_text` (PostgreSQL の TEXT[] 型)
- `column_default`: `ARRAY[]::text[]`
- `is_nullable`: `YES`

### 2. インデックス確認

GIN インデックスが作成されたことを確認:

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

### 3. 既存データ確認

既存タスクの `tags` が空配列に初期化されていることを確認:

```sql
-- 既存タスクのtags確認
SELECT 
  id, 
  task_name, 
  tags,
  array_length(tags, 1) as tag_count
FROM tasks 
LIMIT 10;
```

**期待される結果**:
- `tags` が `{}` (空配列) または `NULL` でないこと
- `tag_count` が `0` または `NULL`

### 4. 型定義確認（オプション）

`src/types/db/tasks.ts` は自動生成ファイルですが、手動で確認する場合:

```typescript
// src/types/db/tasks.ts に tags フィールドが含まれているか確認
export interface Tasks {
  // ... 他のフィールド ...
  tags?: string[] | null;  // この行が存在するか確認
}
```

**注意**: 自動生成スクリプト (`npm run types:gen`) に問題がある場合は、手動で追加する必要があります。ただし、`src/types/task.ts` には既に `tags` フィールドが追加されているため、機能には影響しません。

## 機能テスト

### ステップ1: 開発サーバー起動

```bash
npm run dev
```

### ステップ2: タグ追加テスト

1. ブラウザでダッシュボードを開く
2. 任意のタスクの詳細ページに移動
3. 「編集」ボタンをクリック
4. 「タグを管理」ボタンをクリック
5. タグを追加（例: "重要", "緊急", "バグ修正"）
6. 「保存」ボタンをクリック

### ステップ3: DB保存確認

Supabase Dashboard の SQL Editor で以下を実行:

```sql
-- 保存されたタグを確認
SELECT 
  id, 
  task_name, 
  tags,
  array_length(tags, 1) as tag_count
FROM tasks 
WHERE tags IS NOT NULL 
  AND array_length(tags, 1) > 0;
```

**期待される結果**:
- 追加したタグが配列形式で保存されている
- 例: `tags = ARRAY['重要', '緊急', 'バグ修正']`

### ステップ4: ページリロードテスト

1. ブラウザでページをリロード（F5）
2. 同じタスクの詳細ページを開く
3. タグが表示されていることを確認

**期待される動作**:
- ✅ タグが正しく表示される
- ✅ タグの削除ボタンが機能する
- ✅ 編集モードでタグを追加/削除できる

### ステップ5: 人気タグ表示テスト

1. 複数のタスクに異なるタグを追加
2. タグ管理モーダルを開く
3. 「人気タグ」セクションに実際に使用されたタグが表示されることを確認

**期待される動作**:
- ✅ 実際に使用されたタグが「人気タグ」として表示される
- ✅ 既に選択済みのタグは無効化される

## トラブルシューティング

### 問題1: タグが保存されない

**確認事項**:
- ブラウザのコンソールでエラーがないか確認
- ネットワークタブでAPIリクエストが成功しているか確認
- DBの `tags` カラムが正しく追加されているか確認

**解決方法**:
```sql
-- tagsカラムの存在確認
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
- TypeScript の型チェックを実行

**解決方法**:
- `src/types/task.ts` を確認（既に追加済み）
- 必要に応じて `src/types/db/tasks.ts` を手動で更新（自動生成ファイルだが、一時的に）

## 成功の確認

以下のすべてが動作すれば、マイグレーションは成功です:

1. ✅ タグを追加して保存すると、DBに保存される
2. ✅ ページをリロードしてもタグが保持される
3. ✅ 複数のタグを追加できる
4. ✅ タグを削除できる
5. ✅ 人気タグが実際の使用タグから表示される

## 次のステップ

機能が正常に動作することを確認したら:

- タグによるフィルタリング機能の実装（オプション）
- タグ別の統計情報表示（オプション）
- タグの色分け表示（オプション）

