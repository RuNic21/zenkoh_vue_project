# Zenkoh Project Scheduler（Vue 3 + Vite + Supabase）

Zenkoh のプロジェクト/スケジュール管理用 Web アプリケーションです。Vue 3（Composition API）と Vite、Material Dashboard 3、Supabase を統合した包括的なプロジェクト管理システムです。

## 🧱 アーキテクチャ概要（完全統合・多機能対応）

### コアアーキテクチャ
- **型定義**: `src/types/` - 画面/サービス共通契約（schedule, task, project, team, report, notification）
- **UI ヘルパー**: `src/utils/uiHelpers.ts` - ステータス/進捗のクラス一元管理
- **データベース統合**: Supabase を基盤とした完全な DB 連携
- **エラーハンドリング**: `src/utils/errorHandler.ts` - 統一されたエラー処理

### サービス層（12個の専門サービス）
- `src/services/supabaseClient.ts` - Supabase 接続クライアント
- `src/services/authService.ts` - 認証サービス（Supabase Auth - ログイン・会員登録・セッション管理）
- `src/services/taskService.ts` - タスク専用サービス
- `src/services/projectService.ts` - プロジェクト専用サービス
- `src/services/relationService.ts` - 複合関係取得
- `src/services/crud.ts` - 汎用CRUDファクトリ
- `src/services/dbServices.ts` - 自動生成CRUDリポジトリ
- `src/services/dashboardService.ts` - ダッシュボード統計・分析
- `src/services/activityService.ts` - 活動フィード・通知管理
- `src/services/reportService.ts` - レポート生成・エクスポート
- `src/services/teamService.ts` - チーム管理
- `src/services/notificationService.ts` - 通知システム

### 状態管理
- **ストア**: `src/store/schedule.ts`
  - 状態: `schedules`, `selectedScheduleId`, `selectedSchedule`
  - 同期操作: `selectSchedule`, `updateSchedule`, `addSchedule`, `removeSchedule`
  - 非同期操作: `loadAll`, `save`, `create`, `delete`（Supabase 連携）

### 画面構成（9つのページ）
- **ダッシュボード** (`pages/DashboardPage.vue`): プロジェクト進捗一覧、統計情報、フィルタリング
- **ログイン** (`pages/LoginPage.vue`): Supabase Auth ログイン、セッション管理
- **会員登録** (`pages/SignUpPage.vue`): 新規ユーザー登録、プロフィール設定
- **プロジェクト管理** (`pages/ProjectManagement.vue`): プロジェクト CRUD、統計チャート
- **プロジェクト詳細** (`pages/ProjectDetail.vue`): プロジェクト詳細、カンバンボード、タスクタイムライン
- **タスク管理** (`pages/ScheduleList.vue`): タスク一覧、詳細表示、フィルタリング
- **タスク詳細** (`pages/ScheduleDetail.vue`): タスク詳細、編集、コメント・添付ファイル管理
- **チーム管理** (`pages/TeamManagement.vue`): ユーザー管理、権限設定、通知管理
- **レポート** (`pages/ReportPage.vue`): 分析レポート、エクスポート機能、統計チャート

詳しくは `.cursor/rules/project-data-architecture.mdc` を参照してください。

## 🚀 クイックスタート

### 環境設定

```bash
# 依存関係のインストール
npm install

# データベース接続テスト
npm run test:env
```

### データベース初期化

```bash
# シードデータの生成
npm run seed:all

# データ確認
npm run debug:count
```

### 開発サーバー起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### プレビュー

```bash
npm run preview
```

## 📜 スクリプト（package.json）

### 開発・ビルド
```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run preview      # ビルド結果プレビュー
```

### データベース管理
```bash
npm run test:env              # 環境変数・DB接続テスト
npm run test:crud:all         # 全テーブルCRUDテスト
npm run test:projects         # プロジェクトテスト
npm run test:tasks            # タスクテスト
npm run test:tasks:join       # タスク結合テスト
npm run seed:all              # 全テーブルシードデータ生成
npm run seed:projects         # プロジェクトシード
npm run seed:tasks            # タスクシード
npm run export:csv            # CSVエクスポート
npm run debug:count           # レコード数確認
npm run probe:alert           # アラートルール型確認
npm run probe:task:priority   # タスク優先度確認
```

### 型生成・管理
```bash
npm run types:gen             # Supabaseから型自動生成
npm run types:fromcsv         # CSVから型生成
```

### Material Dashboard テンプレート
```bash
npm run dashboard             # 依存関係インストール後に起動
npm run dashboard:dev         # SCSS をコンパイル
npm run dashboard:watch       # ファイル監視
npm run dashboard:build       # ビルド
npm run dashboard:gulp        # Gulp タスク実行
```

## 🗄️ データベース構造

