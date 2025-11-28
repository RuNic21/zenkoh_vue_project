import { ref, computed } from "vue";
import { 
  fetchProjectProgress, 
  fetchRecentTasks,
  type ProjectProgressRow,
  type TaskProgressRow 
} from "@/services/dashboardService";
import { withTimeout } from "@/utils/timeoutUtils";

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
  
  // データロード中の重複実行を防ぐためのフラグ
  let isDashboardLoadingInProgress = false;
  let isTaskLoadingInProgress = false;

  // 検索/フィルタ
  const searchQuery = ref("");
  const priorityFilter = ref("all");     // 'all' | 'urgent' | 'high-up'
  const deadlineFilter = ref("all");     // 'all' | 'within-3days' | 'within-7days' | 'overdue'
  const projectFilter = ref("all");      // 'all' | project name
  const tagFilter = ref<string[]>([]);   // 選択されたタグの配列

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

    // タグフィルタ（選択したタグのいずれかを含むタスクを表示）
    if (tagFilter.value.length > 0) {
      filtered = filtered.filter((task) => {
        const taskTags = task.tags || [];
        // 選択されたタグのいずれかがタスクに含まれているかチェック
        return tagFilter.value.some(selectedTag => 
          Array.isArray(taskTags) && taskTags.includes(selectedTag)
        );
      });
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

  // 利用可能なタグ一覧（フィルタ用）
  const availableTags = computed(() => {
    const tags = new Set<string>();
    
    taskProgressList.value.forEach((t) => {
      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach(tag => {
          if (tag && tag.trim()) {
            tags.add(tag);
          }
        });
      }
    });
    
    return Array.from(tags).sort();
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
    // 既に読み込み中の場合は重複実行を防ぐ
    if (isDashboardLoadingInProgress) {
      return;
    }

    try {
      isDashboardLoadingInProgress = true;
      isDashboardLoading.value = true;
      dashboardErrorMessage.value = "";
      
      // タイムアウト付きでダッシュボードデータを取得
      const result = await withTimeout(
        fetchProjectProgress(10),
        30000,
        "タイムアウト: データの読み込みに時間がかかりすぎています（30秒）"
      );
      
      if (result.success && result.data) {
        projectProgressList.value = result.data;
        dashboardErrorMessage.value = ""; // 成功時はエラーメッセージをクリア
      } else {
        // 部分的な失敗でも、既存のデータがあれば保持（空配列で上書きしない）
        if (projectProgressList.value.length === 0) {
          projectProgressList.value = [];
        }
        dashboardErrorMessage.value = result.error || "ダッシュボードの読み込みに失敗しました。しばらくしてから再試行してください。";
        console.error("ダッシュボードの読み込みに失敗:", result.error);
      }
    } catch (e) {
      console.error("ダッシュボードの読み込みに失敗:", e);
      projectProgressList.value = [];
      const errorMessage = e instanceof Error ? e.message : "ダッシュボードの読み込みに失敗しました。しばらくしてから再試行してください。";
      dashboardErrorMessage.value = errorMessage;
    } finally {
      isDashboardLoading.value = false;
      isDashboardLoadingInProgress = false;
    }
  };

  // タスク進捗データ読み込み
  const loadRecentTasks = async (): Promise<void> => {
    // 既に読み込み中の場合は重複実行を防ぐ
    if (isTaskLoadingInProgress) {
      return;
    }

    try {
      isTaskLoadingInProgress = true;
      isTaskLoading.value = true;
      taskErrorMessage.value = "";
      
      // タイムアウト付きでタスクデータを取得
      const result = await withTimeout(
        fetchRecentTasks(10),
        30000,
        "タイムアウト: データの読み込みに時間がかかりすぎています（30秒）"
      );
      
      if (result.success && result.data) {
        taskProgressList.value = result.data;
        taskErrorMessage.value = ""; // 成功時はエラーメッセージをクリア
      } else {
        // 部分的な失敗でも、既存のデータがあれば保持（空配列で上書きしない）
        if (taskProgressList.value.length === 0) {
          taskProgressList.value = [];
        }
        taskErrorMessage.value = result.error || "タスクの読み込みに失敗しました。";
        console.error("タスクの読み込みに失敗:", result.error);
      }
    } catch (e) {
      console.error("タスクの読み込み中にエラーが発生:", e);
      taskProgressList.value = [];
      const errorMessage = e instanceof Error ? e.message : "タスクの読み込みに失敗しました。";
      taskErrorMessage.value = errorMessage;
    } finally {
      isTaskLoading.value = false;
      isTaskLoadingInProgress = false;
    }
  };

  // フィルタリセット
  const clearFilters = () => {
    searchQuery.value = "";
    priorityFilter.value = "all";
    deadlineFilter.value = "all";
    projectFilter.value = "all";
    tagFilter.value = [];
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
    tagFilter,
    clearFilters,
    // computed lists
    filteredProjects,
    filteredTasks,
    availableProjects,
    availableTags,
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


