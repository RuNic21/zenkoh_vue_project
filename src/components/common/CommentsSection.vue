<script setup lang="ts">
import { ref, computed, onMounted, withDefaults, watch } from "vue";
import CardHeader from "./CardHeader.vue";
import EmptyState from "./EmptyState.vue";
import type { ScheduleComment } from "@/types/schedule";
import { listTaskComments, createTaskComment } from "@/services/commentService";
import type { TaskCommentWithAuthor } from "@/types/comment";

// コメントセクション: コメント一覧表示と新規入力・送信を提供
// - 親からコメント配列と入力値(v-model)を受け取る
// - DB連携（任意）: taskId と authorUserId が与えられた場合は内部で取得/登録
const props = withDefaults(defineProps<{
  // コメント一覧（外部提供・サービス未使用時に表示）
  comments?: ScheduleComment[];
  // 入力値（v-model）
  modelValue: string;
  // DB 連携用: タスクID（指定時は内部で取得/登録を行う）
  taskId?: number;
  // DB 連携用: 投稿者ユーザーID（users.id）
  authorUserId?: number;
  // マウント時に自動取得するか（デフォルト: true）
  autoFetch?: boolean;
}>(), {
  autoFetch: true,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "add"): void;
}>();

// サービス利用判定（taskId/authorUserId が有効な正の数の場合のみ有効）
// - 0 や undefined の場合はサービスモード無効とする
const isServiceMode = computed(() => {
  const hasValidTaskId = typeof props.taskId === "number" && props.taskId > 0;
  const hasValidAuthorId = typeof props.authorUserId === "number" && props.authorUserId > 0;
  return hasValidTaskId && hasValidAuthorId;
});

// 内部状態（サービス利用時のみ使用）
const isLoading = ref(false);
const localComments = ref<ScheduleComment[]>([]);

// v_task_comments → UI 表示用コメントに変換
const toScheduleComment = (row: TaskCommentWithAuthor): ScheduleComment => {
  const initial = (row.author || "").slice(0, 1).toUpperCase();
  return {
    id: row.id,
    author: row.author,
    content: row.content,
    timestamp: row.timestamp,
    avatar: initial,
  };
};

// 表示用コメント（サービス時は内部、非サービス時は props）
const displayComments = computed<ScheduleComment[]>(() => {
  return isServiceMode.value ? localComments.value : (props.comments ?? []);
});

// 日付表示用フォーマッタ（ISO 文字列を日本語ローカライズに変換）
// - 不正な日付は素通しし、画面にそのまま表示する
const formatTimestamp = (ts: string): string => {
  // ts は Supabase 由来の ISO 文字列を想定
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) {
    return ts;
  }
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// 入力変更ハンドラ（双方向バインディング）
const onInput = (value: string) => {
  // 未定義防止と常に文字列として扱う
  emit("update:modelValue", value ?? "");
};

// コメント一覧の読み込み（サービスモード時）
const loadComments = async () => {
  if (!isServiceMode.value || !props.taskId) return;
  try {
    isLoading.value = true;
    const rows = await listTaskComments(props.taskId);
    localComments.value = rows.map(toScheduleComment);
  } finally {
    isLoading.value = false;
  }
};

// Enterキー/ボタンクリックで送信
const triggerAdd = async () => {
  const text = (props.modelValue ?? "").trim();
  if (text.length === 0) {
    // 空投稿は無視
    return;
  }

  // サービスモード: その場でDB登録→一覧へ反映
  if (isServiceMode.value && props.taskId && props.authorUserId) {
    const created = await createTaskComment({
      task_id: props.taskId,
      author_user_id: props.authorUserId,
      content: text,
    });
    if (created) {
      // 新着として先頭に追加
      localComments.value = [toScheduleComment(created), ...localComments.value];
    }
    // 入力値クリア
    emit("update:modelValue", "");
    return;
  }

  // 非サービスモード: 親へ通知（従来動作）
  emit("add");
};

// ライフサイクル: マウント時自動取得（サービスモード）
onMounted(() => {
  if (props.autoFetch && isServiceMode.value) {
    void loadComments();
  }
});

// taskId / authorUserId 変更監視: 後から揃った場合も自動取得を実行
watch(
  () => [props.taskId, props.authorUserId] as const,
  () => {
    if (props.autoFetch && isServiceMode.value) {
      void loadComments();
    }
  }
);
</script>

<template>
  <!-- コメントセクションカード -->
  <div class="card">
    <CardHeader title="コメント" subtitle="タスクに関するコメントを管理できます" />
    <div class="card-body">
      <!-- コメント一覧 -->
      <div v-if="(displayComments.length || 0) > 0" class="timeline timeline-one-side">
        <div
          v-for="comment in displayComments"
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
            <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">{{ formatTimestamp(comment.timestamp) }}</p>
            <p class="text-sm mt-2 mb-0">{{ comment.content }}</p>
          </div>
        </div>
      </div>

      <!-- コメントなしの場合 -->
      <EmptyState
        v-else
        icon="comment"
        title="コメントがありません"
        subtitle="このタスクに関するコメントを追加してください"
      />

      <!-- 新しいコメント入力 -->
      <div class="mt-4">
        <div class="input-group">
          <input
            type="text"
            class="form-control"
            :value="modelValue"
            placeholder="コメントを入力..."
            @input="onInput(($event.target as HTMLInputElement).value)"
            @keyup.enter="triggerAdd"
          >
          <button
            class="btn bg-gradient-primary"
            @click="triggerAdd"
          >
            <i class="material-symbols-rounded">send</i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
</style>


