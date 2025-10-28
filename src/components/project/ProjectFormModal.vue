<script setup lang="ts">
// プロジェクトフォームモーダル: 作成・編集を統合
// 目的: ProjectCreateModalとProjectEditModalの統合により重複コード削減
import { computed } from "vue";
import ModalShell from "@/components/common/ModalShell.vue";
import type { Users } from "@/types/db/users";
import type { ProjectInsert } from "@/types/project";

// Props 定義
interface Props {
  show: boolean; // モーダル表示状態
  mode: "create" | "edit"; // 作成モードまたは編集モード
  formData: ProjectInsert; // プロジェクトフォームデータ
  users: Users[]; // ユーザー一覧（オーナー選択用）
}

const props = defineProps<Props>();

// Emits 定義
const emit = defineEmits<{
  close: []; // モーダルを閉じる
  submit: []; // フォーム送信
}>();

// モードに応じたタイトルとボタンテキストを計算
const modalTitle = computed(() => {
  return props.mode === "create" ? "新しいプロジェクト作成" : "プロジェクト編集";
});

const submitButtonText = computed(() => {
  return props.mode === "create" ? "作成" : "更新";
});

const submitButtonIcon = computed(() => {
  return props.mode === "create" ? "add" : "save";
});
</script>

<template>
  <ModalShell :show="show" :title="modalTitle" size="md" @close="emit('close')">
    <template #default>
      <form class="project-form">
        <!-- 基本情報セクション -->
        <div class="form-section">
          <h6 class="text-sm text-uppercase font-weight-bolder opacity-7 mb-3">
            <i class="material-symbols-rounded me-2" style="vertical-align: middle;">info</i>
            基本情報
          </h6>
          
          <!-- プロジェクト名 -->
          <div class="mb-3">
            <label class="form-label">
              <i class="material-symbols-rounded text-sm me-1" style="vertical-align: middle;">folder</i>
              プロジェクト名 <span class="text-danger">*</span>
            </label>
            <input 
              type="text" 
              class="form-control" 
              v-model="formData.name"
              placeholder="例: 新システム開発プロジェクト"
              required
            >
            <small class="form-text text-muted ms-1">
              <i class="material-symbols-rounded text-xs me-1">lightbulb</i>
              わかりやすく具体的なプロジェクト名を入力してください
            </small>
          </div>

          <!-- 説明 -->
          <div class="mb-3">
            <label class="form-label">
              <i class="material-symbols-rounded text-sm me-1" style="vertical-align: middle;">description</i>
              プロジェクトの説明
            </label>
            <textarea 
              class="form-control" 
              v-model="formData.description"
              placeholder="プロジェクトの目的、概要を入力してください"
              rows="4"
            ></textarea>
          </div>
        </div>

        <!-- チーム情報セクション -->
        <div class="form-section mt-4">
          <h6 class="text-sm text-uppercase font-weight-bolder opacity-7 mb-3">
            <i class="material-symbols-rounded me-2" style="vertical-align: middle;">people</i>
            チーム情報
          </h6>
          
          <!-- プロジェクトオーナー -->
          <div class="mb-3">
            <label class="form-label">
              <i class="material-symbols-rounded text-sm me-1" style="vertical-align: middle;">person</i>
              プロジェクトオーナー
            </label>
            <select 
              class="form-select form-control" 
              v-model="formData.owner_user_id"
            >
              <option :value="null">オーナーを選択してください</option>
              <option 
                v-for="user in users" 
                :key="user.id" 
                :value="user.id"
              >
                {{ user.display_name }}
              </option>
            </select>
            <small class="form-text text-muted ms-1">
              <i class="material-symbols-rounded text-xs me-1">person</i>
              プロジェクト全体の責任者を指定してください
            </small>
          </div>
        </div>

        <!-- スケジュール情報セクション -->
        <div class="form-section mt-4">
          <h6 class="text-sm text-uppercase font-weight-bolder opacity-7 mb-3">
            <i class="material-symbols-rounded me-2" style="vertical-align: middle;">event</i>
            スケジュール
          </h6>
          
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">
                  <i class="material-symbols-rounded text-sm me-1" style="vertical-align: middle;">event_available</i>
                  開始日
                </label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="formData.start_date"
                >
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">
                  <i class="material-symbols-rounded text-sm me-1" style="vertical-align: middle;">event_busy</i>
                  終了予定日
                </label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="formData.end_date"
                >
              </div>
            </div>
          </div>
          <small class="form-text text-muted ms-1">
            <i class="material-symbols-rounded text-xs me-1">schedule</i>
            プロジェクトの計画期間を設定してください
          </small>
        </div>

        <!-- その他の設定セクション -->
        <div class="form-section mt-4">
          <h6 class="text-sm text-uppercase font-weight-bolder opacity-7 mb-3">
            <i class="material-symbols-rounded me-2" style="vertical-align: middle;">settings</i>
            その他の設定
          </h6>
          
          <div class="form-check form-switch ps-0">
            <input 
              class="form-check-input ms-auto" 
              type="checkbox" 
              v-model="formData.is_archived"
              id="isArchived"
            >
            <label class="form-check-label text-body ms-3 text-truncate w-80" for="isArchived">
              <span class="font-weight-bold">アーカイブ状態</span>
              <small class="text-muted d-block">
                {{ mode === 'create' ? 'プロジェクトをアーカイブ状態で作成します' : 'プロジェクトをアーカイブします' }}
              </small>
            </label>
          </div>
        </div>
      </form>
    </template>
    <template #footer>
      <button type="button" class="btn btn-secondary" @click="emit('close')">
        <i class="material-symbols-rounded me-2">close</i>
        キャンセル
      </button>
      <button type="button" class="btn bg-gradient-primary" @click="emit('submit')">
        <i class="material-symbols-rounded me-2">{{ submitButtonIcon }}</i>
        {{ submitButtonText }}
      </button>
    </template>
  </ModalShell>
