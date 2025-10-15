<script setup lang="ts">
// プロジェクト詳細ページ: 個別プロジェクトの詳細表示・編集機能
import { ref, computed, onMounted, watch } from "vue";
import { useScheduleStore } from "../store/schedule";
import { listUsers } from "../services/dbServices";
import { getProjectTasks, getProjectDetailStats } from "../services/dashboardService";
import type { Project } from "../types/project";
import type { Task } from "../types/task";
import type { Users } from "../types/db/users";
import type { ProjectDetailStats } from "../services/dashboardService";

// 共通コンポーネントのインポート
import PageHeader from "../components/common/PageHeader.vue";
import ActionBar from "../components/common/ActionBar.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityBadge from "../components/common/PriorityBadge.vue";
import LoadingSpinner from "../components/common/LoadingSpinner.vue";
import EmptyState from "../components/common/EmptyState.vue";
import CardHeader from "../components/common/CardHeader.vue";
import StatCards from "../components/common/StatCards.vue";
import ModalShell from "../components/common/ModalShell.vue";

// プロジェクト詳細ページの状態管理
const isLoading = ref(false);
const errorMessage = ref("");
const projectDetail = ref<Project | null>(null);
const projectTasks = ref<Task[]>([]);
const projectStats = ref<ProjectDetailStats | null>(null);
const users = ref<Users[]>([]);

// 編集モードの管理
const isEditMode = ref(false);
const editForm = ref<Partial<Project>>({});

// タスク管理モーダル
const showTaskModal = ref(false);
const selectedTask = ref<Task | null>(null);

// 共有ストアから選択中プロジェクトを取得
const store = useScheduleStore();

// プロジェクト詳細データをロード
const loadProjectDetail = async (projectId: number) => {
  try {
    isLoading.value = true;
    errorMessage.value = "";
    
    // プロジェクト情報を取得（仮実装 - 실제로는 projectService에서 가져와야 함）
    const { listProjects } = await import("../services/projectService");
    const projectsResult = await listProjects();
    
    if (projectsResult.success && projectsResult.data) {
      const project = projectsResult.data.find(p => p.id === projectId);
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
    
    // プロジェクトのタスク一覧を取得
    const tasksResult = await getProjectTasks(projectId);
    if (Array.isArray(tasksResult)) {
      projectTasks.value = tasksResult;
    }
    
    // プロジェクト統計情報を取得
    const statsResult = await getProjectDetailStats(projectId);
    if (statsResult.success && statsResult.data && statsResult.data.length > 0) {
      projectStats.value = statsResult.data[0]; // 最初の統計情報を使用
    }
    
  } catch (error) {
    console.error("プロジェクト詳細の読み込みに失敗:", error);
    errorMessage.value = "プロジェクト詳細の読み込みに失敗しました";
  } finally {
    isLoading.value = false;
  }
};

// ユーザーデータをロード
const loadUsers = async () => {
  try {
    const result = await listUsers() as any;
    if (result.success && result.data) {
      users.value = result.data;
    }
  } catch (error) {
    console.error("ユーザーデータの読み込みに失敗:", error);
  }
};

// オーナー名を取得
const getOwnerName = (ownerId: number | null | undefined): string => {
  if (!ownerId) return '未設定';
  const owner = users.value.find(user => user.id === ownerId);
  return owner ? owner.display_name : '未設定';
};

// 編集モードの切り替え
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (isEditMode.value && projectDetail.value) {
    editForm.value = { ...projectDetail.value };
  }
};

// プロジェクト情報を保存
const saveProject = async () => {
  if (!projectDetail.value) return;
  
  try {
    const { updateProject } = await import("../services/projectService");
    const result = await updateProject(projectDetail.value.id, editForm.value);
    
    if (result.success && result.data) {
      projectDetail.value = result.data;
      isEditMode.value = false;
      console.log("プロジェクトが保存されました");
    } else {
      errorMessage.value = result.error || "プロジェクトの保存に失敗しました";
    }
  } catch (error) {
    console.error("プロジェクトの保存に失敗:", error);
    errorMessage.value = "プロジェクトの保存に失敗しました";
  }
};

// 編集をキャンセル
const cancelEdit = () => {
  if (projectDetail.value) {
    editForm.value = { ...projectDetail.value };
  }
  isEditMode.value = false;
};

