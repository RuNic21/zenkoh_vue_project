# Zenkoh Project Scheduler（Vue 3 + Vite + Supabase）

Zenkoh のプロジェクト/スケジュール管理用 Web アプリケーションです。Vue 3（Composition API）と Vite、Material Dashboard 3、Supabase を統合しています。

## 🧱 アーキテクチャ概要（Supabase 連携完了・サービス層整理済み）

- **型定義**: `src/types/schedule.ts`（画面/サービス共通契約）
- **UI ヘルパー**: `src/utils/uiHelpers.ts`（ステータス/進捗のクラス一元管理）
- **データベース統合**: Supabase を基盤とした完全な DB 連携
- **サービス層**: 6個のコアファイルに整理完了
  - `src/services/supabaseClient.ts` - Supabase 接続クライアント
  - `src/services/taskService.ts` - タスク専用サービス
  - `src/services/projectService.ts` - プロジェクト専用サービス
  - `src/services/relationService.ts` - 複合関係取得
  - `src/services/crud.ts` - 汎用CRUDファクトリ
  - `src/services/dbServices.ts` - 自動生成CRUDリポジトリ
- **ストア**: `src/store/schedule.ts`
  - 状態: `schedules`, `selectedScheduleId`, `selectedSchedule`
  - 同期操作: `selectSchedule`, `updateSchedule`, `addSchedule`, `removeSchedule`
  - 非同期操作: `loadAll`, `save`, `create`, `delete`（Supabase 連携）
- **画面連携**:
  - `App.vue`: 初回 `loadAll()`、選択監視で詳細へ遷移、ダッシュボードから詳細遷移
  - `pages/ScheduleList.vue`: ストア一覧表示、`selectSchedule(id)` で詳細へ
  - `pages/ScheduleDetail.vue`: 選択データ参照。欠損値は既定値で補完し安全化

詳しくは `.cursor/rules/project-data-architecture.mdc` を参照してください。

## 🚀 クイックスタート

### 環境設定

```bash
# 依存関係のインストール
npm install

# 環境変数の設定 (.env.local ファイルを作成)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

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
npm run seed:all              # 全テーブルシードデータ生成
npm run seed:projects         # プロジェクトシード
npm run seed:tasks            # タスクシード
npm run export:csv            # CSVエクスポート
npm run debug:count           # レコード数確認
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

```
Supabase DB → Task型 → taskAdapter → ScheduleItem型 → Vue UI
```

## 🛠️ 技術スタック

- **フロントエンド**: Vue 3 (Composition API)
- **ビルドツール**: Vite
- **UI/レイアウト**: Material Dashboard 3, Bootstrap 5
- **データベース**: Supabase (PostgreSQL)
- **アイコン**: Font Awesome, Material Icons
- **チャート**: Chart.js（`src/assets/js/plugins/chartjs.min.js`）
- **ユーティリティ**: Perfect Scrollbar, noUiSlider, Flatpickr

## 🌟 特徴

- モダンな UI（Material Design 3 準拠）
- レスポンシブレイアウト
- 完全なデータベース統合（Supabase）
- リアルタイムデータ同期
- カンバンボードサポート
- アラート・通知システム
- 多言語対応（日本語 UI）

## 📝 注意事項

- Material Dashboard は「独立した HTML テンプレート」です。Vue アプリとは別に動作します
- Vue へフル統合する際は、必要なセクションをコンポーネント化してください
- 画面に表示される文言は日本語で統一しています
- データベース接続には環境変数の設定が必須です
- **サービス層整理完了**: 不要ファイル削除により、よりクリーンなコードベースになりました

## 📚 ルール/ガイドライン

- `.cursor/rules/INDEX.mdc` から各種ルール（UI テキスト・コーディング規約・Vue パターン・データ/アーキテクチャ・データベース統合）を参照できます

## 📖 ドキュメント

- [データベーススキーマ](./docs/database-schema.md) - 詳細なDB構造説明（2025年1月更新）
- [データベース統合ガイド](./docs/database-integration-guide.md) - クイックスタートガイド
- [フロントエンドアーキテクチャ](./docs/frontend-architecture.md) - Vue/UI構造説明

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