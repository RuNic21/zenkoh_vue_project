<script setup lang="ts">
// レポートチャートブロック
// 目的: タイトル付きのチャート枠を共通化（Bootstrap3/Materialカード混在回避）

import ReportChart from "../Charts/ReportChart.vue";

interface Props {
  title: string;
  type: "bar" | "doughnut" | "line" | "pie";
  height?: number;
  data: any;
}

const props = withDefaults(defineProps<Props>(), {
  height: 300
});
</script>

<template>
  <div class="card">
    <div class="card-header pb-0">
      <h6>{{ title }}</h6>
    </div>
    <div class="card-body">
      <ReportChart :data="data" :type="type" :height="height" />
    </div>
  </div>
</template>

<style scoped>
/* レイアウトは既存カードに追従 */
</style>


