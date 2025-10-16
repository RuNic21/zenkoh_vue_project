<script setup lang="ts">
// プロジェクト詳細ページ: 個別プロジェクトの詳細表示・編集機能
import { ref } from "vue";
import { useScheduleStore } from "../store/schedule";
import { useProjectDetail } from "@/composables/useProjectDetail";

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
import ProjectSummary from "@/components/project/ProjectSummary.vue";

// プロジェクト詳細の状態・ロジックは composable から取得
const {
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
  getOwnerName,
  toggleEditMode,
  saveProject,
  cancelEdit,
  deleteProject,
  showTaskDetail,
  closeTaskModal,
  projectProgress,
  completedTasksCount,
  inProgressTasksCount,
  notStartedTasksCount,
} = useProjectDetail();

// 共有ストアから選択中プロジェクトを取得
const store = useScheduleStore();

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

// 初期化ログのみ維持
console.log("プロジェクト詳細ページが読み込まれました");
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

      <!-- プロジェクト統計サマリー（コンポーネント化） -->
      <div class="row mb-4">
        <div class="col-12">
          <ProjectSummary 
            :project-name="projectDetail.name"
            :description="projectDetail.description || 'プロジェクトの詳細情報を確認・編集できます'"
            :progress-percent="projectProgress"
            :total-tasks="projectTasks.length"
            :completed-tasks="completedTasksCount"
            :in-progress-tasks="inProgressTasksCount"
          />
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
