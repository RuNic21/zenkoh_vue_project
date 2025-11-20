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
  
  // データロード中の重複実行を防ぐためのフラグ
  let isDashboardLoadingInProgress = false;
  let isTaskLoadingInProgress = false;

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
    // 既に読み込み中の場合は重複実行を防ぐ
    if (isDashboardLoadingInProgress) {
      console.log("ダッシュボードデータは既に読み込み中です");
      return;
    }

    try {
      isDashboardLoadingInProgress = true;
      isDashboardLoading.value = true;
      dashboardErrorMessage.value = "";
      
      console.log("ダッシュボードデータの読み込みを開始...");
      
      // タイムアウトを設定（20秒に短縮）
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.error("ダッシュボードデータの読み込みがタイムアウトしました（20秒）");
          reject(new Error("タイムアウト: データの読み込みに時間がかかりすぎています（20秒）"));
        }, 20000);
      });
      
      const result = await Promise.race([
        fetchProjectProgress(10),
        timeoutPromise
      ]);
      
      console.log("ダッシュボードデータの読み込みが完了:", result.success ? "成功" : "失敗");
      
      if (result.success && result.data) {
        projectProgressList.value = result.data;
        console.log(`プロジェクト数: ${result.data.length}`);
      } else {
        projectProgressList.value = [];
        dashboardErrorMessage.value = result.error || "ダッシュボードの読み込みに失敗しました。しばらくしてから再試行してください。";
        console.error("ダッシュボードの読み込みに失敗:", result.error);
      }
    } catch (e) {
      console.error("ダッシュボードの読み込みに失敗:", e);
      projectProgressList.value = [];
      const errorMessage = e instanceof Error ? e.message : "ダッシュボードの読み込みに失敗しました。しばらくしてから再試行してください。";
      dashboardErrorMessage.value = errorMessage;
    } finally {
      console.log("ダッシュボードデータの読み込み処理を終了");
      isDashboardLoading.value = false;
      isDashboardLoadingInProgress = false;
    }
  };

  // タスク進捗データ読み込み
  const loadRecentTasks = async (): Promise<void> => {
    // 既に読み込み中の場合は重複実行を防ぐ
    if (isTaskLoadingInProgress) {
      console.log("タスクデータは既に読み込み中です");
      return;
    }

    try {
      isTaskLoadingInProgress = true;
      isTaskLoading.value = true;
      taskErrorMessage.value = "";
      
      console.log("タスクデータの読み込みを開始...");
      console.log("fetchRecentTasks API を呼び出します...");
      
      // タイムアウトを設定（10秒に短縮）
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.error("タスクデータの読み込みがタイムアウトしました（10秒）");
          reject(new Error("タイムアウト: データの読み込みに時間がかかりすぎています（10秒）"));
        }, 10000);
      });
      
      // API呼び出し前にタイムスタンプを記録
      const startTime = Date.now();
      console.log(`API呼び出し開始時刻: ${new Date(startTime).toISOString()}`);
      
      const fetchPromise = fetchRecentTasks(10);
      console.log("fetchRecentTasks Promise を作成しました");
      
      const result = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`API呼び出し完了時刻: ${new Date(endTime).toISOString()}`);
      console.log(`API呼び出し所要時間: ${duration}ms`);
      console.log("タスクデータの読み込みが完了:", result.success ? "成功" : "失敗");
      
      if (result.success && result.data) {
        taskProgressList.value = result.data;
        console.log(`タスク数: ${result.data.length}`);
      } else {
        taskProgressList.value = [];
        taskErrorMessage.value = result.error || "タスクの読み込みに失敗しました。";
        console.error("タスクの読み込みに失敗:", result.error);
      }
    } catch (e) {
      console.error("タスクの読み込み中にエラーが発生:", e);
      console.error("エラーの詳細:", e instanceof Error ? e.stack : String(e));
      taskProgressList.value = [];
      const errorMessage = e instanceof Error ? e.message : "タスクの読み込みに失敗しました。";
      taskErrorMessage.value = errorMessage;
    } finally {
      console.log("タスクデータの読み込み処理を終了");
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


