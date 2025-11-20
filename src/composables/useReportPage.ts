import { ref, computed, reactive, onMounted } from "vue";
import { 
  generateReport, 
  generateTaskStatusChartData, 
  generatePriorityChartData,
  generateGanttData,
  generateDependencyGraphData,
  analyzeDependencies
} from "@/services/reportService";
import { listProjects } from "@/services/projectService";
import { listUsers } from "@/services/dbServices";
import type { 
  ReportData, 
  ReportFilter, 
  ReportOptions,
  GanttTaskData,
  DependencyGraphData,
  DependencyAnalysis
} from "@/types/report";
import { getStatusColor, getDeadlineColor } from "@/utils/chartColors";

// レポートページの主要状態とロジックを集約
export function useReportPage() {
  const reportData = ref<ReportData | null>(null);
  const isLoading = ref(false);
  const errorMessage = ref("");

  const filter = reactive<ReportFilter>({
    dateRange: { start: null, end: null },
    projects: [],
    users: [],
    status: [],
    priority: [],
  });

  const availableProjects = ref<Array<{ id: number; name: string }>>([]);
  const availableUsers = ref<Array<{ id: number; display_name: string }>>([]);
  const includeArchived = ref(false);

  const reportOptions = computed<ReportOptions>(() => ({
    projectIds: filter.projects.length > 0 ? filter.projects : undefined,
    userIds: filter.users.length > 0 ? filter.users : undefined,
    dateRange:
      filter.dateRange.start && filter.dateRange.end
        ? {
            startDate: filter.dateRange.start.toISOString().split("T")[0],
            endDate: filter.dateRange.end.toISOString().split("T")[0],
          }
        : undefined,
    includeArchived: includeArchived.value,
  }));

  const taskStatusChartData = computed(() => {
    if (!reportData.value || !reportData.value.taskStatistics) return null;
    return generateTaskStatusChartData(reportData.value.taskStatistics);
  });

  const priorityChartData = computed(() => {
    if (!reportData.value || !reportData.value.priorityReport || !Array.isArray(reportData.value.priorityReport)) return null;
    return generatePriorityChartData(reportData.value.priorityReport);
  });

  const projectProgressChartData = computed(() => {
    if (!reportData.value || !reportData.value.projectProgress || !Array.isArray(reportData.value.projectProgress)) return null;
    
    const statuses = reportData.value.projectProgress.map((p) => p.status);
    const colors = statuses.map(getStatusColor);
    
    return {
      labels: reportData.value.projectProgress.map((p) => p.projectName),
      datasets: [
        {
          label: "進捗率 (%)",
          data: reportData.value.projectProgress.map((p) => p.averageProgress),
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1,
        },
      ],
    };
  });

  const userWorkloadChartData = computed(() => {
    if (!reportData.value || !reportData.value.userWorkload || !Array.isArray(reportData.value.userWorkload)) return null;
    return {
      labels: reportData.value.userWorkload.map((u) => u.userName),
      datasets: [
        {
          label: "完了率 (%)",
          data: reportData.value.userWorkload.map((u) => u.completionRate),
          backgroundColor: "#007bff",
          borderColor: "#0056b3",
          borderWidth: 1,
        },
      ],
    };
  });

  const deadlineChartData = computed(() => {
    if (!reportData.value || !reportData.value.deadlineReport || !Array.isArray(reportData.value.deadlineReport)) return null;
    
    const periods = reportData.value.deadlineReport.map((d) => d.period);
    const colors = periods.map(getDeadlineColor);
    
    return {
      labels: periods,
      datasets: [
        {
          label: "タスク数",
          data: reportData.value.deadlineReport.map((d) => d.taskCount),
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1,
        },
      ],
    };
  });

  const loadProjectsAndUsers = async () => {
    try {
      // プロジェクト一覧を取得
      const projRes = await listProjects();
      if (projRes.success && projRes.data) {
        availableProjects.value = projRes.data.map((project) => ({ 
          id: project.id, 
          name: project.name 
        }));
      }
      
      // ユーザー一覧を取得
      const usersRes = await listUsers();
      if (usersRes.success && usersRes.data) {
        availableUsers.value = usersRes.data.map((user) => ({
          id: user.id,
          display_name: user.display_name
        }));
        console.log("ユーザー一覧取得完了:", availableUsers.value.length, "件");
      } else {
        console.error("ユーザー一覧取得に失敗:", usersRes.error);
      }
    } catch (e) {
      console.error("候補データの読み込みに失敗", e);
    }
  };

  const generateReportData = async () => {
    try {
      isLoading.value = true;
      errorMessage.value = "";
      const res = await generateReport(reportOptions.value);
      if (res.success && res.data) {
        reportData.value = res.data;
      } else {
        reportData.value = null;
        errorMessage.value = res.error || "レポートの生成に失敗しました";
      }
    } catch (e) {
      console.error("レポートの生成に失敗", e);
      reportData.value = null;
      errorMessage.value = "レポートの生成に失敗しました";
    } finally {
      isLoading.value = false;
    }
  };

  // ==================== Phase 1: 高度な可視化機能 ====================

  // ガントチャートデータ
  const ganttData = ref<GanttTaskData[]>([]);
  const isLoadingGantt = ref(false);

  // 依存関係グラフデータ
  const dependencyGraphData = ref<DependencyGraphData>({ nodes: [], edges: [] });
  const dependencyAnalysis = ref<DependencyAnalysis | null>(null);
  const isLoadingDependency = ref(false);

  // ガントチャートデータ生成
  const loadGanttData = async () => {
    try {
      isLoadingGantt.value = true;
      const result = await generateGanttData(reportOptions.value);
      if (result.success && result.data) {
        ganttData.value = result.data;
      } else {
        ganttData.value = [];
        console.error("ガントチャートデータ生成失敗:", result.error);
      }
    } catch (e) {
      console.error("ガントチャートデータ読み込み失敗", e);
      ganttData.value = [];
    } finally {
      isLoadingGantt.value = false;
    }
  };

  // 依存関係グラフデータ生成
  const loadDependencyGraphData = async () => {
    try {
      isLoadingDependency.value = true;
      
      // グラフデータと分析結果を並列ロード
      const [graphResult, analysisResult] = await Promise.all([
        generateDependencyGraphData(reportOptions.value),
        analyzeDependencies(reportOptions.value)
      ]);

      if (graphResult.success && graphResult.data) {
        dependencyGraphData.value = graphResult.data;
      } else {
        dependencyGraphData.value = { nodes: [], edges: [] };
        console.error("依存関係グラフデータ生成失敗:", graphResult.error);
      }

      if (analysisResult.success && analysisResult.data) {
        dependencyAnalysis.value = analysisResult.data;
      } else {
        dependencyAnalysis.value = null;
        console.error("依存性分析失敗:", analysisResult.error);
      }
    } catch (e) {
      console.error("依存関係グラフデータ読み込み失敗", e);
      dependencyGraphData.value = { nodes: [], edges: [] };
      dependencyAnalysis.value = null;
    } finally {
      isLoadingDependency.value = false;
    }
  };

  // 全ての高度な可視化データ読み込み
  const loadAdvancedVisualizationData = async () => {
    await Promise.all([
      loadGanttData(),
      loadDependencyGraphData()
    ]);
  };

  onMounted(async () => {
    await loadProjectsAndUsers();
    await generateReportData();
    await loadAdvancedVisualizationData();
  });

  return {
    // state
    reportData,
    isLoading,
    errorMessage,
    filter,
    availableProjects,
    availableUsers,
    includeArchived,
    // computed
    reportOptions,
    taskStatusChartData,
    priorityChartData,
    projectProgressChartData,
    userWorkloadChartData,
    deadlineChartData,
    // actions
    loadProjectsAndUsers,
    generateReportData,
    // Phase 1: 高度な可視化
    ganttData,
    isLoadingGantt,
    dependencyGraphData,
    dependencyAnalysis,
    isLoadingDependency,
    loadGanttData,
    loadDependencyGraphData,
    loadAdvancedVisualizationData,
  };
}


