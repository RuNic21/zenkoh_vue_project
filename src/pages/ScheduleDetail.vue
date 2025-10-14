<script setup lang="ts">
// スケジュール詳細ページ: 個別スケジュールの詳細表示・編集

// TODO: DB連携されていない機能
// 1. コメントシステム - 現在メモリ上でのみ管理
//    - addComment()関数でDB保存ロジック実装が必要
//    - コメント削除/編集機能実装が必要
//    - コメント作成者認証システム実装が必要
//
// 2. 添付ファイルシステム - 現在メモリ上でのみ管理
//    - handleFileUpload()関数で実際のファイルアップロード実装が必要
//    - ファイルダウンロード機能実装が必要
//    - ファイル削除機能実装が必要
//    - ファイルサイズ制限およびタイプ検証実装が必要
//
// 3. タグシステム - 現在表示のみで編集不可
//    - タグ追加/削除UI実装が必要
//    - タグ自動補完機能実装が必要
//    - タグ別フィルタリング機能実装が必要
//
// 4. メモ/ノートシステム - 現在編集可能だがDB保存されない
//    - メモデータをDBからロード/保存するロジック実装が必要
//    - メモ履歴機能実装が必要
//
// 5. ユーザー権限管理 - 現在すべてのユーザーがすべての作業可能
//    - ユーザー別権限チェックシステム実装が必要
//    - 所有者/編集者/閲覧者権限区分実装が必要
//
// 6. データ検証 - 現在クライアントサイド検証のみ
//    - サーバーサイドデータ検証実装が必要
//    - 必須フィールド検証強化が必要
//
// 7. オフラインサポート - 現在オンラインでのみ動作
//    - オフラインモードサポート実装が必要
//    - データ同期機能実装が必要

// TODO: 新規追加機能のDB連携実装が必要
// 8. タグ管理システム - 現在メモリ上でのみ管理
//    - tasksテーブルにtags TEXT[]カラム追加が必要
//    - addTag()/removeTag()関数でDB保存ロジック実装が必要
//    - taskAdapter.tsでtagsフィールドの変換ロジック実装が必要
//    - タグの重複チェック機能実装が必要
//    - タグ使用頻度統計機能実装が必要
//
// 9. 状態変更履歴システム - 現在メモリ上でのみ管理
//    - tasksテーブルにstatus_history JSONBカラム追加が必要
//    - executeQuickAction()でヒストリーをDBに保存するロジック実装が必要
//    - 状態変更履歴の永続化機能実装が必要
//    - 履歴の表示・フィルタリング機能実装が必要
//    - 変更理由の入力機能実装が必要
//
// 10. 担当者変更システム - 現在ユーザー名のみ変更
//    - changeAssignee()でprimary_assignee_idをDBに保存するロジック実装が必要
//    - ユーザー名→ユーザーID変換ロジック実装が必要
//    - taskAdapter.tsでprimary_assignee_idフィールドの変換ロジック実装が必要
//    - 担当者変更履歴機能実装が必要
//    - 担当者権限チェック機能実装が必要
//
// 11. クイックアクションシステム - 現在状態変更のみDB保存
//    - executeQuickAction()でヒストリーをDBに保存するロジック実装が必要
//    - アクション実行時の通知機能実装が必要
//    - アクションの権限チェック機能実装が必要
//    - カスタムアクション定義機能実装が必要
//
// 12. データベーススキーマ拡張
//    - tasksテーブルに以下のカラム追加が必要:
//      * tags TEXT[] - タグ配列
//      * status_history JSONB - 状態変更履歴
//      * notes TEXT - メモ/ノート
//      * comments JSONB - コメント配列
//      * attachments JSONB - 添付ファイル情報
//    - インデックス作成: tags, status_history用のGINインデックス
//    - 制約追加: tags配列の最大長制限
//
// 13. サービス層拡張
//    - taskService.tsに新フィールド処理ロジック追加が必要
//    - JSONBフィールドのシリアライズ/デシリアライズ処理実装が必要
//    - バッチ更新機能実装が必要
//    - 履歴クエリ最適化実装が必要
//
// 14. アダプター層拡張
//    - taskAdapter.tsに新フィールド変換ロジック実装が必要
//    - ユーザー名↔ユーザーID変換関数実装が必要
//    - JSONBフィールドの型安全な変換実装が必要
//    - デフォルト値処理の統一実装が必要

import { ref, computed, onMounted, watch } from "vue";
import { useScheduleStore } from "../store/schedule";
import type { ScheduleItem, ScheduleStatus, SchedulePriority, ScheduleAttachment, ScheduleComment } from "../types/schedule";
import { getStatusBadgeClass, getPriorityColorClass } from "../utils/uiHelpers";

