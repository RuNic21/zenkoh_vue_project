<script setup lang="ts">
// ページヘッダー共通コンポーネント
// 目的: ページタイトル/説明/アクションの一貫した表示

interface Action {
  label: string;
  icon: string;
  variant: string;
  size?: string;
  onClick: () => void;
  title?: string;
}

interface Props {
  title: string;
  description?: string;
  actions?: Action[];
}

const props = withDefaults(defineProps<Props>(), {
  description: "",
  actions: () => []
});
</script>

<template>
  <div class="row mb-4">
    <div class="col-12">
      <div class="ms-3">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h3 class="mb-0 h4 font-weight-bolder">{{ title }}</h3>
            <p v-if="description" class="mb-4">
              {{ description }}
            </p>
          </div>
          <div v-if="actions && actions.length > 0" class="d-flex gap-2">
            <button
              v-for="action in actions"
              :key="action.label"
              :class="`btn btn-${action.variant} ${action.size ? `btn-${action.size}` : ''}`"
              :title="action.title || action.label"
              @click="action.onClick"
            >
              <i class="material-symbols-rounded me-1">{{ action.icon }}</i>
              {{ action.label }}
            </button>
          </div>
        </div>
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 既存のページヘッダーと同等の余白/タイポを維持 */
</style>


