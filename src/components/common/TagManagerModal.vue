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
        <div class="mb-3">
          <label class="form-label">人気タグ</label>
          <div class="d-flex flex-wrap gap-1">
            <button
              v-for="tag in availableTags.slice(0, 8)"
              :key="tag"
              class="btn btn-sm btn-outline-secondary"
              @click="handleAddFromPopular(tag)"
              :disabled="(selectedTags || []).includes(tag)"
            >
              {{ tag }}
            </button>
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
.btn-outline-secondary { border-radius: 1rem; }
</style>