// タスク詳細を表示
const showTaskDetail = (task: Task) => {
  selectedTask.value = task;
  showTaskModal.value = true;
};

// タスクモーダルを閉じる
const closeTaskModal = () => {
  showTaskModal.value = false;
  selectedTask.value = null;
};

// プロジェクトを削除
const deleteProject = async () => {
  if (!projectDetail.value) return;
  
  if (confirm("このプロジェクトを削除してもよろしいですか？")) {
    try {
      const { deleteProject } = await import("../services/projectService");
      const result = await deleteProject(projectDetail.value.id);
      
      if (result.success) {
        alert("プロジェクトが削除されました");
        // プロジェクト管理ページに戻る
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

// ヘッダーアクションを生成
const getHeaderActions = () => {
  const actions = [];
  
  if (!isEditMode.value) {
    actions.push({
      label: '編集',
      icon: 'edit',
      variant: 'outline-primary',
      onClick: toggleEditMode
    });
    actions.push({
      label: '削除',
      icon: 'delete',
      variant: 'outline-danger',
      onClick: deleteProject
    });
  } else {
    actions.push({
      label: '保存',
      icon: 'save',
      variant: 'primary',
      onClick: saveProject
    });
    actions.push({
      label: 'キャンセル',
      icon: 'cancel',
      variant: 'outline-secondary',
      onClick: cancelEdit
    });
  }
  
  return actions;
};

// プロジェクトの進捗率を計算
const projectProgress = computed(() => {
  if (!projectTasks.value.length) return 0;
  const totalProgress = projectTasks.value.reduce((sum, task) => sum + (task.progress_percent || 0), 0);
  return Math.round(totalProgress / projectTasks.value.length);
});

// 完了タスク数を計算
const completedTasksCount = computed(() => {
  return projectTasks.value.filter(task => task.status === 'DONE').length;
});

// 進行中タスク数を計算
const inProgressTasksCount = computed(() => {
  return projectTasks.value.filter(task => task.status === 'IN_PROGRESS').length;
});

// 未開始タスク数を計算
const notStartedTasksCount = computed(() => {
  return projectTasks.value.filter(task => task.status === 'NOT_STARTED').length;
});

// URLパラメータからプロジェクトIDを取得してロード
const loadProjectFromUrl = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  
  if (projectId) {
    await loadProjectDetail(parseInt(projectId));
  } else {
    errorMessage.value = "プロジェクトIDが指定されていません";
  }
};

// コンポーネント初期化
onMounted(async () => {
  console.log("プロジェクト詳細ページが読み込まれました");
  await loadUsers();
  await loadProjectFromUrl();
});

// URL変更を監視（ブラウザの戻る/進むボタン対応）
watch(() => window.location.search, () => {
  loadProjectFromUrl();
}, { immediate: false });

// イベントリスナーでURL変更を監視
onMounted(() => {
  const handleUrlChange = () => {
    loadProjectFromUrl();
  };
  
  window.addEventListener('popstate', handleUrlChange);
  window.addEventListener('hashchange', handleUrlChange);
  
  // カスタムイベントも監視
  window.addEventListener('navigate-to-project-detail', handleUrlChange);
});
</script>

<template>
  <!-- プロジェクト詳細ページ -->
  <div class="project-detail-page">
    <!-- ローディング/エラー表示 -->
    <div v-if="isLoading" class="text-center py-4">
      <LoadingSpinner message="プロジェクト詳細を読み込み中..." />
    </div>
    <div v-if="!isLoading && errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
    </div>

    <!-- プロジェクト詳細が読み込まれている場合 -->
    <div v-if="!isLoading && projectDetail && !errorMessage">
      <!-- ページヘッダー -->
      <PageHeader
        :title="projectDetail.name"
        :description="projectDetail.description || 'プロジェクトの詳細情報を確認・編集できます'"
        :actions="getHeaderActions()"
      />

      <!-- プロジェクト統計サマリー -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <CardHeader title="プロジェクト統計" subtitle="プロジェクトの進捗と活動状況" />
            <div class="card-body">
              <StatCards
                :items="[
                  { 
                    label: '進捗率', 
                    value: `${projectProgress}%`, 
                    icon: 'trending_up', 
                    color: 'primary',
                    footer: '全体進捗'
                  },
                  { 
                    label: '総タスク数', 
                    value: projectTasks.length, 
                    icon: 'task', 
                    color: 'info',
                    footer: '全タスク'
                  },
                  { 
                    label: '完了タスク', 
                    value: completedTasksCount, 
                    icon: 'check_circle', 
                    color: 'success',
                    footer: '完了済み'
                  },
                  { 
                    label: '進行中タスク', 
                    value: inProgressTasksCount, 
                    icon: 'play_circle', 
                    color: 'warning',
                    footer: '作業中'
                  }
                ]"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- メインコンテンツ -->
        <div class="col-lg-8">
          <!-- 基本情報カード -->
          <div class="card mb-4">
            <CardHeader title="基本情報" subtitle="プロジェクトの基本情報を編集できます" />
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">プロジェクト名</label>
                  <input 
                    v-if="isEditMode"
                    type="text" 
                    class="form-control"
                    v-model="editForm.name"
                  >
                  <p v-else class="form-control-plaintext">{{ projectDetail.name }}</p>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">担当者</label>
                  <select 
                    v-if="isEditMode"
                    class="form-select"
                    v-model="editForm.owner_user_id"
                  >
                    <option value="">担当者を選択</option>
                    <option 
                      v-for="user in users" 
                      :key="user.id" 
                      :value="user.id"
                    >
                      {{ user.display_name }}
                    </option>
                  </select>
                  <p v-else class="form-control-plaintext">
                    {{ getOwnerName(projectDetail?.owner_user_id) }}
                  </p>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">開始日</label>
                  <input 
                    v-if="isEditMode"
                    type="date" 
                    class="form-control"
                    v-model="editForm.start_date"
                  >
                  <p v-else class="form-control-plaintext">{{ projectDetail.start_date || '未設定' }}</p>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">終了日</label>
                  <input 
                    v-if="isEditMode"
                    type="date" 
                    class="form-control"
                    v-model="editForm.end_date"
                  >
                  <p v-else class="form-control-plaintext">{{ projectDetail.end_date || '未設定' }}</p>
                </div>
                <div class="col-12 mb-3">
                  <label class="form-label">説明</label>
                  <textarea 
                    v-if="isEditMode"
                    class="form-control"
                    rows="3"
                    v-model="editForm.description"
                  ></textarea>
                  <p v-else class="form-control-plaintext">{{ projectDetail.description || '説明がありません' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- タスク一覧 -->
          <div class="card">
            <CardHeader title="タスク一覧" subtitle="このプロジェクトに関連するタスクを管理できます" />
            <div class="card-body">
              <div v-if="projectTasks.length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>タスク名</th>
                      <th>担当者</th>
                      <th>ステータス</th>
                      <th>優先度</th>
                      <th>進捗</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="task in projectTasks" :key="task.id">
                      <td>
                        <div class="d-flex align-items-center">
                          <i class="material-symbols-rounded me-2">task</i>
                          <span class="text-sm font-weight-bold">{{ task.task_name }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="text-sm">
                          {{ users.find(u => u.id === task.primary_assignee_id)?.display_name || '未設定' }}
                        </span>
                      </td>
                      <td>
                        <StatusBadge :status="task.status" />
                      </td>
                      <td>
                        <PriorityBadge :priority="task.priority" />
                      </td>
                      <td>
                        <div class="d-flex align-items-center">
                          <div class="progress me-2" style="width: 60px; height: 8px;">
                            <div 
                              class="progress-bar bg-gradient-primary" 
                              :style="{ width: (task.progress_percent || 0) + '%' }"
                            ></div>
                          </div>
                          <span class="text-xs">{{ task.progress_percent || 0 }}%</span>
                        </div>
                      </td>
                      <td>
                        <button 
                          class="btn btn-sm btn-outline-primary"
                          @click="showTaskDetail(task)"
                        >
                          詳細
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <EmptyState 
                v-else
                icon="task" 
                title="タスクがありません" 
                subtitle="このプロジェクトにタスクを追加してください"
              />
            </div>
          </div>
        </div>

        <!-- サイドバー -->
        <div class="col-lg-4">
          <!-- プロジェクト進捗 -->
          <div class="card mb-4">
            <CardHeader title="プロジェクト進捗" subtitle="全体の進捗状況を確認できます" />
            <div class="card-body">
              <div class="text-center mb-3">
                <h3 class="text-primary font-weight-bold">{{ projectProgress }}%</h3>
                <p class="text-sm text-muted">全体進捗率</p>
              </div>
              <div class="progress" style="height: 10px;">
                <div 
                  class="progress-bar bg-gradient-primary" 
                  :style="{ width: projectProgress + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- タスク統計 -->
          <div class="card mb-4">
            <CardHeader title="タスク統計" subtitle="タスクの状態別分布" />
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-sm">完了</span>
                <span class="badge bg-gradient-success">{{ completedTasksCount }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-sm">進行中</span>
                <span class="badge bg-gradient-warning">{{ inProgressTasksCount }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-sm">未開始</span>
                <span class="badge bg-gradient-secondary">{{ notStartedTasksCount }}</span>
              </div>
            </div>
          </div>

          <!-- プロジェクト情報 -->
          <div class="card">
            <CardHeader title="プロジェクト情報" subtitle="プロジェクトの基本情報" />
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-sm">作成日</span>
                <span class="text-sm">{{ projectDetail.created_at ? new Date(projectDetail.created_at).toLocaleDateString('ja-JP') : '不明' }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-sm">更新日</span>
                <span class="text-sm">{{ projectDetail.updated_at ? new Date(projectDetail.updated_at).toLocaleDateString('ja-JP') : '不明' }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-sm">アーカイブ</span>
                <span class="badge" :class="projectDetail.is_archived ? 'bg-gradient-warning' : 'bg-gradient-success'">
                  {{ projectDetail.is_archived ? 'アーカイブ済み' : 'アクティブ' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- タスク詳細モーダル -->
    <ModalShell 
      :show="showTaskModal" 
      title="タスク詳細" 
      size="lg" 
      @close="closeTaskModal"
    >
      <template #default>
        <div v-if="selectedTask">
          <div class="row mb-3">
            <div class="col-md-6">
              <h6>タスク名</h6>
              <p class="text-sm">{{ selectedTask.task_name }}</p>
            </div>
            <div class="col-md-6">
              <h6>担当者</h6>
              <p class="text-sm">
                {{ getOwnerName(selectedTask?.primary_assignee_id) }}
              </p>
            </div>
          </div>
          
          <div class="row mb-3">
            <div class="col-md-4">
              <h6>ステータス</h6>
              <StatusBadge :status="selectedTask.status" />
            </div>
            <div class="col-md-4">
              <h6>優先度</h6>
              <PriorityBadge :priority="selectedTask.priority" />
            </div>
            <div class="col-md-4">
              <h6>進捗率</h6>
              <p class="text-sm font-weight-bold">{{ selectedTask.progress_percent || 0 }}%</p>
            </div>
          </div>
          
          <div class="row mb-3">
            <div class="col-md-6">
              <h6>開始予定日</h6>
              <p class="text-sm">{{ selectedTask.planned_start || '未設定' }}</p>
            </div>
            <div class="col-md-6">
              <h6>終了予定日</h6>
              <p class="text-sm">{{ selectedTask.planned_end || '未設定' }}</p>
            </div>
          </div>
          
          <div v-if="selectedTask.description">
            <h6>説明</h6>
            <p class="text-sm">{{ selectedTask.description }}</p>
          </div>
        </div>
      </template>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="closeTaskModal">閉じる</button>
      </template>
    </ModalShell>
  </div>
</template>

<style scoped>
/* プロジェクト詳細ページのスタイリング */
.project-detail-page {
  padding: 1rem;
}

/* カードのスタイリング */
.card {
  transition: all 0.3s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* プログレスバーのスタイリング */
.progress {
  height: 8px;
  border-radius: 4px;
}

/* テーブルのスタイリング */
.table th {
  border-top: none;
  font-weight: 600;
  color: #344767;
}

.table td {
  vertical-align: middle;
}

/* バッジのスタイリング */
.badge {
  font-size: 0.75rem;
  padding: 0.5rem 0.75rem;
}

/* ボタンのスタイリング */
.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
}

/* フォームのスタイリング */
.form-control-plaintext {
  background-color: transparent;
  border: none;
  padding: 0.375rem 0;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .project-detail-page {
    padding: 0.5rem;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  .table-responsive {
    font-size: 0.875rem;
  }
}
</style>
