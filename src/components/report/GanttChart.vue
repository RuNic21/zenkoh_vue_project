<script setup lang="ts">
// ガントチャートコンポーネント
// 目的: プロジェクトタイムラインとタスクスケジュールをガントチャートで可視化

import { ref, onMounted, watch, computed, nextTick } from "vue";
import type { GanttTaskData, GanttChartOptions } from "@/types/report";
// Frappe Gantt CSSをインポート（assetsフォルダから）
import "@/assets/css/frappe-gantt.css";

// Props定義
const props = withDefaults(
  defineProps<{
    tasks: GanttTaskData[]; // ガントチャートに表示するタスクリスト
    options?: GanttChartOptions; // チャートオプション
    height?: number; // チャート高さ (px)
  }>(),
  {
    height: 400
  }
);

// チャートコンテナ参照
const chartContainer = ref<HTMLDivElement | null>(null);
const ganttChart = ref<any>(null);

// ステータス別カラーマッピング
const getStatusColor = (status: string): string => {
  switch (status) {
    case "DONE":
      return "#28a745"; // 完了 - 緑
    case "IN_PROGRESS":
      return "#007bff"; // 進行中 - 青
    case "BLOCKED":
      return "#ffc107"; // ブロック - 黄
    case "CANCELLED":
      return "#dc3545"; // キャンセル - 赤
    default:
      return "#6c757d"; // 未開始 - グレー
  }
};

// ガントチャート用データ変換
const ganttData = computed(() => {
  return props.tasks.map((task) => ({
    id: task.id,
    name: `${task.name} (${task.assigneeName})`,
    start: task.start,
    end: task.end,
    progress: task.progress,
    dependencies: task.dependencies,
    custom_class: task.status.toLowerCase()
  }));
});

// ガントチャート初期化（Frappe Gantt使用）
const initializeGantt = async () => {
  if (!chartContainer.value || props.tasks.length === 0) {
    return;
  }

  try {
    // DOMが完全にレンダリングされるまで待機
    await nextTick();
    
    // コンテナのサイズを確認（最大3回までリトライ）
    let retryCount = 0;
    while (chartContainer.value.offsetWidth === 0 && retryCount < 3) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retryCount++;
    }

    // Frappe Ganttを動的にロード
    const Gantt = (await import("frappe-gantt")).default;

    // 既存チャートがあれば削除
    if (ganttChart.value) {
      try {
        ganttChart.value = null;
      } catch (e) {
        // 無視
      }
    }

    // コンテナをクリア
    chartContainer.value.innerHTML = "";

    // データを検証（日付形式を確認）
    const validTasks = ganttData.value.filter(task => {
      if (!task.start || !task.end) {
        console.warn("タスクに開始日または終了日がありません:", task);
        return false;
      }
      return true;
    });

    if (validTasks.length === 0) {
      console.warn("有効なタスクデータがありません");
      return;
    }

    // ガントチャート生成
    ganttChart.value = new Gantt(chartContainer.value, validTasks, {
      view_mode: props.options?.viewMode || "Week",
      date_format: "YYYY-MM-DD",
      language: "ja",
      custom_popup_html: (task: any) => {
        // カスタムポップアップ（タスククリック時表示）
        const taskData = props.tasks.find((t) => t.id === task.id);
        if (!taskData) return "";

        return `
          <div class="gantt-popup">
            <h6>${taskData.name}</h6>
            <p><strong>プロジェクト:</strong> ${taskData.projectName}</p>
            <p><strong>担当者:</strong> ${taskData.assigneeName}</p>
            <p><strong>期間:</strong> ${taskData.start} ~ ${taskData.end}</p>
            <p><strong>進捗率:</strong> ${taskData.progress}%</p>
            <p><strong>状態:</strong> ${taskData.status}</p>
            <p><strong>優先度:</strong> ${taskData.priority}</p>
          </div>
        `;
      },
      on_click: (task: any) => {
        console.log("タスククリック:", task);
      },
      on_date_change: (task: any, start: Date, end: Date) => {
        console.log("日程変更:", task.id, start, end);
        // TODO: 日程変更時にサーバー更新
      },
      on_progress_change: (task: any, progress: number) => {
        console.log("進捗率変更:", task.id, progress);
        // TODO: 進捗率変更時にサーバー更新
      }
    });

    // ステータス別カラースタイル適用（少し遅延させて適用）
    setTimeout(() => {
      applyCustomStyles();
      // 初期ズームレベルを適用
      applyZoom();
    }, 100);
  } catch (error) {
    console.error("ガントチャート初期化失敗:", error);
    console.error("エラー詳細:", error);
  }
};

