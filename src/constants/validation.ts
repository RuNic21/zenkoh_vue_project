// 検証ルール/入力制限

/**
 * 入力検証用の正規表現パターン
 */
export const VALIDATION_PATTERNS = {
  // メールアドレス
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // 電話番号（日本）10桁または11桁
  PHONE: /^[0-9]{10,11}$/,
  
  // 電話番号（ハイフンあり）
  PHONE_WITH_HYPHEN: /^0\d{1,4}-\d{1,4}-\d{4}$/,
  
  // 日付（YYYY-MM-DD）
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  
  // 時刻（HH:mm）
  TIME: /^([01]\d|2[0-3]):([0-5]\d)$/,
  
  // 時刻（HH:mm:ss）
  TIME_WITH_SECONDS: /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
  
  // URL
  URL: /^https?:\/\/.+/,
  
  // 半角英数字のみ
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  
  // 半角英数字と記号
  ALPHANUMERIC_SYMBOLS: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
  
  // パスワード（最低8文字、英数字混在）
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
  
  // 郵便番号（日本）
  POSTAL_CODE: /^\d{3}-?\d{4}$/,
} as const;

/**
 * 入力文字数制限
 */
export const INPUT_LIMITS = {
  // 最小長
  MIN_NAME_LENGTH: 1,
  MIN_PASSWORD_LENGTH: 8,
  MIN_DESCRIPTION_LENGTH: 0,
  
  // 最大長
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
  MAX_PHONE_LENGTH: 15,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TEXT_LENGTH: 1000,
  MAX_LONG_TEXT_LENGTH: 5000,
  MAX_URL_LENGTH: 2000,
  
  // 表示用切り詰め長
  TRUNCATE_LENGTH: 50,
  TRUNCATE_SHORT_LENGTH: 30,
  TRUNCATE_LONG_LENGTH: 100,
} as const;

/**
 * 数値入力の範囲制限
 */
export const NUMBER_LIMITS = {
  // 進捗率
  MIN_PROGRESS: 0,
  MAX_PROGRESS: 100,
  
  // 優先度（内部数値）
  MIN_PRIORITY: 1,
  MAX_PRIORITY: 4,
  
  // 日数
  MIN_DAYS: 0,
  MAX_DAYS: 365,
  
  // パーセンテージ
  MIN_PERCENT: 0,
  MAX_PERCENT: 100,
} as const;

/**
 * ユーザー優先度計算の閾値
 * formatters.ts の calculateUserPriority で使用
 */
export const USER_PRIORITY_THRESHOLDS = {
  URGENT: {
    minLoginCount: 50,
    maxDaysSinceLogin: 7,
  },
  HIGH: {
    minLoginCount: 20,
    maxDaysSinceLogin: 30,
  },
  MEDIUM: {
    minLoginCount: 5,
    maxDaysSinceLogin: Infinity,
  },
  LOW: {
    minLoginCount: 0,
    maxDaysSinceLogin: Infinity,
  },
} as const;

/**
 * アラートルールのデフォルトパラメータ
 */
export const ALERT_RULE_DEFAULTS = {
  days_before: 3,
  days_overdue: 1,
  days_no_progress: 7,
  min_progress_percent: 0,
  target_status: "IN_PROGRESS" as const,
} as const;

