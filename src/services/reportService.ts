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
  TagReport,
  ReportGenerationResult,
  ChartData,
  ChartDataset
} from "../types/report";
import type { Project } from "../types/project";
import type { Task } from "../types/task";
import { handleServiceCall, createSuccessResult, createErrorResult, translateSupabaseError, type ServiceResult } from "../utils/errorHandler";

// Project with User 型（JOIN時）
interface ProjectWithUser extends Omit<Project, "users"> {
  users?: { display_name: string };
}

// Task with relations 型（JOIN時）
interface TaskWithRelations extends Omit<Task, "projects" | "users"> {
  projects?: { name: string };
  users?: { display_name: string };
  description?: string | null;
  wbs_code?: string | null;
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  primary_assignee_id?: number | null;
}

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

      const projectWithUser = project as ProjectWithUser;
      projectReports.push({
        projectId: project.id,
        projectName: project.name,
        ownerName: projectWithUser.users?.display_name || "-",
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

// タグ別レポート生成
export async function generateTagReport(
  options: ReportOptions = {}
): Promise<ServiceResult<TagReport[]>> {
  return handleServiceCall(
    async () => {
      // タスク一覧を取得（tagsフィールドを含む）
      let query = supabase.from("tasks").select("id, status, progress_percent, tags");

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
      
      // タグごとのタスクを集計
      const tagMap = new Map<string, Array<{ id: number; status: string; progress_percent: number }>>();

      // 各タスクのタグを展開して集計
      taskList.forEach(task => {
        const tags = task.tags || [];
        if (Array.isArray(tags) && tags.length > 0) {
          tags.forEach((tag: string) => {
            if (!tagMap.has(tag)) {
              tagMap.set(tag, []);
            }
            tagMap.get(tag)!.push({
              id: task.id,
              status: task.status,
              progress_percent: task.progress_percent
            });
          });
        }
      });

      // タグ別レポートを生成
      const tagReports: TagReport[] = [];

      tagMap.forEach((tasks, tag) => {
        const taskCount = tasks.length;
        const completedCount = tasks.filter(t => t.status === "DONE").length;
        const inProgressCount = tasks.filter(t => t.status === "IN_PROGRESS").length;
        const notStartedCount = tasks.filter(t => t.status === "NOT_STARTED").length;
        const averageProgress = taskCount > 0
          ? Math.round(tasks.reduce((sum, t) => sum + t.progress_percent, 0) / taskCount)
          : 0;
        const completionRate = taskCount > 0
          ? Math.round((completedCount / taskCount) * 100)
          : 0;

        tagReports.push({
          tag,
          taskCount,
          completedCount,
          inProgressCount,
          notStartedCount,
          averageProgress,
          completionRate
        });
      });

      // タスク数の多い順にソート
      tagReports.sort((a, b) => b.taskCount - a.taskCount);

      return tagReports;
    },
    "タグ別レポート生成に失敗しました"
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
      priorityReportResult,
      tagReportResult
    ] = await Promise.all([
      generateProjectProgressReport(options),
      generateTaskStatisticsReport(options),
      generateUserWorkloadReport(options),
      generateDeadlineReport(options),
      generatePriorityReport(options),
      generateTagReport(options)
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
    const tagReport = tagReportResult.success && tagReportResult.data ? tagReportResult.data : [];

    const reportData: ReportData = {
      projectProgress,
      taskStatistics,
      userWorkload,
      deadlineReport,
      priorityReport,
      tagReport,
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

// タグ別チャートデータ生成
export function generateTagChartData(tagReport: TagReport[]): ChartData | null {
  if (!tagReport || tagReport.length === 0) {
    return null;
  }

  // タスク数の多い順にソート（上位10件まで表示）
  const sortedTags = [...tagReport].sort((a, b) => b.taskCount - a.taskCount).slice(0, 10);

  // タグごとに異なる色を生成（動的カラーパレット）
  const generateColors = (count: number): string[] => {
    const colors: string[] = [];
    const baseColors = [
      "#007bff", "#28a745", "#ffc107", "#dc3545", "#6c757d",
      "#17a2b8", "#6610f2", "#e83e8c", "#fd7e14", "#20c997"
    ];
    
    for (let i = 0; i < count; i++) {
      if (i < baseColors.length) {
        colors.push(baseColors[i]);
      } else {
        // 10個以上の場合、色相を回転させて生成
        const hue = (i * 137.508) % 360; // 黄金角を使用して均等に分布
        colors.push(`hsl(${hue}, 70%, 50%)`);
      }
    }
    
    return colors;
  };

  const colors = generateColors(sortedTags.length);

  return {
    labels: sortedTags.map(t => t.tag),
    datasets: [{
      label: "タスク数",
      data: sortedTags.map(t => t.taskCount),
      backgroundColor: colors,
      borderColor: colors.map(c => c.replace("0.7", "1")),
      borderWidth: 1
    }]
  };
}

// ==================== Phase 1: 高度な可視化機能 ====================

// 間トチャート用データ生成
export async function generateGanttData(
  options: ReportOptions = {}
): Promise<ServiceResult<import("../types/report").GanttTaskData[]>> {
  return handleServiceCall(
    async () => {
      // タスク一覧を取得（プロジェクト・ユーザー・親タスク情報を含む）
      let query = supabase
        .from("tasks")
        .select(`
          id,
          task_name,
          planned_start,
          planned_end,
          progress_percent,
          status,
          priority,
          parent_task_id,
          project_id,
          primary_assignee_id,
          projects!tasks_project_id_fkey(name),
          users!tasks_primary_assignee_id_fkey(display_name)
        `)
        .not("planned_start", "is", null)
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

      if (!tasks || tasks.length === 0) {
        return [];
      }

      // 間トチャートデータに変換
      const ganttData: import("../types/report").GanttTaskData[] = tasks.map(task => ({
        id: String(task.id),
        name: task.task_name || "無題のタスク",
        start: task.planned_start || "",
        end: task.planned_end || "",
        progress: task.progress_percent || 0,
        dependencies: task.parent_task_id ? String(task.parent_task_id) : undefined,
        projectId: task.project_id,
        projectName: (task as TaskWithRelations).projects?.name || "プロジェクト未割当",
        assigneeName: (task as TaskWithRelations).users?.display_name || "担当者未割当",
        status: task.status || "NOT_STARTED",
        priority: task.priority || "MEDIUM"
      }));

      return ganttData;
    },
    "間トチャートデータの生成に失敗しました"
  );
}

// 依存性グラフデータ生成
export async function generateDependencyGraphData(
  options: ReportOptions = {}
): Promise<ServiceResult<import("../types/report").DependencyGraphData>> {
  return handleServiceCall(
    async () => {
      // プロジェクト一覧を取得
      let projectsQuery = supabase
        .from("projects")
        .select("id, name, description, is_archived");

      if (options.projectIds && options.projectIds.length > 0) {
        projectsQuery = projectsQuery.in("id", options.projectIds);
      }

      if (!options.includeArchived) {
        projectsQuery = projectsQuery.eq("is_archived", false);
      }

      const { data: projects, error: projectsError } = await projectsQuery;

      if (projectsError) {
        throw new Error(translateSupabaseError(projectsError));
      }

      // タスク一覧を取得（親タスク情報を含む）
      let tasksQuery = supabase
        .from("tasks")
        .select(`
          id,
          task_name,
          description,
          status,
          priority,
          progress_percent,
          parent_task_id,
          project_id,
          wbs_code,
          planned_start,
          planned_end,
          actual_start,
          actual_end,
          primary_assignee_id,
          projects!tasks_project_id_fkey(name),
          users!tasks_primary_assignee_id_fkey(display_name)
        `);

      // フィルタリング
      if (options.projectIds && options.projectIds.length > 0) {
        tasksQuery = tasksQuery.in("project_id", options.projectIds);
      }

      if (options.userIds && options.userIds.length > 0) {
        tasksQuery = tasksQuery.in("primary_assignee_id", options.userIds);
      }

      if (!options.includeArchived) {
        tasksQuery = tasksQuery.eq("is_archived", false);
      }

      const { data: tasks, error: tasksError } = await tasksQuery;

      if (tasksError) {
        throw new Error(translateSupabaseError(tasksError));
      }

      if ((!projects || projects.length === 0) && (!tasks || tasks.length === 0)) {
        return { nodes: [], edges: [] };
      }

      // ステータスに応じた色を返すヘルパー関数
      const getStatusColor = (status: string): string => {
        switch (status) {
          case "DONE": return "#28a745"; // 緑
          case "IN_PROGRESS": return "#007bff"; // 青
          case "BLOCKED": return "#ffc107"; // 黄色
          case "CANCELLED": return "#dc3545"; // 赤
          default: return "#6c757d"; // グレー（未開始）
        }
      };

      const nodes: import("../types/report").DependencyNode[] = [];

      // プロジェクトノードを生成
      if (projects && projects.length > 0) {
        projects.forEach(project => {
          nodes.push({
            id: `project_${project.id}`,
            label: project.name || "無題のプロジェクト",
            title: `プロジェクト: ${project.name}\n説明: ${project.description || "なし"}`,
            group: "project",
            color: "#9c27b0", // プロジェクト用の紫色
            nodeType: "project"
          });
        });
      }

      // タスクノードを生成
      if (tasks && tasks.length > 0) {
        // 日付フォーマット用ヘルパー関数
        const formatDate = (dateStr: string | null | undefined): string | null => {
          if (!dateStr) return null;
          try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return null;
            return date.toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit"
            });
          } catch {
            return null;
          }
        };

        tasks.forEach(task => {
          const taskWithRelations = task as TaskWithRelations;
          nodes.push({
            id: `task_${task.id}`,
            label: task.task_name || "無題のタスク",
            title: `プロジェクト: ${taskWithRelations.projects?.name || "未割当"}\nステータス: ${task.status}\n進捗: ${task.progress_percent}%`,
            group: taskWithRelations.projects?.name || "未割当",
            color: getStatusColor(task.status),
            nodeType: "task",
            status: task.status || "NOT_STARTED",
            priority: task.priority || "MEDIUM",
            progress: task.progress_percent || 0,
            projectName: taskWithRelations.projects?.name || undefined,
            description: taskWithRelations.description || undefined,
            assigneeName: taskWithRelations.users?.display_name || undefined,
            plannedStart: formatDate(taskWithRelations.planned_start),
            plannedEnd: formatDate(taskWithRelations.planned_end),
            actualStart: formatDate(taskWithRelations.actual_start),
            actualEnd: formatDate(taskWithRelations.actual_end),
            wbsCode: taskWithRelations.wbs_code || undefined
          });
        });
      }

      const edges: import("../types/report").DependencyEdge[] = [];

      // プロジェクト-タスクエッジを生成
      if (tasks && tasks.length > 0) {
        tasks.forEach(task => {
          if (task.project_id) {
            edges.push({
              from: `project_${task.project_id}`,
              to: `task_${task.id}`,
              arrows: "to" as const,
              label: "含む",
              color: "#9c27b0", // プロジェクト-タスク関係は紫色
              dashes: true // 点線で表示
            });
          }
        });
      }

      // タスク間の依存関係エッジを生成
      // 注意: 親タスクが現在のクエリ結果に含まれている場合のみエッジを生成
      if (tasks && tasks.length > 0) {
        const taskIdSet = new Set(tasks.map(t => t.id));
        tasks
          .filter(task => {
            // parent_task_idが存在し、かつ親タスクが現在のクエリ結果に含まれている場合のみ
            return task.parent_task_id !== null && taskIdSet.has(task.parent_task_id);
          })
          .forEach(task => {
            edges.push({
              from: `task_${task.parent_task_id}`,
              to: `task_${task.id}`,
              arrows: "to" as const,
              label: "依存",
              color: "#999999" // タスク間依存関係はグレー
            });
          });
      }

      return { nodes, edges };
    },
    "依存性グラフデータの生成に失敗しました"
  );
}

// 依存性分析を実行
export async function analyzeDependencies(
  options: ReportOptions = {}
): Promise<ServiceResult<import("../types/report").DependencyAnalysis>> {
  return handleServiceCall(
    async () => {
      // タスク一覧を取得
      let query = supabase
        .from("tasks")
        .select("id, parent_task_id, status");

      // フィルタリング
      if (options.projectIds && options.projectIds.length > 0) {
        query = query.in("project_id", options.projectIds);
      }

      if (!options.includeArchived) {
        query = query.eq("is_archived", false);
      }

      const { data: tasks, error } = await query;

      if (error) {
        throw new Error(translateSupabaseError(error));
      }

      if (!tasks || tasks.length === 0) {
        return {
          totalTasks: 0,
          tasksWithDependencies: 0,
          criticalPath: [],
          blockedTasks: [],
          circularDependencies: [],
          maxDepth: 0
        };
      }

      const totalTasks = tasks.length;
      const tasksWithDependencies = tasks.filter(t => t.parent_task_id !== null).length;
      const blockedTasks = tasks.filter(t => t.status === "BLOCKED").map(t => String(t.id));

      // 依存関係マップを構築
      const dependencyMap = new Map<number, number[]>();
      tasks.forEach(task => {
        if (task.parent_task_id) {
          if (!dependencyMap.has(task.parent_task_id)) {
            dependencyMap.set(task.parent_task_id, []);
          }
          dependencyMap.get(task.parent_task_id)!.push(task.id);
        }
      });

      // 循環依存を検出
      const circularDependencies: string[][] = [];
      const visited = new Set<number>();
      const recursionStack = new Set<number>();

      const detectCycle = (taskId: number, path: number[]): void => {
        visited.add(taskId);
        recursionStack.add(taskId);
        path.push(taskId);

        const children = dependencyMap.get(taskId) || [];
        for (const childId of children) {
          if (!visited.has(childId)) {
            detectCycle(childId, [...path]);
          } else if (recursionStack.has(childId)) {
            // 循環依存を発見
            const cycleStart = path.indexOf(childId);
            if (cycleStart !== -1) {
              circularDependencies.push(path.slice(cycleStart).map(String));
            }
          }
        }

        recursionStack.delete(taskId);
      };

      tasks.forEach(task => {
        if (!visited.has(task.id)) {
          detectCycle(task.id, []);
        }
      });

      // 最大依存深度を計算
      let maxDepth = 0;
      const calculateDepth = (taskId: number, depth: number): number => {
        const children = dependencyMap.get(taskId) || [];
        if (children.length === 0) {
          return depth;
        }
        let maxChildDepth = depth;
        children.forEach(childId => {
          maxChildDepth = Math.max(maxChildDepth, calculateDepth(childId, depth + 1));
        });
        return maxChildDepth;
      };

      tasks.forEach(task => {
        if (!task.parent_task_id) {
          maxDepth = Math.max(maxDepth, calculateDepth(task.id, 1));
        }
      });

      // クリティカルパスを簡易計算（最も深い依存チェーン）
      let criticalPath: string[] = [];
      const findLongestPath = (taskId: number, path: number[]): number[] => {
        const children = dependencyMap.get(taskId) || [];
        if (children.length === 0) {
          return path;
        }
        let longestPath = path;
        children.forEach(childId => {
          const childPath = findLongestPath(childId, [...path, childId]);
          if (childPath.length > longestPath.length) {
            longestPath = childPath;
          }
        });
        return longestPath;
      };

      tasks.forEach(task => {
        if (!task.parent_task_id) {
          const path = findLongestPath(task.id, [task.id]);
          if (path.length > criticalPath.length) {
            criticalPath = path.map(String);
          }
        }
      });

      return {
        totalTasks,
        tasksWithDependencies,
        criticalPath,
        blockedTasks,
        circularDependencies,
        maxDepth
      };
    },
    "依存性分析に失敗しました"
  );
}