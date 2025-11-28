<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import router from "@/router";
import { useScheduleDetail } from "@/composables/useScheduleDetail";
import { getCurrentUserInfo } from "@/utils/userHelper";
import { useScheduleStore } from "../store/schedule";
import { useMessage, useConfirm } from "@/composables/useMessage";
import type { ScheduleItem, ScheduleStatus, SchedulePriority, ScheduleAttachment, ScheduleComment } from "../types/schedule";
import { listUsers } from "../services/dbServices";
import type { Users } from "../types/db/users";
import type { TaskStatusHistory } from "../types/taskStatusHistory";
import GitHubRepositoryCard from "@/components/github/GitHubRepositoryCard.vue";
import { getRepositoryBranches, getRepositoryCommits } from "@/services/githubService";
import type { GitHubBranch, GitHubCommit } from "@/types/github";

// Router props (router/index.tsでprops: trueが設定されているため)
interface Props {
  id: string;
}
const props = defineProps<Props>();

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
import AttachmentManager from "../components/common/AttachmentManager.vue";
import TagManagerModal from "../components/common/TagManagerModal.vue";
import CommentsSection from "../components/common/CommentsSection.vue";

// スケジュール詳細ページ: 個別スケジュールの詳細表示・編集

// スケジュール詳細画面のデータ/操作群をcomposable(useScheduleDetail)から取得
// route params の id を渡してDBから直接ロード
const {
  isLoading,          // ローディング中フラグ
  errorMessage,       // エラーメッセージ（表示用）
  scheduleDetail,     // スケジュール詳細データ
  isEditMode,         // 編集モードかどうか
  editForm,           // 編集用フォームデータ
  newComment,         // 新規コメント内容
  newTag,             // 追加しようとしている新規タグ
  availableTags,      // 利用可能なタグ一覧
  showTagModal,       // タグ追加モーダル表示フラグ
  showFileModal,      // ファイル添付モーダル表示フラグ
  statusHistory,      // ステータス変更履歴
  availableUsers,     // 選択可能ユーザー一覧
  availableParentTasks, // 選択可能な親タスク一覧
  isLoadingParentTasks, // 親タスク読み込み中フラグ
  changeStatus,       // ステータス変更関数
  changePriority,     // 優先度変更関数
  changeProgress,     // 進捗率変更関数
  addTag,             // タグ追加関数
  removeTag,          // タグ削除関数
  addComment,         // コメント追加関数
  loadUsers,          // ユーザー読み込み関数
  loadTaskById,       // タスク読み込み関数
  loadParentTasks,    // 親タスク候補読み込み関数
} = useScheduleDetail(props.id);

// メッセージシステム
const { showSuccess, showError } = useMessage();
const { confirm: confirmDialog } = useConfirm();

// スケジュールストアを取得
const store = useScheduleStore();

// GitHub 連携テスト用のリポジトリ情報（環境変数で未設定の場合はVue公式を利用）
const githubOwner = ref(import.meta.env.VITE_GITHUB_DEFAULT_OWNER || "vuejs");
const githubRepo = ref(import.meta.env.VITE_GITHUB_DEFAULT_REPO || "vue");
const githubBranch = ref(import.meta.env.VITE_GITHUB_DEFAULT_BRANCH || "main");

// GitHub ブランチ/コミット表示用の状態管理
const githubBranches = ref<GitHubBranch[]>([]);
const githubCommits = ref<GitHubCommit[]>([]);
const isBranchesLoading = ref(false);
const isCommitsLoading = ref(false);
const branchError = ref<string | null>(null);
const commitError = ref<string | null>(null);

// GitHub ブランチ一覧を取得してセレクタに反映
const loadGitHubBranches = async () => {
  if (!githubOwner.value || !githubRepo.value) {
    branchError.value = "リポジトリ情報が不足しています";
    return;
  }
  isBranchesLoading.value = true;
  branchError.value = null;
  const result = await getRepositoryBranches(githubOwner.value, githubRepo.value);
  if (result.success && result.data) {
    githubBranches.value = result.data;
    if (!githubBranches.value.some(branch => branch.name === githubBranch.value)) {
      githubBranch.value = githubBranches.value[0]?.name || "main";
    }
  } else {
    branchError.value = result.error || "ブランチ情報の取得に失敗しました";
  }
  isBranchesLoading.value = false;
};

