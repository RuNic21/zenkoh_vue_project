// データベースクエリ設定

/**
 * クエリのソート順序設定
 */
export const QUERY_ORDER = {
  CREATED_DESC: { column: "created_at", ascending: false },
  CREATED_ASC: { column: "created_at", ascending: true },
  UPDATED_DESC: { column: "updated_at", ascending: false },
  UPDATED_ASC: { column: "updated_at", ascending: true },
  NAME_ASC: { column: "name", ascending: true },
  NAME_DESC: { column: "name", ascending: false },
  DISPLAY_NAME_ASC: { column: "display_name", ascending: true },
  DISPLAY_NAME_DESC: { column: "display_name", ascending: false },
} as const;

/**
 * デフォルトのクエリ結果取得件数制限
 */
export const DEFAULT_LIMIT = 100;

/**
 * 最大クエリ結果取得件数制限
 * パフォーマンス考慮のための上限
 */
export const MAX_QUERY_LIMIT = 1000;

/**
 * クエリタイムアウト（ミリ秒）
 */
export const QUERY_TIMEOUT_MS = 30000; // 30秒

/**
 * リトライ設定
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 5000,
  BACKOFF_MULTIPLIER: 2,
} as const;

