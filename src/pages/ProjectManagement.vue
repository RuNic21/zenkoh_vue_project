<script setup lang="ts">
// プロジェクト管理ページ: プロジェクトの一覧表示・作成・編集・削除機能

// Keep-Alive 캐싱을 위한 컴포넌트 이름 설정
defineOptions({
  name: 'ProjectManagement'
});

// using useProjectManagement composable; no local refs required
import { onActivated } from "vue";
import { useProjectManagement } from "@/composables/useProjectManagement";
import router from "@/router";
import OptimizedDataTable from "../components/table/OptimizedDataTable.vue";
import ProjectFilterPanel from "../components/project/ProjectFilterPanel.vue";
import ProjectFormModal from "../components/project/ProjectFormModal.vue";
import ProjectDeleteModal from "../components/project/ProjectDeleteModal.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import CardHeader from "@/components/common/CardHeader.vue";
import ActionBar from "@/components/common/ActionBar.vue";
import StatCards from "@/components/common/StatCards.vue";
import { formatPercent, truncate } from "@/utils/formatters";

// プロジェクト管理の状態・ロジックは composable から取得
// useProjectManagement コンポーザブルから状態・アクションを分割代入する
const {
  projects,                // プロジェクト一覧（配列）
  users,                   // 全ユーザー一覧（割り当て候補にも利用）
  isLoading,               // ローディング中かどうかの状態
  errorMessage,            // エラーメッセージ文字列
  projectStats,            // プロジェクト全体統計情報
  projectDetailStats,      // 選択プロジェクトごとの詳細統計
  showCreateModal,         // プロジェクト作成モーダル表示状態
  showEditModal,           // プロジェクト編集モーダル表示状態
  showDeleteModal,         // プロジェクト削除モーダル表示状態
  selectedProject,         // 選択中プロジェクト情報
  formData,                // プロジェクト作成・編集フォームの双方向データ
  searchQuery,             // 検索クエリ文字列
  statusFilter,            // ステータスによるフィルタ値
  dateFilter,              // 日付範囲フィルタ値
  clearFilters,            // フィルター解除用メソッド
  filteredProjects,        // 現在フィルタ適用後のプロジェクト一覧
  projectCurrentPage,      // 現在のページ番号（ページネーション用）
  projectPageSize,         // ページごとの表示件数
  projectSortColumn,       // 現在のソート列
  projectSortDirection,    // ソート方向（昇順/降順）
  projectTableColumns,     // テーブル列定義
  projectTableRows,        // テーブル表示用の行データ
  handleProjectSortChange, // テーブルのソート変更ハンドラ
  handleProjectPageChange, // テーブルのページ変更ハンドラ
  formatDate,              // 日付フォーマット関数
  getOwnerName,            // プロジェクトオーナー名取得関数
  getProjectStatus,        // プロジェクト状態取得関数
  loadProjects,            // プロジェクト一覧再取得アクション
  loadUsers,               // ユーザー一覧再取得アクション
  handleCreateProject,     // プロジェクト新規作成処理
  handleEditProject,       // プロジェクト編集処理
  handleDeleteProject,     // プロジェクト削除処理
  resetForm,               // 新規/編集フォームのリセット処理
  openEditModal,           // 編集モーダルオープン用アクション
  openDeleteModal,         // 削除モーダルオープン用アクション
  loadDashboardStats,      // ダッシュボード用統計取得アクション
  showProjectTasks,        // プロジェクトのタスク一覧表示アクション
} = useProjectManagement(); // 各プロジェクト管理画面で必須な状態管理・操作を提供

// composable を利用するため、以降のローカル定義は不要です

// プロジェクト行クリック時に詳細ページへ遷移
const handleProjectRowClick = (row: any) => {
  // プロジェクト詳細ページへ遷移
  router.push({ name: "project-detail", params: { id: row.id } });
};

// Keep-Alive: ページが再度アクティブになったときにデータを更新
onActivated(() => {
  console.log("ProjectManagement ページが再アクティブ化されました");
  // 詳細ページから戻ってきたときに最新のデータを表示
  loadProjects();
});
</script>

