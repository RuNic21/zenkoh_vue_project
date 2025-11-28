<script setup lang="ts">
// ダッシュボードページ: プロジェクト進捗一覧、統計情報、フィルタリング
// Keep-Alive 캐싱을 위한 컴포넌트 이름 설정
defineOptions({
  name: 'DashboardPage'
});

import { ref, computed, onMounted, onActivated } from "vue";
import { useScheduleStore } from "@/store/schedule";
import router from "@/router";
import DashboardFilters from "@/components/dashboard/DashboardFilters.vue";
import ProjectProgressTable from "@/components/dashboard/ProjectProgressTable.vue";
import TaskProgressTable from "@/components/dashboard/TaskProgressTable.vue";
import RecentActivities from "@/components/dashboard/RecentActivities.vue";
import RecentNotifications from "@/components/dashboard/RecentNotifications.vue";
import ProjectTasksModal from "@/components/dashboard/ProjectTasksModal.vue";
import { useDashboard } from "@/composables/useDashboard";
import { useMessage } from "@/composables/useMessage";
import { usePageActivation } from "@/composables/usePageActivation";
import type { ProjectProgressRow, TaskProgressRow } from "@/services/dashboardService";
import type { ScheduleItem, ScheduleStatus, SchedulePriority } from "@/types/schedule";
import type { Task } from "@/types/task";
import StatCards from "@/components/common/StatCards.vue";

const store = useScheduleStore();

// ダッシュボード用状態とロジックは composable へ集約
const {
  isDashboardLoading,
  isTaskLoading,
  dashboardErrorMessage,
  taskErrorMessage,
  searchQuery,
  priorityFilter,
  deadlineFilter,
  projectFilter,
  tagFilter,
  clearFilters,
  filteredProjects,
  filteredTasks,
  availableProjects,
  availableTags,
  inProgressCount,
  completedCount,
  completionRate,
  overdueCount,
  loadDashboardFromDb,
  loadRecentTasks,
} = useDashboard();

// メッセージシステム
const { showError } = useMessage();

// タスクモーダル状態（型を明示的に指定）
// ProjectTasksModalが期待するTaskRow型に合わせる
type TaskRow = {
  id: number;
  task_name: string;
  status: Task["status"];
  priority: Task["priority"];
  progress_percent: number;
  planned_end: string | null;
  primary_assignee_id: number | null;
  updated_at: string;
};

const selectedProjectTasks = ref<TaskRow[]>([]);
const showTaskModal = ref(false);
const selectedProjectForTasks = ref<ProjectProgressRow | null>(null);

// プロジェクトのタスク一覧モーダルを開く（詳細ページ遷移ではなくモーダル表示）
const handleOpenProjectTasksModal = async (project: ProjectProgressRow) => {
  try {
    const { getProjectTasks } = await import("@/services/dashboardService");
    selectedProjectForTasks.value = project;
    const tasks = await getProjectTasks(project.id);
    
    // Task型をTaskRow型に変換（ProjectTasksModalの型定義に合わせる）
    selectedProjectTasks.value = tasks.map(task => ({
      id: task.id,
      task_name: task.task_name,
      status: task.status,
      priority: task.priority,
      progress_percent: task.progress_percent,
      planned_end: task.planned_end ?? null, // nullに変換（必須フィールド）
      primary_assignee_id: task.primary_assignee_id ?? null,
      updated_at: task.updated_at
    }));
    
    showTaskModal.value = true;
  } catch (error) {
    console.error("プロジェクトタスクの読み込みに失敗:", error);
    showError("タスクの読み込みに失敗しました。");
  }
};

// タスク詳細表示
const handleViewTaskDetail = (task: TaskProgressRow) => {
  try {
    // TaskProgressRow を ScheduleItem に変換
    const scheduleItem: ScheduleItem = {
      id: task.id,
      title: task.name || "",
      description: task.description || "",
      startDate: task.planned_start || "",
      endDate: task.planned_end || "",
      status: (task.status as ScheduleStatus) || "NOT_STARTED",
      priority: (task.priority as SchedulePriority) || "MEDIUM",
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

// 統計情報カード用データ（computedで生成）
const dashboardStats = computed(() => [
  {
    label: "進行中プロジェクト",
    value: inProgressCount.value,
    icon: "play_circle",
    color: "info" as const,
    footer: `全${filteredProjects.value.length}プロジェクト中`
  },
  {
    label: "完了プロジェクト",
    value: completedCount.value,
    icon: "check_circle",
    color: "success" as const,
    footer: `${completionRate.value}%完了`
  },
  {
    label: "完了率",
    value: `${completionRate.value}%`,
    icon: "trending_up",
    color: "primary" as const,
    footer: `${completedCount.value}/${filteredProjects.value.length}プロジェクト`
  },
  {
    label: "期限切れ",
    value: overdueCount.value,
    icon: "warning",
    color: overdueCount.value > 0 ? ("danger" as const) : ("secondary" as const),
    footer: overdueCount.value > 0 ? "要対応" : "問題なし"
  }
]);

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
  await loadDashboardFromDb();
  await loadRecentTasks();
  await loadActivityFeed();
});

// Keep-Alive: ページが再度アクティブになったときにデータを更新
usePageActivation(async () => {
  // 詳細ページから戻ってきたときに最新のデータを表示
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
}, {
  checkVisibility: true,
  delay: 800
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

    <!-- 統計情報カード 今後使うかもしれないので残す
    <div class="row mb-4">
      <div class="col-12">
        <StatCards :items="dashboardStats" />
      </div>
    </div> -->

    <!-- フィルタリングパネル 
    <div class="row mb-4">
      <div class="col-12">
        <DashboardFilters 
          :search-query="searchQuery"
          :priority-filter="priorityFilter"
          :deadline-filter="deadlineFilter"
          :project-filter="projectFilter"
          :available-projects="availableProjects"
          :tag-filter="tagFilter"
          :available-tags="availableTags"
          @update:searchQuery="(v:string)=>searchQuery=v"
          @update:priorityFilter="(v:string)=>priorityFilter=v"
          @update:deadlineFilter="(v:string)=>deadlineFilter=v"
          @update:projectFilter="(v:string)=>projectFilter=v"
          @update:tagFilter="(v:string[])=>tagFilter=v"
          @clear="clearFilters"
          @refresh="handleRefreshDashboard"
        />
      </div>
    </div> -->

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

