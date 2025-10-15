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

import { ref, computed, onMounted } from "vue";
import { listProjects, createProject, updateProject, deleteProject } from "../services/projectService";
import type { ProjectInsert, ProjectUpdate } from "../types/project";
import { listUsers } from "../services/dbServices";
import { logProjectCreated } from "../services/activityService";
import type { Project } from "../types/project";
import type { Users } from "../types/db/users";
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
import { 
  getProjectStats, 
  getProjectDetailStats, 
  type ProjectStats,
  type ProjectDetailStats
} from "../services/dashboardService";
import { formatDateJP, formatPercent, truncate } from "@/utils/formatters";

// プロジェクト一覧の状態管理
const projects = ref<Project[]>([]);
const users = ref<Users[]>([]);
const isLoading = ref(false);
const errorMessage = ref("");

// ダッシュボード統計情報
const projectStats = ref<ProjectStats>({
  totalProjects: 0,
  activeProjects: 0,
  archivedProjects: 0,
  overdueProjects: 0,
  totalTasks: 0,
  completedTasks: 0,
  inProgressTasks: 0,
  blockedTasks: 0,
  averageProgress: 0
});
const projectDetailStats = ref<ProjectDetailStats[]>([]);

// タスク管理（プロジェクト詳細ページ遷移に変更されたため不要）

// モーダル表示状態
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedProject = ref<Project | null>(null);

// フォームデータ
const formData = ref<ProjectInsert>({
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  owner_user_id: null,
  is_archived: false
});

// 検索・フィルタリング
const searchQuery = ref("");
const statusFilter = ref("all"); // 'all' | 'active' | 'archived'
const dateFilter = ref("all"); // 'all' | 'this-month' | 'overdue'

// フィルタリングされたプロジェクト一覧
const filteredProjects = computed(() => {
  let filtered = projects.value;

  // 検索クエリでフィルタリング
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(project => 
      project.name.toLowerCase().includes(query) ||
      (project.description && project.description.toLowerCase().includes(query))
    );
  }

  // 状態でフィルタリング
  if (statusFilter.value !== "all") {
    filtered = filtered.filter(project => {
      switch (statusFilter.value) {
        case "active":
          return !project.is_archived;
        case "archived":
          return project.is_archived;
        default:
          return true;
      }
    });
  }

  // 日付でフィルタリング
  if (dateFilter.value !== "all") {
    const today = new Date();
    filtered = filtered.filter(project => {
      if (!project.end_date) return false;
      const endDate = new Date(project.end_date);
      
      switch (dateFilter.value) {
        case "this-month":
          const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          return endDate >= today && endDate <= monthFromNow;
        case "overdue":
          return endDate < today && !project.is_archived;
        default:
          return true;
      }
    });
  }

  return filtered;
});


// =============================
// テーブル用: 表示データと列定義
// 目的: テーブル専用の平坦なデータに整形し、ソート/ページングを親で管理
// =============================
// プロジェクト一覧テーブル: ページングとソート状態
const projectCurrentPage = ref(1);
const projectPageSize = ref(10);
const projectSortColumn = ref<string>("");
const projectSortDirection = ref<"asc" | "desc">("asc");

// 列定義（表示名とキー、必要に応じてフォーマッタ）
const projectTableColumns = [
  { key: "name", label: "プロジェクト名", sortable: true },
  { key: "description", label: "説明" },
  { key: "ownerName", label: "オーナー", sortable: true },
  { key: "startDate", label: "開始日", sortable: true, formatter: (v: string) => v || "-" },
  { key: "endDate", label: "終了日", sortable: true, formatter: (v: string) => v || "-" },
  { key: "status", label: "状態", sortable: true },
  { key: "createdAt", label: "作成日", sortable: true }
];

// テーブル用にフラットな形へ変換
const projectTableRows = computed(() => {
  // フィルタ済みを基準にする
  const base = filteredProjects.value.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || "-",
    ownerName: getOwnerName(p.owner_user_id ?? null),
    startDate: p.start_date || "-",
    endDate: p.end_date || "-",
    status: getProjectStatus(p),
    createdAt: formatDate(p.created_at)
  }));

  // ソート適用
  if (projectSortColumn.value) {
    const col = projectSortColumn.value as keyof (typeof base)[number];
    base.sort((a, b) => {
      const aVal = a[col] ?? "";
      const bVal = b[col] ?? "";
      if (aVal < bVal) return projectSortDirection.value === "asc" ? -1 : 1;
      if (aVal > bVal) return projectSortDirection.value === "asc" ? 1 : -1;
      return 0;
    });
  }

  return base;
});

