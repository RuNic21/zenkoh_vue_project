<script setup lang="ts">
// プロジェクト管理スケジューラー: メインアプリケーションコンポーネント
import { ref, computed, onMounted, watch } from "vue";
import { useScheduleStore } from "./store/schedule";
import { getStatusBadgeClass, getProgressBarClass } from "./utils/uiHelpers";
import MainLayout from "./layouts/MainLayout.vue";
import ScheduleList from "./pages/ScheduleList.vue";
import ScheduleDetail from "./pages/ScheduleDetail.vue";
import ProjectManagement from "./pages/ProjectManagement.vue";
import ProjectDetail from "./pages/ProjectDetail.vue";
import TeamManagement from "./pages/TeamManagement.vue";
import ReportPage from "./pages/ReportPage.vue";
// 分割したダッシュボード用コンポーネント
import DashboardFilters from "./components/dashboard/DashboardFilters.vue";
import DashboardStats from "./components/dashboard/DashboardStats.vue";
import ProjectProgressTable from "./components/dashboard/ProjectProgressTable.vue";
import RecentActivities from "./components/dashboard/RecentActivities.vue";
import ProjectTasksModal from "./components/dashboard/ProjectTasksModal.vue";
// ダッシュボード用 composable と型
import { useDashboard } from "./composables/useDashboard";
import type { ProjectProgressRow } from "./services/dashboardService";

// ========================================
// Phase 1: 基本分析機能の実装 TODO
// ========================================

// TODO: 1. プロジェクト進捗率ドーナツチャート実装
// - tasks.progress_percent を基にした進捗率可視化
// - Chart.js を使用してドーナツチャート作成
// - プロジェクト別・全体進捗率の表示
// - リアルタイム更新機能

// TODO: 2. 締切アラートウィジェット実装
// - planned_end, end_date を基にした締切監視
// - 3日以内の締切プロジェクトをハイライト表示
// - 期限切れプロジェクトの警告表示
// - クリックで詳細ページへ遷移

// TODO: 3. 優先度別分布チャート実装
// - tasks.priority (LOW/MEDIUM/HIGH/URGENT) の分布可視化
// - 円グラフまたは棒グラフで優先度分布表示
// - フィルタリング機能との連携
// - 優先度別の進捗率比較

// TODO: 4. Chart.js ライブラリ統合
// - Chart.js のインストールと設定
// - チャートコンポーネントの作成
// - レスポンシブデザイン対応
// - テーマカラーとの統一

// TODO: 5. チャート用データサービス関数実装
// - 進捗率データ取得関数
// - 締切データ取得関数
// - 優先度分布データ取得関数
// - データキャッシュ機能
// - エラーハンドリング

// ========================================
// メインアプリケーションコンポーネント
// ========================================

// 現在のページを管理するリアクティブデータ
const currentPage = ref("dashboard");
// 共有ストアを初期化
const store = useScheduleStore();

// ページ切り替えメソッド
const navigateToPage = (pageName: string) => {
  currentPage.value = pageName;
  
  // スケジュール一覧ページに戻る際は選択状態をクリア
  if (pageName === "schedule-list") {
    store.selectSchedule(null);
  }
};

// ダッシュボードの「詳細を見る」クリック時の処理
// 目的: プロジェクトのタスクモーダルを表示する
const selectedProjectTasks = ref<any[]>([]);
const showTaskModal = ref(false);
const selectedProjectForTasks = ref<any>(null);

