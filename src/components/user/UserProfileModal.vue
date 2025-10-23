<script setup lang="ts">
// ユーザープロフィールモーダルコンポーネント（統合版）
// 目的: ユーザーの作成・編集・詳細表示を1つのモーダルで提供
// モード: create（新規作成）、edit（編集）、view（表示のみ）

import { ref, computed, watch } from "vue";

// モード型定義
type ModalMode = "create" | "edit" | "view";

// ユーザー情報の型定義
interface User {
  id: number;
  display_name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  department?: string;
  position?: string;
  avatar_url?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  work_hours_start?: string;
  work_hours_end?: string;
  skills?: string[];
  tags?: string[];
  is_active?: boolean;
}

// ユーザープロフィール統計の型定義
interface UserProfileStats {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  productivity_score: number;
}

// ユーザー活動ログの型定義
interface UserActivityLog {
  id: number;
  description: string;
  created_at: string;
}

// 統合フォーム型定義（基本情報 + プロフィール情報）
interface UserForm {
  // 基本情報
  email: string;
  display_name: string;
  password_hash: string;
  is_active: boolean;
  // プロフィール情報
  first_name: string;
  last_name: string;
  phone: string;
  department: string;
  position: string;
  avatar_url: string;
  bio: string;
  timezone: string;
  language: string;
  work_hours_start: string;
  work_hours_end: string;
  skills: string[];
  tags: string[];
}

// Props定義
interface Props {
  show: boolean;
  mode: ModalMode; // create, edit, view
  user: User | null;
  userForm: UserForm;
  userProfileStats?: UserProfileStats | null;
  userActivityLogs?: UserActivityLog[];
  isProfileStatsLoading?: boolean;
  isActivityLogsLoading?: boolean;
}

// Emits定義
interface Emits {
  (e: 'close'): void;
  (e: 'save', form: UserForm): void;
  (e: 'avatar-upload', event: Event): void;
  (e: 'update:user-form', form: UserForm): void;
}

const props = withDefaults(defineProps<Props>(), {
  userProfileStats: null,
  userActivityLogs: () => [],
  isProfileStatsLoading: false,
  isActivityLogsLoading: false
});
const emit = defineEmits<Emits>();

// ローカル参照
const avatarUploadRef = ref<HTMLInputElement>();

// モードに基づいたタイトル
const modalTitle = computed(() => {
  if (props.mode === "create") return "新しいユーザーを作成";
  if (props.mode === "edit") return `${props.user?.display_name || "ユーザー"}を編集`;
  return `${props.user?.display_name || "ユーザー"}のプロフィール`;
});

// 編集可能かどうか
const isEditable = computed(() => props.mode === "create" || props.mode === "edit");

// 統計とアクティビティを表示するか（viewモードのみ）
const showStats = computed(() => props.mode === "view");

// 保存ボタンのラベル
const saveButtonLabel = computed(() => {
  if (props.mode === "create") return "作成";
  if (props.mode === "edit") return "更新";
  return "";
});

// 相対時間表示関数
const getRelativeTime = (timestamp: string): string => {
  if (!timestamp) return "未活動";
  
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now.getTime() - time.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) return `${days}日前`;
  if (hours > 0) return `${hours}時間前`;
  if (minutes > 0) return `${minutes}分前`;
  return "たった今";
};

// フォーム更新ハンドラー
const handleFormUpdate = (field: keyof UserForm, value: any) => {
  const updatedForm = { ...props.userForm, [field]: value };
  emit('update:user-form', updatedForm);
};

// アバターアップロードハンドラー
const handleAvatarUpload = (event: Event) => {
  emit('avatar-upload', event);
};

// モーダル閉じる
const handleClose = () => {
  emit('close');
};

// 保存
const handleSave = () => {
  emit('save', props.userForm);
};
</script>

