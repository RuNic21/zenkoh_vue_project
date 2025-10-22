<script setup lang="ts">
import { ref, computed } from "vue";
import { useScheduleList } from "@/composables/useScheduleList";
import { getProgressBarClass } from "../utils/uiHelpers";
import type { ScheduleItem } from "../types/schedule";
import type { Project } from "../types/project";

// 共通コンポーネントのインポート
import PageHeader from "../components/common/PageHeader.vue";
import SearchFilterBar from "../components/task/SearchFilterBar.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityBadge from "../components/common/PriorityBadge.vue";
import LoadingSpinner from "../components/common/LoadingSpinner.vue";
import EmptyState from "../components/common/EmptyState.vue";
import CardHeader from "../components/common/CardHeader.vue";
import StatCards from "../components/common/StatCards.vue";
import ModalShell from "../components/common/ModalShell.vue";
import TaskCreateModal from "../components/task/TaskCreateModal.vue";
import ProjectListGrid from "../components/project/ProjectListGrid.vue";
import ProjectDetailHeader from "../components/project/ProjectDetailHeader.vue";
import ProjectTasksGrid from "../components/task/ProjectTasksGrid.vue";

// TODO: 即座に実装可能な機能（既存スキーマ活用）
// 1. カードビュー改善（進捗率可視化）
//    - プロジェクト別進捗率チャート表示
//    - 個別タスクの進捗率可視化強化
//    - 状態別色分けの改善
//    - 進捗率に応じたアニメーション効果

// 2. 高度なフィルタリングシステム
//    - 日付範囲フィルター（planned_start, planned_end活用）
//    - 担当者別フィルター（primary_assignee_id活用）
//    - 優先度複数選択フィルター
//    - 進捗率範囲フィルター
//    - WBSコード検索（wbs_codeフィールド活用）
//    - 親タスク/子タスク関係フィルター

// 3. 担当者別作業量分析
//    - 担当者別タスク数統計
//    - 進行中/完了タスクの割合表示
//    - 作業量可視化チャート
//    - 担当者別進捗率分析

// TODO: 短期実装（サービス拡張）
// 4. マイルストーン・スケジュール管理
//    - planned_start/planned_endベースのタイムラインビュー
//    - マイルストーン表示機能
//    - ガントチャートスタイル表示
//    - 期限接近アラート表示

// 5. データエクスポート機能
//    - CSV/PDFエクスポート
//    - プロジェクト別レポート生成
//    - フィルター済みデータのエクスポート
//    - カスタムレポートテンプレート

// 6. 高度な検索・ソート機能
//    - 複数条件検索
//    - ソートオプション拡張
//    - 検索履歴保存
//    - お気に入りフィルター設定

// composable から状態・ロジックを取得
const {
  schedules,            // スケジュール（タスク）データ一覧
  isLoading,            // ローディング状態フラグ
  errorMessage,         // エラーメッセージ（取得失敗時の表示用）
  projects,             // プロジェクト一覧（ドロップダウン等で使用）
  showCreateModal,      // タスク作成モーダルの表示状態
  isSubmittingTask,     // タスク作成中フラグ
  filterStatus,         // タスク状態フィルター
  searchQuery,          // 検索クエリ（名称など）
  selectedProjectId,    // 選択中のプロジェクトID
  assigneeQuery,        // 担当者名の検索クエリ
  handleFilterUpdate,   // フィルタ変更ハンドラ
  groupedSchedules,     // プロジェクト別のスケジュールグループ
  projectStats,         // プロジェクト別の統計情報
  filteredSchedules,    // フィルター適用済みのタスク一覧（統計表示用）
  selectedProjectView,  // 選択中のプロジェクトビュー（null: プロジェクト一覧、文字列: 選択されたプロジェクト名）
  selectProjectView,    // プロジェクトを選択してタスク一覧を表示
  backToProjectList,    // プロジェクト一覧に戻る
  addNewSchedule,       // 新規タスク追加のハンドラ（モーダルを開く）
  closeCreateModal,     // モーダルを閉じるハンドラ
  createTask,           // タスク作成処理
  editSchedule,         // タスク編集のハンドラ
  deleteSchedule,       // タスク削除のハンドラ
  viewDetails,          // タスク詳細画面への遷移ハンドラ
  // new: filter ops
  resetFilters,
} = useScheduleList();

