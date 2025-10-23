# Vue Router 統合ガイド

## 📋 概要

Zenkoh Project Scheduler に Vue Router 4 を統合し、本格的な SPA (Single Page Application) アーキテクチャを実現しました。

## 🎯 実装内容

### 1. Vue Router 4 インストール

```bash
npm install vue-router@4
```

### 2. 主要な変更点

#### ファイル構成

```
src/
├── router/
│   └── index.ts          # ルーター設定（新規作成）
├── pages/
│   ├── DashboardPage.vue # ダッシュボードページ（新規作成）
│   ├── ScheduleList.vue
│   ├── ScheduleDetail.vue
│   ├── ProjectManagement.vue
│   ├── ProjectDetail.vue
│   ├── TeamManagement.vue
│   └── ReportPage.vue
├── main.js               # ルーター登録（更新）
├── App.vue               # router-view 使用（大幅簡素化）
├── layouts/MainLayout.vue # router-link 適用（更新）
├── components/common/NavigationBar.vue # ルート情報表示（更新）
└── vite-env.d.ts        # 型定義追加（更新）
```

### 3. ルート定義

| パス | ルート名 | コンポーネント | 説明 |
|------|---------|--------------|------|
| `/` | `dashboard` | DashboardPage | ダッシュボード |
| `/projects` | `project-management` | ProjectManagement | プロジェクト管理 |
| `/projects/:id` | `project-detail` | ProjectDetail | プロジェクト詳細 |
| `/tasks` | `schedule-list` | ScheduleList | タスク管理 |
| `/tasks/:id` | `schedule-detail` | ScheduleDetail | タスク詳細 |
| `/team` | `team` | TeamManagement | チーム管理 |
| `/reports` | `report` | ReportPage | レポート |

### 4. 主要機能

#### ナビゲーションガード

```typescript
// グローバル beforeEach ガード
router.beforeEach((to, from, next) => {
  // ページタイトル動的設定
  if (to.meta.title) {
    document.title = `${to.meta.title} | Zenkoh Project Scheduler`;
  }
  
  // TODO: 認証チェック（将来実装）
  next();
});
```

#### Lazy Loading

全ページコンポーネントは遅延読み込み (Lazy Loading) を使用してパフォーマンスを最適化：

```typescript
const DashboardPage = () => import("@/pages/DashboardPage.vue");
const ScheduleList = () => import("@/pages/ScheduleList.vue");
// ...
```

#### スクロール位置制御

```typescript
scrollBehavior(to, from, savedPosition) {
  if (savedPosition) {
    return savedPosition;
  } else {
    return { top: 0 };
  }
}
```

### 5. コンポーネント更新

#### App.vue の簡素化

**変更前:**
```vue
<!-- 複雑なページ切り替えロジック -->
<div v-if="currentPage === 'dashboard'">...</div>
<component v-else :is="currentComponent" />
```

**変更後:**
```vue
<!-- シンプルな router-view -->
<router-view />
```

#### MainLayout.vue の更新

**変更前:**
```vue
<a href="javascript:;" @click="handleNavigation(item.id)">
  {{ item.name }}
</a>
```

**変更後:**
```vue
<router-link :to="{ name: item.routeName }">
  {{ item.name }}
</router-link>
```

### 6. 型安全性の向上

`src/vite-env.d.ts` に Vue Router の型拡張を追加：

```typescript
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
  }
}
```

## 📦 新規作成ファイル

### src/router/index.ts

ルーター設定ファイル。全ルート定義、ナビゲーションガード、スクロール制御を含む。

### src/pages/DashboardPage.vue

従来 App.vue に含まれていたダッシュボード機能を独立したページコンポーネントとして分離。

## 🔄 移行の影響

### 削除された機能

1. **currentPage ref**: App.vue の手動ページ管理
2. **navigateToPage メソッド**: emit による手動ナビゲーション
3. **currentComponent computed**: 動的コンポーネント選択

### 追加された機能

