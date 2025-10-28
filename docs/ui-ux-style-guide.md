# Zenkoh Project Scheduler UI/UX スタイルガイド

## 📋 概要

このプロジェクトは **Material Dashboard 3** をベースとした一貫性のあるUI/UXデザインシステムを使用しています。すべての新規開発・機能追加時は、このガイドに従ってください。

## 🎨 デザインシステムの基礎

### デザインフレームワーク
- **Material Dashboard 3** - メインUIフレームワーク
- **Bootstrap 5** - グリッドシステムとユーティリティ
- **Material Symbols Rounded** - アイコンフォント

### CSSファイル構成
```
src/assets/css/
├── material-dashboard.css    # メインスタイルシート
├── nucleo-icons.css          # Nucleoアイコン
└── nucleo-svg.css            # SVGアイコン
```

## 🎨 カラーパレット

### プライマリカラー
| カラー | 用途 | HEX | CSS変数 |
|--------|------|-----|---------|
| 🔴 Primary | メインアクション、ブランドカラー | `#e91e63` | `--bs-primary` |
| ⚫ Secondary | サブアクション、中立的な要素 | `#737373` | `--bs-secondary` |
| 🟢 Success | 成功メッセージ、完了状態 | `#4CAF50` | `--bs-success` |
| 🔵 Info | 情報メッセージ、進行中状態 | `#1A73E8` | `--bs-info` |
| 🟠 Warning | 警告メッセージ、注意状態 | `#fb8c00` | `--bs-warning` |
| 🔴 Danger | エラーメッセージ、危険状態 | `#F44335` | `--bs-danger` |

### グラデーション使用例
```html
<!-- ボタン -->
<button class="btn bg-gradient-primary">プライマリボタン</button>
<button class="btn bg-gradient-success">成功ボタン</button>

<!-- カード -->
<div class="card bg-gradient-info">
  <div class="card-body text-white">
    情報カード
  </div>
</div>

<!-- バッジ -->
<span class="badge bg-gradient-warning">警告</span>
```

### グレースケール
| レベル | 用途 | HEX |
|--------|------|-----|
| Gray-100 | 背景色（最も明るい） | `#f5f5f5` |
| Gray-300 | 境界線、区切り線 | `#d4d4d4` |
| Gray-500 | 本文テキスト | `#737373` |
| Gray-700 | 見出しテキスト | `#404040` |
| Gray-900 | 強調テキスト（最も暗い） | `#171717` |

## 📐 レイアウトシステム

### グリッドシステム（Bootstrap 5）

#### 4カラムレイアウト（統計カード）
```html
<div class="row mb-4">
  <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
    <!-- 統計カード 1 -->
  </div>
  <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
    <!-- 統計カード 2 -->
  </div>
  <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
    <!-- 統計カード 3 -->
  </div>
  <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
    <!-- 統計カード 4 -->
  </div>
</div>
```

#### 2カラムレイアウト（メイン＋サイドバー）
```html
<div class="row">
  <div class="col-lg-8 col-md-12 mb-4">
    <!-- メインコンテンツ -->
  </div>
  <div class="col-lg-4 col-md-12">
    <!-- サイドバー -->
  </div>
</div>
```

### スペーシング規則
| クラス | サイズ | 用途 |
|--------|--------|------|
| `m-1` / `p-1` | 0.25rem (4px) | 最小間隔 |
| `m-2` / `p-2` | 0.5rem (8px) | 小間隔 |
| `m-3` / `p-3` | 1rem (16px) | **標準間隔（推奨）** |
| `m-4` / `p-4` | 1.5rem (24px) | 中間隔 |
| `m-5` / `p-5` | 3rem (48px) | 大間隔 |

### コンテナ
```html
<!-- フルード幅コンテナ（推奨） -->
<div class="container-fluid py-4">
  <!-- ページコンテンツ -->
</div>

<!-- 固定幅コンテナ -->
<div class="container">
  <!-- コンテンツ -->
</div>
```

## 🎴 コンポーネントライブラリ

### 1. カード

#### 基本カード
```html
<div class="card">
  <div class="card-header pb-0">
    <h6>カードタイトル</h6>
    <p class="text-sm mb-0">サブタイトル</p>
  </div>
  <div class="card-body">
    <!-- カードコンテンツ -->
  </div>
</div>
```

#### 統計カード
```html
<div class="card">
  <div class="card-header p-2 ps-3">
    <div class="d-flex justify-content-between">
      <div>
        <p class="text-sm mb-0 text-capitalize">総プロジェクト数</p>
        <h4 class="mb-0">24</h4>
      </div>
      <div class="icon icon-md icon-shape bg-gradient-primary shadow-dark shadow text-center border-radius-lg">
        <i class="material-symbols-rounded opacity-10">folder</i>
      </div>
    </div>
  </div>
  <hr class="dark horizontal my-0">
  <div class="card-footer p-2 ps-3">
    <p class="mb-0 text-sm">
      <span class="text-success font-weight-bolder">+12%</span> 先月比
    </p>
  </div>
</div>
```

