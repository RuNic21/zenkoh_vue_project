// 認証システム用の型定義
// 目的: Supabase Auth との連携とユーザー認証状態の管理

import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

// ログインフォームデータ
export interface LoginCredentials {
  email: string;
  password: string;
}

// 会員登録フォームデータ
export interface SignUpCredentials {
  email: string;
  password: string;
  displayName: string;
}

// パスワードリセット要求
export interface PasswordResetRequest {
  email: string;
}

// パスワード更新
export interface PasswordUpdate {
  newPassword: string;
}

// アプリケーション用ユーザー情報
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role?: string;
  isActive: boolean;
  createdAt: string;
}

// 認証状態
export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 認証サービスの戻り値型
export interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// セッション情報
export interface SessionInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

// ユーザー権限（将来の拡張用）
export type UserRole = "admin" | "manager" | "member" | "viewer";

// 権限チェック用
export interface Permission {
  resource: string;
  action: "create" | "read" | "update" | "delete";
}

