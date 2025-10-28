<script setup lang="ts">
// アラートルール一覧テーブル（プレゼンテーショナル）

type RuleRow = {
  id: number;
  name: string;
  rule_type: string;
  is_enabled: boolean;
  notify_email?: string;
  created_at: string;
};

const props = defineProps<{
  rows: RuleRow[];
  loading: boolean;
  selectedIds?: number[];
  showSelect?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit', id: number): void;
  (e: 'delete', id: number): void;
  (e: 'select', id: number, checked: boolean): void;
  (e: 'selectAll', checked: boolean): void;
}>();

const onEdit = (id: number) => emit('edit', id);
const onDelete = (id: number) => emit('delete', id);
const onSelect = (id: number, checked: boolean) => emit('select', id, checked);
const onSelectAll = (checked: boolean) => emit('selectAll', checked);
</script>

<template>
  <!-- ローディング状態 -->
  <div v-if="props.loading" class="text-center py-4">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">読み込み中...</span>
    </div>
    <p class="text-sm text-secondary mt-2">アラートルールデータを読み込み中...</p>
  </div>
  
  <!-- テーブル -->
  <div v-else class="table-responsive p-0">
    <table class="table align-items-center mb-0">
      <thead>
        <tr>
          <th v-if="showSelect !== false" class="text-center">
            <input 
              type="checkbox" 
              class="form-check-input"
              @change="onSelectAll(($event.target as HTMLInputElement).checked)"
              :checked="(selectedIds?.length ?? 0) > 0 && (selectedIds?.length ?? 0) === rows.length"
            >
          </th>
          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ルール名</th>
          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">タイプ</th>
          <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ステータス</th>
          <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">通知先</th>
          <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">作成日時</th>
          <th class="text-secondary opacity-7"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in props.rows" :key="r.id">
          <td v-if="showSelect !== false" class="text-center">
            <input 
              type="checkbox" 
              class="form-check-input"
              :checked="selectedIds?.includes(r.id)"
              @change="onSelect(r.id, ($event.target as HTMLInputElement).checked)"
            >
          </td>
          <td><h6 class="mb-0 text-sm">{{ r.name }}</h6></td>
          <td><p class="text-xs font-weight-bold mb-0">{{ r.rule_type }}</p></td>
          <td class="align-middle text-center">
            <span class="badge" :class="r.is_enabled ? 'bg-gradient-success' : 'bg-secondary'">
              {{ r.is_enabled ? '有効' : '無効' }}
            </span>
          </td>
          <td class="align-middle text-center"><span class="text-xs font-weight-bold mb-0">{{ r.notify_email || '未設定' }}</span></td>
          <td class="align-middle text-center">
            <span class="text-secondary text-xs font-weight-normal">{{ new Date(r.created_at).toLocaleString('ja-JP') }}</span>
          </td>
          <td class="align-middle">
            <div class="btn-group" role="group">
              <button class="btn btn-sm bg-gradient-info mb-0" @click="onEdit(r.id)">編集</button>
              <button class="btn btn-sm bg-gradient-danger mb-0" @click="onDelete(r.id)">削除</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* 必要に応じて追加 */
</style>


