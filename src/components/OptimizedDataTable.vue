<script setup lang="ts">
// パフォーマンス最適化されたデータテーブルコンポーネント
// 目的: 大量データの効率的な表示、仮想スクロール、メモ化による最適化

import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { debounce, throttle, useVirtualScroll, PerformanceMonitor } from "../utils/performanceUtils";

// Props定義
interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  formatter?: (value: any) => string;
  width?: string;
}

interface Props {
  data: any[];
  columns: Column[];
  pageSize?: number;
  virtualScroll?: boolean;
  itemHeight?: number;
  containerHeight?: number;
  loading?: boolean;
  emptyMessage?: string;
  searchable?: boolean;
  filterable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 50,
  virtualScroll: false,
  itemHeight: 50,
  containerHeight: 400,
  loading: false,
  emptyMessage: "データがありません",
  searchable: true,
  filterable: true
});

// Emits定義
const emit = defineEmits<{
  'page-change': [page: number];
  'sort-change': [column: string, direction: 'asc' | 'desc'];
  'search-change': [query: string];
  'filter-change': [filters: Record<string, any>];
}>();

// リアクティブデータ
const currentPage = ref(1);
const searchQuery = ref("");
const sortColumn = ref<string>("");
const sortDirection = ref<'asc' | 'desc'>('asc');
const filters = ref<Record<string, any>>({});

// パフォーマンス測定
const performanceTimer = ref<(() => void) | null>(null);

// 検索・フィルタリング・ソートされたデータ（メモ化）
const processedData = computed(() => {
  performanceTimer.value = PerformanceMonitor.start('data-processing');
  
  let result = [...props.data];
  
  // 検索フィルタリング
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      props.columns.some(column => {
        const value = item[column.key];
        return value && String(value).toLowerCase().includes(query);
      })
    );
  }
  
  // カスタムフィルタリング
  if (Object.keys(filters.value).length > 0) {
    result = result.filter(item => {
      return Object.entries(filters.value).every(([key, value]) => {
        if (value === null || value === undefined || value === "") return true;
        return item[key] === value;
      });
    });
  }
  
  // ソート
  if (sortColumn.value) {
    result.sort((a, b) => {
      const aVal = a[sortColumn.value];
      const bVal = b[sortColumn.value];
      
      if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  performanceTimer.value?.();
  return result;
});

// 仮想スクロール設定
const virtualScrollOptions = computed(() => ({
  itemHeight: props.itemHeight,
  containerHeight: props.containerHeight,
  overscan: 5
}));

const { scrollTop, visibleItems } = useVirtualScroll(
  processedData,
  virtualScrollOptions.value
);

// ページネーション（仮想スクロールが無効な場合）
const paginatedData = computed(() => {
  if (props.virtualScroll) {
    return visibleItems.value.items;
  }
  
  const start = (currentPage.value - 1) * props.pageSize;
  const end = start + props.pageSize;
  return processedData.value.slice(start, end);
});

// 総ページ数
const totalPages = computed(() => {
  if (props.virtualScroll) return 1;
  return Math.ceil(processedData.value.length / props.pageSize);
});

// ページ情報
const pageInfo = computed(() => {
  if (props.virtualScroll) {
    return `${processedData.value.length}件`;
  }
  
  const start = (currentPage.value - 1) * props.pageSize + 1;
  const end = Math.min(currentPage.value * props.pageSize, processedData.value.length);
  return `${start}-${end} / ${processedData.value.length}件`;
});

// デバウンスされた検索
const debouncedSearch = debounce((query: string) => {
  emit('search-change', query);
}, 300);

// スロットルされたソート
const throttledSort = throttle((column: string, direction: 'asc' | 'desc') => {
  emit('sort-change', column, direction);
}, 100);

// イベントハンドラー
const handleSearch = (query: string) => {
  searchQuery.value = query;
  debouncedSearch(query);
  if (!props.virtualScroll) {
    currentPage.value = 1; // 検索時は最初のページに戻る
  }
};

const handleSort = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
  throttledSort(column, sortDirection.value);
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  emit('page-change', page);
};

const handleFilterChange = (key: string, value: any) => {
  filters.value = { ...filters.value, [key]: value };
  emit('filter-change', filters.value);
  if (!props.virtualScroll) {
    currentPage.value = 1;
  }
};

// 仮想スクロールのスクロールハンドラー
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
};

// ライフサイクル
onMounted(() => {
  // パフォーマンス統計の定期出力
  const statsInterval = setInterval(() => {
    const stats = PerformanceMonitor.getAllStats();
    if (Object.keys(stats).length > 0) {
      console.log('Performance Stats:', stats);
    }
  }, 10000); // 10秒ごと
  
  onUnmounted(() => {
    clearInterval(statsInterval);
  });
});

// データ変更時の仮想スクロール更新
watch(() => props.data, () => {
  if (props.virtualScroll) {
    // 仮想スクロールのデータを更新
    visibleItems.value.items = processedData.value;
  }
}, { deep: true });
</script>

