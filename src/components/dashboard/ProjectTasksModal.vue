<script setup lang="ts">
// プロジェクトのタスクを管理するモーダル（最近更新された10件を表示）
import { computed } from "vue";
import ModalShell from "@/components/common/ModalShell.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import PriorityBadge from "@/components/common/PriorityBadge.vue";
import type { TaskStatus, TaskPriority } from "@/types/task";
import { formatDate, formatDateTime } from "@/utils/dateUtils";

// タスク行の型定義
type TaskRow = {
  id: number;
  task_name: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress_percent: number;
  planned_end: string | null;
  primary_assignee_id: number | null;
  updated_at: string; // 更新日時
};

// Props定義
interface Props {
  visible: boolean; // モーダル表示状態
  projectName: string | null; // プロジェクト名
  tasks: TaskRow[]; // タスク一覧
}

const props = defineProps<Props>();

// Emits定義
const emit = defineEmits<{
  (e: 'close'): void; // モーダルを閉じる
  (e: 'view-detail', taskId: number): void; // タスク詳細表示イベント
}>();

// 最近更新されたタスクを10件まで表示（更新日時降順）
const recentTasks = computed(() => {
  return [...props.tasks]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10);
});

const onClose = () => emit('close');

// タスク詳細画面へ遷移
const onViewDetail = (taskId: number) => {
  emit('view-detail', taskId);
  emit('close'); // モーダルを閉じる
};
</script>

<template>
  <!-- プロジェクトタスク一覧モーダル -->
  <ModalShell
    :show="visible"
    :title="`${projectName} - 最近更新されたタスク（${recentTasks.length}件）`"
    size="xl"
    @close="onClose"
  >
    <template #default>
      <!-- タスク一覧テーブル（最近更新順） -->
      <div v-if="recentTasks.length > 0" class="table-responsive">
        <table class="table table-hover align-items-center mb-0">
          <thead>
            <tr>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">タスク名</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">状態</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">優先度</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">進捗率</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">更新日時</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">計画終了日</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">担当者</th>
              <th class="text-center text-secondary opacity-7">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in recentTasks" :key="task.id">
              <!-- タスク名 -->
              <td>
                <div class="d-flex px-2 py-1">
                  <i class="material-symbols-rounded text-primary me-2">task</i>
                  <div class="d-flex flex-column justify-content-center">
                    <h6 class="mb-0 text-sm">{{ task.task_name }}</h6>
                    <p class="text-xs text-secondary mb-0">ID: {{ task.id }}</p>
                  </div>
                </div>
              </td>
              
              <!-- 状態 -->
              <td class="align-middle text-center">
                <StatusBadge :status="task.status" />
              </td>
              
              <!-- 優先度 -->
              <td class="align-middle text-center">
                <PriorityBadge :priority="task.priority" />
              </td>
              
              <!-- 進捗率 -->
              <td class="align-middle text-center">
                <div class="d-flex flex-column align-items-center">
                  <span class="text-xs font-weight-bold mb-1">{{ task.progress_percent }}%</span>
                  <div class="progress" style="width: 60px; height: 4px;">
                    <div 
                      class="progress-bar bg-gradient-primary" 
                      :style="{ width: `${task.progress_percent}%` }"
                    ></div>
                  </div>
                </div>
              </td>
              
              <!-- 更新日時 -->
              <td class="align-middle text-center">
                <small class="text-muted">
                  {{ formatDateTime(task.updated_at) }}
                </small>
              </td>
              
              <!-- 計画終了日 -->
              <td class="align-middle text-center">
                <span class="text-xs font-weight-bold">
                  {{ task.planned_end ? formatDate(task.planned_end) : '-' }}
                </span>
              </td>
              
              <!-- 担当者 -->
              <td class="align-middle text-center">
                <span class="text-xs font-weight-bold">
                  {{ task.primary_assignee_id ? `ユーザー${task.primary_assignee_id}` : '-' }}
                </span>
              </td>
              
              <!-- 操作 -->
              <td class="align-middle text-center">
                <button 
                  type="button" 
                  class="btn btn-sm bg-gradient-primary mb-0"
                  @click="onViewDetail(task.id)"
                  title="タスク詳細を表示"
                >
                  <i class="material-symbols-rounded" style="font-size: 16px; vertical-align: middle;">visibility</i>
                  詳細
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- データが無い場合 -->
      <div v-else class="text-center py-5">
        <i class="material-symbols-rounded text-secondary mb-3" style="font-size: 4rem;">task_alt</i>
        <h5 class="text-secondary">タスクがありません</h5>
        <p class="text-sm text-secondary">このプロジェクトにはまだタスクが登録されていません</p>
      </div>
    </template>
    
    <template #footer>
      <button type="button" class="btn btn-secondary" @click="onClose">
        <i class="material-symbols-rounded me-1" style="font-size: 16px; vertical-align: middle;">close</i>
        閉じる
      </button>
    </template>
  </ModalShell>
  <!-- /プロジェクトタスク一覧モーダル -->
</template>

<style scoped>
/* テーブルスタイリング */
.table {
  color: #67748e;
}

.table thead th {
  padding: 0.75rem 1.5rem;
  font-size: 0.65rem;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e9ecef;
}

.table tbody td {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #f0f2f5;
  vertical-align: middle;
}

.table-hover tbody tr:hover {
  background-color: #f8f9fa;
  cursor: pointer;
}

/* プログレスバー */
.progress {
  background-color: #e9ecef;
  border-radius: 0.5rem;
  overflow: hidden;
}

.progress-bar {
  transition: width 0.6s ease;
}

/* ボタンホバーエフェクト */
.btn {
  transition: all 0.15s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* アイコンスタイル */
.material-symbols-rounded {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .table thead th,
  .table tbody td {
    padding: 0.5rem;
    font-size: 0.75rem;
  }
  
  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
}
</style>


