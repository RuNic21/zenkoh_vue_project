import { ref, computed, onMounted } from "vue";
import { listProjects, createProject, updateProject, deleteProject } from "@/services/projectService";
import { listUsers } from "@/services/dbServices";
import { logProjectCreated } from "@/services/activityService";
import { getProjectStats, getProjectDetailStats, type ProjectStats, type ProjectDetailStats } from "@/services/dashboardService";
import { listTasks } from "@/services/taskService";
import { triggerProjectUpdatedNotification } from "@/utils/notificationTrigger";
import { getCurrentUserInfo } from "@/utils/userHelper";
import type { Project, ProjectInsert, ProjectUpdate } from "@/types/project";
import type { Task } from "@/types/task";
import type { Users } from "@/types/db/users";
import { formatDateJP } from "@/utils/formatters";
import { useMessage } from "./useMessage";
import { isServiceSuccess } from "@/utils/typeGuards";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/constants/messages";

// プロジェクト管理ページの状態とロジックを集約する composable
export function useProjectManagement() {
  // メッセージ管理
  const { showSuccess, showError } = useMessage();
  
  // 基本状態
  const projects = ref<Project[]>([]);
  const users = ref<Users[]>([]);
  const tasks = ref<Task[]>([]); // タスクデータを追加
  const isLoading = ref(false);
  const errorMessage = ref("");

  // 統計（全体統計は参照用に保持）
  const globalProjectStats = ref<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    archivedProjects: 0,
    overdueProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    blockedTasks: 0,
    averageProgress: 0,
  });
  const projectDetailStats = ref<ProjectDetailStats[]>([]);

  // モーダル
  const showCreateModal = ref(false);
  const showEditModal = ref(false);
  const showDeleteModal = ref(false);
  const selectedProject = ref<Project | null>(null);

  // フォーム
  const formData = ref<ProjectInsert>({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    owner_user_id: null,
    is_archived: false,
  });

  // フィルタ
  const searchQuery = ref("");
  const statusFilter = ref("all"); // 'all' | 'active' | 'archived'
  const dateFilter = ref("all"); // 'all' | 'this-month' | 'overdue'

  // フィルタ適用
  const filteredProjects = computed(() => {
    let filtered = projects.value;
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      // プロジェクト名のみで検索（説明は除外）
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q)
      );
    }
    if (statusFilter.value !== "all") {
      filtered = filtered.filter((p) => (statusFilter.value === "active" ? !p.is_archived : p.is_archived));
    }
    if (dateFilter.value !== "all") {
      const today = new Date();
      filtered = filtered.filter((p) => {
        if (!p.end_date) return false;
        const endDate = new Date(p.end_date);
        switch (dateFilter.value) {
          case "this-month": {
            const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            return endDate >= today && endDate <= monthFromNow;
          }
          case "overdue":
            return endDate < today && !p.is_archived;
          default:
            return true;
        }
      });
    }
    return filtered;
  });

  // フィルタリングされたプロジェクトに対する動的統計（フィルタに反応）
  const projectStats = computed<ProjectStats>(() => {
    const today = new Date();
    const filteredProjectIds = new Set(filteredProjects.value.map(p => p.id));
    
    // プロジェクト統計
    const totalProjects = filteredProjects.value.length;
    const activeProjects = filteredProjects.value.filter(p => !p.is_archived).length;
    const archivedProjects = filteredProjects.value.filter(p => p.is_archived).length;
    const overdueProjects = filteredProjects.value.filter(p => 
      !p.is_archived && p.end_date && new Date(p.end_date) < today
    ).length;

    // フィルタリングされたプロジェクトに属するタスクのみを集計
    const filteredTasks = tasks.value.filter(t => 
      t.project_id && filteredProjectIds.has(t.project_id) && !t.is_archived
    );
    
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === "DONE").length;
    const inProgressTasks = filteredTasks.filter(t => t.status === "IN_PROGRESS").length;
    const blockedTasks = filteredTasks.filter(t => t.status === "BLOCKED").length;
    
    const averageProgress = totalTasks > 0 
      ? Math.round(filteredTasks.reduce((sum, t) => sum + (t.progress_percent || 0), 0) / totalTasks)
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
      averageProgress,
    };
  });

  // テーブル設定
  const projectCurrentPage = ref(1);
  const projectPageSize = ref(DEFAULT_PAGE_SIZE);
  const projectSortColumn = ref<string>("");
  const projectSortDirection = ref<"asc" | "desc">("asc");
  const projectTableColumns = [
    { key: "name", label: "プロジェクト名", sortable: true },
    { key: "ownerName", label: "オーナー", sortable: true },
    { key: "progress", label: "進行率", sortable: true },
    { key: "taskSummary", label: "タスク", sortable: false },
    { key: "daysRemaining", label: "残り日数", sortable: true },
    { key: "startDate", label: "開始日", sortable: true, formatter: (v: string) => v || "-" },
    { key: "endDate", label: "終了日", sortable: true, formatter: (v: string) => v || "-" },
    { key: "status", label: "状態", sortable: true },
  ];

  const formatDate = (dateString: string | null): string => formatDateJP(dateString ?? null);
  const getOwnerName = (ownerId: number | null): string => {
    if (!ownerId) return "-";
    const owner = users.value.find((u) => u.id === ownerId);
    return owner ? owner.display_name : "-";
  };
  const getProjectStatus = (project: Project): string => {
    if (project.is_archived) return "アーカイブ";
    if (!project.end_date) return "進行中";
    const today = new Date();
    const endDate = new Date(project.end_date);
    return endDate < today ? "期限切れ" : "進行中";
  };

  // マガキまでの残り日数を計算する関数
  const calculateDaysRemaining = (endDate: string | null): { value: number; display: string; status: "overdue" | "warning" | "normal" | "none" } => {
    if (!endDate) return { value: 999999, display: "-", status: "none" };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { value: diffDays, display: `${Math.abs(diffDays)}日超過`, status: "overdue" };
    } else if (diffDays === 0) {
      return { value: 0, display: "今日まで", status: "warning" };
    } else if (diffDays <= 7) {
      return { value: diffDays, display: `${diffDays}日`, status: "warning" };
    } else {
      return { value: diffDays, display: `${diffDays}日`, status: "normal" };
    }
  };

  const projectTableRows = computed(() => {
    const base = filteredProjects.value.map((p) => {
      // 各プロジェクトのタスク統計を取得
      const projectTasks = tasks.value.filter(t => t.project_id === p.id && !t.is_archived);
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === "DONE").length;
      const inProgressTasks = projectTasks.filter(t => t.status === "IN_PROGRESS").length;
      
      // 進行率を計算（タスクベース）
      const progressPercent = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;
      
      // タスク要約文字列
      const taskSummary = totalTasks > 0 
        ? `完了 ${completedTasks}/${totalTasks}`
        : "タスクなし";
      
      // 残り日数計算
      const daysRemainingData = calculateDaysRemaining(p.end_date ?? null);
      
      return {
        id: p.id,
        name: p.name,
        ownerName: getOwnerName(p.owner_user_id ?? null),
        progress: progressPercent,
        taskSummary,
        totalTasks,
        completedTasks,
        inProgressTasks,
        daysRemaining: daysRemainingData.display,
        daysRemainingValue: daysRemainingData.value,
        daysRemainingStatus: daysRemainingData.status,
        startDate: p.start_date || "-",
        endDate: p.end_date || "-",
        status: getProjectStatus(p),
      };
    });
    
    if (projectSortColumn.value) {
      type ProjectRow = typeof base[number];
      const col = projectSortColumn.value as keyof ProjectRow;
      base.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;
        
        // 特定の列の場合は数値でソート
        if (col === "progress") {
          aVal = a.progress;
          bVal = b.progress;
        } else if (col === "daysRemaining") {
          aVal = a.daysRemainingValue;
          bVal = b.daysRemainingValue;
        } else {
          const aValue = a[col];
          const bValue = b[col];
          aVal = typeof aValue === "string" || typeof aValue === "number" ? aValue : "";
          bVal = typeof bValue === "string" || typeof bValue === "number" ? bValue : "";
        }
        
        if (aVal < bVal) return projectSortDirection.value === "asc" ? -1 : 1;
        if (aVal > bVal) return projectSortDirection.value === "asc" ? 1 : -1;
        return 0;
      });
    }
    return base;
  });

  const handleProjectSortChange = (column: string, direction: "asc" | "desc") => {
    if (projectSortColumn.value === column) {
      projectSortDirection.value = direction;
    } else {
      projectSortColumn.value = column;
      projectSortDirection.value = direction;
    }
  };
  const handleProjectPageChange = (page: number) => {
    if (page < 1) return;
    projectCurrentPage.value = page;
  };

  // CRUD/ロード
  const loadProjects = async () => {
    try {
      isLoading.value = true;
      errorMessage.value = "";
      const result = await listProjects();
      if (result.success && result.data) {
        projects.value = result.data;
      } else {
        errorMessage.value = result.error || ERROR_MESSAGES.PROJECT_LOAD_FAILED;
        projects.value = [];
      }
    } catch (e) {
      console.error("プロジェクト一覧の読み込みに失敗:", e);
      errorMessage.value = ERROR_MESSAGES.PROJECT_LOAD_FAILED;
      projects.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const loadUsers = async () => {
    try {
      const result = await listUsers();
      if (isServiceSuccess<Users[]>(result)) {
        users.value = result.data;
      } else if (Array.isArray(result)) {
        users.value = result as Users[];
      } else {
        users.value = [];
      }
    } catch (e) {
      console.error("ユーザー一覧の読み込みに失敗:", e);
      users.value = [];
    }
  };

  // タスク一覧を読み込む（フィルタリング統計のため）
  const loadTasks = async () => {
    try {
      const result = await listTasks();
      if (result.success && result.data) {
        tasks.value = result.data;
      } else {
        console.error("タスク一覧の読み込みに失敗:", result.error);
        tasks.value = [];
      }
    } catch (e) {
      console.error("タスク一覧の読み込みに失敗:", e);
      tasks.value = [];
    }
  };

  const resetForm = () => {
    formData.value = {
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      owner_user_id: null,
      is_archived: false,
    };
  };

  const handleCreateProject = async () => {
    try {
      if (!formData.value.name.trim()) {
        showError(ERROR_MESSAGES.REQUIRED_FIELD);
        return;
      }
      const result = await createProject(formData.value);
      if (result.success && result.data) {
        projects.value.push(result.data);
        showCreateModal.value = false;
        const ownerName = getOwnerName(result.data.owner_user_id ?? null);
        await logProjectCreated(result.data.id, result.data.name, ownerName);
        await Promise.all([loadTasks(), loadDashboardStats()]);
        resetForm();
        showSuccess(SUCCESS_MESSAGES.PROJECT_CREATE);
      } else {
        showError(result.error || "プロジェクトの作成に失敗しました。");
      }
    } catch (e) {
      console.error("プロジェクト作成エラー:", e);
      showError(ERROR_MESSAGES.PROJECT_CREATE_FAILED);
    }
  };

  const handleEditProject = async () => {
    try {
      if (!selectedProject.value || !formData.value.name.trim()) {
        showError("プロジェクト名を入力してください。");
        return;
      }
      const updateData: ProjectUpdate = {
        name: formData.value.name,
        description: formData.value.description,
        start_date: formData.value.start_date,
        end_date: formData.value.end_date,
        owner_user_id: formData.value.owner_user_id,
        is_archived: formData.value.is_archived,
      };
      const result = await updateProject(selectedProject.value.id, updateData);
      if (result.success && result.data) {
        const index = projects.value.findIndex((p) => p.id === selectedProject.value!.id);
        if (index !== -1) projects.value[index] = result.data;
        
        // プロジェクト更新通知を送信（オーナーがいる場合）
        if (result.data.owner_user_id) {
          try {
            // 現在のユーザー情報を取得
            const currentUser = await getCurrentUserInfo();
            
            // オーナー情報を取得
            const owner = users.value.find(u => u.id === result.data.owner_user_id);
            
            if (owner && owner.email && currentUser) {
              // 変更内容を生成
              const changes: string[] = [];
              if (formData.value.name !== selectedProject.value.name) {
                changes.push(`名前変更: "${selectedProject.value.name}" → "${formData.value.name}"`);
              }
              if (formData.value.description !== selectedProject.value.description) {
                changes.push("説明が更新されました");
              }
              if (formData.value.start_date !== selectedProject.value.start_date) {
                changes.push("開始日が変更されました");
              }
              if (formData.value.end_date !== selectedProject.value.end_date) {
                changes.push("終了日が変更されました");
              }
              if (formData.value.is_archived !== selectedProject.value.is_archived) {
                changes.push(formData.value.is_archived ? "アーカイブされました" : "アーカイブ解除されました");
              }
              
              const updateDescription = changes.length > 0 
                ? changes.join(", ") 
                : "プロジェクトが更新されました";
              
              // プロジェクト更新通知を送信
              await triggerProjectUpdatedNotification(
                result.data,
                owner.display_name || owner.username,
                owner.email,
                updateDescription,
                currentUser.name
              );
              console.log("✅ プロジェクト更新通知を送信しました");
            }
          } catch (notificationError) {
            // 通知送信失敗してもプロジェクト更新は成功として扱う
            console.warn("⚠️ プロジェクト更新通知の送信に失敗:", notificationError);
          }
        }
        
        showEditModal.value = false;
        selectedProject.value = null;
        await Promise.all([loadTasks(), loadDashboardStats()]);
        resetForm();
        showSuccess(SUCCESS_MESSAGES.PROJECT_UPDATE);
      } else {
        showError(result.error || "プロジェクトの更新に失敗しました。");
      }
    } catch (e) {
      console.error("プロジェクト更新エラー:", e);
      showError(ERROR_MESSAGES.PROJECT_UPDATE_FAILED);
    }
  };

  const handleDeleteProject = async () => {
    try {
      if (!selectedProject.value) return;
      const result = await deleteProject(selectedProject.value.id);
      if (result.success && result.data) {
        projects.value = projects.value.filter((p) => p.id !== selectedProject.value!.id);
        showDeleteModal.value = false;
        selectedProject.value = null;
        await Promise.all([loadTasks(), loadDashboardStats()]);
        showSuccess(SUCCESS_MESSAGES.PROJECT_DELETE);
      } else {
        showError(result.error || "プロジェクトの削除に失敗しました。");
      }
    } catch (e) {
      console.error("プロジェクト削除エラー:", e);
      showError(ERROR_MESSAGES.PROJECT_DELETE_FAILED);
    }
  };

  const openEditModal = (project: Project) => {
    selectedProject.value = project;
    formData.value = {
      name: project.name,
      description: project.description || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      owner_user_id: project.owner_user_id,
      is_archived: project.is_archived,
    };
    showEditModal.value = true;
  };
  const openDeleteModal = (project: Project) => {
    selectedProject.value = project;
    showDeleteModal.value = true;
  };

  const clearFilters = () => {
    searchQuery.value = "";
    statusFilter.value = "all";
    dateFilter.value = "all";
  };

  const loadDashboardStats = async () => {
    try {
      const [statsResult, detailStatsResult] = await Promise.all([getProjectStats(), getProjectDetailStats()]);
      if (statsResult.success && statsResult.data) globalProjectStats.value = statsResult.data;
      if (detailStatsResult.success && detailStatsResult.data) projectDetailStats.value = detailStatsResult.data;
    } catch (e) {
      console.error("ダッシュボード統計の読み込みに失敗:", e);
    }
  };

  const showProjectTasks = (project: Project) => {
    try {
      const projectId = project.id;
      const url = new URL(window.location.href);
      url.searchParams.set("id", projectId.toString());
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new CustomEvent("navigate-to-project-detail", { detail: { projectId } }));
      window.dispatchEvent(new PopStateEvent("popstate"));
      setTimeout(() => {
        window.dispatchEvent(new Event("hashchange"));
      }, 100);
    } catch (e) {
      console.error("プロジェクト詳細への遷移に失敗:", e);
      showError("プロジェクト詳細ページへの遷移に失敗しました。");
    }
  };

  // 初期ロード
  onMounted(async () => {
    await Promise.all([loadProjects(), loadUsers(), loadTasks(), loadDashboardStats()]);
  });

  return {
    // state
    projects,
    users,
    isLoading,
    errorMessage,
    projectStats,
    projectDetailStats,
    showCreateModal,
    showEditModal,
    showDeleteModal,
    selectedProject,
    formData,
    // filters
    searchQuery,
    statusFilter,
    dateFilter,
    clearFilters,
    filteredProjects,
    // table
    projectCurrentPage,
    projectPageSize,
    projectSortColumn,
    projectSortDirection,
    projectTableColumns,
    projectTableRows,
    handleProjectSortChange,
    handleProjectPageChange,
    // helpers & actions
    formatDate,
    getOwnerName,
    getProjectStatus,
    loadProjects,
    loadUsers,
    handleCreateProject,
    handleEditProject,
    handleDeleteProject,
    resetForm,
    openEditModal,
    openDeleteModal,
    loadDashboardStats,
    showProjectTasks,
  };
}


