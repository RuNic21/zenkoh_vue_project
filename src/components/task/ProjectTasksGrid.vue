<script setup lang="ts">
// プロジェクトのタスクリストをグリッド表示
// 目的: タスクカードをレスポンシブグリッドで表示し、操作イベントを上位へ伝達

import TaskCard from "./TaskCard.vue";

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
  tasks: TaskLike[]; // 表示するタスク配列
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "edit", id: number): void;
  (e: "delete", id: number): void;
  (e: "view", id: number): void;
}>();
</script>

<template>
  <!-- タスクグリッド -->
  <div class="row">
    <div v-for="task in tasks" :key="task.id" class="col-lg-6 col-xl-4 mb-4">
      <TaskCard
        :task="task"
        @edit="(id) => emit('edit', id)"
        @delete="(id) => emit('delete', id)"
        @view="(id) => emit('view', id)"
      />
    </div>
  </div>
</template>

<style scoped>
/* レイアウトはBootstrapのグリッドを使用 */
</style>


