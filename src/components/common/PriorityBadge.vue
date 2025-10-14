<script setup lang="ts">
// 優先度用バッジ
// 目的: 優先度に応じた一貫したバッジ表示

interface Props {
  priority: string;
}

const props = defineProps<Props>();

const getClass = (priority: string): string => {
  switch (priority) {
    case "URGENT":
      return "badge bg-gradient-danger";
    case "HIGH":
      return "badge bg-gradient-warning";
    case "MEDIUM":
      return "badge bg-gradient-info";
    case "LOW":
      return "badge bg-gradient-secondary";
    default:
      return "badge bg-gradient-secondary";
  }
};

const getLabel = (priority: string): string => {
  switch (priority) {
    case "URGENT":
      return "緊急";
    case "HIGH":
      return "高";
    case "MEDIUM":
      return "中";
    case "LOW":
      return "低";
    default:
      return String(priority);
  }
};
</script>

<template>
  <span :class="getClass(priority)">{{ getLabel(priority) }}</span>
</template>

<style scoped>
/* 日本語コメント: バッジはクラスで完結。個別スタイル不要 */
</style>


