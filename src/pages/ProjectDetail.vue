<script setup lang="ts">
// プロジェクト詳細ページ: 個別プロジェクトの詳細表示・編集機能
import { ref, computed } from "vue";
import router from "@/router";
import { useScheduleStore } from "../store/schedule";
import { useProjectDetail } from "@/composables/useProjectDetail";
import { useMessage } from "@/composables/useMessage";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

// 共通コンポーネントのインポート
import PageHeader from "../components/common/PageHeader.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityBadge from "../components/common/PriorityBadge.vue";
import LoadingSpinner from "../components/common/LoadingSpinner.vue";
import CardHeader from "../components/common/CardHeader.vue";
import StatCards from "../components/common/StatCards.vue";
import ProjectSummary from "@/components/project/ProjectSummary.vue";
import TaskDetailModal from "@/components/task/TaskDetailModal.vue";
import OptimizedDataTable from "@/components/table/OptimizedDataTable.vue";
// プロジェクトメンバー管理サービス
import { 
  listProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember
} from "@/services/teamService";
import type { Task } from "@/types/task";

// Router props (router/index.tsでprops: trueが設定されているため)
interface Props {
  id: string;
}
const props = defineProps<Props>();

// プロジェクト詳細の状態・ロジックは composable から取得
// useProjectDetail から状態や操作関数を取得
// 用途: プロジェクトの詳細データ・進捗値・タスクリスト・ユーザー・統計情報・編集/削除/保存操作・タスク詳細表示などUI・操作に必要な状態やロジックを一括管理
const {
  isLoading,                // ローディング状態（通信中 or データ取得中）
  errorMessage,             // エラーメッセージ（通信・取得エラー時に利用）
  projectDetail,            // 表示中のプロジェクト詳細データ
  projectTasks,             // プロジェクトに紐づくタスク一覧
  projectStats,             // プロジェクトに関する統計情報（追加メトリクス等）
  users,                    // プロジェクト関連ユーザー一覧
  isEditMode,               // 編集モード判定（true: 編集中, false: 閲覧モード）
  editForm,                 // プロジェクト編集用フォームデータ
  showTaskModal,            // タスク詳細モーダル表示可否
  selectedTask,             // 選択中のタスクデータ
  getOwnerName,             // ユーザーIDからユーザー名を取得する関数
  toggleEditMode,           // 編集モード切り替え関数
  saveProject,              // プロジェクト編集内容保存関数
  cancelEdit,               // 編集キャンセル関数
  deleteProject,            // プロジェクト削除関数
  showTaskDetail,           // タスク詳細モーダル表示トリガー関数
  closeTaskModal,           // タスク詳細モーダルを閉じる関数
  projectProgress,          // プロジェクト進捗率（％数値）
  completedTasksCount,      // 完了済みタスク数
  inProgressTasksCount,     // 進行中タスク数
  notStartedTasksCount,     // 未開始タスク数
  loadProjectDetail,        // プロジェクト読み込み関数
} = useProjectDetail(props.id);

// ===== プロジェクトメンバー管理（project_members） =====
// 目的: プロジェクト詳細ページ内でメンバー一覧・追加・役割変更・削除を提供
const projectMembers = ref<Array<{ user_id: number; role: "OWNER"|"CONTRIBUTOR"|"REVIEWER"; joined_at: string; user: any }>>([]);
const isProjectMembersLoading = ref(false);
const projectMembersErrorMessage = ref("");

// 追加用フォーム（シンプル版: ユーザーID + 役割）
const memberForm = ref<{ user_id: number; role: "OWNER"|"CONTRIBUTOR"|"REVIEWER" }>({
  user_id: 0,
  role: "CONTRIBUTOR"
});

