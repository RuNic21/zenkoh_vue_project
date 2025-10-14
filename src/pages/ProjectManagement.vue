<script setup lang="ts">
// プロジェクト管理ページ: プロジェクトの一覧表示・作成・編集・削除機能
// 
// TODO: 今後の機能追加予定
// 1. プロジェクト進行率チャート・視覚化 (Chart.js使用)
//    - プロジェクト別進行率比較チャート
//    - タスク状態別分布パイチャート
//    - 担当者別作業量分布チャート
//    - 月別プロジェクト作成/完了推移
//
// 2. プロジェクトタイムラインビュー (ガントチャート風)
//    - プロジェクト開始日-終了日の視覚化
//    - マイルストーン表示
//    - 進行率をタイムラインに反映
//    - ドラッグ&ドロップでスケジュール調整
//
// 3. プロジェクト別カンバンボード
//    - boards, board_columnsテーブル活用
//    - タスクをカラム別にドラッグ&ドロップ
//    - WIP制限設定
//    - カラム別タスク数表示
//
// 4. プロジェクトメンバー管理
//    - task_membersテーブル活用
//    - メンバー追加/削除機能
//    - 役割管理 (OWNER, CONTRIBUTOR, REVIEWER)
//    - メンバー別作業量表示
//
// 5. 高度な検索・フィルタリング
//    - 複数条件検索
//    - 保存された検索条件
//    - ソートオプション拡張
//    - タグベースフィルタリング
//
// 6. プロジェクトデータエクスポート
//    - CSVエクスポート
//    - PDFレポート生成
//    - Excelエクスポート
//    - プロジェクト現況サマリーレポート
//
// 7. プロジェクトテンプレート
//    - よく使用するプロジェクト構造テンプレート
//    - 基本タスクテンプレート
//    - テンプレート適用で素早いプロジェクト作成
//
// 8. 通知・通知ルール管理
//    - alert_rulesテーブル活用
//    - DUE_SOON, OVERDUE, NO_PROGRESS通知
//    - メール通知設定
//    - 通知履歴確認

import { ref, computed, onMounted } from "vue";
import { listProjects, createProject, updateProject, deleteProject } from "../services/projectService";
import type { ProjectInsert, ProjectUpdate } from "../types/project";
import { listUsers } from "../services/dbServices";
import { logProjectCreated } from "../services/activityService";
import type { Project } from "../types/project";
import type { Users } from "../types/db/users";
import { 
  getProjectStats, 
  getProjectDetailStats, 
  getProjectTasks,
  getTaskStatusLabel,
  getTaskPriorityLabel,
  getTaskStatusBadgeClass,
  getTaskPriorityBadgeClass,
  type ProjectStats,
  type ProjectDetailStats
} from "../services/dashboardService";
import type { Task } from "../types/task";
import { getStatusBadgeClass } from "../utils/uiHelpers";

// プロジェクト一覧の状態管理
const projects = ref<Project[]>([]);
const users = ref<Users[]>([]);
const isLoading = ref(false);
const errorMessage = ref("");

// ダッシュボード統計情報
const projectStats = ref<ProjectStats>({
  totalProjects: 0,
  activeProjects: 0,
  archivedProjects: 0,
  overdueProjects: 0,
  totalTasks: 0,
  completedTasks: 0,
  inProgressTasks: 0,
  blockedTasks: 0,
  averageProgress: 0
});
const projectDetailStats = ref<ProjectDetailStats[]>([]);

// タスク管理
const selectedProjectTasks = ref<Task[]>([]);
const showTaskModal = ref(false);
const selectedProjectForTasks = ref<Project | null>(null);

// モーダル表示状態
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedProject = ref<Project | null>(null);

// フォームデータ
const formData = ref<ProjectInsert>({
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  owner_user_id: null,
  is_archived: false
});

// 検索・フィルタリング
const searchQuery = ref("");
const statusFilter = ref("all"); // 'all' | 'active' | 'archived'
const dateFilter = ref("all"); // 'all' | 'this-month' | 'overdue'

