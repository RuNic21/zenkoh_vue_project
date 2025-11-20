// 認証状態管理 Composable
// 目的: アプリケーション全体で認証状態を共有・管理

import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import * as authService from "@/services/authService";
import type {
  LoginCredentials,
  SignUpCredentials,
  AuthUser,
  AuthState,
} from "@/types/auth";

// グローバル認証状態（シングルトン）
const globalAuthState = ref<AuthState>({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
});

// 認証状態変更監視の購読解除関数
let unsubscribeAuthStateChange: (() => void) | null = null;

/**
 * 認証管理 Composable
 * アプリケーション全体で認証状態を共有
 */
export function useAuth() {
  const router = useRouter();

  // 計算プロパティ
  const user = computed(() => globalAuthState.value.user);
  const isAuthenticated = computed(() => globalAuthState.value.isAuthenticated);
  const isLoading = computed(() => globalAuthState.value.isLoading);
  const error = computed(() => globalAuthState.value.error);

  // ユーザー情報の表示名
  const displayName = computed(() => user.value?.displayName || "ゲスト");
  const userEmail = computed(() => user.value?.email || "");
  const userRole = computed(() => user.value?.role || "member");

  /**
   * 現在のセッションを初期化
   */
  const initializeAuth = async () => {
    try {
      globalAuthState.value.isLoading = true;
      globalAuthState.value.error = null;

      const result = await authService.getCurrentSession();

      if (result.success && result.data) {
        globalAuthState.value.user = result.data.user;
        // SessionInfo から Supabase Session 型への変換は、実際の Session オブジェクトを返すように修正する必要がある
        // 現在は必要最小限のフィールドのみ設定
        globalAuthState.value.session = null; // TODO: 実際のセッションオブジェクトを保存する実装に変更
        globalAuthState.value.isAuthenticated = true;
      } else {
        globalAuthState.value.user = null;
        globalAuthState.value.session = null;
        globalAuthState.value.isAuthenticated = false;
      }
    } catch (e) {
      console.error("認証初期化エラー:", e);
      globalAuthState.value.user = null;
      globalAuthState.value.session = null;
      globalAuthState.value.isAuthenticated = false;
    } finally {
      globalAuthState.value.isLoading = false;
    }
  };

  /**
   * ログイン処理
   */
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      globalAuthState.value.isLoading = true;
      globalAuthState.value.error = null;

      const result = await authService.login(credentials);

      if (result.success && result.data) {
        globalAuthState.value.user = result.data;
        globalAuthState.value.isAuthenticated = true;
        return true;
      } else {
        globalAuthState.value.error = result.error || "ログインに失敗しました";
        return false;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "ログインに失敗しました";
      globalAuthState.value.error = message;
      return false;
    } finally {
      globalAuthState.value.isLoading = false;
    }
  };

  /**
   * 会員登録処理
   */
  const signUp = async (credentials: SignUpCredentials): Promise<boolean> => {
    try {
      globalAuthState.value.isLoading = true;
      globalAuthState.value.error = null;

      const result = await authService.signUp(credentials);

      if (result.success && result.data) {
        globalAuthState.value.user = result.data;
        globalAuthState.value.isAuthenticated = true;
        return true;
      } else {
        globalAuthState.value.error = result.error || "会員登録に失敗しました";
        return false;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "会員登録に失敗しました";
      globalAuthState.value.error = message;
      return false;
    } finally {
      globalAuthState.value.isLoading = false;
    }
  };

  /**
   * ログアウト処理
   */
  const logout = async (): Promise<void> => {
    try {
      globalAuthState.value.isLoading = true;

      await authService.logout();

      globalAuthState.value.user = null;
      globalAuthState.value.session = null;
      globalAuthState.value.isAuthenticated = false;
      globalAuthState.value.error = null;

      // ログインページへリダイレクト
      router.push({ name: "login" });
    } catch (e) {
      console.error("ログアウトエラー:", e);
    } finally {
      globalAuthState.value.isLoading = false;
    }
  };

  /**
   * エラーをクリア
   */
  const clearError = () => {
    globalAuthState.value.error = null;
  };

  /**
   * ユーザー情報を更新
   */
  const refreshUser = async (): Promise<void> => {
    try {
      const result = await authService.getCurrentUser();

      if (result.success && result.data) {
        globalAuthState.value.user = result.data;
        globalAuthState.value.isAuthenticated = true;
      }
    } catch (e) {
      console.error("ユーザー情報更新エラー:", e);
    }
  };

  /**
   * 権限チェック
   */
  const hasRole = (requiredRole: string): boolean => {
    const roleHierarchy: Record<string, number> = {
      viewer: 1,
      member: 2,
      manager: 3,
      admin: 4,
    };

    const userRoleLevel = roleHierarchy[userRole.value] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  };

  /**
   * 認証が必要なページへのアクセスチェック
   */
  const requireAuth = async (): Promise<boolean> => {
    if (isLoading.value) {
      await initializeAuth();
    }

    if (!isAuthenticated.value) {
      router.push({ name: "login", query: { redirect: router.currentRoute.value.fullPath } });
      return false;
    }

    return true;
  };

  /**
   * 認証状態変更の監視を開始
   * コンポーネント内でのみ使用可能（onMounted を使用）
   */
  const startAuthStateListener = () => {
    if (!unsubscribeAuthStateChange) {
      unsubscribeAuthStateChange = authService.onAuthStateChange((user) => {
        globalAuthState.value.user = user;
        globalAuthState.value.isAuthenticated = !!user;
      });
    }
  };

  return {
    // 状態
    user,
    isAuthenticated,
    isLoading,
    error,
    displayName,
    userEmail,
    userRole,

    // メソッド
    initializeAuth,
    login,
    signUp,
    logout,
    clearError,
    refreshUser,
    hasRole,
    requireAuth,
    startAuthStateListener, // 認証状態変更監視を開始
  };
}

/**
 * アプリケーション起動時に一度だけ呼び出す初期化関数
 * コンポーネント外部から呼び出される場合は直接 authService を使用
 */
export async function initializeAuthSystem() {
  try {
    globalAuthState.value.isLoading = true;
    globalAuthState.value.error = null;

    const result = await authService.getCurrentSession();

    if (result.success && result.data) {
      globalAuthState.value.user = result.data.user;
      // SessionInfo から Supabase Session 型への変換は、実際の Session オブジェクトを返すように修正する必要がある
      globalAuthState.value.session = null; // TODO: 実際のセッションオブジェクトを保存する実装に変更
      globalAuthState.value.isAuthenticated = true;
    } else {
      globalAuthState.value.user = null;
      globalAuthState.value.session = null;
      globalAuthState.value.isAuthenticated = false;
    }

    // 認証状態変更の監視を開始
    if (!unsubscribeAuthStateChange) {
      unsubscribeAuthStateChange = authService.onAuthStateChange((user) => {
        globalAuthState.value.user = user;
        globalAuthState.value.isAuthenticated = !!user;
      });
    }
  } catch (e) {
    console.error("認証初期化エラー:", e);
    globalAuthState.value.user = null;
    globalAuthState.value.session = null;
    globalAuthState.value.isAuthenticated = false;
  } finally {
    globalAuthState.value.isLoading = false;
  }
}

/**
 * アプリケーション終了時のクリーンアップ
 */
export function cleanupAuthSystem() {
  if (unsubscribeAuthStateChange) {
    unsubscribeAuthStateChange();
    unsubscribeAuthStateChange = null;
  }
}

