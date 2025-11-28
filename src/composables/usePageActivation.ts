// ページ再アクティブ化処理composable
// 目的: Keep-Aliveでキャッシュされたページが再表示される際の処理を統一

import { onActivated } from "vue";

/**
 * ページ再アクティブ化時の処理を実行
 * @param refreshCallback ページが再アクティブ化されたときに実行するコールバック関数（オプション）
 * @param options オプション設定
 * @param options.checkVisibility タブの表示状態をチェックするかどうか（デフォルト: false）
 * @param options.delay コールバック実行前の遅延時間（ミリ秒、デフォルト: 0）
 */
export function usePageActivation(
  refreshCallback?: () => Promise<void> | void,
  options?: {
    checkVisibility?: boolean;
    delay?: number;
  }
): void {
  const checkVisibility = options?.checkVisibility ?? false;
  const delay = options?.delay ?? 0;

  onActivated(async () => {
    // タブが非表示の場合はスキップ（オプション）
    if (checkVisibility && document.hidden) {
      return;
    }

    // 遅延実行（オプション）
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // 遅延後に再度タブの表示状態をチェック
      if (checkVisibility && document.hidden) {
        return;
      }
    }

    // コールバック関数が指定されている場合は実行
    if (refreshCallback) {
      await refreshCallback();
    }
  });
}

