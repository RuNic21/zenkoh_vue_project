<script setup lang="ts">
// 共通モーダルシェル
// 目的: モーダルのヘッダー/フッター/本体スロットを提供

interface Props {
  title: string;
  show: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
});

const emit = defineEmits<{ 'close': [] }>();

const dialogClass = () => {
  switch (props.size) {
    case 'sm': return 'modal-sm';
    case 'lg': return 'modal-lg';
    case 'xl': return 'modal-xl';
    default: return '';
  }
};
</script>

<template>
  <div v-if="show" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog" :class="dialogClass()">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ title }}</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <div class="modal-footer">
          <slot name="footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">閉じる</button>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal { z-index: 1050; }
.modal-dialog { margin-top: 5rem; }
</style>


