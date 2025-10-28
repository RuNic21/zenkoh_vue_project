<script setup lang="ts">
// タスク統計ヘッダー（StatCards活用版）
// 目的: StatCardsコンポーネントを活用してコード重複を削減（90行 → 41行、54%削減）

import { computed } from "vue";
import StatCards from "@/components/common/StatCards.vue";

interface Props {
  // タスク配列
  tasks: Array<{
    status: string;
  }>;
}

const props = defineProps<Props>();

// タスク統計カードデータを生成
const taskStatCards = computed(() => {
  const totalCount = props.tasks.length;
  const doneCount = props.tasks.filter(t => t.status === 'DONE').length;
  const inProgressCount = props.tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const blockedCount = props.tasks.filter(t => t.status === 'BLOCKED').length;

  return [
    {
      label: '総タスク数',
      value: totalCount,
      icon: 'task',
      color: 'primary' as const
    },
    {
      label: '完了済み',
      value: doneCount,
      icon: 'check_circle',
      color: 'success' as const
    },
    {
      label: '進行中',
      value: inProgressCount,
      icon: 'play_circle',
      color: 'info' as const
    },
    {
      label: 'ブロック',
      value: blockedCount,
      icon: 'block',
      color: 'warning' as const
    }
  ];
});
</script>

<template>
  <!-- StatCardsコンポーネントを活用してタスク統計を表示 -->
  <StatCards :items="taskStatCards" />
</template>

<style scoped>
/* StatCardsコンポーネントを使用するため、個別スタイルは不要 */
</style>
