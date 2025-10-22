<script setup lang="ts">
// プロジェクトのタスクを管理するモーダル（最近更新された10件を表示）
import { computed } from "vue";

type TaskRow = {
  id: number;
  task_name: string;
  status: 'DONE' | 'IN_PROGRESS' | 'BLOCKED' | 'NOT_STARTED';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  progress_percent: number;
  planned_end: string | null;
  primary_assignee_id: number | null;
  updated_at: string; // 更新日時
};

const props = defineProps<{
  visible: boolean;
  projectName: string | null;
  tasks: TaskRow[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
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
  <div v-if="props.visible" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="material-symbols-rounded me-2">task</i>
            {{ props.projectName }} - 最近更新されたタスク（10件）
          </h5>
          <button type="button" class="btn-close" @click="onClose"></button>
        </div>
        <div class="modal-body">
          <!-- タスク一覧（最近更新順） -->
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>タスク名</th>
                  <th>状態</th>
                  <th>優先度</th>
                  <th>進捗率</th>
                  <th>更新日時</th>
                  <th>計画終了日</th>
                  <th>担当者</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="task in recentTasks" :key="task.id">
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
                  <td>
                    <small class="text-muted">
                      {{ new Date(task.updated_at).toLocaleDateString('ja-JP') }}
                      {{ new Date(task.updated_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) }}
                    </small>
                  </td>
                  <td>{{ task.planned_end ? new Date(task.planned_end).toLocaleDateString('ja-JP') : '-' }}</td>
                  <td>{{ task.primary_assignee_id ? `ユーザー${task.primary_assignee_id}` : '-' }}</td>
                  <td>
                    <button 
                      type="button" 
                      class="btn btn-sm btn-primary"
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
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="onClose">閉じる</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* モーダル固有のスタイルがあればここに */
</style>


