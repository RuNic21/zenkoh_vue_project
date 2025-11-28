<script setup lang="ts">
import { ref, computed } from "vue";
import ModalShell from "./ModalShell.vue";

// タグ管理モーダル: タグの追加と人気タグからの選択を提供
// 親から表示制御とタグ情報を受け取り、追加イベントとクローズイベントをemit
const props = defineProps<{
  // モーダルの表示/非表示
  show: boolean;
  // 人気タグなどの候補一覧
  availableTags: string[];
  // すでに選択済みのタグ
  selectedTags: string[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "add", tag: string): void;
}>();

// 新規タグ入力（モーダル内で完結させる）
const newTagInput = ref<string>("");

// 入力から追加（前後空白をトリムし、空/重複を防止）
const handleAddFromInput = () => {
  const tag = newTagInput.value.trim();
  if (!tag) return;
  if (props.selectedTags.includes(tag)) return;
  emit("add", tag);
  newTagInput.value = "";
};

// 人気タグから追加
const handleAddFromPopular = (tag: string) => {
  if (props.selectedTags.includes(tag)) return;
  emit("add", tag);
};
</script>

<template>
  <!-- タグ管理モーダル -->
  <ModalShell
    :show="props.show"
    title="タグ管理"
    size="md"
    @close="emit('close')"
  >
    <template #default>
      <div>
        <!-- 新しいタグを追加 -->
        <div class="mb-3">
          <label class="form-label">新しいタグを追加</label>
          <div class="input-group">
            <input
              type="text"
              class="form-control"
              v-model="newTagInput"
              placeholder="タグを入力..."
              @keyup.enter="handleAddFromInput"
            >
            <button
              class="btn btn-outline-primary"
              @click="handleAddFromInput"
              :disabled="!newTagInput.trim()"
            >
              <i class="material-symbols-rounded">add</i>
            </button>
          </div>
        </div>

        <!-- 人気タグから選ぶ -->
        <div v-if="availableTags.length > 0" class="mb-3">
          <label class="form-label">
            <i class="material-symbols-rounded me-1" style="font-size: 1rem;">trending_up</i>
            人気タグから選択
            <span class="badge bg-gradient-info ms-2">{{ availableTags.length }}個</span>
          </label>
          <div class="d-flex flex-wrap gap-2 mt-2">
            <button
              v-for="tag in availableTags.slice(0, 12)"
              :key="tag"
              :class="[
                'btn btn-sm',
                (selectedTags || []).includes(tag)
                  ? 'bg-gradient-success text-white'
                  : 'btn-outline-primary'
              ]"
              @click="handleAddFromPopular(tag)"
              :disabled="(selectedTags || []).includes(tag)"
              :title="(selectedTags || []).includes(tag) ? '既に追加済み' : 'クリックして追加'"
            >
              <i 
                v-if="(selectedTags || []).includes(tag)"
                class="material-symbols-rounded me-1"
                style="font-size: 0.875rem;"
              >
                check_circle
              </i>
              <i 
                v-else
                class="material-symbols-rounded me-1"
                style="font-size: 0.875rem;"
              >
                add_circle
              </i>
              {{ tag }}
            </button>
          </div>
          <p v-if="availableTags.length > 12" class="text-sm text-muted mt-2 mb-0">
            他にも {{ availableTags.length - 12 }} 個のタグがあります
          </p>
        </div>
        <div v-else class="mb-3">
          <div class="alert alert-info mb-0">
            <i class="material-symbols-rounded me-2">info</i>
            まだ人気タグがありません。新しいタグを作成してください。
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <button type="button" class="btn btn-secondary" @click="emit('close')">閉じる</button>
    </template>
  </ModalShell>
  
</template>

<style scoped>
/* モーダル内のボタンと入力の軽微な調整 */
.btn-sm {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  font-weight: 500;
}

.btn-sm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-outline-primary {
  border-color: #5e72e4;
  color: #5e72e4;
}

.btn-outline-primary:hover:not(:disabled) {
  background-color: #5e72e4;
  border-color: #5e72e4;
  color: white;
}

.btn-sm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bg-gradient-success {
  border: none;
}

/* フォームラベル */
.form-label {
  font-weight: 600;
  color: #344767;
  display: flex;
  align-items: center;
}

.form-label i {
  opacity: 0.8;
}

/* アラート */
.alert-info {
  background-color: #e7f3ff;
  border-color: #b3d9ff;
  color: #004085;
}

/* レスポンシブ */
@media (max-width: 576px) {
  .d-flex.flex-wrap.gap-2 {
    gap: 0.5rem !important;
  }
}
</style>