// ソートハンドラ
const handleProjectSortChange = (column: string, direction: "asc" | "desc") => {
  // 列が同じなら方向をトグル、異なるなら昇順から開始
  if (projectSortColumn.value === column) {
    projectSortDirection.value = direction;
  } else {
    projectSortColumn.value = column;
    projectSortDirection.value = direction;
  }
};

// ページ変更ハンドラ
const handleProjectPageChange = (page: number) => {
  // 安全のためページ境界をチェック
  if (page < 1) return;
  projectCurrentPage.value = page;
};

// プロジェクト一覧の読み込み
const loadProjects = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = "";
    const result = await listProjects();
    if (result.success && result.data) {
      projects.value = result.data;
    } else {
      errorMessage.value = result.error || "プロジェクト一覧の読み込みに失敗しました。";
      projects.value = [];
    }
  } catch (error) {
    console.error("プロジェクト一覧の読み込みに失敗:", error);
    errorMessage.value = "プロジェクト一覧の読み込みに失敗しました。";
    projects.value = [];
  } finally {
    isLoading.value = false;
  }
};

// ユーザー一覧の読み込み
const loadUsers = async () => {
  try {
    // ServiceResult を展開し、data のみ Users[] として代入する
    const result = await listUsers();
    if (result && typeof result === "object" && "success" in result) {
      if (result.success && result.data) {
        users.value = result.data as Users[];
      } else {
        console.error("ユーザー一覧の読み込みに失敗:", result.error);
        users.value = [];
      }
    } else {
      // 後方互換（配列が直接返る場合）
      users.value = (result as unknown as Users[]) ?? [];
    }
  } catch (error) {
    console.error("ユーザー一覧の読み込みに失敗:", error);
    users.value = [];
  }
};

// プロジェクトのオーナー名を取得
const getOwnerName = (ownerId: number | null): string => {
  if (!ownerId) return "-";
  const owner = users.value.find(user => user.id === ownerId);
  return owner ? owner.display_name : "-";
};

// 新規プロジェクト作成
const handleCreateProject = async () => {
  try {
    if (!formData.value.name.trim()) {
      alert("プロジェクト名を入力してください。");
      return;
    }

    const result = await createProject(formData.value);
    if (result.success && result.data) {
      projects.value.push(result.data);
      showCreateModal.value = false;
      resetForm();
      
      // 活動ログを生成
      const ownerName = getOwnerName(result.data.owner_user_id ?? null);
      await logProjectCreated(result.data.id, result.data.name, ownerName);
      
      // ダッシュボード統計を更新
      await loadDashboardStats();
      
      alert("プロジェクトが正常に作成されました！");
    } else {
      alert(result.error || "プロジェクトの作成に失敗しました。");
    }
  } catch (error) {
    console.error("プロジェクト作成エラー:", error);
    alert("プロジェクト作成中にエラーが発生しました。");
  }
};

// プロジェクト編集
const handleEditProject = async () => {
  try {
    if (!selectedProject.value || !formData.value.name.trim()) {
      alert("プロジェクト名を入力してください。");
      return;
    }

    const updateData: ProjectUpdate = {
      name: formData.value.name,
      description: formData.value.description,
      start_date: formData.value.start_date,
      end_date: formData.value.end_date,
      owner_user_id: formData.value.owner_user_id,
      is_archived: formData.value.is_archived
    };

    const result = await updateProject(selectedProject.value.id, updateData);
    if (result.success && result.data) {
      const index = projects.value.findIndex(p => p.id === selectedProject.value!.id);
      if (index !== -1) {
        projects.value[index] = result.data;
      }
      showEditModal.value = false;
      selectedProject.value = null;
      resetForm();
      
      // ダッシュボード統計を更新
      await loadDashboardStats();
      
      alert("プロジェクトが正常に更新されました！");
    } else {
      alert(result.error || "プロジェクトの更新に失敗しました。");
    }
  } catch (error) {
    console.error("プロジェクト更新エラー:", error);
    alert("プロジェクト更新中にエラーが発生しました。");
  }
};

