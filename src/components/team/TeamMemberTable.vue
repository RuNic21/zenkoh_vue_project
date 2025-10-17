<script setup lang="ts">
// チームメンバー一覧テーブル（プレゼンテーショナル）
import { TEAM_ROLE_LABELS } from "@/types/team";

type Member = {
  id: string;
  user: { id: number; display_name: string };
  role: string;
  joined_at?: string;
};

const props = defineProps<{
  rows: Member[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'changeRole', memberId: string, role: string): void;
  (e: 'remove', memberId: string): void;
}>();

const onChangeRole = (memberId: string, role: string) => emit('changeRole', memberId, role);
const onRemove = (memberId: string) => emit('remove', memberId);
</script>

<template>
  <div class="card">
    <div class="card-header pb-0">
      <h6>チームメンバー</h6>
    </div>
    <div class="card-body px-0 pt-0 pb-2">
      <div v-if="props.loading" class="text-center py-4">読み込み中...</div>
      <div v-else class="table-responsive p-0">
        <table class="table align-items-center mb-0">
          <thead>
            <tr>
              <th class="text-secondary text-xxs opacity-7">ユーザー</th>
              <th class="text-secondary text-xxs opacity-7">役割</th>
              <th class="text-secondary text-xxs opacity-7">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in props.rows" :key="m.id">
              <td>{{ m.user.display_name }}</td>
              <td>
                <select class="form-select form-select-sm" :value="m.role" @change="onChangeRole(m.id, ($event.target as HTMLSelectElement).value)">
                  <option value="OWNER">{{ TEAM_ROLE_LABELS.OWNER }}</option>
                  <option value="CONTRIBUTOR">{{ TEAM_ROLE_LABELS.CONTRIBUTOR }}</option>
                  <option value="REVIEWER">{{ TEAM_ROLE_LABELS.REVIEWER }}</option>
                </select>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-danger" @click="onRemove(m.id)">削除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 必要に応じてスタイルを追加 */
</style>