const handleViewProjectDetail = async (project: ProjectProgressRow) => {
  try {
    // プロジェクトのタスク一覧を モーダルに表示
    const { getProjectTasks } = await import("./services/dashboardService");
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

// 現在のページコンポーネントを計算
const currentComponent = computed(() => {
  switch (currentPage.value) {
    case "schedule-list":
      return ScheduleList;
    case "schedule-detail":
      return ScheduleDetail;
    case "project-management":
      return ProjectManagement;
    case "project-detail":
      return ProjectDetail;
    case "team":
      return TeamManagement;
    case "report":
      return ReportPage;
    default:
      return null;
  }
});

// ダッシュボード用状態とロジックは composable へ集約
const {
  projectProgressList,
  isDashboardLoading,
  dashboardErrorMessage,
  searchQuery,
  statusFilter,
  ownerFilter,
  dateRangeFilter,
  clearFilters,
  filteredProjects,
  availableOwners,
  inProgressCount,
  completedCount,
  completionRate,
  overdueCount,
  loadDashboardFromDb,
} = useDashboard();

// クイックアクションパネル
const quickActions = [
  {
    label: "新しいプロジェクト作成",
    icon: "add",
    color: "bg-gradient-primary",
    action: () => handleCreateProject()
  },
  {
    label: "タスク追加",
    icon: "task_alt", 
    color: "bg-gradient-success",
    action: () => handleAddTask()
  },
  {
    label: "チームメンバー招待",
    icon: "person_add",
    color: "bg-gradient-info", 
    action: () => handleInviteTeamMember()
  },
  {
    label: "レポート生成",
    icon: "assessment",
    color: "bg-gradient-warning",
    action: () => handleGenerateReport()
  }
];

// クイックアクション処理メソッド
const handleCreateProject = async () => {
  try {
    const projectName = prompt("新しいプロジェクト名を入力してください:");
    if (!projectName || projectName.trim() === "") {
      return;
    }

    // 実際にデータベースへプロジェクトを作成
    const { createProject } = await import("./services/projectService");
    const result = await createProject({
      name: projectName.trim(),
      description: "",
      owner_user_id: null, // 現在のユーザーIDは認証システム実装後に設定
      start_date: new Date().toISOString().split('T')[0],
      end_date: null,
      is_archived: false
    });

    if (result.success && result.data) {
      // 活動ログ生成
      const { logProjectCreated } = await import("./services/activityService");
      await logProjectCreated(result.data.id, projectName, "システム");
      
      alert(`プロジェクト "${projectName}"が正常に作成されました！`);
      // ダッシュボードデータの更新
      await loadDashboardFromDb();
      // 活動フィードの更新
      await loadActivityFeed();
    } else {
      alert(result.error || "プロジェクトの作成に失敗しました。再試行してください。");
    }
  } catch (error) {
    console.error("プロジェクト作成中のエラー:", error);
    alert("プロジェクト作成中にエラーが発生しました。");
  }
};

const handleAddTask = async () => {
  try {
    const taskName = prompt("新しいタスク名を入力してください:");
    if (!taskName || taskName.trim() === "") {
      return;
    }

    // プロジェクト選択（最初のプロジェクトを使用）
    const firstProject = projectProgressList.value[0];
    if (!firstProject) {
      alert("まずプロジェクトを作成してください。");
      return;
    }

    // 実際の DB にタスクを作成
    const { createTask } = await import("./services/taskService");
    const result = await createTask({
      project_id: firstProject.id,
      task_name: taskName.trim(),
      description: "",
      status: "NOT_STARTED",
      priority: "MEDIUM",
      progress_percent: 0,
      primary_assignee_id: null,
      is_archived: false
    });

    if (result.success && result.data) {
      // 活動ログ生成
      const { logTaskCreated } = await import("./services/activityService");
      await logTaskCreated(firstProject.id, result.data.id, firstProject.name, taskName);
      
      alert(`タスク "${taskName}"が正常に作成されました！`);
      // ダッシュボードデータの更新
      await loadDashboardFromDb();
      // 活動フィードの更新
      await loadActivityFeed();
    } else {
      alert(result.error || "タスクの作成に失敗しました。再試行してください。");
    }
  } catch (error) {
    console.error("タスク作成中のエラー:", error);
    alert("タスク作成中にエラーが発生しました。");
  }
};

const handleInviteTeamMember = () => {
  console.log("チームメンバー招待");
  // TODO: チームメンバー招待 モーダル または ページへ移動
  alert("チームメンバー招待機能を実装中です。");
};

const handleGenerateReport = () => {
  console.log("レポートページへ遷移");
  currentPage.value = "report";
};

// 最近の活動フィード
interface ActivityLog {
  id: number;
  type: 'project_created' | 'task_completed' | 'deadline_approaching' | 'user_assigned' | 'task_created' | 'project_updated';
  description: string;
  user: string;
  timestamp: Date;
  projectId?: number;
  taskId?: number;
  projectName?: string;
  taskName?: string;
}

// 活動フィード用のローディング状態
const isActivityLoading = ref(false);

// 実際のDBから活動データを取得する関数
const loadRecentActivities = async (): Promise<ActivityLog[]> => {
  try {
    // 実際の notifications テーブルから活動データを取得
    const { fetchRecentActivities } = await import('./services/activityService');
    const result = await fetchRecentActivities(10);
    
    // DBから取得したデータのみを返す（Mockデータは削除）
    return result.success && result.data ? result.data : [];
  } catch (error) {
    console.error("活動データの読み込みに失敗:", error);
    return [];
  }
};

const recentActivities = ref<ActivityLog[]>([]);

// 活動の相対時間表示
const getRelativeTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  return `${days}日前`;
};

// 活動タイプ別アイコン
const getActivityIcon = (type: ActivityLog['type']): string => {
  switch (type) {
    case 'project_created': return 'add_circle';
    case 'task_completed': return 'check_circle';
    case 'deadline_approaching': return 'schedule';
    case 'user_assigned': return 'person_add';
    case 'task_created': return 'task_alt';
    case 'project_updated': return 'edit';
    default: return 'info';
  }
};

// 活動タイプ別色
const getActivityColor = (type: ActivityLog['type']): string => {
  switch (type) {
    case 'project_created': return 'bg-gradient-primary';
    case 'task_completed': return 'bg-gradient-success';
    case 'deadline_approaching': return 'bg-gradient-warning';
    case 'user_assigned': return 'bg-gradient-info';
    case 'task_created': return 'bg-gradient-secondary';
    case 'project_updated': return 'bg-gradient-dark';
    default: return 'bg-gradient-secondary';
  }
};

// アプリケーション初期化
onMounted(async () => {
  console.log("プロジェクト管理スケジューラーが起動しました");
  // スケジュールデータを DB から読み込み
  store.loadAll().catch((e) => console.error("初期データの読み込みに失敗", e));
  // ダッシュボードを DB から取得
  await loadDashboardFromDb();
  // 活動フィードを 読み込み
  await loadActivityFeed();
});

// 活動フィード 読み込み 関数
const loadActivityFeed = async () => {
  try {
    isActivityLoading.value = true;
    recentActivities.value = await loadRecentActivities();
  } catch (error) {
    console.error("活動フィードの読み込みに失敗:", error);
    recentActivities.value = [];
  } finally {
    isActivityLoading.value = false;
  }
};

// ストアでスケジュールが選択されたら詳細ページへ遷移
watch(() => store.selectedScheduleId.value, (id, oldId) => {
  if (id != null && id !== oldId) {
    console.log("スケジュールが選択されました:", id);
    currentPage.value = "schedule-detail";
  }
});

// ProjectManagement.vueからプロジェクト詳細ページ遷移イベントをリッスン
onMounted(() => {
  window.addEventListener('navigate-to-project-detail', (event: any) => {
    const { projectId } = event.detail;
    currentPage.value = "project-detail";
  });
});
</script>

<template>
  <!-- メインレイアウトコンテナ -->
  <div id="app" class="g-sidenav-show bg-gray-100">
    <!-- メインレイアウトコンポーネント -->
    <MainLayout 
      :current-page="currentPage"
      @navigate="navigateToPage"
    >
      <!-- 動的コンテンツエリア -->
      <div class="main-content position-relative max-height-vh-100 h-100 border-radius-lg">
        <!-- ナビゲーションバー -->
        <nav class="navbar navbar-main navbar-expand-lg px-0 mx-3 shadow-none border-radius-xl" id="navbarBlur" data-scroll="true">
          <div class="container-fluid py-1 px-3">
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0 me-sm-6 me-5">
                <li class="breadcrumb-item text-sm">
                  <a class="opacity-5 text-dark" href="javascript:;">ページ</a>
                </li>
                <li class="breadcrumb-item text-sm text-dark active" aria-current="page">
                  {{ 
                    currentPage === 'dashboard' ? 'ダッシュボード' : 
                    currentPage === 'project-management' ? 'プロジェクト管理' : 
                    currentPage === 'project-detail' ? 'プロジェクト詳細' :
                    currentPage === 'team' ? 'チーム管理' :
                    currentPage === 'report' ? 'レポート' :
                    'スケジュール管理' 
                  }}
                </li>
              </ol>
            </nav>
            <div class="collapse navbar-collapse mt-sm-0 mt-2 me-md-0 me-sm-4" id="navbar">
              <div class="ms-md-auto pe-md-3 d-flex align-items-center">
                <div class="input-group input-group-outline">
                  <label class="form-label"></label>
                  <input 
                    type="text" 
                    class="form-control" 
                    placeholder="プロジェクトや担当者を検索してください"
                    v-model="searchQuery"
                  >
                </div>
              </div>
              <ul class="navbar-nav d-flex align-items-center justify-content-end">
                <li class="nav-item px-3 d-flex align-items-center">
                  <a href="javascript:;" class="nav-link text-body p-0">
                    <i class="material-symbols-rounded fixed-plugin-button-nav">settings</i>
                  </a>
                </li>
                <li class="nav-item dropdown pe-3 d-flex align-items-center">
                  <a href="javascript:;" class="nav-link text-body p-0" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="material-symbols-rounded">notifications</i>
                  </a>
                  <ul class="dropdown-menu dropdown-menu-end px-2 py-3 me-sm-n4" aria-labelledby="dropdownMenuButton">
                    <li class="mb-2">
                      <a class="dropdown-item border-radius-md" href="javascript:;">
                        <div class="d-flex py-1">
                          <div class="my-auto">
                            <div class="avatar avatar-sm bg-gradient-primary me-3">
                              <i class="material-symbols-rounded text-white">schedule</i>
                            </div>
                          </div>
                          <!-- ダミーデータ -->
                          <div class="d-flex flex-column justify-content-center">
                            <h6 class="text-sm font-weight-normal mb-1">
                              <span class="font-weight-bold">新しいスケジュール</span>が追加されました
                            </h6>
                            <p class="text-xs text-secondary mb-0">
                              <i class="fa fa-clock me-1"></i>
                              5分前
                            </p>
                          </div>
                        </div>
                      </a>
                    </li>
                  </ul>
                </li>
                <li class="nav-item d-flex align-items-center">
                  <a href="javascript:;" class="nav-link text-body font-weight-bold px-0">
                    <i class="material-symbols-rounded">account_circle</i>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <!-- ナビゲーションバー終了 -->

        <!-- メインコンテンツエリア -->
        <div class="container-fluid py-4">
          <!-- ダッシュボードページ -->
          <div v-if="currentPage === 'dashboard'">
            <!-- ローディング/エラー表示 -->
            <div v-if="isDashboardLoading" class="alert alert-secondary" role="alert">
              読み込み中です...
            </div>
            <div v-if="!isDashboardLoading && dashboardErrorMessage" class="alert alert-danger" role="alert">
              {{ dashboardErrorMessage }}
            </div>
            <!-- ページヘッダー -->
            <div class="row mb-4">
              <div class="col-12">
                <div class="ms-3">
                  <h3 class="mb-0 h4 font-weight-bolder">プロジェクト管理ダッシュボード</h3>
                  <p class="mb-4">
                    プロジェクトの進捗状況とスケジュールを一覧で確認できます。
                  </p>
                </div>
              </div>
            </div>

            <!-- フィルタリング・クイックアクションパネル -->
            <div class="row mb-4">
              <!-- フィルタリングパネル -->
              <div class="col-lg-8 col-md-12">
                <DashboardFilters 
                  :search-query="searchQuery"
                  :status-filter="statusFilter"
                  :owner-filter="ownerFilter"
                  :date-range-filter="dateRangeFilter"
                  :available-owners="availableOwners"
                  @update:searchQuery="(v:string)=>searchQuery=v"
                  @update:statusFilter="(v:string)=>statusFilter=v"
                  @update:ownerFilter="(v:string)=>ownerFilter=v"
                  @update:dateRangeFilter="(v:string)=>dateRangeFilter=v"
                  @clear="clearFilters"
                />
              </div>

              <!-- クイックアクションパネル -->
              <div class="col-lg-4 col-md-12">
                <div class="card">
                  <div class="card-header pb-0">
                    <h6>クイックアクション</h6>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div 
                        v-for="action in quickActions" 
                        :key="action.label"
                        class="col-6 mb-3"
                      >
                        <button 
                          :class="`btn btn-sm ${action.color} mb-0 w-100`"
                          @click="action.action"
                          :title="action.label"
                        >
                          <i class="material-symbols-rounded me-1">{{ action.icon }}</i>
                          <span class="d-none d-sm-inline">{{ action.label }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DashboardStats 
              :in-progress-count="inProgressCount"
              :completed-count="completedCount"
              :completion-rate="completionRate"
              :overdue-count="overdueCount"
            />


          </div>

          <!-- プロジェクト別進捗の一覧表示 -->
          <div v-if="currentPage === 'dashboard'" class="row">
            <div class="col-12">
              <ProjectProgressTable 
                :rows="filteredProjects"
                @viewDetail="handleViewProjectDetail"
              />
            </div>
          </div>

          <!-- 最近の活動フィード -->
          <div v-if="currentPage === 'dashboard'" class="row mt-4">
            <div class="col-12">
              <RecentActivities :activities="recentActivities" :is-loading="isActivityLoading" />
            </div>
          </div>

          <!-- 動的コンポーネント表示 -->
          <component v-else :is="currentComponent" />
        </div>
      </div>
    </MainLayout>

    <!-- タスク管理モーダル -->
    <ProjectTasksModal 
      :visible="showTaskModal"
      :project-name="selectedProjectForTasks?.name ?? null"
      :tasks="selectedProjectTasks"
      @close="closeTaskModal"
    />
  </div>
</template>

<style scoped>
/* アプリケーション全体のスタイリング */
#app {
  min-height: 100vh;
}

/* カードホバーエフェクト */
.card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* ボタンホバーエフェクト */
.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .container-fluid {
    padding-left: 15px;
    padding-right: 15px;
  }
}
</style>
