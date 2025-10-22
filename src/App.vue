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
import TaskProgressTable from "./components/dashboard/TaskProgressTable.vue";
import RecentActivities from "./components/dashboard/RecentActivities.vue";
import ProjectTasksModal from "./components/dashboard/ProjectTasksModal.vue";
// 共通コンポーネント
import NavigationBar from "./components/common/NavigationBar.vue";
// ダッシュボード用 composable と型
import { useDashboard } from "./composables/useDashboard";
import type { ProjectProgressRow } from "./services/dashboardService";
import type { ScheduleItem } from "./types/schedule";

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

// プロジェクト詳細ページへ遷移
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

// タスク詳細表示（モーダル or ページ遷移）
const handleViewTaskDetail = (task: any) => {
  try {
    // スケジュール詳細ページへ遷移してタスク情報を表示
    console.log("タスク詳細を表示:", task);
    
    // TaskProgressRow を ScheduleItem に変換
    const scheduleItem: ScheduleItem = {
      id: task.id,
      title: task.name || "",
      description: task.description || "",
      startDate: task.planned_start || "",
      endDate: task.planned_end || "",
      status: task.status || "NOT_STARTED",
      priority: task.priority || "MEDIUM",
      assignee: task.assigneeName || "",
      progress: task.progress_percent || 0,
      category: task.projectName || "",
      tags: [],
      notes: "",
      attachments: [],
      comments: [],
    };
    
    // store に既存のスケジュールがあれば更新、なければ追加
    const existingIndex = store.schedules.value.findIndex(s => s.id === task.id);
    if (existingIndex >= 0) {
      store.schedules.value[existingIndex] = scheduleItem;
    } else {
      store.schedules.value.push(scheduleItem);
    }
    
    // store に選択タスクIDをセットしてスケジュール詳細ページへ
    store.selectSchedule(task.id);
    currentPage.value = "schedule-detail";
  } catch (error) {
    console.error("タスク詳細表示に失敗:", error);
    alert("タスク詳細の表示に失敗しました。");
  }
};

// タスクモーダルを閉じる
const closeTaskModal = () => {
  showTaskModal.value = false;
  selectedProjectForTasks.value = null;
  selectedProjectTasks.value = [];
};

// タスクIDからタスク詳細ページへ遷移（モーダルから呼ばれる）
const handleViewTaskDetailFromModal = (taskId: number) => {
  try {
    console.log("タスク詳細ページへ遷移:", taskId);
    
    // store に選択タスクIDをセットしてスケジュール詳細ページへ
    store.selectSchedule(taskId);
    currentPage.value = "schedule-detail";
  } catch (error) {
    console.error("タスク詳細表示に失敗:", error);
    alert("タスク詳細の表示に失敗しました。");
  }
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
  projectProgressList,             // プロジェクト進捗一覧（全件・フィルタ前）※各プロジェクトごとの集計値含む
  taskProgressList,                // タスク進捗一覧（最近更新分）
  isDashboardLoading,              // ダッシュボード統計/リストのロード中フラグ
  isTaskLoading,                   // タスク読み込み中フラグ
  dashboardErrorMessage,           // ダッシュボード用エラーメッセージ文字列
  taskErrorMessage,                // タスク用エラーメッセージ文字列
  searchQuery,                     // キーワード検索用のクエリ文字列
  priorityFilter,                  // 優先度フィルタ：'all', 'urgent', 'high-up'
  deadlineFilter,                  // 期限フィルタ：'all', 'within-3days', 'within-7days', 'overdue'
  projectFilter,                   // プロジェクトフィルタ：'all' or プロジェクト名
  clearFilters,                    // フィルタリセット用メソッド（全フィルタ初期化）
  filteredProjects,                // 各種フィルタ後のプロジェクトリスト
  filteredTasks,                   // 各種フィルタ後のタスクリスト
  availableProjects,               // 選択可能なプロジェクトリスト
  inProgressCount,                 // 進行中プロジェクト数
  completedCount,                  // 完了プロジェクト数
  completionRate,                  // 全体の完了率（%）
  overdueCount,                    // 期限超過プロジェクト数
  loadDashboardFromDb,             // ダッシュボード情報（統計/リスト）再読込メソッド
  loadRecentTasks,                 // 最近のタスク進捗読み込みメソッド
} = useDashboard();

