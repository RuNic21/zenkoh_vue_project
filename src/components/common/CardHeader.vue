<script setup lang="ts">
// カードヘッダー共通コンポーネント
// 目的: カードタイトル/サブタイトル/アクションの一貫した表示

interface Props {
  title: string;
  subtitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: ""
});
</script>

<template>
  <div class="card-header pb-0 d-flex align-items-center justify-content-between">
    <div>
      <h6 class="mb-0">{{ title }}</h6>
      <p v-if="subtitle" class="text-sm mb-0">
        {{ subtitle }}
      </p>
    </div>
    <div class="card-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.card-actions :deep(.btn) {
  margin-left: 0.25rem;
}
</style>