// フィルタリングされたプロジェクト一覧
const filteredProjects = computed(() => {
  let filtered = projects.value;

  // 検索クエリでフィルタリング
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(project => 
      project.name.toLowerCase().includes(query) ||
      (project.description && project.description.toLowerCase().includes(query))
    );
  }

  // 状態でフィルタリング
  if (statusFilter.value !== "all") {
    filtered = filtered.filter(project => {
      switch (statusFilter.value) {
        case "active":
          return !project.is_archived;
        case "archived":
          return project.is_archived;
        default:
          return true;
      }
    });
  }

  // 日付でフィルタリング
  if (dateFilter.value !== "all") {
    const today = new Date();
    filtered = filtered.filter(project => {
      if (!project.end_date) return false;
      const endDate = new Date(project.end_date);
      
      switch (dateFilter.value) {
        case "this-month":
          const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          return endDate >= today && endDate <= monthFromNow;
        case "overdue":
          return endDate < today && !project.is_archived;
        default:
          return true;
      }
    });
  }

  return filtered;
});

// プロジェクト一覧の読み込み
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
  } catch (error) {
    console.error("プロジェクト一覧の読み込みに失敗:", error);
    errorMessage.value = "プロジェクト一覧の読み込みに失敗しました。";
    projects.value = [];
  } finally {
    isLoading.value = false;
  }
};

// ユーザー一覧の読み込み
const loadUsers = async () => {
  try {
    users.value = await listUsers();
  } catch (error) {
    console.error("ユーザー一覧の読み込みに失敗:", error);
    users.value = [];
  }
};

// プロジェクトのオーナー名を取得
const getOwnerName = (ownerId: number | null): string => {
  if (!ownerId) return "-";
  const owner = users.value.find(user => user.id === ownerId);
  return owner ? owner.display_name : "-";
};

// 新規プロジェクト作成
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
      resetForm();
      
      // 活動ログを生成
      const ownerName = getOwnerName(result.data.owner_user_id ?? null);
      await logProjectCreated(result.data.id, result.data.name, ownerName);
      
      // ダッシュボード統計を更新
      await loadDashboardStats();
      
      alert("プロジェクトが正常に作成されました！");
    } else {
      alert(result.error || "プロジェクトの作成に失敗しました。");
    }
  } catch (error) {
    console.error("プロジェクト作成エラー:", error);
    alert("プロジェクト作成中にエラーが発生しました。");
  }
};

// プロジェクト編集
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
      is_archived: formData.value.is_archived
    };

    const result = await updateProject(selectedProject.value.id, updateData);
    if (result.success && result.data) {
      const index = projects.value.findIndex(p => p.id === selectedProject.value!.id);
      if (index !== -1) {
        projects.value[index] = result.data;
      }
      showEditModal.value = false;
      selectedProject.value = null;
      resetForm();
      
      // ダッシュボード統計を更新
      await loadDashboardStats();
      
      alert("プロジェクトが正常に更新されました！");
    } else {
      alert(result.error || "プロジェクトの更新に失敗しました。");
    }
  } catch (error) {
    console.error("プロジェクト更新エラー:", error);
    alert("プロジェクト更新中にエラーが発生しました。");
  }
};

// プロジェクト削除
const handleDeleteProject = async () => {
  try {
    if (!selectedProject.value) return;

    const result = await deleteProject(selectedProject.value.id);
    if (result.success && result.data) {
      projects.value = projects.value.filter(p => p.id !== selectedProject.value!.id);
      showDeleteModal.value = false;
      selectedProject.value = null;
      
      // ダッシュボード統計を更新
      await loadDashboardStats();
      
      alert("プロジェクトが正常に削除されました。");
    } else {
      alert(result.error || "プロジェクトの削除に失敗しました。");
    }
  } catch (error) {
    console.error("プロジェクト削除エラー:", error);
    alert("プロジェクト削除中にエラーが発生しました。");
  }
};

// フォームリセット
const resetForm = () => {
  formData.value = {
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    owner_user_id: null,
    is_archived: false
  };
};

// 編集モーダルを開く
const openEditModal = (project: Project) => {
  selectedProject.value = project;
  formData.value = {
    name: project.name,
    description: project.description || "",
    start_date: project.start_date || "",
    end_date: project.end_date || "",
    owner_user_id: project.owner_user_id,
    is_archived: project.is_archived
  };
  showEditModal.value = true;
};

// 削除モーダルを開く
const openDeleteModal = (project: Project) => {
  selectedProject.value = project;
  showDeleteModal.value = true;
};

