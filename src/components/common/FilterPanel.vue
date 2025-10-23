<script setup lang="ts">
// 共通フィルターパネルコンポーネント
// 目的: 各ページのフィルターパネルUIを統一し、重複コードを削減
// 使用方法: スロットでフィルター項目をカスタマイズ可能

import { computed } from "vue";

// Props定義
interface Props {
  title?: string;               // パネルタイトル
  activeFiltersCount?: number;  // アクティブなフィルター数（バッジ表示用）
  showRefreshButton?: boolean;  // 更新ボタンを表示するか
  showResetButton?: boolean;    // リセットボタンを表示するか
}

const props = withDefaults(defineProps<Props>(), {
  title: "フィルタリング・検索",
  activeFiltersCount: 0,
  showRefreshButton: false,
  showResetButton: true
});

// Emits定義
const emit = defineEmits<{
  reset: [];      // リセットボタンクリック時
  refresh: [];    // 更新ボタンクリック時
}>();
</script>

<template>
  <!-- フィルタリング・検索カード - Material Design スタイル -->
  <div class="card shadow-sm mb-4">
    <!-- カードヘッダー: タイトルとアクションボタン -->
    <div class="card-header pb-0 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center">
        <i class="fas fa-filter text-primary me-2"></i>
        <h6 class="mb-0">{{ title }}</h6>
        <span 
          v-if="activeFiltersCount > 0" 
          class="badge badge-sm bg-gradient-info ms-2"
        >
          {{ activeFiltersCount }}
        </span>
      </div>
      <div class="d-flex gap-2">
        <!-- ヘッダーアクション用スロット（追加ボタンなど） -->
        <slot name="header-actions" />
        
        <!-- 更新ボタン -->
        <button 
          v-if="showRefreshButton"
          class="btn btn-sm btn-outline-success mb-0" 
          @click="emit('refresh')"
          title="データを最新の状態に更新"
        >
          <i class="fas fa-sync-alt me-1"></i>
          更新
        </button>
        
        <!-- リセットボタン -->
        <button 
          v-if="showResetButton"
          class="btn btn-sm btn-outline-secondary mb-0" 
          @click="emit('reset')"
          title="すべてのフィルタをリセット"
        >
          <i class="fas fa-redo me-1"></i>
          リセット
        </button>
      </div>
    </div>

    <!-- カードボディ: フィルター入力欄（スロット） -->
    <div class="card-body pt-3">
      <div class="row g-3">
        <!-- フィルター項目をスロットで提供 -->
        <slot />
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

/* バッジスタイル */
.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
}

/* ボタンスタイル */
.btn-outline-secondary,
.btn-outline-success {
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-outline-secondary:hover,
.btn-outline-success:hover {
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

.row.g-3 > :deep(*) {
  padding: 0 0.5rem;
}

/* ボタングループの間隔 */
.card-header .d-flex.gap-2 {
  gap: 0.5rem;
}

/* カードボディのパディング調整 */
.card-body {
  padding: 1.5rem;
}

/* レスポンシブ調整 */
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
  }
  
  .card-header button {
    flex: 1;
  }
}
</style>

