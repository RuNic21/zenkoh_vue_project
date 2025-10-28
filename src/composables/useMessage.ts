import { ref } from "vue";
import { MESSAGE_DURATION } from "@/constants/ui";

/**
 * メッセージ表示用composable
 * alert()/confirm()の代替として使用
 */

export type MessageType = "success" | "error" | "warning" | "info";

export interface Message {
  id: number;
  type: MessageType;
  text: string;
  duration?: number; // ミリ秒（0は自動非表示なし）
}

// グローバルメッセージキュー（複数コンポーネントで共有）
const messageQueue = ref<Message[]>([]);
let messageIdCounter = 0;

export function useMessage() {
  /**
   * メッセージを表示
   * @param text メッセージテキスト
   * @param type メッセージタイプ
   * @param duration 表示時間（ミリ秒、デフォルト5秒）
   */
  const showMessage = (
    text: string,
    type: MessageType = "info",
    duration: number = MESSAGE_DURATION.MEDIUM
  ) => {
    const id = ++messageIdCounter;
    const message: Message = { id, type, text, duration };
    messageQueue.value.push(message);

    // 自動削除（durationが0より大きい場合）
    if (duration > 0) {
      setTimeout(() => {
        dismissMessage(id);
      }, duration);
    }
  };

  /**
   * メッセージを削除
   * @param id メッセージID
   */
  const dismissMessage = (id: number) => {
    const index = messageQueue.value.findIndex((m) => m.id === id);
    if (index !== -1) {
      messageQueue.value.splice(index, 1);
    }
  };

  /**
   * すべてのメッセージをクリア
   */
  const clearAllMessages = () => {
    messageQueue.value = [];
  };

  // ショートカット関数
  const showSuccess = (text: string, duration?: number) =>
    showMessage(text, "success", duration);
  const showError = (text: string, duration?: number) =>
    showMessage(text, "error", duration);
  const showWarning = (text: string, duration?: number) =>
    showMessage(text, "warning", duration);
  const showInfo = (text: string, duration?: number) =>
    showMessage(text, "info", duration);

  return {
    // state
    messages: messageQueue,
    // actions
    showMessage,
    dismissMessage,
    clearAllMessages,
    // shortcuts
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}

/**
 * 確認ダイアログ用composable（confirm()の代替）
 */
export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export interface ConfirmDialog extends ConfirmOptions {
  id: number;
  resolve: (confirmed: boolean) => void;
}

const confirmQueue = ref<ConfirmDialog[]>([]);
let confirmIdCounter = 0;

export function useConfirm() {
  /**
   * 確認ダイアログを表示
   * @param options ダイアログオプション
   * @returns ユーザーの選択結果
   */
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = ++confirmIdCounter;
      const dialog: ConfirmDialog = {
        id,
        title: options.title || "確認",
        message: options.message,
        confirmText: options.confirmText || "確認",
        cancelText: options.cancelText || "キャンセル",
        type: options.type || "info",
        resolve,
      };
      confirmQueue.value.push(dialog);
    });
  };

  /**
   * 確認ダイアログを閉じる
   * @param id ダイアログID
   * @param confirmed ユーザーの選択（true=確認、false=キャンセル）
   */
  const resolveConfirm = (id: number, confirmed: boolean) => {
    const index = confirmQueue.value.findIndex((d) => d.id === id);
    if (index !== -1) {
      const dialog = confirmQueue.value[index];
      dialog.resolve(confirmed);
      confirmQueue.value.splice(index, 1);
    }
  };

  return {
    // state
    confirmDialogs: confirmQueue,
    // actions
    confirm,
    resolveConfirm,
  };
}

