<script setup lang="ts">
// プロジェクト概要を表示するカードコンポーネント
// 目的: プロジェクト名・タスク数・統計・進捗率をカードで表示し、クリックで詳細へ遷移

import { computed } from "vue";

interface Props {
  projectName: string; // プロジェクト名
  tasksCount: number; // タスク総数
  stats: { total: number; completed: number; inProgress: number; pending: number } | undefined; // プロジェクト統計
}

const props = defineProps<Props>();

const completionPercent = computed(() => {
  // 進捗率: 完了 / 総数（0除算防止）
  const total = props.stats?.total ?? 0;
  const completed = props.stats?.completed ?? 0;
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
});

const emit = defineEmits<{
  (e: "select", name: string): void; // カード選択イベント（詳細表示）
}>();

const handleClick = () => {
  // クリックで上位にプロジェクト名を通知
  emit("select", props.projectName);
};
</script>

<template>
  <!-- プロジェクトカード -->
  <div class="card project-card h-100 cursor-pointer" @click="handleClick">
    <div class="card-header pb-0">
      <div class="d-flex align-items-start">
        <div class="icon icon-shape bg-gradient-primary shadow text-center border-radius-md me-3">
          <i class="material-symbols-rounded text-white opacity-10">folder</i>
        </div>
        <div class="flex-grow-1">
          <h6 class="mb-0 font-weight-bold">{{ projectName }}</h6>
          <p class="text-sm text-muted mb-0">{{ tasksCount }}個のタスク</p>
        </div>
      </div>
    </div>

    <div class="card-body">
      <!-- プロジェクト統計 -->
      <div class="row text-center">
        <div class="col-4">
          <div class="text-lg font-weight-bold text-success">{{ stats?.completed || 0 }}</div>
          <div class="text-xs text-muted">完了</div>
        </div>
        <div class="col-4">
          <div class="text-lg font-weight-bold text-warning">{{ stats?.inProgress || 0 }}</div>
          <div class="text-xs text-muted">進行中</div>
        </div>
        <div class="col-4">
          <div class="text-lg font-weight-bold text-info">{{ stats?.pending || 0 }}</div>
          <div class="text-xs text-muted">予定</div>
        </div>
      </div>

      <!-- 進捗バー -->
      <div class="mt-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="text-xs font-weight-bold">完了率</span>
          <span class="text-xs text-muted">{{ completionPercent }}%</span>
        </div>
        <div class="progress">
          <div class="progress-bar bg-gradient-success" :style="{ width: completionPercent + '%' }" role="progressbar"></div>
        </div>
      </div>
    </div>

    <div class="card-footer pt-0">
      <button class="btn btn-outline-primary btn-sm w-100">
        <i class="material-symbols-rounded me-1">arrow_forward</i>
        タスクを見る
      </button>
    </div>
  </div>
  
</template>

<style scoped>
/* ProjectCard 専用の最小スタイル（ページ側の既存クラスと整合） */
.project-card {
  transition: all 0.3s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 0.75rem;
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
  border-color: rgba(0, 123, 255, 0.3);
}

.icon-shape {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.border-radius-md {
  border-radius: 0.5rem;
}
</style>


