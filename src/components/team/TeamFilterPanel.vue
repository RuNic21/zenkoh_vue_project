<script setup lang="ts">
// チーム管理用フィルタリングパネルコンポーネント（共通FilterPanel活用版）
// 目的: FilterPanelとFilterFieldを活用してコード重複を削減（328行 → 92行、72%削減）

import { computed } from "vue";
import FilterPanel from "@/components/common/FilterPanel.vue";
import FilterField from "@/components/common/FilterField.vue";

// Props定義
interface Props {
  searchQuery: string;
  statusFilter: string;
  roleFilter: string;
  globalSearchQuery?: string; // 全カードに適用される共通検索フィルター（オプション）
}

// Emits定義
// FilterFieldコンポーネントは string | number | null | "" をemitするため、それに対応
type FilterValue = string | number | null | "";
interface Emits {
  (e: 'update:searchQuery', value: FilterValue): void;
  (e: 'update:statusFilter', value: FilterValue): void;
  (e: 'update:roleFilter', value: FilterValue): void;
  (e: 'update:globalSearchQuery', value: FilterValue): void;
  (e: 'clearFilters'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// アクティブなフィルタ数を計算
const activeFiltersCount = computed(() => {
  let count = 0;
  if (props.globalSearchQuery) count++;
  if (props.searchQuery) count++;
  if (props.statusFilter !== "all") count++;
  if (props.roleFilter !== "all") count++;
  return count;
});

// ステータスオプション
const statusOptions = [
  { value: "all", label: "すべてのステータス" },
  { value: "active", label: "アクティブ" },
  { value: "inactive", label: "非アクティブ" }
];

// 役割オプション
const roleOptions = [
  { value: "all", label: "すべての役割" },
  { value: "OWNER", label: "オーナー" },
  { value: "CONTRIBUTOR", label: "貢献者" },
  { value: "REVIEWER", label: "レビューアー" }
];
</script>

<template>
  <!-- FilterPanelコンポーネントを活用 -->
  <FilterPanel 
    title="フィルタリング・検索（全カード適用）"
    :active-filters-count="activeFiltersCount"
    :show-reset-button="true"
    @reset="emit('clearFilters')"
  >
    <!-- 共通検索フィルター（全カード・セクションに適用） -->
    <FilterField
      v-if="props.globalSearchQuery !== undefined"
      label="共通検索（全カード）"
      icon="fas fa-globe"
      type="text"
      :model-value="props.globalSearchQuery"
      @update:model-value="emit('update:globalSearchQuery', $event)"
      placeholder="全セクションで検索（ユーザー、通知、ルール、活動...）"
      col-class="col-12 mb-3"
    />
    
    <!-- ユーザー専用検索フィルター -->
    <FilterField
      label="ユーザー検索"
      icon="fas fa-search"
      type="text"
      :model-value="searchQuery"
      @update:model-value="emit('update:searchQuery', $event)"
      placeholder="ユーザー名、メール、部署、役職で検索..."
      col-class="col-lg-4 col-md-6"
    />
    
    <!-- ステータスフィルター -->
    <FilterField
      label="ステータス"
      icon="fas fa-toggle-on"
      type="select"
      :model-value="statusFilter"
      @update:model-value="emit('update:statusFilter', $event)"
      :options="statusOptions"
      col-class="col-lg-3 col-md-6"
    />
    
    <!-- 役割フィルター -->
    <FilterField
      label="役割"
      icon="fas fa-user-tag"
      type="select"
      :model-value="roleFilter"
      @update:model-value="emit('update:roleFilter', $event)"
      :options="roleOptions"
      col-class="col-lg-3 col-md-6"
    />
    
    <!-- 統計情報表示エリア -->
    <div class="col-lg-2 col-md-6">
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
  
  .col-lg-2.col-md-6 {
    margin-top: 0.5rem;
  }
}
</style>
