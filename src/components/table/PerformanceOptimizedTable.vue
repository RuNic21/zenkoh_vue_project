<script setup lang="ts">
// パフォーマンス最適化されたテーブルコンポーネント
// 目的: 大量データの効率的な表示とメモ化による最適化

import { computed } from "vue";
import TablePagination from "./TablePagination.vue";

// Props定義
interface Props {
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    formatter?: (value: any) => string;
  }>;
  pageSize?: number;
  currentPage?: number;
  loading?: boolean;
  emptyMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10,
  currentPage: 1,
  loading: false,
  emptyMessage: "データがありません"
});

// Emits定義
const emit = defineEmits<{
  'page-change': [page: number];
  'sort-change': [column: string, direction: 'asc' | 'desc'];
  'row-click': [item: any];
}>();

// ページネーション計算（メモ化）
const paginatedData = computed(() => {
  const start = (props.currentPage - 1) * props.pageSize;
  const end = start + props.pageSize;
  return props.data.slice(start, end);
});

// 総ページ数計算（メモ化）
const totalPages = computed(() => {
  return Math.ceil(props.data.length / props.pageSize);
});

// ページ情報表示（メモ化）
const pageInfo = computed(() => {
  const start = (props.currentPage - 1) * props.pageSize + 1;
  const end = Math.min(props.currentPage * props.pageSize, props.data.length);
  return `${start}-${end} / ${props.data.length}件`;
});

// ページ変更ハンドラー
const handlePageChange = (page: number) => {
  emit('page-change', page);
};

// ソート変更ハンドラー
const handleSort = (column: string) => {
  // ソートロジックは親コンポーネントで実装
  emit('sort-change', column, 'asc');
};
</script>

<template>
  <div class="performance-optimized-table">
    <!-- ローディング表示 -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">読み込み中...</span>
      </div>
      <p class="text-sm text-secondary mt-2">データを読み込み中...</p>
    </div>

    <!-- テーブル表示 -->
    <div v-else-if="data.length > 0" class="table-responsive">
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th 
              v-for="column in columns" 
              :key="column.key"
              class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
              :class="{ 'cursor-pointer': column.sortable }"
              @click="column.sortable ? handleSort(column.key) : null"
            >
              {{ column.label }}
              <i v-if="column.sortable" class="material-symbols-rounded ms-1 opacity-50">sort</i>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in paginatedData" :key="index" @click="emit('row-click', item)" class="row-clickable">
            <td v-for="column in columns" :key="column.key">
              <slot :name="`cell-${column.key}`" :item="item" :value="item[column.key]">
                <span v-if="column.formatter">
                  {{ column.formatter(item[column.key]) }}
                </span>
                <span v-else>
                  {{ item[column.key] }}
                </span>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- データなし表示 -->
    <div v-else class="text-center py-5">
      <i class="material-symbols-rounded text-secondary opacity-50" style="font-size: 48px;">inbox</i>
      <p class="text-sm text-secondary mt-2">{{ emptyMessage }}</p>
    </div>

    <!-- ページネーション -->
    <TablePagination 
      v-if="data.length > 0 && totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      @change="handlePageChange"
    >
      <template #info>
        {{ pageInfo }}
      </template>
    </TablePagination>
  </div>
</template>

<style scoped>
/* パフォーマンス最適化テーブル専用スタイル */
.performance-optimized-table {
  position: relative;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.table th {
  background-color: #f8f9fa;
  border-top: none;
  user-select: none;
}

.table td {
  vertical-align: middle;
}

.pagination .page-link {
  border: none;
  color: #6c757d;
  background-color: transparent;
}

.pagination .page-item.active .page-link {
  background-color: #007bff;
  color: white;
}

.pagination .page-item.disabled .page-link {
  color: #6c757d;
  opacity: 0.5;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.875rem;
  }
  
  .pagination {
    justify-content: center;
  }
}
</style>


