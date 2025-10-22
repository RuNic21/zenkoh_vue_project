<script setup lang="ts">
// 最近のタスク進捗一覧テーブル
// 目的: 最近更新されたタスクの進捗状況を一覧表示
import { 
  getTaskStatusBadgeClass, 
  getTaskPriorityBadgeClass 
} from "@/services/dashboardService";
import { getProgressBarClass } from "@/utils/uiHelpers";
import type { TaskProgressRow } from "@/services/dashboardService";

const props = defineProps<{
  rows: TaskProgressRow[];
}>();

const emit = defineEmits<{
  (e: "viewDetail", row: TaskProgressRow): void;
}>();

// タスク詳細を見る
const onView = (row: TaskProgressRow) => emit("viewDetail", row);

// 残り日数の表示フォーマット
const formatDaysUntilDue = (task: TaskProgressRow): string => {
  if (!task.planned_end) return "-";
  if (task.isOverdue) {
    const days = Math.abs(task.daysUntilDue || 0);
    return `期限切れ (${days}日前)`;
  }
  if (task.daysUntilDue === 0) return "今日が期限";
  if (task.daysUntilDue === 1) return "明日が期限";
  if (task.daysUntilDue && task.daysUntilDue > 0) return `残り${task.daysUntilDue}日`;
  return "-";
};

// 期限の緊急度に応じたクラス
const getDueDateClass = (task: TaskProgressRow): string => {
  if (task.isOverdue) return "text-danger font-weight-bold";
  if (task.daysUntilDue !== null && task.daysUntilDue <= 3) return "text-warning font-weight-bold";
  return "text-secondary";
};
</script>

<template>
  <div class="card">
    <div class="card-header pb-0">
      <div class="row">
        <div class="col-lg-6 col-8">
          <h6>最近更新されたタスク</h6>
          <p class="text-sm mb-0">
            <i class="fa fa-tasks text-success" aria-hidden="true"></i>
            <span class="font-weight-bold ms-1">最近更新履歴</span>があるタスクの進捗状況
            <span class="badge bg-gradient-success ms-2">{{ props.rows.length }}件表示中</span>
          </p>
        </div>
      </div>
    </div>
    <div class="card-body px-0 pt-0 pb-2">
      <div class="table-responsive p-0">
        <table class="table align-items-center mb-0">
          <thead>
            <tr>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">タスク名</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">プロジェクト</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">担当者</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">進捗</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">状態</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">優先度</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">期限</th>
              <th class="text-secondary opacity-7"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in props.rows" :key="task.id">
              <!-- タスク名 -->
              <td>
                <div class="d-flex px-3 py-1">
                  <div class="d-flex flex-column justify-content-center">
                    <h6 class="mb-0 text-sm">{{ task.name }}</h6>
                    <p v-if="task.description" class="text-xs text-secondary mb-0" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      {{ task.description }}
                    </p>
                  </div>
                </div>
              </td>
              <!-- プロジェクト名 -->
              <td>
                <p class="text-xs font-weight-bold mb-0">{{ task.projectName }}</p>
              </td>
              <!-- 担当者 -->
              <td>
                <p class="text-xs font-weight-bold mb-0">{{ task.assigneeName }}</p>
              </td>
              <!-- 進捗率 -->
              <td class="align-middle text-center">
                <div class="d-flex flex-column align-items-center justify-content-center px-2">
                  <span class="text-xs font-weight-bold mb-1">{{ task.progress_percent }}%</span>
                  <div class="progress w-100" style="max-width:120px;">
                    <div 
                      :class="getProgressBarClass(task.progress_percent)" 
                      :style="{ width: task.progress_percent + '%' }" 
                      role="progressbar" 
                      aria-valuemin="0" 
                      aria-valuemax="100" 
                      :aria-valuenow="task.progress_percent"
                    ></div>
                  </div>
                </div>
              </td>
              <!-- 状態 -->
              <td class="align-middle text-center">
                <span :class="getTaskStatusBadgeClass(task.status)">{{ task.statusLabel }}</span>
              </td>
              <!-- 優先度 -->
              <td class="align-middle text-center">
                <span :class="getTaskPriorityBadgeClass(task.priority)">{{ task.priorityLabel }}</span>
              </td>
              <!-- 期限 -->
              <td class="align-middle text-center">
                <span :class="`text-xs ${getDueDateClass(task)}`">{{ formatDaysUntilDue(task) }}</span>
              </td>
              <!-- アクション -->
              <td class="align-middle">
                <button class="btn btn-sm bg-gradient-success mb-0" @click="onView(task)">詳細</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* このコンポーネント固有のスタイル */
.table td {
  white-space: nowrap;
}

/* 期限切れの強調 */
.text-danger {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>

