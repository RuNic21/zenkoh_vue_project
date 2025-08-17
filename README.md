# Zenkoh Vue プロジェクト

Vue.js 기반의 웹 애플리케이션 프로젝트입니다.

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

## 📊 Material Dashboard

このプロジェクトには美しい Material Dashboard テンプレートが含まれています。

### ダッシュボードへのアクセス方法

1. **ブラウザで直接アクセス**: `dashboard.html` ファイルを開く
2. **メイン画面から**: 右上の「📊 ダッシュボード」ボタンをクリック
3. **URL 直接入力**: `/dashboard.html`

### 利用可能なページ

- 📈 **メインダッシュボード** - 主要な統計情報とグラフ
- 📋 **テーブル** - データテーブルとリスト表示
- 💳 **請求管理** - 請求書と支払い管理
- 👤 **プロフィール** - ユーザープロフィール設定
- 🔐 **サインイン** - ログインフォーム
- 📝 **サインアップ** - 新規登録フォーム

### Material Dashboard 開発コマンド

```bash
# ダッシュボード起動（依存関係インストール + 起動）
npm run dashboard

# SCSSコンパイル
npm run dashboard:dev

# SCSS監視モード
npm run dashboard:watch
```

## 🛠️ 技術スタック

- **フロントエンド**: Vue.js 3
- **ビルドツール**: Vite
- **UI フレームワーク**: Bootstrap 5
- **アイコン**: Font Awesome, Material Icons
- **チャート**: Chart.js
- **ダッシュボード**: Material Dashboard 3

## 📁 プロジェクト構造

```
workspace_zenkoh/
├── src/                    # Vue.js ソースコード
├── material-dashboard-master/  # Material Dashboard テンプレート
├── dashboard.html          # ダッシュボードアクセスページ
├── index.html             # メインHTMLファイル
└── package.json           # プロジェクト設定
```

## 🌟 特徴

- **モダンな UI**: Material Design 3 に基づいた美しいインターフェース
- **レスポンシブ**: すべてのデバイスで最適化された表示
- **豊富なコンポーネント**: チャート、テーブル、フォームなど
- **カスタマイズ可能**: SCSS ファイルでスタイルを自由に調整
- **日本語対応**: ユーザーインターフェースが日本語化

## 📝 注意事項

- Material Dashboard は独立した HTML テンプレートです
- Vue.js アプリケーションとは別のページとして動作します
- ダッシュボードの機能を Vue.js に統合したい場合は、コンポーネント化が必要です

## 🔗 リンク

- [Material Dashboard 公式サイト](https://www.creative-tim.com/product/material-dashboard)
- [Vue.js 公式ドキュメント](https://vuejs.org/)
- [Vite 公式ドキュメント](https://vitejs.dev/)
