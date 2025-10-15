// チャート用カラー/パレット

export const CHART_COLORS = {
  primary: '#007bff',
  success: '#28a745',
  info: '#17a2b8',
  warning: '#ffc107',
  danger: '#dc3545',
  secondary: '#6c757d'
};

export const STATUS_COLORS = {
  完了: CHART_COLORS.success,
  進行中: CHART_COLORS.primary,
  遅延: CHART_COLORS.danger,
  未開始: CHART_COLORS.secondary
};


