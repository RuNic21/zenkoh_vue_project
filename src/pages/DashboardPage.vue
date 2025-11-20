<script setup lang="ts">
// ダッシュボードページ: プロジェクト進捗一覧、統計情報、フィルタリング
// Keep-Alive 캐싱을 위한 컴포넌트 이름 설정
defineOptions({
  name: 'DashboardPage'
});

import { ref, onMounted, onActivated } from "vue";
import { useRouter } from "vue-router";
import { useScheduleStore } from "@/store/schedule";
import DashboardFilters from "@/components/dashboard/DashboardFilters.vue";
import ProjectProgressTable from "@/components/dashboard/ProjectProgressTable.vue";
import TaskProgressTable from "@/components/dashboard/TaskProgressTable.vue";
import RecentActivities from "@/components/dashboard/RecentActivities.vue";
import RecentNotifications from "@/components/dashboard/RecentNotifications.vue";
import ProjectTasksModal from "@/components/dashboard/ProjectTasksModal.vue";
import { useDashboard } from "@/composables/useDashboard";
import { useMessage } from "@/composables/useMessage";
import type { ProjectProgressRow } from "@/services/dashboardService";
import type { ScheduleItem } from "@/types/schedule";

const router = useRouter();
const store = useScheduleStore();

// ダッシュボード用状態とロジックは composable へ集約
const {
  projectProgressList,
  taskProgressList,
  isDashboardLoading,
  isTaskLoading,
  dashboardErrorMessage,
  taskErrorMessage,
  searchQuery,
  priorityFilter,
  deadlineFilter,
  projectFilter,
  clearFilters,
  filteredProjects,
  filteredTasks,
  availableProjects,
  inProgressCount,
  completedCount,
  completionRate,
  overdueCount,
  loadDashboardFromDb,
  loadRecentTasks,
} = useDashboard();

// メッセージシステム
const { showSuccess, showError } = useMessage();

// タスクモーダル状態
const selectedProjectTasks = ref<any[]>([]);
const showTaskModal = ref(false);
const selectedProjectForTasks = ref<any>(null);

// プロジェクトのタスク一覧モーダルを開く（詳細ページ遷移ではなくモーダル表示）
const handleOpenProjectTasksModal = async (project: ProjectProgressRow) => {
  try {
    const { getProjectTasks } = await import("@/services/dashboardService");
    selectedProjectForTasks.value = project;
    selectedProjectTasks.value = await getProjectTasks(project.id);
    showTaskModal.value = true;
  } catch (error) {
    console.error("プロジェクトタスクの読み込みに失敗:", error);
    showError("タスクの読み込みに失敗しました。");
  }
};

// タスク詳細表示
const handleViewTaskDetail = (task: any) => {
  try {
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
    
    // タスク詳細ページへ遷移
    router.push({ name: "schedule-detail", params: { id: task.id } });
  } catch (error) {
    console.error("タスク詳細表示に失敗:", error);
    showError("タスク詳細の表示に失敗しました。");
  }
};

// タスクモーダルを閉じる
const closeTaskModal = () => {
  showTaskModal.value = false;
  selectedProjectForTasks.value = null;
  selectedProjectTasks.value = [];
};

// タスクIDからタスク詳細ページへ遷移
const handleViewTaskDetailFromModal = (taskId: number) => {
  try {
    router.push({ name: "schedule-detail", params: { id: taskId } });
  } catch (error) {
    console.error("タスク詳細表示に失敗:", error);
    showError("タスク詳細の表示に失敗しました。");
  }
};

// クイックアクションパネル
const quickActions = [
  {
    label: "新しいプロジェクト作成",
    icon: "add",
    color: "bg-gradient-primary",
    action: () => handleCreateProject()
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

    const { createProject } = await import("@/services/projectService");
    const result = await createProject({
      name: projectName.trim(),
      description: "",
      owner_user_id: null,
      start_date: new Date().toISOString().split('T')[0],
      end_date: null,
      is_archived: false
    });

    if (result.success && result.data) {
      const { logProjectCreated } = await import("@/services/activityService");
      await logProjectCreated(result.data.id, projectName, "システム");
      
      showSuccess(`プロジェクト "${projectName}"が正常に作成されました！`);
      await loadDashboardFromDb();
      await loadActivityFeed();
    } else {
      showError(result.error || "プロジェクトの作成に失敗しました。再試行してください。");
    }
  } catch (error) {
    console.error("プロジェクト作成中のエラー:", error);
    showError("プロジェクト作成中にエラーが発生しました。");
  }
};

