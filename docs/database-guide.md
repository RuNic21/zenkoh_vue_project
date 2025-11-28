# データベース統合ガイド

## 📋 概要

Zenkoh Project Scheduler の Supabase データベース統合に関する開発ルールとガイドラインです。データベースアクセス、型変換、エラー処理、開発ツールの使用方法を説明します。

## 🚀 クイックスタート

### 1. 環境設定

```bash
# 依存関係インストール
npm install

# 環境変数設定 (.env.local ファイル作成)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 接続テスト
npm run test:env
```

### 2. データベース初期化

```bash
# シードデータ生成
npm run seed:all

# データ確認
npm run debug:count
```

### 3. 開発サーバー起動

```bash
npm run dev
```

## 📊 データベース構造

### 主要テーブル

- **projects**: プロジェクト情報
- **tasks**: タスク/スケジュール情報
- **users**: ユーザー情報
- **boards**: カンバンボード
- **board_columns**: ボードカラム
- **task_members**: タスクメンバーシップ
- **project_members**: プロジェクトメンバー（新規）
- **alert_rules**: アラートルール
- **notifications**: 通知履歴

詳細は [データベーススキーマ](./database-schema.md) を参照してください。

### サービス層（12個の専門サービス）

- **基本CRUD**: `crud.ts`, `dbServices.ts`
- **認証**: `authService.ts` (Supabase Auth)
- **専門機能**: `taskService.ts`, `projectService.ts`, `teamService.ts`
- **分析機能**: `dashboardService.ts`, `reportService.ts`
- **通知機能**: `notificationService.ts`, `activityService.ts`
- **関係型データ**: `relationService.ts`

### データフロー

```
プロジェクト作成 → タスク作成 → カンバンボード配置 → 進捗率更新 → 通知送信
```

## 🏗️ アーキテクチャ原則

### 1. 階層化されたデータアクセス

```
UI Layer (Vue Components)
    ↓
Store Layer (Pinia/Reactive Store)
    ↓
Service Layer (taskService, projectService)
    ↓
Adapter Layer (taskAdapter)
    ↓
Database Layer (Supabase)
```

### 2. 型システム構造

- **DB型**: `src/types/db/*.ts` (自動生成、編集禁止)
  - projects.ts, tasks.ts, users.ts, boards.ts, board_columns.ts
  - task_members.ts, notifications.ts, alert_rules.ts
- **ビジネス型**: `src/types/task.ts`, `src/types/project.ts` (手動定義)
- **UI型**: `src/types/schedule.ts` (画面表示用)
- **専門型**: `src/types/team.ts`, `src/types/report.ts`, `src/types/notification.ts`

## 🔧 開発ルール

### 1. データベースアクセスルール

#### ✅ 正しい方法

```typescript
// Store経由でのアクセス
const store = useScheduleStore();
await store.loadAll(); // DBからデータロード
await store.save(item); // DBに保存
await store.create(newItem); // 新規項目作成
await store.delete(id); // 削除
```

#### ❌ 避けるべき方法

```typescript
// 直接Supabase呼び出し（コンポーネントから）
const { data } = await supabase.from("tasks").select("*");

// 直接サービス呼び出し（コンポーネントから）
const tasks = await listTasks();
```

### 2. 型変換ルール

#### Task ↔ ScheduleItem 変換

```typescript
// DB → UI 変換
import { taskToScheduleItem } from "../utils/taskAdapter";
const scheduleItem = taskToScheduleItem(task, users);

// UI → DB 変換
import { scheduleItemToTaskUpdate } from "../utils/taskAdapter";
const taskUpdate = scheduleItemToTaskUpdate(scheduleItem);
```

#### 状態/優先度マッピング

```typescript
// DB状態 → 日本語UI
"NOT_STARTED" → "予定"
"IN_PROGRESS" → "進行中"
"DONE" → "完了"
"DELAYED" → "遅延"

// 優先度マッピング
"HIGH" → "高"
"MEDIUM" → "中"
"LOW" → "低"
```

### 3. エラー処理ルール

#### サービスレイヤーエラー処理

```typescript
export async function createTask(payload: TaskInsert): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .insert([payload])
      .select("*")
      .single();
    
    if (error) {
      console.error("タスク作成に失敗:", error.message);
      return null; // null返却で失敗表示
    }
    return data as Task;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("タスク作成時に予期せぬエラー:", msg);
    return null;
  }
}
```

#### UIエラー処理

