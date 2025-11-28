<script setup lang="ts">
// 最近の通知ウィジェット
// 目的: ダッシュボードに最近の通知を表示

import router from "@/router";
import { useNotifications } from "@/composables/useNotifications";
import { NOTIFICATION_STATUS_LABELS, NOTIFICATION_STATUS_COLORS } from "@/types/notification";

// 通知データを取得
const {
  recentNotifications,
  isLoading,
  markAsRead,
  hasUnread
} = useNotifications();

// 通知をクリックして既読にする
const handleNotificationClick = async (notificationId: number) => {
  await markAsRead(notificationId);
};

// 通知管理ページへ移動
const goToNotifications = () => {
  router.push("/team");
};

// 相対時間を取得
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "たった今";
  if (diffMins < 60) return `${diffMins}分前`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}時間前`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}日前`;
  
  return date.toLocaleDateString("ja-JP");
};
</script>

<template>
  <div class="card h-100">
    <div class="card-header pb-0 p-3">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h6 class="mb-0">最近の通知</h6>
          <p class="text-sm mb-0">
            <i class="fa fa-bell text-warning" aria-hidden="true"></i>
            <span class="font-weight-bold ms-1">システム通知</span>
            <span v-if="hasUnread" class="badge bg-gradient-warning ms-2">
              未読あり
            </span>
          </p>
        </div>
        <button 
          class="btn btn-sm bg-gradient-primary mb-0"
          @click="goToNotifications"
        >
          すべて見る
        </button>
      </div>
    </div>
    
    <div class="card-body p-3">
      <!-- ローディング状態 -->
      <div v-if="isLoading" class="text-center py-4">
        <div class="spinner-border text-primary spinner-border-sm" role="status">
          <span class="visually-hidden">読み込み中...</span>
        </div>
        <p class="text-xs text-secondary mt-2 mb-0">通知を読み込み中...</p>
      </div>
      
      <!-- 通知がない場合 -->
      <div v-else-if="recentNotifications.length === 0" class="text-center py-4">
        <i class="fa fa-bell-slash fa-3x text-secondary opacity-6 mb-3"></i>
        <p class="text-sm text-secondary mb-0">通知はありません</p>
        <p class="text-xs text-secondary mb-0">新しい通知があればここに表示されます</p>
      </div>
      
      <!-- 通知リスト -->
      <div v-else class="timeline timeline-one-side">
        <div 
          v-for="notification in recentNotifications" 
          :key="notification.id"
          class="timeline-block mb-3"
          :class="{ 'notification-unread': notification.status === 'QUEUED' }"
          @click="handleNotificationClick(notification.id)"
          style="cursor: pointer;"
        >
          <span class="timeline-step" :class="NOTIFICATION_STATUS_COLORS[notification.status]">
            <i class="material-symbols-rounded text-white text-sm">mail</i>
          </span>
          <div class="timeline-content">
            <h6 class="text-dark text-sm font-weight-bold mb-0">
              {{ notification.subject }}
            </h6>
            <p class="text-secondary font-weight-normal text-xs mt-1 mb-0" 
               style="max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {{ notification.body_text }}
            </p>
            <p class="text-secondary text-xs mt-1 mb-0">
              <i class="fa fa-clock me-1"></i>
              {{ getRelativeTime(notification.created_at) }}
              <span :class="`ms-2 badge badge-sm ${NOTIFICATION_STATUS_COLORS[notification.status]}`">
                {{ NOTIFICATION_STATUS_LABELS[notification.status] }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* タイムラインスタイル */
.timeline-one-side:before {
  background: linear-gradient(to bottom, #e0e0e0, #e0e0e0);
}

.timeline-block {
  border-radius: 0.5rem;
  padding: 0.5rem;
  transition: background-color 0.2s ease;
}

.timeline-block:hover {
  background-color: #f8f9fa;
}

.notification-unread {
  background-color: #fff3cd20;
}

.notification-unread:hover {
  background-color: #fff3cd40;
}

/* タイムラインステップ */
.timeline-step {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
}

.timeline-content {
  padding-left: 0.5rem;
}

/* カードの高さを調整 */
.card.h-100 {
  min-height: 400px;
}

/* スクロール可能にする */
.card-body {
  max-height: 500px;
  overflow-y: auto;
}
</style>