1. **URL ベースのルーティング**: ブックマーク可能な URL
2. **ブラウザ履歴**: 戻る/進むボタンのサポート
3. **ページタイトル管理**: 各ページに適切なタイトル
4. **Lazy Loading**: 初期ロード時間の短縮

## 🚀 使用方法

### プログラムによるナビゲーション

```typescript
import { useRouter } from "vue-router";

const router = useRouter();

// ルート名でナビゲート
router.push({ name: "project-detail", params: { id: 123 } });

// パスでナビゲート
router.push("/tasks");

// クエリパラメータ付き
router.push({ name: "schedule-list", query: { filter: "urgent" } });
```

### テンプレートでのナビゲーション

```vue
<!-- 基本的なリンク -->
<router-link :to="{ name: 'dashboard' }">ダッシュボード</router-link>

<!-- パラメータ付きリンク -->
<router-link :to="{ name: 'project-detail', params: { id: project.id } }">
  詳細を見る
</router-link>

<!-- アクティブクラス付き -->
<router-link 
  :to="{ name: 'tasks' }"
  active-class="active"
>
  タスク管理
</router-link>
```

### ルート情報の取得

```typescript
import { useRoute } from "vue-router";

const route = useRoute();

// 現在のルート名
console.log(route.name);

// パラメータ
console.log(route.params.id);

// クエリパラメータ
console.log(route.query.filter);
```

## 🎨 スタイリング

Vue Router の `router-link` コンポーネントは自動的にアクティブなリンクに CSS クラスを追加：

- `router-link-active`: 部分一致（親ルートでも適用）
- `router-link-exact-active`: 完全一致

Material Dashboard のスタイルと統合：

```vue
<router-link 
  class="nav-link text-dark"
  :class="{ 'active bg-gradient-primary text-white': isActive(item.routeName) }"
>
```

## 🔮 将来の拡張

### 1. 認証ガード

```typescript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({ name: 'login' });
  } else {
    next();
  }
});
```

### 2. ページトランジション

```vue
<router-view v-slot="{ Component }">
  <transition name="fade" mode="out-in">
    <component :is="Component" />
  </transition>
</router-view>
```

### 3. ネスト ルート

```typescript
{
  path: '/projects/:id',
  component: ProjectDetail,
  children: [
    { path: 'tasks', component: ProjectTasks },
    { path: 'members', component: ProjectMembers },
    { path: 'settings', component: ProjectSettings }
  ]
}
```

### 4. ルートメタデータの活用

```typescript
{
  path: '/admin',
  meta: { 
    requiresAuth: true,
    requiredRole: 'admin',
    layout: 'AdminLayout'
  }
}
```

## 📝 注意事項

### 1. 後方互換性

既存のコードで `emit('navigate', ...)` を使用している箇所は、`router.push()` に変更する必要があります。

### 2. ページリフレッシュ

SPA なので、ページリフレッシュ時に状態が失われます。必要に応じて：
- URL パラメータにデータを保存
- localStorage/sessionStorage を使用
- Vuex/Pinia で永続化

### 3. SEO

SPA は検索エンジンのクローリングに課題があります。将来的に：
- サーバーサイドレンダリング (SSR) を検討
- メタタグの動的管理
- プリレンダリング

## 🧪 テスト

開発サーバーで動作確認：

```bash
npm run dev
```

確認項目：
- ✅ サイドバーのリンクが正常に動作
- ✅ URL が正しく変更される
- ✅ ブラウザの戻る/進むボタンが動作
- ✅ ページタイトルが正しく設定される
- ✅ 直接 URL アクセスが可能
- ✅ ページリフレッシュ後も正しいページが表示

## 🎉 まとめ

Vue Router 4 の統合により、Zenkoh Project Scheduler は本格的な SPA として：

1. **ユーザー体験の向上**: シームレスなページ遷移
2. **開発効率の向上**: 構造化されたルーティング
3. **保守性の向上**: 明確なページ分離
4. **拡張性の向上**: 認証、権限管理などへの対応準備

これにより、エンタープライズ級のアプリケーションとしての基盤が整いました。