// 共有ストアから選択中スケジュールを参照（欠損プロパティを安全に補完）
const store = useScheduleStore();
const isLoading = store.isLoading;
const errorMessage = store.errorMessage;
const scheduleDetail = computed<ScheduleItem>(() => {
  const base = {
    id: 0,
    title: "スケジュール未選択",
    description: "左の一覧からスケジュールを選択してください",
    startDate: "",
    endDate: "",
    status: "予定" as ScheduleStatus,
    priority: "中" as SchedulePriority,
    assignee: "",
    progress: 0,
    category: "",
    tags: [] as string[],
    notes: "",
    attachments: [] as ScheduleAttachment[],
    comments: [] as ScheduleComment[],
  };
  const src = (store.selectedSchedule.value as ScheduleItem | null) || ({} as Partial<ScheduleItem>);
  return { ...base, ...src, 
    // 配列/文字列系は欠損時に既定値を強制
    tags: Array.isArray(src.tags) ? src.tags : base.tags,
    attachments: Array.isArray(src.attachments) ? src.attachments : base.attachments,
    comments: Array.isArray(src.comments) ? src.comments : base.comments,
    notes: typeof src.notes === "string" ? src.notes : base.notes,
    category: typeof src.category === "string" ? src.category : base.category,
  };
});

// 編集モードの管理
const isEditMode = ref(false);
const editForm = ref<ScheduleItem>({ ...scheduleDetail.value });

// 選択スケジュールが変わったら編集フォームを同期
watch(scheduleDetail, (val) => {
  editForm.value = { ...val };
});

// 新しいコメントの入力
const newComment = ref("");

// タグ管理
const newTag = ref("");
const availableTags = ref(["緊急", "重要", "バグ修正", "新機能", "改善", "テスト", "ドキュメント", "レビュー"]);

// 状態変更履歴
const statusHistory = ref([
  { from: "予定", to: "進行中", user: "田中太郎", timestamp: "2024-01-15 10:30", reason: "作業開始" },
  { from: "進行中", to: "完了", user: "佐藤花子", timestamp: "2024-01-16 15:45", reason: "作業完了" }
]);

// 利用可能なユーザー一覧
const availableUsers = ref([
  { id: 1, name: "田中太郎", avatar: "T" },
  { id: 2, name: "佐藤花子", avatar: "S" },
  { id: 3, name: "鈴木一郎", avatar: "S" },
  { id: 4, name: "高橋美咲", avatar: "T" }
]);

// クイックアクション
const quickActions = ref([
  { label: "開始", status: "進行中", icon: "play_arrow", color: "success" },
  { label: "完了", status: "完了", icon: "check", color: "primary" },
  { label: "保留", status: "保留", icon: "pause", color: "warning" },
  { label: "遅延", status: "遅延", icon: "schedule", color: "danger" }
]);

// ステータス別の色を取得（uiHelpersからインポート済み）
// 優先度別の色を取得（uiHelpersからインポート済み）

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

// コメント追加
const addComment = () => {
  if (newComment.value.trim()) {
    const comment: ScheduleComment = {
      id: Date.now(),
      author: "現在のユーザー",
      content: newComment.value,
      timestamp: new Date().toLocaleString('ja-JP'),
      avatar: "U"
    };
    // comments は computed で必ず配列に正規化されるため non-null で扱う
    scheduleDetail.value.comments!.push(comment);
    newComment.value = "";
  }
};

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

// タグ追加
const addTag = (tag: string) => {
  if (tag.trim() && !(editForm.value.tags || []).includes(tag.trim())) {
    if (!editForm.value.tags) {
      editForm.value.tags = [];
    }
    editForm.value.tags.push(tag.trim());
    newTag.value = "";
  }
};

