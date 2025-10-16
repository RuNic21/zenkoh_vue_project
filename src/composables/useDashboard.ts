import { ref, computed } from "vue";
import { fetchProjectProgress, type ProjectProgressRow } from "@/services/dashboardService";

// ダッシュボード機能の状態とロジックを集約する composable
export function useDashboard() {
  // プロジェクト進捗リスト
  const projectProgressList = ref<ProjectProgressRow[]>([]);
  // ローディング/エラー状態
  const isDashboardLoading = ref(false);
  const dashboardErrorMessage = ref("");

  // 検索/フィルタ
  const searchQuery = ref("");
  const statusFilter = ref("all");
  const ownerFilter = ref("all");
  const dateRangeFilter = ref("all");

  // 日付基準（メモ化）
  const today = computed(() => new Date());
  const weekFromNow = computed(() => new Date(today.value.getTime() + 7 * 24 * 60 * 60 * 1000));
  const monthFromNow = computed(() => new Date(today.value.getTime() + 30 * 24 * 60 * 60 * 1000));

  // フィルタ適用後の一覧
  const filteredProjects = computed(() => {
    let filtered = projectProgressList.value;

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q)
      );
    }

    if (statusFilter.value !== "all") {
      filtered = filtered.filter((project) => {
        switch (statusFilter.value) {
          case "in-progress":
            return project.status === "進行中";
          case "completed":
            return project.status === "完了";
          case "overdue": {
            if (!project.dueDate || project.dueDate === "-") return false;
            const due = new Date(project.dueDate);
            return due < today.value && project.status !== "完了";
          }
          default:
            return true;
        }
      });
    }

    if (ownerFilter.value !== "all") {
      filtered = filtered.filter((p) => p.owner === ownerFilter.value);
    }

    if (dateRangeFilter.value !== "all") {
      filtered = filtered.filter((project) => {
        if (!project.dueDate || project.dueDate === "-") return false;
        const due = new Date(project.dueDate);
        switch (dateRangeFilter.value) {
          case "this-week":
            return due >= today.value && due <= weekFromNow.value;
          case "this-month":
            return due >= today.value && due <= monthFromNow.value;
          case "overdue":
            return due < today.value && project.status !== "完了";
          default:
            return true;
        }
      });
    }

    return filtered;
  });

  // 担当者一覧
  const availableOwners = computed(() => {
    const owners = new Set(projectProgressList.value.map((p) => p.owner));
    return Array.from(owners).filter((o) => o !== "-");
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

  // フィルタリセット
  const clearFilters = () => {
    searchQuery.value = "";
    statusFilter.value = "all";
    ownerFilter.value = "all";
    dateRangeFilter.value = "all";
  };

  return {
    // state
    projectProgressList,
    isDashboardLoading,
    dashboardErrorMessage,
    // filters
    searchQuery,
    statusFilter,
    ownerFilter,
    dateRangeFilter,
    clearFilters,
    // computed lists
    filteredProjects,
    availableOwners,
    // stats
    inProgressCount,
    completedCount,
    completionRate,
    overdueCount,
    // actions
    loadDashboardFromDb,
  };
}