### 主要テーブル
- **projects**: プロジェクト情報
- **tasks**: タスク/スケジュール情報
- **users**: ユーザー情報
- **boards**: カンバンボード
- **board_columns**: ボードカラム
- **task_members**: タスクメンバーシップ
- **alert_rules**: アラートルール
- **notifications**: 通知履歴

詳細は [データベーススキーマドキュメント](./docs/database-schema.md) を参照してください。

## 🧪 データベース連携の動作

- 初回マウント時に `store.loadAll()` が Supabase からデータを読み込みます
- 保存/作成/削除は `store.save/create/delete` を利用してください（画面からはストア API 経由で呼び出します）
- データ変換は `src/utils/taskAdapter.ts` で自動処理されます
- **サービス層整理完了**: DEPRECATED ファイル削除、6個のコアファイルに集約

## 🔄 データフロー

### 基本データフロー
```
Supabase DB → Task型 → taskAdapter → ScheduleItem型 → Vue UI
```

### 拡張データフロー
```
Supabase DB → Service層 → Store/State → Vue Components → UI表示
     ↓
  Dashboard Service → 統計データ → Chart.js → チャート表示
     ↓
  Activity Service → 通知データ → 活動フィード → リアルタイム更新
     ↓
  Report Service → 分析データ → CSV/PDF → エクスポート機能
```

## 📊 主要機能詳細

### ダッシュボード機能
- **プロジェクト進捗表示**: 全プロジェクトの進捗率、完了率、遅延状況
- **統計情報**: プロジェクト数、タスク数、担当者別作業量
- **フィルタリング**: 状態、担当者、日付範囲による絞り込み
- **チャート表示**: Chart.js による視覚的なデータ表現

### プロジェクト管理
- **CRUD操作**: プロジェクトの作成、編集、削除、アーカイブ
- **詳細統計**: プロジェクト別タスク統計、進捗分析
- **担当者管理**: プロジェクトオーナー設定、チーム割り当て
- **期限管理**: 開始日・終了日の設定と監視

### タスク管理
- **タスク一覧**: 全タスクの一覧表示、状態別フィルタリング
- **詳細表示**: タスクの詳細情報、進捗率、優先度
- **状態管理**: NOT_STARTED, IN_PROGRESS, BLOCKED, DONE, CANCELLED
- **優先度設定**: LOW, MEDIUM, HIGH, URGENT

### チーム管理
- **ユーザー管理**: ユーザー一覧、権限設定
- **担当者割り当て**: タスク・プロジェクトへの担当者設定
- **チーム構成**: プロジェクト別チームメンバー管理

### レポート機能
- **進捗レポート**: プロジェクト・タスクの進捗分析
- **統計レポート**: 各種統計データの集計・分析
- **エクスポート**: CSV、PDF 形式でのデータ出力
- **カスタムレポート**: 条件指定によるレポート生成

### 活動フィード
- **リアルタイム更新**: プロジェクト・タスクの変更履歴
- **通知システム**: 締切アラート、完了通知
- **活動ログ**: ユーザーアクションの記録・表示

## 🛠️ 技術スタック

### フロントエンド
- **フレームワーク**: Vue 3 (Composition API)
- **ルーター**: Vue Router 4
- **ビルドツール**: Vite
- **UI/レイアウト**: Material Dashboard 3, Bootstrap 5
- **チャート**: Chart.js, vue-chartjs
- **アイコン**: Font Awesome, Material Icons

### バックエンド・データベース
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth（ログイン・会員登録・セッション管理）
- **リアルタイム**: Supabase Realtime

### ユーティリティ・ライブラリ
- **UI コンポーネント**: Perfect Scrollbar, noUiSlider, Flatpickr
- **日付処理**: Flatpickr
- **スライダー**: noUiSlider
- **スクロール**: Perfect Scrollbar

## 🌟 特徴

### コア機能
- **モダンな UI**: Material Design 3 準拠のレスポンシブレイアウト
- **SPA ルーティング**: Vue Router 4 によるシームレスなページ遷移（9つのページ）
- **セキュアな認証**: Supabase Auth による安全なログイン・会員登録・セッション管理・ルーターガード
- **完全なデータベース統合**: Supabase によるリアルタイムデータ同期（12個の専門サービス）
- **包括的なプロジェクト管理**: プロジェクト、タスク、チーム、レポートの一元管理

### 高度な機能
- **ダッシュボード分析**: プロジェクト進捗、統計情報、チャート表示
- **活動フィード**: リアルタイム活動ログ・通知システム
- **レポート生成**: CSV/PDF エクスポート、分析レポート
- **チーム管理**: ユーザー管理、権限設定、担当者割り当て
- **カンバンボードサポート**: タスク状態管理、WIP制限
- **アラート・通知システム**: 締切監視、自動通知

