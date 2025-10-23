<script setup lang="ts">
// プロジェクトフィルターパネル（共通FilterPanel活用版）
// 目的: FilterPanelとFilterFieldを活用してコード重複を削減（328줄 → 95줄, 71% 감소）

import { computed } from "vue";
import FilterPanel from "@/components/common/FilterPanel.vue";
import FilterField from "@/components/common/FilterField.vue";

// Props 定義
interface Props {
  search: string;           // 検索クエリ
  status: string;           // 状態フィルター（all | active | archived）
  date: string;             // 期限フィルター（all | this-month | overdue）
  useBuiltinFields?: boolean; // 組み込みフィールドの表示可否
  title?: string;           // 見出しタイトル
}

const props = withDefaults(defineProps<Props>(), {
  useBuiltinFields: true,
  title: "フィルタリング・検索"
});

// Emits 定義
const emit = defineEmits<{
  'update:search': [value: string];
  'update:status': [value: string];
  'update:date': [value: string];
  'reset': [];
}>();

// アクティブなフィルタ数を計算
const activeFiltersCount = computed(() => {
  let count = 0;
  if (props.search) count++;
  if (props.status !== "all") count++;
  if (props.date !== "all") count++;
  return count;
});

// 状態オプション
const statusOptions = [
  { value: "all", label: "すべての状態" },
  { value: "active", label: "アクティブ" },
  { value: "archived", label: "アーカイブ" }
];

// 期限オプション
const dateOptions = [
  { value: "all", label: "すべての期限" },
  { value: "this-month", label: "今月" },
  { value: "overdue", label: "期限切れ" }
];
</script>

<template>
  <!-- FilterPanelコンポーネントを活用 -->
  <FilterPanel 
    :title="title"
    :active-filters-count="activeFiltersCount"
    :show-reset-button="true"
    @reset="emit('reset')"
  >
    <template v-if="useBuiltinFields">
      <!-- 検索フィルター -->
      <FilterField
        label="検索"
        icon="fas fa-search"
        type="text"
        :model-value="search"
        @update:model-value="emit('update:search', $event)"
        placeholder="プロジェクト名で検索..."
        col-class="col-lg-4 col-md-6"
      />
      
      <!-- 状態フィルター -->
      <FilterField
        label="状態"
        icon="fas fa-tasks"
        type="select"
        :model-value="status"
        @update:model-value="emit('update:status', $event)"
        :options="statusOptions"
        col-class="col-lg-3 col-md-6"
      />
      
      <!-- 期限フィルター -->
      <FilterField
        label="期限"
        icon="fas fa-calendar"
        type="select"
        :model-value="date"
        @update:model-value="emit('update:date', $event)"
        :options="dateOptions"
        col-class="col-lg-3 col-md-6"
      />
      
      <!-- 統計情報表示エリア -->
      <div class="col-lg-2 col-md-12">
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
    </template>

    <!-- 追加要素のためのスロット -->
    <template v-if="!useBuiltinFields">
      <slot />
    </template>
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
  
  .col-lg-2.col-md-12 {
    margin-top: 0.5rem;
  }
}
</style>
