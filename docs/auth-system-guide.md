# 認証システム統合ガイド

## 📋 概要

Zenkoh Project Scheduler に Supabase Auth を活用した本格的な認証システムを統合しました。ログイン、会員登録、セッション管理、ルーターガード、users テーブルとの完全統合まで実装済みです。

## ✅ 実装完了内容

### 1. データベーススキーマ
- ✅ `auth_id` カラム: UUID型、UNIQUE制約付き（Supabase Auth と users テーブルを紐付け）
- ✅ `role` カラム: ユーザー権限管理（admin, manager, member, viewer）

### 2. コード実装
- ✅ `mapSupabaseUserToAuthUser`: users テーブルの `avatar_url` と `role` を使用
- ✅ `updateUserProfile`: users テーブル更新機能実装
- ✅ `signUp`: 会員登録時に users テーブルにレコード作成（`auth_id` で紐付け）
- ✅ `login`: ログイン時に users テーブルからプロフィール取得
- ✅ `getCurrentSession`: セッション取得時にプロフィール取得
- ✅ `getCurrentUser`: ユーザー情報取得時にプロフィール取得

### 3. 型定義
- ✅ `Users` インターフェースに `role` フィールド追加
- ✅ `auth_id` フィールドで Supabase Auth UUID と連携

## 🎯 実装内容

### 1. 認証関連ファイル構成

```
src/
├── types/
│   └── auth.ts                    # 認証型定義
├── services/
│   └── authService.ts             # Supabase Auth サービス
├── composables/
│   └── useAuth.ts                 # 認証状態管理 Composable
├── pages/
│   ├── LoginPage.vue              # ログインページ
│   └── SignUpPage.vue             # 会員登録ページ
├── components/common/
│   └── NavigationBar.vue          # ユーザーメニュー
├── router/
│   └── index.ts                   # 認証ガード
└── main.js                        # 認証システム初期化
```

### 2. 主要機能

#### 認証サービス (`authService.ts`)

```typescript
// ログイン
export async function login(credentials: LoginCredentials): Promise<AuthResult<AuthUser>>

// 会員登録
export async function signUp(credentials: SignUpCredentials): Promise<AuthResult<AuthUser>>

// ログアウト
export async function logout(): Promise<AuthResult>

// セッション取得
export async function getCurrentSession(): Promise<AuthResult<SessionInfo | null>>

// ユーザー情報取得
export async function getCurrentUser(): Promise<AuthResult<AuthUser | null>>

// パスワードリセット
export async function sendPasswordResetEmail(request: PasswordResetRequest): Promise<AuthResult>

// パスワード更新
export async function updatePassword(update: PasswordUpdate): Promise<AuthResult>

// プロフィール更新
export async function updateUserProfile(userId: string, updates: Partial<Users>): Promise<AuthResult<Users>>

// 認証状態変更監視
export function onAuthStateChange(callback: (user: AuthUser | null) => void): () => void
```

#### 認証状態管理 (`useAuth.ts`)

```typescript
const {
  // 状態
  user,                  // 現在のユーザー情報
  isAuthenticated,       // 認証状態
  isLoading,             // ローディング状態
  error,                 // エラーメッセージ
  displayName,           // 表示名
  userEmail,             // メールアドレス
  userRole,              // ユーザー権限

  // メソッド
  initializeAuth,        // 認証初期化
  login,                 // ログイン
  signUp,                // 会員登録
  logout,                // ログアウト
  clearError,            // エラークリア
  refreshUser,           // ユーザー情報更新
  hasRole,               // 権限チェック
  requireAuth,           // 認証必須チェック
} = useAuth();
```

### 3. ルート定義

| パス | ルート名 | 認証要否 | 説明 |
|------|---------|----------|------|
| `/login` | `login` | 不要 | ログインページ |
| `/signup` | `signup` | 不要 | 会員登録ページ |
| `/` | `dashboard` | **必要** | ダッシュボード |
| `/projects` | `project-management` | **必要** | プロジェクト管理 |
| `/projects/:id` | `project-detail` | **必要** | プロジェクト詳細 |
| `/tasks` | `schedule-list` | **必要** | タスク管理 |
| `/tasks/:id` | `schedule-detail` | **必要** | タスク詳細 |
| `/team` | `team` | **必要** | チーム管理 |
| `/reports` | `report` | **必要** | レポート |

### 4. ルーターガード

```typescript
router.beforeEach(async (to, from, next) => {
  // 認証が必要なページのチェック
  if (to.meta.requiresAuth) {
    const session = await getCurrentSession();
    
    if (!session) {
      // 認証されていない → ログインページへ
      next({
        name: "login",
        query: { redirect: to.fullPath }
      });
      return;
    }
  }

  // ログイン済みユーザーが認証ページにアクセス → ダッシュボードへ
  if ((to.name === "login" || to.name === "signup") && isAuthenticated) {
    next({ name: "dashboard" });
    return;
  }

  next();
});
```

### 5. 型定義

#### AuthUser（アプリケーション用ユーザー情報）

```typescript
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role?: string;
  isActive: boolean;
  createdAt: string;
}
```

