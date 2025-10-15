<script setup lang="ts">
// アクションバー（左右スロット）
// 目的: ページ/カード上部の主要アクションを左右に配置
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <div class="action-left">
      <slot name="left" />
    </div>
    <div class="action-right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.action-right :deep(.btn) {
  margin-left: 0.25rem;
}
</style>


