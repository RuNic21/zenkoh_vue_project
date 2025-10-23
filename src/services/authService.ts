// 認証サービス: Supabase Auth との連携
// 目的: ログイン、ログアウト、会員登録、セッション管理を提供

import { supabase } from "./supabaseClient";
import type {
  LoginCredentials,
  SignUpCredentials,
  PasswordResetRequest,
  PasswordUpdate,
  AuthUser,
  AuthResult,
  SessionInfo,
} from "@/types/auth";
import type { Users } from "@/types/db/users";
import { handleServiceCall } from "@/utils/errorHandler";

/**
 * Supabase User を AuthUser に変換
 */
function mapSupabaseUserToAuthUser(
  supabaseUser: any,
  userProfile?: Users
): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    displayName: userProfile?.display_name || supabaseUser.email?.split("@")[0] || "ユーザー",
    avatarUrl: undefined, // TODO: avatar_url をusersテーブルに追加後に実装
    role: "member", // TODO: role をusersテーブルに追加後に実装
    isActive: userProfile?.is_active ?? true,
    createdAt: supabaseUser.created_at || new Date().toISOString(),
  };
}

/**
 * ログイン処理
 * @param credentials メールアドレスとパスワード
 * @returns 認証結果とユーザー情報
 */
export async function login(
  credentials: LoginCredentials
): Promise<AuthResult<AuthUser>> {
  return handleServiceCall(
    async () => {
      // Supabase Auth でログイン
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("ユーザー情報の取得に失敗しました");
      }

      // NOTE: 現在は Supabase Auth のみを使用
      console.log("ログイン成功:", data.user.email);

      return mapSupabaseUserToAuthUser(data.user, undefined);
    },
    "ログインに失敗しました"
  );
}

/**
 * 会員登録処理
 * @param credentials メール、パスワード、表示名
 * @returns 認証結果とユーザー情報
 */
export async function signUp(
  credentials: SignUpCredentials
): Promise<AuthResult<AuthUser>> {
  return handleServiceCall(
    async () => {
      // Supabase Auth で会員登録
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            display_name: credentials.displayName,
          },
          // 開発環境: メール確認をスキップ
          // 注意: これは Supabase 設定で "Confirm email" が無効の場合のみ動作
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("ユーザー登録に失敗しました");
      }

      // NOTE: users テーブルは BIGINT id を使用しているが、
      // Supabase Auth は UUID (string) を使用しているため、
      // 現時点では Supabase Auth のみを使用
      // TODO: users テーブルのスキーマを UUID に変更するか、別途マッピングテーブルを作成
      
      console.log("会員登録成功:", data.user.email);
      
      return mapSupabaseUserToAuthUser(data.user, undefined);
    },
    "会員登録に失敗しました"
  );
}

/**
 * ログアウト処理
 */
export async function logout(): Promise<AuthResult> {
  return handleServiceCall(
    async () => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      return undefined;
    },
    "ログアウトに失敗しました"
  );
}

/**
 * 現在のセッション情報を取得
 */
export async function getCurrentSession(): Promise<AuthResult<SessionInfo | null>> {
  return handleServiceCall(
    async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session) {
        return null;
      }

      const authUser = mapSupabaseUserToAuthUser(data.session.user, undefined);

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at || 0,
        user: authUser,
      };
    },
    "セッション情報の取得に失敗しました"
  );
}

/**
 * 現在のユーザー情報を取得
 */
export async function getCurrentUser(): Promise<AuthResult<AuthUser | null>> {
  return handleServiceCall(
    async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        return null;
      }

      return mapSupabaseUserToAuthUser(data.user, undefined);
    },
    "ユーザー情報の取得に失敗しました"
  );
}

/**
 * パスワードリセットメール送信
 */
export async function sendPasswordResetEmail(
  request: PasswordResetRequest
): Promise<AuthResult> {
  return handleServiceCall(
    async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      return undefined;
    },
    "パスワードリセットメールの送信に失敗しました"
  );
}

/**
 * パスワード更新
 */
export async function updatePassword(
  update: PasswordUpdate
): Promise<AuthResult> {
  return handleServiceCall(
    async () => {
      const { error } = await supabase.auth.updateUser({
        password: update.newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      return undefined;
    },
    "パスワードの更新に失敗しました"
  );
}

/**
 * メールアドレス更新
 */
export async function updateEmail(newEmail: string): Promise<AuthResult> {
  return handleServiceCall(
    async () => {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        throw new Error(error.message);
      }

      return undefined;
    },
    "メールアドレスの更新に失敗しました"
  );
}

/**
 * ユーザープロフィール更新
 * NOTE: 現在 users テーブルとの連携は無効化されています
 * TODO: users テーブルスキーマを UUID に変更後に実装
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Users>
): Promise<AuthResult<Users>> {
  return handleServiceCall(
    async () => {
      console.warn("updateUserProfile: users テーブル連携は現在無効化されています");
      throw new Error("ユーザープロフィール更新機能は準備中です");
    },
    "ユーザープロフィールの更新に失敗しました"
  );
}

/**
 * 認証状態の変更を監視
 * @param callback 認証状態変更時のコールバック
 * @returns 購読解除関数
 */
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): () => void {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("認証状態変更:", event, session?.user?.email);

    if (session?.user) {
      const authUser = mapSupabaseUserToAuthUser(session.user, undefined);
      callback(authUser);
    } else {
      callback(null);
    }
  });

  // 購読解除関数を返す
  return () => {
    data.subscription.unsubscribe();
  };
}

