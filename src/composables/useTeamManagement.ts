import { ref, onMounted } from "vue";
import type { User, TeamStats } from "@/types/team";
import type { Notification, NotificationStats, AlertRule } from "@/types/notification";
import {
  listUsers,
  listActiveUsers,
  getTeamStats,
} from "@/services/teamService";
import { getNotificationStats, listNotifications, listAlertRules } from "@/services/notificationService";

// チーム管理ページの主要データロード/状態管理の最小セット
export function useTeamManagement() {
  // Users
  const users = ref<User[]>([]);
  const isUsersLoading = ref(false);
  const usersErrorMessage = ref("");

  // Team stats
  const teamStats = ref<TeamStats>({
    total_users: 0,
    active_users: 0,
    total_projects: 0,
    total_tasks: 0,
    average_tasks_per_user: 0,
  });
  const isStatsLoading = ref(false);

  // Notifications (summary only)
  const notificationStats = ref<NotificationStats>({
    total_notifications: 0,
    queued_notifications: 0,
    sent_notifications: 0,
    failed_notifications: 0,
    cancelled_notifications: 0,
  });
  const isNotificationsLoading = ref(false);
  const notifications = ref<Notification[]>([]);
  const alertRules = ref<AlertRule[]>([]);
  const isAlertRulesLoading = ref(false);

  const loadUsers = async () => {
    try {
      isUsersLoading.value = true;
      usersErrorMessage.value = "";
      const result = await listUsers();
      if (result && typeof result === "object" && "success" in result && result.success && result.data) {
        users.value = result.data as User[];
      } else if (Array.isArray(result)) {
        users.value = result as unknown as User[];
      } else {
        users.value = [];
      }
    } catch (e) {
      console.error("ユーザー読み込みに失敗:", e);
      usersErrorMessage.value = "ユーザー読み込みに失敗しました。";
      users.value = [];
    } finally {
      isUsersLoading.value = false;
    }
  };

  const loadTeamStats = async () => {
    try {
      isStatsLoading.value = true;
      const result = await getTeamStats();
      if (result.success && result.data) teamStats.value = result.data;
    } catch (e) {
      console.error("チーム統計読み込みに失敗:", e);
    } finally {
      isStatsLoading.value = false;
    }
  };

  const loadNotificationsSummary = async () => {
    try {
      isNotificationsLoading.value = true;
      const statRes = await getNotificationStats();
      if (statRes.success && statRes.data) notificationStats.value = statRes.data;
      const [notiRes, ruleRes] = await Promise.all([listNotifications(), listAlertRules()]);
      if (notiRes.success && notiRes.data) notifications.value = notiRes.data as Notification[];
      if (ruleRes.success && ruleRes.data) alertRules.value = ruleRes.data as AlertRule[];
    } catch (e) {
      console.error("通知情報読み込みに失敗:", e);
    } finally {
      isNotificationsLoading.value = false;
      isAlertRulesLoading.value = false;
    }
  };

  onMounted(async () => {
    await Promise.all([loadUsers(), loadTeamStats(), loadNotificationsSummary()]);
  });

  return {
    users,
    isUsersLoading,
    usersErrorMessage,
    teamStats,
    isStatsLoading,
    notificationStats,
    notifications,
    alertRules,
    isNotificationsLoading,
    isAlertRulesLoading,
    loadUsers,
    loadTeamStats,
    loadNotificationsSummary,
  };
}