// 一覧読み込み
const loadProjectMembers = async () => {
  try {
    isProjectMembersLoading.value = true;
    projectMembersErrorMessage.value = "";
    const pid = Number(props.id);
    if (!pid) {
      projectMembers.value = [];
      return;
    }
    const rows = await listProjectMembers(pid);
    projectMembers.value = (rows || []).map((m: any) => ({
      user_id: m.user_id,
      role: (m.role as "OWNER"|"CONTRIBUTOR"|"REVIEWER"),
      joined_at: m.joined_at,
      user: m.user
    }));
  } catch (e) {
    console.error("プロジェクトメンバー読み込みエラー:", e);
    projectMembersErrorMessage.value = "プロジェクトメンバーの読み込みに失敗しました";
    projectMembers.value = [];
  } finally {
    isProjectMembersLoading.value = false;
  }
};

// メンバー追加
const handleAddProjectMember = async () => {
  try {
    const pid = Number(props.id);
    if (!pid || !memberForm.value.user_id) return;
    const ok = await addProjectMember(pid, memberForm.value.user_id, memberForm.value.role);
    if (ok) {
      await loadProjectMembers();
      memberForm.value = { user_id: 0, role: "CONTRIBUTOR" };
      showSuccess("メンバーを追加しました");
    } else {
      showError("メンバーの追加に失敗しました");
    }
  } catch (e) {
    console.error("メンバー追加エラー:", e);
    showError("メンバー追加中にエラーが発生しました");
  }
};

// 役割変更
const handleUpdateProjectMemberRole = async (userId: number, newRole: "OWNER"|"CONTRIBUTOR"|"REVIEWER") => {
  try {
    const pid = Number(props.id);
    if (!pid) return;
    const ok = await updateProjectMemberRole(pid, userId, newRole);
    if (ok) {
      await loadProjectMembers();
      showSuccess("役割を更新しました");
    } else {
      showError("役割の更新に失敗しました");
    }
  } catch (e) {
    console.error("役割更新エラー:", e);
    showError("役割更新中にエラーが発生しました");
  }
};

// メンバー削除
const handleRemoveProjectMember = async (userId: number) => {
  try {
    const pid = Number(props.id);
    if (!pid) return;
    if (!window.confirm("このメンバーを削除しますか？")) return;
    const ok = await removeProjectMember(pid, userId);
    if (ok) {
      await loadProjectMembers();
      showSuccess("メンバーを削除しました");
    } else {
      showError("メンバーの削除に失敗しました");
    }
  } catch (e) {
    console.error("メンバー削除エラー:", e);
    showError("削除中にエラーが発生しました");
  }
};

// 初期ロード
loadProjectMembers();

// 追加可能なユーザー一覧（既にメンバーに追加されているユーザーを除外）
const availableUsers = computed(() => {
  const memberUserIds = new Set(projectMembers.value.map(m => m.user_id));
  return users.value.filter(u => !memberUserIds.has(u.id));
});

// 共有ストアから選択中プロジェクトを取得
const store = useScheduleStore();
const { showSuccess, showError } = useMessage();

// タスクテーブルのページネーション・ソート状態
const taskCurrentPage = ref(1);
const taskPageSize = ref(DEFAULT_PAGE_SIZE);
const taskSortColumn = ref<string>("");
const taskSortDirection = ref<"asc" | "desc">("asc");

// タスクテーブルのカラム定義
const taskTableColumns = [
  { key: "task_name", label: "タスク名", sortable: true },
  { key: "assignee", label: "担当者", sortable: true },
  { key: "status", label: "ステータス", sortable: true },
  { key: "priority", label: "優先度", sortable: true },
  { key: "progress_percent", label: "進捗", sortable: true },
  { key: "actions", label: "操作", sortable: false },
];

