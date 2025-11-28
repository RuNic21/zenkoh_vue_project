# タグ機能ガイド

## 📋 概要

タグ機能により、タスクにタグを付与して分類・検索・フィルタリングが可能になります。このガイドでは、タグ機能の使用方法、テスト手順、拡張機能の実装方法を説明します。

## ✅ 実装完了内容

1. ✅ データベースマイグレーション: `scripts/migrations/2025-01-XX_add_tags_to_tasks.sql`
2. ✅ 型定義更新: `src/types/task.ts` (Task, TaskInsert, TaskUpdate)
3. ✅ データ変換ロジック: `src/utils/taskAdapter.ts`
4. ✅ UI実装: タスク詳細ページにタグ管理機能を追加

## 🚀 マイグレーション実行

### 前提条件

- Supabase プロジェクトにアクセスできること
- Supabase Dashboard の SQL Editor にアクセスできること

### 実行手順

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. 対象のプロジェクトを選択
3. 左サイドバーから **SQL Editor** をクリック
4. 以下のSQLを実行:

```sql
-- tags カラム追加
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- インデックス追加（タグ検索の高速化）
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN (tags);

-- コメント追加
COMMENT ON COLUMN tasks.tags IS 'タスクに付与されたタグの配列。分類・検索・フィルタリングに使用';

-- 既存データの初期化
UPDATE tasks SET tags = ARRAY[]::TEXT[] WHERE tags IS NULL;
```

### 検証

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
```

**期待される結果**:
- `column_name`: `tags`
- `data_type`: `ARRAY`
- `column_default`: `ARRAY[]::text[]`
- `is_nullable`: `YES`
- `indexname`: `idx_tasks_tags`

詳細は [マイグレーションガイド](./migration-guide.md) を参照してください。

## 📖 使用方法

### 1. タスクへのタグ付与

**場所**: タスク詳細ページ (`ScheduleDetail.vue`)

**手順**:
1. タスク詳細ページを開く
2. 「編集」ボタンをクリック
3. 「タグを管理」ボタンをクリック
4. 新しいタグを入力して追加、または人気タグから選択
5. 「保存」ボタンをクリック

**活用例**:
- **カテゴリ分類**: "開発", "テスト", "デザイン", "ドキュメント"
- **優先度マーキング**: "重要", "緊急", "要確認"
- **プロジェクト種別**: "新機能", "バグ修正", "リファクタリング"
- **担当チーム**: "フロントエンド", "バックエンド", "インフラ"
- **状態管理**: "レビュー待ち", "承認待ち", "保留"

### 2. 人気タグの表示

**機能**: 実際に使用されたタグが「人気タグ」として自動表示されます

**メリット**:
- 既存のタグを再利用して一貫性を保つ
- 新しいタグの作成を減らしてタグの重複を防ぐ
- チーム全体で使用されているタグを把握できる

### 3. タグの永続化

**機能**: タグはデータベースに保存され、ページをリロードしても保持されます

**メリット**:
- タスクの分類情報が失われない
- 長期的なタスク管理が可能
- チームメンバー間でタグ情報を共有できる

## 🧪 テスト手順

### ステップ1: 開発サーバー起動

```bash
npm run dev
```

### ステップ2: タグ保存テスト

1. ブラウザでダッシュボードを開く
2. 任意のタスクの詳細ページに移動
3. 「編集」ボタンをクリック
4. 「タグを管理」ボタンをクリック
5. タグを追加（例: "重要", "緊急", "バグ修正"）
6. 「保存」ボタンをクリック

**確認方法**:
```sql
-- DBで直接確認
SELECT id, task_name, tags 
FROM tasks 
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;
```

**期待される結果**: 追加したタグが配列形式で保存されている

### ステップ3: タグロードテスト

1. ブラウザでページをリロード（F5）
2. 同じタスクの詳細ページを開く
3. タグが表示されていることを確認

**確認ポイント**:
- ✅ タグが正しく表示される
- ✅ タグの削除ボタンが機能する
- ✅ 編集モードでタグを追加/削除できる

### ステップ4: 複数タスクでのテスト

1. 異なるタスクでタグを追加
2. 各タスクのタグが独立して保存されることを確認
3. 人気タグが正しく集計されることを確認

### ステップ5: 人気タグ表示テスト

1. 複数のタスクに異なるタグを追加
2. タグ管理モーダルを開く
3. 「人気タグ」セクションに実際に使用されたタグが表示されることを確認

**期待される動作**:
- ✅ 実際に使用されたタグが「人気タグ」として表示される
- ✅ 既に選択済みのタグは無効化される

## 🐛 トラブルシューティング

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
- TypeScript の型チェックを実行

**解決方法**:
```bash
# 型定義を再生成（オプション）
npm run types:gen
```

## 🎯 実装可能な拡張機能

### 1. タグによるフィルタリング

**実装場所**: `src/composables/useDashboard.ts`, `src/composables/useScheduleList.ts`

**実装方法**:
```typescript
// タグフィルタを追加
const tagFilter = ref<string[]>([]);