</template>

<style scoped>
/* プロジェクトフォームスタイリング */
.project-form {
  padding: 0.5rem 0;
}

/* フォームセクション */
.form-section {
  padding: 1rem;
  border-radius: 0.75rem;
  background: linear-gradient(195deg, rgba(66, 66, 74, 0.02) 0%, rgba(25, 25, 25, 0.02) 100%);
  transition: all 0.3s ease;
}

.form-section:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-section h6 {
  color: #344767;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.form-section h6 i {
  color: #cb0c9f;
  font-size: 1.25rem;
}

/* フォームラベルスタイリング */
.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: #344767;
}

.form-label i {
  color: #e91e63;
  vertical-align: middle;
  font-size: 1rem;
}

/* フォームコントロールスタイリング */
.form-control,
.form-select {
  border: 1px solid #d2d6da;
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  transition: all 0.15s ease-in-out;
}

.form-control:focus,
.form-select:focus {
  border-color: #e91e63;
  box-shadow: 0 0 0 2px rgba(233, 30, 99, 0.1);
  outline: 0;
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

/* ヘルプテキストスタイリング */
.form-text {
  font-size: 0.75rem;
  color: #67748e;
  display: flex;
  align-items: center;
  margin-top: 0.25rem;
}

.form-text i {
  font-size: 0.875rem;
  margin-right: 0.25rem;
  color: #82d616;
}

/* スイッチスタイリング */
.form-check.form-switch {
  padding: 1rem;
  border: 1px solid #d2d6da;
  border-radius: 0.75rem;
  background: #fff;
  transition: all 0.2s ease;
}

.form-check.form-switch:hover {
  background: #f8f9fa;
  border-color: #cb0c9f;
}

.form-check-label {
  margin-left: 0.5rem;
  cursor: pointer;
}

.form-check-label small {
  color: #67748e;
  font-size: 0.75rem;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .form-section {
    padding: 0.75rem;
  }
}
</style>

