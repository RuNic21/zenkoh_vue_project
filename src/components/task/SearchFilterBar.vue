<script setup lang="ts">
// タスクフィルターパネル
// 目的: 検索/状態/プロジェクト/担当者フィルターUIを統一スタイルで提供

import { computed } from "vue";
import type { Project } from "@/types/project";

// フィルター値の型定義
interface FilterValues {
  searchQuery: string; // タイトル等のキーワード検索（プロジェクト名は対象外）
  filterStatus: string; // ステータス
  selectedProjectId: number | null; // プロジェクト選択
  assigneeQuery: string; // 担当者名での検索
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

// Emitイベントの定義（v-model用 と リセット操作）
const emit = defineEmits<{
  "update:modelValue": [value: FilterValues];
  reset: [];
}>();

// 検索クエリのcomputed（双方向バインディング）
const searchQuery = computed({
  get: () => props.modelValue.searchQuery,
  set: (value) => emit("update:modelValue", { ...props.modelValue, searchQuery: value })
});

// ステータスフィルターのcomputed（双方向バインディング）
const filterStatus = computed({
  get: () => props.modelValue.filterStatus,
  set: (value) => emit("update:modelValue", { ...props.modelValue, filterStatus: value })
});

// プロジェクトIDフィルターのcomputed（双方向バインディング）
const selectedProjectId = computed({
  get: () => props.modelValue.selectedProjectId,
  set: (value) => emit("update:modelValue", { ...props.modelValue, selectedProjectId: value })
});

// 担当者検索のcomputed（双方向バインディング）
const assigneeQuery = computed({
  get: () => props.modelValue.assigneeQuery,
  set: (value) => emit("update:modelValue", { ...props.modelValue, assigneeQuery: value })
});

// アクティブなフィルタ数を計算
const activeFiltersCount = computed(() => {
  let count = 0;
  if (props.modelValue.searchQuery) count++;
  if (props.modelValue.filterStatus !== "all") count++;
  if (props.modelValue.selectedProjectId !== null) count++;
  if (props.modelValue.assigneeQuery) count++;
  return count;
});
</script>

<template>
  <!-- フィルタリング・検索カード - Material Design スタイル -->
  <div class="card shadow-sm mb-4">
    <!-- カードヘッダー: タイトルとリセットボタン -->
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
      <button 
        class="btn btn-sm btn-outline-secondary mb-0" 
        @click="emit('reset')"
        title="すべてのフィルタをリセット"
      >
        <i class="fas fa-redo me-1"></i>
        リセット
      </button>
    </div>

    <!-- カードボディ: フィルタ入力欄 -->
    <div class="card-body pt-3">
      <div class="row g-3">
        <!-- 検索フィルタ -->
        <div class="col-lg-3 col-md-6">
          <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
            <i class="fas fa-search text-sm me-1"></i>検索
          </label>
          <input 
            type="text" 
            class="form-control" 
            :placeholder="searchPlaceholder"
            v-model="searchQuery"
          />
        </div>

        <!-- 状態フィルタ -->
        <div v-if="showStatusFilter" class="col-lg-3 col-md-6">
          <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
            <i class="fas fa-tasks text-sm me-1"></i>状態
          </label>
          <select class="form-select" v-model="filterStatus">
            <option value="all">すべてのステータス</option>
            <option value="NOT_STARTED">未開始</option>
            <option value="IN_PROGRESS">進行中</option>
            <option value="DONE">完了</option>
            <option value="BLOCKED">ブロック</option>
            <option value="CANCELLED">キャンセル</option>
          </select>
        </div>

        <!-- プロジェクトフィルタ -->
        <div v-if="showProjectFilter" class="col-lg-3 col-md-6">
          <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
            <i class="fas fa-project-diagram text-sm me-1"></i>プロジェクト
          </label>
          <select class="form-select" v-model="selectedProjectId">
            <option :value="null">すべてのプロジェクト</option>
            <option 
              v-for="project in projects" 
              :key="project.id" 
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
        </div>

        <!-- 担当者検索 -->
        <div class="col-lg-2 col-md-6">
          <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
            <i class="fas fa-user text-sm me-1"></i>担当者
          </label>
          <input 
            type="text" 
            class="form-control" 
            placeholder="担当者名で検索..."
            v-model="assigneeQuery"
          />
        </div>

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

/* リセットボタンのスタイル */
.btn-outline-secondary {
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-outline-secondary:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-outline-secondary i {
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

/* レスポンシブ調整 */
@media (max-width: 991px) {
  .filter-stats-compact {
    margin-top: 0;
  }
  
  .col-lg-1.col-md-12 {
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