### 2. ボタン

#### ボタンバリエーション
```html
<!-- グラデーションボタン（推奨） -->
<button class="btn bg-gradient-primary">プライマリ</button>
<button class="btn bg-gradient-success">成功</button>
<button class="btn bg-gradient-warning">警告</button>
<button class="btn bg-gradient-danger">危険</button>

<!-- アウトラインボタン -->
<button class="btn btn-outline-primary">アウトライン</button>

<!-- サイズバリエーション -->
<button class="btn btn-sm bg-gradient-primary">小</button>
<button class="btn bg-gradient-primary">通常</button>
<button class="btn btn-lg bg-gradient-primary">大</button>
```

#### アイコン付きボタン
```html
<button class="btn bg-gradient-primary">
  <i class="material-symbols-rounded me-2">add</i>
  新規作成
</button>

<button class="btn bg-gradient-danger">
  <i class="material-symbols-rounded me-2">delete</i>
  削除
</button>
```

#### ローディングボタン
```html
<button class="btn bg-gradient-primary" disabled>
  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
  処理中...
</button>
```

### 3. フォーム要素

#### 入力フィールド
```html
<div class="input-group input-group-outline mb-3">
  <label class="form-label">プロジェクト名</label>
  <input type="text" class="form-control">
</div>
```

#### テキストエリア
```html
<div class="input-group input-group-outline mb-3">
  <label class="form-label">説明</label>
  <textarea class="form-control" rows="5"></textarea>
</div>
```

#### セレクトボックス
```html
<div class="input-group input-group-outline mb-3">
  <label class="form-label">優先度</label>
  <select class="form-select">
    <option value="">選択してください</option>
    <option value="high">高</option>
    <option value="medium">中</option>
    <option value="low">低</option>
  </select>
</div>
```

#### スイッチ
```html
<div class="form-check form-switch mb-3">
  <input class="form-check-input" type="checkbox" id="switch1">
  <label class="form-check-label" for="switch1">
    有効化する
  </label>
</div>
```

### 4. バッジとラベル

#### ステータスバッジ
```html
<span class="badge bg-gradient-success">完了</span>
<span class="badge bg-gradient-info">進行中</span>
<span class="badge bg-gradient-warning">保留</span>
<span class="badge bg-gradient-danger">遅延</span>
<span class="badge bg-gradient-secondary">キャンセル</span>
```

#### アイコン付きバッジ
```html
<span class="badge bg-gradient-danger">
  <i class="material-symbols-rounded text-xs me-1">priority_high</i>
  高
</span>
```

### 5. テーブル

#### 基本テーブル
```html
<div class="table-responsive">
  <table class="table align-items-center mb-0">
    <thead>
      <tr>
        <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
          プロジェクト名
        </th>
        <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
          担当者
        </th>
        <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
          状態
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <h6 class="mb-0 text-sm">プロジェクト名</h6>
          <p class="text-xs text-secondary mb-0">説明文</p>
        </td>
        <td>
          <p class="text-xs font-weight-bold mb-0">担当者名</p>
        </td>
        <td class="align-middle text-center">
          <span class="badge badge-sm bg-gradient-success">完了</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 6. アラートと通知

#### アラート
```html
<!-- 成功アラート -->
<div class="alert alert-success alert-dismissible fade show" role="alert">
  <span class="material-symbols-rounded me-2">check_circle</span>
  <strong>成功！</strong> 処理が正常に完了しました。
  <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
</div>

<!-- エラーアラート -->
<div class="alert alert-danger alert-dismissible fade show" role="alert">
  <span class="material-symbols-rounded me-2">error</span>
  <strong>エラー！</strong> 処理に失敗しました。
  <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
</div>
```

### 7. モーダル

```html
<div class="modal fade" id="exampleModal" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">モーダルタイトル</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <p>モーダルコンテンツ</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          キャンセル
        </button>
        <button type="button" class="btn bg-gradient-primary">
          保存
        </button>
      </div>
    </div>
  </div>
</div>
```

## 🎭 アニメーションとトランジション

### ホバーエフェクト

#### カードホバー
```css
.card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
```

#### ボタンホバー
```css
.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

### ローディングスピナー
```html
<div class="spinner-border text-primary" role="status">
  <span class="visually-hidden">読み込み中...</span>
</div>
```

## 🎯 アイコン使用ガイド

### Material Symbols Rounded

