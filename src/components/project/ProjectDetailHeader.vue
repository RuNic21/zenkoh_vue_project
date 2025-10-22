<script setup lang="ts">
// 選択されたプロジェクトのヘッダー表示
// 目的: プロジェクト名・統計の簡潔な概要と戻る操作

interface Props {
  projectName: string; // プロジェクト名
  stats: { total: number; completed: number; inProgress: number; pending: number } | undefined; // 統計
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "back"): void; // 戻る
}>();
</script>

<template>
  <!-- プロジェクトヘッダー -->
  <div class="mb-4">
    <button class="btn btn-outline-secondary" @click="() => emit('back')">
      <i class="material-symbols-rounded me-1">arrow_back</i>
      プロジェクト一覧に戻る
    </button>
  </div>

  <div class="project-header mb-4">
    <div class="card">
      <div class="card-header pb-0">
        <div class="d-flex justify-content-between align-items-center">
          <div class="flex-grow-1">
            <h5 class="mb-1 font-weight-bold text-primary">
              <i class="material-symbols-rounded me-2">folder</i>
              {{ projectName }}
            </h5>
            <p class="text-sm text-muted mb-0">
              {{ stats?.total || 0 }}個のタスク
            </p>
          </div>
          <div class="project-stats">
            <div class="d-flex gap-3">
              <div class="text-center">
                <div class="text-sm font-weight-bold text-success">{{ stats?.completed || 0 }}</div>
                <div class="text-xs text-muted">完了</div>
              </div>
              <div class="text-center">
                <div class="text-sm font-weight-bold text-warning">{{ stats?.inProgress || 0 }}</div>
                <div class="text-xs text-muted">進行中</div>
              </div>
              <div class="text-center">
                <div class="text-sm font-weight-bold text-info">{{ stats?.pending || 0 }}</div>
                <div class="text-xs text-muted">予定</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ページ固有スタイルとの整合性を保つ */
.project-header .card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 0.75rem;
}

.project-header .card-header {
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.project-stats {
  background: rgba(255, 255, 255, 0.8);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(10px);
}
</style>