// 選択中ブランチの最新コミットを取得
const loadGitHubCommits = async (branchName: string) => {
  if (!githubOwner.value || !githubRepo.value) {
    commitError.value = "リポジトリ情報が不足しています";
    return;
  }
  isCommitsLoading.value = true;
  commitError.value = null;
  const result = await getRepositoryCommits(githubOwner.value, githubRepo.value, {
    sha: branchName,
    per_page: 5,
  });
  if (result.success && result.data) {
    githubCommits.value = result.data;
  } else {
    commitError.value = result.error || "コミット履歴の取得に失敗しました";
    githubCommits.value = [];
  }
  isCommitsLoading.value = false;
};

// ブランチ一覧を再読込
const refreshGitHubBranches = async () => {
  await loadGitHubBranches();
  await loadGitHubCommits(githubBranch.value);
};

// コミット表示用の日時フォーマッタ
const formatCommitDate = (iso: string | undefined) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("ja-JP");
};

// コメント追加（composable 関数に入力値を渡すラッパー）
const onAddComment = () => {
  addComment(newComment.value);
};

// 現在のユーザーID（users.id, 数値）を取得して保持
const currentUserId = ref<number | null>(null);
onMounted(async () => {
  const info = await getCurrentUserInfo();
  currentUserId.value = info?.id ?? null;
  await refreshGitHubBranches();
});

// ブランチが変更されたら最新コミットを取得
watch(githubBranch, async newBranch => {
  if (newBranch) {
    await loadGitHubCommits(newBranch);
  }
});

// リポジトリ情報が変わった際は一覧を再読込
watch([githubOwner, githubRepo], async () => {
  await refreshGitHubBranches();
});

// 編集モードの切り替え
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (isEditMode.value) {
    editForm.value = { ...scheduleDetail.value };
  }
};

// 保存処理（ストア経由）
const saveChanges = async () => {
  try {
    await store.save({ ...editForm.value });
    isEditMode.value = false;
  } catch (e) {
    console.error("保存に失敗", e);
    const message = e instanceof Error ? e.message : "保存に失敗しました";
    errorMessage.value = message;
  }
};

// キャンセル処理
const cancelEdit = () => {
  editForm.value = { ...scheduleDetail.value };
  isEditMode.value = false;
};

// 削除処理
const deleteSchedule = async () => {
  // 削除確認ダイアログを表示
  const confirmed = await confirmDialog({
    title: "削除確認",
    message: `"${scheduleDetail.value.title}" を削除してもよろしいですか？\nこの操作は取り消せません。`,
    type: "danger",
    confirmText: "削除",
    cancelText: "キャンセル"
  });
  if (!confirmed) {
    return;
  }
  
  try {
    await store.delete(scheduleDetail.value.id);
    // 削除後は一覧画面に戻る（Appコンポーネントの currentPage を変更）
    // または emit でページ変更をリクエスト
    showSuccess("スケジュールを削除しました");
  } catch (e) {
    console.error("削除に失敗", e);
    const message = e instanceof Error ? e.message : "削除に失敗しました";
    errorMessage.value = message;
    showError(message);
  }
};

// クイックアクション
const quickActions = ref([
  { label: "開始", status: "IN_PROGRESS", icon: "play_arrow", color: "success" },
  { label: "完了", status: "DONE", icon: "check", color: "primary" },
  { label: "ブロック", status: "BLOCKED", icon: "pause", color: "warning" },
  { label: "キャンセル", status: "CANCELLED", icon: "cancel", color: "danger" }
]);

// ステータス別の色を取得（uiHelpersからインポート済み）
// 優先度別の色を取得（uiHelpersからインポート済み）

// コメント追加は composable の addComment を使用

// ファイル添付
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files) return;
  for (const file of files) {
    const attachment: ScheduleAttachment = {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(1) + "MB",
      type: file.name.split('.').pop() || ""
    };
    // 編集フォームに追加し、保存時にストアへ反映
    if (!Array.isArray(editForm.value.attachments)) {
      editForm.value.attachments = [];
    }
    editForm.value.attachments.push(attachment);
  }
};

