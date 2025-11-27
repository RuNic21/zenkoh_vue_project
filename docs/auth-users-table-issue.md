# 認証システムと users テーブルの統合に関する技術的課題

## 🔴 問題の概要

Supabase Auth と既存の `users` テーブルの間に **データ型の不一致** が存在し、現時点では完全な統合ができていません。

## 📊 データ型の不一致

### Supabase Auth のユーザーID

```typescript
// Supabase Auth
interface AuthUser {
  id: string;  // UUID形式 (例: "d07b5b84-71b0-46ae-a6e0-9407ecf282c3")
  email: string;
  // ...
}
```

### users テーブルのID

```typescript
// src/types/db/users.ts
export interface Users {
  id: number;  // BIGINT (例: 1, 2, 3)
  email: string;
  display_name: string;
  // ...
}
```

## 🚫 発生するエラー

```
POST https://...supabase.co/rest/v1/users 400 (Bad Request)
```

**原因**: Supabase Auth の UUID (string) を BIGINT (number) カラムに挿入しようとしている

## ✅ 現在の対応策（暫定）

認証機能は **Supabase Auth のみ** を使用し、`users` テーブルとの連携は無効化しています。

### 影響範囲

```typescript
// authService.ts - 現在の実装
function mapSupabaseUserToAuthUser(supabaseUser: any, userProfile?: Users) {
  return {
    id: supabaseUser.id,           // Supabase Auth の UUID
    email: supabaseUser.email,
    displayName: supabaseUser.email?.split("@")[0] || "ユーザー",
    avatarUrl: undefined,          // users テーブル未連携
    role: "member",                // デフォルト値（users テーブル未連携）
    isActive: true,
    createdAt: supabaseUser.created_at,
  };
}
```

### 無効化された機能

1. **会員登録時の users テーブル作成**
   ```typescript
   // 従来の実装（無効化）
   await supabase.from("users").insert([{
     id: data.user.id,  // ❌ UUID を BIGINT に挿入できない
     email: credentials.email,
     display_name: credentials.displayName,
     // ...
   }]);
   ```

2. **ログイン時の users テーブルからのプロフィール取得**
   ```typescript
   // 従来の実装（無効化）
   const { data: userProfile } = await supabase
     .from("users")
     .select("*")
     .eq("id", data.user.id);  // ❌ UUID で BIGINT を検索できない
   ```

3. **ユーザープロフィール更新**
   ```typescript
   // 現在は準備中としてエラーを返す
   export async function updateUserProfile() {
     throw new Error("ユーザープロフィール更新機能は準備中です");
   }
   ```

## 🔧 解決策の選択肢

### 方法1: users テーブルのスキーマを変更（推奨）

#### データベース移行

```sql
-- 1. 新しい auth_id カラムを追加
ALTER TABLE users ADD COLUMN auth_id UUID;

-- 2. 既存のデータを移行（必要な場合）
-- 既存ユーザーには NULL または仮の UUID を設定

-- 3. auth_id をプライマリキーまたはユニークキーに設定
ALTER TABLE users ADD CONSTRAINT users_auth_id_unique UNIQUE (auth_id);

-- 4. 外部キー制約を更新
-- tasks, projects などの owner_user_id, created_by は既存の id (BIGINT) を継続使用
```

#### TypeScript 型定義の更新

```typescript
// src/types/db/users.ts
export interface Users {
  id: number;           // 内部管理用ID（既存）
  auth_id: string;      // Supabase Auth のUUID（新規）
  email: string;
  display_name: string;
  is_active: boolean;
  role?: string;        // ユーザー権限（新規）
  avatar_url?: string;  // プロフィール画像（新規）
  created_at: string;
  updated_at: string;
}
```

#### authService.ts の更新

```typescript
// 会員登録時
await supabase.from("users").insert([{
  auth_id: data.user.id,  // ✅ UUID を UUID カラムに挿入
  email: credentials.email,
  display_name: credentials.displayName,
  // id は自動採番
}]);

// プロフィール取得時
const { data: userProfile } = await supabase
  .from("users")
  .select("*")
  .eq("auth_id", data.user.id);  // ✅ UUID で検索
```

