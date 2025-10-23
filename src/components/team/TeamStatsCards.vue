<script setup lang="ts">
// チーム管理用統計カードコンポーネント
// 目的: チーム統計と通知統計を表示する再利用可能なコンポーネント

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

// チーム統計カードデータを生成（필수 정보만 표시）
const teamStatCards = computed(() => {
  return [
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
    }
  ];
});

// 通知統計カードデータを生成（필수 정보만 표시）
const notificationStatCards = computed(() => {
  return [
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
      color: 'primary' as const,
      footer: '通知配信効率'
    }
  ];
});
</script>

<template>
  <!-- 全統計カードを一行に表示 -->
  <div class="row mb-4">
    <!-- チーム統計カード -->
    <div 
      v-for="(card, index) in teamStatCards" 
      :key="`team-${index}`"
      class="col-xl-3 col-sm-6 mb-xl-0 mb-4"
    >
      <div class="card">
        <div class="card-header p-2 ps-3">
          <div class="d-flex justify-content-between">
            <div>
              <p class="text-sm mb-0 text-capitalize">{{ card.label }}</p>
              <h4 class="mb-0">{{ card.value }}</h4>
            </div>
            <div class="icon icon-md icon-shape bg-gradient-primary shadow-dark shadow text-center border-radius-lg">
              <i class="material-symbols-rounded opacity-10">{{ card.icon }}</i>
            </div>
          </div>
        </div>
        <hr class="dark horizontal my-0">
        <div class="card-footer p-2 ps-3">
          <p class="mb-0 text-sm">
            <span class="text-warning font-weight-bolder">{{ card.footer }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 通知統計カード -->
    <div 
      v-for="(card, index) in notificationStatCards" 
      :key="`notification-${index}`"
      class="col-xl-3 col-sm-6 mb-xl-0 mb-4"
    >
      <div class="card">
        <div class="card-header p-2 ps-3">
          <div class="d-flex justify-content-between">
            <div>
              <p class="text-sm mb-0 text-capitalize">{{ card.label }}</p>
              <h4 class="mb-0">{{ card.value }}</h4>
            </div>
            <div class="icon icon-md icon-shape bg-gradient-info shadow-dark shadow text-center border-radius-lg">
              <i class="material-symbols-rounded opacity-10">{{ card.icon }}</i>
            </div>
          </div>
        </div>
        <hr class="dark horizontal my-0">
        <div class="card-footer p-2 ps-3">
          <p class="mb-0 text-sm">
            <span class="text-warning font-weight-bolder">{{ card.footer }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 統計カードのスタイリング */
.card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* アイコンスタイリング */
.icon {
  border-radius: 0.5rem;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .col-xl-3 {
    margin-bottom: 1rem;
  }
}
</style>