// タグ削除
const removeTag = (tagToRemove: string) => {
  if (editForm.value.tags) {
    editForm.value.tags = editForm.value.tags.filter(tag => tag !== tagToRemove);
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

// コンポーネント初期化
onMounted(() => {
  console.log("スケジュール詳細ページが読み込まれました");
});
</script>

<template>
  <!-- スケジュール詳細ページ -->
  <div class="schedule-detail-page">
    <!-- ローディング/エラー表示 -->
    <div v-if="isLoading" class="alert alert-secondary" role="alert">
      読み込み中です...
    </div>
    <div v-if="!isLoading && errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
    </div>
    <!-- ページヘッダー -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h3 class="mb-0 h4 font-weight-bolder">スケジュール詳細</h3>
            <p class="mb-0 text-sm text-muted">
              スケジュールの詳細情報を確認・編集できます
            </p>
          </div>
          <div class="d-flex gap-2">
            <!-- クイックアクションボタン -->
            <div v-if="!isEditMode" class="d-flex gap-1 me-3">
              <button 
                v-for="action in quickActions" 
                :key="action.status"
                class="btn btn-sm"
                :class="`btn-outline-${action.color}`"
                @click="executeQuickAction(action)"
                :title="`${action.label}に変更`"
              >
                <i class="material-symbols-rounded">{{ action.icon }}</i>
              </button>
            </div>
            
            <button 
              v-if="!isEditMode"
              class="btn btn-outline-primary"
              @click="toggleEditMode"
            >
              <i class="material-symbols-rounded me-2">edit</i>
              編集
            </button>
            <button 
              v-else
              class="btn bg-gradient-primary"
              @click="saveChanges"
            >
              <i class="material-symbols-rounded me-2">save</i>
              保存
            </button>
            <button 
              v-if="isEditMode"
              class="btn btn-outline-secondary"
              @click="cancelEdit"
            >
              <i class="material-symbols-rounded me-2">cancel</i>
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- メインコンテンツ -->
      <div class="col-lg-8">
        <!-- 基本情報カード -->
        <div class="card mb-4">
          <div class="card-header pb-0">
            <h6 class="mb-0">基本情報</h6>
          </div>
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
          <div class="card-header pb-0">
            <h6 class="mb-0">進捗とメモ</h6>
          </div>
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
          <div class="card-header pb-0">
            <h6 class="mb-0">状態変更履歴</h6>
          </div>
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

        <!-- コメントセクション -->
        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">コメント</h6>
          </div>
          <div class="card-body">
            <!-- コメント一覧 -->
            <div class="timeline timeline-one-side">
              <div 
                v-for="comment in scheduleDetail.comments" 
                :key="comment.id"
                class="timeline-block mb-3"
              >
                <span class="timeline-step">
                  <div class="avatar avatar-sm bg-gradient-secondary">
                    <span class="text-white text-xs">{{ comment.avatar }}</span>
                  </div>
                </span>
                <div class="timeline-content">
                  <h6 class="text-dark text-sm font-weight-bold mb-0">{{ comment.author }}</h6>
                  <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">{{ comment.timestamp }}</p>
                  <p class="text-sm mt-2 mb-0">{{ comment.content }}</p>
                </div>
              </div>
            </div>

            <!-- 新しいコメント入力 -->
            <div class="mt-4">
              <div class="input-group">
                <input 
                  type="text" 
                  class="form-control"
                  v-model="newComment"
                  placeholder="コメントを入力..."
                  @keyup.enter="addComment"
                >
                <button 
                  class="btn bg-gradient-primary"
                  @click="addComment"
                >
                  <i class="material-symbols-rounded">send</i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- サイドバー -->
      <div class="col-lg-4">
        <!-- ステータスと優先度 -->
        <div class="card mb-4">
          <div class="card-header pb-0">
            <h6 class="mb-0">ステータス</h6>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="text-sm">ステータス</span>
              <span 
                class="badge"
                :class="getStatusBadgeClass(scheduleDetail.status)"
              >
                {{ scheduleDetail.status }}
              </span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="text-sm">優先度</span>
              <span 
                class="text-sm font-weight-bold"
                :class="getPriorityColorClass(scheduleDetail.priority)"
              >
                {{ scheduleDetail.priority }}
              </span>
            </div>
            <div class="d-flex justify-content-between align-items-center">
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
          </div>
        </div>

        <!-- 日付情報 -->
        <div class="card mb-4">
          <div class="card-header pb-0">
            <h6 class="mb-0">スケジュール</h6>
          </div>
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
          <div class="card-header pb-0">
            <h6 class="mb-0">タグ</h6>
          </div>
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
            
            <!-- タグ追加（編集モード時のみ） -->
            <div v-if="isEditMode">
              <div class="input-group input-group-sm">
                <input 
                  type="text" 
                  class="form-control"
                  v-model="newTag"
                  placeholder="タグを入力..."
                  @keyup.enter="addTag(newTag)"
                  list="tag-suggestions"
                >
                <button 
                  class="btn btn-outline-primary"
                  @click="addTag(newTag)"
                  :disabled="!newTag.trim()"
                >
                  <i class="material-symbols-rounded">add</i>
                </button>
              </div>
              
              <!-- タグ候補 -->
              <datalist id="tag-suggestions">
                <option v-for="tag in filteredTags" :key="tag" :value="tag"></option>
              </datalist>
              
              <!-- 人気タグ -->
              <div class="mt-2">
                <small class="text-muted">人気タグ:</small>
                <div class="d-flex flex-wrap gap-1 mt-1">
                  <button 
                    v-for="tag in availableTags.slice(0, 4)" 
                    :key="tag"
                    class="btn btn-sm btn-outline-secondary"
                    @click="addTag(tag)"
                    :disabled="(scheduleDetail.tags || []).includes(tag)"
                  >
                    {{ tag }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 添付ファイル -->
        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">添付ファイル</h6>
          </div>
          <div class="card-body">
            <div v-if="(scheduleDetail.attachments?.length || 0) > 0">
              <div 
                v-for="file in (scheduleDetail.attachments || [])" 
                :key="file.name"
                class="d-flex align-items-center mb-2"
              >
                <i class="material-symbols-rounded me-2">attach_file</i>
                <div class="flex-grow-1">
                  <p class="text-sm mb-0">{{ file.name }}</p>
                  <p class="text-xs text-muted mb-0">{{ file.size }}</p>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted">
              <p class="text-sm mb-0">添付ファイルはありません</p>
            </div>
            <div v-if="isEditMode" class="mt-3">
              <input 
                type="file" 
                class="form-control"
                multiple
                @change="handleFileUpload"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
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
