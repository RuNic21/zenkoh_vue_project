<script setup lang="ts">
// レポートページコンポーネント
// 目的: プロジェクト・タスク・ユーザーの統計レポートを表示・生成

import { ref, computed, onMounted, reactive } from "vue";
import { generateReport, generateTaskStatusChartData, generatePriorityChartData } from "../services/reportService";
import { listProjects } from "../services/projectService";
import { supabase } from "../services/supabaseClient";
import type { 
  ReportData, 
  ReportOptions, 
  ReportFilter,
  ProjectProgressReport,
  TaskStatisticsReport,
  UserWorkloadReport,
  DeadlineReport,
  PriorityReport
} from "../types/report";
import ReportChart from "../components/Charts/ReportChart.vue";
import ReportChartBlock from "@/components/report/ReportChartBlock.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import CardHeader from "@/components/common/CardHeader.vue";
import ActionBar from "@/components/common/ActionBar.vue";
import { toCsv, downloadFile } from "@/utils/exportUtils";
import StatCards from "@/components/common/StatCards.vue";
import { formatDateJP, formatPercent } from "@/utils/formatters";

// TODO: 高度な分析機能の実装
// 1. 時間追跡・生産性分析 - 実際の作業時間 vs 計画時間の比較分析
// 2. バーンダウンチャート - プロジェクト進行に伴う残作業量の推移
// 3. ヒートマップ分析 - ユーザー別/プロジェクト別の活動パターン可視化

// TODO: 通知・アラート分析機能の実装
// 1. 通知統計ダッシュボード - notificationsテーブルを活用した送信状況・成功率分析
// 2. アラートルール効果性分析 - alert_rulesテーブルを活用したルールの効果測定
// 3. 通知パフォーマンス最適化 - 失敗通知の原因分析・改善提案

// TODO: チーム協力・依存関係分析の実装
// 1. チーム協力分析 - task_membersテーブルを活用した役割分布・協力パターン分析
// 2. タスク依存関係分析 - parent_task_idを活用した依存関係・クリティカルパス分析
// 3. クロスプロジェクト協力分析 - プロジェクト間の協力パターン可視化

// TODO: 高度な可視化機能の実装
// 1. ガントチャート - planned_start/end、actual_start/endを活用したプロジェクトタイムライン可視化
// 2. カンバンボード分析 - boards/board_columnsテーブルを活用したWIP制限・ボトルネック分析
// 3. 依存関係グラフ - タスク間の依存関係を視覚的に表示

// TODO: 予測分析・最適化機能の実装
// 1. プロジェクト完了予測 - 機械学習ベースの完了日予測・リスク要因分析
// 2. リソース最適化 - AIベースのワークロード最適化・スキルギャップ分析
// 3. 品質予測 - 過去のデータを基にした品質指標予測

// TODO: パフォーマンス・UX改善の実装
// 1. パフォーマンス最適化 - 大容量データ処理のためのインデックス・キャッシュ戦略
// 2. リアルタイム更新機能 - WebSocketを活用したリアルタイムデータ更新
// 3. モバイル対応 - レスポンシブチャート・タッチインターフェース対応
// 4. エクスポート機能拡張 - PDF、Excel、PowerBI連携などの多様なエクスポート形式

// レポートデータ
const reportData = ref<ReportData | null>(null);
const isLoading = ref(false);
const errorMessage = ref("");

// フィルター設定
const filter = reactive<ReportFilter>({
  dateRange: {
    start: null,
    end: null
  },
  projects: [],
  users: [],
  status: [],
  priority: []
});

// 利用可能なプロジェクト・ユーザー一覧
const availableProjects = ref<Array<{ id: number; name: string }>>([]);
const availableUsers = ref<Array<{ id: number; display_name: string }>>([]);

// アーカイブフィルター
const includeArchived = ref(false);

// レポート生成オプション
const reportOptions = computed((): ReportOptions => ({
  projectIds: filter.projects.length > 0 ? filter.projects : undefined,
  userIds: filter.users.length > 0 ? filter.users : undefined,
  dateRange: filter.dateRange.start && filter.dateRange.end ? {
    startDate: filter.dateRange.start.toISOString().split('T')[0],
    endDate: filter.dateRange.end.toISOString().split('T')[0]
  } : undefined,
  includeArchived: includeArchived.value
}));

// チャートデータ
const taskStatusChartData = computed(() => {
  if (!reportData.value || !reportData.value.taskStatistics) return null;
  return generateTaskStatusChartData(reportData.value.taskStatistics);
});

const priorityChartData = computed(() => {
  if (!reportData.value || !reportData.value.priorityReport || !Array.isArray(reportData.value.priorityReport)) {
    return null;
  }
  return generatePriorityChartData(reportData.value.priorityReport);
});