// クイックアクションパネル
const quickActions = [
  {
    label: "新しいプロジェクト作成",
    icon: "add",
    color: "bg-gradient-primary",
    action: () => handleCreateProject()
  },
  // TODO: タスク追加，チームメンバー招待機能はスケジュール管理リストで実装予定
  // {
  //   label: "タスク追加",
  //   icon: "task_alt", 
  //   color: "bg-gradient-success",
  //   action: () => handleAddTask()
  // },
  // {
  //   label: "チームメンバー招待",
  //   icon: "person_add",
  //   color: "bg-gradient-info", 
  //   action: () => handleInviteTeamMember()
  // },
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

// TODO: タスク追加，チームメンバー招待機能はスケジュール管理リストで実装予定
// const handleAddTask = async () => {
//   try {
//     const taskName = prompt("新しいタスク名を入力してください:");
//     if (!taskName || taskName.trim() === "") {
//       return;
//     }

//     // プロジェクト選択（最初のプロジェクトを使用）
//     const firstProject = projectProgressList.value[0];
//     if (!firstProject) {
//       alert("まずプロジェクトを作成してください。");
//       return;
//     }

//     // 実際の DB にタスクを作成
//     const { createTask } = await import("./services/taskService");
//     const result = await createTask({
//       project_id: firstProject.id,
//       task_name: taskName.trim(),
//       description: "",
//       status: "NOT_STARTED",
//       priority: "MEDIUM",
//       progress_percent: 0,
//       primary_assignee_id: null,
//       is_archived: false
//     });

//     if (result.success && result.data) {
//       // 活動ログ生成
//       const { logTaskCreated } = await import("./services/activityService");
//       await logTaskCreated(firstProject.id, result.data.id, firstProject.name, taskName);
      
//       alert(`タスク "${taskName}"が正常に作成されました！`);
//       // ダッシュボードデータの更新
//       await loadDashboardFromDb();
//       // 活動フィードの更新
//       await loadActivityFeed();
//     } else {
//       alert(result.error || "タスクの作成に失敗しました。再試行してください。");
//     }
//   } catch (error) {
//     console.error("タスク作成中のエラー:", error);
//     alert("タスク作成中にエラーが発生しました。");
//   }
// };

// TODO: チームメンバー招待機能はスケジュール管理リストで実装予定
// const handleInviteTeamMember = () => {
//   console.log("チームメンバー招待");
//   // TODO: チームメンバー招待 モーダル または ページへ移動
//   alert("チームメンバー招待機能を実装中です。");
// };

// ダッシュボードデータを再読み込み
const handleRefreshDashboard = async () => {
  try {
    console.log("ダッシュボードデータを更新中...");
    
    // プロジェクト進捗、タスク進捗、活動履歴を並行して読み込み
    await Promise.all([
      loadDashboardFromDb(),
      loadRecentTasks(),
      (async () => {
        isActivityLoading.value = true;
        recentActivities.value = await loadRecentActivities();
        isActivityLoading.value = false;
      })()
    ]);
    
    console.log("ダッシュボードデータの更新が完了しました");
  } catch (error) {
    console.error("ダッシュボードデータの更新に失敗:", error);
    alert("データの更新に失敗しました。もう一度お試しください。");
  }
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
    const result = await fetchRecentActivities(5);
    
    // DBから取得したデータのみを返す（Mockデータは削除）
    return result.success && result.data ? result.data : [];
  } catch (error) {
    console.error("活動データの読み込みに失敗:", error);
    return [];
  }
};

// 最近の活動フィード
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
  // 最近のタスク進捗を読み込み
  await loadRecentTasks();
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
        <NavigationBar 
          :current-page="currentPage"
          v-model:search-query="searchQuery"
        />

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
                  :priority-filter="priorityFilter"
                  :deadline-filter="deadlineFilter"
                  :project-filter="projectFilter"
                  :available-projects="availableProjects"
                  @update:searchQuery="(v:string)=>searchQuery=v"
                  @update:priorityFilter="(v:string)=>priorityFilter=v"
                  @update:deadlineFilter="(v:string)=>deadlineFilter=v"
                  @update:projectFilter="(v:string)=>projectFilter=v"
                  @clear="clearFilters"
                  @refresh="handleRefreshDashboard"
                />
              </div>

              <!-- 保留：クイックアクションパネル  -->
              <!-- クイックアクションパネル -->
              <!-- <div class="col-lg-4 col-md-12">
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
              </div> -->
            </div>

            <!-- TODO: 統計カードはプロジェクト分析追加未定 -->
            <!-- <DashboardStats 
              :in-progress-count="inProgressCount"
              :completed-count="completedCount"
              :completion-rate="completionRate"
              :overdue-count="overdueCount"
            /> -->

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

          <!-- タスク別進捗の一覧表示 -->
          <div v-if="currentPage === 'dashboard'" class="row mt-4">
            <div class="col-12">
              <TaskProgressTable 
                :rows="filteredTasks"
                @viewDetail="handleViewTaskDetail"
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
      @view-detail="handleViewTaskDetailFromModal"
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
