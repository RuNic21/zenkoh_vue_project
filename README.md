# Zenkoh Project Scheduler（Vue 3 + Vite）

Zenkoh のプロジェクト/スケジュール管理用 Web アプリケーションです。Vue 3（Composition API）と Vite、Material Dashboard 3 を統合しています。

## 🧱 アーキテクチャ概要（Supabase 連携準備済み）

- 型定義: `src/types/schedule.ts`（画面/サービス共通契約）
- UI ヘルパー: `src/utils/uiHelpers.ts`（ステータス/進捗のクラス一元管理）
- リポジトリ: `src/services/scheduleService.ts`
  - `ScheduleRepository` インターフェース（list/getById/create/update/remove）
  - `createMockScheduleRepository()` によるモック（シード + 疑似遅延）
- ストア: `src/store/schedule.ts`
  - 状態: `schedules`, `selectedScheduleId`, `selectedSchedule`
  - 同期操作: `selectSchedule`, `updateSchedule`, `addSchedule`, `removeSchedule`
  - 非同期操作: `loadAll`, `save`, `create`, `delete`（内部でモックを呼び出し。後日 Supabase に差し替え）
- 画面連携:
  - `App.vue`: 初回 `loadAll()`、選択監視で詳細へ遷移、ダッシュボードから詳細遷移
  - `pages/ScheduleList.vue`: ストア一覧表示、`selectSchedule(id)` で詳細へ
  - `pages/ScheduleDetail.vue`: 選択データ参照。欠損値は既定値で補完し安全化

詳しくは `.cursor/rules/project-data-architecture.mdc` を参照してください。

## 🚀 クイックスタート

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

```bash
# Vue アプリ開発/ビルド/プレビュー
npm run dev
npm run build
npm run preview

# Material Dashboard テンプレート（別フォルダ）の開発ユーティリティ
npm run dashboard        # 依存関係インストール後に起動
npm run dashboard:dev    # SCSS をコンパイル
npm run dashboard:watch  # SCSS 監視コンパイル
npm run dashboard:build  # SCSS ビルド
npm run dashboard:gulp   # Gulp タスク実行
```

## 📊 Material Dashboard の使い方

- 本リポジトリには `material-dashboard-master/` ディレクトリとしてテンプレート原本が含まれます。
- ダッシュボードは独立した HTML テンプレートとして動作します。
- 立ち上げるには以下を利用してください。

```bash
# テンプレートを起動（material-dashboard-master 内で起動）
npm run dashboard
```

- 直接 HTML を確認する場合は `material-dashboard-master/pages/` 配下の各 HTML をブラウザで開きます（例: `material-dashboard-master/pages/dashboard.html`）。

### Vue アプリへの統合ポイント（要点）

- `index.html` で Material Dashboard の CSS/JS とフォントを読み込み
- `src/main.js` で `material-dashboard.css` / `nucleo-icons.css` / `nucleo-svg.css` を import 済み
- レイアウトは Material Dashboard のクラス体系（`g-sidenav-show`, `navbar`, `card` など）に準拠

## 📁 プロジェクト構造

```
zenkoh_vue_project/
├── index.html                 # エントリ HTML（MD の CSS/JS を読み込み）
├── package.json               # 依存関係とスクリプト
├── src/
│  ├── main.js                # Vue エントリ。MD CSS を import
│  ├── App.vue                # ルートコンポーネント
│  ├── layouts/MainLayout.vue # サイドバー + ナビゲーション
│  ├── pages/                 # スケジュール一覧/詳細など
│  ├── assets/                # MD の CSS/JS/画像/フォント
│  └── ...
└── material-dashboard-master/ # テンプレート原本（参照/別起動）
```

## 🧪 モックデータの動作（本番データ未接続時）

- 初回マウント時に `store.loadAll()` がモックリポジトリからデータを読み込みます。
- 保存/作成/削除は `store.save/create/delete` を利用してください（画面からはストア API 経由で呼び出します）。

## 🔄 後日 Supabase に切り替える手順（概要）

1. `src/services/scheduleService.ts` に `createSupabaseScheduleRepository()` を実装します。
2. `src/store/schedule.ts` の非同期 API で、モックの代わりに Supabase 用リポジトリを使用します。
3. 必要に応じて `.env`（URL/anon key など）を設定し、スキーマ差異はサービス層で吸収します。

## 🛠️ 技術スタック

- **フロントエンド**: Vue 3
- **ビルドツール**: Vite
- **UI/レイアウト**: Material Dashboard 3, Bootstrap 5
- **アイコン**: Font Awesome, Material Icons
- **チャート**: Chart.js（`src/assets/js/plugins/chartjs.min.js`）
- **ユーティリティ**: Perfect Scrollbar, noUiSlider, Flatpickr

## 🌟 特徴

- モダンな UI（Material Design 3 準拠）
- レスポンシブレイアウト
- ダッシュボードの豊富なコンポーネントを Vue に段階的に統合可能
- SCSS による柔軟なカスタマイズ

## 📝 注意事項

- Material Dashboard は「独立した HTML テンプレート」です。Vue アプリとは別に動作します。
- Vue へフル統合する際は、必要なセクションをコンポーネント化してください。
- 画面に表示される文言は日本語で統一しています。

## 📚 ルール/ガイドライン

- `.cursor/rules/INDEX.mdc` から各種ルール（UI テキスト・コーディング規約・Vue パターン・データ/アーキテクチャ）を参照できます。

## 🔗 リンク

- [Material Dashboard 公式サイト](https://www.creative-tim.com/product/material-dashboard)
- [Vue.js 公式ドキュメント](https://vuejs.org/)
- [Vite 公式ドキュメント](https://vitejs.dev/)
