<script setup lang="ts">
// 会員登録ページ: 新規ユーザー登録フォーム
import { ref } from "vue";
import router from "@/router";
import { useAuth } from "@/composables/useAuth";
import { useMessage } from "@/composables/useMessage";
import type { SignUpCredentials } from "@/types/auth";
const { signUp, isLoading, error, clearError } = useAuth();
const { showSuccess, showError } = useMessage();

// フォーム入力データ
const displayName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const agreeToTerms = ref(false);

// バリデーションエラー
const displayNameError = ref("");
const emailError = ref("");
const passwordError = ref("");
const confirmPasswordError = ref("");
const termsError = ref("");

/**
 * 表示名のバリデーション
 */
const validateDisplayName = (): boolean => {
  displayNameError.value = "";
  
  if (!displayName.value) {
    displayNameError.value = "表示名を入力してください";
    return false;
  }
  
  if (displayName.value.length < 2) {
    displayNameError.value = "表示名は2文字以上で入力してください";
    return false;
  }
  
  if (displayName.value.length > 50) {
    displayNameError.value = "表示名は50文字以内で入力してください";
    return false;
  }
  
  return true;
};

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
  
  if (password.value.length > 72) {
    passwordError.value = "パスワードは72文字以内で入力してください";
    return false;
  }
  
  // パスワード強度チェック（推奨）
  const hasUpperCase = /[A-Z]/.test(password.value);
  const hasLowerCase = /[a-z]/.test(password.value);
  const hasNumber = /[0-9]/.test(password.value);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    passwordError.value = "大文字、小文字、数字を含めてください（推奨）";
  }
  
  return true;
};

/**
 * パスワード確認のバリデーション
 */
const validateConfirmPassword = (): boolean => {
  confirmPasswordError.value = "";
  
  if (!confirmPassword.value) {
    confirmPasswordError.value = "パスワード（確認）を入力してください";
    return false;
  }
  
  if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = "パスワードが一致しません";
    return false;
  }
  
  return true;
};

/**
 * 利用規約同意のバリデーション
 */
const validateTerms = (): boolean => {
  termsError.value = "";
  
  if (!agreeToTerms.value) {
    termsError.value = "利用規約に同意してください";
    return false;
  }
  
  return true;
};

/**
 * 会員登録処理
 */
const handleSignUp = async () => {
  try {
    // バリデーション
    const isDisplayNameValid = validateDisplayName();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const isTermsValid = validateTerms();
    
    if (!isDisplayNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !isTermsValid) {
      return;
    }
    
    clearError();
    
    const credentials: SignUpCredentials = {
      email: email.value.trim(),
      password: password.value,
      displayName: displayName.value.trim(),
    };
    
    const success = await signUp(credentials);
    
    if (success) {
      showSuccess("アカウントが作成されました。ログインしています...");
      
      // ダッシュボードへリダイレクト
      setTimeout(() => {
        router.push({ name: "dashboard" });
      }, 1000);
    } else {
      showError(error.value || "会員登録に失敗しました");
    }
  } catch (e) {
    console.error("会員登録エラー:", e);
    showError("会員登録処理中にエラーが発生しました");
  }
};

/**
 * ログインページへ戻る
 */
const goToLogin = () => {
  router.push({ name: "login" });
};
</script>

<template>
  <div class="signup-page">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-6 col-md-8 col-sm-10">
          <div class="card shadow-lg border-0 mt-4 mb-4">
            <div class="card-header bg-gradient-success p-4 text-center">
              <div class="icon icon-shape icon-lg bg-white shadow text-center border-radius-lg mb-3 mx-auto">
                <i class="material-symbols-rounded text-success">person_add</i>
              </div>
              <h4 class="text-white mb-0">新規アカウント作成</h4>
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
              
              <!-- 会員登録フォーム -->
              <form @submit.prevent="handleSignUp">
                <!-- 表示名 -->
                <div class="input-group input-group-outline mb-3" :class="{ 'is-focused': displayName }">
                  <label class="form-label">表示名</label>
                  <input
                    v-model="displayName"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': displayNameError }"
                    @blur="validateDisplayName"
                    autocomplete="name"
                  />
                </div>
                <div v-if="displayNameError" class="text-danger text-sm mb-3">
                  {{ displayNameError }}
                </div>
                
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
                    autocomplete="new-password"
                  />
                </div>
                <div v-if="passwordError" class="text-danger text-sm mb-3">
                  {{ passwordError }}
                </div>
                
                <!-- パスワード（確認） -->
                <div class="input-group input-group-outline mb-3" :class="{ 'is-focused': confirmPassword }">
                  <label class="form-label">パスワード（確認）</label>
                  <input
                    v-model="confirmPassword"
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': confirmPasswordError }"
                    @blur="validateConfirmPassword"
                    autocomplete="new-password"
                  />
                </div>
                <div v-if="confirmPasswordError" class="text-danger text-sm mb-3">
                  {{ confirmPasswordError }}
                </div>
                
                <!-- 利用規約への同意 -->
                <div class="form-check mb-3">
                  <input
                    v-model="agreeToTerms"
                    class="form-check-input"
                    type="checkbox"
                    id="agreeToTerms"
                    @change="validateTerms"
                  />
                  <label class="form-check-label" for="agreeToTerms">
                    <a href="javascript:;" class="text-primary">利用規約</a>と
                    <a href="javascript:;" class="text-primary">プライバシーポリシー</a>に同意します
                  </label>
                </div>
                <div v-if="termsError" class="text-danger text-sm mb-3">
                  {{ termsError }}
                </div>
                
                <!-- 登録ボタン -->
                <div class="text-center">
                  <button
                    type="submit"
                    class="btn bg-gradient-success w-100 mb-3"
                    :disabled="isLoading"
                  >
                    <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    {{ isLoading ? "登録中..." : "アカウントを作成" }}
                  </button>
                </div>
              </form>
              
              <!-- ログインリンク -->
              <div class="text-center mt-4">
                <p class="text-sm text-secondary mb-2">
                  すでにアカウントをお持ちですか？
                </p>
                <button
                  type="button"
                  class="btn btn-outline-success"
                  @click="goToLogin"
                >
                  <i class="material-symbols-rounded me-2">login</i>
                  ログインページへ
                </button>
              </div>
            </div>
          </div>
          
          <!-- フッター情報 -->
          <div class="text-center mb-4">
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
.signup-page {
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
  box-shadow: 0 0 0 0.2rem rgba(76, 175, 80, 0.25);
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
  .signup-page {
    padding: 1rem;
  }
  
  .card-body {
    padding: 2rem 1.5rem !important;
  }
}
</style>

