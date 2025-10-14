<script setup lang="ts">
// レポート用チャートコンポーネント
// 目的: Chart.js を使用してレポートデータを視覚化

import { ref, onMounted, watch, nextTick } from "vue";
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

// チャートオプション
const getChartOptions = () => {
  const baseOptions = {
    responsive: props.responsive,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: props.showLegend,
        position: "top" as const,
      },
      title: {
        display: !!props.title,
        text: props.title,
        font: {
          size: 16,
          weight: "bold" as const
        }
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1
      }
    }
  };

  // チャートタイプ別のオプション
  switch (props.type) {
    case "bar":
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      };
    case "doughnut":
    case "pie":
      return {
        ...baseOptions,
        cutout: props.type === "doughnut" ? "50%" : 0
      };
    case "line":
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      };
    default:
      return baseOptions;
  }
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
    options: getChartOptions()
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
onMounted(() => {
  return cleanup;
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
