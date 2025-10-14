<script setup lang="ts">
// ステータス用バッジ
// 目的: ステータス値に応じた一貫したバッジ表示

interface Props {
  status: string;
}

const props = defineProps<Props>();

const getClass = (status: string): string => {
  switch (status) {
    case "完了":
    case "DONE":
      return "badge bg-gradient-success";
    case "進行中":
    case "IN_PROGRESS":
      return "badge bg-gradient-primary";
    case "ブロック":
    case "BLOCKED":
      return "badge bg-gradient-warning";
    case "未開始":
    case "NOT_STARTED":
      return "badge bg-gradient-secondary";
    case "期限切れ":
      return "badge bg-gradient-danger";
    case "アーカイブ":
      return "badge bg-gradient-dark";
    default:
      return "badge bg-gradient-secondary";
  }
};
</script>

<template>
  <span :class="getClass(status)">{{ status }}</span>
</template>

<style scoped>
/* 日本語コメント: バッジはクラスで完結。個別スタイル不要 */
</style>


