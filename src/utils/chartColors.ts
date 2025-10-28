/**
 * チャート色定義ユーティリティ
 * プロジェクトやタスクのステータスに対応する色を一元管理
 * 
 * @deprecated このファイルは非推奨です。@/constants/chart を使用してください
 */

import { STATUS_COLORS, DEADLINE_COLORS, PRIORITY_COLORS } from "@/constants/chart";

// constants/chart.ts から再エクスポート（後方互換性のため）
export { STATUS_COLORS, DEADLINE_COLORS, PRIORITY_COLORS };

/**
 * ステータスに対応する色を取得
 * @param status ステータス文字列
 * @returns 16進数カラーコード
 */
export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.未開始;
};

/**
 * 期限に対応する色を取得
 * @param period 期限文字列
 * @returns 16進数カラーコード
 */
export const getDeadlineColor = (period: string): string => {
  return DEADLINE_COLORS[period as keyof typeof DEADLINE_COLORS] || DEADLINE_COLORS.その他;
};

/**
 * 優先度に対応する色を取得
 * @param priority 優先度文字列
 * @returns 16進数カラーコード
 */
export const getPriorityColor = (priority: string): string => {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.MEDIUM;
};

/**
 * ステータスに対応する色配列を生成（チャート用）
 * @param statuses ステータス配列
 * @returns 色配列
 */
export const getStatusColorArray = (statuses: string[]): string[] => {
  return statuses.map(getStatusColor);
};

/**
 * 期限に対応する色配列を生成（チャート用）
 * @param periods 期限配列
 * @returns 色配列
 */
export const getDeadlineColorArray = (periods: string[]): string[] => {
  return periods.map(getDeadlineColor);
};

/**
 * 優先度に対応する色配列を生成（チャート用）
 * @param priorities 優先度配列
 * @returns 色配列
 */
export const getPriorityColorArray = (priorities: string[]): string[] => {
  return priorities.map(getPriorityColor);
};