// ダッシュボードデータを再読み込み
const handleRefreshDashboard = async () => {
  try {
    console.log("ダッシュボードデータを更新中...");
    
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
    showError("データの更新に失敗しました。もう一度お試しください。");
  }
};

const handleGenerateReport = () => {
  router.push({ name: "report" });
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

const isActivityLoading = ref(false);

// 実際のDBから活動データを取得
const loadRecentActivities = async (): Promise<ActivityLog[]> => {
  try {
    const { fetchRecentActivities } = await import('@/services/activityService');
    const result = await fetchRecentActivities(5);
    
    return result.success && result.data ? result.data : [];
  } catch (error) {
    console.error("活動データの読み込みに失敗:", error);
    return [];
  }
};

const recentActivities = ref<ActivityLog[]>([]);

// 活動フィード読み込み関数
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

// アプリケーション初期化
onMounted(async () => {
  console.log("ダッシュボードページが起動しました");
  await loadDashboardFromDb();
  await loadRecentTasks();
  await loadActivityFeed();
});

// Keep-Alive: ページが再度アクティブになったときにデータを更新
// ただし、タブの visibilitychange イベントと重複しないように、少し遅延させる
let activationTimeout: number | null = null;
onActivated(async () => {
  console.log("Dashboard ページが再アクティブ化されました");
  
  // 既存のタイムアウトをクリア
  if (activationTimeout !== null) {
    clearTimeout(activationTimeout);
    activationTimeout = null;
  }
  
  // タブが表示されている場合のみデータを更新
  if (document.hidden) {
    console.log("タブが非表示のため、データの読み込みをスキップします");
    return;
  }
  
  // タブの visibilitychange イベントとの重複を避けるため、少し遅延
  // ブラウザのネットワーク接続が安定するまで待機
  activationTimeout = window.setTimeout(async () => {
    try {
      // 詳細ページから戻ってきたときに最新のデータを表示
      // ただし、タブが表示されている場合のみ
      if (!document.hidden) {
        console.log("Dashboard データを再読み込みします...");
        
        // 各データ読み込みを順次実行（エラーが発生しても続行）
        // ネットワーク接続が不安定な場合を考慮
        try {
          await loadDashboardFromDb();
        } catch (error) {
          console.error("ダッシュボードデータの読み込みエラー:", error);
        }
        
        try {
          await loadRecentTasks();
        } catch (error) {
          console.error("タスクデータの読み込みエラー:", error);
        }
        
        try {
          await loadActivityFeed();
        } catch (error) {
          console.error("活動フィードの読み込みエラー:", error);
        }
        
        console.log("Dashboard データの再読み込みが完了しました");
      }
    } catch (error) {
      console.error("Dashboard データの再読み込み中にエラーが発生:", error);
    } finally {
      activationTimeout = null;
    }
  }, 800); // 800ms待機してネットワーク接続の安定化を待つ
});
</script>

<template>
  <div>
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
      <div class="col-12">
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
    </div>

    <!-- プロジェクト別進捗の一覧表示 -->
    <div class="row mb-4">
      <div class="col-12">
        <ProjectProgressTable 
          :rows="filteredProjects"
          @viewDetail="handleOpenProjectTasksModal"
        />
      </div>
    </div>

    <!-- タスク別進捗の一覧表示 -->
    <div class="row mb-4">
      <div class="col-12">
        <!-- タスク読み込み/エラー表示 -->
        <div v-if="isTaskLoading" class="alert alert-secondary" role="alert">
          タスクを読み込み中です...
        </div>
        <div v-if="!isTaskLoading && taskErrorMessage" class="alert alert-danger" role="alert">
          {{ taskErrorMessage }}
        </div>

        <TaskProgressTable 
          :rows="filteredTasks"
          @viewDetail="handleViewTaskDetail"
        />
      </div>
    </div>

    <!-- 最近の通知 -->
    <div class="row mb-4">
      <div class="col-12">
        <RecentNotifications />
      </div>
    </div>

    <!-- 最近の活動 -->
    <div class="row mb-4">
      <div class="col-12">
        <RecentActivities :activities="recentActivities" :isLoading="isActivityLoading" />
      </div>
    </div>

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
/* ダッシュボードページ固有のスタイル */
</style>

