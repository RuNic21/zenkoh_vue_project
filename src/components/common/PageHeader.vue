<script setup lang="ts">
// ページヘッダー共通コンポーネント
// 目的: ページタイトル/説明/アクションの一貫した表示

interface Props {
  title: string;
  description?: string;
}

const props = withDefaults(defineProps<Props>(), {
  description: ""
});
</script>

<template>
  <div class="row mb-4">
    <div class="col-12">
      <div class="ms-3">
        <h3 class="mb-0 h4 font-weight-bolder">{{ title }}</h3>
        <p v-if="description" class="mb-4">
          {{ description }}
        </p>
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 既存のページヘッダーと同等の余白/タイポを維持 */
</style>


