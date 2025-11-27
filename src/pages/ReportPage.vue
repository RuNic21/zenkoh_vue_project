<script setup lang="ts">
// レポートページコンポーネント
// 目的: プロジェクト・タスク・ユーザーの統計レポートを表示・生成

import { ref, computed, onActivated } from "vue";
import { useReportPage } from "@/composables/useReportPage";
import { useMessage } from "@/composables/useMessage";
import type { 
  ReportData, 
  ReportOptions, 
  ReportFilter
} from "../types/report";
import ReportChartBlock from "@/components/report/ReportChartBlock.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import PriorityBadge from "@/components/common/PriorityBadge.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import ModalShell from "@/components/common/ModalShell.vue";
import { toCsv, downloadFile, exportToExcel, exportToPdf } from "@/utils/exportUtils";
import StatCards from "@/components/common/StatCards.vue";
import ReportFilters from "@/components/report/ReportFilters.vue";
import GanttChart from "@/components/report/GanttChart.vue";
import DependencyGraph from "@/components/report/DependencyGraph.vue";

// レポート状態は composable に集約
const {
  reportData,
  isLoading,
  errorMessage,
  filter,
  availableProjects,
  availableUsers,
  includeArchived,
  reportOptions,
  taskStatusChartData,
  priorityChartData,
  projectProgressChartData,
  userWorkloadChartData,
  deadlineChartData,
  generateReportData,
  // Phase 1: 高度な可視化
  ganttData,
  isLoadingGantt,
  dependencyGraphData,
  dependencyAnalysis,
  isLoadingDependency,
  loadGanttData,
  loadDependencyGraphData,
  loadAdvancedVisualizationData,
} = useReportPage();

const { showError, showSuccess } = useMessage();

// フィルター候補は composable 初期化時に読み込み済み

// プロジェクト詳細モーダル
const showProjectDetailModal = ref(false);
const selectedProjectDetail = ref<any>(null);


// チャートデータは composable から取得

// レポート生成は composable の generateReportData を使用

// フィルターリセット
const resetFilters = () => {
  filter.dateRange.start = null;
  filter.dateRange.end = null;
  filter.projects = [];
  filter.users = [];
  filter.status = [];
  filter.priority = [];
  includeArchived.value = false;
};

// Keep-Alive: ページが再度アクティブになったときにデータを更新
onActivated(async () => {
  console.log("ReportPage ページが再アクティブ化されました");
  // 詳細ページから戻ってきたときに最新のデータで再生成
  await generateReportData();
});

// ==================== Phase 1: エクスポート機能 ====================

// レポートエクスポート（CSV）
const exportToCSV = () => {
  if (!reportData.value || !reportData.value.projectProgress || !Array.isArray(reportData.value.projectProgress)) {
    return;
  }
  
  // プロジェクト進捗レポートをCSV形式でエクスポート（共通ユーティリティ使用）
  const rows: Array<Array<string | number>> = [
    ["プロジェクト名", "担当者", "総タスク数", "完了タスク数", "進行中タスク数", "未開始タスク数", "期限切れタスク数", "平均進捗率", "状態"],
    ...reportData.value.projectProgress.map(p => [
      p.projectName,
      p.ownerName,
      p.totalTasks,
      p.completedTasks,
      p.inProgressTasks,
      p.notStartedTasks,
      p.overdueTasks,
      p.averageProgress,
      p.status
    ])
  ];
  const csvContent = toCsv(rows);
  downloadFile(csvContent, `project_report_${new Date().toISOString().split('T')[0]}.csv`);
};

// Excelエクスポート
const handleExportToExcel = async () => {
  if (!reportData.value) {
    showError("レポートデータがありません");
    return;
  }

  try {
    await exportToExcel(reportData.value, {
      filename: `report_${new Date().toISOString().split("T")[0]}.xlsx`
    });
    showSuccess("Excelエクスポートが完了しました");
  } catch (error) {
    console.error("Excelエクスポート失敗:", error);
    showError("Excelエクスポートに失敗しました");
  }
};