```typescript
const saveChanges = async () => {
  try {
    await store.save({ ...editForm.value });
    // 成功処理
  } catch (e) {
    console.error("保存に失敗", e);
    alert("保存に失敗しました"); // ユーザーフレンドリーなメッセージ
  }
};
```

## 📊 データベーススキーマルール

### 1. テーブル関係

- **PROJECTS** → **TASKS** (1:N)
- **TASKS** → **TASK_MEMBERS** (1:N)
- **USERS** → **TASK_MEMBERS** (1:N)
- **PROJECTS** → **BOARDS** (1:N)
- **BOARDS** → **BOARD_COLUMNS** (1:N)
- **USERS** → **NOTIFICATIONS** (1:N)
- **ALERT_RULES** → **NOTIFICATIONS** (1:N)
- **TASKS** → **TASKS** (自己参照: parent_task_id)
- **PROJECTS** → **PROJECT_MEMBERS** (1:N)

### 2. 必須フィールドルール

```typescript
// Task作成時の必須フィールド
interface TaskInsert {
  project_id: number;     // 必須
  task_name: string;      // 必須
  // 残りは選択項目
  status?: string;        // デフォルト値: "NOT_STARTED"
  priority?: string;      // デフォルト値: "MEDIUM"
  progress_percent?: number; // デフォルト値: 0
}
```

### 3. 日付形式ルール

- **DB保存**: ISO 8601形式 (`2024-01-15T00:00:00.000Z`)
- **UI表示**: YYYY-MM-DD形式 (`2024-01-15`)
- **変換**: `taskAdapter.ts`で自動処理

## 🔍 スキーマ確認

### 方法1: スキーマ確認スクリプト実行（推奨）

```bash
npm run check:schema
```

このスクリプトは以下を確認します:
- `auth_id` カラムの存在
- `role` カラムの存在
- その他の必須カラムの存在
- 実際のデータサンプル

### 方法2: Supabase Dashboard で直接確認

1. Supabase Dashboard にログイン
2. **Table Editor** > 対象テーブルを開く
3. カラムが存在するか確認

### 方法3: SQL Editor で確認

```sql
-- users テーブルのカラム一覧を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;
```

### 必須カラムチェックリスト

#### 認証統合用カラム

| カラム名 | 型 | 必須 | 説明 | マイグレーション |
|---------|-----|------|------|----------------|
| `auth_id` | UUID | ✅ | Supabase Auth UUID | `2025-01-XX_add_auth_id_to_users.sql` |
| `role` | TEXT | ✅ | ユーザー権限 | `2025-01-XX_add_role_to_users.sql` |

#### 基本カラム

| カラム名 | 型 | 必須 | 説明 |
|---------|-----|------|------|
| `id` | BIGINT | ✅ | プライマリキー |
| `email` | TEXT | ✅ | メールアドレス |
| `display_name` | TEXT | ✅ | 表示名 |
| `password_hash` | TEXT | ✅ | パスワードハッシュ |
| `is_active` | BOOLEAN | ✅ | アクティブ状態 |
| `created_at` | TIMESTAMPTZ | ✅ | 作成日時 |
| `updated_at` | TIMESTAMPTZ | ✅ | 更新日時 |

## 🛠️ 開発ツール使用方法

### 1. 型生成

```bash
# Supabaseから型自動生成
npm run types:gen

# CSVから型生成
npm run types:fromcsv
```

### 2. データベーステスト

```bash
# 環境変数テスト
npm run test:env

# CRUDテスト
npm run test:crud:all

# 特定テーブルテスト
npm run test:projects
npm run test:tasks
```

### 3. シードデータ管理

```bash
# 全体シードデータ生成
npm run seed:all

# 特定テーブルシード
npm run seed:projects
npm run seed:tasks

# CSVエクスポート
npm run export:csv
```

### 4. データ検証

```bash
# レコード数確認
npm run debug:count

# 特定データ確認
npm run probe:alert
npm run probe:task:priority
```

## 🔧 開発ワークフロー

### 1. 新機能追加時

1. DBスキーマ確認 (`src/types/db/*.ts`)
2. サービス関数作成 (`src/services/*.ts`)
   - 基本CRUD: `crud.ts`, `dbServices.ts`
   - 専門機能: `taskService.ts`, `projectService.ts`, `teamService.ts`
   - 分析機能: `dashboardService.ts`, `reportService.ts`
   - 通知機能: `notificationService.ts`, `activityService.ts`
