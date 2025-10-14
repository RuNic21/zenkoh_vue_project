// ダッシュボード用サービス（プロジェクト分析・統計情報）
// 目的: プロジェクトの統計情報、タスク分析、進捗率計算を提供
//
// TODO: 今後の機能拡張予定
// 1. チャートデータ生成関数
//    - getProjectProgressChartData(): プロジェクト進行率チャート用データ
//    - getTaskStatusChartData(): タスク状態分布パイチャート用データ
//    - getMonthlyProjectTrendData(): 月別プロジェクト推移データ
//    - getAssigneeWorkloadData(): 担当者別作業量データ
//
// 2. タイムラインデータ生成関数
//    - getProjectTimelineData(): ガントチャート用タイムラインデータ
//    - getMilestoneData(): マイルストーンデータ
//    - getProjectDependencyData(): プロジェクト依存関係データ
//
// 3. カンバンボードデータ生成関数
//    - getKanbanBoardData(): カンバンボード用データ
//    - getColumnStatistics(): カラム別統計情報
//    - getWIPLimits(): WIP制限情報
//
// 4. 高度な分析関数
//    - getProjectHealthScore(): プロジェクト健全性スコア
//    - getRiskAnalysis(): リスク分析データ
//    - getPerformanceMetrics(): パフォーマンス指標
//
// 5. エクスポート用データ生成
//    - getExportData(): CSV/PDFエクスポート用データ
//    - getReportData(): レポート生成用データ

import { supabase } from "./supabaseClient";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

// プロジェクト統計情報の型定義
export interface ProjectStats {
  totalProjects: number;           // 総プロジェクト数
  activeProjects: number;          // アクティブプロジェクト数
  archivedProjects: number;        // アーカイブプロジェクト数
  overdueProjects: number;         // 期限切れプロジェクト数
  totalTasks: number;              // 総タスク数
  completedTasks: number;          // 完了タスク数
  inProgressTasks: number;         // 進行中タスク数
  blockedTasks: number;            // ブロックタスク数
  averageProgress: number;         // 平均進捗率
}

// プロジェクト詳細統計の型定義
export interface ProjectDetailStats {
  projectId: number;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  notStartedTasks: number;
  averageProgress: number;
  overdueTasks: number;
  highPriorityTasks: number;
  assigneeCount: number;
}

// プロジェクト統計情報を取得
export async function getProjectStats(): Promise<ProjectStats> {
  try {
    // プロジェクト統計
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, is_archived, end_date");

    if (projectsError) {
      console.error("プロジェクト統計取得エラー:", projectsError);
      throw new Error("プロジェクト統計の取得に失敗しました");
    }

    const today = new Date();
    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => !p.is_archived).length || 0;
    const archivedProjects = projects?.filter(p => p.is_archived).length || 0;
    const overdueProjects = projects?.filter(p => 
      !p.is_archived && p.end_date && new Date(p.end_date) < today
    ).length || 0;

    // タスク統計
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("status, progress_percent, is_archived");

    if (tasksError) {
      console.error("タスク統計取得エラー:", tasksError);
      throw new Error("タスク統計の取得に失敗しました");
    }

    const activeTasks = tasks?.filter(t => !t.is_archived) || [];
    const totalTasks = activeTasks.length;
    const completedTasks = activeTasks.filter(t => t.status === "DONE").length;
    const inProgressTasks = activeTasks.filter(t => t.status === "IN_PROGRESS").length;
    const blockedTasks = activeTasks.filter(t => t.status === "BLOCKED").length;
    
    const averageProgress = totalTasks > 0 
      ? Math.round(activeTasks.reduce((sum, t) => sum + t.progress_percent, 0) / totalTasks)
      : 0;

    return {
      totalProjects,
      activeProjects,
      archivedProjects,
      overdueProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      averageProgress
    };
  } catch (error) {
    console.error("プロジェクト統計取得でエラー:", error);
    // エラー時はデフォルト値を返す
    return {
      totalProjects: 0,
      activeProjects: 0,
      archivedProjects: 0,
      overdueProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      blockedTasks: 0,
      averageProgress: 0
    };
  }
}

// プロジェクト別詳細統計を取得
export async function getProjectDetailStats(): Promise<ProjectDetailStats[]> {
  try {
    // プロジェクト一覧を取得
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name")
      .order("name");

    if (projectsError) {
      console.error("プロジェクト一覧取得エラー:", projectsError);
      throw new Error("プロジェクト一覧の取得に失敗しました");
    }

    if (!projects || projects.length === 0) {
      return [];
    }

    const projectStats: ProjectDetailStats[] = [];

    for (const project of projects) {
      // 各プロジェクトのタスク統計を取得
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("status, progress_percent, priority, planned_end, primary_assignee_id, is_archived")
        .eq("project_id", project.id)
        .eq("is_archived", false);

      if (tasksError) {
        console.error(`プロジェクト ${project.id} のタスク取得エラー:`, tasksError);
        continue;
      }

      const activeTasks = tasks || [];
      const totalTasks = activeTasks.length;
      const completedTasks = activeTasks.filter(t => t.status === "DONE").length;
      const inProgressTasks = activeTasks.filter(t => t.status === "IN_PROGRESS").length;
      const blockedTasks = activeTasks.filter(t => t.status === "BLOCKED").length;
      const notStartedTasks = activeTasks.filter(t => t.status === "NOT_STARTED").length;
      
      const averageProgress = totalTasks > 0 
        ? Math.round(activeTasks.reduce((sum, t) => sum + t.progress_percent, 0) / totalTasks)
        : 0;

      // 期限切れタスク数
      const today = new Date();
      const overdueTasks = activeTasks.filter(t => 
        t.planned_end && new Date(t.planned_end) < today && t.status !== "DONE"
      ).length;

      // 高優先度タスク数
      const highPriorityTasks = activeTasks.filter(t => 
        t.priority === "HIGH" || t.priority === "URGENT"
      ).length;

      // 担当者数（重複を除く）
      const assigneeIds = new Set(
        activeTasks
          .map(t => t.primary_assignee_id)
          .filter(id => id !== null)
      );
      const assigneeCount = assigneeIds.size;

      projectStats.push({
        projectId: project.id,
        projectName: project.name,
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        notStartedTasks,
        averageProgress,
        overdueTasks,
        highPriorityTasks,
        assigneeCount
      });
    }

    return projectStats;
  } catch (error) {
    console.error("プロジェクト詳細統計取得でエラー:", error);
    return [];
  }
}

