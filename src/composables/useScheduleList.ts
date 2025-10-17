import { ref, computed, onMounted } from "vue";
import { useScheduleStore } from "@/store/schedule";

import type { ScheduleItem } from "@/types/schedule";
import type { Project } from "@/types/project";

// スケジュール一覧ページの状態とロジックを集約する composable
export function useScheduleList() {
  const store = useScheduleStore();
  const schedules = store.schedules;
  const isLoading = store.isLoading;
  const errorMessage = store.errorMessage;

  const projects = ref<Project[]>([]);

  const loadProjects = async (): Promise<void> => {
    try {
      const { listProjects } = await import("@/services/projectService");
      const result = await listProjects();
      projects.value = result.success && result.data ? result.data : [];
    } catch (e) {
      console.error("プロジェクトの読み込みに失敗", e);
      projects.value = [];
    }
  };

  const loadSchedulesFromDb = async (): Promise<void> => {
    try {
      await store.loadAll();
      await loadProjects();
    } catch (e) {
      console.error("スケジュールの読み込みに失敗", e);
    }
  };

  // フィルター
  const filterStatus = ref("all");
  const searchQuery = ref("");
  const selectedProjectId = ref<number | null>(null);

  const groupedSchedules = computed(() => {
    let filtered = schedules.value;
    if (filterStatus.value !== "all") {
      filtered = filtered.filter((s) => s.status === filterStatus.value);
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.assignee.toLowerCase().includes(q) ||
          (s.category || "").toLowerCase().includes(q)
      );
    }
    if (selectedProjectId.value !== null) {
      const selectedProject = projects.value.find((p) => p.id === selectedProjectId.value);
      if (selectedProject) {
        filtered = filtered.filter((s) => s.category === selectedProject.name);
      }
    }
    const groups: { [key: string]: ScheduleItem[] } = {};
    filtered.forEach((s) => {
      const projectName = s.category || "プロジェクト未設定";
      if (!groups[projectName]) groups[projectName] = [];
      groups[projectName].push(s);
    });
    return groups;
  });

  const projectStats = computed(() => {
    const stats: { [key: string]: { total: number; completed: number; inProgress: number; pending: number } } = {};
    Object.entries(groupedSchedules.value).forEach(([projectName, tasks]) => {
      stats[projectName] = {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === "DONE").length,
        inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
        pending: tasks.filter((t) => t.status === "NOT_STARTED").length,
      };
    });
    return stats;
  });

  const addNewSchedule = async () => {
    try {
      const newSchedule = {
        title: "新しいスケジュール",
        description: "",
        startDate: "",
        endDate: "",
        status: "NOT_STARTED" as const,
        priority: "MEDIUM" as const,
        assignee: "",
        progress: 0,
        category: "",
      };
      const created = await store.create(newSchedule);
      if (!created) throw new Error("スケジュールの作成に失敗しました");
    } catch (e) {
      console.error("スケジュールの作成に失敗", e);
      const message = e instanceof Error ? e.message : "スケジュールの作成に失敗しました";
      errorMessage.value = message;
    }
  };

  const editSchedule = (scheduleId: number) => {
    store.selectSchedule(scheduleId);
  };

  const deleteSchedule = async (scheduleId: number) => {
    if (!confirm("このスケジュールを削除しますか？")) return;
    try {
      await store.delete(scheduleId);
    } catch (e) {
      console.error("削除に失敗", e);
      const message = e instanceof Error ? e.message : "削除に失敗しました";
      errorMessage.value = message;
    }
  };

  const viewDetails = (scheduleId: number) => {
    store.selectSchedule(scheduleId);
  };

  const handleFilterUpdate = (key: string, value: any) => {
    if (key === "status") filterStatus.value = value;
    else if (key === "project") selectedProjectId.value = value;
  };

  onMounted(() => {
    loadSchedulesFromDb();
  });

  return {
    // state
    schedules,
    isLoading,
    errorMessage,
    projects,
    // filters
    filterStatus,
    searchQuery,
    selectedProjectId,
    handleFilterUpdate,
    // computed
    groupedSchedules,
    projectStats,
    // actions
    addNewSchedule,
    editSchedule,
    deleteSchedule,
    viewDetails,
  };
}