// フィルタリングロジックに追加
const filteredTasks = computed(() => {
  let filtered = taskProgressList.value;
  
  // タグフィルタ（選択したタグのいずれかを含むタスクを表示）
  if (tagFilter.value.length > 0) {
    filtered = filtered.filter((task) => {
      const taskTags = task.tags || [];
      return tagFilter.value.some(tag => taskTags.includes(tag));
    });
  }
  
  return filtered;
});
```

**活用例**:
- 「重要」タグが付いたタスクのみ表示
- 「バグ修正」と「緊急」タグの両方を持つタスクを検索
- 特定のプロジェクト種別のタスクを一覧表示

### 2. タグによる検索

**実装場所**: `src/composables/useScheduleList.ts`

**実装方法**:
```typescript
// 検索クエリにタグを含める
if (searchQuery.value) {
  const query = searchQuery.value.toLowerCase().trim();
  filtered = filtered.filter((s) => {
    const searchableText = [
      s.title,
      s.description || "",
      ...(s.tags || []) // タグも検索対象に追加
    ].join(" ").toLowerCase();
    return searchableText.includes(query);
  });
}
```

### 3. タグ別統計情報

**実装場所**: `src/services/dashboardService.ts`

**実装方法**:
```typescript
// タグ別のタスク数を集計
export async function getTagStatistics(): Promise<{
  tag: string;
  count: number;
  tasks: Task[];
}[]> {
  const { data } = await supabase
    .from('tasks')
    .select('id, task_name, tags')
    .not('tags', 'is', null);
  
  const tagMap = new Map<string, Task[]>();
  
  data?.forEach(task => {
    (task.tags || []).forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag)!.push(task);
    });
  });
  
  return Array.from(tagMap.entries()).map(([tag, tasks]) => ({
    tag,
    count: tasks.length,
    tasks
  })).sort((a, b) => b.count - a.count);
}
```

### 4. タグによるグループ化

**実装場所**: `src/pages/ScheduleList.vue` または新規コンポーネント

**実装方法**:
```typescript
// タグでグループ化
const groupedByTag = computed(() => {
  const groups = new Map<string, ScheduleItem[]>();
  
  schedules.value.forEach(schedule => {
    const tags = schedule.tags || [];
    if (tags.length === 0) {
      const key = '未分類';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(schedule);
    } else {
      tags.forEach(tag => {
        if (!groups.has(tag)) groups.set(tag, []);
        groups.get(tag)!.push(schedule);
      });
    }
  });
  
  return Array.from(groups.entries()).map(([tag, items]) => ({
    tag,
    items,
    count: items.length
  }));
});
```

### 5. タグの色分け表示

**実装場所**: `src/components/common/TagBadge.vue` (新規作成)

**実装方法**:
```vue
<script setup lang="ts">
const props = defineProps<{
  tag: string;
}>();

