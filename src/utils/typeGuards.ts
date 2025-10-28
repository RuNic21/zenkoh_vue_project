/**
 * 型ガードユーティリティ
 * APIレスポンス型検証および型安全性確保
 */

// サービスレスポンス成功の型ガード
export const isServiceSuccess = <T>(
  result: any
): result is { success: true; data: T } => {
  return (
    result !== null &&
    result !== undefined &&
    typeof result === "object" &&
    "success" in result &&
    result.success === true &&
    "data" in result
  );
};

// サービスレスポンス失敗の型ガード
export const isServiceError = (
  result: any
): result is { success: false; error: string } => {
  return (
    result !== null &&
    result !== undefined &&
    typeof result === "object" &&
    "success" in result &&
    result.success === false
  );
};

// 配列の型ガード
export const isArray = <T>(value: any): value is T[] => {
  return Array.isArray(value);
};

// null/undefinedチェック
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

// 文字列チェック（空文字列除外）
export const isNonEmptyString = (value: any): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

// 数値チェック（NaN除外）
export const isValidNumber = (value: any): value is number => {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
};

// 日付文字列チェック
export const isValidDateString = (value: any): value is string => {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
};

