<script setup lang="ts">
// プロジェクト削除確認モーダル: プロジェクト削除前の確認ダイアログ
import ModalShell from "@/components/common/ModalShell.vue";
import type { Project } from "@/types/db/projects";

// Props 定義
interface Props {
  show: boolean; // モーダル表示状態
  project: Project | null; // 削除対象プロジェクト
}

defineProps<Props>();

// Emits 定義
const emit = defineEmits<{
  close: []; // モーダルを閉じる
  confirm: []; // 削除を確認
}>();
</script>

<template>
  <ModalShell :show="show" title="プロジェクト削除確認" size="md" @close="emit('close')">
    <template #default>
      <div class="text-center py-3">
        <div class="icon-lg bg-gradient-danger shadow-danger text-center border-radius-lg mb-3 d-inline-flex align-items-center justify-content-center">
          <i class="material-symbols-rounded text-white" style="font-size: 3rem;">warning</i>
        </div>
        
        <h5 class="text-dark mb-3">本当に削除しますか？</h5>
        
        <div class="alert alert-danger text-white mb-3">
          <div class="d-flex align-items-center">
            <i class="material-symbols-rounded me-2">folder</i>
            <div class="text-start">
              <strong class="d-block">{{ project?.name }}</strong>
              <small class="opacity-8">このプロジェクトのすべてのデータが削除されます</small>
            </div>
          </div>
        </div>
        
        <div class="alert alert-warning text-dark">
          <div class="d-flex align-items-start">
            <i class="material-symbols-rounded me-2 mt-1">info</i>
            <div class="text-start">
              <strong class="d-block">注意事項</strong>
              <small>この操作は取り消すことができません。関連するすべてのデータが完全に削除されます。</small>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <button type="button" class="btn btn-secondary" @click="emit('close')">
        <i class="material-symbols-rounded me-2">close</i>
        キャンセル
      </button>
      <button type="button" class="btn bg-gradient-danger" @click="emit('confirm')">
        <i class="material-symbols-rounded me-2">delete</i>
        削除する
      </button>
    </template>
  </ModalShell>
</template>

<style scoped>
/* アイコンボックススタイリング */
.icon-lg {
  width: 80px;
  height: 80px;
  border-radius: 1rem;
}

/* Alert スタイリング */
.alert {
  border-radius: 0.75rem;
  padding: 1rem;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .icon-lg {
    width: 60px;
    height: 60px;
  }
}
</style>

