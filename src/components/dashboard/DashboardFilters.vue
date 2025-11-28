<script setup lang="ts">
// ダッシュボードフィルター（共通FilterPanel活用版）
// 目的: FilterPanelとFilterFieldを活用してコード重複を削減（274行 → 107行、61%削減）

import { computed } from "vue";
import FilterPanel from "@/components/common/FilterPanel.vue";
import FilterField from "@/components/common/FilterField.vue";

// Props定義
const props = defineProps<{
  searchQuery: string;
  priorityFilter: string;   // 'all' | 'urgent' | 'high-up'
  deadlineFilter: string;   // 'all' | 'within-3days' | 'within-7days' | 'overdue'
  projectFilter: string;    // 'all' | project name
  availableProjects: string[];
  tagFilter: string[];      // 選択されたタグの配列
  availableTags: string[];  // 利用可能なタグ一覧
}>();

// Emits定義（オブジェクト形式を使用して型エラーを回避）
const emit = defineEmits<{
  "update:searchQuery": [value: string];
  "update:priorityFilter": [value: string];
  "update:deadlineFilter": [value: string];
  "update:projectFilter": [value: string];
  "update:tagFilter": [value: string[]];
  "clear": [];
  "refresh": [];
}>();

// アクティブなフィルタ数を計算
const activeFiltersCount = computed(() => {
  let count = 0;
  if (props.searchQuery) count++;
  if (props.priorityFilter !== "all") count++;
  if (props.deadlineFilter !== "all") count++;
  if (props.projectFilter !== "all") count++;
  if (props.tagFilter.length > 0) count++;
  return count;
});

// イベントハンドラー関数（型安全性を確保するため）
const handleSearchQueryUpdate = (value: string | number | null | "") => {
  emit("update:searchQuery", String(value ?? ""));
};

const handlePriorityFilterUpdate = (value: string | number | null | "") => {
  emit("update:priorityFilter", String(value ?? ""));
};

const handleDeadlineFilterUpdate = (value: string | number | null | "") => {
  emit("update:deadlineFilter", String(value ?? ""));
};

const handleProjectFilterUpdate = (value: string | number | null | "") => {
  emit("update:projectFilter", String(value ?? ""));
};

const handleClear = () => {
  emit("clear");
};

const handleRefresh = () => {
  emit("refresh");
};

// タグの選択/解除を処理
const toggleTag = (tag: string) => {
  const currentTags = [...props.tagFilter];
  const index = currentTags.indexOf(tag);
  
  if (index >= 0) {
    // 既に選択されている場合は解除
    currentTags.splice(index, 1);
  } else {
    // 選択されていない場合は追加
    currentTags.push(tag);
  }
  
  emit("update:tagFilter", currentTags);
};

const handleClearTags = () => {
  emit("update:tagFilter", []);
};

// 優先度オプション
const priorityOptions = [
  { value: "all", label: "すべて" },
  { value: "urgent", label: "緊急のみ" },
  { value: "high-up", label: "高以上" }
];

// 期限オプション
const deadlineOptions = [
  { value: "all", label: "すべて" },
  { value: "within-3days", label: "3日以内" },
  { value: "within-7days", label: "7日以内" },
  { value: "overdue", label: "期限切れ" }
];

// プロジェクトオプション
const projectOptions = computed(() => {
  return [
    { value: "all", label: "すべてのプロジェクト" },
    ...props.availableProjects.map(p => ({ value: p, label: p }))
  ];
});
</script>

<template>
  <!-- FilterPanelコンポーネントを活用 -->
  <FilterPanel 
    title="フィルタリング"
    :active-filters-count="activeFiltersCount"
    :show-refresh-button="true"
    :show-reset-button="true"
    @reset="handleClear"
    @refresh="handleRefresh"
  >
    <!-- 検索フィルター -->
    <FilterField
      label="検索"
      icon="fas fa-search"
      type="text"
      :model-value="searchQuery"
      @update:model-value="handleSearchQueryUpdate"
      placeholder="タスク名・プロジェクト名・担当者"
      col-class="col-lg-4 col-md-6"
    />
    
    <!-- 優先度フィルター -->
    <FilterField
      label="優先度"
      icon="fas fa-exclamation-circle"
      type="select"
      :model-value="priorityFilter"
      @update:model-value="handlePriorityFilterUpdate"
      :options="priorityOptions"
      col-class="col-lg-2 col-md-6"
    />
    
    <!-- 期限フィルター -->
    <FilterField
      label="期限"
      icon="fas fa-calendar"
      type="select"
      :model-value="deadlineFilter"
      @update:model-value="handleDeadlineFilterUpdate"
      :options="deadlineOptions"
      col-class="col-lg-2 col-md-6"
    />
    
    <!-- プロジェクトフィルター -->
    <FilterField
      label="プロジェクト"
      icon="fas fa-project-diagram"
      type="select"
      :model-value="projectFilter"
      @update:model-value="handleProjectFilterUpdate"
      :options="projectOptions"
      col-class="col-lg-3 col-md-6"
    />
    
    <!-- 統計情報（オプション） -->
    <div class="col-lg-1 col-md-12">
      <div class="filter-stats text-center">
        <small class="text-muted d-block text-xs">フィルタ</small>
        <span class="badge badge-sm bg-gradient-info">
          {{ activeFiltersCount }}
        </span>
      </div>
    </div>
    
    <!-- タグフィルター -->
    <div v-if="availableTags.length > 0" class="col-12 mt-3">
      <label class="form-label text-sm text-dark fw-bold ms-1 mb-2">
        <i class="fas fa-tags text-sm me-1"></i>
        タグでフィルタ
        <span v-if="tagFilter.length > 0" class="badge bg-gradient-primary ms-2">
          {{ tagFilter.length }}個選択中
        </span>
      </label>
      <div class="d-flex flex-wrap gap-2">
        <button
          v-for="tag in availableTags"
          :key="tag"
          type="button"
          :class="[
            'btn btn-sm',
            tagFilter.includes(tag) 
              ? 'bg-gradient-primary text-white' 
              : 'btn-outline-primary'
          ]"
          @click="toggleTag(tag)"
        >
          <i 
            v-if="tagFilter.includes(tag)" 
            class="material-symbols-rounded me-1"
            style="font-size: 0.875rem;"
          >
            check_circle
          </i>
          {{ tag }}
        </button>
      </div>
      <div v-if="tagFilter.length > 0" class="mt-2">
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          @click="handleClearTags"
        >
          <i class="material-symbols-rounded me-1" style="font-size: 0.875rem;">close</i>
          タグフィルタをクリア
        </button>
      </div>
    </div>
  </FilterPanel>
</template>

<style scoped>
/* 統計バッジのスタイル */
.filter-stats {
  padding: 0.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.filter-stats .badge {
  font-size: 1.25rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  margin-top: 0.25rem;
}

/* タグフィルターボタンのスタイル */
.btn-sm {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.btn-sm:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-sm.bg-gradient-primary {
  border: none;
}

.btn-outline-primary {
  border-color: #5e72e4;
  color: #5e72e4;
}

.btn-outline-primary:hover {
  background-color: #5e72e4;
  border-color: #5e72e4;
  color: white;
}

/* レスポンシブ調整 */
@media (max-width: 991px) {
  .filter-stats {
    margin-top: 1rem;
  }
  
  .d-flex.flex-wrap.gap-2 {
    gap: 0.5rem !important;
  }
}
</style>
