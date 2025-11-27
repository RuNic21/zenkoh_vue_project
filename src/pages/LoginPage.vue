<script setup lang="ts">
// ログインページ: ユーザー認証フォーム
import { ref, onMounted } from "vue";
import router from "@/router";
import { useAuth } from "@/composables/useAuth";
import { useMessage } from "@/composables/useMessage";
import type { LoginCredentials } from "@/types/auth";

const route = router.currentRoute;
const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
const { showSuccess, showError } = useMessage();

// フォーム入力データ
const email = ref("");
const password = ref("");
const rememberMe = ref(false);

// バリデーションエラー
const emailError = ref("");
const passwordError = ref("");

/**
 * メールアドレスのバリデーション
 */
const validateEmail = (): boolean => {
  emailError.value = "";
  
  if (!email.value) {
    emailError.value = "メールアドレスを入力してください";
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    emailError.value = "有効なメールアドレスを入力してください";
    return false;
  }
  
  return true;
};

/**
 * パスワードのバリデーション
 */
const validatePassword = (): boolean => {
  passwordError.value = "";
  
  if (!password.value) {
    passwordError.value = "パスワードを入力してください";
    return false;
  }
  
  if (password.value.length < 6) {
    passwordError.value = "パスワードは6文字以上で入力してください";
    return false;
  }
  
  return true;
};

/**
 * ログイン処理
 */
const handleLogin = async () => {
  try {
    // バリデーション
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    clearError();
    
    const credentials: LoginCredentials = {
      email: email.value.trim(),
      password: password.value,
    };
    
    const success = await login(credentials);
    
    if (success) {
      showSuccess("ログインに成功しました");
      
      // リダイレクト先を取得（なければダッシュボードへ）
      const redirect = route.value.query.redirect as string || "/";
      router.push(redirect);
    } else {
      showError(error.value || "ログインに失敗しました");
    }
  } catch (e) {
    console.error("ログインエラー:", e);
    showError("ログイン処理中にエラーが発生しました");
  }
};

/**
 * 会員登録ページへ遷移
 */
const goToSignUp = () => {
  router.push({ name: "signup" });
};

/**
 * パスワードリセットページへ遷移（将来実装）
 */
const goToForgotPassword = () => {
  showError("パスワードリセット機能は準備中です");
  // router.push({ name: "forgot-password" });
};

// すでにログイン済みの場合はダッシュボードへリダイレクト
onMounted(() => {
  if (isAuthenticated.value) {
    router.push({ name: "dashboard" });
  }
});
</script>

<template>
  <div class="login-page">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-5 col-md-7 col-sm-9">
          <div class="card shadow-lg border-0 mt-5">
            <div class="card-header bg-gradient-primary p-4 text-center">
              <div class="icon icon-shape icon-lg bg-white shadow text-center border-radius-lg mb-3 mx-auto">
                <i class="material-symbols-rounded text-primary">lock</i>
              </div>
              <h4 class="text-white mb-0">ログイン</h4>
              <p class="text-white opacity-8 mb-0">Zenkoh Project Scheduler</p>
            </div>
            
            <div class="card-body px-lg-5 py-4">
              <!-- エラーメッセージ -->
              <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
                <span class="material-symbols-rounded me-2">error</span>
                {{ error }}
                <button 
                  type="button" 
                  class="btn-close" 
                  @click="clearError"
                  aria-label="Close"
                ></button>
              </div>
              
              <!-- ログインフォーム -->
              <form @submit.prevent="handleLogin">
                <!-- メールアドレス -->
                <div class="input-group input-group-outline mb-3" :class="{ 'is-focused': email }">
                  <label class="form-label">メールアドレス</label>
                  <input
                    v-model="email"
                    type="email"
                    class="form-control"
                    :class="{ 'is-invalid': emailError }"
                    @blur="validateEmail"
                    autocomplete="email"
                  />
                </div>
                <div v-if="emailError" class="text-danger text-sm mb-3">
                  {{ emailError }}
                </div>
                
                <!-- パスワード -->
                <div class="input-group input-group-outline mb-3" :class="{ 'is-focused': password }">
                  <label class="form-label">パスワード</label>
                  <input
                    v-model="password"
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': passwordError }"
                    @blur="validatePassword"
                    autocomplete="current-password"
                  />
                </div>
                <div v-if="passwordError" class="text-danger text-sm mb-3">
                  {{ passwordError }}
                </div>
                
                <!-- ログイン情報を保持 -->
                <div class="form-check form-switch mb-4">
                  <input
                    v-model="rememberMe"
                    class="form-check-input"
                    type="checkbox"
                    id="rememberMe"
                  />
                  <label class="form-check-label" for="rememberMe">
                    ログイン情報を保持する
                  </label>
                </div>
                
                <!-- ログインボタン -->
                <div class="text-center">
                  <button
                    type="submit"
                    class="btn bg-gradient-primary w-100 mb-3"
                    :disabled="isLoading"
                  >
                    <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    {{ isLoading ? "ログイン中..." : "ログイン" }}
                  </button>
                </div>
              </form>
              
              <!-- パスワードを忘れた -->
              <div class="text-center mb-3">
                <a 
                  href="javascript:;" 
                  class="text-primary text-sm font-weight-bold"
                  @click="goToForgotPassword"
                >
                  パスワードを忘れた場合
                </a>
              </div>
              
              <!-- 区切り線 -->
              <div class="text-center">
                <p class="text-sm text-secondary mb-3">または</p>
              </div>
              
              <!-- 会員登録リンク -->
              <div class="text-center">
                <button
                  type="button"
                  class="btn btn-outline-primary w-100"
                  @click="goToSignUp"
                >
                  <i class="material-symbols-rounded me-2">person_add</i>
                  新規アカウント作成
                </button>
              </div>
            </div>
          </div>
          
          <!-- フッター情報 -->
          <div class="text-center mt-4">
            <p class="text-sm text-secondary">
              © 2025 Zenkoh Project Scheduler. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.card {
  border-radius: 1rem;
  transition: transform 0.3s ease-in-out;
}

.card:hover {
  transform: translateY(-5px);
}

.card-header {
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}

.icon-shape {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-shape i {
  font-size: 2rem;
}

.input-group {
  transition: all 0.2s ease-in-out;
}

.input-group.is-focused {
  box-shadow: 0 0 0 0.2rem rgba(233, 30, 99, 0.25);
}

.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 768px) {
  .login-page {
    padding: 1rem;
  }
  
  .card-body {
    padding: 2rem 1.5rem !important;
  }
}
</style>

