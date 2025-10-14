# スケジュール管理プログラム協業のための設計書

## 📋 概要

Zenkoh Project Schedulerは、Vue 3 + Supabaseを基盤とした現代的プロジェクト/スケジュール管理システムです。この文書は協業のための主要画面、データベース構造、ファイル活用に関する詳細な設計情報を提供します。

### 🎯 システム運用方式

**管理者中心運用**: ユーザー管理は管理者が直接修正

## 🎯 主要画面構成

### 1. ダッシュボード画面 (Dashboard)

#### 主要機能
- **プロジェクト進捗状況統計**: 進行中/完了/完了率/期限超過プロジェクト数表示
- **プロジェクト別進捗率可視化**: 各プロジェクトの進捗率をプログレスバーで表示
- **リアルタイムデータ連携**: Supabaseデータベースからリアルタイムでデータを取得して表示
- **クイックアクセス**: 各プロジェクトの「詳細を見る」ボタンで詳細画面に移動

#### 活用されるDBテーブル及びカラム
- **projectsテーブル**:
  - `id`: プロジェクト固有ID
  - `name`: プロジェクト名
  - `owner_user_id`: プロジェクト所有者ID
  - `end_date`: プロジェクト終了日
  - `is_archived`: アーカイブ有無
- **tasksテーブル**:
  - `project_id`: プロジェクトID (外部キー)
  - `progress_percent`: 作業進捗率 (0-100)
- **usersテーブル**:
  - `id`: ユーザーID
  - `display_name`: ユーザー表示名

#### 活用されるファイル
- **コンポーネント**: `src/App.vue` (ダッシュボードセクション)
- **サービス**: `src/services/dashboardService.ts` (プロジェクト進捗率集計)
- **タイプ**: `src/types/schedule.ts` (UI表示用タイプ)
- **ユーティリティ**: `src/utils/uiHelpers.ts` (状態別色クラス)

### 2. プロジェクト管理画面 (Project Management)

#### 主要機能
- **プロジェクト一覧照会**: 全てのプロジェクトの基本情報表示
- **プロジェクト作成/修正/削除**: 管理者のみ可能なCRUD機能提供
- **プロジェクト別タスク管理**: 各プロジェクトに属するタスクを管理者中心で管理
- **進捗率追跡**: プロジェクト内タスクの平均進捗率計算
- **ユーザー割り当て管理**: プロジェクト所有者及びタスク担当者指定

#### 活用されるDBテーブル及びカラム
- **projectsテーブル**:
  - `id`: プロジェクト固有ID
  - `name`: プロジェクト名
  - `description`: プロジェクト説明
  - `start_date`: プロジェクト開始日
  - `end_date`: プロジェクト終了日
  - `owner_user_id`: プロジェクト所有者ID
  - `created_at`, `updated_at`: 作成/修正日時
- **tasksテーブル** (関連):
  - `project_id`: プロジェクトID (外部キー)
  - `progress_percent`: 作業進捗率

#### 活用されるファイル
- **サービス**: `src/services/projectService.ts` (プロジェクトCRUD)
- **タイプ**: `src/types/project.ts` (プロジェクトタイプ定義)
- **DBタイプ**: `src/types/db/projects.ts` (自動生成されたDBタイプ)
- **コンポーネント**: `src/pages/ProjectList.vue` (予定)


### 3. タスク管理画面 (Task Management)

#### 主要機能
- **タスク一覧照会**: 全てのタスクの詳細情報表示
- **タスク作成/修正/削除**: 管理者のみ可能なCRUD機能提供
- **状態別フィルタリング**: 予定/進行中/完了/遅延状態別フィルタ
- **優先度管理**: 高/中/低優先度設定 (管理者設定)
- **進捗率追跡**: 各タスクの進捗率を視覚的に表示
- **担当者割り当て**: タスク別担当者指定及び変更 (管理者権限)

