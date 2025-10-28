<script setup lang="ts">
// 通知の作成/編集用モーダル（プレゼンテーショナル）
import { ref, watch, computed } from "vue";
import ModalShell from "@/components/common/ModalShell.vue";

type NotificationForm = {
  subject: string;
  to_email: string;
  body_text: string;
};

interface Props {
  show: boolean;
  initial?: Partial<NotificationForm> | null;
  saving?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", form: NotificationForm): void;
}>();

const form = ref<NotificationForm>({ subject: "", to_email: "", body_text: "" });

watch(() => props.initial, (v) => {
  form.value = {
    subject: v?.subject ?? "",
    to_email: v?.to_email ?? "",
    body_text: v?.body_text ?? "",
  };
}, { immediate: true });

// バリデーション：すべてのフィールドが入力されているか
const canSave = computed(() => {
  return !!(
    form.value.subject.trim() && 
    form.value.to_email.trim() && 
    form.value.body_text.trim()
  );
});

// メールアドレスの形式検証
const isValidEmail = computed(() => {
  if (!form.value.to_email.trim()) return true; // 空の場合はエラー表示しない
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(form.value.to_email);
});

const onClose = () => emit("close");
const onSave = () => {
  if (canSave.value && isValidEmail.value) {
    emit("save", { ...form.value });
  }
};
</script>

<template>
  <!-- 通知作成/編集モーダル -->
  <ModalShell 
    :show="show" 
    title="通知を編集"
    size="lg"
    @close="onClose"
  >
    <template #default>
      <!-- 件名 -->
      <div class="mb-3">
        <label class="form-label">
          <i class="fa fa-heading text-primary me-1"></i>
          件名 <span class="text-danger">*</span>
        </label>
        <input 
          class="form-control" 
          v-model="form.subject" 
          placeholder="件名を入力してください"
          :disabled="saving"
          :class="{ 'is-invalid': !form.subject.trim() && canSave }"
        />
        <small class="text-muted">通知メールの件名</small>
      </div>

      <!-- 送信先メール -->
      <div class="mb-3">
        <label class="form-label">
          <i class="fa fa-envelope text-info me-1"></i>
          送信先メール <span class="text-danger">*</span>
        </label>
        <input 
          type="email"
          class="form-control" 
          v-model="form.to_email" 
          placeholder="example@domain.com"
          :disabled="saving"
          :class="{ 'is-invalid': (!isValidEmail || !form.to_email.trim()) && canSave }"
        />
        <small v-if="!isValidEmail" class="text-danger">
          <i class="fa fa-exclamation-circle me-1"></i>
          正しいメールアドレス形式で入力してください
        </small>
        <small v-else class="text-muted">通知を送信するメールアドレス</small>
      </div>

      <!-- 本文 -->
      <div class="mb-3">
        <label class="form-label">
          <i class="fa fa-file-text text-success me-1"></i>
          本文 <span class="text-danger">*</span>
        </label>
        <textarea 
          class="form-control" 
          rows="6" 
          v-model="form.body_text" 
          placeholder="本文を入力してください"
          :disabled="saving"
          :class="{ 'is-invalid': !form.body_text.trim() && canSave }"
        ></textarea>
        <small class="text-muted">通知メールの本文</small>
      </div>
    </template>

    <template #footer>
      <button 
        type="button" 
        class="btn btn-secondary" 
        @click="onClose"
        :disabled="saving"
      >
        <i class="material-symbols-rounded me-1" style="font-size: 16px; vertical-align: middle;">close</i>
        キャンセル
      </button>
      <button 
        type="button" 
        class="btn btn-primary" 
        :disabled="!canSave || !isValidEmail || saving" 
        @click="onSave"
      >
        <span v-if="saving">
          <span class="spinner-border spinner-border-sm me-1" role="status"></span>
          保存中...
        </span>
        <span v-else>
          <i class="material-symbols-rounded me-1" style="font-size: 16px; vertical-align: middle;">save</i>
          保存
        </span>
      </button>
    </template>
  </ModalShell>
  <!-- /通知作成/編集モーダル -->
</template>

<style scoped>
/* フォームラベル */
.form-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #344767;
}

.form-label i {
  font-size: 1rem;
}

.text-danger {
  color: #ea0606 !important;
}

/* バリデーションエラースタイル */
.is-invalid {
  border-color: #dc3545 !important;
}

.is-invalid:focus {
  border-color: #dc3545 !important;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
}
</style>


