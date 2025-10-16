<script setup lang="ts">
// プロジェクトのサマリー統計表示（プレゼンテーショナル）
const props = defineProps<{
  projectName: string;
  description: string;
  progressPercent: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
}>();
</script>

<template>
  <div class="card">
    <div class="card-header pb-0">
      <h6 class="mb-0">{{ projectName }}</h6>
      <p class="text-sm text-secondary mb-0">{{ description }}</p>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="col-md-3 col-6 mb-3">
          <div class="d-flex align-items-center">
            <i class="material-symbols-rounded text-primary me-2">trending_up</i>
            <div>
              <p class="text-xs text-secondary mb-0">進捗率</p>
              <h6 class="mb-0">{{ progressPercent }}%</h6>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-6 mb-3">
          <div class="d-flex align-items-center">
            <i class="material-symbols-rounded text-info me-2">task</i>
            <div>
              <p class="text-xs text-secondary mb-0">総タスク</p>
              <h6 class="mb-0">{{ totalTasks }}</h6>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-6 mb-3">
          <div class="d-flex align-items-center">
            <i class="material-symbols-rounded text-success me-2">check_circle</i>
            <div>
              <p class="text-xs text-secondary mb-0">完了</p>
              <h6 class="mb-0">{{ completedTasks }}</h6>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-6 mb-3">
          <div class="d-flex align-items-center">
            <i class="material-symbols-rounded text-warning me-2">play_circle</i>
            <div>
              <p class="text-xs text-secondary mb-0">進行中</p>
              <h6 class="mb-0">{{ inProgressTasks }}</h6>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* このコンポーネント固有のスタイルがあればここに */
</style>


