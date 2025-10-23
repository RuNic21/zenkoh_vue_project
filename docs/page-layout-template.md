# ページレイアウトテンプレート

## 🎯 概要

すべてのページは Material Dashboard 3 の一貫したレイアウト構造に従う必要があります。このドキュメントでは、標準的なページレイアウトテンプレートを定義します。

## 📐 標準ページ構造

### 基本テンプレート

```vue
<template>
  <!-- ページコンテナ（必須） -->
  <div class="container-fluid py-4">
    
    <!-- 1. ページヘッダー（必須） -->
    <PageHeader 
      title="ページタイトル"
      description="ページの説明文"
    />

    <!-- 2. エラー表示（条件付き） -->
    <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mb-4" role="alert">
      <span class="material-symbols-rounded me-2">error</span>
      {{ errorMessage }}
      <button type="button" class="btn-close" @click="errorMessage = ''"></button>
    </div>

    <!-- 3. ローディング表示（条件付き） -->
    <div v-if="isLoading" class="row mb-4">
      <div class="col-12">
        <LoadingSpinner message="データを読み込み中..." />
      </div>
    </div>

    <!-- 4. メインコンテンツ（ローディング完了後） -->
    <template v-else>
      
      <!-- 4-1. 統計カード（オプション） -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <CardHeader title="統計情報" />
            <div class="card-body">
              <StatCards :items="statItems" />
            </div>
          </div>
        </div>
      </div>

      <!-- 4-2. フィルター・アクションパネル（オプション） -->
      <div class="row mb-4">
        <!-- フィルターパネル -->
        <div class="col-lg-8 col-md-12 mb-4 mb-lg-0">
          <div class="card">
            <CardHeader title="フィルター" />
            <div class="card-body">
              <!-- フィルターコンポーネント -->
            </div>
          </div>
        </div>

        <!-- アクションパネル -->
        <div class="col-lg-4 col-md-12">
          <div class="card">
            <CardHeader title="アクション" />
            <div class="card-body">
              <ActionBar>
                <template #left>
                  <button class="btn bg-gradient-primary">
                    <i class="material-symbols-rounded me-2">add</i>
                    新規作成
                  </button>
                </template>
              </ActionBar>
            </div>
          </div>
        </div>
      </div>

      <!-- 4-3. データテーブル/リスト（メインコンテンツ） -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header pb-0">
              <h6>データ一覧</h6>
              <p class="text-sm mb-0">
                <i class="fa fa-table text-info" aria-hidden="true"></i>
                <span class="font-weight-bold ms-1">データ</span>の管理
              </p>
            </div>
            <div class="card-body px-0 pt-0 pb-2">
              <!-- テーブルまたはグリッドコンポーネント -->
              <div v-if="data.length === 0" class="p-4">
                <EmptyState 
                  icon="folder_open"
                  title="データがありません"
                  subtitle="新しいデータを追加してください"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- 5. モーダル（ページ最下部） -->
    <ModalShell :show="showModal" @close="showModal = false">
      <!-- モーダルコンテンツ -->
    </ModalShell>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageHeader from "@/components/common/PageHeader.vue";
import CardHeader from "@/components/common/CardHeader.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import StatCards from "@/components/common/StatCards.vue";
import ActionBar from "@/components/common/ActionBar.vue";
import ModalShell from "@/components/common/ModalShell.vue";

// 状態管理
const isLoading = ref(false);
const errorMessage = ref("");
const showModal = ref(false);
const data = ref([]);

// ライフサイクル
onMounted(async () => {
  // データ読み込み
});
</script>

<style scoped>
/* ページ固有のスタイル（必要最小限） */
</style>
```

## 📏 レイアウトルール

### 1. コンテナ（必須）

すべてのページは `container-fluid py-4` で囲む:

```html
<div class="container-fluid py-4">
  <!-- ページコンテンツ -->
</div>
```

- `container-fluid`: フルード幅コンテナ
- `py-4`: 上下パディング（1.5rem）

