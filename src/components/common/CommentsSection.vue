<script setup lang="ts">
import CardHeader from "./CardHeader.vue";
import EmptyState from "./EmptyState.vue";
import type { ScheduleComment } from "@/types/schedule";

// コメントセクション: コメント一覧表示と新規入力・送信を提供
// - 親からコメント配列と入力値(v-model)を受け取る
// - 送信時に add イベントをemit
const props = defineProps<{
  // コメント一覧（表示用）
  comments?: ScheduleComment[];
  // 入力値（v-model）
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "add"): void;
}>();

// 入力変更ハンドラ（双方向バインディング）
const onInput = (value: string) => {
  // 未定義防止と常に文字列として扱う
  emit("update:modelValue", value ?? "");
};

// Enterキー/ボタンクリックで送信
const triggerAdd = () => {
  emit("add");
};
</script>

<template>
  <!-- コメントセクションカード -->
  <div class="card">
    <CardHeader title="コメント" subtitle="タスクに関するコメントを管理できます" />
    <div class="card-body">
      <!-- コメント一覧 -->
      <div v-if="(comments?.length || 0) > 0" class="timeline timeline-one-side">
        <div
          v-for="comment in (comments || [])"
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


