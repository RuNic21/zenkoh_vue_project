# Supabase メール確認設定ガイド

## 🔴 問題: "Email not confirmed" エラー

会員登録後、ログイン時に以下のエラーが発生します:

```
POST .../auth/v1/token?grant_type=password 400 (Bad Request)
Error: Email not confirmed
```

## 📋 原因

Supabase Auth の設定で **"Email Confirmation"（メール確認）** が有効になっているため、会員登録後にメールアドレスの確認が必要です。

## ✅ 解決方法（推奨）: メール確認を無効化

### Supabase ダッシュボードでの設定手順

#### Step 1: Supabase ダッシュボードにログイン

1. https://app.supabase.com にアクセス
2. アカウントでログイン

#### Step 2: プロジェクトを選択

1. ダッシュボードでプロジェクト一覧を表示
2. 使用中のプロジェクト（`lqvogafbetifaryzkkmh`）をクリック

#### Step 3: Authentication 設定画面へ移動

1. 左側のメニューから **"Authentication"** をクリック
2. **"Providers"** または **"Email"** タブをクリック

#### Step 4: Email Auth 設定を変更

1. **"Email"** プロバイダーを探す
2. **"Enable Email Confirmations"** または **"Confirm email"** の設定を探す
3. このオプションを **無効化（OFF）** にする
4. **"Save"** ボタンをクリック

### 設定箇所の詳細

```
Supabase Dashboard
  └─ Authentication
      └─ Providers
          └─ Email
              └─ Email Confirmations
                  ☐ Enable Email Confirmations  ← これをOFFに
```

または

```
Supabase Dashboard
  └─ Authentication
      └─ Settings
          └─ Email Auth
              ☐ Confirm email  ← これをOFFに
```

## 🔄 設定変更後の動作

### 変更前（現在の状態）

```
会員登録 → メール送信 → メール確認リンククリック → ログイン可能
                        ↑
                    ここで止まっている
```

### 変更後（推奨）

```
会員登録 → 即座にログイン可能 ✅
```

## 🧪 テスト手順

### 1. 既存のユーザーを削除（オプション）

メール確認が完了していないユーザーは削除することをお勧めします:

1. Supabase Dashboard → Authentication → Users
2. 確認されていないユーザーを見つける
3. 削除（Delete）ボタンをクリック

### 2. 新規会員登録テスト

1. アプリケーションで `/signup` にアクセス
2. 新しいメールアドレスとパスワードを入力
3. 会員登録ボタンをクリック
4. **エラーなしで即座にログイン＆ダッシュボードへリダイレクト**されることを確認

### 3. ログインテスト

1. ログアウト
2. `/login` にアクセス
3. 登録したメールアドレスとパスワードでログイン
4. **エラーなしでダッシュボードへリダイレクト**されることを確認

## 📧 メール確認を有効にする場合（プロダクション環境）

### メリット

- セキュリティ向上（メールアドレスの所有権確認）
- スパム登録の防止
- 正確なユーザー情報の確保

### 必要な追加実装

#### 1. 確認メールテンプレートのカスタマイズ

```
Supabase Dashboard
  └─ Authentication
      └─ Email Templates
          └─ Confirm signup
              ├─ Subject: メールアドレスの確認
              └─ Body: カスタマイズ可能なHTMLテンプレート
```

#### 2. リダイレクトURL設定

```typescript
// authService.ts
const { data, error } = await supabase.auth.signUp({
  email: credentials.email,
  password: credentials.password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/confirm`,
    // または
    // emailRedirectTo: 'https://yourdomain.com/auth/confirm'
  },
});
```

#### 3. 確認ページの作成

```vue
<!-- src/pages/AuthConfirmPage.vue -->
<template>
  <div class="confirm-page">
    <h2>メールアドレスの確認</h2>
    <p>確認中です...</p>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/services/supabaseClient";

const router = useRouter();

onMounted(async () => {
  // URLのハッシュフラグメントから確認トークンを取得
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  
  if (accessToken) {
    // 確認成功
    router.push({ name: 'dashboard' });
  } else {
    // 確認失敗
    router.push({ name: 'login' });
  }
});
</script>
```

#### 4. ユーザーへの案内メッセージ

```vue
<!-- SignUpPage.vue -->
<div v-if="signUpSuccess" class="alert alert-info">
  <h4>会員登録完了！</h4>
  <p>
    {{ email }} 宛に確認メールを送信しました。
    メール内のリンクをクリックして、メールアドレスを確認してください。
  </p>
</div>
```

## 🚨 トラブルシューティング

### Q1: 設定を変更したのにまだエラーが出る

**A**: 以下を試してください:
1. Supabase ダッシュボードで設定が正しく保存されているか確認
2. ブラウザのキャッシュをクリア（Ctrl+Shift+Delete）
3. 新しいメールアドレスで会員登録テスト
4. 既存のユーザーを削除して再登録

### Q2: メール確認リンクが届かない

**A**: 
1. 迷惑メールフォルダを確認
2. Supabase Dashboard → Authentication → Email Templates でメールテンプレートを確認
3. SMTP設定が正しいか確認（Supabase が提供するデフォルトSMTPを使用）

### Q3: メール確認リンクをクリックしても何も起こらない

**A**:
1. リダイレクトURLが正しく設定されているか確認
2. `/auth/confirm` ページが実装されているか確認
3. ブラウザのコンソールでエラーを確認

## 📝 現在の推奨設定（開発環境）

```
✅ Enable Email Confirmations: OFF（無効）
✅ Enable Email Provider: ON（有効）
✅ Enable Auto Confirm: ON（有効） ← この設定がある場合
```

これにより、開発中は即座にログイン可能になります。

## 🔒 本番環境への移行時

本番環境では以下の設定を推奨します:

```
✅ Enable Email Confirmations: ON（有効）
✅ Custom Email Templates: 設定済み
✅ Redirect URLs: 設定済み
✅ Confirmation Page: 実装済み
```

---

**最終更新**: 2025-01-XX
**対象バージョン**: Supabase Auth v2
**ステータス**: 開発環境では無効化推奨

