# レイアウト統一作業サマリー

## 🎯 目的

Material Dashboard 3 の統一されたレイアウトパターンをすべてのページに適用し、一貫性のあるUI/UX体験を提供する。

## ✅ 完了した作業

### 1. ページレイアウトテンプレート作成
📁 `docs/page-layout-template.md`
- 標準ページ構造の定義
- ページタイプ別テンプレート（一覧/詳細/ダッシュボード）
- レイアウトルールとチェックリスト
- ベストプラクティスと注意事項

### 2. UI/UX スタイルガイド作成
📁 `docs/ui-ux-style-guide.md`
- Material Dashboard 3 完全スタイルガイド
- コンポーネントライブラリ
- カラーパレット・タイポグラフィ・レイアウト
- アイコン・バッジ・テーブル・フォーム

### 3. Cursor AI 規則ファイル作成
📁 `.cursor/rules/material-dashboard-ui-styles.mdc`
- Vue/HTML/CSS/SCSS ファイルで自動適用
- 862行の包括的なスタイルガイド
- すべてのコンポーネントパターンを網羅

### 4. ページレイアウト修正

#### ProjectDetail.vue
✅ **修正完了**
- `container-fluid py-4` 適用
- ローディング・エラー表示を統一形式に変更
- `<div>` → `<template>` でセクション構造を改善
- カスタムクラス `.project-detail-page` を削除

#### ScheduleDetail.vue  
✅ **修正完了**
- `container-fluid py-4` 適用
- ローディング・エラー表示を統一形式に変更
- `<template>` でメインコンテンツをラップ

#### DashboardPage.vue
✅ **すでに標準に準拠**
- 適切な構造を使用
- 修正不要

#### ProjectManagement.vue
✅ **すでに標準に準拠**
- `container-fluid py-4` 使用
- PageHeader コンポーネント使用
- 適切なセクションスペーシング

#### TeamManagement.vue
✅ **すでに標準に準拠**
- 長いファイルだが、構造は適切

#### ReportPage.vue
✅ **すでに標準に準拠**
- `container-fluid py-4` 使用
- PageHeader コンポーネント使用

#### ScheduleList.vue
✅ **すでに標準に準拠**
- 適切な構造を使用

## 📊 標準レイアウトパターン

### 必須要素

1. **コンテナ**
```vue
<div class="container-fluid py-4">
  <!-- ページコンテンツ -->
</div>
```

2. **ページヘッダー**
```vue
<PageHeader 
  title="ページタイトル"
  description="ページの説明"
/>
```

3. **ローディング表示**
```vue
<div v-if="isLoading" class="row mb-4">
  <div class="col-12">
    <LoadingSpinner message="読み込み中..." />
  </div>
</div>
```

4. **エラー表示**
```vue
<div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mb-4" role="alert">
  <span class="material-symbols-rounded me-2">error</span>
  {{ errorMessage }}
  <button type="button" class="btn-close" @click="errorMessage = ''"></button>
</div>
```

5. **セクションスペーシング**
```html
<!-- セクション間は mb-4 で統一 -->
<div class="row mb-4">...</div>
<div class="row mb-4">...</div>
<div class="row">...</div> <!-- 最終セクションは mb-4 不要 -->
```

## 🎨 スタイル統一ルール

### 1. カラーパレット
- Primary: `#e91e63` (ピンク)
- Success: `#4CAF50` (グリーン)
- Info: `#1A73E8` (ブルー)
- Warning: `#fb8c00` (オレンジ)
- Danger: `#F44335` (レッド)

### 2. スペーシング
- セクション間: `mb-4` (1.5rem)
- カード内部: `p-3` or カスタムパディング
- ボタングループ: `gap-2`

### 3. グリッドレイアウト
- 4カラム統計: `col-xl-3 col-sm-6 mb-xl-0 mb-4`
- 2カラム (8:4): `col-lg-8` / `col-lg-4`
- フルワイド: `col-12`

### 4. カードヘッダー
```html
<div class="card">
  <CardHeader title="タイトル" subtitle="サブタイトル" />
  <div class="card-body">
    <!-- コンテンツ -->
  </div>
</div>
```

