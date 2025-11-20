<script setup lang="ts">
// 依存関係グラフコンポーネント
// 目的: タスク間の依存関係をネットワークグラフで可視化

import { ref, onMounted, watch } from "vue";
import type { DependencyGraphData, DependencyAnalysis } from "@/types/report";
import { Network } from "vis-network/standalone";
import type { Options } from "vis-network/standalone";

// Props定義
const props = withDefaults(
  defineProps<{
    graphData: DependencyGraphData; // ノードとエッジデータ
    analysis?: DependencyAnalysis | null; // 依存性分析結果
    height?: number; // グラフ高さ (px)
  }>(),
  {
    height: 500,
    analysis: null
  }
);

// グラフコンテナ参照
const graphContainer = ref<HTMLDivElement | null>(null);
const network = ref<Network | null>(null);
const selectedNode = ref<any>(null);

// ネットワークグラフオプション
const networkOptions: Options = {
  nodes: {
    shape: "box",
    margin: 10,
    widthConstraint: {
      maximum: 200
    },
    font: {
      size: 14,
      color: "#344767"
    },
    borderWidth: 2,
    shadow: true
  },
  edges: {
    arrows: {
      to: {
        enabled: true,
        scaleFactor: 0.5
      }
    },
    smooth: {
      type: "cubicBezier",
      forceDirection: "horizontal",
      roundness: 0.4
    },
    color: {
      color: "#999999",
      highlight: "#007bff",
      hover: "#007bff"
    },
    width: 2
  },
  layout: {
    hierarchical: {
      enabled: true,
      direction: "LR", // Left to Right
      sortMethod: "directed",
      nodeSpacing: 150,
      levelSeparation: 200,
      treeSpacing: 200
    }
  },
  physics: {
    enabled: false // 階層型レイアウトでは物理シミュレーション無効化
  },
  interaction: {
    hover: true,
    tooltipDelay: 100,
    navigationButtons: true,
    keyboard: true,
    zoomView: true,
    dragView: true
  }
};

// グラフ初期化
const initializeGraph = () => {
  if (!graphContainer.value || !props.graphData || props.graphData.nodes.length === 0) {
    return;
  }

  try {
    // 既存ネットワークがあれば削除
    if (network.value) {
      network.value.destroy();
    }

    // vis-network形式にデータ変換
    const data = {
      nodes: props.graphData.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        title: node.title,
        color: {
          background: node.color || "#e0e0e0",
          border: node.color || "#999999"
        },
        group: node.group
      })),
      edges: props.graphData.edges.map((edge) => ({
        from: edge.from,
        to: edge.to,
        label: edge.label,
        color: edge.color,
        dashes: edge.dashes || false
      }))
    };

    // ネットワーク生成
    network.value = new Network(graphContainer.value, data, networkOptions);

    // イベントリスナー登録
    network.value.on("click", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = props.graphData.nodes.find((n) => n.id === nodeId);
        selectedNode.value = node;
        console.log("ノードクリック:", node);
      } else {
        selectedNode.value = null;
      }
    });

    network.value.on("doubleClick", (params) => {
      if (params.nodes.length > 0) {
        // ダブルクリック時にタスク詳細ページへ移動などのアクション
        console.log("ノードダブルクリック:", params.nodes[0]);
      }
    });

    // クリティカルパス強調表示
    if (props.analysis && props.analysis.criticalPath.length > 0) {
      highlightCriticalPath(props.analysis.criticalPath);
    }

    // 循環依存強調表示
    if (props.analysis && props.analysis.circularDependencies.length > 0) {
      highlightCircularDependencies(props.analysis.circularDependencies);
    }
  } catch (error) {
    console.error("依存関係グラフ初期化失敗:", error);
  }
};

// クリティカルパス強調
const highlightCriticalPath = (criticalPath: string[]) => {
  if (!network.value) return;

  criticalPath.forEach((nodeId) => {
    network.value?.body.data.nodes.update({
      id: nodeId,
      borderWidth: 4,
      borderWidthSelected: 4,
      color: {
        border: "#dc3545", // 赤枠
        highlight: {
          border: "#dc3545"
        }
      }
    });
  });
};

// 循環依存強調
const highlightCircularDependencies = (cycles: string[][]) => {
  if (!network.value) return;

  cycles.forEach((cycle) => {
    cycle.forEach((nodeId) => {
      network.value?.body.data.nodes.update({
        id: nodeId,
        color: {
          background: "#fff3cd", // 黄色背景
          border: "#ffc107"
        }
      });
    });
  });
};

