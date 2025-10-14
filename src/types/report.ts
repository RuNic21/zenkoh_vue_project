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
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
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