3. アダプター関数追加 (`src/utils/taskAdapter.ts`)
4. Store関数実装 (`src/store/schedule.ts`)
5. コンポーネントでStore使用
6. ページコンポーネント作成 (`src/pages/*.vue`)

### 2. データベース変更時

1. Supabaseでスキーマ修正
2. `npm run types:gen` 実行
3. アダプター関数更新
4. テスト実行

### 3. デバッグ時

1. `npm run test:env` - 接続確認
2. `npm run debug:count` - データ確認
3. ブラウザ開発者ツール - Store状態確認

## 🎯 実際使用例

### プロジェクト作成

```typescript
const newProject = {
  name: "新プロジェクト",
  description: "プロジェクト説明",
  start_date: "2024-01-01",
  end_date: "2024-12-31"
};

const created = await createProject(newProject);
```

### タスク作成

```typescript
const newTask = {
  project_id: 2,
  task_name: "新タスク",
  description: "タスク説明",
  status: "NOT_STARTED",
  priority: "HIGH"
};

const created = await createTask(newTask);
```

### スケジュールロード（Store使用）

```typescript
const store = useScheduleStore();
await store.loadAll(); // DBから全スケジュールロード
const schedules = store.schedules.value; // リアクティブデータ
```

### ダッシュボード統計取得

```typescript
import { fetchProjectProgress } from "@/services/dashboardService";
const stats = await fetchProjectProgress();
```

### チーム管理

```typescript
import { listUsers, createUser } from "@/services/teamService";
const users = await listUsers();
const newUser = await createUser(userData);
```

### レポート生成

```typescript
import { generateReport } from "@/services/reportService";
const report = await generateReport(options);
```

### 通知管理

```typescript
import { listNotifications } from "@/services/notificationService";
const notifications = await listNotifications();
```

## 🔍 問題解決

### 接続エラー

```
環境変数が見つかりません: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
```
→ `.env.local` ファイルに環境変数設定

### 型エラー

```
Property 'someField' does not exist on type 'Task'
```
→ `npm run types:gen` 実行して型再生成

### データなし

```
スケジュールデータをDBから読み込みました: 0 件
```
→ `npm run seed:all` 実行してシードデータ生成

### スキーマ不一致

**症状**: TypeScript エラー、実行時エラー

**解決方法**:
1. DBスキーマを確認: `npm run check:schema`
2. `npm run types:gen` で型を再生成
3. 必要に応じて手動で調整

## 📝 主要コマンド

```bash
# 型生成
npm run types:gen              # Supabaseから型生成
npm run types:fromcsv          # CSVから型生成

# データベーステスト
npm run test:env               # 環境変数テスト
npm run test:crud:all          # 全体CRUDテスト
npm run test:projects          # プロジェクトテスト
npm run test:tasks             # タスクテスト

# データ管理
npm run seed:all               # 全体シードデータ
npm run demo:reset             # 実演用データをリセット＆投入
npm run seed:projects          # プロジェクトシード
npm run seed:tasks              # タスクシード
npm run export:csv              # CSVエクスポート
npm run debug:count            # レコード数確認

# スキーマ確認
npm run check:schema           # users テーブルスキーマ確認

# 開発
npm run dev                    # 開発サーバー
npm run build                  # プロダクションビルド
```

## 🚨 注意事項

### 1. 型ファイル編集禁止

- `src/types/db/*.ts` ファイルは自動生成されるため **絶対に編集しないでください**
- スキーマ変更時は `npm run types:gen` で再生成

### 2. 直接DBアクセス禁止

- コンポーネントから `supabase.from()` 直接呼び出し禁止
- 必ずStoreやServiceレイヤーを通してアクセス

### 3. Mockデータ使用禁止

- `createMockScheduleRepository()` は DEPRECATED
- 実際のDBサービスを使用してください

### 4. 環境変数必須

- `.env.local` に `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 設定必須
- 環境変数なしではDB接続不可

## 📚 関連ドキュメント

- [データベーススキーマ](./database-schema.md) - データベーススキーマ全体
- [認証システム統合ガイド](./auth-system-guide.md) - 認証システムの詳細
- [マイグレーションガイド](./migration-guide.md) - マイグレーション手順
- [タグ機能ガイド](./tag-feature-guide.md) - タグ機能の使用方法
- [README](../README.md) - プロジェクト全体の説明

---

**最終更新**: 2025-01-XX  
**ステータス**: ✅ 最新