// フィルタリセット
const clearFilters = () => {
  searchQuery.value = "";
  statusFilter.value = "all";
  dateFilter.value = "all";
};

// 日付フォーマット
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("ja-JP");
};

// プロジェクト状態の表示
const getProjectStatus = (project: Project): string => {
  if (project.is_archived) return "アーカイブ";
  
  if (!project.end_date) return "進行中";
  
  const today = new Date();
  const endDate = new Date(project.end_date);
  
  if (endDate < today) return "期限切れ";
  return "進行中";
};


// ダッシュボード統計情報の読み込み
const loadDashboardStats = async () => {
  try {
    const [statsResult, detailStats] = await Promise.all([
      getProjectStats(),
      getProjectDetailStats()
    ]);
    
    if (statsResult.success && statsResult.data) {
      projectStats.value = statsResult.data;
    } else {
      console.error("プロジェクト統計の読み込みに失敗:", statsResult.error);
    }
    
    projectDetailStats.value = detailStats;
  } catch (error) {
    console.error("ダッシュボード統計の読み込みに失敗:", error);
  }
};

// プロジェクトのタスク一覧を表示
const showProjectTasks = async (project: Project) => {
  try {
    selectedProjectForTasks.value = project;
    selectedProjectTasks.value = await getProjectTasks(project.id);
    showTaskModal.value = true;
  } catch (error) {
    console.error("プロジェクトタスクの読み込みに失敗:", error);
    alert("タスクの読み込みに失敗しました。");
  }
};

// タスクモーダルを閉じる
const closeTaskModal = () => {
  showTaskModal.value = false;
  selectedProjectForTasks.value = null;
  selectedProjectTasks.value = [];
};

// コンポーネントマウント時にデータを読み込み
onMounted(async () => {
  await Promise.all([
    loadProjects(),
    loadUsers(),
    loadDashboardStats()
  ]);
});
</script>

