<script setup lang="ts">
// 通知の作成/編集用モーダル（プレゼンテーショナル）
import { ref, watch, computed } from "vue";

type Form = {
  subject: string;
  to_email: string;
  body_text: string;
};

const props = defineProps<{
  show: boolean;
  initial?: Partial<Form> | null;
  saving?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', form: Form): void;
}>();

const form = ref<Form>({ subject: "", to_email: "", body_text: "" });

watch(() => props.initial, (v) => {
  form.value = {
    subject: v?.subject ?? "",
    to_email: v?.to_email ?? "",
    body_text: v?.body_text ?? "",
  };
}, { immediate: true });

const canSave = computed(() => !!form.value.subject && !!form.value.to_email && !!form.value.body_text);

const onClose = () => emit('close');
const onSave = () => canSave.value && emit('save', { ...form.value });
</script>

<template>
  <div class="modal fade" :class="{ show: show }" style="display: block;" v-if="show" tabindex="-1" aria-modal="true" role="dialog">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">通知を編集</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="onClose"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">件名</label>
            <input class="form-control" v-model="form.subject" placeholder="件名" />
          </div>
          <div class="mb-3">
            <label class="form-label">送信先メール</label>
            <input class="form-control" v-model="form.to_email" placeholder="example@domain.com" />
          </div>
          <div class="mb-3">
            <label class="form-label">本文</label>
            <textarea class="form-control" rows="6" v-model="form.body_text" placeholder="本文を入力"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn bg-gradient-secondary" @click="onClose">キャンセル</button>
          <button type="button" class="btn bg-gradient-primary" :disabled="!canSave || saving" @click="onSave">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 必要に応じて追加 */
</style>


