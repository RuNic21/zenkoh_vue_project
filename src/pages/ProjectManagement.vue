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

// Keep-Alive 캐싱을 위한 컴포넌트 이름 설정
defineOptions({
  name: 'ProjectManagement'
});

// using useProjectManagement composable; no local refs required
import { onActivated } from "vue";
import { useProjectManagement } from "@/composables/useProjectManagement";
import { useRouter } from "vue-router";
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

// Router インスタンスを取得
const router = useRouter();

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