#### 活用されるDBテーブル及びカラム
- **tasksテーブル**:
  - `id`: タスク固有ID
  - `project_id`: プロジェクトID (外部キー)
  - `task_name`: タスク名
  - `description`: タスク説明
  - `status`: タスク状態 (NOT_STARTED, IN_PROGRESS, DONE, DELAYED, HOLD)
  - `priority`: 優先度 (HIGH, MEDIUM, LOW)
  - `progress_percent`: 進捗率 (0-100)
  - `planned_start`, `planned_end`: 計画開始/終了日
  - `actual_start`, `actual_end`: 実際開始/終了日
  - `primary_assignee_id`: 主担当者ID
  - `parent_task_id`: 上位タスクID (階層構造)
  - `wbs_code`: WBSコード
  - `current_column_id`: 現在カンバンカラムID
- **projectsテーブル** (JOIN):
  - `name`: プロジェクト名
- **usersテーブル** (JOIN):
  - `display_name`: 担当者名

#### 活用されるファイル
- **コンポーネント**: `src/pages/ScheduleList.vue` (タスク一覧)
- **サービス**: `src/services/taskService.ts` (タスクCRUD)
- **タイプ**: `src/types/task.ts` (タスクタイプ定義)
- **DBタイプ**: `src/types/db/tasks.ts` (自動生成されたDBタイプ)
- **アダプター**: `src/utils/taskAdapter.ts` (DB ↔ UIタイプ変換)
- **ストア**: `src/store/schedule.ts` (状態管理)


## 🔗 プロジェクトとタスク画面の関連性

### 階層的構造
プロジェクトとタスクは**1:N関係**で構成されており、プロジェクト単位で内部タスクが管理されます。

```
プロジェクト (Project)
├── タスク1 (Task 1)
├── タスク2 (Task 2)
├── タスク3 (Task 3)
└── ...
```

### 画面間連動関係

#### 1. プロジェクト → タスク連動
- **プロジェクト管理画面**で特定プロジェクトを選択すると、該当プロジェクトに属するタスクのみフィルタリングされて**タスク管理画面**に表示
- プロジェクト別タスク進捗率がプロジェクト管理画面に集計されて表示
- プロジェクト削除時、該当プロジェクトの全てのタスクも一緒に削除 (CASCADE)

#### 2. タスク → プロジェクト連動
- **タスク管理画面**でタスクを作成する際は必ず上位プロジェクトを指定する必要がある
- タスクの進捗率変更が上位プロジェクトの全体進捗率に反映
- タスク状態変更がプロジェクトの全体状態に影響

### データフロー
```
プロジェクト作成 → タスク作成 → タスク進捗率更新 → プロジェクト進捗率再計算
```

### 画面ナビゲーション
- **プロジェクト管理画面** → 「タスクを見る」ボタン → **タスク管理画面** (該当プロジェクトフィルタ適用)
- **タスク管理画面** → 「プロジェクト情報」リンク → **プロジェクト管理画面** (該当プロジェクトに移動)
- **ダッシュボード** → プロジェクト選択 → **タスク管理画面** (該当プロジェクトのタスク表示)

### 管理者作業フロー
1. **プロジェクト作成**: 新しいプロジェクトを作成し基本情報設定
2. **タスク作成**: 作成されたプロジェクト内で詳細タスクを作成
3. **担当者割り当て**: 各タスクに適切な担当者指定
4. **進捗率モニタリング**: プロジェクト単位でタスクの進捗状況追跡
5. **状態管理**: プロジェクトとタスクの状態を一貫性を持って管理

## 🗄️ データベース構造

### 主要テーブル関係図
```
projects (プロジェクト)
├── tasks (タスク) - project_idで接続
├── boards (カンバンボード) - project_idで接続
├── alert_rules (アラートルール) - project_idで接続
└── notifications (通知) - project_idで接続

users (ユーザー)
├── projects.owner_user_id (プロジェクト所有者)
├── tasks.primary_assignee_id (タスク担当者)
└── task_members (タスクメンバー)

boards (カンバンボード)
└── board_columns (ボードカラム) - board_idで接続

tasks (タスク)
├── task_members (タスクメンバー) - task_idで接続
└── board_columns.current_column_id (現在位置)
```

### 核心テーブル詳細

