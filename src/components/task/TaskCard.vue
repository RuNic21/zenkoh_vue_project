<script setup lang="ts">
// タスクをカード表示するコンポーネント
// 目的: ステータス・優先度・担当者・進捗・日付をカードで表現

import StatusBadge from "../common/StatusBadge.vue";
import PriorityBadge from "../common/PriorityBadge.vue";

interface TaskLike {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: string;
  progress: number;
  startDate?: string;
  endDate?: string;
}

interface Props {
  task: TaskLike; // 表示対象のタスク
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "edit", id: number): void; // 編集
  (e: "delete", id: number): void; // 削除
  (e: "view", id: number): void; // 詳細表示
}>();
</script>

<template>
  <!-- タスクカード -->
  <div class="card h-100 task-card">
    <div class="card-header pb-0">
      <div class="d-flex justify-content-between align-items-start">
        <div class="flex-grow-1">
          <h6 class="mb-1 font-weight-bold">{{ task.title }}</h6>
          <p class="text-sm text-muted mb-0">{{ task.description }}</p>
        </div>
        <div class="dropdown">
          <button class="btn btn-link text-muted p-0" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="material-symbols-rounded">more_vert</i>
          </button>
          <ul class="dropdown-menu">
            <li>
              <a class="dropdown-item" href="javascript:;" @click="emit('edit', task.id)">
                <i class="material-symbols-rounded me-2">edit</i>
                編集
              </a>
            </li>
            <li>
              <a class="dropdown-item text-danger" href="javascript:;" @click="emit('delete', task.id)">
                <i class="material-symbols-rounded me-2">delete</i>
                削除
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="javascript:;" @click="emit('view', task.id)">
                <i class="material-symbols-rounded me-2">visibility</i>
                詳細
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card-body pt-0">
      <!-- ステータスと優先度 -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <StatusBadge :status="task.status" />
        <PriorityBadge :priority="task.priority" />
      </div>

      <!-- 担当者 -->
      <div class="d-flex align-items-center mb-3">
        <div class="avatar avatar-sm bg-gradient-secondary me-2">
          <i class="material-symbols-rounded text-white">person</i>
        </div>
        <div>
          <p class="text-sm mb-0 font-weight-bold">担当者</p>
          <p class="text-xs text-muted mb-0">{{ task.assignee }}</p>
        </div>
      </div>

      <!-- 進捗バー -->
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="text-sm font-weight-bold">進捗</span>
          <span class="text-sm text-muted">{{ task.progress }}%</span>
        </div>
        <div class="progress">
          <div class="progress-bar bg-gradient-success" :style="{ width: task.progress + '%' }" role="progressbar"></div>
        </div>
      </div>

      <!-- 日付情報 -->
      <div class="row text-center">
        <div class="col-6">
          <p class="text-xs text-muted mb-0">開始日</p>
          <p class="text-sm font-weight-bold mb-0">{{ task.startDate }}</p>
        </div>
        <div class="col-6">
          <p class="text-xs text-muted mb-0">終了日</p>
          <p class="text-sm font-weight-bold mb-0">{{ task.endDate }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  transition: all 0.3s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 0.75rem;
  overflow: hidden;
}

.task-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 123, 255, 0.2);
}
</style>


