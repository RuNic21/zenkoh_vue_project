<script setup lang="ts">
// タスク詳細モーダルコンポーネント
// 目的: タスクの詳細情報（名前・担当者・ステータス・優先度・進捗・スケジュール・説明）を表示

import ModalShell from "../common/ModalShell.vue";
import StatusBadge from "../common/StatusBadge.vue";
import PriorityBadge from "../common/PriorityBadge.vue";
import type { Task } from "@/types/task";

// Props 定義
interface Props {
  // モーダル表示可否
  show: boolean;
  // 選択中のタスクデータ（null = 未選択）
  selectedTask: Task | null;
  // ユーザーIDから名前を取得する関数
  getOwnerName: (userId: number | null | undefined) => string;
}

const props = defineProps<Props>();

// Emits 定義
const emit = defineEmits<{
  // モーダルを閉じる
  close: [];
}>();

// モーダルを閉じる処理
const handleClose = () => {
  emit("close");
};
</script>

<template>
  <!-- タスク詳細モーダル -->
  <ModalShell 
    :show="show" 
    title="タスク詳細" 
    size="lg" 
    @close="handleClose"
  >
    <template #default>
      <div v-if="selectedTask" class="task-detail-modal">
        <!-- タスク名とアサイン情報 -->
        <div class="card card-plain border mb-3">
          <div class="card-body p-3">
            <div class="row">
              <div class="col-md-7 mb-3 mb-md-0">
                <div class="d-flex align-items-start">
                  <i class="material-symbols-rounded text-primary me-3 mt-1" style="font-size: 28px;">assignment</i>
                  <div>
                    <label class="form-label text-xs text-uppercase text-secondary font-weight-bold mb-1">タスク名</label>
                    <h6 class="mb-0 font-weight-bold text-dark">{{ selectedTask.task_name }}</h6>
                  </div>
                </div>
              </div>
              <div class="col-md-5">
                <div class="d-flex align-items-start">
                  <i class="material-symbols-rounded text-info me-3 mt-1" style="font-size: 28px;">person</i>
                  <div>
                    <label class="form-label text-xs text-uppercase text-secondary font-weight-bold mb-1">担当者</label>
                    <h6 class="mb-0 font-weight-bold text-dark">
                      {{ getOwnerName(selectedTask?.primary_assignee_id) }}
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ステータス・優先度・進捗 -->
        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <div class="card card-plain border h-100">
              <div class="card-body p-3 text-center">
                <i class="material-symbols-rounded text-success mb-2" style="font-size: 32px;">check_circle</i>
                <label class="form-label text-xs text-uppercase text-secondary font-weight-bold mb-2 d-block">ステータス</label>
                <StatusBadge :status="selectedTask.status" />
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card card-plain border h-100">
              <div class="card-body p-3 text-center">
                <i class="material-symbols-rounded text-warning mb-2" style="font-size: 32px;">flag</i>
                <label class="form-label text-xs text-uppercase text-secondary font-weight-bold mb-2 d-block">優先度</label>
                <PriorityBadge :priority="selectedTask.priority" />
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card card-plain border h-100">
              <div class="card-body p-3 text-center">
                <i class="material-symbols-rounded text-primary mb-2" style="font-size: 32px;">trending_up</i>
                <label class="form-label text-xs text-uppercase text-secondary font-weight-bold mb-2 d-block">進捗率</label>
                <h4 class="mb-2 font-weight-bold text-gradient text-primary">{{ selectedTask.progress_percent || 0 }}%</h4>
                <div class="progress" style="height: 6px;">
                  <div 
                    class="progress-bar bg-gradient-primary" 
                    :style="{ width: (selectedTask.progress_percent || 0) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- スケジュール情報 -->
        <div class="card card-plain border mb-3">
          <div class="card-body p-3">
            <div class="d-flex align-items-center mb-2">
              <i class="material-symbols-rounded text-primary me-2">event</i>
              <h6 class="mb-0 font-weight-bold">スケジュール</h6>
            </div>
            <div class="row mt-3">
              <div class="col-md-6">
                <div class="d-flex align-items-center">
                  <div class="icon icon-sm icon-shape bg-gradient-success shadow text-center border-radius-md me-2">
                    <i class="material-symbols-rounded opacity-10 text-white">play_arrow</i>
                  </div>
                  <div>
                    <label class="form-label text-xs text-uppercase text-secondary font-weight-bold mb-0">開始予定日</label>
                    <p class="text-sm mb-0 font-weight-bold">{{ selectedTask.planned_start || '未設定' }}</p>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="d-flex align-items-center">
                  <div class="icon icon-sm icon-shape bg-gradient-danger shadow text-center border-radius-md me-2">
                    <i class="material-symbols-rounded opacity-10 text-white">stop</i>
                  </div>
                  <div>
                    <label class="form-label text-xs text-uppercase text-secondary font-weight-bold mb-0">終了予定日</label>
                    <p class="text-sm mb-0 font-weight-bold">{{ selectedTask.planned_end || '未設定' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 説明 -->
        <div v-if="selectedTask.description" class="card card-plain border">
          <div class="card-body p-3">
            <div class="d-flex align-items-center mb-2">
              <i class="material-symbols-rounded text-primary me-2">description</i>
              <h6 class="mb-0 font-weight-bold">説明</h6>
            </div>
            <p class="text-sm text-secondary mb-0 mt-3">{{ selectedTask.description }}</p>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <button type="button" class="btn btn-outline-secondary" @click="handleClose">
        <i class="material-symbols-rounded me-1" style="font-size: 16px; vertical-align: middle;">close</i>
        閉じる
      </button>
    </template>
  </ModalShell>
  <!-- /タスク詳細モーダル -->
</template>

<style scoped>
/* タスク詳細モーダル専用スタイル */

.task-detail-modal {
  padding: 0.5rem;
}

/* カードのスタイル統一 */
.card-plain.border {
  border: 1px solid #e9ecef !important;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.card-plain.border:hover {
  border-color: #dee2e6 !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* アイコンスタイル */
.material-symbols-rounded {
  font-variation-settings: 
    'FILL' 1,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}

/* ラベルスタイル */
.form-label {
  margin-bottom: 0.25rem;
}

/* プログレスバーのスタイル */
.progress {
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  transition: width 0.6s ease;
}

/* テキストのグラデーション */
.text-gradient {
  background: linear-gradient(195deg, #42424a 0%, #191919 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-gradient.text-primary {
  background: linear-gradient(195deg, #5e72e4 0%, #825ee4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* アイコン形状のスタイル */
.icon-shape {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
}

/* レスポンシブ調整 */
@media (max-width: 767px) {
  .task-detail-modal {
    padding: 0;
  }
  
  .col-md-7,
  .col-md-5,
  .col-md-6 {
    margin-bottom: 1rem;
  }
  
  .card-body {
    padding: 1rem !important;
  }
}
</style>

