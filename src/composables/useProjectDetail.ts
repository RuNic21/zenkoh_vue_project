import { ref, computed, onMounted, watch } from "vue";
import { listUsers } from "@/services/dbServices";
import { getProjectTasks, getProjectDetailStats } from "@/services/dashboardService";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import type { Users } from "@/types/db/users";
import type { ProjectDetailStats } from "@/services/dashboardService";

// プロジェクト詳細ページの状態とロジックを集約する composable
export function useProjectDetail() {
  // 画面状態
  const isLoading = ref(false);
  const errorMessage = ref("");
  const projectDetail = ref<Project | null>(null);
  const projectTasks = ref<Task[]>([]);
  const projectStats = ref<ProjectDetailStats | null>(null);
  const users = ref<Users[]>([]);

  // 編集モード
  const isEditMode = ref(false);
  const editForm = ref<Partial<Project>>({});

  // タスクモーダル
  const showTaskModal = ref(false);
  const selectedTask = ref<Task | null>(null);

  // オーナー名取得
  const getOwnerName = (ownerId: number | null | undefined): string => {
    if (!ownerId) return "未設定";
    const owner = users.value.find((user) => user.id === ownerId);
    return owner ? owner.display_name : "未設定";
  };

  // ロード処理
  const loadUsers = async () => {
    try {
      const result = (await listUsers()) as any;
      if (result.success && result.data) {
        users.value = result.data;
      }
    } catch (error) {
      console.error("ユーザーデータの読み込みに失敗:", error);
    }
  };

  const loadProjectDetail = async (projectId: number) => {
    try {
      isLoading.value = true;
      errorMessage.value = "";

      // プロジェクト情報
      const { listProjects } = await import("@/services/projectService");
      const projectsResult = await listProjects();
      if (projectsResult.success && projectsResult.data) {
        const project = projectsResult.data.find((p) => p.id === projectId);
        if (project) {
          projectDetail.value = project;
          editForm.value = { ...project };
        } else {
          errorMessage.value = "プロジェクトが見つかりません";
          return;
        }
      } else {
        errorMessage.value = "プロジェクトの読み込みに失敗しました";
        return;
      }

      // タスク一覧
      const tasksResult = await getProjectTasks(projectId);
      if (Array.isArray(tasksResult)) {
        projectTasks.value = tasksResult;
      }

      // 統計
      const statsResult = await getProjectDetailStats(projectId);
      if (statsResult.success && statsResult.data && statsResult.data.length > 0) {
        projectStats.value = statsResult.data[0];
      }
    } catch (error) {
      console.error("プロジェクト詳細の読み込みに失敗:", error);
      errorMessage.value = "プロジェクト詳細の読み込みに失敗しました";
    } finally {
      isLoading.value = false;
    }
  };

  // 編集
  const toggleEditMode = () => {
    isEditMode.value = !isEditMode.value;
    if (isEditMode.value && projectDetail.value) {
      editForm.value = { ...projectDetail.value };
    }
  };

  const saveProject = async () => {
    if (!projectDetail.value) return;
    try {
      const { updateProject } = await import("@/services/projectService");
      const result = await updateProject(projectDetail.value.id, editForm.value);
      if (result.success && result.data) {
        projectDetail.value = result.data;
        isEditMode.value = false;
      } else {
        errorMessage.value = result.error || "プロジェクトの保存に失敗しました";
      }
    } catch (error) {
      console.error("プロジェクトの保存に失敗:", error);
      errorMessage.value = "プロジェクトの保存に失敗しました";
    }
  };

  const cancelEdit = () => {
    if (projectDetail.value) {
      editForm.value = { ...projectDetail.value };
    }
    isEditMode.value = false;
  };

  const deleteProject = async () => {
    if (!projectDetail.value) return;
    if (confirm("このプロジェクトを削除してもよろしいですか？")) {
      try {
        const { deleteProject } = await import("@/services/projectService");
        const result = await deleteProject(projectDetail.value.id);
        if (result.success) {
          alert("プロジェクトが削除されました");
          window.history.back();
        } else {
          errorMessage.value = result.error || "プロジェクトの削除に失敗しました";
        }
      } catch (error) {
        console.error("プロジェクトの削除に失敗:", error);
        errorMessage.value = "プロジェクトの削除に失敗しました";
      }
    }
  };

  // タスクモーダル
  const showTaskDetail = (task: Task) => {
    selectedTask.value = task;
    showTaskModal.value = true;
  };

  const closeTaskModal = () => {
    showTaskModal.value = false;
    selectedTask.value = null;
  };

  // 統計
  const projectProgress = computed(() => {
    if (!projectTasks.value.length) return 0;
    const total = projectTasks.value.reduce((sum, task) => sum + (task.progress_percent || 0), 0);
    return Math.round(total / projectTasks.value.length);
  });

  const completedTasksCount = computed(() => projectTasks.value.filter((t) => t.status === "DONE").length);
  const inProgressTasksCount = computed(() => projectTasks.value.filter((t) => t.status === "IN_PROGRESS").length);
  const notStartedTasksCount = computed(() => projectTasks.value.filter((t) => t.status === "NOT_STARTED").length);

  // URL から ID を取得してロード
  const loadProjectFromUrl = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("id");
    if (projectId) {
      await loadProjectDetail(parseInt(projectId));
    } else {
      errorMessage.value = "プロジェクトIDが指定されていません";
    }
  };

  onMounted(async () => {
    await loadUsers();
    await loadProjectFromUrl();
  });

  watch(
    () => window.location.search,
    () => {
      loadProjectFromUrl();
    },
    { immediate: false }
  );

  onMounted(() => {
    const handleUrlChange = () => {
      loadProjectFromUrl();
    };
    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("hashchange", handleUrlChange);
    window.addEventListener("navigate-to-project-detail", handleUrlChange);
  });

  return {
    // state
    isLoading,
    errorMessage,
    projectDetail,
    projectTasks,
    projectStats,
    users,
    isEditMode,
    editForm,
    showTaskModal,
    selectedTask,
    // getters
    getOwnerName,
    // actions
    toggleEditMode,
    saveProject,
    cancelEdit,
    deleteProject,
    showTaskDetail,
    closeTaskModal,
    // stats
    projectProgress,
    completedTasksCount,
    inProgressTasksCount,
    notStartedTasksCount,
  };
}


