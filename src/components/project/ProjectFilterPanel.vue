<script setup lang="ts">
// プロジェクトフィルターパネル
// 目的: 検索/状態/期限フィルターUIを分離して再利用性を高める

import { computed } from "vue";

// Props 定義
interface Props {
  // 検索クエリ
  search: string;
  // 状態フィルター（all | active | archived）
  status: string;
  // 期限フィルター（all | this-month | overdue）
  date: string;
  // 組み込みフィールドの表示可否
  useBuiltinFields?: boolean;
  // 見出しタイトル
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  useBuiltinFields: true,
  title: "フィルタリング・検索"
});

// Emits 定義
const emit = defineEmits<{
  'update:search': [value: string];
  'update:status': [value: string];
  'update:date': [value: string];
  'reset': [];
}>();

// v-model 風のゲッター/セッター
const modelSearch = computed({
  get: () => props.search,
  set: (v: string) => emit('update:search', v)
});

const modelStatus = computed({
  get: () => props.status,
  set: (v: string) => emit('update:status', v)
});

const modelDate = computed({
  get: () => props.date,
  set: (v: string) => emit('update:date', v)
});

// リセットハンドラー
const handleReset = () => emit('reset');
</script>

<template>
  <!-- フィルタリング・検索カード -->
  <div class="card">
    <div class="card-header pb-0">
      <h6>{{ title }}</h6>
    </div>
    <div class="card-body">
      <div v-if="useBuiltinFields" class="row">
        <div class="col-md-4 col-sm-6 mb-3">
          <label class="form-label text-sm">検索</label>
          <input 
            type="text" 
            class="form-control" 
            placeholder="プロジェクト名で検索..."
            v-model="modelSearch"
          >
        </div>

        <div class="col-md-3 col-sm-6 mb-3">
          <label class="form-label text-sm">状態</label>
          <select class="form-control" v-model="modelStatus">
            <option value="all">すべての状態</option>
            <option value="active">アクティブ</option>
            <option value="archived">アーカイブ</option>
          </select>
        </div>

        <div class="col-md-3 col-sm-6 mb-3">
          <label class="form-label text-sm">期限</label>
          <select class="form-control" v-model="modelDate">
            <option value="all">すべての期限</option>
            <option value="this-month">今月</option>
            <option value="overdue">期限切れ</option>
          </select>
        </div>

        <div class="col-md-2 col-sm-6 mb-3 d-flex align-items-end">
          <button 
            class="btn btn-sm bg-gradient-secondary mb-0 w-100"
            @click="handleReset"
          >
            リセット
          </button>
        </div>
      </div>

      <!-- 追加要素のためのスロット -->
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* レイアウトは親と同様、Bootstrap/Materialのスタイルに準拠 */
</style>


