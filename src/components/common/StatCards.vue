<script setup lang="ts">
// 4分割の統計カードグリッド
// 目的: ラベル/値/アイコン/色を受け取り、カードを並べて表示

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'secondary';
  footer?: string;
}

interface Props {
  items: StatItem[];
}

const props = defineProps<Props>();
</script>

<template>
  <div class="row">
    <div 
      v-for="(it, idx) in items" 
      :key="idx" 
      class="col-xl-3 col-sm-6 mb-xl-0 mb-4"
    >
      <div class="card">
        <div class="card-header p-2 ps-3">
          <div class="d-flex justify-content-between">
            <div>
              <p class="text-sm mb-0 text-capitalize">{{ it.label }}</p>
              <h4 class="mb-0">{{ it.value }}</h4>
            </div>
            <div class="icon icon-md icon-shape" :class="`bg-gradient-${it.color}`" style="box-shadow: var(--bs-box-shadow);">
              <i class="material-symbols-rounded opacity-10">{{ it.icon }}</i>
            </div>
          </div>
        </div>
        <hr class="dark horizontal my-0">
        <div class="card-footer p-2 ps-3" v-if="it.footer">
          <p class="mb-0 text-sm">
            {{ it.footer }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>