// タグ削除処理（削除後、編集モードの場合は自動保存）
const handleRemoveTag = async (tag: string) => {
  try {
    removeTag(tag);
    // 編集モードの場合、削除後すぐに保存
    if (isEditMode.value) {
      await saveChanges();
    }
  } catch (error) {
    console.error("タグの削除に失敗:", error);
    showError("タグの削除に失敗しました。");
  }
};

// タグ自動補完
const filteredTags = computed(() => {
  if (!newTag.value) return availableTags.value;
  return availableTags.value.filter(tag => 
    tag.toLowerCase().includes(newTag.value.toLowerCase())
  );
});

// 担当者変更
const changeAssignee = (userId: number) => {
  const user = availableUsers.value.find(u => u.id === userId);
  if (user) {
    editForm.value.assignee = user.name;
  }
};

// 親タスク変更
const changeParentTask = (taskId: number | null) => {
  if (taskId === null || taskId === 0) {
    // 親タスクを解除
    editForm.value.parentTaskId = null;
    editForm.value.parentTaskName = undefined;
  } else {
    // 親タスクを設定
    const parentTask = availableParentTasks.value.find(t => t.id === taskId);
    if (parentTask) {
      editForm.value.parentTaskId = parentTask.id;
      editForm.value.parentTaskName = parentTask.task_name;
    }
  }
};

// クイックアクション実行
const executeQuickAction = async (action: any) => {
  try {
    editForm.value.status = action.status;
    await saveChanges();
    store.saveStatusHistory(scheduleDetail.value.id, action.status);
    // 状態変更履歴に追加
    statusHistory.value.unshift({
      from: scheduleDetail.value.status,
      to: action.status,
      user: "現在のユーザー",
      timestamp: new Date().toLocaleString('ja-JP'),
      reason: `${action.label}アクション実行`
    });
  } catch (error) {
    console.error("クイックアクションの実行に失敗:", error);
  }
};

