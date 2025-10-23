// 共通フォーマッター

import type { TaskPriority } from "@/types/task";
import { LOCALE, DEFAULT_TIMEZONE } from "@/constants/format";
import { INPUT_LIMITS, USER_PRIORITY_THRESHOLDS } from "@/constants/validation";

export function formatDateJP(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(LOCALE);
}

export function formatPercent(val: number | null | undefined): string {
  if (val == null) return "0%";
  return `${val}%`;
}

export function truncate(text: string, max: number = INPUT_LIMITS.TRUNCATE_LENGTH): string {
  if (!text) return "";
  return text.length > max ? text.substring(0, max) + "..." : text;
}

/**
 * ユーザーの活動状況から優先度を計算
 * ログイン回数と最終ログイン日時を基に判定
 * 
 * @param loginCount - ログイン回数
 * @param lastLoginAt - 最終ログイン日時（ISO文字列）
 * @returns タスク優先度（URGENT, HIGH, MEDIUM, LOW）
 */
export function calculateUserPriority(
  loginCount: number = 0,
  lastLoginAt: string | null = null
): TaskPriority {
  const now = new Date();
  const lastLogin = lastLoginAt ? new Date(lastLoginAt) : null;
  
  // 最終ログインからの経過日数を計算
  const daysSinceLastLogin = lastLogin 
    ? Math.floor((now.getTime() - lastLogin.getTime()) / (24 * 60 * 60 * 1000))
    : Infinity;
  
  // 閾値定数を使用して優先度を判定
  const { URGENT, HIGH, MEDIUM } = USER_PRIORITY_THRESHOLDS;
  
  // アクティブユーザー: ログイン回数が多く、最近ログインしている
  if (loginCount >= URGENT.minLoginCount && daysSinceLastLogin <= URGENT.maxDaysSinceLogin) {
    return "URGENT";
  }
  
  // 定期的なユーザー: そこそこログインしており、1ヶ月以内にログインしている
  if (loginCount >= HIGH.minLoginCount && daysSinceLastLogin <= HIGH.maxDaysSinceLogin) {
    return "HIGH";
  }
  
  // 時々使用するユーザー: 5回以上ログインしている
  if (loginCount >= MEDIUM.minLoginCount) {
    return "MEDIUM";
  }
  
  // 新規または非アクティブユーザー
  return "LOW";
}


