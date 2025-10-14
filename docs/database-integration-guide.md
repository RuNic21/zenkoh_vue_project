# データベース統合ガイド

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
- **alert_rules**: アラートルール
- **notifications**: 通知履歴

### サービス層（11個の専門サービス）
- **基本CRUD**: `crud.ts`, `dbServices.ts`
- **専門機能**: `taskService.ts`, `projectService.ts`, `teamService.ts`
- **分析機能**: `dashboardService.ts`, `reportService.ts`
- **通知機能**: `notificationService.ts`, `activityService.ts`
- **関係型データ**: `relationService.ts`

### データフロー
```
プロジェクト作成 → タスク作成 → カンバンボード配置 → 進捗率更新 → 通知送信
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
npm run seed:projects          # プロジェクトシード
npm run seed:tasks             # タスクシード
npm run export:csv             # CSVエクスポート
npm run debug:count            # レコード数確認

# 開発
npm run dev                    # 開発サーバー
npm run build                  # プロダクションビルド
```

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

## 📚 追加リソース

- [データベーススキーマドキュメント](./database-schema.md)
- [フロントエンドアーキテクチャ](./frontend-architecture.md)
- [APIドキュメント](./api-documentation.md)
- [デプロイガイド](./deployment-guide.md)
