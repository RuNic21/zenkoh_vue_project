<script setup lang="ts">
// チーム管理用フィルタリングパネルコンポーネント
// 目的: 検索とフィルタリングを提供するシンプルなコンポーネント

import { computed } from "vue";

// Props定義
interface Props {
  searchQuery: string;
  statusFilter: string;
  roleFilter: string;
}

// Emits定義
interface Emits {
  (e: 'update:searchQuery', value: string): void;
  (e: 'update:statusFilter', value: string): void;
  (e: 'update:roleFilter', value: string): void;
  (e: 'clearFilters'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 双方向バインディング用のコンピューテッド
const localSearch = computed({
  get: () => props.searchQuery,
  set: (v: string) => emit('update:searchQuery', v)
});

const localStatus = computed({
  get: () => props.statusFilter,
  set: (v: string) => emit('update:statusFilter', v)
});

const localRole = computed({
  get: () => props.roleFilter,
  set: (v: string) => emit('update:roleFilter', v)
});

// アクティブなフィルタ数を計算
const activeFiltersCount = computed(() => {
  let count = 0;
  if (props.searchQuery) count++;
  if (props.statusFilter !== "all") count++;
  if (props.roleFilter !== "all") count++;
  return count;
});
</script>

<template>
  <!-- フィルタリング・検索カード - Material Design スタイル -->
  <div class="card shadow-sm mb-4">
    <!-- カードヘッダー: タイトルとアクションボタン -->
    <div class="card-header pb-0 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center">
        <i class="fas fa-filter text-primary me-2"></i>
        <h6 class="mb-0">フィルタリング・検索</h6>
        <span 
          v-if="activeFiltersCount > 0" 
          class="badge badge-sm bg-gradient-info ms-2"
        >
          {{ activeFiltersCount }}
        </span>
      </div>
      <div>
        <button 
          class="btn btn-sm btn-outline-secondary mb-0" 
          @click="emit('clearFilters')"
          title="すべてのフィルタをリセット"
        >
          <i class="fas fa-redo me-1"></i>
          リセット
        </button>
      </div>
    </div>

    <!-- カードボディ: フィルタ入力欄 -->
    <div class="card-body pt-3">
      <div class="row g-3">
        <!-- 検索フィルタ -->
        <div class="col-lg-4 col-md-6">
          <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
            <i class="fas fa-search text-sm me-1"></i>検索
          </label>
          <input 
            type="text" 
            class="form-control" 
            placeholder="ユーザー名、メール、部署、役職で検索..."
            v-model="localSearch"
          />
        </div>

        <!-- ステータスフィルター -->
        <div class="col-lg-3 col-md-6">
          <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
            <i class="fas fa-toggle-on text-sm me-1"></i>ステータス
          </label>
          <select class="form-select" v-model="localStatus">
            <option value="all">すべてのステータス</option>
            <option value="active">アクティブ</option>
            <option value="inactive">非アクティブ</option>
          </select>
        </div>

        <!-- 役割フィルター -->
        <div class="col-lg-3 col-md-6">
          <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
            <i class="fas fa-user-tag text-sm me-1"></i>役割
          </label>
          <select class="form-select" v-model="localRole">
            <option value="all">すべての役割</option>
            <option value="OWNER">オーナー</option>
            <option value="CONTRIBUTOR">貢献者</option>
            <option value="REVIEWER">レビューアー</option>
          </select>
        </div>

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
      </div>
    </div>
  </div>
  <!-- /フィルタリング・検索カード -->
</template>

<style scoped>
/* フィルタコンポーネントのスタイル - Material Dashboard 3 準拠 */

/* カードにホバー効果とトランジション */
.card {
  transition: all 0.3s ease;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
}

/* カードヘッダーのスタイル */
.card-header {
  padding: 1rem 1.5rem;
  background: transparent;
  border-bottom: 1px solid #e9ecef;
}

.card-header h6 {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #344767;
}

/* フォームコントロールのスタイル改善 */
.form-select,
.form-control {
  border-radius: 8px;
  border: 1px solid #d2d6da;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  transition: all 0.2s ease;
  background-color: #fff;
}

.form-select:focus,
.form-control:focus {
  border-color: #5e72e4;
  box-shadow: 0 0 0 2px rgba(94, 114, 228, 0.1);
  outline: none;
}

.form-select:hover,
.form-control:hover {
  border-color: #b8c1cc;
}

/* ラベルスタイル */
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

/* placeholder スタイル */
.form-control::placeholder {
  color: #adb5bd;
  font-size: 0.875rem;
  opacity: 0.7;
}

.form-control:focus::placeholder {
  opacity: 0.5;
}

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

/* バッジスタイル */
.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
}

/* ボタンスタイル */
.btn-outline-secondary,
.btn-sm {
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-outline-secondary:hover,
.btn-sm:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn i {
  font-size: 0.7rem;
}

/* アイコンの色 */
.text-primary {
  color: #5e72e4 !important;
}

/* グリッド間隔調整 */
.row.g-3 {
  margin: 0 -0.5rem;
}

.row.g-3 > * {
  padding: 0 0.5rem;
}

/* ヘッダーのボタングループ */
.card-header .d-flex.gap-2 {
  gap: 0.5rem;
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

@media (max-width: 767px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  .card-header > div:first-child {
    margin-bottom: 0.75rem;
  }
  
  .card-header .d-flex.gap-2 {
    width: 100%;
    flex-direction: column;
  }
  
  .card-header button {
    width: 100%;
  }
  
  .form-label {
    font-size: 0.7rem;
  }
  
  .form-select,
  .form-control {
    font-size: 0.8rem;
  }
}

/* カードボディのパディング調整 */
.card-body {
  padding: 1.5rem;
}
</style>
