import { ref, computed, onMounted } from "vue";
import { listProjects, createProject, updateProject, deleteProject } from "@/services/projectService";
import { listUsers } from "@/services/dbServices";
import { logProjectCreated } from "@/services/activityService";
import { getProjectStats, getProjectDetailStats, type ProjectStats, type ProjectDetailStats } from "@/services/dashboardService";
import type { Project, ProjectInsert, ProjectUpdate } from "@/types/project";
import type { Users } from "@/types/db/users";
import { formatDateJP } from "@/utils/formatters";

// プロジェクト管理ページの状態とロジックを集約する composable
export function useProjectManagement() {
  // 基本状態
  const projects = ref<Project[]>([]);
  const users = ref<Users[]>([]);
  const isLoading = ref(false);
  const errorMessage = ref("");

  // 統計
  const projectStats = ref<ProjectStats>({
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
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
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

  // テーブル設定
  const projectCurrentPage = ref(1);
  const projectPageSize = ref(10);
  const projectSortColumn = ref<string>("");
  const projectSortDirection = ref<"asc" | "desc">("asc");
  const projectTableColumns = [
    { key: "name", label: "プロジェクト名", sortable: true },
    { key: "description", label: "説明" },
    { key: "ownerName", label: "オーナー", sortable: true },
    { key: "startDate", label: "開始日", sortable: true, formatter: (v: string) => v || "-" },
    { key: "endDate", label: "終了日", sortable: true, formatter: (v: string) => v || "-" },
    { key: "status", label: "状態", sortable: true },
    { key: "createdAt", label: "作成日", sortable: true },
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

  const projectTableRows = computed(() => {
    const base = filteredProjects.value.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || "-",
      ownerName: getOwnerName(p.owner_user_id ?? null),
      startDate: p.start_date || "-",
      endDate: p.end_date || "-",
      status: getProjectStatus(p),
      createdAt: formatDate(p.created_at),
    }));
    if (projectSortColumn.value) {
      const col = projectSortColumn.value as keyof (typeof base)[number];
      base.sort((a, b) => {
        const aVal = (a[col] as any) ?? "";
        const bVal = (b[col] as any) ?? "";
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
        errorMessage.value = result.error || "プロジェクト一覧の読み込みに失敗しました。";
        projects.value = [];
      }
    } catch (e) {
      console.error("プロジェクト一覧の読み込みに失敗:", e);
      errorMessage.value = "プロジェクト一覧の読み込みに失敗しました。";
      projects.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const loadUsers = async () => {
    try {
      const result = await listUsers();
      if (result && typeof result === "object" && "success" in result) {
        users.value = result.success && result.data ? (result.data as Users[]) : [];
      } else {
        users.value = (result as unknown as Users[]) ?? [];
      }
    } catch (e) {
      console.error("ユーザー一覧の読み込みに失敗:", e);
      users.value = [];
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
        alert("プロジェクト名を入力してください。");
        return;
      }
      const result = await createProject(formData.value);
      if (result.success && result.data) {
        projects.value.push(result.data);
        showCreateModal.value = false;
        const ownerName = getOwnerName(result.data.owner_user_id ?? null);
        await logProjectCreated(result.data.id, result.data.name, ownerName);
        await loadDashboardStats();
        resetForm();
        alert("プロジェクトが正常に作成されました！");
      } else {
        alert(result.error || "プロジェクトの作成に失敗しました。");
      }
    } catch (e) {
      console.error("プロジェクト作成エラー:", e);
      alert("プロジェクト作成中にエラーが発生しました。");
    }
  };

  const handleEditProject = async () => {
    try {
      if (!selectedProject.value || !formData.value.name.trim()) {
        alert("プロジェクト名を入力してください。");
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
        showEditModal.value = false;
        selectedProject.value = null;
        await loadDashboardStats();
        resetForm();
        alert("プロジェクトが正常に更新されました！");
      } else {
        alert(result.error || "プロジェクトの更新に失敗しました。");
      }
    } catch (e) {
      console.error("プロジェクト更新エラー:", e);
      alert("プロジェクト更新中にエラーが発生しました。");
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
        await loadDashboardStats();
        alert("プロジェクトが正常に削除されました。");
      } else {
        alert(result.error || "プロジェクトの削除に失敗しました。");
      }
    } catch (e) {
      console.error("プロジェクト削除エラー:", e);
      alert("プロジェクト削除中にエラーが発生しました。");
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
      if (statsResult.success && statsResult.data) projectStats.value = statsResult.data;
      if (detailStatsResult.success && detailStatsResult.data) projectDetailStats.value = detailStatsResult.data;
    } catch (e) {
      console.error("ダッシュボード統計の読み込みに失敗:", e);
    }
  };

  const showProjectTasks = async (project: Project) => {
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
      alert("プロジェクト詳細ページへの遷移に失敗しました。");
    }
  };

  // 初期ロード
  onMounted(async () => {
    await Promise.all([loadProjects(), loadUsers(), loadDashboardStats()]);
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


