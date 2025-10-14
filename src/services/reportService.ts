// レポート生成サービス（Supabase 連携）
// 目的: プロジェクト・タスク・ユーザーの統計データを集計してレポートを生成

import { supabase } from "./supabaseClient";
import type {
  ReportData,
  ReportOptions,
  ProjectProgressReport,
  TaskStatisticsReport,
  UserWorkloadReport,
  DeadlineReport,
  PriorityReport,
  ReportGenerationResult,
  ChartData,
  ChartDataset
} from "../types/report";
import { handleServiceCall, createSuccessResult, createErrorResult, translateSupabaseError, type ServiceResult } from "../utils/errorHandler";

// プロジェクト進捗レポート生成
export async function generateProjectProgressReport(
  options: ReportOptions = {}
): Promise<ServiceResult<ProjectProgressReport[]>> {
  return handleServiceCall(
    async () => {
      // プロジェクト一覧を取得（JOINでユーザー情報も含む）
      let query = supabase
        .from("projects")
        .select(`
          id,
          name,
          start_date,
          end_date,
          owner_user_id,
          users!projects_owner_user_id_fkey(display_name)
        `);

      // フィルタリング
      if (options.projectIds && options.projectIds.length > 0) {
        query = query.in("id", options.projectIds);
      }

      if (!options.includeArchived) {
        query = query.eq("is_archived", false);
      }

      const { data: projects, error: projectsError } = await query;

      if (projectsError) {
        throw new Error(translateSupabaseError(projectsError));
      }

    if (!projects || projects.length === 0) {
      return [];
    }

    // 各プロジェクトのタスク統計を取得
    const projectReports: ProjectProgressReport[] = [];

    for (const project of projects) {
      // プロジェクトのタスク一覧を取得
      let taskQuery = supabase
        .from("tasks")
        .select("id, status, progress_percent, planned_end")
        .eq("project_id", project.id);

      if (!options.includeArchived) {
        taskQuery = taskQuery.eq("is_archived", false);
      }

      const { data: tasks, error: tasksError } = await taskQuery;

      if (tasksError) {
        console.error(`プロジェクト ${project.id} のタスク取得エラー:`, tasksError);
        continue;
      }

      const taskList = tasks || [];
      const totalTasks = taskList.length;
      const completedTasks = taskList.filter(t => t.status === "DONE").length;
      const inProgressTasks = taskList.filter(t => t.status === "IN_PROGRESS").length;
      const notStartedTasks = taskList.filter(t => t.status === "NOT_STARTED").length;
      const overdueTasks = taskList.filter(t => {
        if (!t.planned_end || t.status === "DONE") return false;
        return new Date(t.planned_end) < new Date();
      }).length;

      const averageProgress = totalTasks > 0 
        ? Math.round(taskList.reduce((sum, t) => sum + t.progress_percent, 0) / totalTasks)
        : 0;

      // プロジェクトの状態を判定
      let status: "完了" | "進行中" | "遅延" | "未開始";
      if (completedTasks === totalTasks && totalTasks > 0) {
        status = "完了";
      } else if (overdueTasks > 0) {
        status = "遅延";
      } else if (inProgressTasks > 0 || completedTasks > 0) {
        status = "進行中";
      } else {
        status = "未開始";
      }

      projectReports.push({
        projectId: project.id,
        projectName: project.name,
        ownerName: (project.users as any)?.display_name || "-",
        startDate: project.start_date,
        endDate: project.end_date,
        totalTasks,
        completedTasks,
        inProgressTasks,
        notStartedTasks,
        overdueTasks,
        averageProgress,
        status
      });
    }

      return projectReports;
    },
    "プロジェクト進捗レポート生成に失敗しました"
  );
}

// タスク統計レポート生成
export async function generateTaskStatisticsReport(
  options: ReportOptions = {}
): Promise<ServiceResult<TaskStatisticsReport>> {
  return handleServiceCall(
    async () => {
      let query = supabase.from("tasks").select("id, status, progress_percent, planned_end");

      // フィルタリング
      if (options.projectIds && options.projectIds.length > 0) {
        query = query.in("project_id", options.projectIds);
      }

      if (options.userIds && options.userIds.length > 0) {
        query = query.in("primary_assignee_id", options.userIds);
      }

      if (!options.includeArchived) {
        query = query.eq("is_archived", false);
      }

      const { data: tasks, error } = await query;

      if (error) {
        throw new Error(translateSupabaseError(error));
      }

    const taskList = tasks || [];
    const totalTasks = taskList.length;
    const completedTasks = taskList.filter(t => t.status === "DONE").length;
    const inProgressTasks = taskList.filter(t => t.status === "IN_PROGRESS").length;
    const notStartedTasks = taskList.filter(t => t.status === "NOT_STARTED").length;
    const blockedTasks = taskList.filter(t => t.status === "BLOCKED").length;
    const cancelledTasks = taskList.filter(t => t.status === "CANCELLED").length;
    const overdueTasks = taskList.filter(t => {
      if (!t.planned_end || t.status === "DONE") return false;
      return new Date(t.planned_end) < new Date();
    }).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const averageProgress = totalTasks > 0 
      ? Math.round(taskList.reduce((sum, t) => sum + t.progress_percent, 0) / totalTasks)
      : 0;

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        notStartedTasks,
        blockedTasks,
        cancelledTasks,
        overdueTasks,
        completionRate,
        averageProgress
      };
    },
    "タスク統計レポート生成に失敗しました"
  );
}

