# Zenkoh Vue プロジェクト

Vue 3とViteを使用した現代的なウェブアプリケーションプロジェクトです。

## プロジェクト概要

このプロジェクトはVue 3のComposition APIとViteビルドツールを使用して開発されました。

- **Vue 3**: 最新のVue.jsフレームワーク
- **Vite**: 高速な開発サーバーとビルドツール
- **Composition API**: Vue 3の新しいコンポーネント作成方式

## 開発環境設定

### 推奨IDE設定

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)拡張機能を使用してください。
(Veturは無効化することを推奨します)

### 設定カスタマイズ

[Vite設定参照](https://vite.dev/config/)を確認してください。

## プロジェクト設定

### 依存関係インストール

```sh
npm install
```

### 開発サーバー実行（ホットリロード含む）

```sh
npm run dev
```

### 本番用ビルド

```sh
npm run build
```

### ビルド結果プレビュー

```sh
npm run preview
```

## プロジェクト構造

```
src/
├── components/     # Vueコンポーネント
├── assets/        # 静的ファイル（画像、CSSなど）
├── App.vue        # ルートコンポーネント
└── main.js        # アプリケーションエントリーポイント
```

## 開発ガイドライン

- すべてのコンポーネントに日本語コメントを追加します
- 変数名は明確で理解しやすく記述します
- エラー処理を事前に考慮して安全なコードを記述します
- 画面に表示されるテキストは日本語で記述します