// ステータス別カスタムスタイル適用
const applyCustomStyles = () => {
  if (!chartContainer.value) return;

  // 各タスクにステータス別カラー適用
  props.tasks.forEach((task) => {
    const barElement = chartContainer.value?.querySelector(
      `.bar[data-id="${task.id}"]`
    );
    if (barElement) {
      (barElement as HTMLElement).style.fill = getStatusColor(task.status);
    }
  });
};

// ビューモード変更
const changeViewMode = (mode: "Day" | "Week" | "Month" | "Year") => {
  if (ganttChart.value) {
    ganttChart.value.change_view_mode(mode);
    // ビューモード変更後にスタイル再適用
    setTimeout(() => {
      applyCustomStyles();
    }, 100);
  }
};

// ズーム機能
const zoomLevel = ref(1);
const minZoom = 0.5;
const maxZoom = 2;

const zoomIn = () => {
  if (zoomLevel.value < maxZoom) {
    zoomLevel.value = Math.min(zoomLevel.value + 0.1, maxZoom);
    applyZoom();
  }
};

const zoomOut = () => {
  if (zoomLevel.value > minZoom) {
    zoomLevel.value = Math.max(zoomLevel.value - 0.1, minZoom);
    applyZoom();
  }
};

const resetZoom = () => {
  zoomLevel.value = 1;
  applyZoom();
};

const applyZoom = () => {
  if (!chartContainer.value) return;
  const ganttElement = chartContainer.value.querySelector('.gantt');
  if (ganttElement) {
    (ganttElement as HTMLElement).style.transform = `scale(${zoomLevel.value})`;
    (ganttElement as HTMLElement).style.transformOrigin = 'top left';
  }
};

// コンポーネントマウント時にチャート初期化
onMounted(() => {
  initializeGantt();
});

// データ変更検知時にチャート再生成
watch(
  () => props.tasks,
  () => {
    initializeGantt();
  },
  { deep: true }
);

// 外部からビューモード変更可能にexpose
defineExpose({
  changeViewMode,
  zoomIn,
  zoomOut,
  resetZoom
});
</script>

<template>
  <div class="gantt-chart-wrapper">
    <!-- コントロールパネル -->
    <div class="gantt-controls d-flex justify-content-between align-items-center flex-wrap gap-2">
      <!-- ビューモード変更ボタン -->
      <div class="btn-group" role="group">
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          @click="changeViewMode('Day')"
        >
          日
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          @click="changeViewMode('Week')"
        >
          週
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          @click="changeViewMode('Month')"
        >
          月
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          @click="changeViewMode('Year')"
        >
          年
        </button>
      </div>
      
      <!-- ズームコントロール -->
      <div class="btn-group" role="group">
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          @click="zoomOut"
          :disabled="zoomLevel <= minZoom"
          title="縮小"
        >
          <i class="material-symbols-rounded" style="font-size: 18px">remove</i>
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          @click="resetZoom"
          title="リセット"
        >
          <span style="font-size: 12px">{{ Math.round(zoomLevel * 100) }}%</span>
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          @click="zoomIn"
          :disabled="zoomLevel >= maxZoom"
          title="拡大"
        >
          <i class="material-symbols-rounded" style="font-size: 18px">add</i>
        </button>
      </div>
    </div>

    <!-- ガントチャートコンテナ -->
    <div
      v-if="tasks.length > 0"
      ref="chartContainer"
      class="gantt-container"
      :style="{ 
        height: `${height}px`,
        maxHeight: `${height}px`,
        '--gantt-height': `${height}px`
      }"
    ></div>

    <!-- データなし表示 -->
    <div v-else class="empty-state text-center py-3">
      <i class="material-symbols-rounded text-muted" style="font-size: 32px">
        event_busy
      </i>
      <p class="text-muted mt-2 mb-0" style="font-size: 0.875rem;">
        日程が設定されたタスクがありません
      </p>
    </div>

    <!-- 凡例（コンパクト版） -->
    <div class="gantt-legend mt-2 pt-2 border-top">
      <div class="d-flex justify-content-center align-items-center flex-wrap gap-2">
        <span class="legend-item">
          <span class="legend-color" style="background-color: #28a745"></span>
          <span class="legend-text">完了</span>
        </span>
        <span class="legend-item">
          <span class="legend-color" style="background-color: #007bff"></span>
          <span class="legend-text">進行中</span>
        </span>
        <span class="legend-item">
          <span class="legend-color" style="background-color: #6c757d"></span>
          <span class="legend-text">未開始</span>
        </span>
        <span class="legend-item">
          <span class="legend-color" style="background-color: #ffc107"></span>
          <span class="legend-text">ブロック</span>
        </span>
        <span class="legend-item">
          <span class="legend-color" style="background-color: #dc3545"></span>
          <span class="legend-text">キャンセル</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gantt-chart-wrapper {
  background: transparent;
  border-radius: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}

