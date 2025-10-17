<script setup lang="ts">
// フィルタ UI: ダッシュボードの検索・状態・担当者・期限フィルタを表示
import { computed } from "vue";

// v-model 受け取り用の props と emit
const props = defineProps<{
  searchQuery: string;
  statusFilter: string; // 'all' | 'in-progress' | 'completed' | 'overdue'
  ownerFilter: string; // 'all' | owner name
  dateRangeFilter: string; // 'all' | 'this-week' | 'this-month' | 'overdue'
  availableOwners: string[];
}>();

const emit = defineEmits<{
  (e: "update:searchQuery", v: string): void;
  (e: "update:statusFilter", v: string): void;
  (e: "update:ownerFilter", v: string): void;
  (e: "update:dateRangeFilter", v: string): void;
  (e: "clear"): void;
}>();

// 双方向バインディング用のコンピューテッド
const modelSearch = computed({
  get: () => props.searchQuery,
  set: (v: string) => emit("update:searchQuery", v),
});
const modelStatus = computed({
  get: () => props.statusFilter,
  set: (v: string) => emit("update:statusFilter", v),
});
const modelOwner = computed({
  get: () => props.ownerFilter,
  set: (v: string) => emit("update:ownerFilter", v),
});
const modelDate = computed({
  get: () => props.dateRangeFilter,
  set: (v: string) => emit("update:dateRangeFilter", v),
});

// クリア操作
const onClear = () => emit("clear");
</script>

<template>
  <!-- フィルタリングパネル -->
  <div class="card">
    <div class="card-header pb-0">
      <h6>フィルタリング</h6>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="col-md-3 col-sm-6 mb-3">
          <label class="form-label text-sm">検索</label>
          <input type="text" class="form-control" placeholder="プロジェクトや担当者を検索してください" v-model="modelSearch" />
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <label class="form-label text-sm">状態</label>
          <select class="form-control" v-model="modelStatus">
            <option value="all">すべての状態</option>
            <option value="in-progress">進行中</option>
            <option value="completed">完了</option>
            <option value="overdue">期限切れ</option>
          </select>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <label class="form-label text-sm">担当者</label>
          <select class="form-control" v-model="modelOwner">
            <option value="all">すべての担当者</option>
            <option v-for="owner in props.availableOwners" :key="owner" :value="owner">{{ owner }}</option>
          </select>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <label class="form-label text-sm">期限</label>
          <select class="form-control" v-model="modelDate">
            <option value="all">すべての期限</option>
            <option value="this-week">今週</option>
            <option value="this-month">今月</option>
            <option value="overdue">期限切れ</option>
          </select>
        </div>
        <div class="col-md-3 col-sm-6 mb-3 d-flex align-items-end">
          <button class="btn btn-sm bg-gradient-secondary mb-0 w-100" @click="onClear">フィルタリセット</button>
        </div>
      </div>
    </div>
  </div>
  <!-- /フィルタリングパネル -->
  
</template>

<style scoped>
/* このコンポーネント固有の追加スタイルがあればここに */
</style>