<template>
  <div class="optimized-data-table">
    <!-- 検索・フィルターバー -->
    <div v-if="searchable || filterable" class="table-controls mb-3">
      <div class="row">
        <!-- 検索バー -->
        <div v-if="searchable" class="col-md-6 mb-2">
          <div class="input-group">
            <span class="input-group-text">
              <i class="material-symbols-rounded">search</i>
            </span>
            <input
              type="text"
              class="form-control"
              placeholder="検索..."
              :value="searchQuery"
              @input="handleSearch(($event.target as HTMLInputElement).value)"
            >
          </div>
        </div>
        
        <!-- フィルターバー -->
        <div v-if="filterable" class="col-md-6 mb-2">
          <div class="d-flex gap-2">
            <select 
              v-for="column in columns.filter(c => c.filterable)" 
              :key="column.key"
              class="form-select form-select-sm"
              @change="handleFilterChange(column.key, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">すべての{{ column.label }}</option>
              <option 
                v-for="value in [...new Set(data.map(item => item[column.key]))]" 
                :key="value" 
                :value="value"
              >
                {{ value }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- ローディング表示 -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">読み込み中...</span>
      </div>
      <p class="text-sm text-secondary mt-2">データを読み込み中...</p>
    </div>

    <!-- テーブル表示 -->
    <div v-else-if="data.length > 0" class="table-container">
      <div 
        v-if="virtualScroll"
        class="virtual-scroll-container"
        :style="{ height: containerHeight + 'px' }"
        @scroll="handleScroll"
      >
        <div :style="{ height: visibleItems.totalHeight + 'px', position: 'relative' }">
          <div 
            class="virtual-scroll-content"
            :style="{ transform: `translateY(${visibleItems.offsetY}px)` }"
          >
            <table class="table align-items-center mb-0">
              <thead class="sticky-top">
                <tr>
                  <th 
                    v-for="column in columns" 
                    :key="column.key"
                    class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                    :class="{ 'cursor-pointer': column.sortable }"
                    :style="{ width: column.width }"
                    @click="column.sortable ? handleSort(column.key) : null"
                  >
                    {{ column.label }}
                    <i v-if="column.sortable" class="material-symbols-rounded ms-1 opacity-50">
                      {{ sortColumn === column.key ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'sort' }}
                    </i>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(item, index) in paginatedData" 
                  :key="visibleItems.startIndex + index"
                  :style="{ height: itemHeight + 'px' }"
                >
                  <td v-for="column in columns" :key="column.key">
                    <span v-if="column.formatter">
                      {{ column.formatter(item[column.key]) }}
                    </span>
                    <span v-else>
                      {{ item[column.key] }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- 通常のテーブル表示 -->
      <div v-else class="table-responsive">
        <table class="table align-items-center mb-0">
          <thead>
            <tr>
              <th 
                v-for="column in columns" 
                :key="column.key"
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                :class="{ 'cursor-pointer': column.sortable }"
                :style="{ width: column.width }"
                @click="column.sortable ? handleSort(column.key) : null"
              >
                {{ column.label }}
                <i v-if="column.sortable" class="material-symbols-rounded ms-1 opacity-50">
                  {{ sortColumn === column.key ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'sort' }}
                </i>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in paginatedData" :key="index">
              <td v-for="column in columns" :key="column.key">
                <span v-if="column.formatter">
                  {{ column.formatter(item[column.key]) }}
                </span>
                <span v-else>
                  {{ item[column.key] }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- データなし表示 -->
    <div v-else class="text-center py-5">
      <i class="material-symbols-rounded text-secondary opacity-50" style="font-size: 48px;">inbox</i>
      <p class="text-sm text-secondary mt-2">{{ emptyMessage }}</p>
    </div>

    <!-- ページネーション（仮想スクロールが無効な場合のみ） -->
    <div v-if="!virtualScroll && totalPages > 1" class="d-flex justify-content-between align-items-center mt-3">
      <div class="text-sm text-secondary">
        {{ pageInfo }}
      </div>
      <nav>
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button 
              class="page-link" 
              @click="handlePageChange(currentPage - 1)"
              :disabled="currentPage === 1"
            >
              前へ
            </button>
          </li>
          
          <li 
            v-for="page in Math.min(5, totalPages)" 
            :key="page"
            class="page-item" 
            :class="{ active: page === currentPage }"
          >
            <button 
              class="page-link" 
              @click="handlePageChange(page)"
            >
              {{ page }}
            </button>
          </li>
          
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button 
              class="page-link" 
              @click="handlePageChange(currentPage + 1)"
              :disabled="currentPage === totalPages"
            >
              次へ
            </button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- パフォーマンス情報（開発モードのみ） -->
    <div v-if="import.meta.env.DEV" class="mt-3">
      <small class="text-muted">
        表示中: {{ paginatedData.length }}件 / 総数: {{ processedData.length }}件
        <span v-if="virtualScroll">(仮想スクロール)</span>
      </small>
    </div>
  </div>
</template>

<style scoped>
/* 最適化データテーブル専用スタイル */
.optimized-data-table {
  position: relative;
}

.table-controls {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.375rem;
}

.table-container {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  overflow: hidden;
}

.virtual-scroll-container {
  overflow-y: auto;
  overflow-x: hidden;
}

.virtual-scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
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
  position: sticky;
  top: 0;
  z-index: 10;
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
  
  .table-controls .row {
    flex-direction: column;
  }
}
</style>
