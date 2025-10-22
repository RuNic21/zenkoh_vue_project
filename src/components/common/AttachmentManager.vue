<script setup lang="ts">
import { computed } from "vue";
import CardHeader from "./CardHeader.vue";
import EmptyState from "./EmptyState.vue";
import type { ScheduleAttachment } from "@/types/schedule";

// 添付ファイル管理コンポーネント: タスクに紐づく添付ファイルの表示とアップロード入力を提供
// - 親から添付ファイル配列と編集モードフラグを受け取り、アップロードイベントをemitする
const props = defineProps<{
  // 添付ファイル一覧（表示用）
  attachments?: ScheduleAttachment[];
  // 編集モードかどうか（ファイル入力の表示制御）
  isEditMode: boolean;
}>();

// ファイル選択時のイベントを親へ伝播（親でアップロード処理を実装）
const emit = defineEmits<{ (e: "upload", event: Event): void }>();

// 添付ファイル数の算出（安全なデフォルト）
const attachmentCount = computed(() => (props.attachments?.length || 0));

// ファイル選択ハンドラ（そのまま親へイベントを送る）
const onFileChange = (event: Event) => {
  // 予期せぬ未定義防止のため必ずイベントをemit
  emit("upload", event);
};
</script>

<template>
  <!-- 添付ファイルカード -->
  <div class="card">
    <CardHeader title="添付ファイル" subtitle="タスクに関連するファイルを管理できます" />
    <div class="card-body">
      <!-- 添付ファイル一覧表示 -->
      <div v-if="attachmentCount > 0">
        <div
          v-for="file in (attachments || [])"
          :key="file.name"
          class="d-flex align-items-center mb-2"
        >
          <i class="material-symbols-rounded me-2">attach_file</i>
          <div class="flex-grow-1">
            <p class="text-sm mb-0">{{ file.name }}</p>
            <p class="text-xs text-muted mb-0">{{ file.size }}</p>
          </div>
        </div>
      </div>

      <!-- 添付ファイルがない場合の空状態 -->
      <EmptyState
        v-else
        icon="attach_file"
        title="添付ファイルがありません"
        subtitle="このタスクに関連するファイルを添付してください"
      />

      <!-- 編集モード時のファイル選択入力 -->
      <div v-if="isEditMode" class="mt-3">
        <input
          type="file"
          class="form-control"
          multiple
          @change="onFileChange"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 添付ファイル行の整列と余白（Material Dashboard に準拠） */
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
</style>


