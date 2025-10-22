<script setup lang="ts">
// フィルタ UI: ダッシュボードの検索・優先度・期限・プロジェクトフィルタを表示
import { computed } from "vue";

// v-model 受け取り用の props と emit
const props = defineProps<{
  searchQuery: string;
  priorityFilter: string;   // 'all' | 'urgent' | 'high-up'
  deadlineFilter: string;   // 'all' | 'within-3days' | 'within-7days' | 'overdue'
  projectFilter: string;    // 'all' | project name
  availableProjects: string[];
}>();

const emit = defineEmits<{
  (e: "update:searchQuery", v: string): void;
  (e: "update:priorityFilter", v: string): void;
  (e: "update:deadlineFilter", v: string): void;
  (e: "update:projectFilter", v: string): void;
  (e: "clear"): void;
  (e: "refresh"): void;
}>();

// 双方向バインディング用のコンピューテッド
const modelSearch = computed({
  get: () => props.searchQuery,
  set: (v: string) => emit("update:searchQuery", v),
});
const modelPriority = computed({
  get: () => props.priorityFilter,
  set: (v: string) => emit("update:priorityFilter", v),
});
const modelDeadline = computed({
  get: () => props.deadlineFilter,
  set: (v: string) => emit("update:deadlineFilter", v),
});
const modelProject = computed({
  get: () => props.projectFilter,
  set: (v: string) => emit("update:projectFilter", v),
});

// クリア操作
const onClear = () => emit("clear");

// データ再読み込み
const onRefresh = () => emit("refresh");

// アクティブなフィルタ数を計算
const activeFiltersCount = computed(() => {
  let count = 0;
  if (props.searchQuery) count++;
  if (props.priorityFilter !== "all") count++;
  if (props.deadlineFilter !== "all") count++;
  if (props.projectFilter !== "all") count++;
  return count;
});
</script>

<template>
  <!-- フィルタリングパネル - Material Design スタイル -->
  <div class="card shadow-sm">
    <!-- カードヘッダー: タイトルと操作ボタン -->
    <div class="card-header pb-0 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center">
        <i class="fas fa-filter text-primary me-2"></i>
        <h6 class="mb-0">フィルタリング</h6>
      </div>
      <div class="d-flex gap-2">
        <button 
          class="btn btn-sm btn-outline-success mb-0" 
          @click="onRefresh"
          title="データを最新の状態に更新"
        >
          <i class="fas fa-sync-alt me-1"></i>
          更新
        </button>
        <button 
          class="btn btn-sm btn-outline-secondary mb-0" 
          @click="onClear"
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
            placeholder="タスク名・プロジェクト名・担当者"
            v-model="modelSearch"
          />
        </div>

        <!-- 優先度フィルタ -->
        <div class="col-lg-2 col-md-6">
          <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
            <i class="fas fa-exclamation-circle text-sm me-1"></i>優先度
          </label>
          <select class="form-select" v-model="modelPriority">
            <option value="all">すべて</option>
            <option value="urgent">緊急のみ</option>
            <option value="high-up">高以上</option>
          </select>
        </div>

        <!-- 期限フィルタ -->
        <div class="col-lg-2 col-md-6">
          <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
            <i class="fas fa-calendar text-sm me-1"></i>期限
          </label>
          <select class="form-select" v-model="modelDeadline">
            <option value="all">すべて</option>
            <option value="within-3days">3日以内</option>
            <option value="within-7days">7日以内</option>
            <option value="overdue">期限切れ</option>
          </select>
        </div>

        <!-- プロジェクトフィルタ -->
        <div class="col-lg-3 col-md-6">
          <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
            <i class="fas fa-project-diagram text-sm me-1"></i>プロジェクト
          </label>
          <select class="form-select" v-model="modelProject">
            <option value="all">すべてのプロジェクト</option>
            <option v-for="project in props.availableProjects" :key="project" :value="project">
              {{ project }}
            </option>
          </select>
        </div>

        <!-- 統計情報（オプション） -->
        <div class="col-lg-1 col-md-12">
          <div class="filter-stats text-center">
            <small class="text-muted d-block text-xs">フィルタ</small>
            <span class="badge badge-sm bg-gradient-info">
              {{ activeFiltersCount }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- /フィルタリングパネル -->
</template>

<style scoped>
/* フィルタコンポーネントのスタイル */

/* カードにホバー効果 */
.card {
  transition: all 0.3s ease;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
}

/* フォームコントロールのスタイル改善 */
.form-select,
.form-control {
  border-radius: 8px;
  border: 1px solid #d2d6da;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-select:focus,
.form-control:focus {
  border-color: #5e72e4;
  box-shadow: 0 0 0 2px rgba(94, 114, 228, 0.1);
}

/* ラベルスタイル */
.form-label {
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* placeholder 스타일 */
.form-control::placeholder {
  color: #adb5bd;
  font-size: 0.875rem;
  opacity: 0.7;
}

.form-control:focus::placeholder {
  opacity: 0.5;
}

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

/* 操作ボタンのスタイル */
.btn-outline-secondary,
.btn-outline-success {
  border-radius: 8px;
  font-size: 0.75rem;
  padding: 0.5rem 1rem;
  transition: all 0.2s ease;
}

.btn-outline-secondary:hover,
.btn-outline-success:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* ボタングループの間隔 */
.card-header .d-flex.gap-2 {
  gap: 0.5rem;
}

/* アイコンの色 */
.text-primary {
  color: #5e72e4 !important;
}

/* レスポンシブ調整 */
@media (max-width: 991px) {
  .filter-stats {
    margin-top: 1rem;
  }
}

@media (max-width: 767px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  .card-header .d-flex.gap-2 {
    margin-top: 0.75rem;
    width: 100%;
    gap: 0.5rem !important;
  }
  
  .card-header .d-flex.gap-2 button {
    flex: 1;
  }
}
</style>