// ユーザー別作業量レポート生成
export async function generateUserWorkloadReport(
  options: ReportOptions = {}
): Promise<ServiceResult<UserWorkloadReport[]>> {
  return handleServiceCall(
    async () => {
      // ユーザー一覧を取得
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, display_name")
        .eq("is_active", true);

      if (usersError) {
        throw new Error(translateSupabaseError(usersError));
      }

      if (!users || users.length === 0) {
        return [];
      }

    const userReports: UserWorkloadReport[] = [];

    for (const user of users) {
      // フィルタリング
      if (options.userIds && options.userIds.length > 0 && !options.userIds.includes(user.id)) {
        continue;
      }

      // ユーザーに割り当てられたタスクを取得
      let taskQuery = supabase
        .from("tasks")
        .select("id, status, progress_percent, planned_end")
        .eq("primary_assignee_id", user.id);

      if (options.projectIds && options.projectIds.length > 0) {
        taskQuery = taskQuery.in("project_id", options.projectIds);
      }

      if (!options.includeArchived) {
        taskQuery = taskQuery.eq("is_archived", false);
      }

      const { data: tasks, error: tasksError } = await taskQuery;

      if (tasksError) {
        console.error(`ユーザー ${user.id} のタスク取得エラー:`, tasksError);
        continue;
      }

      const taskList = tasks || [];
      const totalAssignedTasks = taskList.length;
      const completedTasks = taskList.filter(t => t.status === "DONE").length;
      const inProgressTasks = taskList.filter(t => t.status === "IN_PROGRESS").length;
      const overdueTasks = taskList.filter(t => {
        if (!t.planned_end || t.status === "DONE") return false;
        return new Date(t.planned_end) < new Date();
      }).length;

      const completionRate = totalAssignedTasks > 0 
        ? Math.round((completedTasks / totalAssignedTasks) * 100) 
        : 0;
      const averageProgress = totalAssignedTasks > 0 
        ? Math.round(taskList.reduce((sum, t) => sum + t.progress_percent, 0) / totalAssignedTasks)
        : 0;

      userReports.push({
        userId: user.id,
        userName: user.display_name,
        totalAssignedTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate,
        averageProgress
      });
    }

      return userReports;
    },
    "ユーザー作業量レポート生成に失敗しました"
  );
}

// 期限別レポート生成
export async function generateDeadlineReport(
  options: ReportOptions = {}
): Promise<ServiceResult<DeadlineReport[]>> {
  return handleServiceCall(
    async () => {
      let query = supabase
        .from("tasks")
        .select("id, status, planned_end")
        .not("planned_end", "is", null);

      // フィルタリング
      if (options.projectIds && options.projectIds.length > 0) {
        query = query.in("project_id", options.projectIds);
      }

      if (options.userIds && options.userIds.length > 0) {
        query = query.in("primary_assignee_id", options.userIds);
      }

      if (!options.includeArchived) {
        query = query.eq("is_archived", false);
      }

      const { data: tasks, error } = await query;

      if (error) {
        throw new Error(translateSupabaseError(error));
      }

    const taskList = tasks || [];
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const periods = [
      { name: "今週", start: now, end: oneWeekFromNow },
      { name: "来週", start: oneWeekFromNow, end: twoWeeksFromNow },
      { name: "今月", start: now, end: oneMonthFromNow },
      { name: "期限切れ", start: new Date(0), end: now }
    ];

    const deadlineReports: DeadlineReport[] = [];

    for (const period of periods) {
      const periodTasks = taskList.filter(task => {
        const taskDate = new Date(task.planned_end!);
        return taskDate >= period.start && taskDate < period.end;
      });

      const taskCount = periodTasks.length;
      const completedCount = periodTasks.filter(t => t.status === "DONE").length;
      const overdueCount = periodTasks.filter(t => {
        if (t.status === "DONE") return false;
        return new Date(t.planned_end!) < now;
      }).length;

      const completionRate = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

      deadlineReports.push({
        period: period.name,
        taskCount,
        completedCount,
        overdueCount,
        completionRate
      });
    }

      return deadlineReports;
    },
    "期限別レポート生成に失敗しました"
  );
}