#### LoginCredentials

```typescript
export interface LoginCredentials {
  email: string;
  password: string;
}
```

#### SignUpCredentials

```typescript
export interface SignUpCredentials {
  email: string;
  password: string;
  displayName: string;
}
```

## 📋 マイグレーション実行手順

### Step 1: データベースマイグレーション実行

Supabase ダッシュボードの SQL Editor で以下を実行:

```sql
-- 1. auth_id カラムの確認（既に存在する場合はスキップ）
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- 2. role カラムの追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer'));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. 既存ユーザーにデフォルト権限を設定
UPDATE users SET role = 'member' WHERE role IS NULL;
```

または、マイグレーションスクリプトを実行:

```bash
# Supabase CLI を使用する場合
supabase db push

# または、SQL Editor で直接実行
# scripts/migrations/2025-01-XX_add_auth_id_to_users.sql
# scripts/migrations/2025-01-XX_add_role_to_users.sql
```

### Step 2: 型定義の再生成（オプション）

データベーススキーマ変更後、型定義を再生成:

```bash
npm run types:gen
```

**注意**: `src/types/db/users.ts` は既に `role` フィールドを手動で追加済みです。再生成すると上書きされる可能性があるため、必要に応じて手動で調整してください。

### Step 3: スキーマ確認

```bash
npm run check:schema
```

## 🚀 使用方法

### ログイン処理

```vue
<script setup>
import { useAuth } from "@/composables/useAuth";

const { login, isLoading, error } = useAuth();

const handleLogin = async () => {
  const success = await login({
    email: "user@example.com",
    password: "password123"
  });
  
  if (success) {
    // ログイン成功
    router.push({ name: "dashboard" });
  }
};
</script>
```

### 会員登録処理

```vue
<script setup>
import { useAuth } from "@/composables/useAuth";

const { signUp, isLoading, error } = useAuth();

const handleSignUp = async () => {
  const success = await signUp({
    email: "newuser@example.com",
    password: "password123",
    displayName: "新規ユーザー"
  });
  
  if (success) {
    // 登録成功（自動ログイン）
    router.push({ name: "dashboard" });
  }
};
</script>
```

### ログアウト処理

```vue
<script setup>
import { useAuth } from "@/composables/useAuth";

const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
  // 自動的にログインページへリダイレクト
};
</script>
```

### ユーザー情報表示

```vue
<template>
  <div v-if="isAuthenticated">
    <p>ようこそ、{{ displayName }}さん</p>
    <p>{{ userEmail }}</p>
  </div>
</template>

<script setup>
import { useAuth } from "@/composables/useAuth";

const { isAuthenticated, displayName, userEmail } = useAuth();
</script>
```

### 権限チェック

```vue
<template>
  <button v-if="hasRole('admin')">
    管理者専用機能
  </button>
</template>

<script setup>
import { useAuth } from "@/composables/useAuth";

const { hasRole } = useAuth();
</script>
```

### ユーザープロフィール更新

```typescript
import { updateUserProfile } from "@/services/authService";
import { useAuth } from "@/composables/useAuth";

const { user } = useAuth();

// プロフィール更新
await updateUserProfile(user.value!.id, {
  display_name: "新しい表示名",
  first_name: "太郎",
  last_name: "山田",
  department: "開発部",
  position: "エンジニア",
  role: "manager", // 権限変更
  avatar_url: "https://example.com/avatar.jpg",
});
```

## 📊 データフロー

### 会員登録フロー
1. Supabase Auth で会員登録 → UUID 生成
2. `users` テーブルにレコード作成（`auth_id` = UUID）
3. プロフィール情報を返す

### ログインフロー
1. Supabase Auth でログイン → UUID 取得
2. `users` テーブルから `auth_id` で検索
3. プロフィール情報を取得して返す

### プロフィール更新フロー
1. `auth_id` で `users` テーブルのレコードを検索
2. 指定されたフィールドを更新
3. 更新後のレコードを返す

## 🔐 セキュリティ機能

### 1. パスワード検証

- **最小長**: 6文字
- **推奨**: 大文字、小文字、数字を含む
- **最大長**: 72文字

### 2. セッション管理

- Supabase Auth による安全なセッション管理
- アクセストークン + リフレッシュトークンの自動更新
- セッション有効期限の自動チェック

### 3. CSRF対策

- Supabase Auth のビルトイン CSRF プロテクション

### 4. セキュアな通信

- HTTPS 通信（本番環境）
- トークンの安全な保存（localStorage/sessionStorage）

## 📱 UI/UX 特徴

### ログインページ

- Material Design 3 準拠の美しい UI
- リアルタイムバリデーション
- エラーメッセージの分かりやすい表示
- ローディング状態の可視化
- レスポンシブデザイン

### 会員登録ページ

- 入力フィールドの段階的バリデーション
- パスワード強度チェック
- 利用規約への同意チェック
- 確認パスワードの一致チェック

### ナビゲーションバー

- ユーザーメニューのドロップダウン
- ログアウトボタン
- プロフィール・設定へのリンク（準備中）

## 🛠️ Supabase 設定

### 認証プロバイダー