### 2. ページヘッダー（必須）

すべてのページは `PageHeader` コンポーネントを使用:

```vue
<PageHeader 
  title="ページタイトル"
  description="ページの説明文"
/>
```

**代替形式（カスタムヘッダー）:**
```html
<div class="row mb-4">
  <div class="col-12">
    <div class="ms-3">
      <h3 class="mb-0 h4 font-weight-bolder">ページタイトル</h3>
      <p class="mb-4">ページの説明文</p>
    </div>
  </div>
</div>
```

### 3. セクションスペーシング

セクション間のマージンは `mb-4` で統一:

```html
<!-- 統計カードセクション -->
<div class="row mb-4">
  <!-- ... -->
</div>

<!-- フィルターセクション -->
<div class="row mb-4">
  <!-- ... -->
</div>

<!-- テーブルセクション（最終セクションは mb-4 不要） -->
<div class="row">
  <!-- ... -->
</div>
```

### 4. グリッドレイアウト

#### フルワイドセクション
```html
<div class="row mb-4">
  <div class="col-12">
    <!-- コンテンツ -->
  </div>
</div>
```

#### 2カラムレイアウト（8:4）
```html
<div class="row mb-4">
  <div class="col-lg-8 col-md-12 mb-4 mb-lg-0">
    <!-- メインコンテンツ -->
  </div>
  <div class="col-lg-4 col-md-12">
    <!-- サイドバー -->
  </div>
</div>
```

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

### 5. カード構造

#### 基本カード
```html
<div class="card">
  <CardHeader title="カードタイトル" />
  <div class="card-body">
    <!-- コンテンツ -->
  </div>
</div>
```

#### データテーブルカード
```html
<div class="card">
  <div class="card-header pb-0">
    <h6>テーブルタイトル</h6>
    <p class="text-sm mb-0">
      <i class="fa fa-table text-info" aria-hidden="true"></i>
      <span class="font-weight-bold ms-1">サブタイトル</span>
    </p>
  </div>
  <div class="card-body px-0 pt-0 pb-2">
    <!-- テーブルコンテンツ -->
  </div>
</div>
```

### 6. ローディング・エラー表示

#### ローディング状態
```html
<div v-if="isLoading" class="row mb-4">
  <div class="col-12">
    <LoadingSpinner message="データを読み込み中..." />
  </div>
</div>
```

または:
```html
<div v-if="isLoading" class="alert alert-secondary mb-4" role="alert">
  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
  読み込み中です...
</div>
```

#### エラー状態
```html
<div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mb-4" role="alert">
  <span class="material-symbols-rounded me-2">error</span>
  {{ errorMessage }}
  <button type="button" class="btn-close" @click="errorMessage = ''"></button>
</div>
```

#### 空状態
```html
<EmptyState 
  icon="folder_open"
  title="データがありません"
  subtitle="新しいデータを追加してください"
/>
```

### 7. モーダル配置

モーダルはページの最下部、`</div>` (container-fluid終了タグ) の直前に配置:

```vue
<template>
  <div class="container-fluid py-4">
    <!-- ページコンテンツ -->
    
    <!-- モーダル（ページ最下部） -->
    <ModalShell :show="showModal" @close="showModal = false">
      <!-- モーダルコンテンツ -->
    </ModalShell>
  </div>
</template>
```

## 🎨 ページタイプ別テンプレート

### 一覧ページ（List Page）

```vue
<template>
  <div class="container-fluid py-4">
    <!-- ページヘッダー -->
    <PageHeader 
      title="データ一覧"
      description="データの管理・編集を行えます"
    />

    <!-- エラー表示 -->
    <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mb-4" role="alert">
      <span class="material-symbols-rounded me-2">error</span>
      {{ errorMessage }}
      <button type="button" class="btn-close" @click="clearError"></button>
    </div>

    <!-- フィルター・アクション -->
    <div class="row mb-4">
      <div class="col-lg-8 col-md-12 mb-4 mb-lg-0">
        <!-- フィルター -->
      </div>
      <div class="col-lg-4 col-md-12">
        <!-- アクション -->
      </div>
    </div>

    <!-- データテーブル -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <!-- テーブル -->
        </div>
      </div>
    </div>

    <!-- モーダル -->
  </div>
</template>
```