// フィルター値を一つのオブジェクトとして管理（SearchFilterBar用）
const filterValues = computed({
  get: () => ({
    searchQuery: searchQuery.value,
    filterStatus: filterStatus.value,
    selectedProjectId: selectedProjectId.value,
    assigneeQuery: assigneeQuery.value
  }),
  set: (newValues) => {
    // 部分更新にも対応: 定義されたキーのみ更新し、他は維持
    if (Object.prototype.hasOwnProperty.call(newValues, "searchQuery") && newValues.searchQuery !== undefined) {
      searchQuery.value = newValues.searchQuery;
    }
    if (Object.prototype.hasOwnProperty.call(newValues, "filterStatus") && newValues.filterStatus !== undefined) {
      filterStatus.value = newValues.filterStatus;
    }
    if (Object.prototype.hasOwnProperty.call(newValues, "selectedProjectId") && newValues.selectedProjectId !== undefined) {
      selectedProjectId.value = newValues.selectedProjectId;
    }
    if (Object.prototype.hasOwnProperty.call(newValues, "assigneeQuery") && newValues.assigneeQuery !== undefined) {
      assigneeQuery.value = newValues.assigneeQuery;
    }
  }
});
</script>

<template>
  <!-- スケジュール一覧ページ -->
  <div class="schedule-list-page">
    <!-- ローディング/エラー表示 -->
    <div v-if="isLoading" class="text-center py-4">
      <LoadingSpinner message="スケジュールデータを読み込み中..." />
    </div>
    <div v-if="!isLoading && errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
    </div>
    
    <!-- ページヘッダー -->
    <PageHeader
      title="タスク一覧"
      description="プロジェクト別にタスクを管理・確認できます"
      :actions="[
        {
          label: '新しいタスク',
          icon: 'add',
          variant: 'primary',
          onClick: addNewSchedule
        }
      ]"
    />


    <!-- フィルターと検索 -->
    <SearchFilterBar
      v-model="filterValues"
      :projects="projects"
      @reset="resetFilters()"
    />
    
    
    <!-- プロジェクト統計サマリー -->
    <div v-if="!isLoading && Object.keys(groupedSchedules).length > 0" class="row mb-4">
      <div class="col-12">
        <div class="card">
          <CardHeader title="プロジェクト統計サマリー" subtitle="プロジェクト別のタスク状況" />
          <div class="card-body">
            <StatCards
              :items="[
                { 
                  label: '総プロジェクト数', 
                  value: Object.keys(groupedSchedules).length, 
                  icon: 'folder', 
                  color: 'primary',
                  footer: 'アクティブプロジェクト'
                },
                { 
                  label: '総タスク数', 
                  value: filteredSchedules.length, 
                  icon: 'task', 
                  color: 'success',
                  footer: '全タスク'
                },
                { 
                  label: '完了タスク', 
                  value: filteredSchedules.filter(s => s.status === 'DONE').length, 
                  icon: 'check_circle', 
                  color: 'info',
                  footer: '完了済み'
                },
                { 
                  label: '進行中タスク', 
                  value: filteredSchedules.filter(s => s.status === 'IN_PROGRESS').length, 
                  icon: 'trending_up', 
                  color: 'warning',
                  footer: '作業中'
                }
              ]"
            />
          </div>
        </div>
      </div>
    </div>


    <!-- プロジェクト一覧表示（初期画面） -->
    <div v-if="selectedProjectView === null" class="project-list-view">
      <ProjectListGrid
        :grouped-schedules="groupedSchedules"
        :project-stats="projectStats"
        @select="selectProjectView"
      />
    </div>

    <!-- 選択されたプロジェクトのタスク一覧 -->
    <div v-else class="project-detail-view">
      <ProjectDetailHeader
        :project-name="selectedProjectView"
        :stats="projectStats[selectedProjectView]"
        @back="backToProjectList"
      />

      <!-- タスクカード一覧 -->
      <ProjectTasksGrid
        :tasks="groupedSchedules[selectedProjectView]"
        @edit="editSchedule"
        @delete="deleteSchedule"
        @view="viewDetails"
      />
    </div>

    <!-- タスクが存在しない場合 -->
    <div v-if="!isLoading && Object.keys(groupedSchedules).length === 0" class="row">
      <div class="col-12">
        <EmptyState 
          icon="task_alt" 
          title="タスクが見つかりません" 
          subtitle="新しいタスクを作成するか、フィルターを調整してください"
        >
          <template #actions>
            <button 
              class="btn bg-gradient-primary me-2"
              @click="addNewSchedule"
            >
              <i class="material-symbols-rounded me-2">add</i>
              新しいタスクを作成
            </button>
            <button 
              class="btn bg-gradient-secondary"
              @click="() => { searchQuery = ''; filterStatus = 'all'; selectedProjectId = null; }"
            >
              <i class="material-symbols-rounded me-2">clear</i>
              フィルターをリセット
            </button>
          </template>
        </EmptyState>
      </div>
    </div>

    <!-- タスク作成モーダル -->
    <TaskCreateModal
      :show="showCreateModal"
      :projects="projects"
      :is-submitting="isSubmittingTask"
      @close="closeCreateModal"
      @submit="createTask"
    />
  </div>