<template>
  <div class="container-fluid py-4">
    <PageHeader 
      title="プロジェクト管理"
      description="プロジェクトの作成・編集・削除・一覧表示を行えます。"
    />

    <!-- エラー表示 -->
    <div v-if="errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
    </div>

    <!-- フィルタリング・アクションパネル -->
    <div class="row mb-4">
      <!-- フィルタリングパネル -->
      <div class="col-lg-8 col-md-12">
        <ProjectFilterPanel
          :search="searchQuery"
          :status="statusFilter"
          :date="dateFilter"
          @update:search="(v: string) => searchQuery = v"
          @update:status="(v: string) => statusFilter = v"
          @update:date="(v: string) => dateFilter = v"
          @reset="clearFilters"
        />
      </div>


      <!-- アクションパネル -->
      <div class="col-lg-4 col-md-12">
        <div class="card">
          <CardHeader title="アクション" />
          <div class="card-body">
            <ActionBar>
              <template #left>
                <button 
                      class="btn bg-gradient-primary"
                  @click="showCreateModal = true"
                >
                  <i class="material-symbols-rounded me-2">add</i>
                  新しいプロジェクト作成
                </button>
              </template>
            </ActionBar>
          </div>
        </div>
      </div>
    </div>

    <!-- プロジェクト分析ダッシュボード -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <CardHeader title="プロジェクト分析ダッシュボード" subtitle="プロジェクトの統計情報" />
          <div class="card-body">
            <StatCards
              :items="[
                { label: '総プロジェクト数', value: projectStats.totalProjects, icon: 'folder', color: 'primary', footer: `アクティブ ${projectStats.activeProjects}` },
                { label: '総タスク数', value: projectStats.totalTasks, icon: 'task', color: 'success', footer: `完了済み ${projectStats.completedTasks}` },
                { label: '平均進捗率', value: `${projectStats.averageProgress}%`, icon: 'trending_up', color: 'info', footer: `進行中 ${projectStats.inProgressTasks}` },
                { label: '期限切れ', value: projectStats.overdueProjects, icon: 'warning', color: 'danger', footer: `ブロック ${projectStats.blockedTasks}` }
              ]"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- プロジェクト一覧 -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <div class="row">
              <div class="col-lg-6 col-8">
                <h6>プロジェクト一覧</h6>
                <p class="text-sm mb-0">
                  <i class="fa fa-folder text-info" aria-hidden="true"></i>
                  <span class="font-weight-bold ms-1">プロジェクト</span>の管理
                  <span class="badge bg-gradient-info ms-2">{{ filteredProjects.length }}個のプロジェクト</span>
                </p>
              </div>
            </div>
          </div>
          <div class="card-body px-0 pt-0 pb-2">
            <!-- ローディング表示 -->
            <div v-if="isLoading" class="text-center py-4">
              <LoadingSpinner message="プロジェクトデータを読み込み中..." />
            </div>

            <!-- パフォーマンス最適化テーブルを使用 -->
            <div v-else class="p-3">
              <OptimizedDataTable
                :data="projectTableRows"
                :columns="projectTableColumns"
                :page-size="projectPageSize"
                :loading="isLoading"
                :searchable="false"
                :filterable="false"
                :virtual-scroll="false"
                empty-message="プロジェクトが見つかりません"
                @page-change="handleProjectPageChange"
                @sort-change="handleProjectSortChange"
                @row-click="handleProjectRowClick"
                class="cursor-pointer"
              >
                <!-- 進行率セル: プログレスバーで表示 -->
                <template #cell-progress="{ value }">
                  <div class="d-flex align-items-center">
                    <div class="progress" style="flex: 1; height: 8px; min-width: 60px;">
                      <div 
                        class="progress-bar" 
                        :class="{
                          'bg-success': value >= 75,
                          'bg-info': value >= 50 && value < 75,
                          'bg-warning': value >= 25 && value < 50,
                          'bg-danger': value < 25
                        }"
                        :style="{ width: value + '%' }"
                        role="progressbar"
                        :aria-valuenow="value"
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                    <span class="ms-2 text-xs font-weight-bold">{{ value }}%</span>
                  </div>
                </template>

                <!-- タスク要約セル: バッジで表示 -->
                <template #cell-taskSummary="{ value, item }">
                  <div class="d-flex align-items-center gap-1">
                    <span class="badge badge-sm" :class="{
                      'bg-gradient-success': item.completedTasks === item.totalTasks && item.totalTasks > 0,
                      'bg-gradient-info': item.completedTasks < item.totalTasks && item.totalTasks > 0,
                      'bg-gradient-secondary': item.totalTasks === 0
                    }">
                      {{ value }}
                    </span>
                  </div>
                </template>

                <!-- 残り日数セル: 緊急度に応じた色分け -->
                <template #cell-daysRemaining="{ value, item }">
                  <span class="badge badge-sm" :class="{
                    'bg-gradient-danger': item.daysRemainingStatus === 'overdue',
                    'bg-gradient-warning': item.daysRemainingStatus === 'warning',
                    'bg-gradient-success': item.daysRemainingStatus === 'normal',
                    'bg-gradient-secondary': item.daysRemainingStatus === 'none'
                  }">
                    <i class="material-symbols-rounded text-xs me-1" style="font-size: 14px;">
                      {{ item.daysRemainingStatus === 'overdue' ? 'warning' : 'schedule' }}
                    </i>
                    {{ value }}
                  </span>
                </template>

                <!-- 状態セル -->
                <template #cell-status="{ value }">
                  <StatusBadge :status="value" />
                </template>
              </OptimizedDataTable>

              <!-- 行アクション: 簡易な別テーブル操作を補完するため、下に選択不要の操作ガイドを提示 -->
              <div class="mt-3 text-xs text-secondary">
                <span class="me-2">💡 ヒント:</span>
                <span class="me-2">プロジェクト行をクリックで詳細ページへ移動</span>
                <span class="me-2">列ヘッダーでソート可能</span>
                <span class="me-2">上部フィルターで件数を絞り込み</span>
                      </div>

              <!-- フィルタ後にデータが無い場合の表示 -->
              <div v-if="filteredProjects.length === 0" class="mt-3">
                <EmptyState 
                  icon="folder_open" 
                  title="プロジェクトが見つかりません" 
                  subtitle="検索やフィルター条件を変更して再度お試しください"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新規作成モーダル -->
    <ProjectFormModal
      :show="showCreateModal"
      mode="create"
      :form-data="formData"
      :users="users"
      @close="showCreateModal = false"
      @submit="handleCreateProject"
    />

    <!-- 編集モーダル -->
    <ProjectFormModal
      :show="showEditModal"
      mode="edit"
      :form-data="formData"
      :users="users"
      @close="showEditModal = false"
      @submit="handleEditProject"
    />

    <!-- 削除確認モーダル -->
    <ProjectDeleteModal
      :show="showDeleteModal"
      :project="selectedProject"
      @close="showDeleteModal = false"
      @confirm="handleDeleteProject"
    />

    <!-- タスク管理モーダル（プロジェクト詳細ページ遷移に変更されたため削除） -->
  </div>
</template>

<style scoped>
/* テーブル行にカーソルポインター追加 */
.cursor-pointer :deep(tbody tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cursor-pointer :deep(tbody tr:hover) {
  background-color: rgba(233, 30, 99, 0.05);
}

/* テーブルホバーエフェクト */
.table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* ボタングループスタイリング */
.btn-group .btn {
  border-radius: 0.375rem;
}

.btn-group .btn:not(:last-child) {
  margin-right: 0.25rem;
}

/* ボタンアイコンスタイリング */
.btn i.material-symbols-rounded {
  font-size: 1.125rem;
  vertical-align: middle;
  line-height: 1;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.875rem;
  }
  
  .btn-group {
    flex-direction: column;
  }
  
  .btn-group .btn {
    margin-bottom: 0.25rem;
    margin-right: 0;
  }
}
</style>
