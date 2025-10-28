// ページネーション/テーブル設定

/**
 * デフォルトのページサイズ（1ページあたりの表示件数）
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * テーブルで選択可能なページサイズのオプション
 */
export const TABLE_PAGE_SIZES = [10, 20, 50, 100] as const;

/**
 * 最大ページサイズ（パフォーマンス考慮）
 */
export const MAX_PAGE_SIZE = 100;

/**
 * テーブル自動更新の間隔（ミリ秒）
 * OptimizedDataTable などで使用
 */
export const TABLE_REFRESH_INTERVAL_MS = 10000; // 10秒

/**
 * 初期ページ番号
 */
export const INITIAL_PAGE = 1;

/**
 * ページネーション表示範囲
 * 現在のページの前後に表示するページ数
 */
export const PAGINATION_VISIBLE_RANGE = 2;