// タグの種類に応じて色を決定
const tagColor = computed(() => {
  const tagColors: Record<string, string> = {
    '重要': 'danger',
    '緊急': 'warning',
    'バグ修正': 'danger',
    '新機能': 'success',
    'レビュー待ち': 'info',
  };
  return tagColors[props.tag] || 'secondary';
});
</script>

<template>
  <span :class="`badge bg-${tagColor}`">
    {{ tag }}
  </span>
</template>
```

## 📊 データベースクエリ例

### 特定のタグを持つタスクを取得

```sql
-- 「重要」タグが付いたタスクを取得
SELECT * FROM tasks 
WHERE '重要' = ANY(tags);
```

### 複数のタグのいずれかを持つタスクを取得

```sql
-- 「緊急」または「重要」タグが付いたタスクを取得
SELECT * FROM tasks 
WHERE tags && ARRAY['緊急', '重要'];
```

### 特定のタグをすべて持つタスクを取得

```sql
-- 「バグ修正」と「緊急」の両方のタグを持つタスクを取得
SELECT * FROM tasks 
WHERE tags @> ARRAY['バグ修正', '緊急'];
```

### タグ別のタスク数を集計

```sql
-- タグごとのタスク数を集計
SELECT 
  unnest(tags) as tag,
  COUNT(*) as task_count
FROM tasks
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
GROUP BY tag
ORDER BY task_count DESC;
```

## 💡 実用的な活用シナリオ

### シナリオ1: バグ管理

**タグ**: "バグ", "緊急", "要確認", "修正済み"

**活用方法**:
1. バグ報告時に「バグ」タグを付与
2. 緊急度に応じて「緊急」タグも追加
3. タグでフィルタしてバグ一覧を表示
4. 修正後は「修正済み」タグを追加

### シナリオ2: プロジェクト種別管理

**タグ**: "新機能", "改善", "リファクタリング", "ドキュメント"

**活用方法**:
1. タスク作成時に種別タグを付与
2. タグ別に進捗を集計
3. プロジェクト種別ごとの工数を見積もり

### シナリオ3: チーム別タスク管理

**タグ**: "フロントエンド", "バックエンド", "インフラ", "デザイン"

**活用方法**:
1. 担当チームのタグを付与
2. チーム別にタスクをフィルタ
3. チームごとの負荷を可視化

## 📝 ベストプラクティス

### 1. タグの命名規則

- **一貫性**: 同じ概念には同じタグを使用
- **簡潔性**: 短く、わかりやすい名前
- **階層化**: 必要に応じて "カテゴリ:詳細" 形式（例: "バグ:UI", "バグ:API"）

### 2. タグの数

- **適切な数**: タスクあたり 2-5 個のタグが目安
- **過剰なタグ**: 10個以上のタグは管理が困難

### 3. タグの整理

- **定期的な見直し**: 使用されていないタグを削除
- **統合**: 類似したタグを統合して一貫性を保つ
- **ドキュメント化**: チームで使用するタグの意味を文書化

## ✅ 期待される動作

以下のすべてが動作すれば、タグ機能は正常に実装されています:

1. ✅ タグを追加して保存すると、DBに保存される
2. ✅ ページをリロードしてもタグが保持される
3. ✅ 複数のタグを追加できる
4. ✅ タグを削除できる
5. ✅ 人気タグが実際の使用タグから表示される

## 🚀 次のステップ

機能が正常に動作することを確認したら、以下の拡張機能を実装できます:

1. **タグフィルタリング機能の実装** (優先度: 高)
2. **タグ別統計情報の表示** (優先度: 中)
3. **タグの色分け表示** (優先度: 中)
4. **タグによるグループ化** (優先度: 低)

これらの機能を段階的に実装することで、タグ機能の価値を最大化できます。

## 📚 関連ドキュメント

- [マイグレーションガイド](./migration-guide.md) - マイグレーション手順
- [データベーススキーマ](./database-schema.md) - データベース構造
- [データベース統合ガイド](./database-guide.md) - データベース統合の詳細

---

**最終更新**: 2025-01-XX  
**ステータス**: ✅ 実装完了

