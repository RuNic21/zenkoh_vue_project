<script setup lang="ts">
// レポートフィルター UI（プレゼンテーショナル）
import { computed } from "vue";

const props = defineProps<{
  filter: {
    dateRange: { start: Date | null; end: Date | null };
    projects: number[];
    users: number[];
    status: string[];
    priority: string[];
  };
  availableProjects: Array<{ id: number; name: string }>;
  availableUsers: Array<{ id: number; display_name: string }>;
  includeArchived: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:filter', v: any): void;
  (e: 'update:includeArchived', v: boolean): void;
  (e: 'reset'): void;
  (e: 'generate'): void;
}>();

const onToggleArchived = (v: boolean) => emit('update:includeArchived', v);
const onReset = () => emit('reset');
const onGenerate = () => emit('generate');
</script>

<template>
  <div class="card">
    <div class="card-header pb-0">
      <h6>レポートフィルター</h6>
    </div>
    <div class="card-body">
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">プロジェクト</label>
          <select class="form-select" multiple v-model="props.filter.projects">
            <option v-for="p in props.availableProjects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <small class="text-xs text-secondary">複数選択可</small>
        </div>
        <div class="col-md-4">
          <label class="form-label">ユーザー</label>
          <select class="form-select" multiple v-model="props.filter.users">
            <option v-for="u in props.availableUsers" :key="u.id" :value="u.id">{{ u.display_name }}</option>
          </select>
          <small class="text-xs text-secondary">複数選択可</small>
        </div>
        <div class="col-md-4">
          <label class="form-label">アーカイブ</label>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" :checked="props.includeArchived" @change="onToggleArchived(($event.target as HTMLInputElement).checked)">
            <label class="form-check-label">アーカイブ含む</label>
          </div>
        </div>
      </div>

      <div class="mt-3 d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="onReset">フィルターをリセット</button>
        <button class="btn bg-gradient-primary btn-sm" @click="onGenerate">レポート生成</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 追加スタイルが必要であればここに */
</style>


