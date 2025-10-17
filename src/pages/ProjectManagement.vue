<script setup lang="ts">
// プロジェクト管理ページ: プロジェクトの一覧表示・作成・編集・削除機能
// 
// TODO: 今後の機能追加予定（データベーススキーマ分析に基づく実装可能機能）
//
// ===== 第1段階: 即時実装可能（既存サービス活用） =====
//
// 1. プロジェクト進行率チャート・視覚化（Chart.js使用）
//    - プロジェクト別進行率比較チャート（tasks.progress_percent利用）
//    - タスク状態別分布パイチャート（tasks.status: NOT_STARTED, IN_PROGRESS, BLOCKED, DONE, CANCELLED）
//    - 担当者別作業量分布チャート（tasks.primary_assignee_id + usersテーブル結合）
//    - 月別プロジェクト作成・完了数推移（projects.created_at, tasks.actual_end利用）
//    - 実装：dashboardService.getProjectStats()を拡張してチャートデータを提供
//
// 2. 高度な検索・フィルタリング（既存フィルタリングロジック拡張）
//    - 複数条件検索（プロジェクト名、説明、担当者、状態、優先度の組み合わせ）
//    - WBSコードを用いた検索（tasks.wbs_code利用）
//    - 優先度別フィルタリング（tasks.priority: LOW, MEDIUM, HIGH, URGENT）
//    - 日付範囲検索（projects.start_date, end_date, tasks.planned_start, planned_end）
//    - 保存済み検索条件（ローカルストレージ利用）
//    - ソートオプション拡張（進捗率、締切日、優先度、作成日など）
//
// 3. プロジェクトデータエクスポート（既存CSVエクスポートスクリプト活用）
//    - CSVエクスポート（プロジェクト＋関連タスクデータ）
//    - PDFレポート生成（プロジェクト現況要約）
//    - Excelエクスポート（チャート含む）
//    - プロジェクト現況サマリーレポート（統計＋進捗）
//    - 実装：scripts/export-csv.mjsを拡張してプロジェクト別詳細エクスポート
//
// ===== 第2段階: 中難易度（新規サービス開発） =====
//
// 4. プロジェクト別カンバンボード（boards, board_columnsテーブル利用）
//    - boards, board_columnsテーブル活用
//    - タスクをカラムごとにドラッグ＆ドロップ（tasks.current_column_id更新）
//    - WIP制限設定（board_columns.wip_limit利用）
//    - カラムごとのタスク数表示（リアルタイムカウント）
//    - カンバンボードの作成・編集機能
//    - 実装：新規boardService.ts開発が必要
//
// 5. プロジェクトメンバー管理（task_membersテーブル利用）
//    - task_membersテーブル利用（task_id, user_id, role）
//    - メンバー追加・削除機能（OWNER, CONTRIBUTOR, REVIEWER役割）
//    - 役割管理（権限ごとの機能制限）
//    - メンバー別作業量表示（担当タスク数、進捗率）
//    - プロジェクト別メンバー現況ダッシュボード
//    - 実装：task_membersテーブルCRUDサービス開発
//
// 6. プロジェクトタイムラインビュー（ガントチャート）
//    - プロジェクト開始日～終了日の視覚化（projects.start_date, end_date）
//    - マイルストーン表示（重要タスクハイライト）
//    - 進捗率をタイムラインに反映（tasks.progress_percent）
//    - ドラッグ＆ドロップでスケジュール調整（planned_start, planned_end更新）
//    - 依存関係表示（parent_task_id利用）
//    - 実装：Chart.jsまたは専用ガントチャートライブラリ利用
//
// ===== 第3段階: 高度機能（複合実装） =====
//
// 7. 通知・通知ルール管理（alert_rules, notificationsテーブル利用）
//    - alert_rulesテーブル利用（rule_type: DUE_SOON, OVERDUE, NO_PROGRESS, CUSTOM）
//    - DUE_SOON, OVERDUE, NO_PROGRESS通知（tasks.planned_end基準）
//    - メール通知設定（alert_rules.notify_email）
//    - 通知履歴確認（notificationsテーブル）
//    - カスタム通知ルール作成（alert_rules.params_json利用）
//    - 実装：notificationService.ts拡張、バックグラウンド通知処理
//
// 8. プロジェクトテンプレート（既存プロジェクト構造複製）
//    - よく使うプロジェクト構造テンプレート
//    - 基本タスクテンプレート（基本タスクセット）
//    - テンプレート適用による素早いプロジェクト作成
//    - カンバンボードテンプレート（boards, board_columns複製）
//    - 実装：プロジェクト＋関連データ一括複製機能
//
// 9. プロジェクト成果分析ダッシュボード
//    - プロジェクト別ROI分析（時間対比完了率）
//    - 担当者別生産性分析（完了タスク数、平均所要時間）
//    - プロジェクトリスク分析（遅延タスク、ブロックタスク）
//    - 予測分析（過去データによる完了予測日）
//    - 実装：高度な統計クエリと可視化
//
// 10. プロジェクト協働機能
//    - リアルタイムアップデート（WebSocketまたはSupabase Realtime）
//    - コメントシステム（タスクごとのコメント）
//    - ファイル添付機能（タスク関連ドキュメント）
//    - アクティビティログ（プロジェクト変更履歴）
//    - 実装：Supabase Realtime＋ファイルストレージ活用