<template>
  <div class="container-fluid py-4">
    <!-- ページヘッダー -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="ms-3">
          <h3 class="mb-0 h4 font-weight-bolder">プロジェクト管理</h3>
          <p class="mb-4">
            プロジェクトの作成・編集・削除・一覧表示を行えます。
          </p>
        </div>
      </div>
    </div>

    <!-- エラー表示 -->
    <div v-if="errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
    </div>

    <!-- プロジェクト分析ダッシュボード -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <h6>プロジェクト分析ダッシュボード</h6>
            <p class="text-sm mb-0">
              <i class="fa fa-chart-bar text-info" aria-hidden="true"></i>
              <span class="font-weight-bold ms-1">プロジェクト</span>の統計情報
            </p>
          </div>
          <div class="card-body">
            <!-- 統計カード -->
            <div class="row">
              <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                <div class="card">
                  <div class="card-header p-2 ps-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0 text-capitalize">総プロジェクト数</p>
                        <h4 class="mb-0">{{ projectStats.totalProjects }}</h4>
                      </div>
                      <div class="icon icon-md icon-shape bg-gradient-primary shadow-dark shadow text-center border-radius-lg">
                        <i class="material-symbols-rounded opacity-10">folder</i>
                      </div>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-2 ps-3">
                    <p class="mb-0 text-sm">
                      <span class="text-success font-weight-bolder">{{ projectStats.activeProjects }}</span> アクティブ
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                <div class="card">
                  <div class="card-header p-2 ps-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0 text-capitalize">総タスク数</p>
                        <h4 class="mb-0">{{ projectStats.totalTasks }}</h4>
                      </div>
                      <div class="icon icon-md icon-shape bg-gradient-success shadow-dark shadow text-center border-radius-lg">
                        <i class="material-symbols-rounded opacity-10">task</i>
                      </div>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-2 ps-3">
                    <p class="mb-0 text-sm">
                      <span class="text-success font-weight-bolder">{{ projectStats.completedTasks }}</span> 完了済み
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                <div class="card">
                  <div class="card-header p-2 ps-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0 text-capitalize">平均進捗率</p>
                        <h4 class="mb-0">{{ projectStats.averageProgress }}%</h4>
                      </div>
                      <div class="icon icon-md icon-shape bg-gradient-info shadow-dark shadow text-center border-radius-lg">
                        <i class="material-symbols-rounded opacity-10">trending_up</i>
                      </div>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-2 ps-3">
                    <p class="mb-0 text-sm">
                      <span class="text-info font-weight-bolder">{{ projectStats.inProgressTasks }}</span> 進行中
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                <div class="card">
                  <div class="card-header p-2 ps-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0 text-capitalize">期限切れ</p>
                        <h4 class="mb-0">{{ projectStats.overdueProjects }}</h4>
                      </div>
                      <div class="icon icon-md icon-shape bg-gradient-danger shadow-dark shadow text-center border-radius-lg">
                        <i class="material-symbols-rounded opacity-10">warning</i>
                      </div>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-2 ps-3">
                    <p class="mb-0 text-sm">
                      <span class="text-danger font-weight-bolder">{{ projectStats.blockedTasks }}</span> ブロック
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- フィルタリング・アクションパネル -->
    <div class="row mb-4">
      <!-- フィルタリングパネル -->
      <div class="col-lg-8 col-md-12">
        <div class="card">
          <div class="card-header pb-0">
            <h6>フィルタリング・検索</h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-4 col-sm-6 mb-3">
                <label class="form-label text-sm">検索</label>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="プロジェクト名で検索..."
                  v-model="searchQuery"
                >
              </div>
              <div class="col-md-3 col-sm-6 mb-3">
                <label class="form-label text-sm">状態</label>
                <select class="form-control" v-model="statusFilter">
                  <option value="all">すべての状態</option>
                  <option value="active">アクティブ</option>
                  <option value="archived">アーカイブ</option>
                </select>
              </div>
              <div class="col-md-3 col-sm-6 mb-3">
                <label class="form-label text-sm">期限</label>
                <select class="form-control" v-model="dateFilter">
                  <option value="all">すべての期限</option>
                  <option value="this-month">今月</option>
                  <option value="overdue">期限切れ</option>
                </select>
              </div>
              <div class="col-md-2 col-sm-6 mb-3 d-flex align-items-end">
                <button 
                  class="btn btn-sm bg-gradient-secondary mb-0 w-100"
                  @click="clearFilters"
                >
                  リセット
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- アクションパネル -->
      <div class="col-lg-4 col-md-12">
        <div class="card">
          <div class="card-header pb-0">
            <h6>アクション</h6>
          </div>
          <div class="card-body">
            <button 
              class="btn bg-gradient-primary mb-0 w-100"
              @click="showCreateModal = true"
            >
              <i class="material-symbols-rounded me-2">add</i>
              新しいプロジェクト作成
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- プロジェクト一覧 -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <div class="row">
              <div class="col-lg-6 col-8">
                <h6>プロジェクト一覧</h6>
                <p class="text-sm mb-0">
                  <i class="fa fa-folder text-info" aria-hidden="true"></i>
                  <span class="font-weight-bold ms-1">プロジェクト</span>の管理
                  <span class="badge bg-gradient-info ms-2">{{ filteredProjects.length }}個のプロジェクト</span>
                </p>
              </div>
            </div>
          </div>
          <div class="card-body px-0 pt-0 pb-2">
            <!-- ローディング表示 -->
            <div v-if="isLoading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">読み込み中...</span>
              </div>
              <p class="text-sm text-secondary mt-2">プロジェクトデータを読み込み中...</p>
            </div>

            <!-- プロジェクト一覧テーブル -->
            <div v-else class="table-responsive p-0">
              <table class="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">プロジェクト名</th>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">説明</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">オーナー</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">開始日</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">終了日</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">状態</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">作成日</th>
                    <th class="text-secondary opacity-7">アクション</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="project in filteredProjects" :key="project.id">
                    <td>
                      <div class="d-flex px-3 py-1">
                        <div class="d-flex flex-column justify-content-center">
                          <h6 class="mb-0 text-sm">{{ project.name }}</h6>
                          <p class="text-xs text-secondary mb-0">ID: {{ project.id }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p class="text-xs font-weight-bold mb-0">
                        {{ project.description || "-" }}
                      </p>
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-secondary text-xs font-weight-normal">
                        {{ getOwnerName(project.owner_user_id ?? null) }}
                      </span>
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-secondary text-xs font-weight-normal">
                        {{ formatDate(project.start_date ?? null) }}
                      </span>
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-secondary text-xs font-weight-normal">
                        {{ formatDate(project.end_date ?? null) }}
                      </span>
                    </td>
                    <td class="align-middle text-center">
                      <span :class="getStatusBadgeClass(getProjectStatus(project))">
                        {{ getProjectStatus(project) }}
                      </span>
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-secondary text-xs font-weight-normal">
                        {{ formatDate(project.created_at) }}
                      </span>
                    </td>
                    <td class="align-middle">
                      <div class="btn-group" role="group">
                        <button 
                          class="btn btn-sm bg-gradient-success mb-0 me-1"
                          @click="showProjectTasks(project)"
                          title="タスク管理"
                        >
                          <i class="material-symbols-rounded">task</i>
                        </button>
                        <button 
                          class="btn btn-sm bg-gradient-info mb-0 me-1"
                          @click="openEditModal(project)"
                          title="編集"
                        >
                          <i class="material-symbols-rounded">edit</i>
                        </button>
                        <button 
                          class="btn btn-sm bg-gradient-danger mb-0"
                          @click="openDeleteModal(project)"
                          title="削除"
                        >
                          <i class="material-symbols-rounded">delete</i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- プロジェクトがない場合 -->
                  <tr v-if="!isLoading && filteredProjects.length === 0">
                    <td colspan="8" class="text-center py-4">
                      <i class="material-symbols-rounded text-secondary opacity-50" style="font-size: 48px;">folder_open</i>
                      <p class="text-sm text-secondary mt-2">プロジェクトが見つかりません</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新規作成モーダル -->
    <div v-if="showCreateModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">新しいプロジェクト作成</h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="mb-3">
                <label class="form-label">プロジェクト名 <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="formData.name"
                  placeholder="プロジェクト名を入力してください"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">説明</label>
                <textarea 
                  class="form-control" 
                  v-model="formData.description"
                  placeholder="プロジェクトの説明を入力してください"
                  rows="3"
                ></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">プロジェクトオーナー</label>
                <select class="form-control" v-model="formData.owner_user_id">
                  <option :value="null">オーナーを選択してください</option>
                  <option 
                    v-for="user in users" 
                    :key="user.id" 
                    :value="user.id"
                  >
                    {{ user.display_name }}
                  </option>
                </select>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">開始日</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="formData.start_date"
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">終了日</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="formData.end_date"
                  >
                </div>
              </div>
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    v-model="formData.is_archived"
                    id="isArchived"
                  >
                  <label class="form-check-label" for="isArchived">
                    アーカイブ状態で作成
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">キャンセル</button>
            <button type="button" class="btn bg-gradient-primary" @click="handleCreateProject">作成</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 編集モーダル -->
    <div v-if="showEditModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">プロジェクト編集</h5>
            <button type="button" class="btn-close" @click="showEditModal = false"></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="mb-3">
                <label class="form-label">プロジェクト名 <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="formData.name"
                  placeholder="プロジェクト名を入力してください"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">説明</label>
                <textarea 
                  class="form-control" 
                  v-model="formData.description"
                  placeholder="プロジェクトの説明を入力してください"
                  rows="3"
                ></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">プロジェクトオーナー</label>
                <select class="form-control" v-model="formData.owner_user_id">
                  <option :value="null">オーナーを選択してください</option>
                  <option 
                    v-for="user in users" 
                    :key="user.id" 
                    :value="user.id"
                  >
                    {{ user.display_name }}
                  </option>
                </select>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">開始日</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="formData.start_date"
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">終了日</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="formData.end_date"
                  >
                </div>
              </div>
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    v-model="formData.is_archived"
                    id="isArchivedEdit"
                  >
                  <label class="form-check-label" for="isArchivedEdit">
                    アーカイブ状態
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEditModal = false">キャンセル</button>
            <button type="button" class="btn bg-gradient-primary" @click="handleEditProject">更新</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 削除確認モーダル -->
    <div v-if="showDeleteModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">プロジェクト削除確認</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>以下のプロジェクトを削除してもよろしいですか？</p>
            <div class="alert alert-warning">
              <strong>{{ selectedProject?.name }}</strong>
              <br>
              <small>この操作は取り消すことができません。</small>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">キャンセル</button>
            <button type="button" class="btn bg-gradient-danger" @click="handleDeleteProject">削除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- タスク管理モーダル -->
    <div v-if="showTaskModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="material-symbols-rounded me-2">task</i>
              {{ selectedProjectForTasks?.name }} - タスク管理
            </h5>
            <button type="button" class="btn-close" @click="closeTaskModal"></button>
          </div>
          <div class="modal-body">
            <!-- タスク統計 -->
            <div class="row mb-4">
              <div class="col-md-3">
                <div class="card bg-gradient-primary text-white">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0">総タスク数</p>
                        <h4 class="mb-0">{{ selectedProjectTasks.length }}</h4>
                      </div>
                      <div class="icon icon-md">
                        <i class="material-symbols-rounded opacity-10">task</i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-gradient-success text-white">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0">完了済み</p>
                        <h4 class="mb-0">{{ selectedProjectTasks.filter(t => t.status === 'DONE').length }}</h4>
                      </div>
                      <div class="icon icon-md">
                        <i class="material-symbols-rounded opacity-10">check_circle</i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-gradient-info text-white">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0">進行中</p>
                        <h4 class="mb-0">{{ selectedProjectTasks.filter(t => t.status === 'IN_PROGRESS').length }}</h4>
                      </div>
                      <div class="icon icon-md">
                        <i class="material-symbols-rounded opacity-10">play_circle</i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-gradient-warning text-white">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0">ブロック</p>
                        <h4 class="mb-0">{{ selectedProjectTasks.filter(t => t.status === 'BLOCKED').length }}</h4>
                      </div>
                      <div class="icon icon-md">
                        <i class="material-symbols-rounded opacity-10">block</i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- タスク一覧テーブル -->
            <div class="table-responsive">
              <table class="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">タスク名</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">状態</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">優先度</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">進捗率</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">計画終了日</th>
                    <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">担当者</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="task in selectedProjectTasks" :key="task.id">
                    <td>
                      <div class="d-flex px-3 py-1">
                        <div class="d-flex flex-column justify-content-center">
                          <h6 class="mb-0 text-sm">{{ task.task_name }}</h6>
                          <p class="text-xs text-secondary mb-0" v-if="task.description">
                            {{ task.description.length > 50 ? task.description.substring(0, 50) + '...' : task.description }}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="align-middle text-center">
                      <span :class="getTaskStatusBadgeClass(task.status)">
                        {{ getTaskStatusLabel(task.status) }}
                      </span>
                    </td>
                    <td class="align-middle text-center">
                      <span :class="getTaskPriorityBadgeClass(task.priority)">
                        {{ getTaskPriorityLabel(task.priority) }}
                      </span>
                    </td>
                    <td class="align-middle text-center">
                      <div class="progress-wrapper w-75 mx-auto">
                        <div class="progress-info">
                          <div class="progress-percentage">
                            <span class="text-xs font-weight-bold">{{ task.progress_percent }}%</span>
                          </div>
                        </div>
                        <div class="progress">
                          <div 
                            class="progress-bar bg-gradient-info" 
                            role="progressbar" 
                            :style="{ width: task.progress_percent + '%' }"
                            :aria-valuenow="task.progress_percent" 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-secondary text-xs font-weight-normal">
                        {{ formatDate(task.planned_end ?? null) }}
                      </span>
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-secondary text-xs font-weight-normal">
                        {{ getOwnerName(task.primary_assignee_id ?? null) }}
                      </span>
                    </td>
                  </tr>
                  
                  <!-- タスクがない場合 -->
                  <tr v-if="selectedProjectTasks.length === 0">
                    <td colspan="6" class="text-center py-4">
                      <i class="material-symbols-rounded text-secondary opacity-50" style="font-size: 48px;">task_alt</i>
                      <p class="text-sm text-secondary mt-2">タスクが見つかりません</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeTaskModal">閉じる</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* モーダルスタイリング */
.modal {
  z-index: 1050;
}

.modal-dialog {
  margin-top: 5rem;
}

/* テーブルホバーエフェクト */
.table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* ボタングループスタイリング */
.btn-group .btn {
  border-radius: 0.375rem;
}

.btn-group .btn:not(:last-child) {
  margin-right: 0.25rem;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.875rem;
  }
  
  .btn-group {
    flex-direction: column;
  }
  
  .btn-group .btn {
    margin-bottom: 0.25rem;
    margin-right: 0;
  }
}
</style>