// PDFエクスポート
const handleExportToPdf = async () => {
  if (!reportData.value) {
    showError("レポートデータがありません");
    return;
  }

  try {
    await exportToPdf(reportData.value, {
      filename: `report_${new Date().toISOString().split("T")[0]}.pdf`,
      title: "プロジェクトレポート",
      includeTables: true,
      pageOrientation: "landscape"
    });
    showSuccess("PDFエクスポートが完了しました");
  } catch (error) {
    console.error("PDFエクスポート失敗:", error);
    showError("PDFエクスポートに失敗しました");
  }
};

// プロジェクトの優先度を取得（進捗率と期限切れタスク数に基づく）
const getProjectPriority = (project: any): "LOW" | "MEDIUM" | "HIGH" | "URGENT" => {
  const progress = project.averageProgress || 0;
  const overdueTasks = project.overdueTasks || 0;
  const totalTasks = project.totalTasks || 0;
  
  // 期限切れタスクが多い場合は緊急
  if (overdueTasks > 0 && overdueTasks / totalTasks > 0.3) {
    return "URGENT";
  }
  
  // 進捗率が低く、期限切れタスクがある場合は高優先度
  if (progress < 50 && overdueTasks > 0) {
    return "HIGH";
  }
  
  // 進捗率が低い場合は中優先度
  if (progress < 70) {
    return "MEDIUM";
  }
  
  // それ以外は低優先度
  return "LOW";
};

// プロジェクト詳細を表示
const showProjectDetail = (project: any) => {
  selectedProjectDetail.value = project;
  showProjectDetailModal.value = true;
};

// プロジェクト詳細モーダルを閉じる
const closeProjectDetailModal = () => {
  showProjectDetailModal.value = false;
  selectedProjectDetail.value = null;
};

// 初期化
// 初期化は composable 側で実施済み

</script>