// 優先度別レポート生成
export async function generatePriorityReport(
  options: ReportOptions = {}
): Promise<ServiceResult<PriorityReport[]>> {
  return handleServiceCall(
    async () => {
      let query = supabase.from("tasks").select("id, status, priority, progress_percent");

      // フィルタリング
      if (options.projectIds && options.projectIds.length > 0) {
        query = query.in("project_id", options.projectIds);
      }

      if (options.userIds && options.userIds.length > 0) {
        query = query.in("primary_assignee_id", options.userIds);
      }

      if (!options.includeArchived) {
        query = query.eq("is_archived", false);
      }

      const { data: tasks, error } = await query;

      if (error) {
        throw new Error(translateSupabaseError(error));
      }

    const taskList = tasks || [];
    const priorities: ("LOW" | "MEDIUM" | "HIGH" | "URGENT")[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

    const priorityReports: PriorityReport[] = [];

    for (const priority of priorities) {
      const priorityTasks = taskList.filter(t => t.priority === priority);
      const taskCount = priorityTasks.length;
      const completedCount = priorityTasks.filter(t => t.status === "DONE").length;
      const averageProgress = taskCount > 0 
        ? Math.round(priorityTasks.reduce((sum, t) => sum + t.progress_percent, 0) / taskCount)
        : 0;
      const completionRate = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

      priorityReports.push({
        priority,
        taskCount,
        completedCount,
        averageProgress,
        completionRate
      });
    }

      return priorityReports;
    },
    "優先度別レポート生成に失敗しました"
  );
}

// 統合レポート生成
export async function generateReport(options: ReportOptions = {}): Promise<ReportGenerationResult> {
  try {
    console.log("レポート生成を開始します...", options);

    const [
      projectProgressResult,
      taskStatisticsResult,
      userWorkloadResult,
      deadlineReportResult,
      priorityReportResult
    ] = await Promise.all([
      generateProjectProgressReport(options),
      generateTaskStatisticsReport(options),
      generateUserWorkloadReport(options),
      generateDeadlineReport(options),
      generatePriorityReport(options)
    ]);

    // ServiceResultからデータを抽出
    const projectProgress = projectProgressResult.success && projectProgressResult.data ? projectProgressResult.data : [];
    const taskStatistics = taskStatisticsResult.success && taskStatisticsResult.data ? taskStatisticsResult.data : {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      notStartedTasks: 0,
      blockedTasks: 0,
      cancelledTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      averageProgress: 0
    };
    const userWorkload = userWorkloadResult.success && userWorkloadResult.data ? userWorkloadResult.data : [];
    const deadlineReport = deadlineReportResult.success && deadlineReportResult.data ? deadlineReportResult.data : [];
    const priorityReport = priorityReportResult.success && priorityReportResult.data ? priorityReportResult.data : [];

    const reportData: ReportData = {
      projectProgress,
      taskStatistics,
      userWorkload,
      deadlineReport,
      priorityReport,
      generatedAt: new Date(),
      options
    };

    console.log("レポート生成が完了しました");

    return {
      success: true,
      data: reportData,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error("レポート生成エラー:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "不明なエラーが発生しました",
      generatedAt: new Date()
    };
  }
}

// チャートデータ生成用ヘルパー関数
export function generateTaskStatusChartData(taskStats: TaskStatisticsReport): ChartData {
  return {
    labels: ["完了", "進行中", "未開始", "ブロック", "キャンセル"],
    datasets: [{
      label: "タスク数",
      data: [
        taskStats.completedTasks,
        taskStats.inProgressTasks,
        taskStats.notStartedTasks,
        taskStats.blockedTasks,
        taskStats.cancelledTasks
      ],
      backgroundColor: [
        "#28a745", // 完了 - 緑
        "#007bff", // 進行中 - 青
        "#6c757d", // 未開始 - グレー
        "#ffc107", // ブロック - 黄
        "#dc3545"  // キャンセル - 赤
      ],
      borderColor: [
        "#28a745",
        "#007bff", 
        "#6c757d",
        "#ffc107",
        "#dc3545"
      ],
      borderWidth: 1
    }]
  };
}

export function generatePriorityChartData(priorityReport: PriorityReport[]): ChartData {
  return {
    labels: priorityReport.map(p => p.priority),
    datasets: [{
      label: "タスク数",
      data: priorityReport.map(p => p.taskCount),
      backgroundColor: [
        "#28a745", // LOW - 緑
        "#007bff", // MEDIUM - 青
        "#ffc107", // HIGH - 黄
        "#dc3545"  // URGENT - 赤
      ],
      borderColor: [
        "#28a745",
        "#007bff",
        "#ffc107", 
        "#dc3545"
      ],
      borderWidth: 1
    }]
  };
}
