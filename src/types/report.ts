// レポート機能用の型定義
// 目的: レポート生成・表示に必要なデータ構造を定義

// プロジェクト進捗レポート
export interface ProjectProgressReport {
  projectId: number;
  projectName: string;
  ownerName: string;
  startDate: string | null;
  endDate: string | null;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  overdueTasks: number;
  averageProgress: number;
  status: "完了" | "進行中" | "遅延" | "未開始";
}

// タスク統計レポート
export interface TaskStatisticsReport {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  blockedTasks: number;
  cancelledTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageProgress: number;
}

// ユーザー別作業量レポート
export interface UserWorkloadReport {
  userId: number;
  userName: string;
  totalAssignedTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageProgress: number;
}

// 期限別タスクレポート
export interface DeadlineReport {
  period: string; // "今週" | "来週" | "今月" | "来月" | "期限切れ"
  taskCount: number;
  completedCount: number;
  overdueCount: number;
  completionRate: number;
}

// 優先度別タスクレポート
export interface PriorityReport {
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  taskCount: number;
  completedCount: number;
  averageProgress: number;
  completionRate: number;
}

// タグ別タスクレポート
export interface TagReport {
  tag: string; // タグ名
  taskCount: number; // タスク数
  completedCount: number; // 完了タスク数
  inProgressCount: number; // 進行中タスク数
  notStartedCount: number; // 未開始タスク数
  averageProgress: number; // 平均進捗率
  completionRate: number; // 完了率
}

// レポート生成オプション
export interface ReportOptions {
  projectIds?: number[]; // 特定のプロジェクトのみ
  userIds?: number[]; // 特定のユーザーのみ
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  includeArchived?: boolean; // アーカイブされたタスクを含むか
}

// レポートデータの統合型
export interface ReportData {
  projectProgress: ProjectProgressReport[];
  taskStatistics: TaskStatisticsReport;
  userWorkload: UserWorkloadReport[];
  deadlineReport: DeadlineReport[];
  priorityReport: PriorityReport[];
  tagReport: TagReport[]; // タグ別レポート
  generatedAt: Date;
  options: ReportOptions;
}

// レポートエクスポート形式
export type ReportExportFormat = "pdf" | "excel" | "csv";

// レポート生成結果
export interface ReportGenerationResult {
  success: boolean;
  data?: ReportData;
  error?: string;
  generatedAt: Date;
}

// レポートテンプレート
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  isDefault: boolean;
}

// レポートセクション
export interface ReportSection {
  id: string;
  title: string;
  type: "project_progress" | "task_statistics" | "user_workload" | "deadline" | "priority" | "custom_chart";
  visible: boolean;
  order: number;
  config?: Record<string, any>; // セクション固有の設定
}

// チャートデータ用の型
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label?: string; // チャートのラベル（オプション）
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  [key: string]: unknown; // チャートライブラリの追加プロパティに対応
}

// レポートフィルター
export interface ReportFilter {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  projects: number[]; // 選択されたプロジェクトID
  users: number[]; // 選択されたユーザーID
  status: string[]; // 選択されたステータス
  priority: string[]; // 選択された優先度
}

// ==================== Phase 1: 高度な可視化機能 ====================

// 間トチャート用のタスクデータ
export interface GanttTaskData {
  id: string; // タスクID
  name: string; // タスク名
  start: string; // 開始日 (YYYY-MM-DD)
  end: string; // 終了日 (YYYY-MM-DD)
  progress: number; // 進捗率 (0-100)
  dependencies?: string; // 依存タスクID（カンマ区切り）
  projectId: number; // プロジェクトID
  projectName: string; // プロジェクト名
  assigneeName: string; // 担当者名
  status: string; // ステータス
  priority: string; // 優先度
}

// 間トチャート設定
export interface GanttChartOptions {
  viewMode?: "Day" | "Week" | "Month" | "Year"; // 表示モード
  showProgress?: boolean; // 進捗バーを表示
  showDependencies?: boolean; // 依存関係を表示
  dateFormat?: string; // 日付フォーマット
}

// 依存性グラフ用のノード
export interface DependencyNode {
  id: string; // ノードID (タスクID または プロジェクトID)
  label: string; // ノード表示名
  title?: string; // ツールチップ
  group?: string; // グループ（プロジェクト別色分け）
  level?: number; // 階層レベル
  color?: string; // ノード色
  nodeType: "task" | "project"; // ノードタイプ（タスクまたはプロジェクト）
  // タスク情報（タスクの場合のみ）
  status?: string; // タスクステータス
  priority?: string; // タスク優先度
  progress?: number; // 進捗率
  projectName?: string; // プロジェクト名
  description?: string; // タスク説明
  assigneeName?: string; // 担当者名
  plannedStart?: string | null; // 計画開始日
  plannedEnd?: string | null; // 計画終了日
  actualStart?: string | null; // 実際開始日
  actualEnd?: string | null; // 実際終了日
  wbsCode?: string | null; // WBSコード
}

// 依存性グラフ用のエッジ
export interface DependencyEdge {
  from: string; // 開始ノードID
  to: string; // 終了ノードID
  arrows?: "to" | "from" | "middle"; // 矢印の向き
  label?: string; // エッジラベル
  color?: string; // エッジ色
  dashes?: boolean; // 点線表示
}

// 依存性グラフデータ
export interface DependencyGraphData {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

// 依存性分析結果
export interface DependencyAnalysis {
  totalTasks: number; // 総タスク数
  tasksWithDependencies: number; // 依存関係のあるタスク数
  criticalPath: string[]; // クリティカルパス（タスクIDの配列）
  blockedTasks: string[]; // ブロックされているタスク
  circularDependencies: string[][]; // 循環依存（タスクIDの配列の配列）
  maxDepth: number; // 最大依存深度
}

// PDF エクスポートオプション
export interface PdfExportOptions {
  filename?: string; // ファイル名
  title?: string; // レポートタイトル
  includeCharts?: boolean; // チャートを含める
  includeTables?: boolean; // テーブルを含める
  includeGantt?: boolean; // 間トチャートを含める
  includeDependencyGraph?: boolean; // 依存性グラフを含める
  pageOrientation?: "portrait" | "landscape"; // ページ向き
}

// Excel エクスポートオプション
export interface ExcelExportOptions {
  filename?: string; // ファイル名
  sheets?: ExcelSheetConfig[]; // シート設定
}

// Excel データセル型（文字列、数値、日付、真偽値、null、undefined）
export type ExcelCellValue = string | number | Date | boolean | null | undefined;

// Excel シート設定
export interface ExcelSheetConfig {
  name: string; // シート名
  data: ExcelCellValue[][]; // データ（2次元配列）
  headers?: string[]; // ヘッダー行
}