### 方法2: マッピングテーブルを作成

```sql
CREATE TABLE auth_user_mapping (
  auth_id UUID PRIMARY KEY,        -- Supabase Auth のID
  user_id BIGINT NOT NULL,         -- 既存 users テーブルのID
  created_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**メリット**:
- 既存の users テーブルスキーマを変更不要
- 既存の外部キー関係を維持

**デメリット**:
- クエリが複雑になる
- 管理が煩雑

### 方法3: 完全に分離（現在の実装）

- Supabase Auth: 認証のみ
- users テーブル: 内部管理用のみ

**メリット**:
- 最も簡単
- 既存のデータベース構造を変更不要

**デメリット**:
- プロフィール情報、権限管理などが制限される
- 将来的な拡張が難しい

## 📅 推奨される移行計画

### Phase 1: 現在（暫定対応）✅

- Supabase Auth のみで認証機能を提供
- users テーブルとの連携なし
- 基本的なログイン・ログアウトは動作

### Phase 2: スキーマ変更（次のステップ）

1. **データベースマイグレーションスクリプト作成**
   ```bash
   # scripts/migrate-users-table.mjs
   ```

2. **users テーブルに auth_id カラム追加**

3. **authService.ts を更新**

4. **既存ユーザーとの紐付け処理**

### Phase 3: 完全統合

1. **ユーザープロフィール機能実装**
   - アバター画像アップロード
   - プロフィール編集
   - 権限管理

2. **既存の owner_user_id との統合**
   - プロジェクト作成時に現在のユーザーを設定
   - タスク作成時に担当者を設定

## 🔨 開発者向けメモ

### 現在の制限事項

1. **ユーザープロフィール情報が限定的**
   ```typescript
   // 利用可能
   user.id         // Supabase Auth のUUID
   user.email      // メールアドレス
   user.displayName // メールアドレスの@前の部分

   // 利用不可（デフォルト値）
   user.role       // 常に "member"
   user.avatarUrl  // 常に undefined
   ```

2. **プロフィール更新不可**
   ```typescript
   await updateUserProfile(userId, { display_name: "新しい名前" });
   // → エラー: "ユーザープロフィール更新機能は準備中です"
   ```

3. **users テーブルとの紐付けなし**
   - プロジェクトの owner_user_id に設定できない
   - タスクの担当者として設定できない

### 回避策

```typescript
// 現在のユーザーIDを取得
import { useAuth } from "@/composables/useAuth";

const { user } = useAuth();
const currentUserId = user.value?.id;  // UUID文字列

// TODO: users テーブルのレコードを検索して、
// 対応する BIGINT の id を取得する必要がある
```

## 📚 関連ドキュメント

- `docs/auth-system-integration.md` - 認証システム全体のガイド
- `src/services/authService.ts` - 認証サービス実装
- `src/types/db/users.ts` - users テーブル型定義
- `src/types/auth.ts` - 認証関連型定義

## 🎯 次のステップ

1. ✅ Phase 1 完了: 基本認証機能動作
2. ✅ Phase 2 完了: データベースマイグレーション実装済み
3. ✅ Phase 3 完了: 完全統合実装済み

## ✅ 解決済み（2025-01-XX）

**問題は解決されました！** 以下の実装が完了しています:

- ✅ `auth_id` カラムで Supabase Auth と users テーブルを紐付け
- ✅ `role` カラム追加（admin, manager, member, viewer）
- ✅ 会員登録時に users テーブルにレコード自動作成
- ✅ ログイン時に users テーブルからプロフィール取得
- ✅ プロフィール更新機能（`updateUserProfile`）実装
- ✅ `avatar_url` と `role` の取得・表示対応

詳細は `docs/auth-integration-complete.md` を参照してください。

---

**最終更新**: 2025-01-XX
**ステータス**: ✅ **解決済み** - 完全統合実装完了

