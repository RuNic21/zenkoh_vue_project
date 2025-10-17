<script setup lang="ts">
// アラートルールの作成/編集用モーダル（プレゼンテーショナル）
import { ref, watch, computed } from "vue";

type RuleForm = {
  name: string;
  channel: string;
  enabled: boolean;
};

const props = defineProps<{
  show: boolean;
  initial?: Partial<RuleForm> | null;
  saving?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', form: RuleForm): void;
}>();

const form = ref<RuleForm>({ name: "", channel: "email", enabled: true });

watch(() => props.initial, (v) => {
  form.value = {
    name: v?.name ?? "",
    channel: v?.channel ?? "email",
    enabled: v?.enabled ?? true,
  };
}, { immediate: true });

const canSave = computed(() => !!form.value.name && !!form.value.channel);

const onClose = () => emit('close');
const onSave = () => canSave.value && emit('save', { ...form.value });
</script>

<template>
  <div class="modal fade" :class="{ show: show }" style="display: block;" v-if="show" tabindex="-1" aria-modal="true" role="dialog">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">アラートルールを編集</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="onClose"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">名称</label>
            <input class="form-control" v-model="form.name" placeholder="ルール名" />
          </div>
          <div class="mb-3">
            <label class="form-label">チャネル</label>
            <select class="form-select" v-model="form.channel">
              <option value="email">Email</option>
              <option value="slack">Slack</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" v-model="form.enabled" id="ruleEnabled">
            <label class="form-check-label" for="ruleEnabled">有効</label>
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


