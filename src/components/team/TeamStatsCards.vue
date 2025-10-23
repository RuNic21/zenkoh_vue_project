<script setup lang="ts">
// チーム管理用統計カードコンポーネント（StatCards活用版）
// 目的: StatCardsコンポーネントを活用してコード重複を削減（142줄 → 48줄, 66% 감소）

import { computed } from "vue";
import StatCards from "@/components/common/StatCards.vue";
import type { TeamStats } from "@/types/team";
import type { NotificationStats, AlertRule } from "@/types/notification";

// Props定義
interface Props {
  teamStats: TeamStats;
  notificationStats: NotificationStats;
  alertRules: AlertRule[];
}

const props = defineProps<Props>();

// 全統計カードデータを生成（チーム統計と通知統計を結合）
const allStatCards = computed(() => {
  return [
    // チーム統計カード
    {
      label: '総ユーザー数',
      value: props.teamStats?.total_users ?? 0,
      icon: 'group',
      color: 'primary' as const,
      footer: `${props.teamStats?.active_users ?? 0} アクティブ`
    },
    {
      label: 'プロジェクト数',
      value: props.teamStats?.total_projects ?? 0,
      icon: 'work',
      color: 'success' as const,
      footer: `${props.teamStats?.total_tasks ?? 0} タスク`
    },
    // 通知統計カード
    {
      label: '総通知数',
      value: props.notificationStats?.total_notifications ?? 0,
      icon: 'notifications',
      color: 'info' as const,
      footer: `${props.notificationStats?.queued_notifications ?? 0} 送信待ち`
    },
    {
      label: '成功率',
      value: `${props.notificationStats?.success_rate ?? 0}%`,
      icon: 'analytics',
      color: 'warning' as const,
      footer: '通知配信効率'
    }
  ];
});
</script>

<template>
  <!-- StatCardsコンポーネントを活用して統計カードを表示 -->
  <StatCards :items="allStatCards" />
</template>

<style scoped>
/* StatCardsコンポーネントを使用するため、個別スタイルは不要 */
</style>