### 技術的特徴
- **型安全性**: TypeScript による完全な型定義（15個の型定義ファイル）
- **SPA アーキテクチャ**: Vue Router 4 によるクライアントサイドルーティング
- **認証システム**: Supabase Auth + ルーターガードによるアクセス制御
- **Composables**: 12個のComposition API関数（useAuth, useDashboard, useMessage 等）
- **パフォーマンス最適化**: Lazy Loading、効率的なデータ取得・表示、最適化されたテーブルコンポーネント
- **エラーハンドリング**: 統一されたエラー処理・ユーザーフレンドリーなメッセージ
- **定数管理**: 7つの定数ファイルによる一貫したUI・ロジック（pagination, format, messages, database, validation, ui, chart）
- **多言語対応**: 日本語 UI 完全対応

## 📝 注意事項

### 開発・運用
- **環境変数必須**: データベース接続には `.env.local` の設定が必須です
- **Material Dashboard**: 独立した HTML テンプレートとして提供、Vue アプリとは別動作
- **日本語 UI**: 画面に表示される文言は日本語で統一しています
- **型安全性**: `src/types/db/*.ts` は自動生成ファイル（編集禁止）

### アーキテクチャ
- **サービス層**: 12個の専門サービス（認証サービス追加）、クリーンなコードベース
- **ページ構成**: 9つのページ（ダッシュボード、認証、プロジェクト、タスク、チーム、レポート）
- **Vue Router 4**: SPA アーキテクチャ、Lazy Loading、ルーターガード
- **コンポーネント設計**: カテゴリ別に整理された再利用可能コンポーネント（9つのカテゴリ）
- **Composables**: 12個の Composition API 関数（useAuth 等）
- **定数管理**: 一貫した定数管理（7つの定数ファイル）
- **データフロー**: コンポーネント → Composable/Store → Service → Supabase の一方向フロー

## 📚 ルール/ガイドライン

- `.cursor/rules/INDEX.mdc` から各種ルール（UI テキスト・コーディング規約・Vue パターン・データ/アーキテクチャ・データベース統合）を参照できます

## 📖 ドキュメント

### データベース
- [データベーススキーマ](./docs/database-schema.md) - 詳細なDB構造説明（2025年1月更新 - 12サービス・9ページ対応）
- [データベース統合ガイド](./docs/database-integration-guide.md) - クイックスタートガイド

### UI/UX・レイアウト
- [UI/UX スタイルガイド](./docs/ui-ux-style-guide.md) - Material Dashboard 3 完全スタイルガイド
- [ページレイアウトテンプレート](./docs/page-layout-template.md) - 標準ページ構造・テンプレート
- [レイアウト統一作業サマリー](./docs/layout-improvements-summary.md) - レイアウト改善記録

### 認証システム
- [認証システム統合ガイド](./docs/auth-system-integration.md) - Supabase Auth 完全統合ガイド（ログイン・会員登録・セッション管理）
- [認証とusersテーブルの課題](./docs/auth-users-table-issue.md) - 技術的課題と解決策
- [Supabaseメール確認設定](./docs/supabase-email-confirmation-setup.md) - メール確認設定ガイド

### Vue Router
- [Vue Router統合ガイド](./docs/vue-router-integration.md) - Vue Router 4 完全統合（9ページ・ルーターガード）

### 開発ガイド
- [スケジュール管理設計書](./docs/schedule-management-design.md) - 画面設計・データフロー（12サービス・9ページ対応）
- [定数リファクタリング](./docs/constants-refactoring.md) - 定数管理の統一化

## 🔗 リンク

- [Material Dashboard 公式サイト](https://www.creative-tim.com/product/material-dashboard)
- [Supabase 公式サイト](https://supabase.com/)
- [Vue 3 公式サイト](https://vuejs.org/)

## 🚨 トラブルシューティング

### データベース接続エラー
```
環境変数が見つかりません: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
```
→ `.env.local` ファイルに環境変数を設定してください

### データが表示されない
```
スケジュールデータを DB から読み込みました: 0 件
```
→ `npm run seed:all` でシードデータを生成してください

### 型エラー
```
Property 'someField' does not exist on type 'Task'
```
→ `npm run types:gen` で型を再生成してください

### サービス層エラー
```
Cannot find module './scheduleService'
```
→ サービス層整理により `scheduleService.ts` は削除されました。`src/store/schedule.ts` の `useScheduleStore()` を使用してください

### 認証エラー
```
Email not confirmed
```
→ Supabase ダッシュボードでメール確認を無効化してください。詳細は `docs/supabase-email-confirmation-setup.md` を参照

### チャート表示エラー
```
Chart.js is not defined
```
→ Chart.js が正しくインストールされているか確認し、必要に応じて `npm install chart.js vue-chartjs` を実行してください

### 活動フィードが表示されない
```
活動データ取得に失敗しました
```
→ `notifications` テーブルにデータが存在するか確認し、`npm run seed:all` でテストデータを生成してください