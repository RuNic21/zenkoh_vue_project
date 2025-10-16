<script setup lang="ts">
import { ref } from "vue";
import { useScheduleList } from "@/composables/useScheduleList";
import { getProgressBarClass } from "../utils/uiHelpers";
import type { ScheduleItem } from "../types/schedule";
import type { Project } from "../types/project";

// 共通コンポーネントのインポート
import PageHeader from "../components/common/PageHeader.vue";
import ActionBar from "../components/common/ActionBar.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityBadge from "../components/common/PriorityBadge.vue";
import LoadingSpinner from "../components/common/LoadingSpinner.vue";
import EmptyState from "../components/common/EmptyState.vue";
import CardHeader from "../components/common/CardHeader.vue";
import StatCards from "../components/common/StatCards.vue";
import ModalShell from "../components/common/ModalShell.vue";

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
  schedules,
  isLoading,
  errorMessage,
  projects,
  filterStatus,
  searchQuery,
  selectedProjectId,
  handleFilterUpdate,
  groupedSchedules,
  projectStats,
  addNewSchedule,
  editSchedule,
  deleteSchedule,
  viewDetails,
} = useScheduleList();
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
                  value: schedules.length, 
                  icon: 'task', 
                  color: 'success',
                  footer: '全タスク'
                },
                { 
                  label: '完了タスク', 
                  value: schedules.filter(s => s.status === 'DONE').length, 
                  icon: 'check_circle', 
                  color: 'info',
                  footer: '完了済み'
                },
                { 
                  label: '進行中タスク', 
                  value: schedules.filter(s => s.status === 'IN_PROGRESS').length, 
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

    <!-- フィルターと検索 -->
    <ActionBar
      :search-query="searchQuery"
      :search-placeholder="'タスク名、説明、担当者、プロジェクトで検索'"
      @update:search-query="searchQuery = $event"
      :filters="[
        {
          key: 'status',
          label: 'ステータス',
          type: 'select',
          value: filterStatus,
          options: [
            { value: 'all', label: 'すべてのステータス' },
            { value: 'NOT_STARTED', label: '未開始' },
            { value: 'IN_PROGRESS', label: '進行中' },
            { value: 'DONE', label: '完了' },
            { value: 'BLOCKED', label: 'ブロック' },
            { value: 'CANCELLED', label: 'キャンセル' }
          ]
        },
        {
          key: 'project',
          label: 'プロジェクト',
          type: 'select',
          value: selectedProjectId,
          options: [
            { value: null, label: 'すべてのプロジェクト' },
            ...projects.map(p => ({ value: p.id, label: p.name }))
          ]
        }
      ]"
      @update:filter="handleFilterUpdate"
      :actions="[
        {
          label: '詳細フィルター',
          icon: 'filter_list',
          variant: 'outline-secondary'
        }
      ]"
    />

    <!-- プロジェクト別タスク一覧 -->
    <div class="project-groups">
      <div 
        v-for="(tasks, projectName) in groupedSchedules" 
        :key="projectName"
        class="project-group mb-5"
      >
        <!-- プロジェクトヘッダー -->
        <div class="project-header mb-4">
          <div class="card">
            <div class="card-header pb-0">
              <div class="d-flex justify-content-between align-items-center">
                <div class="flex-grow-1">
                  <h5 class="mb-1 font-weight-bold text-primary">
                    <i class="material-symbols-rounded me-2">folder</i>
                    {{ projectName }}
                  </h5>
                  <p class="text-sm text-muted mb-0">
                    {{ tasks.length }}個のタスク
                  </p>
                </div>
                <div class="project-stats">
                  <div class="d-flex gap-3">
                    <div class="text-center">
                      <div class="text-sm font-weight-bold text-success">{{ projectStats[projectName]?.completed || 0 }}</div>
                      <div class="text-xs text-muted">完了</div>
                    </div>
                    <div class="text-center">
                      <div class="text-sm font-weight-bold text-warning">{{ projectStats[projectName]?.inProgress || 0 }}</div>
                      <div class="text-xs text-muted">進行中</div>
                    </div>
                    <div class="text-center">
                      <div class="text-sm font-weight-bold text-info">{{ projectStats[projectName]?.pending || 0 }}</div>
                      <div class="text-xs text-muted">予定</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- タスクカード一覧 -->
        <div class="row">
          <div 
            v-for="schedule in tasks" 
            :key="schedule.id"
            class="col-lg-6 col-xl-4 mb-4"
          >
            <div class="card h-100 task-card">
              <!-- カードヘッダー -->
              <div class="card-header pb-0">
                <div class="d-flex justify-content-between align-items-start">
                  <div class="flex-grow-1">
                    <h6 class="mb-1 font-weight-bold">{{ schedule.title }}</h6>
                    <p class="text-sm text-muted mb-0">{{ schedule.description }}</p>
                  </div>
                  <div class="dropdown">
                    <button 
                      class="btn btn-link text-muted p-0"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i class="material-symbols-rounded">more_vert</i>
                    </button>
                    <ul class="dropdown-menu">
                      <li>
                        <a 
                          class="dropdown-item" 
                          href="javascript:;"
                          @click="editSchedule(schedule.id)"
                        >
                          <i class="material-symbols-rounded me-2">edit</i>
                          編集
                        </a>
                      </li>
                      <li>
                        <a 
                          class="dropdown-item text-danger" 
                          href="javascript:;"
                          @click="deleteSchedule(schedule.id)"
                        >
                          <i class="material-symbols-rounded me-2">delete</i>
                          削除
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- カードボディ -->
              <div class="card-body pt-0">
                <!-- ステータスと優先度 -->
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <StatusBadge :status="schedule.status" />
                  <PriorityBadge :priority="schedule.priority" />
                </div>

                <!-- 担当者 -->
                <div class="d-flex align-items-center mb-3">
                  <div class="avatar avatar-sm bg-gradient-secondary me-2">
                    <i class="material-symbols-rounded text-white">person</i>
                  </div>
                  <div>
                    <p class="text-sm mb-0 font-weight-bold">担当者</p>
                    <p class="text-xs text-muted mb-0">{{ schedule.assignee }}</p>
                  </div>
                </div>

                <!-- 進捗バー -->
                <div class="mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="text-sm font-weight-bold">進捗</span>
                    <span class="text-sm text-muted">{{ schedule.progress }}%</span>
                  </div>
                  <div class="progress">
                    <div 
                      :class="getProgressBarClass(schedule.progress)" 
                      :style="{ width: schedule.progress + '%' }"
                      role="progressbar"
                    ></div>
                  </div>
                </div>

                <!-- 日付情報 -->
                <div class="row text-center">
                  <div class="col-6">
                    <p class="text-xs text-muted mb-0">開始日</p>
                    <p class="text-sm font-weight-bold mb-0">{{ schedule.startDate }}</p>
                  </div>
                  <div class="col-6">
                    <p class="text-xs text-muted mb-0">終了日</p>
                    <p class="text-sm font-weight-bold mb-0">{{ schedule.endDate }}</p>
                  </div>
                </div>
              </div>

              <!-- カードフッター -->
              <div class="card-footer pt-0">
                <div class="d-flex justify-content-between">
                  <button 
                    class="btn btn-outline-primary btn-sm"
                    @click="editSchedule(schedule.id)"
                  >
                    <i class="material-symbols-rounded me-1">edit</i>
                    編集
                  </button>
                  <button class="btn btn-outline-info btn-sm" @click="viewDetails(schedule.id)">
                    <i class="material-symbols-rounded me-1">visibility</i>
                    詳細
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  </div>
</template>

<style scoped>
/* プロジェクト別タスク一覧ページのスタイリング */
.schedule-list-page {
  padding: 1rem;
}

/* プロジェクトグループのスタイリング */
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