#### 1. projectsテーブル
```sql
CREATE TABLE projects (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,                    -- プロジェクト名
  description TEXT,                      -- プロジェクト説明
  start_date DATE,                       -- 開始日
  end_date DATE,                         -- 終了日
  owner_user_id BIGINT REFERENCES users(id), -- 所有者ID
  is_archived BOOLEAN NOT NULL DEFAULT false, -- アーカイブ有無
  created_at TIMESTAMPTZ NOT NULL,       -- 作成日時
  updated_at TIMESTAMPTZ NOT NULL        -- 修正日時
);
```

#### 2. tasksテーブル
```sql
CREATE TABLE tasks (
  id BIGINT PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id), -- プロジェクトID
  task_name TEXT NOT NULL,                -- タスク名
  description TEXT,                       -- タスク説明
  status TEXT NOT NULL,                   -- 状態 (NOT_STARTED, IN_PROGRESS, DONE, DELAYED, HOLD)
  priority TEXT NOT NULL,                 -- 優先度 (HIGH, MEDIUM, LOW)
  progress_percent INTEGER NOT NULL DEFAULT 0, -- 進捗率 (0-100)
  planned_start TIMESTAMPTZ,              -- 計画開始日
  planned_end TIMESTAMPTZ,                -- 計画終了日
  actual_start TIMESTAMPTZ,               -- 実際開始日
  actual_end TIMESTAMPTZ,                 -- 実際終了日
  primary_assignee_id BIGINT REFERENCES users(id), -- 主担当者ID
  parent_task_id BIGINT REFERENCES tasks(id), -- 上位タスクID
  wbs_code TEXT,                          -- WBSコード
  sort_order INTEGER,                     -- ソート順序
  current_column_id BIGINT REFERENCES board_columns(id), -- 現在カンバンカラム
  is_archived BOOLEAN NOT NULL DEFAULT false, -- アーカイブ有無
  created_by BIGINT REFERENCES users(id), -- 作成者ID
  updated_by BIGINT REFERENCES users(id), -- 修正者ID
  created_at TIMESTAMPTZ NOT NULL,        -- 作成日時
  updated_at TIMESTAMPTZ NOT NULL         -- 修正日時
);
```

#### 3. usersテーブル
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,            -- メール
  display_name TEXT NOT NULL,            -- 表示名
  password_hash TEXT NOT NULL,           -- パスワードハッシュ
  is_active BOOLEAN NOT NULL DEFAULT true, -- アクティブ状態
  created_at TIMESTAMPTZ NOT NULL,       -- 作成日時
  updated_at TIMESTAMPTZ NOT NULL        -- 修正日時
);
```

## 📁 ファイル構造及び活用

### 1. コンポーネント階層
```
src/
├── App.vue                    # メインアプリケーション (ダッシュボード含む)
├── layouts/
│   └── MainLayout.vue         # 共通レイアウト (サイドバー、ナビゲーション)
└── pages/
    ├── ScheduleList.vue       # タスク一覧画面
    └── ScheduleDetail.vue     # タスク詳細画面
```

### 2. サービス階層 (6個核心ファイル)
```
src/services/
├── supabaseClient.ts          # Supabase接続クライアント
├── crud.ts                    # 汎用CRUDファクトリ
├── dbServices.ts              # 自動生成CRUDリポジトリ
├── taskService.ts             # タスク専用サービス
├── projectService.ts          # プロジェクト専用サービス
├── relationService.ts         # 関係型データサービス
└── dashboardService.ts        # ダッシュボード集計サービス
```

### 3. タイプ定義
```
src/types/
├── db/                        # 自動生成されたDBタイプ (修正禁止)
│   ├── projects.ts
│   ├── tasks.ts
│   └── users.ts
├── schedule.ts                # UI表示用タイプ
├── task.ts                    # ビジネスロジック用タスクタイプ
└── project.ts                 # プロジェクトタイプ
```

### 4. ユーティリティ
```
src/utils/
├── taskAdapter.ts             # DB ↔ UIタイプ変換
├── uiHelpers.ts               # UIヘルパー関数 (色、クラス)
└── dateUtils.ts               # 日付処理ユーティリティ
```

### 5. 状態管理
```
src/store/
└── schedule.ts                # スケジュール状態管理 (DB連携)
```

## 🔄 データフロー

### 1. ダッシュボードデータローディング
```
Supabase DB → dashboardService.fetchProjectProgress() 
→ ProjectProgressRow[] → App.vue → UIレンダリング
```

### 2. タスク一覧ローディング
```
Supabase DB → taskService.listTasksWithProject() 
→ TaskWithProject[] → taskAdapter.tasksToScheduleItems() 
→ ScheduleItem[] → store.schedules → ScheduleList.vue
```

### 3. タスク作成/修正
```
UI入力 → ScheduleItem → taskAdapter.scheduleItemToTaskInsert/Update() 
→ TaskInsert/TaskUpdate → taskService.createTask/updateTask() 
→ Supabase DB → store更新 → UI反映
```

## 🛠️ 開発ワークフロー

### 1. 環境設定
```bash
# 依存関係インストール
npm install