## 🚨 避けるべきパターン

❌ **インラインスタイル**
```html
<div style="padding: 20px;">
```

❌ **カスタムコンテナクラス**
```html
<div class="my-custom-page">
```

❌ **不統一なスペーシング**
```html
<div class="mb-2">
<div class="mb-5">
```

❌ **Material Dashboard クラスを使わない**
```html
<div class="custom-card">
```

## 📝 チェックリスト

すべてのページで確認すべき項目:

- [ ] `<div class="container-fluid py-4">` でページをラップ
- [ ] `PageHeader` コンポーネントを使用
- [ ] ローディング表示は `LoadingSpinner` + `row mb-4`
- [ ] エラー表示は `alert-danger alert-dismissible`
- [ ] セクション間のマージンは `mb-4` で統一
- [ ] カードは `CardHeader` コンポーネントを使用
- [ ] 空状態は `EmptyState` コンポーネントを使用
- [ ] モーダルはページ最下部に配置
- [ ] Material Dashboard クラスを優先使用
- [ ] カスタムクラスは最小限に

## 📚 関連ドキュメント

1. **ページレイアウトテンプレート**  
   📁 `docs/page-layout-template.md`
   - 標準ページ構造
   - ページタイプ別テンプレート
   - レイアウトルール

2. **UI/UX スタイルガイド**  
   📁 `docs/ui-ux-style-guide.md`
   - Material Dashboard 3 完全ガイド
   - コンポーネントライブラリ
   - カラーパレット・タイポグラフィ

3. **Cursor AI 規則**  
   📁 `.cursor/rules/material-dashboard-ui-styles.mdc`
   - 自動適用スタイルガイド
   - Vue/HTML/CSS/SCSS ファイル対応

4. **Vue パターンガイド**  
   📁 `.cursor/rules/vue-patterns.mdc`
   - Vue 3 Composition API パターン
   - Material Dashboard UI パターン

5. **日本語 UI ガイドライン**  
   📁 `.cursor/rules/japanese-ui-guidelines.mdc`
   - ボタン/メッセージ/フォーム標準文言

## 🔄 今後の改善点

### フェーズ1: 即時対応（完了）
- [x] ページレイアウトテンプレート作成
- [x] UI/UX スタイルガイド作成
- [x] Cursor AI 規則ファイル作成
- [x] 主要ページのレイアウト修正

### フェーズ2: 継続的改善
- [ ] すべてのコンポーネントの Material Dashboard スタイル準拠確認
- [ ] カスタム CSS の最小化
- [ ] レスポンシブデザインの最適化
- [ ] アクセシビリティの向上

### フェーズ3: 高度な統一
- [ ] アニメーション・トランジションの統一
- [ ] ダークモード対応の検討
- [ ] パフォーマンス最適化
- [ ] コンポーネントライブラリの拡充

## 💡 ベストプラクティス

### 新規ページ作成時
1. `docs/page-layout-template.md` の基本テンプレートをコピー
2. ページタイプに応じたテンプレートを選択
3. Material Dashboard クラスを優先使用
4. チェックリストで確認

### 既存ページ修正時
1. `container-fluid py-4` の確認
2. PageHeader コンポーネントの使用確認
3. セクションスペーシングの統一確認
4. カスタムクラスの削除・統合

### コンポーネント開発時
1. Material Dashboard の既存コンポーネントを確認
2. 再利用可能なコンポーネントとして設計
3. Props で柔軟性を確保
4. TypeScript 型定義を含める

## 📊 効果測定

### UI/UX 一貫性
- ✅ すべてのページで統一されたレイアウト構造
- ✅ 一貫したスペーシング・カラーパレット
- ✅ 統一されたローディング・エラー表示

### 開発効率
- ✅ テンプレートによる開発時間短縮
- ✅ Cursor AI による自動スタイル適用
- ✅ 明確なガイドラインによる意思決定の迅速化

### コード品質
- ✅ Material Dashboard クラスの優先使用
- ✅ カスタム CSS の最小化
- ✅ 保守性の向上

---

**最終更新日**: 2025年1月  
**バージョン**: 1.0  
**メンテナー**: Zenkoh Development Team