</template>

<style scoped>
/* プロジェクト別タスク一覧ページのスタイリング */
.schedule-list-page {
  padding: 1rem;
}

/* プロジェクト一覧ビューのスタイリング */
.project-list-view {
  margin-top: 2rem;
}

.project-card {
  transition: all 0.3s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
}

.project-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
  border-color: rgba(0, 123, 255, 0.3);
}

.cursor-pointer {
  cursor: pointer;
}

/* アイコンシェイプのスタイリング */
.icon-shape {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.border-radius-md {
  border-radius: 0.5rem;
}

/* プロジェクト詳細ビューのスタイリング */
.project-detail-view {
  margin-top: 2rem;
}

.project-groups {
  margin-top: 2rem;
}

.project-group {
  border-left: 4px solid #e3f2fd;
  padding-left: 1rem;
  margin-bottom: 3rem;
}

.project-group:last-child {
  margin-bottom: 0;
}

/* プロジェクトヘッダーのスタイリング */
.project-header .card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 0.75rem;
}

.project-header .card-header {
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.project-stats {
  background: rgba(255, 255, 255, 0.8);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(10px);
}

/* タスクカードのスタイリング */
.task-card {
  transition: all 0.3s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 0.75rem;
  overflow: hidden;
}

.task-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 123, 255, 0.2);
}

/* バッジのスタイリング */
.badge {
  font-size: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
}

/* プログレスバーのスタイリング */
.progress {
  height: 6px;
  border-radius: 3px;
  background-color: rgba(0, 0, 0, 0.05);
}

/* ボタンのスタイリング */
.btn {
  transition: all 0.2s ease-in-out;
  border-radius: 0.5rem;
}

.btn:hover {
  transform: translateY(-1px);
}

/* ドロップダウンメニューのスタイリング */
.dropdown-menu {
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  padding: 0.5rem 0;
}

.dropdown-item {
  transition: all 0.2s ease-in-out;
  border-radius: 0.25rem;
  margin: 0 0.5rem;
}

.dropdown-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* アバターのスタイリング */
.avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
}

/* プロジェクト統計の色分け */
.text-success {
  color: #28a745 !important;
}

.text-warning {
  color: #ffc107 !important;
}

.text-info {
  color: #17a2b8 !important;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .schedule-list-page {
    padding: 0.5rem;
  }
  
  .project-card .icon-shape {
    width: 40px;
    height: 40px;
  }
  
  .project-group {
    padding-left: 0.5rem;
    border-left-width: 2px;
  }
  
  .project-header .card-header {
    padding: 1rem;
  }
  
  .project-stats {
    padding: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .task-card .card-body {
    padding: 1rem;
  }
  
  .d-flex.gap-3 {
    gap: 1rem !important;
  }
}

@media (max-width: 576px) {
  .project-stats .d-flex {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .project-stats .d-flex > div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
  }
}
</style>
