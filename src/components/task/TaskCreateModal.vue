<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { TaskInsert } from "@/types/task";
import type { Project } from "@/types/project";
import ModalShell from "@/components/common/ModalShell.vue";
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/constants/ui";

// Props & Emits
interface Props {
  show: boolean;
  projects: Project[];
  isSubmitting?: boolean;
}

interface Emits {
  (e: "close"): void;
  (e: "submit", task: TaskInsert): void;
}

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false
});

const emit = defineEmits<Emits>();

// フォームデータ（タスク作成用）
const formData = ref<TaskInsert>({
  project_id: 0,
  task_name: "",
  description: "",
  priority: "MEDIUM",
  status: "NOT_STARTED",
  planned_start: null,
  planned_end: null,
  primary_assignee_id: null,
  progress_percent: 0,
  is_archived: false,
});

// バリデーション
const isValid = computed(() => {
  return formData.value.project_id > 0 && formData.value.task_name.trim().length > 0;
});

// モーダルが表示された時にフォームをリセット
watch(() => props.show, (newVal) => {
  if (newVal) {
    resetForm();
  }
});

// フォームリセット
const resetForm = () => {
  formData.value = {
    project_id: props.projects.length > 0 ? props.projects[0].id : 0,
    task_name: "",
    description: "",
    priority: "MEDIUM",
    status: "NOT_STARTED",
    planned_start: null,
    planned_end: null,
    primary_assignee_id: null,
    progress_percent: 0,
    is_archived: false,
  };
};

// 送信ハンドラ
const handleSubmit = () => {
  if (!isValid.value) return;
  emit("submit", { ...formData.value });
};

// 閉じるハンドラ
const handleClose = () => {
  if (!props.isSubmitting) {
    emit("close");
  }
};
</script>

<template>
  <!-- タスク新規作成モーダル -->
  <ModalShell :show="show" title="新しいタスクを作成" @close="handleClose">
    <form @submit.prevent="handleSubmit">
        <!-- プロジェクト選択（必須） -->
        <div class="mb-3">
          <label for="project-select" class="form-label">
            プロジェクト <span class="text-danger">*</span>
          </label>
          <select
            id="project-select"
            v-model.number="formData.project_id"
            class="form-select"
            :disabled="isSubmitting"
            required
          >
            <option :value="0" disabled>プロジェクトを選択してください</option>
            <option
              v-for="project in projects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
        </div>

        <!-- タスク名（必須） -->
        <div class="mb-3">
          <label for="task-name" class="form-label">
            タスク名 <span class="text-danger">*</span>
          </label>
          <input
            id="task-name"
            v-model="formData.task_name"
            type="text"
            class="form-control"
            placeholder="タスク名を入力してください"
            :disabled="isSubmitting"
            required
          />
        </div>

        <!-- タスク説明（任意） -->
        <div class="mb-3">
          <label for="task-description" class="form-label">説明</label>
          <textarea
            id="task-description"
            v-model="formData.description"
            class="form-control"
            rows="3"
            placeholder="タスクの詳細を入力してください（任意）"
            :disabled="isSubmitting"
          ></textarea>
        </div>

        <!-- 優先度とステータス（横並び） -->
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="task-priority" class="form-label">優先度</label>
            <select
              id="task-priority"
              v-model="formData.priority"
              class="form-select"
              :disabled="isSubmitting"
            >
              <option
                v-for="option in TASK_PRIORITY_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="col-md-6">
            <label for="task-status" class="form-label">ステータス</label>
            <select
              id="task-status"
              v-model="formData.status"
              class="form-select"
              :disabled="isSubmitting"
            >
              <option
                v-for="option in TASK_STATUS_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- 計画日付（横並び） -->
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="planned-start" class="form-label">開始予定日</label>
            <input
              id="planned-start"
              v-model="formData.planned_start"
              type="date"
              class="form-control"
              :disabled="isSubmitting"
            />
          </div>
          <div class="col-md-6">
            <label for="planned-end" class="form-label">終了予定日</label>
            <input
              id="planned-end"
              v-model="formData.planned_end"
              type="date"
              class="form-control"
              :disabled="isSubmitting"
            />
          </div>
        </div>
      </form>

    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        キャンセル
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!isValid || isSubmitting"
        @click="handleSubmit"
      >
        <span v-if="isSubmitting">
          <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          作成中...
        </span>
        <span v-else>
          <i class="material-symbols-rounded me-1">add</i>
          作成
        </span>
      </button>
    </template>
  </ModalShell>
</template>

<style scoped>
/* フォームのスタイリング */
.form-label {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  color: #344767;
}

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
  border-color: #5e72e4;
  box-shadow: 0 0 0 0.2rem rgba(94, 114, 228, 0.25);
}

.form-control:disabled,
.form-select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.text-danger {
  color: #dc3545 !important;
}

/* ボタンのスタイリング */
.btn {
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.625rem 1.25rem;
  transition: all 0.15s ease-in-out;
}

.btn-primary {
  background: linear-gradient(310deg, #7928ca, #ff0080);
  border: none;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(121, 40, 202, 0.4);
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #8392ab;
  border: none;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #6c7a89;
  transform: translateY(-1px);
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .row .col-md-6 {
    margin-bottom: 1rem;
  }
  
  .row .col-md-6:last-child {
    margin-bottom: 0;
  }
}
</style>