// プロジェクト進捗チャートデータ
const projectProgressChartData = computed(() => {
  if (!reportData.value || !reportData.value.projectProgress || !Array.isArray(reportData.value.projectProgress)) {
    return null;
  }
  
  return {
    labels: reportData.value.projectProgress.map(p => p.projectName),
    datasets: [{
      label: "進捗率 (%)",
      data: reportData.value.projectProgress.map(p => p.averageProgress),
      backgroundColor: reportData.value.projectProgress.map(p => {
        switch (p.status) {
          case "完了": return "#28a745";
          case "進行中": return "#007bff";
          case "遅延": return "#dc3545";
          default: return "#6c757d";
        }
      }),
      borderColor: reportData.value.projectProgress.map(p => {
        switch (p.status) {
          case "完了": return "#28a745";
          case "進行中": return "#007bff";
          case "遅延": return "#dc3545";
          default: return "#6c757d";
        }
      }),
      borderWidth: 1
    }]
  };
});

// ユーザー作業量チャートデータ
const userWorkloadChartData = computed(() => {
  if (!reportData.value || !reportData.value.userWorkload || !Array.isArray(reportData.value.userWorkload)) {
    return null;
  }
  
  return {
    labels: reportData.value.userWorkload.map(u => u.userName),
    datasets: [{
      label: "完了率 (%)",
      data: reportData.value.userWorkload.map(u => u.completionRate),
      backgroundColor: "#007bff",
      borderColor: "#0056b3",
      borderWidth: 1
    }]
  };
});

// 期限別レポートチャートデータ
const deadlineChartData = computed(() => {
  if (!reportData.value || !reportData.value.deadlineReport || !Array.isArray(reportData.value.deadlineReport)) {
    return null;
  }
  
  return {
    labels: reportData.value.deadlineReport.map(d => d.period),
    datasets: [{
      label: "タスク数",
      data: reportData.value.deadlineReport.map(d => d.taskCount),
      backgroundColor: reportData.value.deadlineReport.map(d => {
        switch (d.period) {
          case "今週": return "#28a745";
          case "来週": return "#007bff";
          case "今月": return "#ffc107";
          case "期限切れ": return "#dc3545";
          default: return "#6c757d";
        }
      }),
      borderColor: reportData.value.deadlineReport.map(d => {
        switch (d.period) {
          case "今週": return "#28a745";
          case "来週": return "#007bff";
          case "今月": return "#ffc107";
          case "期限切れ": return "#dc3545";
          default: return "#6c757d";
        }
      }),
      borderWidth: 1
    }]
  };
});

// レポート生成
const generateReportData = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = "";
    
    const result = await generateReport(reportOptions.value);
    
    if (result.success && result.data) {
      reportData.value = result.data;
    } else {
      errorMessage.value = result.error || "レポート生成に失敗しました";
      console.error("レポート生成エラー:", result.error);
    }
  } catch (error) {
    console.error("レポート生成中のエラー:", error);
    errorMessage.value = "レポート生成中にエラーが発生しました";
  } finally {
    isLoading.value = false;
  }
};

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

// プロジェクト・ユーザー一覧読み込み
const loadFilterOptions = async () => {
  try {
    // プロジェクト一覧取得
    const result = await listProjects();
    if (result.success && result.data) {
      availableProjects.value = result.data.map((p: any) => ({ id: p.id, name: p.name }));
    } else {
      availableProjects.value = [];
    }
    
    // ユーザー一覧取得
    const { data: users, error } = await supabase
      .from("users")
      .select("id, display_name")
      .eq("is_active", true);
    
    if (error) {
      console.error("ユーザー一覧取得エラー:", error);
      availableUsers.value = [];
    } else {
      availableUsers.value = users || [];
    }
  } catch (error) {
    console.error("フィルターオプション読み込みエラー:", error);
    availableProjects.value = [];
    availableUsers.value = [];
  }
};

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

