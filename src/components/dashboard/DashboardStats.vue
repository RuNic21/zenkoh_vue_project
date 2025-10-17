<script setup lang="ts">
// ダッシュボードの統計カード群を表示
const props = defineProps<{
  inProgressCount: number;
  completedCount: number;
  completionRate: number;
  overdueCount: number;
}>();
</script>

<template>
  <!-- 統計カード -->
  <div class="row mb-4">
    <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
      <div class="card">
        <div class="card-header p-2 ps-3">
          <div class="d-flex justify-content-between">
            <div>
              <p class="text-sm mb-0 text-capitalize">進行中プロジェクト</p>
              <h4 class="mb-0">{{ props.inProgressCount }}</h4>
            </div>
            <div class="icon icon-md icon-shape bg-gradient-primary shadow-dark shadow text-center border-radius-lg">
              <i class="material-symbols-rounded opacity-10">work</i>
            </div>
          </div>
        </div>
        <hr class="dark horizontal my-0">
        <div class="card-footer p-2 ps-3">
          <p class="mb-0 text-sm">
            <span class="text-success font-weight-bolder">&nbsp;</span>
          </p>
        </div>
      </div>
    </div>

    <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
      <div class="card">
        <div class="card-header p-2 ps-3">
          <div class="d-flex justify-content-between">
            <div>
              <p class="text-sm mb-0 text-capitalize">完了プロジェクト</p>
              <h4 class="mb-0">{{ props.completedCount }}</h4>
            </div>
            <div class="icon icon-md icon-shape bg-gradient-success shadow-dark shadow text-center border-radius-lg">
              <i class="material-symbols-rounded opacity-10">task</i>
            </div>
          </div>
        </div>
        <hr class="dark horizontal my-0">
        <div class="card-footer p-2 ps-3">
          <p class="mb-0 text-sm">
            <span class="text-success font-weight-bolder">&nbsp;</span>
          </p>
        </div>
      </div>
    </div>

    <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
      <div class="card">
        <div class="card-header p-2 ps-3">
          <div class="d-flex justify-content-between">
            <div>
              <p class="text-sm mb-0 text-capitalize">完了率</p>
              <h4 class="mb-0">{{ props.completionRate }}%</h4>
            </div>
            <div class="icon icon-md icon-shape bg-gradient-info shadow-dark shadow text-center border-radius-lg">
              <i class="material-symbols-rounded opacity-10">trending_up</i>
            </div>
          </div>
        </div>
        <hr class="dark horizontal my-0">
        <div class="card-footer p-2 ps-3">
          <p class="mb-0 text-sm">
            <span class="text-success font-weight-bolder">&nbsp;</span>
          </p>
        </div>
      </div>
    </div>

    <div class="col-xl-3 col-sm-6">
      <div class="card">
        <div class="card-header p-2 ps-3">
          <div class="d-flex justify-content-between">
            <div>
              <p class="text-sm mb-0 text-capitalize">期限切れ</p>
              <h4 class="mb-0">{{ props.overdueCount }}</h4>
            </div>
            <div class="icon icon-md icon-shape bg-gradient-warning shadow-dark shadow text-center border-radius-lg">
              <i class="material-symbols-rounded opacity-10">warning</i>
            </div>
          </div>
        </div>
        <hr class="dark horizontal my-0">
        <div class="card-footer p-2 ps-3">
          <p class="mb-0 text-sm">
            <span class="text-danger font-weight-bolder">注意が必要</span>
          </p>
        </div>
      </div>
    </div>
  </div>
  <!-- /統計カード -->
</template>

<style scoped>
/* このコンポーネント固有の追加スタイルがあればここに */
</style>


