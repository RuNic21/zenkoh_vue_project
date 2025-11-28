<script setup lang="ts">
// レポート用チャートコンポーネント
// 目的: Chart.js を使用してレポートデータを視覚化

import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  BarController,
  DoughnutController,
  PieController,
  LineController
} from "chart.js";
import type { ChartData, ChartDataset } from "../../types/report";
import { buildChartOptions } from "../../utils/chartOptions";

// Chart.js コンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  BarController,
  DoughnutController,
  PieController,
  LineController
);

// Props 定義
interface Props {
  data: ChartData;
  type: "bar" | "doughnut" | "line" | "pie";
  title?: string;
  height?: number;
  showLegend?: boolean;
  responsive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: "bar",
  height: 300,
  showLegend: true,
  responsive: true
});

// チャートインスタンス
const chartInstance = ref<ChartJS | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// チャートオプション（chartOptionsユーティリティを使用）
const getChartOptions = () => {
  return buildChartOptions(props.type, props.title, props.showLegend);
};

// チャート作成
const createChart = async () => {
  if (!canvasRef.value || !props.data) return;

  // 既存のチャートを破棄
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }

  await nextTick();

  const ctx = canvasRef.value.getContext("2d");
  if (!ctx) return;

  chartInstance.value = new ChartJS(ctx, {
    type: props.type,
    data: props.data,
    options: getChartOptions() as any // Chart.jsの複雑な型システムを回避するためanyを使用
  });
};

// チャート更新
const updateChart = () => {
  if (chartInstance.value && props.data) {
    chartInstance.value.data = props.data;
    chartInstance.value.update();
  }
};

// ライフサイクル
onMounted(() => {
  createChart();
});

// データ変更時の更新
watch(() => props.data, () => {
  updateChart();
}, { deep: true });

// タイプ変更時の再作成
watch(() => props.type, () => {
  createChart();
});

// クリーンアップ
const cleanup = () => {
  if (chartInstance.value) {
    chartInstance.value.destroy();
    chartInstance.value = null;
  }
};

// コンポーネント破棄時のクリーンアップ
onBeforeUnmount(() => {
  cleanup();
});
</script>

<template>
  <div class="panel panel-default">
    <div class="panel-body">
      <div class="chart-container" :style="{ height: height + 'px' }">
        <canvas ref="canvasRef"></canvas>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  margin: 0 auto;
}

canvas {
  max-width: 100%;
  height: auto;
}
</style>