.gantt-controls {
  display: flex;
  justify-content: flex-start;
  gap: 0.25rem;
  margin-bottom: 0.5rem !important;
  width: 100%;
  box-sizing: border-box;
}

.gantt-container {
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  /* 高さを明示的に制限（props.heightで指定された値） */
  height: var(--gantt-height, 280px);
  max-height: var(--gantt-height, 280px);
  overflow-x: auto;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  position: relative;
  background: #fff;
  /* スクロールバーのスタイル改善 */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
  /* コンテナの高さを超えないように */
  box-sizing: border-box;
  /* カードの範囲を超えないように */
  margin: 0;
}

.gantt-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.gantt-container::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 4px;
}

.gantt-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.gantt-container::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* Frappe Gantt SVG コンテナのスタイル */
.gantt-container :deep(.gantt) {
  width: 100% !important;
  min-width: 100%;
  display: block;
  transition: transform 0.2s ease;
  /* 高さを制限してスクロール可能にする */
  max-height: none;
  height: auto;
}

.gantt-container :deep(.gantt svg) {
  width: 100% !important;
  min-width: 100%;
  display: block;
  /* SVGの高さは自動計算されるが、コンテナ内でスクロール */
  height: auto !important;
  max-height: none;
}

/* フォントサイズと行の高さを調整（よりコンパクトに） */
.gantt-container :deep(.gantt .upper-text),
.gantt-container :deep(.gantt .lower-text) {
  font-size: 9px !important;
  font-weight: 500;
}

.gantt-container :deep(.gantt .bar-label) {
  font-size: 9px !important;
  font-weight: 500;
}

/* 行の高さを調整（よりコンパクトに） */
.gantt-container :deep(.gantt .grid-row) {
  height: 24px !important;
}

.gantt-container :deep(.gantt .bar-wrapper) {
  height: 18px !important;
}

/* 左サイドバー（タスクリスト）の幅を調整 */
.gantt-container :deep(.gantt .upper-row),
.gantt-container :deep(.gantt .lower-row) {
  font-size: 9px !important;
}

.empty-state {
  padding: 3rem 1rem;
}

.gantt-legend {
  display: block;
  width: 100%;
  max-width: 100%;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #dee2e6;
  box-sizing: border-box;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  margin-right: 0.75rem;
  white-space: nowrap;
}

.legend-color {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 4px;
  border-radius: 3px;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.legend-text {
  font-size: 0.75rem;
  color: #67748e;
  font-weight: 500;
}
</style>

<style>
/* Frappe Gantt グローバルスタイルオーバーライド */
.gantt {
  width: 100% !important;
  min-width: 100%;
  font-family: inherit;
  display: block;
  position: relative;
}

/* ガントチャートのコンテナ全体 */
.gantt-container .gantt {
  width: 100% !important;
  min-width: 100%;
  height: 100%;
}

/* SVG要素のスタイル */
.gantt svg {
  width: 100% !important;
  height: auto !important;
  display: block;
}

/* タスクバーのスタイル */
.gantt .bar {
  cursor: pointer;
  transition: opacity 0.2s;
  stroke-width: 1;
  stroke: rgba(0, 0, 0, 0.1);
}

.gantt .bar:hover {
  opacity: 0.8;
  stroke-width: 2;
}

.gantt .bar-wrapper {
  cursor: pointer;
}

/* グリッド背景 */
.gantt .grid-background {
  fill: #f8f9fa;
}

.gantt .grid-row {
  fill: #fff;
}

.gantt .grid-row:nth-child(even) {
  fill: #f8f9fa;
}

.gantt .row-line {
  stroke: #e0e0e0;
  stroke-width: 1;
}

/* 今日のハイライト */
.gantt .today-highlight {
  fill: #fff3cd;
  opacity: 0.5;
}

/* 依存関係の矢印 */
.gantt .arrow {
  fill: #999;
  stroke: #999;
}

/* タスクラベル */
.gantt .bar-label {
  fill: #fff;
  font-size: 12px;
  font-weight: 500;
}

/* ヘッダー */
.gantt .upper-text,
.gantt .lower-text {
  fill: #344767;
  font-size: 12px;
}

/* 左サイドバー（タスクリスト） */
.gantt .upper-row,
.gantt .lower-row {
  fill: #fff;
}

.gantt .upper-row .row-line,
.gantt .lower-row .row-line {
  stroke: #e0e0e0;
}

.gantt-popup {
  padding: 1rem;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 200px;
}

.gantt-popup h6 {
  margin-bottom: 0.5rem;
  color: #344767;
  font-size: 1rem;
  font-weight: 600;
}

.gantt-popup p {
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  color: #67748e;
  line-height: 1.5;
}

.gantt-popup strong {
  color: #344767;
  font-weight: 600;
}
</style>

