// エラーハンドリングユーティリティ
// 目的: サービスレイヤーでの一貫したエラー処理を提供

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
}

// 成功レスポンスを作成
export function createSuccessResult<T>(data: T, message: string = "正常に処理されました"): ServiceResult<T> {
  return {
    success: true,
    data,
    message
  };
}

// エラーレスポンスを作成
export function createErrorResult<T>(error: string, message: string = "エラーが発生しました"): ServiceResult<T> {
  return {
    success: false,
    error,
    message
  };
}

// 非同期関数をラップしてエラーハンドリングを統一
export async function handleServiceCall<T>(
  serviceCall: () => Promise<T>,
  errorMessage: string = "サービス呼び出しに失敗しました"
): Promise<ServiceResult<T>> {
  try {
    const data = await serviceCall();
    return createSuccessResult(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(errorMessage, errorMsg);
    return createErrorResult<T>(errorMsg, errorMessage);
  }
}

// Supabaseエラーを日本語メッセージに変換
export function translateSupabaseError(error: unknown): string {
  if (!error) return "不明なエラーが発生しました";
  
  // エラーオブジェクトの型チェック
  const errorMessage = error && typeof error === "object" && "message" in error 
    ? String((error as { message: unknown }).message) 
    : String(error);
  
  // よくあるSupabaseエラーメッセージを日本語に変換
  const errorTranslations: Record<string, string> = {
    "duplicate key value violates unique constraint": "重複するデータが存在します",
    "foreign key constraint fails": "関連するデータが存在しません",
    "not found": "データが見つかりません",
    "permission denied": "アクセス権限がありません",
    "network error": "ネットワークエラーが発生しました",
    "timeout": "タイムアウトが発生しました"
  };
  
  // エラーメッセージに含まれるキーワードをチェック
  for (const [key, translation] of Object.entries(errorTranslations)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return translation;
    }
  }
  
  return errorMessage;
}
