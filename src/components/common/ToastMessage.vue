<template>
  <!-- メッセージトースト表示領域 -->
  <teleport to="body">
    <div class="toast-container">
      <transition-group name="toast-slide">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="['toast', `toast-${message.type}`]"
          role="alert"
        >
          <div class="toast-icon">
            <i :class="getIconClass(message.type)"></i>
          </div>
          <div class="toast-content">
            <p>{{ message.text }}</p>
          </div>
          <button
            class="toast-close"
            @click="dismissMessage(message.id)"
            aria-label="閉じる"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useMessage } from "@/composables/useMessage";

// メッセージ管理
const { messages, dismissMessage } = useMessage();

/**
 * メッセージタイプに対応するアイコンクラスを取得
 */
const getIconClass = (type: string): string => {
  switch (type) {
    case "success":
      return "fas fa-check-circle";
    case "error":
      return "fas fa-exclamation-circle";
    case "warning":
      return "fas fa-exclamation-triangle";
    case "info":
      return "fas fa-info-circle";
    default:
      return "fas fa-info-circle";
  }
};
</script>

<style scoped>
/* トーストコンテナ（画面右上に固定） */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  pointer-events: none;
}

/* トーストメッセージ */
.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  min-width: 300px;
  max-width: 100%;
  animation: toast-appear 0.3s ease-out;
}

/* タイプ別スタイル */
.toast-success {
  border-left: 4px solid #28a745;
}

.toast-error {
  border-left: 4px solid #dc3545;
}

.toast-warning {
  border-left: 4px solid #ffc107;
}

.toast-info {
  border-left: 4px solid #17a2b8;
}

/* アイコン */
.toast-icon {
  flex-shrink: 0;
  font-size: 20px;
  margin-top: 2px;
}

.toast-success .toast-icon {
  color: #28a745;
}

.toast-error .toast-icon {
  color: #dc3545;
}

.toast-warning .toast-icon {
  color: #ffc107;
}

.toast-info .toast-icon {
  color: #17a2b8;
}

/* コンテンツ */
.toast-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.toast-content p {
  margin: 0;
}

/* 閉じるボタン */
.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0;
  font-size: 16px;
  line-height: 1;
  transition: color 0.2s;
}

.toast-close:hover {
  color: #333;
}

/* アニメーション */
@keyframes toast-appear {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast-slide-enter-active {
  transition: all 0.3s ease-out;
}

.toast-slide-leave-active {
  transition: all 0.2s ease-in;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(50%) scale(0.8);
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .toast {
    min-width: auto;
  }
}
</style>

