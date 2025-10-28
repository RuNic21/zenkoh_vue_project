<script setup lang="ts">
// レポートフィルター（共通FilterPanel活用版）
// 目的: FilterPanelを活用してコード一貫性を向上（73行 → 101行、構造改善）

import { computed } from "vue";
import FilterPanel from "@/components/common/FilterPanel.vue";

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

// フィルター値の型定義
type ReportFilter = {
  dateRange: { start: Date | null; end: Date | null };
  projects: number[];
  users: number[];
  status: string[];
  priority: string[];
};

const emit = defineEmits<{
  (e: 'update:filter', v: ReportFilter): void;
  (e: 'update:includeArchived', v: boolean): void;
  (e: 'reset'): void;
  (e: 'generate'): void;
}>();

const onToggleArchived = (v: boolean) => emit('update:includeArchived', v);
const onReset = () => emit('reset');
const onGenerate = () => emit('generate');

// アクティブなフィルタ数を計算
const activeFiltersCount = computed(() => {
  let count = 0;
  if (props.filter.projects.length > 0) count++;
  if (props.filter.users.length > 0) count++;
  if (props.includeArchived) count++;
  return count;
});
</script>

<template>
  <!-- FilterPanelコンポーネントを活用 -->
  <FilterPanel 
    title="レポートフィルター"
    :active-filters-count="activeFiltersCount"
    :show-reset-button="true"
    @reset="onReset"
  >
    <!-- ヘッダーアクション: レポート生成ボタン -->
    <template #header-actions>
      <button class="btn btn-sm bg-gradient-primary mb-0" @click="onGenerate">
        <i class="fas fa-chart-bar me-1"></i>
        レポート生成
      </button>
    </template>
    
    <!-- プロジェクト選択 -->
    <div class="col-md-4">
      <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
        <i class="fas fa-project-diagram text-sm me-1"></i>
        プロジェクト
      </label>
      <select class="form-select" multiple v-model="props.filter.projects">
        <option v-for="p in props.availableProjects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <small class="text-xs text-secondary ms-1">
        <i class="fas fa-info-circle me-1"></i>
        複数選択可
      </small>
    </div>
    
    <!-- ユーザー選択 -->
    <div class="col-md-4">
      <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
        <i class="fas fa-users text-sm me-1"></i>
        ユーザー
      </label>
      <select class="form-select" multiple v-model="props.filter.users">
        <option v-for="u in props.availableUsers" :key="u.id" :value="u.id">{{ u.display_name }}</option>
      </select>
      <small class="text-xs text-secondary ms-1">
        <i class="fas fa-info-circle me-1"></i>
        複数選択可
      </small>
    </div>
    
    <!-- アーカイブ設定 -->
    <div class="col-md-4">
      <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
        <i class="fas fa-archive text-sm me-1"></i>
        アーカイブ
      </label>
      <div class="form-check form-switch ps-0 mt-2">
        <input 
          class="form-check-input ms-auto" 
          type="checkbox" 
          :checked="props.includeArchived" 
          @change="onToggleArchived(($event.target as HTMLInputElement).checked)"
          id="includeArchived"
        >
        <label class="form-check-label text-body ms-3" for="includeArchived">
          アーカイブ含む
        </label>
      </div>
    </div>
  </FilterPanel>
</template>

<style scoped>
/* フォームラベルスタイル */
.form-label {
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #344767;
}

.form-label i {
  opacity: 0.7;
}

/* フォームセレクト（複数選択）のスタイル */
.form-select {
  border-radius: 8px;
  border: 1px solid #d2d6da;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  transition: all 0.2s ease;
  background-color: #fff;
  min-height: 100px;
}

.form-select:focus {
  border-color: #5e72e4;
  box-shadow: 0 0 0 2px rgba(94, 114, 228, 0.1);
  outline: none;
}

.form-select:hover {
  border-color: #b8c1cc;
}

/* スイッチスタイリング */
.form-check.form-switch {
  padding: 0.5rem;
}

.form-check-label {
  cursor: pointer;
  font-weight: 500;
}
</style>
