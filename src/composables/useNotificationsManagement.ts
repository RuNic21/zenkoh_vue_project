import {
  createNotification,
  updateNotification,
  deleteNotification,
  resendNotification,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
} from "@/services/notificationService";
import type { 
  Notification, 
  NotificationInsert, 
  NotificationUpdate,
  AlertRule,
  AlertRuleInsert,
  AlertRuleUpdate
} from "@/types/notification";
import { ERROR_MESSAGES } from "@/constants/messages";

// 通知/アラートルールの編集操作のみを提供する軽量 composable
export function useNotificationsManagement() {
  /**
   * 通知を作成
   * @param payload 通知データ
   * @returns 作成された通知データ
   * @throws エラーが発生した場合
   */
  const createNotificationAction = async (payload: NotificationInsert): Promise<Notification> => {
    const res = await createNotification(payload);
    if (!res.success || !res.data) {
      throw new Error(res.error || ERROR_MESSAGES.NOTIFICATION_CREATE_FAILED);
    }
    return res.data;
  };

  /**
   * 通知を更新
   * @param id 通知ID
   * @param payload 更新データ
   * @returns 更新された通知データ
   * @throws エラーが発生した場合
   */
  const updateNotificationAction = async (id: number, payload: NotificationUpdate): Promise<Notification> => {
    const res = await updateNotification(id, payload);
    if (!res) {
      throw new Error(ERROR_MESSAGES.NOTIFICATION_UPDATE_FAILED);
    }
    return res;
  };

  /**
   * 通知を削除
   * @param id 通知ID
   * @throws エラーが発生した場合
   */
  const deleteNotificationAction = async (id: number): Promise<void> => {
    const success = await deleteNotification(id);
    if (!success) {
      throw new Error(ERROR_MESSAGES.NOTIFICATION_DELETE_FAILED);
    }
  };

  /**
   * 通知を再送信
   * @param id 通知ID
   * @throws エラーが発生した場合
   */
  const resendNotificationAction = async (id: number): Promise<void> => {
    const success = await resendNotification(id);
    if (!success) {
      throw new Error(ERROR_MESSAGES.NOTIFICATION_RESEND_FAILED);
    }
  };

  /**
   * アラートルールを作成
   * @param payload アラートルールデータ
   * @returns 作成されたアラートルールデータ
   * @throws エラーが発生した場合
   */
  const createAlertRuleAction = async (payload: AlertRuleInsert): Promise<AlertRule> => {
    const res = await createAlertRule(payload);
    if (!res) {
      throw new Error(ERROR_MESSAGES.ALERT_RULE_CREATE_FAILED);
    }
    return res;
  };

  /**
   * アラートルールを更新
   * @param id アラートルールID
   * @param payload 更新データ
   * @returns 更新されたアラートルールデータ
   * @throws エラーが発生した場合
   */
  const updateAlertRuleAction = async (id: number, payload: AlertRuleUpdate): Promise<AlertRule> => {
    const res = await updateAlertRule(id, payload);
    if (!res) {
      throw new Error(ERROR_MESSAGES.ALERT_RULE_UPDATE_FAILED);
    }
    return res;
  };

  /**
   * アラートルールを削除
   * @param id アラートルールID
   * @throws エラーが発生した場合
   */
  const deleteAlertRuleAction = async (id: number): Promise<void> => {
    const success = await deleteAlertRule(id);
    if (!success) {
      throw new Error(ERROR_MESSAGES.ALERT_RULE_DELETE_FAILED);
    }
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