// 初期化
onMounted(async () => {
  await loadFilterOptions();
  
  // データが存在する場合のみレポート生成
  if (availableProjects.value.length > 0 || availableUsers.value.length > 0) {
    await generateReportData();
  }
});

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
        <div class="card">
          <CardHeader title="レポートフィルター" />
          <div class="card-body">
            <ActionBar>
              <template #right>
                <button 
                  class="btn bg-gradient-primary me-2"
                  @click="generateReportData"
                  :disabled="isLoading"
                >
                  <i class="material-symbols-rounded me-1">refresh</i>
                  {{ isLoading ? "生成中..." : "レポート生成" }}
                </button>
                <button 
                  class="btn bg-gradient-success me-2"
                  @click="exportToCSV"
                  :disabled="!reportData"
                >
                  <i class="material-symbols-rounded me-1">download</i>
                  CSV エクスポート
                </button>
                <button 
                  class="btn bg-gradient-secondary"
                  @click="resetFilters"
                >
                  <i class="material-symbols-rounded me-1">clear</i>
                  フィルターリセット
                </button>
              </template>
            </ActionBar>
            <div class="row">
              <!-- プロジェクトフィルター -->
              <div class="col-md-3 col-sm-6 mb-3">
                <label class="form-label text-sm">プロジェクト</label>
                <select 
                  class="form-control" 
                  multiple 
                  v-model="filter.projects"
                  size="3"
                >
                  <option 
                    v-for="project in availableProjects" 
                    :key="project.id" 
                    :value="project.id"
                  >
                    {{ project.name }}
                  </option>
                  <option v-if="availableProjects.length === 0" disabled>
                    プロジェクトがありません
                  </option>
                </select>
                <small class="text-muted" v-if="availableProjects.length > 0">
                  {{ availableProjects.length }}件のプロジェクト
                </small>
              </div>

              <!-- ユーザーフィルター -->
              <div class="col-md-3 col-sm-6 mb-3">
                <label class="form-label text-sm">ユーザー</label>
                <select 
                  class="form-control" 
                  multiple 
                  v-model="filter.users"
                  size="3"
                >
                  <option 
                    v-for="user in availableUsers" 
                    :key="user.id" 
                    :value="user.id"
                  >
                    {{ user.display_name }}
                  </option>
                  <option v-if="availableUsers.length === 0" disabled>
                    ユーザーがありません
                  </option>
                </select>
                <small class="text-muted" v-if="availableUsers.length > 0">
                  {{ availableUsers.length }}人のユーザー
                </small>
              </div>

              <!-- 日付範囲フィルター -->
              <div class="col-md-3 col-sm-6 mb-3">
                <label class="form-label text-sm">開始日</label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="filter.dateRange.start"
                >
              </div>

              <div class="col-md-3 col-sm-6 mb-3">
                <label class="form-label text-sm">終了日</label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="filter.dateRange.end"
                >
              </div>
            </div>

            <!-- 追加フィルター行 -->
            <div class="row">
              <!-- ステータスフィルター -->
              <div class="col-md-3 col-sm-6 mb-3">
                <label class="form-label text-sm">タスクステータス</label>
                <select 
                  class="form-control" 
                  multiple 
                  v-model="filter.status"
                  size="3"
                >
                  <option value="NOT_STARTED">未開始</option>
                  <option value="IN_PROGRESS">進行中</option>
                  <option value="BLOCKED">ブロック</option>
                  <option value="DONE">完了</option>
                  <option value="CANCELLED">キャンセル</option>
                </select>
              </div>

              <!-- 優先度フィルター -->
              <div class="col-md-3 col-sm-6 mb-3">
                <label class="form-label text-sm">優先度</label>
                <select 
                  class="form-control" 
                  multiple 
                  v-model="filter.priority"
                  size="3"
                >
                  <option value="LOW">低</option>
                  <option value="MEDIUM">中</option>
                  <option value="HIGH">高</option>
                  <option value="URGENT">緊急</option>
                </select>
              </div>

              <!-- アーカイブフィルター -->
              <div class="col-md-3 col-sm-6 mb-3">
                <label class="form-label text-sm">アーカイブ</label>
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    v-model="includeArchived"
                    id="includeArchived"
                  >
                  <label class="form-check-label" for="includeArchived">
                    アーカイブされたデータを含む
                  </label>
                </div>
              </div>
            </div>

            <!-- アクションボタン -->
            <div class="row">
              <div class="col-12">
                <button 
                  class="btn bg-gradient-primary me-2"
                  @click="generateReportData"
                  :disabled="isLoading"
                >
                  <i class="material-symbols-rounded me-1">refresh</i>
                  {{ isLoading ? "生成中..." : "レポート生成" }}
                </button>
                
                <button 
                  class="btn bg-gradient-success me-2"
                  @click="exportToCSV"
                  :disabled="!reportData"
                >
                  <i class="material-symbols-rounded me-1">download</i>
                  CSV エクスポート
                </button>
                
                <button 
                  class="btn bg-gradient-secondary"
                  @click="resetFilters"
                >
                  <i class="material-symbols-rounded me-1">clear</i>
                  フィルターリセット
                </button>
              </div>
            </div>
            <!-- 追加フィルターは重複のため削除 -->
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

      <!-- 詳細テーブル -->
      <div class="row">
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
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">状態</th>
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
                        <StatusBadge :status="project.status" />
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
