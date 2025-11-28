# タグ機能活用ガイド

## 現在利用可能な機能

### 1. タスクへのタグ付与

**場所**: タスク詳細ページ (`ScheduleDetail.vue`)

**使用方法**:
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

## 実装可能な拡張機能

### 1. タグによるフィルタリング

**実装場所**: `src/composables/useDashboard.ts`, `src/composables/useScheduleList.ts`

**実装方法**:
```typescript
// タグフィルタを追加
const tagFilter = ref<string[]>([]);

// フィルタリングロジックに追加
const filteredTasks = computed(() => {
  let filtered = taskProgressList.value;
  
  // 既存のフィルタ...
  
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

**活用例**:
- "バグ" と検索すると、「バグ修正」タグが付いたタスクも表示
- タグ名で直接検索可能

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

**活用例**:
- ダッシュボードに「タグ別タスク数」チャートを表示
- 最も使用されているタグを可視化
- タグごとの進捗率を集計

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
      // タグなしは「未分類」グループ
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

**活用例**:
- タグごとにタスクをグループ化して表示
- カンバンボードをタグ別に分割
- プロジェクト内でタグ別の進捗を確認

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
    // ... 他のタグ
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

**活用例**:
- 重要度に応じた色分け
- カテゴリ別の色分け
- 視覚的な識別を容易にする

### 6. タグによる自動通知

**実装場所**: `src/services/notificationService.ts`

**実装方法**:
```typescript
// 特定のタグが付いたタスクに通知を送信
export async function notifyTaggedTasks(tag: string, message: string) {
  const { data } = await supabase
    .from('tasks')
    .select('*, primary_assignee_id')
    .contains('tags', [tag]);
  
  // 各タスクの担当者に通知
  for (const task of data || []) {
    if (task.primary_assignee_id) {
      await createNotification({
        user_id: task.primary_assignee_id,
        type: 'task_tagged',
        title: `タグ「${tag}」のタスク`,
        message: message,
        related_task_id: task.id
      });
    }
  }
}
```

**活用例**:
- 「緊急」タグが付いたタスクの担当者に自動通知
- 特定のタグが追加されたときにチームに通知

### 7. タグの自動補完と提案

**実装場所**: `src/components/common/TagManagerModal.vue`

**実装方法**:
```typescript
// 入力中のタグを自動補完
const suggestedTags = computed(() => {
  if (!newTagInput.value) return [];
  
  const input = newTagInput.value.toLowerCase();
  return availableTags.value
    .filter(tag => 
      tag.toLowerCase().includes(input) && 
      !selectedTags.value.includes(tag)
    )
    .slice(0, 5); // 最大5件まで
});
```

**活用例**:
- タグ入力時に類似タグを提案
- タイプミスを防止
- タグの一貫性を向上

## 実用的な活用シナリオ

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

### シナリオ4: レビューフロー管理

**タグ**: "レビュー待ち", "承認待ち", "保留", "完了"

**活用方法**:
1. レビューが必要なタスクに「レビュー待ち」タグを付与
2. タグでフィルタしてレビュー待ちタスクを一覧表示
3. 承認後は「承認待ち」から「完了」に変更

## データベースクエリ例

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

## ベストプラクティス

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

## 次のステップ

1. **タグフィルタリング機能の実装** (優先度: 高)
2. **タグ別統計情報の表示** (優先度: 中)
3. **タグの色分け表示** (優先度: 中)
4. **タグによるグループ化** (優先度: 低)

これらの機能を段階的に実装することで、タグ機能の価値を最大化できます。