// using useProjectManagement composable; no local refs required
import { useProjectManagement } from "@/composables/useProjectManagement";
import PerformanceOptimizedTable from "../components/table/PerformanceOptimizedTable.vue";
import ProjectFilterPanel from "../components/project/ProjectFilterPanel.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import CardHeader from "@/components/common/CardHeader.vue";
import ActionBar from "@/components/common/ActionBar.vue";
import StatCards from "@/components/common/StatCards.vue";
import ModalShell from "@/components/common/ModalShell.vue";
import { formatPercent, truncate } from "@/utils/formatters";
const {
  projects,
  users,
  isLoading,
  errorMessage,
  projectStats,
  projectDetailStats,
  showCreateModal,
  showEditModal,
  showDeleteModal,
  selectedProject,
  formData,
  searchQuery,
  statusFilter,
  dateFilter,
  clearFilters,
  filteredProjects,
  projectCurrentPage,
  projectPageSize,
  projectSortColumn,
  projectSortDirection,
  projectTableColumns,
  projectTableRows,
  handleProjectSortChange,
  handleProjectPageChange,
  formatDate,
  getOwnerName,
  getProjectStatus,
  loadProjects,
  loadUsers,
  handleCreateProject,
  handleEditProject,
  handleDeleteProject,
  resetForm,
  openEditModal,
  openDeleteModal,
  loadDashboardStats,
  showProjectTasks,
} = useProjectManagement();

// composable を利用するため、以降のローカル定義は不要です
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
              <template #right>
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

    <!-- プロジェクト一覧 -->
    <div class="row">
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
              <PerformanceOptimizedTable
                :data="projectTableRows"
                :columns="projectTableColumns"
                :page-size="projectPageSize"
                :current-page="projectCurrentPage"
                :loading="isLoading"
                empty-message="プロジェクトが見つかりません"
                @page-change="handleProjectPageChange"
                @sort-change="handleProjectSortChange"
                @row-click="(row) => {
                  // 行クリックで該当プロジェクトのタスクモーダルを開く
                  const project = projects.find(p => p.id === row.id);
                  if (project) {
                    showProjectTasks(project);
                  }
                }"
              >
                <template #cell-status="{ value }">
                  <StatusBadge :status="value" />
                </template>
              </PerformanceOptimizedTable>

              <!-- 行アクション: 簡易な別テーブル操作を補完するため、下に選択不要の操作ガイドを提示 -->
              <div class="mt-3 text-xs text-secondary">
                <span class="me-2">操作:</span>
                <span class="me-2">行の「オーナー/状態」でソート可能</span>
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
    <ModalShell :show="showCreateModal" title="新しいプロジェクト作成" size="md" @close="showCreateModal = false">
      <template #default>
        <form>
              <div class="mb-3">
                <label class="form-label">プロジェクト名 <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="formData.name"
                  placeholder="プロジェクト名を入力してください"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">説明</label>
                <textarea 
                  class="form-control" 
                  v-model="formData.description"
                  placeholder="プロジェクトの説明を入力してください"
                  rows="3"
                ></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">プロジェクトオーナー</label>
                <select class="form-control" v-model="formData.owner_user_id">
                  <option :value="null">オーナーを選択してください</option>
                  <option 
                    v-for="user in users" 
                    :key="user.id" 
                    :value="user.id"
                  >
                    {{ user.display_name }}
                  </option>
                </select>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">開始日</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="formData.start_date"
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">終了日</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="formData.end_date"
                  >
                </div>
              </div>
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    v-model="formData.is_archived"
                    id="isArchived"
                  >
                  <label class="form-check-label" for="isArchived">
                    アーカイブ状態で作成
                  </label>
                </div>
              </div>
        </form>
      </template>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showCreateModal = false">キャンセル</button>
        <button type="button" class="btn bg-gradient-primary" @click="handleCreateProject">作成</button>
      </template>
    </ModalShell>

    <!-- 編集モーダル -->
    <ModalShell :show="showEditModal" title="プロジェクト編集" size="md" @close="showEditModal = false">
      <template #default>
        <form>
              <div class="mb-3">
                <label class="form-label">プロジェクト名 <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="formData.name"
                  placeholder="プロジェクト名を入力してください"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">説明</label>
                <textarea 
                  class="form-control" 
                  v-model="formData.description"
                  placeholder="プロジェクトの説明を入力してください"
                  rows="3"
                ></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">プロジェクトオーナー</label>
                <select class="form-control" v-model="formData.owner_user_id">
                  <option :value="null">オーナーを選択してください</option>
                  <option 
                    v-for="user in users" 
                    :key="user.id" 
                    :value="user.id"
                  >
                    {{ user.display_name }}
                  </option>
                </select>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">開始日</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="formData.start_date"
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">終了日</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="formData.end_date"
                  >
                </div>
              </div>
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    v-model="formData.is_archived"
                    id="isArchivedEdit"
                  >
                  <label class="form-check-label" for="isArchivedEdit">
                    アーカイブ状態
                  </label>
                </div>
              </div>
        </form>
      </template>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showEditModal = false">キャンセル</button>
        <button type="button" class="btn bg-gradient-primary" @click="handleEditProject">更新</button>
      </template>
    </ModalShell>

    <!-- 削除確認モーダル -->
    <ModalShell :show="showDeleteModal" title="プロジェクト削除確認" size="md" @close="showDeleteModal = false">
      <template #default>
        <p>以下のプロジェクトを削除してもよろしいですか？</p>
        <div class="alert alert-warning">
          <strong>{{ selectedProject?.name }}</strong>
          <br>
          <small>この操作は取り消すことができません。</small>
        </div>
      </template>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">キャンセル</button>
        <button type="button" class="btn bg-gradient-danger" @click="handleDeleteProject">削除</button>
      </template>
    </ModalShell>

    <!-- タスク管理モーダル（プロジェクト詳細ページ遷移に変更されたため削除） -->
  </div>
</template>

<style scoped>
/* モーダルスタイリング */
.modal {
  z-index: 1050;
}

.modal-dialog {
  margin-top: 5rem;
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