<template>
  <!-- ユーザープロフィールモーダル（統合版） -->
  <div v-if="show" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="material-symbols-rounded me-2">
              {{ mode === 'create' ? 'person_add' : mode === 'edit' ? 'edit' : 'person' }}
            </i>
            {{ modalTitle }}
          </h5>
          <button type="button" class="btn-close" @click="handleClose"></button>
        </div>
        <div class="modal-body">
          <div class="row">
            <!-- 左側: 基本情報とプロフィール -->
            <div class="col-md-4">
              <div class="card">
                <div class="card-header text-center">
                  <div class="avatar-container mb-3">
                    <img 
                      v-if="userForm.avatar_url" 
                      :src="userForm.avatar_url" 
                      class="avatar-img rounded-circle"
                      style="width: 100px; height: 100px; object-fit: cover;"
                      alt="アバター"
                    >
                    <div 
                      v-else 
                      class="avatar-placeholder rounded-circle d-flex align-items-center justify-content-center"
                      style="width: 100px; height: 100px; background: #e9ecef; margin: 0 auto;"
                    >
                      <i class="material-symbols-rounded" style="font-size: 48px; color: #6c757d;">person</i>
                    </div>
                  </div>
                  <input 
                    v-if="isEditable"
                    type="file" 
                    accept="image/*" 
                    @change="handleAvatarUpload"
                    class="form-control form-control-sm"
                    style="display: none;"
                    id="avatarUpload"
                    ref="avatarUploadRef"
                  >
                  <label v-if="isEditable" for="avatarUpload" class="btn btn-sm btn-outline-primary">
                    アバター変更
                  </label>
                </div>
                <div class="card-body">
                  <form>
                    <!-- 基本情報セクション -->
                    <div class="mb-4">
                      <h6 class="text-sm font-weight-bold mb-3 text-uppercase">
                        <i class="material-symbols-rounded text-sm me-1">badge</i>
                        基本情報
                      </h6>
                      
                      <!-- メールアドレス -->
                      <div class="mb-3">
                        <label class="form-label">
                          メールアドレス
                          <span v-if="mode === 'create'" class="text-danger">*</span>
                        </label>
                        <input 
                          type="email" 
                          class="form-control" 
                          :value="userForm.email"
                          :readonly="!isEditable"
                          :required="mode === 'create'"
                          @input="handleFormUpdate('email', ($event.target as HTMLInputElement).value)"
                          placeholder="user@example.com"
                        >
                      </div>

                      <!-- 表示名 -->
                      <div class="mb-3">
                        <label class="form-label">
                          表示名
                          <span v-if="mode === 'create'" class="text-danger">*</span>
                        </label>
                        <input 
                          type="text" 
                          class="form-control" 
                          :value="userForm.display_name"
                          :readonly="!isEditable"
                          :required="mode === 'create'"
                          @input="handleFormUpdate('display_name', ($event.target as HTMLInputElement).value)"
                          placeholder="山田太郎"
                        >
                      </div>

                      <!-- パスワード（新規作成時のみ） -->
                      <div v-if="mode === 'create'" class="mb-3">
                        <label class="form-label">
                          パスワード
                          <span class="text-danger">*</span>
                        </label>
                        <input 
                          type="password" 
                          class="form-control" 
                          :value="userForm.password_hash"
                          required
                          @input="handleFormUpdate('password_hash', ($event.target as HTMLInputElement).value)"
                          placeholder="8文字以上"
                        >
                      </div>

                      <!-- ステータス -->
                      <div class="mb-3">
                        <label class="form-label">ステータス</label>
                        <div v-if="isEditable">
                          <select 
                            class="form-select"
                            :value="userForm.is_active ? 'active' : 'inactive'"
                            @change="handleFormUpdate('is_active', ($event.target as HTMLSelectElement).value === 'active')"
                          >
                            <option value="active">アクティブ</option>
                            <option value="inactive">非アクティブ</option>
                          </select>
                        </div>
                        <div v-else>
                          <span 
                            class="badge"
                            :class="userForm.is_active ? 'bg-success' : 'bg-secondary'"
                          >
                            {{ userForm.is_active ? 'アクティブ' : '非アクティブ' }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- プロフィール情報セクション -->
                    <div class="mb-3">
                      <h6 class="text-sm font-weight-bold mb-3 text-uppercase">
                        <i class="material-symbols-rounded text-sm me-1">person</i>
                        プロフィール情報
                      </h6>
                      
                      <div class="mb-3">
                        <label class="form-label">姓</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          :value="userForm.last_name"
                          :readonly="!isEditable"
                          @input="handleFormUpdate('last_name', ($event.target as HTMLInputElement).value)"
                          placeholder="山田"
                        >
                      </div>
                      <div class="mb-3">
                        <label class="form-label">名</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          :value="userForm.first_name"
                          :readonly="!isEditable"
                          @input="handleFormUpdate('first_name', ($event.target as HTMLInputElement).value)"
                          placeholder="太郎"
                        >
                      </div>
                      <div class="mb-3">
                        <label class="form-label">電話番号</label>
                        <input 
                          type="tel" 
                          class="form-control" 
                          :value="userForm.phone"
                          :readonly="!isEditable"
                          @input="handleFormUpdate('phone', ($event.target as HTMLInputElement).value)"
                          placeholder="03-1234-5678"
                        >
                      </div>
                      <div class="mb-3">
                        <label class="form-label">部署</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          :value="userForm.department"
                          :readonly="!isEditable"
                          @input="handleFormUpdate('department', ($event.target as HTMLInputElement).value)"
                          placeholder="開発部"
                        >
                      </div>
                      <div class="mb-3">
                        <label class="form-label">役職</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          :value="userForm.position"
                          :readonly="!isEditable"
                          @input="handleFormUpdate('position', ($event.target as HTMLInputElement).value)"
                          placeholder="シニアエンジニア"
                        >
                      </div>
                      <div class="mb-3">
                        <label class="form-label">自己紹介</label>
                        <textarea 
                          class="form-control" 
                          rows="3"
                          :value="userForm.bio"
                          :readonly="!isEditable"
                          @input="handleFormUpdate('bio', ($event.target as HTMLTextAreaElement).value)"
                          placeholder="自己紹介を入力してください"
                        ></textarea>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <!-- 右側: 統計情報と活動履歴（viewモードのみ） -->
            <div v-if="showStats" class="col-md-8">
              <!-- 統計情報 -->
              <div class="card mb-4">
                <div class="card-header">
                  <h6 class="mb-0">
                    <i class="material-symbols-rounded text-sm me-1">analytics</i>
                    パフォーマンス統計
                  </h6>
                </div>
                <div class="card-body">
                  <div v-if="isProfileStatsLoading" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">読み込み中...</span>
                    </div>
                  </div>
                  <div v-else-if="userProfileStats" class="row">
                    <div class="col-md-3 col-6 mb-3">
                      <div class="text-center">
                        <h4 class="mb-0 text-primary">{{ userProfileStats.total_tasks }}</h4>
                        <p class="text-sm mb-0">総タスク数</p>
                      </div>
                    </div>
                    <div class="col-md-3 col-6 mb-3">
                      <div class="text-center">
                        <h4 class="mb-0 text-success">{{ userProfileStats.completed_tasks }}</h4>
                        <p class="text-sm mb-0">完了タスク</p>
                      </div>
                    </div>
                    <div class="col-md-3 col-6 mb-3">
                      <div class="text-center">
                        <h4 class="mb-0 text-warning">{{ userProfileStats.in_progress_tasks }}</h4>
                        <p class="text-sm mb-0">進行中</p>
                      </div>
                    </div>
                    <div class="col-md-3 col-6 mb-3">
                      <div class="text-center">
                        <h4 class="mb-0 text-danger">{{ userProfileStats.overdue_tasks }}</h4>
                        <p class="text-sm mb-0">遅延タスク</p>
                      </div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <div class="text-center">
                        <h4 class="mb-0 text-info">{{ userProfileStats.completion_rate }}%</h4>
                        <p class="text-sm mb-0">完了率</p>
                      </div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <div class="text-center">
                        <h4 class="mb-0 text-primary">{{ userProfileStats.productivity_score }}</h4>
                        <p class="text-sm mb-0">生産性スコア</p>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center py-4 text-muted">
                    統計情報がありません
                  </div>
                </div>
              </div>

              <!-- 活動履歴 -->
              <div class="card">
                <div class="card-header">
                  <h6 class="mb-0">
                    <i class="material-symbols-rounded text-sm me-1">history</i>
                    最近の活動
                  </h6>
                </div>
                <div class="card-body">
                  <div v-if="isActivityLogsLoading" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">読み込み中...</span>
                    </div>
                  </div>
                  <div v-else-if="userActivityLogs && userActivityLogs.length > 0" class="activity-list">
                    <div 
                      v-for="log in userActivityLogs.slice(0, 10)" 
                      :key="log.id"
                      class="activity-item d-flex align-items-center mb-3"
                    >
                      <div class="activity-icon me-3">
                        <i class="material-symbols-rounded text-primary">task_alt</i>
                      </div>
                      <div class="activity-content flex-grow-1">
                        <p class="mb-1 text-sm">{{ log.description }}</p>
                        <small class="text-muted">{{ getRelativeTime(log.created_at) }}</small>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center py-4 text-muted">
                    活動履歴がありません
                  </div>
                </div>
              </div>
            </div>

            <!-- 作成・編集モード時の右側（ガイド・ヘルプ） -->
            <div v-else class="col-md-8">
              <div class="card">
                <div class="card-header">
                  <h6 class="mb-0">
                    <i class="material-symbols-rounded text-sm me-1">info</i>
                    {{ mode === 'create' ? 'ユーザー作成ガイド' : 'ユーザー編集' }}
                  </h6>
                </div>
                <div class="card-body">
                  <div v-if="mode === 'create'" class="guide-content">
                    <h6 class="text-sm font-weight-bold mb-3">必須項目</h6>
                    <ul class="list-unstyled mb-4">
                      <li class="mb-2">
                        <i class="material-symbols-rounded text-sm text-danger me-2">radio_button_checked</i>
                        <strong>メールアドレス:</strong> ユーザーのログインに使用されます
                      </li>
                      <li class="mb-2">
                        <i class="material-symbols-rounded text-sm text-danger me-2">radio_button_checked</i>
                        <strong>表示名:</strong> システム全体で表示される名前です
                      </li>
                      <li class="mb-2">
                        <i class="material-symbols-rounded text-sm text-danger me-2">radio_button_checked</i>
                        <strong>パスワード:</strong> 8文字以上を推奨します
                      </li>
                    </ul>

                    <h6 class="text-sm font-weight-bold mb-3">オプション項目</h6>
                    <ul class="list-unstyled">
                      <li class="mb-2">
                        <i class="material-symbols-rounded text-sm text-info me-2">check_circle</i>
                        プロフィール情報は後から追加・編集できます
                      </li>
                      <li class="mb-2">
                        <i class="material-symbols-rounded text-sm text-info me-2">check_circle</i>
                        アバター画像もいつでもアップロード可能です
                      </li>
                    </ul>
                  </div>

                  <div v-else class="guide-content">
                    <div class="alert alert-info">
                      <i class="material-symbols-rounded me-2">info</i>
                      <strong>編集モード</strong><br>
                      左側のフォームからユーザー情報を編集してください。<br>
                      変更を保存するには「更新」ボタンをクリックしてください。
                    </div>

                    <div class="mt-4">
                      <h6 class="text-sm font-weight-bold mb-3">注意事項</h6>
                      <ul class="list-unstyled">
                        <li class="mb-2">
                          <i class="material-symbols-rounded text-sm text-warning me-2">warning</i>
                          パスワードは編集できません（セキュリティのため）
                        </li>
                        <li class="mb-2">
                          <i class="material-symbols-rounded text-sm text-info me-2">info</i>
                          ステータスを「非アクティブ」にするとログインできなくなります
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="handleClose">
            {{ isEditable ? 'キャンセル' : '閉じる' }}
          </button>
          <button 
            v-if="isEditable" 
            type="button" 
            class="btn btn-primary" 
            @click="handleSave"
          >
            <i class="material-symbols-rounded me-1">save</i>
            {{ saveButtonLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ユーザープロフィールモーダルのスタイリング（統合版） */
.modal {
  z-index: 1050;
}

.modal-dialog {
  margin-top: 3rem;
  max-width: 1200px;
}

/* アバタースタイリング */
.avatar-img {
  border: 3px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.avatar-placeholder {
  border: 3px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* カードホバーエフェクト */
.card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* フォームスタイリング */
.form-control[readonly] {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #344767;
  margin-bottom: 0.5rem;
}

.text-danger {
  color: #dc3545 !important;
}

/* セクション見出しスタイリング */
h6.text-sm.font-weight-bold {
  color: #344767;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}

/* ガイドコンテンツスタイリング */
.guide-content {
  padding: 1rem;
}

.guide-content ul {
  padding-left: 0;
}

.guide-content li {
  display: flex;
  align-items: flex-start;
  padding: 0.5rem 0;
}

.guide-content .material-symbols-rounded {
  margin-top: 0.125rem;
}

/* アラートスタイリング */
.alert {
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  padding: 1rem;
}

.alert .material-symbols-rounded {
  font-size: 24px;
  flex-shrink: 0;
}

/* 活動アイテムスタイリング */
.activity-item {
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease-in-out;
}

.activity-item:hover {
  background-color: #f8f9fa;
}

.activity-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e3f2fd;
  border-radius: 50%;
  flex-shrink: 0;
}

/* モーダルボタンスタイリング */
.modal-footer .btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.modal-footer .btn .material-symbols-rounded {
  font-size: 18px;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .modal-dialog {
    margin-top: 1rem;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
  
  .col-md-4, .col-md-8 {
    margin-bottom: 1rem;
  }

  .modal-footer {
    flex-direction: column;
    gap: 0.5rem;
  }

  .modal-footer .btn {
    width: 100%;
  }
}

/* アニメーション */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content {
  animation: fadeIn 0.3s ease-out;
}
</style>
