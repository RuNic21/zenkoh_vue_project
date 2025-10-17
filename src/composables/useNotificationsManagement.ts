import {
  createNotification,
  updateNotification,
  deleteNotification,
  resendNotification,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
} from "@/services/notificationService";

// 通知/アラートルールの編集操作のみを提供する軽量 composable
export function useNotificationsManagement() {
  const createNotificationAction = async (payload: any) => {
    const res = await createNotification(payload);
    return !!res;
  };

  const updateNotificationAction = async (id: number, payload: any) => {
    const res = await updateNotification(id, payload);
    return !!res;
  };

  const deleteNotificationAction = async (id: number) => {
    const success = await deleteNotification(id);
    return !!success;
  };

  const resendNotificationAction = async (id: number) => {
    const success = await resendNotification(id);
    return !!success;
  };

  const createAlertRuleAction = async (payload: any) => {
    const res = await createAlertRule(payload);
    return !!res;
  };

  const updateAlertRuleAction = async (id: number, payload: any) => {
    const res = await updateAlertRule(id, payload);
    return !!res;
  };

  const deleteAlertRuleAction = async (id: number) => {
    const success = await deleteAlertRule(id);
    return !!success;
  };

  return {
    createNotificationAction,
    updateNotificationAction,
    deleteNotificationAction,
    resendNotificationAction,
    createAlertRuleAction,
    updateAlertRuleAction,
    deleteAlertRuleAction,
  };
}