// ソートされたタスクリスト（computed）
const sortedProjectTasks = computed(() => {
  if (!taskSortColumn.value) {
    return projectTasks.value;
  }

  const sorted = [...projectTasks.value];
  const column = taskSortColumn.value;
  const direction = taskSortDirection.value;

  sorted.sort((a: any, b: any) => {
    let aVal: any;
    let bVal: any;

    // カラムに応じた値の取得
    if (column === "assignee") {
      // 担当者名で比較
      aVal = users.value.find(u => u.id === a.primary_assignee_id)?.display_name || "";
      bVal = users.value.find(u => u.id === b.primary_assignee_id)?.display_name || "";
    } else if (column === "progress_percent") {
      // 数値として比較
      aVal = a.progress_percent || 0;
      bVal = b.progress_percent || 0;
    } else if (column === "priority") {
      // 優先度を数値化して比較（URGENT > HIGH > MEDIUM > LOW）
      const priorityMap: Record<string, number> = {
        "URGENT": 4,
        "HIGH": 3,
        "MEDIUM": 2,
        "LOW": 1
      };
      aVal = priorityMap[a.priority] || 0;
      bVal = priorityMap[b.priority] || 0;
    } else if (column === "status") {
      // ステータスを数値化して比較（DONE > IN_PROGRESS > NOT_STARTED > BLOCKED）
      const statusMap: Record<string, number> = {
        "DONE": 4,
        "IN_PROGRESS": 3,
        "NOT_STARTED": 2,
        "BLOCKED": 1
      };
      aVal = statusMap[a.status] || 0;
      bVal = statusMap[b.status] || 0;
    } else {
      // その他のカラムは文字列として比較
      aVal = a[column] ?? "";
      bVal = b[column] ?? "";
    }

    // 比較処理
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
});

// タスクテーブル用のページ変更ハンドラー
const handleTaskPageChange = (page: number) => {
  taskCurrentPage.value = page;
};

// タスクテーブル用のソート変更ハンドラー
const handleTaskSortChange = (column: string, direction: "asc" | "desc") => {
  taskSortColumn.value = column;
  taskSortDirection.value = direction;
  // ソート後は最初のページに戻る
  taskCurrentPage.value = 1;
};

// ヘッダーアクションを生成
const getHeaderActions = () => {
  const actions = [];
  
  // 戻るボタンを最初に追加
  actions.push({
    label: '戻る',
    icon: 'arrow_back',
    variant: 'outline-secondary',
    onClick: () => router.back()
  });
  
  if (!isEditMode.value) {
    actions.push({
      label: '編集',
      icon: 'edit',
      variant: 'outline-primary',
      onClick: toggleEditMode
    });
    actions.push({
      label: '削除',
      icon: 'delete',
      variant: 'outline-danger',
      onClick: deleteProject
    });
  } else {
    actions.push({
      label: '保存',
      icon: 'save',
      variant: 'primary',
      onClick: saveProject
    });
    actions.push({
      label: 'キャンセル',
      icon: 'cancel',
      variant: 'outline-secondary',
      onClick: cancelEdit
    });
  }
  
  return actions;
};

// 注: loadProjectFromRoute()はcomposable内のonMountedで自動実行されます
</script>

<template>
  <!-- プロジェクト詳細ページ -->
  <div class="container-fluid py-4">
    <!-- ローディング表示 -->
    <div v-if="isLoading" class="row mb-4">
      <div class="col-12">
        <LoadingSpinner message="プロジェクト詳細を読み込み中..." />
      </div>
    </div>

    <!-- エラー表示 -->
    <div v-if="!isLoading && errorMessage" class="alert alert-danger alert-dismissible fade show mb-4" role="alert">
      <span class="material-symbols-rounded me-2">error</span>
      {{ errorMessage }}
      <button type="button" class="btn-close" @click="errorMessage = ''"></button>
    </div>

    <!-- プロジェクト詳細が読み込まれている場合 -->
    <template v-if="!isLoading && projectDetail && !errorMessage">
      <!-- ページヘッダー -->
      <PageHeader
        :title="projectDetail.name"
        :description="projectDetail.description || 'プロジェクトの詳細情報を確認・編集できます'"
        :actions="getHeaderActions()"
      />

      <!-- プロジェクト統計サマリー（コンポーネント化） -->
      <div class="row mb-4">
        <div class="col-12">
          <ProjectSummary 
            :project-name="projectDetail.name"
            :description="projectDetail.description || 'プロジェクトの詳細情報を確認・編集できます'"
            :progress-percent="projectProgress"
            :total-tasks="projectTasks.length"
            :completed-tasks="completedTasksCount"
            :in-progress-tasks="inProgressTasksCount"
          />
        </div>
      </div>

      <div class="row">
        <!-- メインコンテンツ -->
        <div class="col-lg-8">
          <!-- 基本情報カード -->
          <div class="card mb-4">
            <CardHeader title="基本情報" subtitle="プロジェクトの基本情報を編集できます" />
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">プロジェクト名</label>
                  <input 
                    v-if="isEditMode"
                    type="text" 
                    class="form-control"
                    v-model="editForm.name"
                  >
                  <p v-else class="form-control-plaintext">{{ projectDetail.name }}</p>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">担当者</label>
                  <select 
                    v-if="isEditMode"
                    class="form-select"
                    v-model="editForm.owner_user_id"
                  >
                    <option value="">担当者を選択</option>
                    <option 
                      v-for="user in users" 
                      :key="user.id" 
                      :value="user.id"
                    >
                      {{ user.display_name }}
                    </option>
                  </select>
                  <p v-else class="form-control-plaintext">
                    {{ getOwnerName(projectDetail?.owner_user_id) }}
                  </p>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">開始日</label>
                  <input 
                    v-if="isEditMode"
                    type="date" 
                    class="form-control"
                    v-model="editForm.start_date"
                  >
                  <p v-else class="form-control-plaintext">{{ projectDetail.start_date || '未設定' }}</p>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">終了日</label>
                  <input 
                    v-if="isEditMode"
                    type="date" 
                    class="form-control"
                    v-model="editForm.end_date"
                  >
                  <p v-else class="form-control-plaintext">{{ projectDetail.end_date || '未設定' }}</p>
                </div>
                <div class="col-12 mb-3">
                  <label class="form-label">説明</label>
                  <textarea 
                    v-if="isEditMode"
                    class="form-control"
                    rows="3"
                    v-model="editForm.description"
                  ></textarea>
                  <p v-else class="form-control-plaintext">{{ projectDetail.description || '説明がありません' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- プロジェクトメンバー -->
          <div class="card mb-4">
            <CardHeader title="プロジェクトメンバー" subtitle="このプロジェクトに所属するメンバーを管理します" />
            <div class="card-body">
              <div v-if="projectMembersErrorMessage" class="alert alert-danger" role="alert">{{ projectMembersErrorMessage }}</div>

              <!-- 追加フォーム（シンプル） -->
              <div class="row g-2 align-items-end mb-3">
                <div class="col-md-5">
                  <label class="form-label">ユーザー</label>
                  <select class="form-select" v-model.number="memberForm.user_id">
                    <option :value="0" disabled>ユーザーを選択...</option>
                    <option 
                      v-for="user in availableUsers" 
                      :key="user.id" 
                      :value="user.id"
                    >
                      {{ user.display_name }} ({{ user.email }})
                    </option>
                  </select>
                  <small v-if="availableUsers.length === 0" class="text-muted">追加可能なユーザーがありません</small>
                </div>
                <div class="col-md-4">
                  <label class="form-label">役割</label>
                  <select class="form-select" v-model="memberForm.role">
                    <option value="OWNER">オーナー</option>
                    <option value="CONTRIBUTOR">貢献者</option>
                    <option value="REVIEWER">レビューアー</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <button 
                    class="btn bg-gradient-primary w-100" 
                    @click="handleAddProjectMember"
                    :disabled="memberForm.user_id === 0 || availableUsers.length === 0"
                  >
                    追加
                  </button>
                </div>
              </div>

              <div v-if="isProjectMembersLoading" class="text-center py-3">
                <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
              </div>
              <div v-else class="table-responsive">
                <table class="table align-items-center mb-0">
                  <thead>
                    <tr>
                      <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ユーザー</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">役割</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">参加日</th>
                      <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="m in projectMembers" :key="m.user_id">
                      <td>
                        <div class="d-flex px-2 py-1">
                          <div class="d-flex flex-column justify-content-center">
                            <h6 class="mb-0 text-sm">{{ m.user?.display_name || ('ユーザー#' + m.user_id) }}</h6>
                            <p class="text-xs text-secondary mb-0">{{ m.user?.email || '' }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="align-middle text-center">
                        <select class="form-select form-select-sm w-auto d-inline-block" :value="m.role" @change="handleUpdateProjectMemberRole(m.user_id, ($event.target as HTMLSelectElement).value as any)">
                          <option value="OWNER">オーナー</option>
                          <option value="CONTRIBUTOR">貢献者</option>
                          <option value="REVIEWER">レビューアー</option>
                        </select>
                      </td>
                      <td class="align-middle text-center">
                        <span class="text-secondary text-xs font-weight-normal">{{ new Date(m.joined_at).toLocaleDateString('ja-JP') }}</span>
                      </td>
                      <td class="align-middle text-center">
                        <button class="btn btn-sm bg-gradient-danger mb-0" @click="handleRemoveProjectMember(m.user_id)">削除</button>
                      </td>
                    </tr>
                    <tr v-if="projectMembers.length === 0">
                      <td colspan="4" class="text-center text-secondary py-3">メンバーがいません</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- タスク一覧 -->
          <div class="card">
            <CardHeader title="タスク一覧" subtitle="このプロジェクトに関連するタスクを管理できます" />
            <div class="card-body">
              <OptimizedDataTable
                :data="sortedProjectTasks"
                :columns="taskTableColumns"
                :page-size="taskPageSize"
                :loading="isLoading"
                :searchable="false"
                :filterable="false"
                :virtual-scroll="false"
                empty-message="このプロジェクトにタスクを追加してください"
                @page-change="handleTaskPageChange"
                @sort-change="handleTaskSortChange"
              >
                <!-- タスク名セル: アイコン付き -->
                <template #cell-task_name="{ item }">
                  <div class="d-flex align-items-center">
                    <i class="material-symbols-rounded me-2 text-primary">task</i>
                    <span class="text-sm font-weight-bold">{{ item.task_name }}</span>
                  </div>
                </template>

                <!-- 担当者セル -->
                <template #cell-assignee="{ item }">
                  <span class="text-sm">
                    {{ users.find(u => u.id === item.primary_assignee_id)?.display_name || '未設定' }}
                  </span>
                </template>

                <!-- ステータスセル: バッジ表示 -->
                <template #cell-status="{ item }">
                  <StatusBadge :status="(item.status as string)" />
                </template>

                <!-- 優先度セル: バッジ表示 -->
                <template #cell-priority="{ item }">
                  <PriorityBadge :priority="(item.priority as string)" />
                </template>

                <!-- 進捗セル: プログレスバー + パーセンテージ -->
                <template #cell-progress_percent="{ item }">
                  <div class="d-flex align-items-center">
                    <div class="progress me-2" style="width: 60px; height: 8px;">
                      <div 
                        class="progress-bar bg-gradient-primary" 
                        :style="{ width: (item.progress_percent || 0) + '%' }"
                      ></div>
                    </div>
                    <span class="text-xs font-weight-bold">{{ item.progress_percent || 0 }}%</span>
                  </div>
                </template>

                <!-- 操作セル: 詳細ボタン -->
                <template #cell-actions="{ item }">
                  <button 
                    class="btn btn-sm btn-outline-primary"
                    @click.stop="showTaskDetail(item as unknown as Task)"
                  >
                    <i class="material-symbols-rounded me-1" style="font-size: 14px;">visibility</i>
                    詳細
                  </button>
                </template>
              </OptimizedDataTable>
            </div>
          </div>
        </div>

        <!-- サイドバー -->
        <div class="col-lg-4">
          <!-- プロジェクト進捗 -->
          <div class="card mb-4">
            <CardHeader title="プロジェクト進捗" subtitle="全体の進捗状況を確認できます" />
            <div class="card-body">
              <div class="text-center mb-3">
                <h3 class="text-primary font-weight-bold">{{ projectProgress }}%</h3>
                <p class="text-sm text-muted">全体進捗率</p>
              </div>
              <div class="progress" style="height: 10px;">
                <div 
                  class="progress-bar bg-gradient-primary" 
                  :style="{ width: projectProgress + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- タスク統計 -->
          <div class="card mb-4">
            <CardHeader title="タスク統計" subtitle="タスクの状態別分布" />
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-sm">完了</span>
                <span class="badge bg-gradient-success">{{ completedTasksCount }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-sm">進行中</span>
                <span class="badge bg-gradient-warning">{{ inProgressTasksCount }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-sm">未開始</span>
                <span class="badge bg-gradient-secondary">{{ notStartedTasksCount }}</span>
              </div>
            </div>
          </div>

          <!-- プロジェクト情報 -->
          <div class="card">
            <CardHeader title="プロジェクト情報" subtitle="プロジェクトの基本情報" />
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-sm">作成日</span>
                <span class="text-sm">{{ projectDetail.created_at ? new Date(projectDetail.created_at).toLocaleDateString('ja-JP') : '不明' }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-sm">更新日</span>
                <span class="text-sm">{{ projectDetail.updated_at ? new Date(projectDetail.updated_at).toLocaleDateString('ja-JP') : '不明' }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-sm">アーカイブ</span>
                <span class="badge" :class="projectDetail.is_archived ? 'bg-gradient-warning' : 'bg-gradient-success'">
                  {{ projectDetail.is_archived ? 'アーカイブ済み' : 'アクティブ' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- タスク詳細モーダル -->
    <TaskDetailModal 
      :show="showTaskModal" 
      :selected-task="selectedTask"
      :get-owner-name="getOwnerName"
      @close="closeTaskModal"
    />
  </div>
</template>

<style scoped>
/* プロジェクト詳細ページのスタイリング */
/* Material Dashboard スタイルを優先使用 */

/* カードのスタイリング */
.card {
  transition: all 0.3s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* プログレスバーのスタイリング */
.progress {
  height: 8px;
  border-radius: 4px;
}

/* テーブルのスタイリング */
.table th {
  border-top: none;
  font-weight: 600;
  color: #344767;
}

.table td {
  vertical-align: middle;
}

/* バッジのスタイリング */
.badge {
  font-size: 0.75rem;
  padding: 0.5rem 0.75rem;
}

/* ボタンのスタイリング */
.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
}

/* フォームのスタイリング */
.form-control-plaintext {
  background-color: transparent;
  border: none;
  padding: 0.375rem 0;
}

/* タスク詳細モーダルのスタイリング */
.task-detail-modal .card.card-plain {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef !important;
  box-shadow: none;
}

.task-detail-modal .card.card-plain:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.task-detail-modal .icon-shape {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-detail-modal .text-gradient {
  background: linear-gradient(195deg, #42424a 0%, #191919 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.task-detail-modal .text-gradient.text-primary {
  background: linear-gradient(195deg, #7928ca 0%, #ff0080 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.task-detail-modal .progress {
  border-radius: 3px;
  overflow: hidden;
}

.task-detail-modal .row.g-3 {
  --bs-gutter-x: 1rem;
  --bs-gutter-y: 1rem;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .project-detail-page {
    padding: 0.5rem;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  .table-responsive {
    font-size: 0.875rem;
  }

  .task-detail-modal .icon-shape {
    width: 32px;
    height: 32px;
  }

  .task-detail-modal .material-symbols-rounded {
    font-size: 20px !important;
  }
}
</style>
