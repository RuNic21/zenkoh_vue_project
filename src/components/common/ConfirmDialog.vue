<template>
  <!-- 確認ダイアログ表示領域 -->
  <teleport to="body">
    <transition name="dialog-fade">
      <div
        v-if="currentDialog"
        class="confirm-overlay"
        @click="handleCancel"
      >
        <div
          class="confirm-dialog"
          :class="`confirm-dialog-${currentDialog.type}`"
          @click.stop
        >
          <!-- ヘッダー -->
          <div class="confirm-header">
          <div class="confirm-icon">
            <i :class="getIconClass(currentDialog.type || 'info')"></i>
          </div>
            <h3 class="confirm-title">{{ currentDialog.title }}</h3>
            <button
              class="confirm-close"
              @click="handleCancel"
              aria-label="閉じる"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- メッセージ -->
          <div class="confirm-body">
            <p>{{ currentDialog.message }}</p>
          </div>

          <!-- アクションボタン -->
          <div class="confirm-footer">
            <button
              class="btn btn-secondary"
              @click="handleCancel"
            >
              {{ currentDialog.cancelText }}
            </button>
            <button
              :class="['btn', getConfirmButtonClass(currentDialog.type || 'info')]"
              @click="handleConfirm"
            >
              {{ currentDialog.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useConfirm } from "@/composables/useMessage";

// 確認ダイアログ管理
const { confirmDialogs, resolveConfirm } = useConfirm();

// 現在表示中のダイアログ（最初の1つのみ表示）
const currentDialog = computed(() => confirmDialogs.value[0] || null);

/**
 * ダイアログタイプに対応するアイコンクラスを取得
 */
const getIconClass = (type: string): string => {
  switch (type) {
    case "danger":
      return "fas fa-exclamation-triangle";
    case "warning":
      return "fas fa-exclamation-circle";
    case "info":
      return "fas fa-info-circle";
    default:
      return "fas fa-question-circle";
  }
};

/**
 * 確認ボタンのクラスを取得
 */
const getConfirmButtonClass = (type: string): string => {
  switch (type) {
    case "danger":
      return "btn-danger";
    case "warning":
      return "btn-warning";
    default:
      return "btn-primary";
  }
};

/**
 * 確認ボタンクリック
 */
const handleConfirm = () => {
  if (currentDialog.value) {
    resolveConfirm(currentDialog.value.id, true);
  }
};

/**
 * キャンセルボタンクリック
 */
const handleCancel = () => {
  if (currentDialog.value) {
    resolveConfirm(currentDialog.value.id, false);
  }
};
</script>

<style scoped>
/* オーバーレイ */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

/* ダイアログボックス */
.confirm-dialog {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  animation: dialog-appear 0.3s ease-out;
}

/* ヘッダー */
.confirm-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.confirm-icon {
  flex-shrink: 0;
  font-size: 24px;
}

.confirm-dialog-danger .confirm-icon {
  color: #dc3545;
}

.confirm-dialog-warning .confirm-icon {
  color: #ffc107;
}

.confirm-dialog-info .confirm-icon {
  color: #17a2b8;
}

.confirm-title {
  flex: 1;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.confirm-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  font-size: 18px;
  line-height: 1;
  transition: color 0.2s;
}

.confirm-close:hover {
  color: #333;
}

/* ボディ */
.confirm-body {
  padding: 20px;
  color: #666;
  line-height: 1.6;
}

.confirm-body p {
  margin: 0;
}

/* フッター */
.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

.confirm-footer .btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-secondary {
  background: #6c757d;
  color: #fff;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-primary {
  background: #007bff;
  color: #fff;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-danger {
  background: #dc3545;
  color: #fff;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background: #e0a800;
}

/* アニメーション */
@keyframes dialog-appear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-active .confirm-dialog,
.dialog-fade-leave-active .confirm-dialog {
  transition: transform 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .confirm-dialog,
.dialog-fade-leave-to .confirm-dialog {
  transform: scale(0.9);
}

/* レスポンシブ対応 */
@media (max-width: 576px) {
  .confirm-dialog {
    max-width: none;
  }

  .confirm-footer {
    flex-direction: column-reverse;
  }

  .confirm-footer .btn {
    width: 100%;
  }
}
</style>

