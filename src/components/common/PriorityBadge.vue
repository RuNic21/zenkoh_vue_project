<script setup lang="ts">
// 優先度用バッジ
// 目的: 優先度に応じた一貫したバッジ表示

import { PRIORITY_LABELS } from "../../constants/ui";

interface Props {
  priority: string;
}

const props = defineProps<Props>();

// 優先度ラベルを取得（constants/uiから）
const getPriorityLabel = (priority: string): string => {
  return PRIORITY_LABELS[priority] || priority;
};

// バッジクラスを取得
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
</script>

<template>
  <span :class="getClass(priority)">{{ getPriorityLabel(priority) }}</span>
</template>

<style scoped>
/* バッジはクラスで完結。個別スタイル不要 */
</style>


