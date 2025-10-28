// チャート用カラー/パレット

/**
 * Material Dashboardテーマカラー
 * Bootstrap標準カラーに準拠
 */
export const THEME_COLORS = {
  primary: "#007bff",
  success: "#28a745",
  info: "#17a2b8",
  warning: "#ffc107",
  danger: "#dc3545",
  secondary: "#6c757d",
  light: "#f8f9fa",
  dark: "#343a40",
} as const;

/**
 * チャート用カラー（THEME_COLORSのエイリアス）
 * @deprecated THEME_COLORSを使用してください
 */
export const CHART_COLORS = THEME_COLORS;

/**
 * ステータス別カラーマッピング（日本語ラベル用）
 */
export const STATUS_COLORS = {
  完了: THEME_COLORS.success,
  進行中: THEME_COLORS.primary,
  遅延: THEME_COLORS.danger,
  未開始: THEME_COLORS.secondary,
  保留: THEME_COLORS.warning,
  ブロック: THEME_COLORS.warning,
  キャンセル: THEME_COLORS.secondary,
} as const;

/**
 * 優先度別カラーマッピング
 */
export const PRIORITY_COLORS = {
  URGENT: THEME_COLORS.danger,
  HIGH: "#fd7e14", // オレンジ
  MEDIUM: THEME_COLORS.warning,
  LOW: THEME_COLORS.success,
} as const;

/**
 * 期限別カラーマッピング
 */
export const DEADLINE_COLORS = {
  今週: THEME_COLORS.success,
  来週: THEME_COLORS.primary,
  今月: THEME_COLORS.warning,
  期限切れ: THEME_COLORS.danger,
  その他: THEME_COLORS.secondary,
} as const;

/**
 * チャート用カラーパレット（複数データセット用）
 */
export const CHART_PALETTE = [
  THEME_COLORS.primary,
  THEME_COLORS.success,
  THEME_COLORS.warning,
  THEME_COLORS.danger,
  THEME_COLORS.info,
  THEME_COLORS.secondary,
  "#fd7e14", // オレンジ
  "#20c997", // ティール
  "#6610f2", // インディゴ
  "#e83e8c", // ピンク
] as const;

