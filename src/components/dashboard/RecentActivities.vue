<script setup lang="ts">
// 最近の活動リスト
type ActivityLog = {
  id: number;
  type: 'project_created' | 'task_completed' | 'deadline_approaching' | 'user_assigned' | 'task_created' | 'project_updated';
  description: string;
  user: string;
  timestamp: Date;
};

const props = defineProps<{
  activities: ActivityLog[];
  isLoading: boolean;
}>();

const getRelativeTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  return `${days}日前`;
};

const getActivityIcon = (type: ActivityLog['type']): string => {
  switch (type) {
    case 'project_created': return 'add_circle';
    case 'task_completed': return 'check_circle';
    case 'deadline_approaching': return 'schedule';
    case 'user_assigned': return 'person_add';
    case 'task_created': return 'task_alt';
    case 'project_updated': return 'edit';
    default: return 'info';
  }
};

const getActivityColor = (type: ActivityLog['type']): string => {
  switch (type) {
    case 'project_created': return 'bg-gradient-primary';
    case 'task_completed': return 'bg-gradient-success';
    case 'deadline_approaching': return 'bg-gradient-warning';
    case 'user_assigned': return 'bg-gradient-info';
    case 'task_created': return 'bg-gradient-secondary';
    case 'project_updated': return 'bg-gradient-dark';
    default: return 'bg-gradient-secondary';
  }
};
</script>

<template>
  <div class="card">
    <div class="card-header pb-0">
      <div class="row">
        <div class="col-lg-6 col-8">
          <h6>最近の活動</h6>
          <p class="text-sm mb-0">
            <i class="fa fa-history text-info" aria-hidden="true"></i>
            <span class="font-weight-bold ms-1">プロジェクト</span>の最近の活動履歴
          </p>
        </div>
      </div>
    </div>
    <div class="card-body px-0 pt-0 pb-2">
      <div v-if="props.isLoading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">読み込み中...</span>
        </div>
        <p class="text-sm text-secondary mt-2">活動データを読み込み中...</p>
      </div>

      <div v-else class="list-group list-group-flush">
        <div v-for="activity in props.activities" :key="activity.id" class="list-group-item border-0 d-flex align-items-center px-2 mb-2">
          <div class="avatar avatar-sm me-3" :class="getActivityColor(activity.type)">
            <i class="material-symbols-rounded text-white opacity-10">{{ getActivityIcon(activity.type) }}</i>
          </div>
          <div class="d-flex align-items-start flex-column justify-content-center">
            <h6 class="mb-0 text-sm">{{ activity.description }}</h6>
            <p class="mb-0 text-xs text-secondary">
              <i class="fa fa-user me-1"></i>{{ activity.user }} • 
              <i class="fa fa-clock me-1"></i>{{ getRelativeTime(activity.timestamp) }}
            </p>
          </div>
        </div>

        <div v-if="!props.isLoading && props.activities.length === 0" class="text-center py-4">
          <i class="material-symbols-rounded text-secondary opacity-50" style="font-size: 48px;">history</i>
          <p class="text-sm text-secondary mt-2">最近の活動がありません</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* このコンポーネント固有のスタイルがあればここに */
</style>


