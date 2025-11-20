<script setup lang="ts">
// ガントチャートコンポーネント
// 目的: プロジェクトタイムラインとタスクスケジュールをガントチャートで可視化

import { ref, onMounted, watch, computed } from "vue";
import type { GanttTaskData, GanttChartOptions } from "@/types/report";

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
    // Frappe Ganttを動的にロード
    const Gantt = (await import("frappe-gantt")).default;

    // 既存チャートがあれば削除
    if (ganttChart.value) {
      chartContainer.value.innerHTML = "";
    }

    // ガントチャート生成
    ganttChart.value = new Gantt(chartContainer.value, ganttData.value, {
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

    // ステータス別カラースタイル適用
    applyCustomStyles();
  } catch (error) {
    console.error("ガントチャート初期化失敗:", error);
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
  changeViewMode
});
</script>

<template>
  <div class="gantt-chart-wrapper">
    <!-- ビューモード変更ボタン -->
    <div class="gantt-controls mb-3">
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
    </div>

    <!-- ガントチャートコンテナ -->
    <div
      v-if="tasks.length > 0"
      ref="chartContainer"
      class="gantt-container"
      :style="{ height: `${height}px` }"
    ></div>

    <!-- データなし表示 -->
    <div v-else class="empty-state text-center py-5">
      <i class="material-symbols-rounded text-muted" style="font-size: 48px">
        event_busy
      </i>
      <p class="text-muted mt-3">
        日程が設定されたタスクがありません
      </p>
    </div>

    <!-- 凡例 -->
    <div class="gantt-legend mt-3">
      <small class="text-muted">
        <span class="legend-item">
          <span class="legend-color" style="background-color: #28a745"></span>
          完了
        </span>
        <span class="legend-item">
          <span class="legend-color" style="background-color: #007bff"></span>
          進行中
        </span>
        <span class="legend-item">
          <span class="legend-color" style="background-color: #6c757d"></span>
          未開始
        </span>
        <span class="legend-item">
          <span class="legend-color" style="background-color: #ffc107"></span>
          ブロック
        </span>
        <span class="legend-item">
          <span class="legend-color" style="background-color: #dc3545"></span>
          キャンセル
        </span>
      </small>
    </div>
  </div>
</template>

<style scoped>
.gantt-chart-wrapper {
  background: white;
  border-radius: 8px;
  padding: 1rem;
}

.gantt-controls {
  display: flex;
  justify-content: flex-start;
  gap: 0.5rem;
}

.gantt-container {
  overflow-x: auto;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.empty-state {
  padding: 3rem 1rem;
}

.gantt-legend {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  margin-right: 1rem;
}

.legend-color {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 4px;
  border-radius: 2px;
}
</style>

<style>
/* Frappe Gantt 글로벌 스타일 오버라이드 */
.gantt .bar {
  cursor: pointer;
  transition: opacity 0.2s;
}

.gantt .bar:hover {
  opacity: 0.8;
}

.gantt-popup {
  padding: 1rem;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.gantt-popup h6 {
  margin-bottom: 0.5rem;
  color: #344767;
}

.gantt-popup p {
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  color: #67748e;
}

.gantt-popup strong {
  color: #344767;
}
</style>