### 詳細ページ（Detail Page）

```vue
<template>
  <div class="container-fluid py-4">
    <!-- ページヘッダー -->
    <PageHeader 
      title="データ詳細"
      description="データの詳細情報を確認・編集できます"
    />

    <!-- 詳細ヘッダー -->
    <div class="row mb-4">
      <div class="col-12">
        <!-- 詳細ヘッダーコンポーネント -->
      </div>
    </div>

    <!-- メインコンテンツ（2カラム） -->
    <div class="row">
      <div class="col-lg-8 col-md-12 mb-4">
        <!-- メインコンテンツ -->
      </div>
      <div class="col-lg-4 col-md-12">
        <!-- サイドバー -->
      </div>
    </div>
  </div>
</template>
```

### ダッシュボードページ（Dashboard Page）

```vue
<template>
  <div class="container-fluid py-4">
    <!-- ページヘッダー -->
    <PageHeader 
      title="ダッシュボード"
      description="プロジェクトの進捗状況を確認できます"
    />

    <!-- 統計カード（4カラム） -->
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

    <!-- チャート・データ表示 -->
    <div class="row">
      <div class="col-lg-8 col-md-12 mb-4">
        <!-- チャートカード -->
      </div>
      <div class="col-lg-4 col-md-12">
        <!-- アクティビティフィード -->
      </div>
    </div>
  </div>
</template>
```

## ✅ チェックリスト

新しいページを作成する際のチェックリスト:

- [ ] `<div class="container-fluid py-4">` でページをラップ
- [ ] `PageHeader` コンポーネントを使用
- [ ] エラー表示を `alert-danger` で実装
- [ ] ローディング表示を `LoadingSpinner` で実装
- [ ] セクション間のマージンは `mb-4` で統一
- [ ] カードは `CardHeader` コンポーネントを使用
- [ ] 空状態は `EmptyState` コンポーネントを使用
- [ ] モーダルはページ最下部に配置
- [ ] レスポンシブ対応（`col-lg-`, `col-md-`, `col-sm-`）
- [ ] Material Dashboard のクラスを優先使用

## 🚨 注意事項

### やってはいけないこと

❌ **インラインスタイルの使用**
```html
<div style="padding: 20px; margin: 10px;">
```

❌ **カスタムコンテナの作成**
```html
<div class="my-custom-container">
```

❌ **不一致なスペーシング**
```html
<div class="mb-2">  <!-- 統一性がない -->
<div class="mb-5">  <!-- 統一性がない -->
```

❌ **直接的なカードヘッダー記述（CardHeaderコンポーネントがある場合）**
```html
<div class="card-header">
  <h6>タイトル</h6>
</div>
```

### やるべきこと

✅ **Material Dashboard クラスの使用**
```html
<div class="container-fluid py-4">
<div class="row mb-4">
<div class="card">
```

✅ **共通コンポーネントの活用**
```html
<PageHeader title="タイトル" description="説明" />
<CardHeader title="カードタイトル" />
<LoadingSpinner message="読み込み中..." />
<EmptyState icon="folder_open" title="データなし" />
```

✅ **一貫したスペーシング**
```html
<div class="mb-4">  <!-- 統一された間隔 -->
```

## 📚 関連ドキュメント

- [UI/UX スタイルガイド](./ui-ux-style-guide.md)
- [Material Dashboard UI スタイル](./.cursor/rules/material-dashboard-ui-styles.mdc)
- [Vue パターンガイド](./.cursor/rules/vue-patterns.mdc)

---

**最終更新日**: 2025年1月  
**バージョン**: 1.0  
**メンテナー**: Zenkoh Development Team

