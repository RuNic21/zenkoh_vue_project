<script setup lang="ts">
// 共通エンプティステート
// 目的: データが無い時の一貫した表示を提供

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: "inbox",
  subtitle: ""
});
</script>

<template>
  <div class="text-center py-5">
    <i class="material-symbols-rounded text-secondary opacity-50" style="font-size: 64px;">{{ icon }}</i>
    <p class="text-sm text-secondary mt-3">{{ title }}</p>
    <p v-if="subtitle" class="text-xs text-secondary mb-3">{{ subtitle }}</p>
    <slot name="actions"></slot>
  </div>
</template>

<style scoped>
/* 日本語コメント: 既存の空表示の見た目に合わせる */
</style>


