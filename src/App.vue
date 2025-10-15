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
// Supabase クライアント（ダッシュボード一覧をDBから取得するために使用）
import { fetchProjectProgress, type ProjectProgressRow } from "./services/dashboardService";

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
    // プロジェクトのタスク一覧을 가져와서 모달에 표시
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

// ダッシュボード表示用: DB の projects / tasks / users を用いて進捗一覧を構築
// 仕様: 進捗 = 同一プロジェクトの tasks.progress_percent の平均（小数点四捨五入）
//       担当者 = projects.owner_user_id に紐づく users.display_name（無ければ "-"）
//       期限 = projects.end_date（無ければ "-"）
const projectProgressList = ref<ProjectProgressRow[]>([]);
// ダッシュボード用ローディング/エラー
const isDashboardLoading = ref(false);
const dashboardErrorMessage = ref("");

// フィルタリング・検索機能
const searchQuery = ref("");
const statusFilter = ref("all"); // 'all' | 'in-progress' | 'completed' | 'overdue'
const ownerFilter = ref("all"); // 'all' | 特定のユーザーID
const dateRangeFilter = ref("all"); // 'all' | 'this-week' | 'this-month' | 'overdue'

// 日付計算をメモ化してパフォーマンスを向上
const today = computed(() => new Date());
const weekFromNow = computed(() => new Date(today.value.getTime() + 7 * 24 * 60 * 60 * 1000));
const monthFromNow = computed(() => new Date(today.value.getTime() + 30 * 24 * 60 * 60 * 1000));