// ヘッダーアクションを生成する関数（編集/削除/保存/キャンセルのみ）
const getHeaderActions = () => {
  const actions = [];
  
  // 編集/保存/キャンセル/削除ボタン
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
      onClick: deleteSchedule
    });
  } else {
    actions.push({
      label: '保存',
      icon: 'save',
      variant: 'primary',
      onClick: saveChanges
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

// コンポーネント初期化
// 注: loadTaskFromRoute()とloadUsers()はcomposable内のonMountedで自動実行されます
</script>

<template>
  <!-- スケジュール詳細ページ -->
  <div class="container-fluid py-4">
    <!-- ローディング表示 -->
    <div v-if="isLoading" class="row mb-4">
      <div class="col-12">
        <LoadingSpinner message="スケジュール詳細を読み込み中..." />
      </div>
    </div>

    <!-- エラー表示 -->
    <div v-if="!isLoading && errorMessage" class="alert alert-danger alert-dismissible fade show mb-4" role="alert">
      <span class="material-symbols-rounded me-2">error</span>
      {{ errorMessage }}
      <button type="button" class="btn-close" @click="errorMessage = ''"></button>
    </div>

    <!-- メインコンテンツ -->
    <template v-if="!isLoading && scheduleDetail.id > 0">
      <!-- ページヘッダー -->
      <PageHeader
        title="スケジュール詳細"
        description="スケジュールの詳細情報を確認・編集できます"
        :actions="[
          {
            label: '戻る',
            icon: 'arrow_back',
            variant: 'outline-secondary',
            onClick: () => router.back()
          },
          ...getHeaderActions()
        ]"
      />

      <!-- スケジュール統計サマリー -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <CardHeader title="スケジュール統計" subtitle="タスクの進捗と活動状況" />
            <div class="card-body">
              <StatCards
                :items="[
                  { 
                    label: '進捗率', 
                    value: `${scheduleDetail.progress}%`, 
                    icon: 'trending_up', 
                    color: 'primary',
                    footer: '完了度'
                  },
                  { 
                    label: 'コメント数', 
                    value: scheduleDetail.comments?.length || 0, 
                    icon: 'comment', 
                    color: 'info',
                    footer: '総コメント'
                  },
                  { 
                    label: '添付ファイル', 
                    value: scheduleDetail.attachments?.length || 0, 
                    icon: 'attach_file', 
                    color: 'success',
                    footer: 'ファイル数'
                  },
                  { 
                    label: 'タグ数', 
                    value: scheduleDetail.tags?.length || 0, 
                    icon: 'label', 
                    color: 'warning',
                    footer: '関連タグ'
                  }
                ]"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="row">
      <!-- メインコンテンツ -->
      <div class="col-lg-8">
        <!-- 基本情報カード -->
        <div class="card mb-4">
          <CardHeader title="基本情報" subtitle="タスクの基本情報を編集できます" />
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">タイトル</label>
                <input 
                  v-if="isEditMode"
                  type="text" 
                  class="form-control"
                  v-model="editForm.title"
                >
                <p v-else class="form-control-plaintext">{{ scheduleDetail.title }}</p>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">カテゴリ</label>
                <select 
                  v-if="isEditMode"
                  class="form-select"
                  v-model="editForm.category"
                >
                  <option value="開発">開発</option>
                  <option value="テスト">テスト</option>
                  <option value="デザイン">デザイン</option>
                  <option value="その他">その他</option>
                </select>
                <p v-else class="form-control-plaintext">{{ scheduleDetail.category }}</p>
              </div>
              <div class="col-12 mb-3">
                <label class="form-label">説明</label>
                <textarea 
                  v-if="isEditMode"
                  class="form-control"
                  rows="3"
                  v-model="editForm.description"
                ></textarea>
                <p v-else class="form-control-plaintext">{{ scheduleDetail.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 進捗とメモ -->
        <div class="card mb-4">
          <CardHeader title="進捗とメモ" subtitle="タスクの進捗率とメモを管理できます" />
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">進捗率</label>
              <div class="d-flex align-items-center">
                <input 
                  v-if="isEditMode"
                  type="range" 
                  class="form-range me-3"
                  min="0"
                  max="100"
                  v-model="editForm.progress"
                >
                <span class="badge bg-gradient-primary">{{ scheduleDetail.progress }}%</span>
              </div>
              <div class="progress mt-2">
                <div 
                  class="progress-bar bg-gradient-primary" 
                  :style="{ width: scheduleDetail.progress + '%' }"
                ></div>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">メモ</label>
              <textarea 
                v-if="isEditMode"
                class="form-control"
                rows="3"
                v-model="editForm.notes"
              ></textarea>
              <p v-else class="form-control-plaintext">{{ scheduleDetail.notes }}</p>
            </div>
          </div>
        </div>

        <!-- 状態変更履歴 -->
        <div class="card mb-4">
          <CardHeader title="状態変更履歴" subtitle="タスクの状態変更履歴を確認できます" />
          <div class="card-body">
            <div class="timeline timeline-one-side">
              <div 
                v-for="(history, index) in statusHistory" 
                :key="index"
                class="timeline-block mb-3"
              >
                <span class="timeline-step">
                  <div class="avatar avatar-sm bg-gradient-info">
                    <i class="material-symbols-rounded text-white opacity-10">swap_horiz</i>
                  </div>
                </span>
                <div class="timeline-content">
                  <h6 class="text-dark text-sm font-weight-bold mb-0">
                    {{ history.from }} → {{ history.to }}
                  </h6>
                  <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">
                    {{ history.user }} • {{ history.timestamp }}
                  </p>
                  <p class="text-sm mt-1 mb-0 text-muted">{{ history.reason }}</p>
                </div>
              </div>
            </div>
            
            <!-- 履歴が空の場合 -->
            <div v-if="statusHistory.length === 0" class="text-center py-3">
              <i class="material-symbols-rounded text-muted opacity-50" style="font-size: 48px;">history</i>
              <p class="text-sm text-muted mt-2">状態変更履歴がありません</p>
            </div>
          </div>
        </div>

        <!-- コメントセクション（DB連携モード） -->
        <CommentsSection
          v-model="newComment"
          :task-id="scheduleDetail.id"
          :author-user-id="currentUserId || undefined"
        />
      </div>

      <!-- サイドバー -->
      <div class="col-lg-4">
        <!-- ステータスと優先度 -->
        <div class="card mb-4">
          <CardHeader title="ステータス" subtitle="タスクの状態と優先度を確認できます" />
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="text-sm">ステータス</span>
              <!-- 編集モードではセレクトで変更可能にする -->
              <template v-if="isEditMode">
                <select
                  class="form-select form-select-sm"
                  style="width: auto; min-width: 160px;"
                  v-model="editForm.status"
                >
                  <option value="NOT_STARTED">未着手</option>
                  <option value="IN_PROGRESS">進行中</option>
                  <option value="BLOCKED">ブロック</option>
                  <option value="DONE">完了</option>
                  <option value="CANCELLED">キャンセル</option>
                </select>
              </template>
              <template v-else>
                <StatusBadge :status="scheduleDetail.status" />
              </template>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="text-sm">優先度</span>
              <!-- 編集モードではセレクトで変更可能にする -->
              <template v-if="isEditMode">
                <select
                  class="form-select form-select-sm"
                  style="width: auto; min-width: 160px;"
                  v-model="editForm.priority"
                >
                  <option value="LOW">低</option>
                  <option value="MEDIUM">中</option>
                  <option value="HIGH">高</option>
                  <option value="URGENT">緊急</option>
                </select>
              </template>
              <template v-else>
                <PriorityBadge :priority="scheduleDetail.priority" />
              </template>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="text-sm">担当者</span>
              <div class="d-flex align-items-center">
                <span class="text-sm font-weight-bold me-2">{{ scheduleDetail.assignee }}</span>
                <select 
                  v-if="isEditMode"
                  class="form-select form-select-sm"
                  style="width: auto; min-width: 120px;"
                  @change="changeAssignee(Number(($event.target as HTMLSelectElement).value))"
                >
                  <option value="">担当者を選択</option>
                  <option 
                    v-for="user in availableUsers" 
                    :key="user.id" 
                    :value="user.id"
                    :selected="user.name === scheduleDetail.assignee"
                  >
                    {{ user.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- ステータス変更クイックアクション -->
            <div v-if="!isEditMode" class="mt-4 pt-3 border-top">
              <label class="form-label text-xs font-weight-bold mb-2">ステータス変更</label>
              <div class="d-grid gap-2 status-action-buttons">
                <button
                  v-for="action in quickActions"
                  :key="action.status"
                  :class="`btn btn-${action.color} btn-xs`"
                  @click="executeQuickAction(action)"
                  :title="`${action.label}に変更`"
                >
                  <i class="material-symbols-rounded me-1" style="font-size: 0.875rem;">{{ action.icon }}</i>
                  <span style="font-size: 0.75rem;">{{ action.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 日付情報 -->
        <div class="card mb-4">
          <CardHeader title="スケジュール" subtitle="タスクの開始日と終了日を管理できます" />
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label text-sm">開始日</label>
              <input 
                v-if="isEditMode"
                type="date" 
                class="form-control"
                v-model="editForm.startDate"
              >
              <p v-else class="form-control-plaintext">{{ scheduleDetail.startDate }}</p>
            </div>
            <div class="mb-3">
              <label class="form-label text-sm">終了日</label>
              <input 
                v-if="isEditMode"
                type="date" 
                class="form-control"
                v-model="editForm.endDate"
              >
              <p v-else class="form-control-plaintext">{{ scheduleDetail.endDate }}</p>
            </div>
          </div>
        </div>

        <!-- 親タスク -->
        <div class="card mb-4">
          <CardHeader title="親タスク" subtitle="このタスクの親タスクを設定できます" />
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label text-sm">親タスク</label>
              <template v-if="isEditMode">
                <select
                  class="form-select form-select-sm"
                  :value="editForm.parentTaskId || null"
                  @change="changeParentTask(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
                >
                  <option :value="null">親タスクなし</option>
                  <option 
                    v-for="task in availableParentTasks" 
                    :key="task.id" 
                    :value="task.id"
                  >
                    {{ task.task_name }}
                  </option>
                </select>
                <div v-if="isLoadingParentTasks" class="text-muted text-xs mt-2">
                  <i class="material-symbols-rounded" style="font-size: 0.875rem;">sync</i>
                  親タスク候補を読み込み中...
                </div>
              </template>
              <template v-else>
                <p v-if="scheduleDetail.parentTaskName" class="form-control-plaintext">
                  <i class="material-symbols-rounded me-1" style="font-size: 1rem;">account_tree</i>
                  {{ scheduleDetail.parentTaskName }}
                </p>
                <p v-else class="form-control-plaintext text-muted">
                  親タスクが設定されていません
                </p>
              </template>
            </div>
          </div>
        </div>

        <!-- タグ -->
        <div class="card mb-4">
          <CardHeader title="タグ" subtitle="タスクに関連するタグを管理できます" />
          <div class="card-body">
            <!-- タグ表示 -->
            <div class="d-flex flex-wrap gap-2 mb-3">
              <span 
                v-for="tag in scheduleDetail.tags" 
                :key="tag"
                class="badge bg-gradient-info d-flex align-items-center"
              >
                {{ tag }}
                <button 
                  v-if="isEditMode"
                  class="btn-close btn-close-white ms-2"
                  style="font-size: 0.6rem;"
                  @click="handleRemoveTag(tag)"
                  :title="`${tag}を削除`"
                ></button>
              </span>
              <!-- タグが存在しない場合のメッセージ -->
              <span v-if="scheduleDetail.tags.length === 0" class="text-muted text-sm">
                タグが設定されていません
              </span>
            </div>
            
            <!-- タグ管理ボタン -->
            <div class="mt-3">
              <button 
                v-if="!isEditMode"
                class="btn btn-sm bg-gradient-secondary me-2"
                @click="toggleEditMode"
              >
                <i class="material-symbols-rounded me-1">edit</i>
                編集してタグを管理
              </button>
              <button 
                v-else
                class="btn btn-sm bg-gradient-primary"
                @click="showTagModal = true"
              >
                <i class="material-symbols-rounded me-1">label</i>
                タグを管理
              </button>
            </div>
          </div>
        </div>

        <!-- GitHub 連携カード -->
        <div class="card mb-4">
          <CardHeader title="GitHub 連携" subtitle="紐づくリポジトリの状態を確認します" />
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label text-sm">表示ブランチ</label>
              <div class="d-flex flex-wrap gap-2 align-items-center">
                <select
                  class="form-select form-select-sm github-branch-select"
                  v-model="githubBranch"
                  :disabled="isBranchesLoading"
                >
                  <option
                    v-for="branch in githubBranches"
                    :key="branch.name"
                    :value="branch.name"
                  >
                    {{ branch.name }}
                  </option>
                </select>
                <button
                  class="btn btn-outline-secondary btn-sm"
                  type="button"
                  :disabled="isBranchesLoading"
                  @click="refreshGitHubBranches"
                >
                  <i class="material-symbols-rounded me-1" style="font-size: 0.875rem;">refresh</i>
                  再読込
                </button>
              </div>
              <p v-if="branchError" class="text-danger text-xs mt-2">{{ branchError }}</p>
            </div>
            <GitHubRepositoryCard :owner="githubOwner" :repo="githubRepo" />
            <p class="text-xs text-muted mt-3">
              環境変数 <code>VITE_GITHUB_DEFAULT_OWNER</code> / <code>VITE_GITHUB_DEFAULT_REPO</code> で対象リポジトリを変更できます。
            </p>
            <div class="mt-4">
              <label class="form-label text-sm d-flex align-items-center gap-2">
                最新コミット ({{ githubBranch }})
                <span v-if="isCommitsLoading" class="text-muted text-xs d-flex align-items-center gap-1">
                  <i class="material-symbols-rounded" style="font-size: 0.875rem;">sync</i>
                  取得中...
                </span>
              </label>
              <p v-if="commitError" class="text-danger text-xs">{{ commitError }}</p>
              <ul v-else-if="githubCommits.length > 0" class="list-unstyled mb-0">
                <li
                  v-for="commit in githubCommits"
                  :key="commit.sha"
                  class="mb-3 github-commit-item"
                >
                  <p class="mb-1 fw-semibold">{{ commit.commit.message }}</p>
                  <small class="text-muted d-block">
                    {{ commit.commit.author?.name || "不明な作者" }} • {{ formatCommitDate(commit.commit.author?.date) }}
                  </small>
                  <a
                    class="text-xs d-inline-flex align-items-center mt-1"
                    :href="commit.html_url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    コミットを表示
                    <i class="material-symbols-rounded ms-1" style="font-size: 0.875rem;">open_in_new</i>
                  </a>
                </li>
              </ul>
              <p v-else class="text-muted text-sm">コミット履歴が見つかりません。</p>
            </div>
          </div>
        </div>

        <!-- 添付ファイル（共通コンポーネントに分離） -->
        <AttachmentManager
          :attachments="scheduleDetail.attachments"
          :isEditMode="isEditMode"
          @upload="handleFileUpload"
        />
      </div>
    </div>

    <!-- タグ管理モーダル（共通コンポーネントに分離） -->
    <TagManagerModal
      :show="showTagModal"
      :availableTags="availableTags"
      :selectedTags="scheduleDetail.tags || []"
      @close="showTagModal = false"
      @add="(tag: string) => addTag(tag)"
    />
    </template>
  </div>
</template>

<style scoped>
/* スケジュール詳細ページのスタイリング */
.schedule-detail-page {
  padding: 1rem;
}

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

/* タイムラインのスタイリング */
.timeline-step {
  position: relative;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
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

/* クイックアクションボタンのスタイリング */
.btn-outline-success:hover {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

.btn-outline-primary:hover {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-outline-warning:hover {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}

/* タグのスタイリング */
.badge {
  transition: all 0.2s ease-in-out;
}

.badge:hover {
  transform: scale(1.05);
}

.btn-close {
  opacity: 0.7;
}

.btn-close:hover {
  opacity: 1;
}

/* 状態変更履歴のスタイリング */
.timeline-step .avatar {
  background: linear-gradient(45deg, #667eea, #764ba2);
}

/* 担当者選択のスタイリング */
.form-select-sm {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
}

/* 人気タグボタンのスタイリング */
.btn-outline-secondary {
  border-radius: 1rem;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

/* ステータス変更ボタンのスタイリング */
.d-grid {
  display: grid;
}

.d-grid.gap-2 {
  gap: 0.375rem;
}

/* ステータスアクションボタンのサイズ調整 */
.status-action-buttons .btn-xs {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  line-height: 1.2;
  border-radius: 0.375rem;
}

/* クイックアクションボタンのグラデーション効果 */
.status-action-buttons .btn-success {
  background: linear-gradient(310deg, #17ad37, #98ec2d);
  border: none;
  color: white;
}

.status-action-buttons .btn-success:hover {
  background: linear-gradient(310deg, #158f2f, #82d827);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(23, 173, 55, 0.3);
}

.status-action-buttons .btn-primary {
  background: linear-gradient(310deg, #2152ff, #21d4fd);
  border: none;
  color: white;
}

.status-action-buttons .btn-primary:hover {
  background: linear-gradient(310deg, #1a42cc, #1aafd1);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(33, 82, 255, 0.3);
}

.status-action-buttons .btn-warning {
  background: linear-gradient(310deg, #f53939, #fbcf33);
  border: none;
  color: white;
}

.status-action-buttons .btn-warning:hover {
  background: linear-gradient(310deg, #c92e2e, #d4ab28);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(245, 57, 57, 0.3);
}

.status-action-buttons .btn-danger {
  background: linear-gradient(310deg, #ea0606, #ff667c);
  border: none;
  color: white;
}

.status-action-buttons .btn-danger:hover {
  background: linear-gradient(310deg, #c00505, #e05566);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(234, 6, 6, 0.3);
}

/* GitHubカードのカスタムスタイル */
.github-branch-select {
  min-width: 180px;
}

.github-commit-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 0.5rem;
}

.github-commit-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .schedule-detail-page {
    padding: 0.5rem;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  /* クイックアクションボタンを縦並びに */
  .d-flex.gap-1 {
    flex-direction: column;
    gap: 0.5rem !important;
  }
  
  /* タグ入力エリアの調整 */
  .input-group-sm {
    flex-direction: column;
  }
  
  .input-group-sm .form-control {
    border-radius: 0.375rem 0.375rem 0 0;
  }
  
  .input-group-sm .btn {
    border-radius: 0 0 0.375rem 0.375rem;
  }
}
</style>
