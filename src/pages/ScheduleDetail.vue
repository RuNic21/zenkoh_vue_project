<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useScheduleDetail } from "@/composables/useScheduleDetail";
import { useScheduleStore } from "../store/schedule";
import { useMessage, useConfirm } from "@/composables/useMessage";
import type { ScheduleItem, ScheduleStatus, SchedulePriority, ScheduleAttachment, ScheduleComment } from "../types/schedule";
import { listUsers } from "../services/dbServices";
import type { Users } from "../types/db/users";

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

// TODO: 現在のスキーマで即座に実装可能な機能
// 1. 基本情報編集機能の完全実装
//    - task_name, description フィールドの完全DB連携
//    - progress_percent フィールドの実装（0-100の範囲制限）
//    - status フィールドの実装（NOT_STARTED, IN_PROGRESS, BLOCKED, DONE, CANCELLED）
//    - priority フィールドの実装（LOW, MEDIUM, HIGH, URGENT）
//
// 2. 担当者管理システムの完全実装
//    - primary_assignee_id フィールドでusersテーブルと連携
//    - changeAssignee()関数でDB保存ロジック実装
//    - ユーザー名↔ユーザーID変換ロジック実装
//    - 担当者変更時の権限チェック機能実装
//
// 3. スケジュール管理システムの完全実装
//    - planned_start, planned_end フィールドの実装
//    - actual_start, actual_end フィールドの実装
//    - 計画vs実績の比較表示機能実装
//    - 日付バリデーション機能実装
//
// 4. プロジェクト連携システムの実装
//    - project_id フィールドでprojectsテーブルと連携
//    - プロジェクト情報の表示（project.name, project.description）
//    - プロジェクト別フィルタリング機能実装
//
// 5. 状態変更履歴システムの実装
//    - created_at, updated_at, created_by, updated_by フィールド活用
//    - 状態変更時の履歴記録機能実装
//    - 変更者情報の表示機能実装
//    - 履歴の時系列表示機能実装
//
// 6. クイックアクションシステムの改善
//    - executeQuickAction()でactual_start/actual_end自動記録
//    - 状態変更時の進捗率自動調整機能実装
//    - アクション実行時の通知機能実装
//    - カスタムアクション定義機能実装
//
// 7. WBSコード管理システムの実装
//    - wbs_code フィールドの表示・編集機能実装
//    - WBSコードのバリデーション機能実装
//    - WBSコードによるソート機能実装
//
// 8. 親子タスク関係システムの実装
//    - parent_task_id フィールドの活用
//    - 子タスク一覧表示機能実装
//    - 親タスクへのナビゲーション機能実装
//    - タスク階層の視覚化機能実装

// TODO: スキーマ拡張が必要な機能（将来実装）
// 9. タグ管理システム - 現在メモリ上でのみ管理
//    - tasksテーブルにtags TEXT[]カラム追加が必要
//    - addTag()/removeTag()関数でDB保存ロジック実装が必要
//    - taskAdapter.tsでtagsフィールドの変換ロジック実装が必要
//    - タグの重複チェック機能実装が必要
//    - タグ使用頻度統計機能実装が必要
//
// 10. コメントシステム - 現在メモリ上でのみ管理
//    - tasksテーブルにcomments JSONBカラム追加が必要
//    - addComment()関数でDB保存ロジック実装が必要
//    - コメント削除/編集機能実装が必要
//    - コメント作成者認証システム実装が必要
//
// 11. 添付ファイルシステム - 現在メモリ上でのみ管理
//    - tasksテーブルにattachments JSONBカラム追加が必要
//    - handleFileUpload()関数で実際のファイルアップロード実装が必要
//    - ファイルダウンロード機能実装が必要
//    - ファイル削除機能実装が必要
//    - ファイルサイズ制限およびタイプ検証実装が必要
//
// 12. メモ/ノートシステム - 現在descriptionフィールドで代用可能
//    - tasksテーブルにnotes TEXTカラム追加が必要
//    - メモデータをDBからロード/保存するロジック実装が必要
//    - メモ履歴機能実装が必要
//
// 13. チームメンバー管理システム - task_membersテーブル活用
//    - task_membersテーブルとの連携実装が必要
//    - チームメンバー追加/削除機能実装が必要
//    - メンバー役割管理機能実装が必要
//    - メンバー別権限管理機能実装が必要
//
// 14. 通知システム - notificationsテーブル活用
//    - alert_rulesテーブルとの連携実装が必要
//    - タスク状態変更時の通知機能実装が必要
//    - 期限切れ通知機能実装が必要
//    - カスタム通知ルール設定機能実装が必要
//
// 15. 活動ログシステム - activitiesテーブル活用
//    - タスク操作のログ記録機能実装が必要
//    - 活動履歴の表示機能実装が必要
//    - ログフィルタリング機能実装が必要
//    - ログエクスポート機能実装が必要

