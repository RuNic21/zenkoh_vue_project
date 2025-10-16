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
}>();

const emit = defineEmits<{
  (e: 'edit', id: number): void;
  (e: 'delete', id: number): void;
}>();

const onEdit = (id: number) => emit('edit', id);
const onDelete = (id: number) => emit('delete', id);
</script>

<template>
  <div class="card">
    <div class="card-header pb-0">
      <h6>アラートルール一覧</h6>
    </div>
    <div class="card-body px-0 pt-0 pb-2">
      <div v-if="props.loading" class="text-center py-4">読み込み中...</div>
      <div v-else class="table-responsive p-0">
        <table class="table align-items-center mb-0">
          <thead>
            <tr>
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
    </div>
  </div>
</template>

<style scoped>
/* 必要に応じて追加 */
</style>


