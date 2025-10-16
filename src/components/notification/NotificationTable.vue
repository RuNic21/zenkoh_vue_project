<script setup lang="ts">
// 通知一覧テーブル（プレゼンテーショナル）
import { NOTIFICATION_STATUS_LABELS, NOTIFICATION_STATUS_COLORS } from "@/types/notification";
import type { NotificationStatus } from "@/types/notification";

type Row = {
  id: number;
  subject: string;
  to_email: string;
  body_text: string;
  status: NotificationStatus;
  created_at: string;
};

const props = defineProps<{
  rows: Row[];
  loading: boolean;
  selectedIds?: number[];
  showSelect?: boolean;
}>();

const emit = defineEmits<{
  (e: 'resend', id: number): void;
  (e: 'delete', id: number): void;
  (e: 'select', id: number, checked: boolean): void;
  (e: 'selectAll', checked: boolean): void;
}>();

const onResend = (id: number) => emit('resend', id);
const onDelete = (id: number) => emit('delete', id);
const onSelect = (id: number, checked: boolean) => emit('select', id, checked);
const onSelectAll = (checked: boolean) => emit('selectAll', checked);

const statusColor = (s: NotificationStatus) => NOTIFICATION_STATUS_COLORS[s];
const statusLabel = (s: NotificationStatus) => NOTIFICATION_STATUS_LABELS[s];
</script>

<template>
  <div class="card">
    <div class="card-header pb-0">
      <h6>通知一覧</h6>
    </div>
    <div class="card-body px-0 pt-0 pb-2">
      <div v-if="props.loading" class="text-center py-4">読み込み中...</div>
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
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">件名</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">送信先</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ステータス</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">作成日時</th>
              <th class="text-secondary opacity-7"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in props.rows" :key="n.id">
              <td v-if="showSelect !== false" class="text-center">
                <input 
                  type="checkbox" 
                  class="form-check-input"
                  :checked="selectedIds?.includes(n.id)"
                  @change="onSelect(n.id, ($event.target as HTMLInputElement).checked)"
                >
              </td>
              <td>
                <div class="d-flex px-3 py-1">
                  <div class="d-flex flex-column justify-content-center">
                    <h6 class="mb-0 text-sm">{{ n.subject }}</h6>
                    <p class="text-xs text-secondary mb-0">{{ n.body_text?.substring(0, 50) }}...</p>
                  </div>
                </div>
              </td>
              <td><p class="text-xs font-weight-bold mb-0">{{ n.to_email }}</p></td>
              <td class="align-middle text-center">
                <span :class="`badge ${statusColor(n.status)}`">
                  {{ statusLabel(n.status) }}
                </span>
              </td>
              <td class="align-middle text-center">
                <span class="text-secondary text-xs font-weight-normal">
                  {{ new Date(n.created_at).toLocaleString('ja-JP') }}
                </span>
              </td>
              <td class="align-middle">
                <div class="btn-group" role="group">
                  <button v-if="n.status === 'FAILED'" class="btn btn-sm bg-gradient-warning mb-0" @click="onResend(n.id)">再送信</button>
                  <button class="btn btn-sm bg-gradient-danger mb-0" @click="onDelete(n.id)">削除</button>
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


