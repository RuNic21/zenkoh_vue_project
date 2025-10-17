<script setup lang="ts">
// プロジェクトのタスクを管理するモーダル
type TaskRow = {
  id: number;
  task_name: string;
  status: 'DONE' | 'IN_PROGRESS' | 'BLOCKED' | 'NOT_STARTED';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  progress_percent: number;
  planned_end: string | null;
  primary_assignee_id: number | null;
};

const props = defineProps<{
  visible: boolean;
  projectName: string | null;
  tasks: TaskRow[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const onClose = () => emit('close');
</script>

<template>
  <div v-if="props.visible" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="material-symbols-rounded me-2">task</i>
            {{ props.projectName }} - タスク管理
          </h5>
          <button type="button" class="btn-close" @click="onClose"></button>
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
                <tr v-for="task in props.tasks" :key="task.id">
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
          <button type="button" class="btn btn-secondary" @click="onClose">閉じる</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* モーダル固有のスタイルがあればここに */
</style>


