// 日付ユーティリティ関数群
// 目的: 日付の変換・フォーマット・計算を一元管理

/**
 * ISO文字列をYYYY-MM-DD形式に変換
 * @param isoString ISO日時文字列
 * @returns YYYY-MM-DD形式の文字列、または空文字列
 */
export function formatIsoToDate(isoString: string | null | undefined): string {
  if (!isoString) return "";
  try {
    return new Date(isoString).toISOString().slice(0, 10);
  } catch (error) {
    console.error("日付変換エラー:", error);
    return "";
  }
}

/**
 * YYYY-MM-DD形式をISO文字列に変換
 * @param dateString YYYY-MM-DD形式の文字列
 * @returns ISO文字列、またはnull
 */
export function formatDateToIso(dateString: string): string | null {
  if (!dateString) return null;
  try {
    // YYYY-MM-DD形式の検証
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      console.warn("無効な日付形式:", dateString);
      return null;
    }
    
    // 日付の妥当性チェック
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("無効な日付:", dateString);
      return null;
    }
    
    return `${dateString}T00:00:00.000Z`;
  } catch (error) {
    console.error("日付変換エラー:", error);
    return null;
  }
}

/**
 * 現在の日付をYYYY-MM-DD形式で取得
 * @returns 現在の日付（YYYY-MM-DD形式）
 */
export function getCurrentDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 日付の差分を日数で計算
 * @param startDate 開始日（YYYY-MM-DD形式）
 * @param endDate 終了日（YYYY-MM-DD形式）
 * @returns 日数の差分
 */
export function calculateDaysDifference(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error("日付計算エラー:", error);
    return 0;
  }
}

/**
 * 日付が期限切れかどうかを判定
 * @param endDate 終了日（YYYY-MM-DD形式）
 * @returns 期限切れの場合true
 */
export function isOverdue(endDate: string): boolean {
  if (!endDate) return false;
  try {
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 時刻をリセット
    return end < today;
  } catch (error) {
    console.error("期限判定エラー:", error);
    return false;
  }
}

/**
 * 日付を日本語形式でフォーマット（YYYY/MM/DD）
 * @param dateString ISO文字列または日付文字列
 * @returns フォーマット済み日付文字列
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("ja-JP");
  } catch (error) {
    console.error("日付フォーマットエラー:", error);
    return "-";
  }
}

/**
 * 日時を日本語形式でフォーマット（YYYY/MM/DD HH:mm）
 * @param dateTimeString ISO文字列または日時文字列
 * @returns フォーマット済み日時文字列
 */
export function formatDateTime(dateTimeString: string | null | undefined): string {
  if (!dateTimeString) return "-";
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return "-";
    const datePart = date.toLocaleDateString("ja-JP");
    const timePart = date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    return `${datePart} ${timePart}`;
  } catch (error) {
    console.error("日時フォーマットエラー:", error);
    return "-";
  }
}