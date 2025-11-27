# Supabase Auth と users テーブル統合完了ガイド

## ✅ 実装完了内容

### 1. データベーススキーマ
- ✅ `auth_id` カラム: 既に存在（UUID型、UNIQUE制約付き）
- ✅ `role` カラム: マイグレーションスクリプト作成済み

### 2. コード実装
- ✅ `mapSupabaseUserToAuthUser`: users テーブルの `avatar_url` と `role` を使用
- ✅ `updateUserProfile`: users テーブル更新機能実装
- ✅ `signUp`: 会員登録時に users テーブルにレコード作成（`auth_id` で紐付け）
- ✅ `login`: ログイン時に users テーブルからプロフィール取得
- ✅ `getCurrentSession`: セッション取得時にプロフィール取得
- ✅ `getCurrentUser`: ユーザー情報取得時にプロフィール取得

### 3. 型定義
- ✅ `Users` インターフェースに `role` フィールド追加

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

## 🔧 使用方法

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

### 権限チェック

```typescript
import { useAuth } from "@/composables/useAuth";

const { user, hasRole } = useAuth();

// 権限チェック
if (hasRole("admin")) {
  // 管理者のみ実行可能な処理
}
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

## 🎯 解決された問題

### Before（問題）
- ❌ Supabase Auth の UUID と users テーブルの BIGINT id が不一致
- ❌ 会員登録時に users テーブルにレコード作成不可
- ❌ プロフィール情報（avatar_url, role）が取得できない
- ❌ プロフィール更新機能が未実装

### After（解決）
- ✅ `auth_id` カラムで Supabase Auth と users テーブルを紐付け
- ✅ 会員登録時に自動的に users テーブルにレコード作成
- ✅ プロフィール情報（avatar_url, role）を取得可能
- ✅ プロフィール更新機能実装済み

## 🔍 確認事項

### 動作確認チェックリスト

- [ ] マイグレーション実行済み
- [ ] 会員登録時に users テーブルにレコードが作成される
- [ ] ログイン時に users テーブルからプロフィールが取得される
- [ ] `avatar_url` が正しく表示される
- [ ] `role` が正しく取得される
- [ ] `updateUserProfile` でプロフィール更新ができる
- [ ] 権限チェック（`hasRole`）が正しく動作する

## 📚 関連ファイル

- `src/services/authService.ts` - 認証サービス実装
- `src/types/db/users.ts` - users テーブル型定義
- `src/types/auth.ts` - 認証関連型定義
- `src/composables/useAuth.ts` - 認証 Composable
- `scripts/migrations/2025-01-XX_add_auth_id_to_users.sql` - auth_id カラム追加
- `scripts/migrations/2025-01-XX_add_role_to_users.sql` - role カラム追加

## 🚨 注意事項

1. **既存ユーザー**: 既存の users テーブルレコードには `auth_id` が NULL の可能性があります。必要に応じて手動で紐付けを行ってください。

2. **型定義の再生成**: `npm run types:gen` を実行すると、手動で追加した `role` フィールドが上書きされる可能性があります。再生成後は必要に応じて手動で調整してください。

3. **権限管理**: `role` フィールドは `admin`, `manager`, `member`, `viewer` のみ許可されています。データベース制約でチェックされています。

---

**最終更新**: 2025-01-XX
**ステータス**: ✅ 実装完了

