// タイムアウト処理ユーティリティ
// 目的: 非同期処理にタイムアウト機能を追加する共通関数を提供

import { QUERY_TIMEOUT_MS } from "@/constants/database";

/**
 * タイムアウト用のPromiseを生成
 * @param ms タイムアウト時間（ミリ秒）
 * @param message タイムアウト時のエラーメッセージ
 * @returns タイムアウト時にrejectするPromise
 */
export function createTimeoutPromise(ms: number, message: string): Promise<never> {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });
}

/**
 * Promiseにタイムアウト機能を追加
 * @param promise タイムアウトを追加するPromise
 * @param ms タイムアウト時間（ミリ秒）、デフォルトはQUERY_TIMEOUT_MS
 * @param message タイムアウト時のエラーメッセージ
 * @returns タイムアウト付きPromise
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = QUERY_TIMEOUT_MS,
  message: string = `タイムアウト: 処理がタイムアウトしました（${ms}ms）`
): Promise<T> {
  return Promise.race([
    promise,
    createTimeoutPromise(ms, message)
  ]);
}