// プロジェクトのタスク一覧を取得
export async function getProjectTasks(projectId: number): Promise<Task[]> {
  try {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`プロジェクト ${projectId} のタスク取得エラー:`, error);
      return [];
    }

    return tasks || [];
  } catch (error) {
    console.error("プロジェクトタスク取得でエラー:", error);
    return [];
  }
}

// タスク状態の日本語表示名を取得
export function getTaskStatusLabel(status: string): string {
  switch (status) {
    case "NOT_STARTED":
      return "未開始";
    case "IN_PROGRESS":
      return "進行中";
    case "BLOCKED":
      return "ブロック";
    case "DONE":
      return "完了";
    case "CANCELLED":
      return "キャンセル";
    default:
      return status;
  }
}

// タスク優先度の日本語表示名を取得
export function getTaskPriorityLabel(priority: string): string {
  switch (priority) {
    case "LOW":
      return "低";
    case "MEDIUM":
      return "中";
    case "HIGH":
      return "高";
    case "URGENT":
      return "緊急";
    default:
      return priority;
  }
}

// タスク状態のバッジクラスを取得
export function getTaskStatusBadgeClass(status: string): string {
  switch (status) {
    case "NOT_STARTED":
      return "badge bg-gradient-secondary";
    case "IN_PROGRESS":
      return "badge bg-gradient-info";
    case "BLOCKED":
      return "badge bg-gradient-warning";
    case "DONE":
      return "badge bg-gradient-success";
    case "CANCELLED":
      return "badge bg-gradient-danger";
    default:
      return "badge bg-gradient-light";
  }
}

// タスク優先度のバッジクラスを取得
export function getTaskPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case "LOW":
      return "badge bg-gradient-secondary";
    case "MEDIUM":
      return "badge bg-gradient-info";
    case "HIGH":
      return "badge bg-gradient-warning";
    case "URGENT":
      return "badge bg-gradient-danger";
    default:
      return "badge bg-gradient-light";
  }
}

// プロジェクト進捗情報の型定義（App.vue用）
export interface ProjectProgressRow {
  id: number;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  owner_user_id: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  blocked_tasks: number;
  average_progress: number;
  overdue_tasks: number;
}

// プロジェクト進捗情報を取得（App.vue用）
export async function fetchProjectProgress(): Promise<ProjectProgressRow[]> {
  try {
    // プロジェクト一覧を取得
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name, description, start_date, end_date, owner_user_id, is_archived, created_at, updated_at")
      .order("name");

    if (projectsError) {
      console.error("プロジェクト一覧取得エラー:", projectsError);
      throw new Error("プロジェクト一覧の取得に失敗しました");
    }

    if (!projects || projects.length === 0) {
      return [];
    }

    const projectProgressRows: ProjectProgressRow[] = [];

    for (const project of projects) {
      // 各プロジェクトのタスク統計を取得
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("status, progress_percent, planned_end, is_archived")
        .eq("project_id", project.id)
        .eq("is_archived", false);

      if (tasksError) {
        console.error(`プロジェクト ${project.id} のタスク取得エラー:`, tasksError);
        continue;
      }

      const activeTasks = tasks || [];
      const totalTasks = activeTasks.length;
      const completedTasks = activeTasks.filter(t => t.status === "DONE").length;
      const inProgressTasks = activeTasks.filter(t => t.status === "IN_PROGRESS").length;
      const blockedTasks = activeTasks.filter(t => t.status === "BLOCKED").length;
      
      const averageProgress = totalTasks > 0 
        ? Math.round(activeTasks.reduce((sum, t) => sum + t.progress_percent, 0) / totalTasks)
        : 0;

      // 期限切れタスク数
      const today = new Date();
      const overdueTasks = activeTasks.filter(t => 
        t.planned_end && new Date(t.planned_end) < today && t.status !== "DONE"
      ).length;

      projectProgressRows.push({
        id: project.id,
        name: project.name,
        description: project.description,
        start_date: project.start_date,
        end_date: project.end_date,
        owner_user_id: project.owner_user_id,
        is_archived: project.is_archived,
        created_at: project.created_at,
        updated_at: project.updated_at,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        in_progress_tasks: inProgressTasks,
        blocked_tasks: blockedTasks,
        average_progress: averageProgress,
        overdue_tasks: overdueTasks
      });
    }

    return projectProgressRows;
  } catch (error) {
    console.error("プロジェクト進捗取得でエラー:", error);
    return [];
  }
}