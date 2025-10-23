/**
 * 타입 가드 유틸리티
 * API 응답 타입 검증 및 타입 안정성 확보
 */

// 서비스 응답 성공 타입 가드
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

// 서비스 응답 실패 타입 가드
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

// 배열 타입 가드
export const isArray = <T>(value: any): value is T[] => {
  return Array.isArray(value);
};

// null/undefined 체크
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

// 문자열 체크 (빈 문자열 제외)
export const isNonEmptyString = (value: any): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

// 숫자 체크 (NaN 제외)
export const isValidNumber = (value: any): value is number => {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
};

// 날짜 문자열 체크
export const isValidDateString = (value: any): value is string => {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
};