// レイアウト変更
const changeLayout = (layoutType: "hierarchical" | "force") => {
  if (!network.value) return;

  if (layoutType === "hierarchical") {
    network.value.setOptions({
      layout: {
        hierarchical: {
          enabled: true,
          direction: "LR",
          sortMethod: "directed"
        }
      },
      physics: {
        enabled: false
      }
    });
  } else {
    network.value.setOptions({
      layout: {
        hierarchical: {
          enabled: false
        }
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -2000,
          springLength: 200,
          springConstant: 0.04
        }
      }
    });
  }
};

// 特定ノードにフォーカス
const focusNode = (nodeId: string) => {
  if (!network.value) return;
  network.value.focus(nodeId, {
    scale: 1.5,
    animation: {
      duration: 1000,
      easingFunction: "easeInOutQuad"
    }
  });
};

// グラフ初期化
const resetView = () => {
  if (!network.value) return;
  network.value.fit({
    animation: {
      duration: 1000,
      easingFunction: "easeInOutQuad"
    }
  });
};

// コンポーネントマウント時にグラフ初期化
onMounted(() => {
  initializeGraph();
});

// データ変更検知時にグラフ再生成
watch(
  () => props.graphData,
  () => {
    initializeGraph();
  },
  { deep: true }
);

// 外部から制御可能にexpose
defineExpose({
  changeLayout,
  focusNode,
  resetView
});
</script>

<template>
  <div class="dependency-graph-wrapper">
    <!-- コントロールパネル -->
    <div class="graph-controls mb-3 d-flex justify-content-between align-items-center">
      <div class="btn-group" role="group">
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          @click="changeLayout('hierarchical')"
        >
          <i class="material-symbols-rounded me-1">account_tree</i>
          階層型
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          @click="changeLayout('force')"
        >
          <i class="material-symbols-rounded me-1">hub</i>
          フォース
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          @click="resetView"
        >
          <i class="material-symbols-rounded me-1">center_focus_strong</i>
          初期化
        </button>
      </div>

      <!-- 分析情報 -->
      <div v-if="analysis" class="analysis-summary">
        <small class="text-muted">
          <strong>総タスク:</strong> {{ analysis.totalTasks }} |
          <strong>依存関係:</strong> {{ analysis.tasksWithDependencies }} |
          <strong>最大深度:</strong> {{ analysis.maxDepth }}
          <span v-if="analysis.criticalPath.length > 0" class="text-danger ms-2">
            <strong>クリティカルパス:</strong> {{ analysis.criticalPath.length }}個
          </span>
          <span v-if="analysis.circularDependencies.length > 0" class="text-warning ms-2">
            <strong>循環依存:</strong> {{ analysis.circularDependencies.length }}個
          </span>
        </small>
      </div>
    </div>

    <!-- グラフコンテナ -->
    <div
      v-if="graphData.nodes.length > 0"
      ref="graphContainer"
      class="graph-container"
      :style="{ height: `${height}px` }"
    ></div>

    <!-- データなし表示 -->
    <div v-else class="empty-state text-center py-5">
      <i class="material-symbols-rounded text-muted" style="font-size: 48px">
        device_hub
      </i>
      <p class="text-muted mt-3">
        依存関係のあるタスクがありません
      </p>
    </div>

    <!-- 選択されたノード情報 -->
    <div v-if="selectedNode" class="selected-node-info mt-3 p-3 bg-light rounded">
      <h6 class="mb-2">
        <i class="material-symbols-rounded me-1">info</i>
        選択されたタスク
      </h6>
      <p class="mb-1"><strong>名前:</strong> {{ selectedNode.label }}</p>
      <p class="mb-1"><strong>状態:</strong> {{ selectedNode.status }}</p>
      <p class="mb-1"><strong>優先度:</strong> {{ selectedNode.priority }}</p>
      <p class="mb-0"><strong>進捗率:</strong> {{ selectedNode.progress }}%</p>
    </div>

    <!-- 凡例 -->
    <div class="graph-legend mt-3">
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
        <span v-if="analysis && analysis.criticalPath.length > 0" class="legend-item">
          <span class="legend-color" style="background-color: transparent; border: 3px solid #dc3545"></span>
          クリティカルパス
        </span>
        <span v-if="analysis && analysis.circularDependencies.length > 0" class="legend-item">
          <span class="legend-color" style="background-color: #fff3cd; border: 1px solid #ffc107"></span>
          循環依存
        </span>
      </small>
    </div>
  </div>
</template>

<style scoped>
.dependency-graph-wrapper {
  background: white;
  border-radius: 8px;
  padding: 1rem;
}

.graph-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.graph-container {
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #f8f9fa;
}

.empty-state {
  padding: 3rem 1rem;
}

.analysis-summary {
  font-size: 0.875rem;
}

.selected-node-info {
  border-left: 4px solid #007bff;
}

.graph-legend {
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

/* レスポンシブ */
@media (max-width: 768px) {
  .graph-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .analysis-summary {
    text-align: center;
    margin-top: 0.5rem;
  }
}
</style>

