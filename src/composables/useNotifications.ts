// 通知管理用 Composable
// 目的: 通知の取得・表示・未読管理を提供

import { ref, computed, onMounted, onUnmounted } from "vue";
import { 
  listNotifications, 
  getNotificationStats,
  updateNotification 
} from "@/services/notificationService";
import type { Notification, NotificationStats } from "@/types/notification";
import { NOTIFICATION_CHECK_INTERVAL, MAX_RECENT_NOTIFICATIONS } from "@/constants/notification";

/**
 * 通知管理用 Composable
 * リアルタイムで通知を取得し、未読管理を行う
 */
export function useNotifications() {
  // リアクティブデータ
  const notifications = ref<Notification[]>([]);
  const stats = ref<NotificationStats | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const unreadCount = ref(0);
  
  // 自動更新用タイマー
  let refreshTimer: number | null = null;

  // 計算プロパティ
  
  /**
   * 最近の通知（最大5件）
   */
  const recentNotifications = computed(() => {
    return notifications.value.slice(0, MAX_RECENT_NOTIFICATIONS);
  });

  /**
   * 未読通知のみ
   */
  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => n.status === "QUEUED");
  });

  /**
   * 送信済み通知のみ
   */
  const sentNotifications = computed(() => {
    return notifications.value.filter(n => n.status === "SENT");
  });

  /**
   * 失敗した通知のみ
   */
  const failedNotifications = computed(() => {
    return notifications.value.filter(n => n.status === "FAILED");
  });

  /**
   * 未読通知の件数（バッジ表示用）
   */
  const unreadBadgeCount = computed(() => {
    const count = unreadNotifications.value.length;
    return count > 99 ? "99+" : count.toString();
  });

  /**
   * 未読通知があるかどうか
   */
  const hasUnread = computed(() => {
    return unreadNotifications.value.length > 0;
  });

  // メソッド

  /**
   * 通知一覧を取得
   * @param limit 取得件数制限
   */
  const fetchNotifications = async (limit?: number) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const result = await listNotifications({}, limit);
      
      if (result.success && result.data) {
        notifications.value = result.data;
        unreadCount.value = result.data.filter(n => n.status === "QUEUED").length;
      } else {
        error.value = result.error || "通知の取得に失敗しました";
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : "通知の取得中にエラーが発生しました";
      console.error("通知取得エラー:", e);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 通知統計情報を取得
   */
  const fetchStats = async () => {
    try {
      const result = await getNotificationStats();
      
      if (result.success && result.data) {
        stats.value = result.data;
      }
    } catch (e) {
      console.error("通知統計の取得に失敗:", e);
    }
  };

  /**
   * 通知を既読にする
   * @param notificationId 通知ID
   */
  const markAsRead = async (notificationId: number) => {
    try {
      const result = await updateNotification(notificationId, { status: "SENT" });
      
      if (result) {
        // ローカル状態を更新
        const index = notifications.value.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          notifications.value[index].status = "SENT";
          unreadCount.value = Math.max(0, unreadCount.value - 1);
        }
      }
    } catch (e) {
      console.error("通知の既読処理に失敗:", e);
    }
  };

  /**
   * すべての通知を既読にする
   */
  const markAllAsRead = async () => {
    const unread = unreadNotifications.value;
    
    for (const notification of unread) {
      await markAsRead(notification.id);
    }
  };

  /**
   * 通知を削除
   * @param notificationId 通知ID
   */
  const removeNotification = (notificationId: number) => {
    const index = notifications.value.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications.value.splice(index, 1);
      unreadCount.value = unreadNotifications.value.length;
    }
  };

  /**
   * 通知データをリフレッシュ
   */
  const refresh = async () => {
    await Promise.all([
      fetchNotifications(),
      fetchStats()
    ]);
  };

  /**
   * 自動更新タイマーをスケジューリング
   * setInterval ではなく setTimeout を用いて重複実行を防止
   */
  const scheduleAutoRefresh = () => {
    if (refreshTimer !== null) {
      return;
    }

    refreshTimer = window.setTimeout(async () => {
      refreshTimer = null;

      // タブが可視状態のときのみ取得
      if (!document.hidden) {
        await fetchNotifications();
      }

      // 再度スケジューリング
      scheduleAutoRefresh();
    }, NOTIFICATION_CHECK_INTERVAL);
  };

  /**
   * 自動更新を開始
   */
  const startAutoRefresh = () => {
    if (refreshTimer !== null) {
      return;
    }

    scheduleAutoRefresh();
  };

  /**
   * 自動更新を停止
   */
  const stopAutoRefresh = () => {
    if (refreshTimer !== null) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  };

  // リフレッシュ中の重複実行を防ぐためのフラグ
  let isRefreshing = false;

  /**
   * タブの表示/非表示を監視して、表示されたときに通知を更新
   */
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      // タブが再表示されたとき、最新状態に即座に更新（重複実行を防ぐ）
      if (!isRefreshing) {
        isRefreshing = true;
        refresh().finally(() => {
          isRefreshing = false;
        });
      }
      // タイマーが止まっている場合は再開
      if (refreshTimer === null) {
        scheduleAutoRefresh();
      }
    } else {
      // 非表示時は無駄なタイマーを止める
      stopAutoRefresh();
    }
  };

  // ライフサイクル

  /**
   * マウント時に通知を取得し、自動更新を開始
   */
  onMounted(() => {
    refresh();
    startAutoRefresh();

    // タブの表示/非表示を監視
    document.addEventListener("visibilitychange", handleVisibilityChange);
  });

  /**
   * アンマウント時に自動更新を停止
   */
  onUnmounted(() => {
    stopAutoRefresh();
    // イベントリスナーを削除
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  });

  return {
    // データ
    notifications,
    recentNotifications,
    unreadNotifications,
    sentNotifications,
    failedNotifications,
    stats,
    unreadCount,
    unreadBadgeCount,
    hasUnread,
    isLoading,
    error,
    
    // メソッド
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refresh,
    startAutoRefresh,
    stopAutoRefresh
  };
}