#### よく使用するアイコン
| アイコン | 用途 | コード |
|----------|------|--------|
| 📊 | ダッシュボード | `dashboard` |
| 📁 | プロジェクト | `folder` / `work` |
| ✅ | タスク | `task` / `check_circle` |
| 👥 | チーム | `group` / `people` |
| 📈 | レポート | `assessment` / `analytics` |
| ➕ | 追加 | `add` / `add_circle` |
| ✏️ | 編集 | `edit` / `edit_note` |
| 🗑️ | 削除 | `delete` / `delete_forever` |
| 👁️ | 表示 | `visibility` |
| ⚙️ | 設定 | `settings` |
| 🔔 | 通知 | `notifications` |
| ⚠️ | 警告 | `warning` / `error` |

#### 使用例
```html
<!-- 基本 -->
<i class="material-symbols-rounded">dashboard</i>

<!-- サイズ調整 -->
<i class="material-symbols-rounded text-sm">folder</i>
<i class="material-symbols-rounded text-lg">task</i>

<!-- カラー付き -->
<i class="material-symbols-rounded text-success">check_circle</i>
<i class="material-symbols-rounded text-danger">error</i>
```

## 📱 レスポンシブデザイン

### ブレークポイント
| デバイス | 幅 | Bootstrap クラス |
|----------|-----|------------------|
| Extra Small | < 576px | `.col-` |
| Small | ≥ 576px | `.col-sm-` |
| Medium | ≥ 768px | `.col-md-` |
| Large | ≥ 992px | `.col-lg-` |
| Extra Large | ≥ 1200px | `.col-xl-` |

### レスポンシブユーティリティ
```html
<!-- 表示制御 -->
<div class="d-none d-md-block">タブレット以上で表示</div>
<div class="d-block d-md-none">モバイルのみ表示</div>

<!-- テキスト配置 -->
<p class="text-start text-md-center text-lg-end">
  レスポンシブテキスト配置
</p>
```

## 📏 デザイン原則

### 1. 一貫性
- すべてのページで同じスタイルパターンを使用
- カラーパレットを守る
- Material Dashboardのクラスを優先使用

### 2. 階層構造
- 視覚的な階層を明確にする
- 重要な要素を強調する
- ホワイトスペースを適切に使用

### 3. アクセシビリティ
- 十分なコントラスト比を確保
- フォーカス状態を視覚的に表示
- スクリーンリーダー対応

### 4. パフォーマンス
- 不要なアニメーションを避ける
- CSSトランジションを活用
- 画像を最適化する

### 5. ユーザビリティ
- ボタンとリンクを明確に区別
- エラーメッセージは具体的に
- ローディング状態を明示

## ✅ ベストプラクティス

### DO（推奨）
```html
<!-- ✅ Material Dashboardクラス使用 -->
<button class="btn bg-gradient-primary">
  <i class="material-symbols-rounded me-2">add</i>
  新規作成
</button>

<!-- ✅ 一貫したカード構造 -->
<div class="card">
  <div class="card-header pb-0">
    <h6>タイトル</h6>
  </div>
  <div class="card-body">
    コンテンツ
  </div>
</div>

<!-- ✅ レスポンシブグリッド -->
<div class="row">
  <div class="col-xl-3 col-md-6 col-sm-12 mb-4">
    カード
  </div>
</div>
```

### DON'T（非推奨）
```html
<!-- ❌ インラインスタイル -->
<button style="background: blue; color: white; padding: 10px;">
  新規作成
</button>

<!-- ❌ 不統一な構造 -->
<div class="card">
  <div class="p-3">
    <h3>タイトル</h3>
  </div>
</div>

<!-- ❌ 固定幅レイアウト -->
<div style="width: 300px;">
  カード
</div>
```

## 🔗 参考リンク

- [Material Dashboard 3 公式ドキュメント](https://www.creative-tim.com/product/material-dashboard)
- [Bootstrap 5 公式ドキュメント](https://getbootstrap.com/docs/5.3/)
- [Material Symbols アイコン一覧](https://fonts.google.com/icons)

## 📚 関連ドキュメント

- [コーディングスタイルガイド](../.cursor/rules/coding-style.mdc)
- [Vue 3 パターンガイド](../.cursor/rules/vue-patterns.mdc)
- [日本語UIガイドライン](../.cursor/rules/japanese-ui-guidelines.mdc)
- [プロジェクト構造ガイド](../.cursor/rules/project-structure.mdc)

## 🎓 学習リソース

### 初めて Material Dashboard を使用する場合
1. `material-dashboard-master/docs/documentation.html` を確認
2. `src/pages/` 内の既存ページコンポーネントを参照
3. このガイドの基本コンポーネントから始める

### 新規コンポーネント作成時
1. 既存の類似コンポーネントを探す
2. Material Dashboardクラスを優先使用
3. カスタムCSSは必要最小限に
4. レスポンシブ対応を忘れずに

---

**最終更新日**: 2025年1月
**バージョン**: 1.0
**メンテナー**: Zenkoh Development Team