<template>
  <div class="container-fluid">
    <PageHeader 
      title="レポート"
      description="プロジェクト・タスク・ユーザーの統計情報を確認できます。"
    />

    <!-- フィルター・アクションパネル -->
    <div class="row mb-4">
      <div class="col-12">
        <ReportFilters 
          :filter="filter"
          :available-projects="availableProjects"
          :available-users="availableUsers"
          :include-archived="includeArchived"
          @reset="resetFilters"
          @generate="generateReportData"
          @update:includeArchived="(v:boolean)=> includeArchived = v"
        />
      </div>
    </div>

    <!-- Phase 1: エクスポートボタン -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h6 class="mb-3">
              <i class="material-symbols-rounded me-2">download</i>
              レポートエクスポート
            </h6>
            <div class="btn-group" role="group">
              <button
                type="button"
                class="btn btn-outline-success"
                @click="exportToCSV"
                :disabled="!reportData"
              >
                <i class="material-symbols-rounded me-1">table_chart</i>
                CSV
              </button>
              <button
                type="button"
                class="btn btn-outline-primary"
                @click="handleExportToExcel"
                :disabled="!reportData"
              >
                <i class="material-symbols-rounded me-1">description</i>
                Excel
              </button>
              <button
                type="button"
                class="btn btn-outline-danger"
                @click="handleExportToPdf"
                :disabled="!reportData"
              >
                <i class="material-symbols-rounded me-1">picture_as_pdf</i>
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- エラーメッセージ -->
    <div v-if="errorMessage" class="row mb-4">
      <div class="col-12">
        <div class="alert alert-danger" role="alert">
          <i class="material-symbols-rounded me-2">error</i>
          {{ errorMessage }}
        </div>
      </div>
    </div>

    <!-- レポートデータ表示 -->
    <div v-if="reportData && !isLoading">
      <!-- 統計サマリー -->
      <StatCards
        class="mb-4"
        :items="[
          { label: '総タスク数', value: reportData.taskStatistics?.totalTasks || 0, icon: 'task', color: 'primary' },
          { label: '完了タスク', value: reportData.taskStatistics?.completedTasks || 0, icon: 'check_circle', color: 'success' },
          { label: '完了率', value: `${reportData.taskStatistics?.completionRate || 0}%`, icon: 'trending_up', color: 'info' },
          { label: '期限切れ', value: reportData.taskStatistics?.overdueTasks || 0, icon: 'warning', color: 'warning' }
        ]"
      />

      <!-- チャート表示 -->
      <div class="row mb-4">
        <div class="col-lg-6 col-md-12 mb-4">
          <ReportChartBlock 
            v-if="taskStatusChartData"
            title="タスクステータス分布"
            :data="taskStatusChartData"
            type="doughnut"
            :height="300"
          />
        </div>
        <div class="col-lg-6 col-md-12 mb-4">
          <ReportChartBlock 
            v-if="priorityChartData"
            title="優先度別タスク分布"
            :data="priorityChartData"
            type="bar"
            :height="300"
          />
        </div>
      </div>

      <div class="row mb-4">
        <div class="col-12">
          <ReportChartBlock 
            v-if="projectProgressChartData"
            title="プロジェクト別進捗率"
            :data="projectProgressChartData"
            type="bar"
            :height="400"
          />
        </div>
      </div>

      <div class="row mb-4">
        <div class="col-12">
          <ReportChartBlock 
            v-if="userWorkloadChartData"
            title="ユーザー別完了率"
            :data="userWorkloadChartData"
            type="bar"
            :height="400"
          />
        </div>
      </div>

      <div class="row mb-4">
        <div class="col-12">
          <ReportChartBlock 
            v-if="deadlineChartData"
            title="期限別タスク分布"
            :data="deadlineChartData"
            type="bar"
            :height="400"
          />
        </div>
      </div>

      <!-- ==================== Phase 1: 高度な可視化 ==================== -->
      
      <!-- ガントチャート -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header pb-0 d-flex justify-content-between align-items-center">
              <h6>
                <i class="material-symbols-rounded me-2">calendar_view_month</i>
                プロジェクトタイムライン（ガントチャート）
              </h6>
              <button
                v-if="!isLoadingGantt"
                class="btn btn-sm btn-outline-primary"
                @click="loadGanttData"
              >
                <i class="material-symbols-rounded me-1">refresh</i>
                更新
              </button>
            </div>
            <div class="card-body">
              <LoadingSpinner v-if="isLoadingGantt" message="ガントチャートを読み込み中..." />
              <GanttChart
                v-else
                :tasks="ganttData"
                :height="450"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 依存関係グラフ -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header pb-0 d-flex justify-content-between align-items-center">
              <h6>
                <i class="material-symbols-rounded me-2">account_tree</i>
                タスク依存関係グラフ
              </h6>
              <button
                v-if="!isLoadingDependency"
                class="btn btn-sm btn-outline-primary"
                @click="loadDependencyGraphData"
              >
                <i class="material-symbols-rounded me-1">refresh</i>
                更新
              </button>
            </div>
            <div class="card-body">
              <LoadingSpinner v-if="isLoadingDependency" message="依存関係グラフを読み込み中..." />
              <DependencyGraph
                v-else
                :graph-data="dependencyGraphData"
                :analysis="dependencyAnalysis"
                :height="500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 詳細テーブル -->
      <div class="row mb-4">
        <!-- プロジェクト進捗テーブル -->
        <div class="col-12">
          <div class="card">
            <div class="card-header pb-0">
              <h6>プロジェクト進捗詳細</h6>
            </div>
            <div class="card-body px-0 pt-0 pb-2">
              <div class="table-responsive p-0">
                <table class="table align-items-center mb-0">
                  <thead>
                    <tr>
                      <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">プロジェクト名</th>
                      <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">担当者</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">総タスク</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">完了</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">進行中</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">未開始</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">期限切れ</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">進捗率</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">優先度</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">状態</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="project in (reportData.projectProgress || [])" :key="project.projectId">
                      <td>
                        <div class="d-flex px-3 py-1">
                          <div class="d-flex flex-column justify-content-center">
                            <h6 class="mb-0 text-sm">{{ project.projectName }}</h6>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p class="text-xs font-weight-bold mb-0">{{ project.ownerName }}</p>
                      </td>
                      <td class="align-middle text-center">
                        <span class="text-xs font-weight-bold">{{ project.totalTasks }}</span>
                      </td>
                      <td class="align-middle text-center">
                        <span class="text-xs font-weight-bold text-success">{{ project.completedTasks }}</span>
                      </td>
                      <td class="align-middle text-center">
                        <span class="text-xs font-weight-bold text-primary">{{ project.inProgressTasks }}</span>
                      </td>
                      <td class="align-middle text-center">
                        <span class="text-xs font-weight-bold text-secondary">{{ project.notStartedTasks }}</span>
                      </td>
                      <td class="align-middle text-center">
                        <span class="text-xs font-weight-bold text-warning">{{ project.overdueTasks }}</span>
                      </td>
                      <td class="align-middle text-center">
                        <span class="text-xs font-weight-bold">{{ project.averageProgress }}%</span>
                      </td>
                      <td class="align-middle text-center">
                        <PriorityBadge :priority="getProjectPriority(project)" />
                      </td>
                      <td class="align-middle text-center">
                        <StatusBadge :status="project.status" />
                      </td>
                      <td class="align-middle text-center">
                        <button 
                          class="btn btn-sm bg-gradient-info"
                          @click="showProjectDetail(project)"
                        >
                          <i class="material-symbols-rounded me-1">visibility</i>
                          詳細
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ローディング表示 -->
    <div v-if="isLoading" class="row">
      <div class="col-12">
        <LoadingSpinner message="レポートを生成中..." />
      </div>
    </div>

    <!-- データなし表示 -->
    <div v-if="!reportData && !isLoading && !errorMessage" class="row">
      <div class="col-12">
        <EmptyState 
          icon="assessment" 
          title="レポートデータがありません" 
          subtitle="プロジェクトやタスクが存在しないか、フィルター条件に一致するデータがありません"
        >
          <template #actions>
            <button class="btn bg-gradient-primary" @click="generateReportData">
              <i class="material-symbols-rounded me-1">refresh</i>
              レポートを生成
            </button>
          </template>
        </EmptyState>
      </div>
    </div>

    <!-- プロジェクト詳細モーダル -->
    <ModalShell 
      :show="showProjectDetailModal" 
      title="プロジェクト詳細" 
      size="lg" 
      @close="closeProjectDetailModal"
    >
      <template #default>
        <div v-if="selectedProjectDetail">
          <div class="row mb-3">
            <div class="col-md-6">
              <h6>プロジェクト名</h6>
              <p class="text-sm">{{ selectedProjectDetail.projectName }}</p>
            </div>
            <div class="col-md-6">
              <h6>担当者</h6>
              <p class="text-sm">{{ selectedProjectDetail.ownerName }}</p>
            </div>
          </div>
          
          <div class="row mb-3">
            <div class="col-md-3">
              <h6>総タスク数</h6>
              <p class="text-sm font-weight-bold">{{ selectedProjectDetail.totalTasks }}</p>
            </div>
            <div class="col-md-3">
              <h6>完了タスク</h6>
              <p class="text-sm font-weight-bold text-success">{{ selectedProjectDetail.completedTasks }}</p>
            </div>
            <div class="col-md-3">
              <h6>進行中タスク</h6>
              <p class="text-sm font-weight-bold text-primary">{{ selectedProjectDetail.inProgressTasks }}</p>
            </div>
            <div class="col-md-3">
              <h6>未開始タスク</h6>
              <p class="text-sm font-weight-bold text-secondary">{{ selectedProjectDetail.notStartedTasks }}</p>
            </div>
          </div>
          
          <div class="row mb-3">
            <div class="col-md-4">
              <h6>期限切れタスク</h6>
              <p class="text-sm font-weight-bold text-warning">{{ selectedProjectDetail.overdueTasks }}</p>
            </div>
            <div class="col-md-4">
              <h6>平均進捗率</h6>
              <p class="text-sm font-weight-bold">{{ selectedProjectDetail.averageProgress }}%</p>
            </div>
            <div class="col-md-4">
              <h6>優先度</h6>
              <PriorityBadge :priority="getProjectPriority(selectedProjectDetail)" />
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <h6>状態</h6>
              <StatusBadge :status="selectedProjectDetail.status" />
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="closeProjectDetailModal">閉じる</button>
      </template>
    </ModalShell>
  </div>
</template>

<style scoped>
/* レポートページ専用スタイル */
.card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* チャートコンテナ */
.chart-container {
  position: relative;
  width: 100%;
}

/* テーブルスタイル */
.table th {
  background-color: #f8f9fa;
  border-top: none;
}

.table td {
  vertical-align: middle;
}

/* バッジスタイル */
.badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .container-fluid {
    padding-left: 15px;
    padding-right: 15px;
  }
  
  .card-body {
    padding: 1rem;
  }
}
</style>
