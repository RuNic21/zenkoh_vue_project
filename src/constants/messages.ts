// 共通メッセージ定義

/**
 * 成功メッセージ
 */
export const SUCCESS_MESSAGES = {
  // 汎用
  CREATE: "正常に作成されました",
  UPDATE: "正常に更新されました",
  DELETE: "正常に削除されました",
  SAVE: "正常に保存されました",
  SEND: "正常に送信されました",
  
  // プロジェクト関連
  PROJECT_CREATE: "プロジェクトが正常に作成されました",
  PROJECT_UPDATE: "プロジェクトが正常に更新されました",
  PROJECT_DELETE: "プロジェクトが正常に削除されました",
  
  // タスク関連
  TASK_CREATE: "タスクが正常に作成されました",
  TASK_UPDATE: "タスクが正常に更新されました",
  TASK_DELETE: "タスクが正常に削除されました",
  
  // ユーザー関連
  USER_CREATE: "ユーザーが正常に作成されました",
  USER_UPDATE: "ユーザー情報が正常に更新されました",
  USER_DELETE: "ユーザーが正常に削除されました",
  
  // 通知関連
  NOTIFICATION_CREATE: "通知が正常に作成されました",
  NOTIFICATION_UPDATE: "通知が正常に更新されました",
  NOTIFICATION_DELETE: "通知が正常に削除されました",
  NOTIFICATION_SENT: "通知が正常に送信されました",
  NOTIFICATION_RESEND: "通知が正常に再送信されました",
  
  // アラートルール関連
  ALERT_RULE_CREATE: "アラートルールが正常に作成されました",
  ALERT_RULE_UPDATE: "アラートルールが正常に更新されました",
  ALERT_RULE_DELETE: "アラートルールが正常に削除されました",
  
  // チームメンバー関連
  TEAM_MEMBER_ADD: "チームメンバーが正常に追加されました",
  TEAM_MEMBER_UPDATE: "チームメンバー情報が正常に更新されました",
  TEAM_MEMBER_REMOVE: "チームメンバーが正常に削除されました",
} as const;

/**
 * エラーメッセージ
 */
export const ERROR_MESSAGES = {
  // 汎用
  GENERIC: "エラーが発生しました",
  LOAD_FAILED: "読み込みに失敗しました",
  CREATE_FAILED: "作成に失敗しました",
  UPDATE_FAILED: "更新に失敗しました",
  DELETE_FAILED: "削除に失敗しました",
  SAVE_FAILED: "保存に失敗しました",
  SEND_FAILED: "送信に失敗しました",
  
  // プロジェクト関連
  PROJECT_LOAD_FAILED: "プロジェクトの読み込みに失敗しました",
  PROJECT_CREATE_FAILED: "プロジェクトの作成に失敗しました",
  PROJECT_UPDATE_FAILED: "プロジェクトの更新に失敗しました",
  PROJECT_DELETE_FAILED: "プロジェクトの削除に失敗しました",
  
  // タスク関連
  TASK_LOAD_FAILED: "タスクの読み込みに失敗しました",
  TASK_CREATE_FAILED: "タスクの作成に失敗しました",
  TASK_UPDATE_FAILED: "タスクの更新に失敗しました",
  TASK_DELETE_FAILED: "タスクの削除に失敗しました",
  
  // ユーザー関連
  USER_LOAD_FAILED: "ユーザー読み込みに失敗しました",
  USER_CREATE_FAILED: "ユーザーの作成に失敗しました",
  USER_UPDATE_FAILED: "ユーザー情報の更新に失敗しました",
  USER_DELETE_FAILED: "ユーザーの削除に失敗しました",
  
  // 通知関連
  NOTIFICATION_LOAD_FAILED: "通知の読み込みに失敗しました",
  NOTIFICATION_CREATE_FAILED: "通知の作成に失敗しました",
  NOTIFICATION_UPDATE_FAILED: "通知の更新に失敗しました",
  NOTIFICATION_DELETE_FAILED: "通知の削除に失敗しました",
  NOTIFICATION_SEND_FAILED: "通知の送信に失敗しました",
  NOTIFICATION_RESEND_FAILED: "通知の再送信に失敗しました",
  
  // アラートルール関連
  ALERT_RULE_LOAD_FAILED: "アラートルールの読み込みに失敗しました",
  ALERT_RULE_CREATE_FAILED: "アラートルールの作成に失敗しました",
  ALERT_RULE_UPDATE_FAILED: "アラートルールの更新に失敗しました",
  ALERT_RULE_DELETE_FAILED: "アラートルールの削除に失敗しました",
  
  // チームメンバー関連
  TEAM_MEMBER_LOAD_FAILED: "チームメンバーの読み込みに失敗しました",
  TEAM_MEMBER_ADD_FAILED: "チームメンバーの追加に失敗しました",
  TEAM_MEMBER_UPDATE_FAILED: "チームメンバー情報の更新に失敗しました",
  TEAM_MEMBER_REMOVE_FAILED: "チームメンバーの削除に失敗しました",
  
  // 統計関連
  STATS_LOAD_FAILED: "統計情報の読み込みに失敗しました",
  
  // バリデーション
  REQUIRED_FIELD: "必須項目を入力してください",
  INVALID_EMAIL: "有効なメールアドレスを入力してください",
  INVALID_DATE: "有効な日付を入力してください",
  INVALID_TIME: "有効な時刻を入力してください",
  SELECT_PROJECT: "プロジェクトを選択してください",
  SELECT_USER: "ユーザーを選択してください",
  SELECT_TASK: "タスクを選択してください",
  
  // ネットワーク/接続
  NETWORK_ERROR: "ネットワークエラーが発生しました",
  CONNECTION_FAILED: "接続に失敗しました",
  TIMEOUT: "タイムアウトしました",
} as const;

/**
 * 確認メッセージ
 */
export const CONFIRM_MESSAGES = {
  DELETE: "本当に削除しますか？",
  DELETE_PROJECT: "このプロジェクトを削除しますか？関連するタスクも削除されます。",
  DELETE_TASK: "このタスクを削除しますか？",
  DELETE_USER: "このユーザーを削除しますか？",
  DELETE_NOTIFICATION: "この通知を削除しますか？",
  DELETE_ALERT_RULE: "このアラートルールを削除しますか？",
  CANCEL_CHANGES: "変更を破棄しますか？",
  LEAVE_PAGE: "保存されていない変更があります。ページを離れますか？",
} as const;

/**
 * 情報メッセージ
 */
export const INFO_MESSAGES = {
  NO_DATA: "データがありません",
  NO_PROJECTS: "プロジェクトがありません",
  NO_TASKS: "タスクがありません",
  NO_USERS: "ユーザーがありません",
  NO_NOTIFICATIONS: "通知がありません",
  NO_ALERT_RULES: "アラートルールがありません",
  LOADING: "読み込み中...",
  SAVING: "保存中...",
  PROCESSING: "処理中...",
} as const;

