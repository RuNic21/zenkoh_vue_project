// 日付/時間フォーマット設定

/**
 * 日付フォーマット（YYYY-MM-DD）
 * データベース保存やフォーム入力で使用
 */
export const DATE_FORMAT = "YYYY-MM-DD" as const;

/**
 * 日時フォーマット（YYYY-MM-DD HH:mm:ss）
 */
export const DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss" as const;

/**
 * 時刻フォーマット（HH:mm）
 */
export const TIME_FORMAT = "HH:mm" as const;

/**
 * ロケール設定（日本語）
 */
export const LOCALE = "ja-JP" as const;

/**
 * デフォルトのタイムゾーン
 */
export const DEFAULT_TIMEZONE = "Asia/Tokyo" as const;

/**
 * デフォルトの言語
 */
export const DEFAULT_LANGUAGE = "ja" as const;

/**
 * デフォルトの勤務時間
 */
export const DEFAULT_WORK_HOURS = {
  start: "09:00",
  end: "18:00"
} as const;

/**
 * 日付の正規表現パターン（YYYY-MM-DD）
 */
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 時刻の正規表現パターン（HH:mm）
 */
export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