現在サポート:
- ✅ Email/Password認証

将来実装予定:
- ⏳ Googleログイン
- ⏳ GitHubログイン
- ⏳ マジックリンク（パスワードレス）

### メール設定

Supabase ダッシュボードで以下を設定:
- メール確認の有効化/無効化
- パスワードリセットメールのテンプレート
- リダイレクトURL

## 📊 データベーススキーマ

### users テーブル

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  auth_id UUID UNIQUE,              -- Supabase Auth UUID（認証統合用）
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

## 🔍 確認事項

### 動作確認チェックリスト

- [ ] マイグレーション実行済み
- [ ] 会員登録時に users テーブルにレコードが作成される
- [ ] ログイン時に users テーブルからプロフィールが取得される
- [ ] `avatar_url` が正しく表示される
- [ ] `role` が正しく取得される
- [ ] `updateUserProfile` でプロフィール更新ができる
- [ ] 権限チェック（`hasRole`）が正しく動作する

## 📝 テスト手順

1. **会員登録テスト**
```bash
# ブラウザで /signup にアクセス
# メール・パスワード・表示名を入力
# → ダッシュボードへ自動ログイン
```

2. **ログインテスト**
```bash
# ログアウト後、/login にアクセス
# 登録したメール・パスワードを入力
# → ダッシュボードへリダイレクト
```

3. **認証ガードテスト**
```bash
# ログアウト状態で / にアクセス
# → /login?redirect=/ へリダイレクト
# ログイン後、元のページ（/）へ戻る
```

4. **セッション永続化テスト**
```bash
# ログイン後、ページリフレッシュ
# → ログイン状態が維持される
```

5. **ログアウトテスト**
```bash
# ナビゲーションバーのユーザーメニューからログアウト
# → ログインページへリダイレクト
```

## ⚠️ 注意事項

### 1. 環境変数

`.env.local` に Supabase 認証設定が必要:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. users テーブルとの同期

- Supabase Auth のユーザーID（UUID）と users テーブルの `auth_id` で紐付け
- 会員登録時に users テーブルへレコード自動作成
- `password_hash` は空文字（Supabase Auth で管理）

### 3. セッション有効期限

- デフォルト: 1時間
- リフレッシュトークンで自動更新
- 長期間ログイン維持は「Remember Me」機能で対応

### 4. エラーハンドリング

- すべての認証操作は `AuthResult<T>` 型で統一
- エラーメッセージは日本語化
- ユーザーフレンドリーなエラー表示

### 5. 既存ユーザー

既存の users テーブルレコードには `auth_id` が NULL の可能性があります。必要に応じて手動で紐付けを行ってください。

### 6. 型定義の再生成

`npm run types:gen` を実行すると、手動で追加した `role` フィールドが上書きされる可能性があります。再生成後は必要に応じて手動で調整してください。

### 7. 権限管理

`role` フィールドは `admin`, `manager`, `member`, `viewer` のみ許可されています。データベース制約でチェックされています。

## 🔮 将来の拡張

### 1. ソーシャルログイン

```typescript
// Google ログイン
export async function loginWithGoogle(): Promise<AuthResult<AuthUser>> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  });
  // ...
}
```

### 2. 二段階認証（2FA）

```typescript
// TOTP設定
export async function enableTwoFactor(): Promise<AuthResult> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp'
  });
  // ...
}
```

### 3. メール確認

```typescript
// メール確認状態のチェック
export async function isEmailVerified(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.email_verified ?? false;
}
```

### 4. プロフィール画像

```typescript
// アバター画像アップロード
export async function uploadAvatar(file: File): Promise<AuthResult<string>> {
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`${userId}/${Date.now()}.jpg`, file);
  // ...
}
```

### 5. ユーザー検索・管理

```typescript
// ユーザー検索（管理者用）
export async function searchUsers(query: string): Promise<AuthResult<AuthUser[]>> {
  // ...
}
```

## 📚 関連ファイル

- `src/services/authService.ts` - 認証サービス実装
- `src/types/db/users.ts` - users テーブル型定義
- `src/types/auth.ts` - 認証関連型定義
- `src/composables/useAuth.ts` - 認証 Composable
- `scripts/migrations/2025-01-XX_add_auth_id_to_users.sql` - auth_id カラム追加
- `scripts/migrations/2025-01-XX_add_role_to_users.sql` - role カラム追加

## 🎉 まとめ

認証システムの統合により、Zenkoh Project Scheduler は:

1. **セキュアなアクセス制御**: 認証されたユーザーのみアクセス可能
2. **ユーザー管理**: 会員登録、ログイン、プロフィール管理
3. **セッション管理**: 安全で永続的なセッション
4. **ルーターガード**: 未認証アクセスの自動ブロック
5. **users テーブル統合**: Supabase Auth と完全連携
6. **権限管理**: ロールベースのアクセス制御
7. **将来の拡張性**: ソーシャルログイン、2FA等への対応準備

これにより、エンタープライズ級のアプリケーションとしての基盤がさらに強化されました。

---

**最終更新**: 2025-01-XX  
**ステータス**: ✅ 実装完了・統合完了

