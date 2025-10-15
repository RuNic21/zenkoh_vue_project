<script setup lang="ts">
// ステータス用バッジ
// 目的: ステータス値に応じた一貫したバッジ表示

import { STATUS_LABELS, BADGE_COLORS } from "../../constants/ui";

interface Props {
  status: string;
}

const props = defineProps<Props>();

// ステータスラベルを取得（constants/uiから）
const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status] || status;
};

// バッジクラスを取得
const getClass = (status: string): string => {
  const label = getStatusLabel(status);
  const colorClass = BADGE_COLORS[label] || 'secondary';
  return `badge bg-gradient-${colorClass}`;
};
</script>

<template>
  <span :class="getClass(status)">{{ getStatusLabel(status) }}</span>
</template>

<style scoped>
/* バッジはクラスで完結。個別スタイル不要 */
</style>