// プロジェクト削除
const handleDeleteProject = async () => {
  try {
    if (!selectedProject.value) return;

    const result = await deleteProject(selectedProject.value.id);
    if (result.success && result.data) {
      projects.value = projects.value.filter(p => p.id !== selectedProject.value!.id);
      showDeleteModal.value = false;
      selectedProject.value = null;
      
      // ダッシュボード統計を更新
      await loadDashboardStats();
      
      alert("プロジェクトが正常に削除されました。");
    } else {
      alert(result.error || "プロジェクトの削除に失敗しました。");
    }
  } catch (error) {
    console.error("プロジェクト削除エラー:", error);
    alert("プロジェクト削除中にエラーが発生しました。");
  }
};

// フォームリセット
const resetForm = () => {
  formData.value = {
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    owner_user_id: null,
    is_archived: false
  };
};

// 編集モーダルを開く
const openEditModal = (project: Project) => {
  selectedProject.value = project;
  formData.value = {
    name: project.name,
    description: project.description || "",
    start_date: project.start_date || "",
    end_date: project.end_date || "",
    owner_user_id: project.owner_user_id,
    is_archived: project.is_archived
  };
  showEditModal.value = true;
};

// 削除モーダルを開く
const openDeleteModal = (project: Project) => {
  selectedProject.value = project;
  showDeleteModal.value = true;
};

// フィルタリセット
const clearFilters = () => {
  searchQuery.value = "";
  statusFilter.value = "all";
  dateFilter.value = "all";
};

// 日付フォーマット（共通フォーマッター使用）
const formatDate = (dateString: string | null): string => formatDateJP(dateString ?? null);

// プロジェクト状態の表示
const getProjectStatus = (project: Project): string => {
  if (project.is_archived) return "アーカイブ";
  
  if (!project.end_date) return "進行中";
  
  const today = new Date();
  const endDate = new Date(project.end_date);
  
  if (endDate < today) return "期限切れ";
  return "進行中";
};


// ダッシュボード統計情報の読み込み
const loadDashboardStats = async () => {
  try {
    const [statsResult, detailStatsResult] = await Promise.all([
      getProjectStats(),
      getProjectDetailStats()
    ]);
    
    if (statsResult.success && statsResult.data) {
      projectStats.value = statsResult.data;
    } else {
      console.error("プロジェクト統計の読み込みに失敗:", statsResult.error);
    }
    
    if (detailStatsResult.success && detailStatsResult.data) {
      projectDetailStats.value = detailStatsResult.data;
    } else {
      console.error("プロジェクト詳細統計の読み込みに失敗:", detailStatsResult.error);
    }
  } catch (error) {
    console.error("ダッシュボード統計の読み込みに失敗:", error);
  }
};

// プロジェクトの詳細ページに遷移
const showProjectTasks = async (project: Project) => {
  try {
    // プロジェクト詳細ページに遷移（URLパラメータでプロジェクトIDを渡す）
    const projectId = project.id;
    
    // URLパラメータを設定（ProjectDetail.vueで使用）
    const url = new URL(window.location.href);
    url.searchParams.set('id', projectId.toString());
    window.history.pushState({}, '', url.toString());
    
    // プロジェクト詳細ページに遷移
    // App.vueのcurrentPageを変更するためにイベントを発火させる
    window.dispatchEvent(new CustomEvent('navigate-to-project-detail', { 
      detail: { projectId } 
    }));
    
    // URL変更イベントも発火してProjectDetail.vueが反応するようにする
    window.dispatchEvent(new PopStateEvent('popstate'));
    
    // ProjectDetail.vueがURLの変更を強制的に検知できるようにトリガーを送る
    setTimeout(() => {
      window.dispatchEvent(new Event('hashchange'));
    }, 100);
  } catch (error) {
    console.error("プロジェクト詳細への遷移に失敗:", error);
    alert("プロジェクト詳細ページへの遷移に失敗しました。");
  }
};

// タスクモーダル関連（プロジェクト詳細ページ遷移に変更されたため不要）

// コンポーネントマウント時にデータを読み込み
onMounted(async () => {
  await Promise.all([
    loadProjects(),
    loadUsers(),
    loadDashboardStats()
  ]);
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