// TODO: データベーススキーマ拡張案
// 16. スキーマ拡張提案
//    - tasksテーブルに以下のカラム追加を検討:
//      * tags TEXT[] - タグ配列
//      * comments JSONB - コメント配列
//      * attachments JSONB - 添付ファイル情報
//      * notes TEXT - メモ/ノート
//      * status_history JSONB - 状態変更履歴
//    - インデックス作成: tags, status_history用のGINインデックス
//    - 制約追加: tags配列の最大長制限
//
// 17. サービス層拡張
//    - taskService.tsに新フィールド処理ロジック追加が必要
//    - JSONBフィールドのシリアライズ/デシリアライズ処理実装が必要
//    - バッチ更新機能実装が必要
//    - 履歴クエリ最適化実装が必要
//
// 18. アダプター層拡張
//    - taskAdapter.tsに新フィールド変換ロジック実装が必要
//    - ユーザー名↔ユーザーID変換関数実装が必要
//    - JSONBフィールドの型安全な変換実装が必要
//    - デフォルト値処理の統一実装が必要

// スケジュール詳細画面のデータ/操作群をcomposable(useScheduleDetail)から取得
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
  changeStatus,       // ステータス変更関数
  changePriority,     // 優先度変更関数
  changeProgress,     // 進捗率変更関数
  addTag,             // タグ追加関数
  removeTag,          // タグ削除関数
  addComment,         // コメント追加関数
} = useScheduleDetail();

// メッセージシステム
const { showSuccess, showError } = useMessage();
const { confirm: confirmDialog } = useConfirm();

// スケジュールストアを取得
const store = useScheduleStore();

// コメント追加（composable 関数に入力値を渡すラッパー）
const onAddComment = () => {
  addComment(newComment.value);
};

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
    console.log("スケジュールが保存されました");
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
    console.log("スケジュールが削除されました");
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

// タグ追加/削除は composable の関数を使用

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

// クイックアクション実行
const executeQuickAction = async (action: any) => {
  try {
    editForm.value.status = action.status;
    await saveChanges();
    
    // 状態変更履歴に追加
    statusHistory.value.unshift({
      from: scheduleDetail.value.status,
      to: action.status,
      user: "現在のユーザー",
      timestamp: new Date().toLocaleString('ja-JP'),
      reason: `${action.label}アクション実行`
    });
    
    console.log(`${action.label}アクションを実行しました`);
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
onMounted(() => {
  console.log("スケジュール詳細ページが読み込まれました");
});
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
        :actions="getHeaderActions()"
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

        <!-- コメントセクション（共通コンポーネントに分離） -->
        <CommentsSection
          :comments="scheduleDetail.comments"
          v-model="newComment"
          @add="onAddComment"
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
                  @click="removeTag(tag)"
                  :title="`${tag}を削除`"
                ></button>
              </span>
            </div>
            
            <!-- タグ管理ボタン -->
            <div v-if="isEditMode" class="mt-3">
              <button 
                class="btn btn-sm bg-gradient-primary"
                @click="showTagModal = true"
              >
                <i class="material-symbols-rounded me-1">label</i>
                タグを管理
              </button>
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