# 環境変数設定 (.env.local)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 開発サーバー開始
npm run dev
```

### 2. データベース管理
```bash
# 環境変数テスト
npm run test:env

# シードデータ生成
npm run seed:all

# CRUDテスト
npm run test:crud:all

# タイプ再生成
npm run types:gen
```

### 3. 主要スクリプト
- `npm run dev`: 開発サーバー開始
- `npm run build`: プロダクションビルド
- `npm run preview`: ビルド結果プレビュー
- `npm run export:csv`: CSVデータエクスポート

## 📚 協業ガイドライン

### 1. システム運用政策
- **管理者中心運用**: 全てのプロジェクトとタスクの作成、修正、削除は管理者のみ実行
- **ユーザー制限権限**: 一般ユーザーは割り当てられたタスクの進捗率更新のみ可能
- **中央集権式管理**: システムの全ての設定とデータ管理は管理者が一括処理

### 2. コーディングスタイル
- 全てのコードに日本語コメント追加 (意図中心)
- 変数名/関数名は意味が明確で読みやすく
- 例外/エラー可能性を事前に考慮して安全に実装
- 画面表示テキストは日本語で統一

### 3. ファイル修正制限
- `src/types/db/*.ts`: 自動生成ファイル (修正禁止)
- `material-dashboard-master/`: テンプレートファイル (参照のみ)

### 4. サービス階層使用
- コンポーネントから直接DBアクセス禁止
- StoreまたはService階層を通してのみアクセス

### 5. タイプ安全性
- TypeScriptを活用した完全なタイプチェック
- DBスキーマ変更時 `npm run types:gen` 実行必須

## 🚨 注意事項

### 1. 環境変数必須
- `.env.local`にSupabase接続情報設定必須
- 環境変数なしではDB接続不可

### 2. データ一貫性
- 全てのデータ操作はStoreを通してのみ実行
- UIとDB間のタイプ変換はtaskAdapter.tsで処理

### 3. エラー処理
- 全てのAPI呼び出しに適切なエラー処理実装
- ユーザーには日本語で親しみやすいエラーメッセージ表示

### 4. 権限管理
- **管理者権限**: 全てのプロジェクト/タスク作成、修正、削除可能
- **ユーザー権限**: 割り当てられたタスクの進捗率更新のみ可能
- **アクセス制御**: UIレベルで権限に応じた機能制限実装必要

## 💡 運用シナリオ

### 管理者作業フロー
1. **プロジェクト作成**: 新しいプロジェクトを作成し所有者指定
2. **タスク作成**: プロジェクト内タスクを作成し担当者割り当て
3. **進捗率モニタリング**: ダッシュボードを通じて全体プロジェクト進捗状況確認
4. **ユーザー管理**: 必要時タスク担当者変更及び権限調整

### ユーザー作業フロー
1. **割り当てられたタスク確認**: 自分に割り当てられたタスク一覧照会
2. **進捗率更新**: 作業進捗に応じて進捗率修正
3. **状態変更**: タスク完了時状態を「完了」に変更

この設計書はZenkoh Project Schedulerの全体的な構造と各画面の役割、データベース活用、ファイル構造を詳細に説明します。**管理者中心の中央集権式運用**を前提として協業時この文書を参照し一貫した開発を進めることができます。