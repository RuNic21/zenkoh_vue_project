<script setup lang="ts">
// タスク統計ヘッダー
// 目的: タスクモーダル上部の4統計カードを分離

import { computed } from "vue";

interface Props {
  // タスク配列
  tasks: Array<{
    status: string;
  }>;
}

const props = defineProps<Props>();

const totalCount = computed(() => props.tasks.length);
const doneCount = computed(() => props.tasks.filter(t => t.status === 'DONE').length);
const inProgressCount = computed(() => props.tasks.filter(t => t.status === 'IN_PROGRESS').length);
const blockedCount = computed(() => props.tasks.filter(t => t.status === 'BLOCKED').length);
</script>

<template>
  <div class="row mb-4">
    <div class="col-md-3">
      <div class="card bg-gradient-primary text-white">
        <div class="card-body p-3">
          <div class="d-flex justify-content-between">
            <div>
              <p class="text-sm mb-0">総タスク数</p>
              <h4 class="mb-0">{{ totalCount }}</h4>
            </div>
            <div class="icon icon-md">
              <i class="material-symbols-rounded opacity-10">task</i>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card bg-gradient-success text-white">
        <div class="card-body p-3">
          <div class="d-flex justify-content-between">
            <div>
              <p class="text-sm mb-0">完了済み</p>
              <h4 class="mb-0">{{ doneCount }}</h4>
            </div>
            <div class="icon icon-md">
              <i class="material-symbols-rounded opacity-10">check_circle</i>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card bg-gradient-info text-white">
        <div class="card-body p-3">
          <div class="d-flex justify-content-between">
            <div>
              <p class="text-sm mb-0">進行中</p>
              <h4 class="mb-0">{{ inProgressCount }}</h4>
            </div>
            <div class="icon icon-md">
              <i class="material-symbols-rounded opacity-10">play_circle</i>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card bg-gradient-warning text-white">
        <div class="card-body p-3">
          <div class="d-flex justify-content-between">
            <div>
              <p class="text-sm mb-0">ブロック</p>
              <h4 class="mb-0">{{ blockedCount }}</h4>
            </div>
            <div class="icon icon-md">
              <i class="material-symbols-rounded opacity-10">block</i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 親のデザインに合わせるため個別スタイルは最小限 */
</style>


