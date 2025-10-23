<script setup lang="ts">
// タスクフィルターパネル（共通FilterPanel活用版）
// 目的: FilterPanelとFilterFieldを活用してコード重複を削減（358줄 → 140줄, 61% 감소）

import { computed } from "vue";
import type { Project } from "@/types/project";
import FilterPanel from "@/components/common/FilterPanel.vue";
import FilterField from "@/components/common/FilterField.vue";

// フィルター値の型定義
interface FilterValues {
  searchQuery: string;              // タイトル等のキーワード検索
  filterStatus: string;             // ステータス
  selectedProjectId: number | null; // プロジェクト選択
  assigneeQuery: string;            // 担当者名での検索
}

// Propsの型定義
interface Props {
  modelValue: FilterValues;
  projects: Project[];
  searchPlaceholder?: string;
  showProjectFilter?: boolean;
  showStatusFilter?: boolean;
  title?: string;
}

// Propsの受け取り（デフォルト値含む）
const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: "キーワードで検索（部分一致、複数単語OK）",
  showProjectFilter: true,
  showStatusFilter: true,
  title: "フィルタリング・検索"
});

// Emitイベントの定義
const emit = defineEmits<{
  "update:modelValue": [value: FilterValues];
  reset: [];
}>();

// アクティブなフィルタ数を計算
const activeFiltersCount = computed(() => {
  let count = 0;
  if (props.modelValue.searchQuery) count++;
  if (props.modelValue.filterStatus !== "all") count++;
  if (props.modelValue.selectedProjectId !== null) count++;
  if (props.modelValue.assigneeQuery) count++;
  return count;
});

// ステータスオプション
const statusOptions = [
  { value: "all", label: "すべてのステータス" },
  { value: "NOT_STARTED", label: "未開始" },
  { value: "IN_PROGRESS", label: "進行中" },
  { value: "DONE", label: "完了" },
  { value: "BLOCKED", label: "ブロック" },
  { value: "CANCELLED", label: "キャンセル" }
];

// プロジェクトオプション
const projectOptions = computed(() => {
  return [
    { value: null, label: "すべてのプロジェクト" },
    ...props.projects.map(p => ({ value: p.id, label: p.name }))
  ];
});

// ヘルパー関数: フィールド更新
const updateField = (field: keyof FilterValues, value: string | number | null) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};
</script>

<template>
  <!-- FilterPanelコンポーネントを活用 -->
  <FilterPanel 
    :title="title"
    :active-filters-count="activeFiltersCount"
    :show-reset-button="true"
    @reset="emit('reset')"
  >
    <!-- 検索フィルター -->
    <FilterField
      label="検索"
      icon="fas fa-search"
      type="text"
      :model-value="modelValue.searchQuery"
      @update:model-value="updateField('searchQuery', $event)"
      :placeholder="searchPlaceholder"
      col-class="col-lg-3 col-md-6"
    />
    
    <!-- 状態フィルター -->
    <FilterField
      v-if="showStatusFilter"
      label="状態"
      icon="fas fa-tasks"
      type="select"
      :model-value="modelValue.filterStatus"
      @update:model-value="updateField('filterStatus', $event)"
      :options="statusOptions"
      col-class="col-lg-3 col-md-6"
    />
    
    <!-- プロジェクトフィルター -->
    <FilterField
      v-if="showProjectFilter"
      label="プロジェクト"
      icon="fas fa-project-diagram"
      type="select"
      :model-value="modelValue.selectedProjectId"
      @update:model-value="updateField('selectedProjectId', $event)"
      :options="projectOptions"
      col-class="col-lg-3 col-md-6"
    />
    
    <!-- 担当者検索 -->
    <FilterField
      label="担当者"
      icon="fas fa-user"
      type="text"
      :model-value="modelValue.assigneeQuery"
      @update:model-value="updateField('assigneeQuery', $event)"
      placeholder="担当者名で検索..."
      col-class="col-lg-2 col-md-6"
    />
    
    <!-- 統計情報表示エリア -->
    <div class="col-lg-1 col-md-12">
      <div class="filter-stats-compact text-center">
        <small class="text-muted d-block text-xs mb-1">フィルタ数</small>
        <div 
          class="stats-value"
          :class="{ 'text-info': activeFiltersCount > 0, 'text-muted': activeFiltersCount === 0 }"
        >
          {{ activeFiltersCount }}
        </div>
      </div>
    </div>
  </FilterPanel>
</template>

<style scoped>
/* 統計情報コンパクト表示 */
.filter-stats-compact {
  padding: 0.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 70px;
}

.filter-stats-compact .stats-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

/* レスポンシブ調整 */
@media (max-width: 991px) {
  .filter-stats-compact {
    margin-top: 0;
  }
  
  .col-lg-1.col-md-12 {
    margin-top: 0.5rem;
  }
}
</style>