// フィルタリングされたプロジェクト一覧（パフォーマンス最適化）
const filteredProjects = computed(() => {
  let filtered = projectProgressList.value;

  // 検索クエリでフィルタリング
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(project => 
      project.name.toLowerCase().includes(query) ||
      project.owner.toLowerCase().includes(query)
    );
  }

  // 状態でフィルタリング
  if (statusFilter.value !== "all") {
    filtered = filtered.filter(project => {
      switch (statusFilter.value) {
        case "in-progress":
          return project.status === "進行中";
        case "completed":
          return project.status === "完了";
        case "overdue":
          if (!project.dueDate || project.dueDate === "-") return false;
          const due = new Date(project.dueDate);
          return due < today.value && project.status !== "完了";
        default:
          return true;
      }
    });
  }

  // 担当者でフィルタリング
  if (ownerFilter.value !== "all") {
    filtered = filtered.filter(project => project.owner === ownerFilter.value);
  }

  // 日付範囲でフィルタリング（メモ化された日付を使用）
  if (dateRangeFilter.value !== "all") {
    filtered = filtered.filter(project => {
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

// 利用可能な担当者一覧（フィルタ用）
const availableOwners = computed(() => {
  const owners = new Set(projectProgressList.value.map(p => p.owner));
  return Array.from(owners).filter(owner => owner !== "-");
});

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

// フィルタ初期化
const clearFilters = () => {
  searchQuery.value = "";
  statusFilter.value = "all";
  ownerFilter.value = "all";
  dateRangeFilter.value = "all";
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

// ダッシュボード統計（フィルタリングされたプロジェクト進捗一覧から算出）
const inProgressCount = computed(() =>
  filteredProjects.value.filter((p) => p.status === "進行中").length
);
const completedCount = computed(() =>
  filteredProjects.value.filter((p) => p.status === "完了").length
);
const completionRate = computed(() => {
  const total = filteredProjects.value.length;
  if (total === 0) return 0;
  return Math.round((completedCount.value / total) * 100);
});
const overdueCount = computed(() => {
  const today = new Date();
  return filteredProjects.value.filter((p) => {
    if (!p.dueDate || p.dueDate === "-") return false;
    // 期限を Date に変換（ISO 文字列想定）
    const due = new Date(p.dueDate as string);
    if (isNaN(due.getTime())) return false;
    return due < today && p.status !== "完了";
  }).length;
});

// DB からダッシュボード用データを読み込む
const loadDashboardFromDb = async (): Promise<void> => {
  try {
    isDashboardLoading.value = true;
    dashboardErrorMessage.value = "";
    // 最新の更新履歴があるプロジェクト上位10件のみを取得
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

// クラス算出ロジックはユーティリティへ集約

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
                <div class="card">
                  <div class="card-header pb-0">
                    <h6>フィルタリング</h6>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-3 col-sm-6 mb-3">
                        <label class="form-label text-sm">状態</label>
                        <select class="form-control" v-model="statusFilter">
                          <option value="all">すべての状態</option>
                          <option value="in-progress">進行中</option>
                          <option value="completed">完了</option>
                          <option value="overdue">期限切れ</option>
                        </select>
                      </div>
                      <div class="col-md-3 col-sm-6 mb-3">
                        <label class="form-label text-sm">担当者</label>
                        <select class="form-control" v-model="ownerFilter">
                          <option value="all">すべての担当者</option>
                          <option v-for="owner in availableOwners" :key="owner" :value="owner">
                            {{ owner }}
                          </option>
                        </select>
                      </div>
                      <div class="col-md-3 col-sm-6 mb-3">
                        <label class="form-label text-sm">期限</label>
                        <select class="form-control" v-model="dateRangeFilter">
                          <option value="all">すべての期限</option>
                          <option value="this-week">今週</option>
                          <option value="this-month">今月</option>
                          <option value="overdue">期限切れ</option>
                        </select>
                      </div>
                      <div class="col-md-3 col-sm-6 mb-3 d-flex align-items-end">
                        <button 
                          class="btn btn-sm bg-gradient-secondary mb-0 w-100"
                          @click="clearFilters"
                        >
                          フィルタリセット
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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

            <!-- 統計カード -->
            <div class="row mb-4">
              <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                <div class="card">
                  <div class="card-header p-2 ps-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0 text-capitalize">進行中プロジェクト</p>
                        <h4 class="mb-0">{{ inProgressCount }}</h4>
                      </div>
                      <div class="icon icon-md icon-shape bg-gradient-primary shadow-dark shadow text-center border-radius-lg">
                        <i class="material-symbols-rounded opacity-10">work</i>
                      </div>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-2 ps-3">
                    <p class="mb-0 text-sm">
                      <span class="text-success font-weight-bolder">&nbsp;</span>
                    </p>
                  </div>
                </div>
              </div>

              <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                <div class="card">
                  <div class="card-header p-2 ps-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0 text-capitalize">完了プロジェクト</p>
                        <h4 class="mb-0">{{ completedCount }}</h4>
                      </div>
                      <div class="icon icon-md icon-shape bg-gradient-success shadow-dark shadow text-center border-radius-lg">
                        <i class="material-symbols-rounded opacity-10">task</i>
                      </div>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-2 ps-3">
                    <p class="mb-0 text-sm">
                      <span class="text-success font-weight-bolder">&nbsp;</span>
                    </p>
                  </div>
                </div>
              </div>

              <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                <div class="card">
                  <div class="card-header p-2 ps-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0 text-capitalize">完了率</p>
                        <h4 class="mb-0">{{ completionRate }}%</h4>
                      </div>
                      <div class="icon icon-md icon-shape bg-gradient-info shadow-dark shadow text-center border-radius-lg">
                        <i class="material-symbols-rounded opacity-10">trending_up</i>
                      </div>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-2 ps-3">
                    <p class="mb-0 text-sm">
                      <span class="text-success font-weight-bolder">&nbsp;</span>
                    </p>
                  </div>
                </div>
              </div>

              <div class="col-xl-3 col-sm-6">
                <div class="card">
                  <div class="card-header p-2 ps-3">
                    <div class="d-flex justify-content-between">
                      <div>
                        <p class="text-sm mb-0 text-capitalize">期限切れ</p>
                        <h4 class="mb-0">{{ overdueCount }}</h4>
                      </div>
                      <div class="icon icon-md icon-shape bg-gradient-warning shadow-dark shadow text-center border-radius-lg">
                        <i class="material-symbols-rounded opacity-10">warning</i>
                      </div>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-2 ps-3">
                    <p class="mb-0 text-sm">
                      <span class="text-danger font-weight-bolder">注意が必要</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>


          </div>

          <!-- プロジェクト別進捗の一覧表示 -->
          <div v-if="currentPage === 'dashboard'" class="row">
            <div class="col-12">
              <div class="card">
                <div class="card-header pb-0">
                  <div class="row">
                    <div class="col-lg-6 col-8">
                      <h6>最近更新されたプロジェクト</h6>
                      <p class="text-sm mb-0">
                        <i class="fa fa-chart-line text-info" aria-hidden="true"></i>
                        <span class="font-weight-bold ms-1">最近更新履歴</span>があるプロジェクトの進捗状況
                        <span class="badge bg-gradient-info ms-2">{{ filteredProjects.length }}件のプロジェクト</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div class="card-body px-0 pt-0 pb-2">
                  <div class="table-responsive p-0">
                    <table class="table align-items-center mb-0">
                      <thead>
                        <tr>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">プロジェクト名</th>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">担当者</th>
                          <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">進捗</th>
                          <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">状態</th>
                          <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">期限</th>
                          <th class="text-secondary opacity-7"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="project in filteredProjects" :key="project.id">
                          <td>
                            <div class="d-flex px-3 py-1">
                              <div class="d-flex flex-column justify-content-center">
                                <h6 class="mb-0 text-sm">{{ project.name }}</h6>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p class="text-xs font-weight-bold mb-0">{{ project.owner }}</p>
                          </td>
                          <td class="align-middle text-center">
                            <div class="d-flex flex-column align-items-center justify-content-center px-2">
                              <span class="text-xs font-weight-bold mb-1">{{ project.progress }}%</span>
                              <div class="progress w-100" style="max-width:160px;">
                                <div :class="getProgressBarClass(project.progress)" :style="{ width: project.progress + '%' }" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="project.progress"></div>
                              </div>
                            </div>
                          </td>
                          <td class="align-middle text-center">
                            <span :class="getStatusBadgeClass(project.status)">{{ project.status }}</span>
                          </td>
                          <td class="align-middle text-center">
                            <span class="text-secondary text-xs font-weight-normal">{{ project.dueDate }}</span>
                          </td>
                          <td class="align-middle">
                            <button 
                              class="btn btn-sm bg-gradient-primary mb-0" 
                              @click="handleViewProjectDetail(project)"
                            >
                              詳細を見る
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 最近の活動フィード -->
          <div v-if="currentPage === 'dashboard'" class="row mt-4">
            <div class="col-12">
              <div class="card">
                <div class="card-header pb-0">
                  <div class="row">
                    <div class="col-lg-6 col-8">
                      <h6>最近の活動</h6>
                      <p class="text-sm mb-0">
                        <i class="fa fa-history text-info" aria-hidden="true"></i>
                        <span class="font-weight-bold ms-1">プロジェクト</span>の最近の活動履歴
                      </p>
                    </div>
                  </div>
                </div>
                <div class="card-body px-0 pt-0 pb-2">
                  <!-- ローディング状態表示用コメント -->
                  <div v-if="isActivityLoading" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">読み込み中...</span>
                    </div>
                    <p class="text-sm text-secondary mt-2">活動データを読み込み中...</p>
                  </div>
                  
                  <!-- 活動フィード リスト -->
                  <div v-else class="list-group list-group-flush">
                    <div 
                      v-for="activity in recentActivities" 
                      :key="activity.id"
                      class="list-group-item border-0 d-flex align-items-center px-2 mb-2"
                    >
                      <div class="avatar avatar-sm me-3" :class="getActivityColor(activity.type)">
                        <i class="material-symbols-rounded text-white opacity-10">{{ getActivityIcon(activity.type) }}</i>
                      </div>
                      <div class="d-flex align-items-start flex-column justify-content-center">
                        <h6 class="mb-0 text-sm">{{ activity.description }}</h6>
                        <p class="mb-0 text-xs text-secondary">
                          <i class="fa fa-user me-1"></i>{{ activity.user }} • 
                          <i class="fa fa-clock me-1"></i>{{ getRelativeTime(activity.timestamp) }}
                        </p>
                      </div>
                    </div>
                    
                    <!-- 活動がない場合 -->
                    <div v-if="!isActivityLoading && recentActivities.length === 0" class="text-center py-4">
                      <i class="material-symbols-rounded text-secondary opacity-50" style="font-size: 48px;">history</i>
                      <p class="text-sm text-secondary mt-2">最近の活動がありません</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 動的コンポーネント表示 -->
          <component v-else :is="currentComponent" />
        </div>
      </div>
    </MainLayout>

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
            <!-- タスク一覧 -->
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>タスク名</th>
                    <th>状態</th>
                    <th>優先度</th>
                    <th>進捗率</th>
                    <th>計画終了日</th>
                    <th>担当者</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="task in selectedProjectTasks" :key="task.id">
                    <td>{{ task.task_name }}</td>
                    <td>
                      <span class="badge" :class="{
                        'bg-success': task.status === 'DONE',
                        'bg-warning': task.status === 'IN_PROGRESS',
                        'bg-danger': task.status === 'BLOCKED',
                        'bg-secondary': task.status === 'NOT_STARTED'
                      }">
                        {{ task.status === 'DONE' ? '完了' : 
                           task.status === 'IN_PROGRESS' ? '進行中' : 
                           task.status === 'BLOCKED' ? 'ブロック' : '未開始' }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" :class="{
                        'bg-danger': task.priority === 'URGENT',
                        'bg-warning': task.priority === 'HIGH',
                        'bg-info': task.priority === 'MEDIUM',
                        'bg-secondary': task.priority === 'LOW'
                      }">
                        {{ task.priority === 'URGENT' ? '緊急' : 
                           task.priority === 'HIGH' ? '高' : 
                           task.priority === 'MEDIUM' ? '中' : '低' }}
                      </span>
                    </td>
                    <td>{{ task.progress_percent }}%</td>
                    <td>{{ task.planned_end ? new Date(task.planned_end).toLocaleDateString('ja-JP') : '-' }}</td>
                    <td>{{ task.primary_assignee_id ? `ユーザー${task.primary_assignee_id}` : '-' }}</td>
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
