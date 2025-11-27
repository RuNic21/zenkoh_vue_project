# データベーススキーマ確認ガイド

## 🔍 現在のコードとDBの整合性確認

### 確認方法

#### 方法1: スキーマ確認スクリプト実行（推奨）

```bash
npm run check:schema
```

このスクリプトは以下を確認します:
- `auth_id` カラムの存在
- `role` カラムの存在
- その他の必須カラムの存在
- 実際のデータサンプル

#### 方法2: Supabase Dashboard で直接確認

1. Supabase Dashboard にログイン
2. **Table Editor** > **users** テーブルを開く
3. 以下のカラムが存在するか確認:
   - ✅ `auth_id` (UUID型)
   - ✅ `role` (TEXT型)

#### 方法3: SQL Editor で確認

```sql
-- users テーブルのカラム一覧を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;
```

## 📋 必須カラムチェックリスト

### 認証統合用カラム

| カラム名 | 型 | 必須 | 説明 | マイグレーション |
|---------|-----|------|------|----------------|
| `auth_id` | UUID | ✅ | Supabase Auth UUID | `2025-01-XX_add_auth_id_to_users.sql` |
| `role` | TEXT | ✅ | ユーザー権限 | `2025-01-XX_add_role_to_users.sql` |

### 基本カラム

| カラム名 | 型 | 必須 | 説明 |
|---------|-----|------|------|
| `id` | BIGINT | ✅ | プライマリキー |
| `email` | TEXT | ✅ | メールアドレス |
| `display_name` | TEXT | ✅ | 表示名 |
| `password_hash` | TEXT | ✅ | パスワードハッシュ |
| `is_active` | BOOLEAN | ✅ | アクティブ状態 |
| `created_at` | TIMESTAMPTZ | ✅ | 作成日時 |
| `updated_at` | TIMESTAMPTZ | ✅ | 更新日時 |

### オプションカラム

| カラム名 | 型 | 必須 | 説明 |
|---------|-----|------|------|
| `avatar_url` | TEXT | ❌ | アバター画像URL |
| `first_name` | TEXT | ❌ | 名 |
| `last_name` | TEXT | ❌ | 姓 |
| `phone` | TEXT | ❌ | 電話番号 |
| `department` | TEXT | ❌ | 部署 |
| `position` | TEXT | ❌ | 役職 |
| `bio` | TEXT | ❌ | 自己紹介 |
| `timezone` | TEXT | ❌ | タイムゾーン |
| `language` | TEXT | ❌ | 言語 |
| `work_hours_start` | TEXT | ❌ | 勤務開始時刻 |
| `work_hours_end` | TEXT | ❌ | 勤務終了時刻 |
| `skills` | JSONB | ❌ | スキル配列 |
| `tags` | JSONB | ❌ | タグ配列 |
| `last_login_at` | TIMESTAMPTZ | ❌ | 最終ログイン |
| `login_count` | INTEGER | ❌ | ログイン回数 |

## ✅ コードとDBの整合性状態

### 現在のコード実装

**`src/types/db/users.ts`**:
- ✅ `auth_id?: string | null` - 定義済み
- ✅ `role?: "admin" | "manager" | "member" | "viewer" | null` - 定義済み

**`src/services/authService.ts`**:
- ✅ `auth_id` を使用して users テーブルと連携
- ✅ `role` を users テーブルから取得
- ✅ `signUp` 時に `auth_id` と `role` を設定

### 確認が必要な項目

1. **`auth_id` カラムの存在**
   - コード: ✅ 使用中
   - DB: ❓ 確認必要

2. **`role` カラムの存在**
   - コード: ✅ 使用中
   - DB: ❓ 確認必要

## 🔧 マイグレーションが必要な場合

### ステップ1: マイグレーション実行

Supabase Dashboard > SQL Editor で以下を実行:

```sql
-- auth_id カラム追加（存在しない場合）
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- role カラム追加（存在しない場合）
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' 
  CHECK (role IN ('admin', 'manager', 'member', 'viewer'));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 既存ユーザーにデフォルト権限を設定
UPDATE users SET role = 'member' WHERE role IS NULL;
```

または、マイグレーションファイルを使用:

- `scripts/migrations/2025-01-XX_add_auth_id_to_users.sql`
- `scripts/migrations/2025-01-XX_add_role_to_users.sql`

### ステップ2: 型定義の再生成（オプション）

```bash
npm run types:gen
```

**注意**: 再生成すると手動で追加した `role` フィールドが上書きされる可能性があります。
必要に応じて手動で調整してください。

### ステップ3: 動作確認

```bash
# スキーマ確認
npm run check:schema

# 環境テスト
npm run test:env

# CRUDテスト
npm run test:crud:all
```

## 🚨 よくある問題

### 問題1: `auth_id` カラムが存在しない

**症状**:
- 会員登録時にエラー: `column "auth_id" does not exist`
- ログイン時にプロフィール取得失敗

**解決方法**:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
```

### 問題2: `role` カラムが存在しない

**症状**:
- 権限管理ができない
- デフォルトで "member" のみ使用される

**解決方法**:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' 
  CHECK (role IN ('admin', 'manager', 'member', 'viewer'));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
UPDATE users SET role = 'member' WHERE role IS NULL;
```

### 問題3: 型定義とDBスキーマが不一致

**症状**:
- TypeScript エラー
- 実行時エラー

**解決方法**:
1. DBスキーマを確認
2. `npm run types:gen` で型を再生成
3. 必要に応じて手動で調整

## 📚 関連ドキュメント

- [認証統合完了ガイド](./auth-integration-complete.md)
- [認証とusersテーブルの課題](./auth-users-table-issue.md)
- [データベーススキーマ](./database-schema.md)

---

**最終更新**: 2025-01-XX
**確認方法**: `npm run check:schema`

