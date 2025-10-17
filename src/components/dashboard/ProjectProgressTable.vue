<script setup lang="ts">
// プロジェクト進捗一覧テーブル
import { getStatusBadgeClass, getProgressBarClass } from "@/utils/uiHelpers";
import type { ProjectProgressRow } from "@/services/dashboardService";

const props = defineProps<{
  rows: ProjectProgressRow[];
}>();

const emit = defineEmits<{
  (e: "viewDetail", row: ProjectProgressRow): void;
}>();

const onView = (row: ProjectProgressRow) => emit("viewDetail", row);
</script>

<template>
  <div class="card">
    <div class="card-header pb-0">
      <div class="row">
        <div class="col-lg-6 col-8">
          <h6>最近更新されたプロジェクト</h6>
          <p class="text-sm mb-0">
            <i class="fa fa-chart-line text-info" aria-hidden="true"></i>
            <span class="font-weight-bold ms-1">最近更新履歴</span>があるプロジェクトの進捗状況
            <span class="badge bg-gradient-info ms-2">{{ props.rows.length }}件のプロジェクト</span>
          </p>
        </div>
      </div>
    </div>
    <div class="card-body px-0 pt-0 pb-2">
      <div class="table-responsive p-0">
        <table class="table align-items-center mb-0">
          <thead>
            <tr>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">プロジェクト名</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">担当者</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">進捗</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">状態</th>
              <th class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">期限</th>
              <th class="text-secondary opacity-7"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in props.rows" :key="project.id">
              <td>
                <div class="d-flex px-3 py-1">
                  <div class="d-flex flex-column justify-content-center">
                    <h6 class="mb-0 text-sm">{{ project.name }}</h6>
                  </div>
                </div>
              </td>
              <td>
                <p class="text-xs font-weight-bold mb-0">{{ project.owner }}</p>
              </td>
              <td class="align-middle text-center">
                <div class="d-flex flex-column align-items-center justify-content-center px-2">
                  <span class="text-xs font-weight-bold mb-1">{{ project.progress }}%</span>
                  <div class="progress w-100" style="max-width:160px;">
                    <div :class="getProgressBarClass(project.progress)" :style="{ width: project.progress + '%' }" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="project.progress"></div>
                  </div>
                </div>
              </td>
              <td class="align-middle text-center">
                <span :class="getStatusBadgeClass(project.status)">{{ project.status }}</span>
              </td>
              <td class="align-middle text-center">
                <span class="text-secondary text-xs font-weight-normal">{{ project.dueDate }}</span>
              </td>
              <td class="align-middle">
                <button class="btn btn-sm bg-gradient-primary mb-0" @click="onView(project)">詳細を見る</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* このコンポーネント固有のスタイルがあればここに */
</style>


