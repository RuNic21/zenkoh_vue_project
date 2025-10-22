import { ref, computed } from "vue";
import { 
  fetchProjectProgress, 
  fetchRecentTasks,
  type ProjectProgressRow,
  type TaskProgressRow 
} from "@/services/dashboardService";

// ダッシュボード機能の状態とロジックを集約する composable
export function useDashboard() {
  // プロジェクト進捗リスト
  const projectProgressList = ref<ProjectProgressRow[]>([]);
  // タスク進捗リスト
  const taskProgressList = ref<TaskProgressRow[]>([]);
  // ローディング/エラー状態
  const isDashboardLoading = ref(false);
  const isTaskLoading = ref(false);
  const dashboardErrorMessage = ref("");
  const taskErrorMessage = ref("");

  // 検索/フィルタ
  const searchQuery = ref("");
  const priorityFilter = ref("all");     // 'all' | 'urgent' | 'high-up'
  const deadlineFilter = ref("all");     // 'all' | 'within-3days' | 'within-7days' | 'overdue'
  const projectFilter = ref("all");      // 'all' | project name

  // 日付基準（メモ化）
  const today = computed(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const threeDaysFromNow = computed(() => new Date(today.value.getTime() + 3 * 24 * 60 * 60 * 1000));
  const sevenDaysFromNow = computed(() => new Date(today.value.getTime() + 7 * 24 * 60 * 60 * 1000));

  // フィルタ適用後のプロジェクト一覧
  const filteredProjects = computed(() => {
    let filtered = projectProgressList.value;

    // 検索フィルタ
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q)
      );
    }

    // 期限フィルタ（プロジェクトに適用）
    if (deadlineFilter.value !== "all") {
      filtered = filtered.filter((project) => {
        if (!project.dueDate || project.dueDate === "-") return false;
        const due = new Date(project.dueDate);
        switch (deadlineFilter.value) {
          case "within-3days":
            return due >= today.value && due <= threeDaysFromNow.value;
          case "within-7days":
            return due >= today.value && due <= sevenDaysFromNow.value;
          case "overdue":
            return due < today.value && project.status !== "完了";
          default:
            return true;
        }
      });
    }

    return filtered;
  });

  // フィルタ適用後のタスク一覧
  const filteredTasks = computed(() => {
    let filtered = taskProgressList.value;

    // 検索クエリでフィルタ（タスク名、プロジェクト名、担当者名）
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(q) || 
        t.projectName.toLowerCase().includes(q) || 
        t.assigneeName.toLowerCase().includes(q)
      );
    }

    // 優先度フィルタ
    if (priorityFilter.value !== "all") {
      filtered = filtered.filter((task) => {
        switch (priorityFilter.value) {
          case "urgent":
            return task.priority === "URGENT";
          case "high-up":
            return task.priority === "URGENT" || task.priority === "HIGH";
          default:
            return true;
        }
      });
    }

    // 期限フィルタ
    if (deadlineFilter.value !== "all") {
      filtered = filtered.filter((task) => {
        if (!task.planned_end) return false;
        const due = new Date(task.planned_end);
        due.setHours(0, 0, 0, 0);
        switch (deadlineFilter.value) {
          case "within-3days":
            return due >= today.value && due <= threeDaysFromNow.value;
          case "within-7days":
            return due >= today.value && due <= sevenDaysFromNow.value;
          case "overdue":
            return task.isOverdue;
          default:
            return true;
        }
      });
    }

    // プロジェクトフィルタ
    if (projectFilter.value !== "all") {
      filtered = filtered.filter((t) => t.projectName === projectFilter.value);
    }

    return filtered;
  });

  // プロジェクト一覧（フィルタ用）
  const availableProjects = computed(() => {
    const projects = new Set<string>();
    
    taskProgressList.value.forEach((t) => {
      if (t.projectName && t.projectName !== "-") {
        projects.add(t.projectName);
      }
    });
    
    return Array.from(projects).sort();
  });

  // 統計
  const inProgressCount = computed(() => filteredProjects.value.filter((p) => p.status === "進行中").length);
  const completedCount = computed(() => filteredProjects.value.filter((p) => p.status === "完了").length);
  const completionRate = computed(() => {
    const total = filteredProjects.value.length;
    if (total === 0) return 0;
    return Math.round((completedCount.value / total) * 100);
  });
  const overdueCount = computed(() => {
    const now = new Date();
    return filteredProjects.value.filter((p) => {
      if (!p.dueDate || p.dueDate === "-") return false;
      const due = new Date(p.dueDate as string);
      if (isNaN(due.getTime())) return false;
      return due < now && p.status !== "完了";
    }).length;
  });

  // ダッシュボードデータ読み込み
  const loadDashboardFromDb = async (): Promise<void> => {
    try {
      isDashboardLoading.value = true;
      dashboardErrorMessage.value = "";
      const result = await fetchProjectProgress(10);
      if (result.success && result.data) {
        projectProgressList.value = result.data;
      } else {
        projectProgressList.value = [];
        dashboardErrorMessage.value = result.error || "ダッシュボードの読み込みに失敗しました。しばらくしてから再試行してください。";
      }
    } catch (e) {
      console.error("ダッシュボードの読み込みに失敗", e);
      projectProgressList.value = [];
      dashboardErrorMessage.value = "ダッシュボードの読み込みに失敗しました。しばらくしてから再試行してください。";
    } finally {
      isDashboardLoading.value = false;
    }
  };

  // タスク進捗データ読み込み
  const loadRecentTasks = async (): Promise<void> => {
    try {
      isTaskLoading.value = true;
      taskErrorMessage.value = "";
      const result = await fetchRecentTasks(10);
      if (result.success && result.data) {
        taskProgressList.value = result.data;
      } else {
        taskProgressList.value = [];
        taskErrorMessage.value = result.error || "タスクの読み込みに失敗しました。";
      }
    } catch (e) {
      console.error("タスクの読み込みに失敗", e);
      taskProgressList.value = [];
      taskErrorMessage.value = "タスクの読み込みに失敗しました。";
    } finally {
      isTaskLoading.value = false;
    }
  };

  // フィルタリセット
  const clearFilters = () => {
    searchQuery.value = "";
    priorityFilter.value = "all";
    deadlineFilter.value = "all";
    projectFilter.value = "all";
  };

  return {
    // state
    projectProgressList,
    taskProgressList,
    isDashboardLoading,
    isTaskLoading,
    dashboardErrorMessage,
    taskErrorMessage,
    // filters
    searchQuery,
    priorityFilter,
    deadlineFilter,
    projectFilter,
    clearFilters,
    // computed lists
    filteredProjects,
    filteredTasks,
    availableProjects,
    // stats
    inProgressCount,
    completedCount,
    completionRate,
    overdueCount,
    // actions
    loadDashboardFromDb,
    loadRecentTasks,
  };
}


