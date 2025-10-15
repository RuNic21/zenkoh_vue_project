<script setup lang="ts">
// 共通ローディングスピナー
// 目的: 一貫したローディング表示を提供

interface Props {
  message?: string;
}

const props = withDefaults(defineProps<Props>(), {
  message: "読み込み中..."
});
</script>

<template>
  <div class="text-center py-5">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">{{ message }}</span>
    </div>
    <p class="text-sm text-secondary mt-3">{{ message }}</p>
  </div>
</template>

<style scoped>
/* 既存のローディング表現と同一の見た目を維持 */
</style>


