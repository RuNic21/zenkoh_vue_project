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
  
  // プロジェクト進捗レポートをCSV形式でエクスポート
  const csvContent = [
    // ヘッダー
    ["プロジェクト名", "担当者", "総タスク数", "完了タスク数", "進行中タスク数", "未開始タスク数", "期限切れタスク数", "平均進捗率", "状態"].join(","),
    // データ行
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
    ].join(","))
  ].join("\n");
  
  // ファイルダウンロード
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `project_report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
    <!-- ページヘッダー -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="ms-3">
          <h3 class="mb-0 h4 font-weight-bolder">レポート</h3>
          <p class="mb-4">
            プロジェクト・タスク・ユーザーの統計情報を確認できます。
          </p>
        </div>
      </div>
    </div>

    <!-- フィルター・アクションパネル -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <h6>レポートフィルター</h6>
          </div>
          <div class="card-body">
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
      <div class="row mb-4">
        <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
          <div class="card">
            <div class="card-header p-2 ps-3">
              <div class="d-flex justify-content-between">
                <div>
                  <p class="text-sm mb-0 text-capitalize">総タスク数</p>
                  <h4 class="mb-0">{{ reportData.taskStatistics?.totalTasks || 0 }}</h4>
                </div>
                <div class="icon icon-md icon-shape bg-gradient-primary shadow-dark shadow text-center border-radius-lg">
                  <i class="material-symbols-rounded opacity-10">task</i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
          <div class="card">
            <div class="card-header p-2 ps-3">
              <div class="d-flex justify-content-between">
                <div>
                  <p class="text-sm mb-0 text-capitalize">完了タスク</p>
                  <h4 class="mb-0">{{ reportData.taskStatistics?.completedTasks || 0 }}</h4>
                </div>
                <div class="icon icon-md icon-shape bg-gradient-success shadow-dark shadow text-center border-radius-lg">
                  <i class="material-symbols-rounded opacity-10">check_circle</i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
          <div class="card">
            <div class="card-header p-2 ps-3">
              <div class="d-flex justify-content-between">
                <div>
                  <p class="text-sm mb-0 text-capitalize">完了率</p>
                  <h4 class="mb-0">{{ reportData.taskStatistics?.completionRate || 0 }}%</h4>
                </div>
                <div class="icon icon-md icon-shape bg-gradient-info shadow-dark shadow text-center border-radius-lg">
                  <i class="material-symbols-rounded opacity-10">trending_up</i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-sm-6">
          <div class="card">
            <div class="card-header p-2 ps-3">
              <div class="d-flex justify-content-between">
                <div>
                  <p class="text-sm mb-0 text-capitalize">期限切れ</p>
                  <h4 class="mb-0">{{ reportData.taskStatistics?.overdueTasks || 0 }}</h4>
                </div>
                <div class="icon icon-md icon-shape bg-gradient-warning shadow-dark shadow text-center border-radius-lg">
                  <i class="material-symbols-rounded opacity-10">warning</i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- チャート表示 -->
      <div class="row mb-4">
        <!-- タスクステータスチャート -->
        <div class="col-lg-6 col-md-12 mb-4">
          <div class="card">
            <div class="card-header pb-0">
              <h6>タスクステータス分布</h6>
            </div>
            <div class="card-body">
              <ReportChart 
                v-if="taskStatusChartData"
                :data="taskStatusChartData"
                type="doughnut"
                :height="300"
              />
            </div>
          </div>
        </div>

        <!-- 優先度別チャート -->
        <div class="col-lg-6 col-md-12 mb-4">
          <div class="card">
            <div class="card-header pb-0">
              <h6>優先度別タスク分布</h6>
            </div>
            <div class="card-body">
              <ReportChart 
                v-if="priorityChartData"
                :data="priorityChartData"
                type="bar"
                :height="300"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- プロジェクト進捗チャート -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header pb-0">
              <h6>プロジェクト別進捗率</h6>
            </div>
            <div class="card-body">
              <ReportChart 
                v-if="projectProgressChartData"
                :data="projectProgressChartData"
                type="bar"
                :height="400"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ユーザー作業量チャート -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header pb-0">
              <h6>ユーザー別完了率</h6>
            </div>
            <div class="card-body">
              <ReportChart 
                v-if="userWorkloadChartData"
                :data="userWorkloadChartData"
                type="bar"
                :height="400"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 期限別レポートチャート -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header pb-0">
              <h6>期限別タスク分布</h6>
            </div>
            <div class="card-body">
              <ReportChart 
                v-if="deadlineChartData"
                :data="deadlineChartData"
                type="bar"
                :height="400"
              />
            </div>
          </div>
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
                        <span 
                          :class="{
                            'badge bg-gradient-success': project.status === '完了',
                            'badge bg-gradient-primary': project.status === '進行中',
                            'badge bg-gradient-warning': project.status === '遅延',
                            'badge bg-gradient-secondary': project.status === '未開始'
                          }"
                        >
                          {{ project.status }}
                        </span>
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
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">読み込み中...</span>
          </div>
          <p class="text-sm text-secondary mt-3">レポートを生成中...</p>
        </div>
      </div>
    </div>

    <!-- データなし表示 -->
    <div v-if="!reportData && !isLoading && !errorMessage" class="row">
      <div class="col-12">
        <div class="text-center py-5">
          <i class="material-symbols-rounded text-secondary opacity-50" style="font-size: 64px;">assessment</i>
          <p class="text-sm text-secondary mt-3">レポートデータがありません</p>
          <p class="text-xs text-secondary mb-3">
            プロジェクトやタスクが存在しないか、フィルター条件に一致するデータがありません
          </p>
          <button class="btn bg-gradient-primary" @click="generateReportData">
            <i class="material-symbols-rounded me-1">refresh</i>
            レポートを生成
          </button>
        </div>
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
