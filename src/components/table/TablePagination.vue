<script setup lang="ts">
// 共通テーブルページネーション
// 目的: ページングUIの重複を排除し、一貫した操作性を提供

interface Props {
  currentPage: number;
  totalPages: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'change': [page: number];
}>();

const go = (page: number) => {
  if (page < 1 || page > props.totalPages) return;
  emit('change', page);
};
</script>

<template>
  <div class="d-flex justify-content-between align-items-center mt-3">
    <div class="text-sm text-secondary">
      <slot name="info"></slot>
    </div>
    <nav>
      <ul class="pagination pagination-sm mb-0">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="go(currentPage - 1)" :disabled="currentPage === 1">前へ</button>
        </li>
        <li 
          v-for="page in Math.min(5, totalPages)" 
          :key="page"
          class="page-item"
          :class="{ active: page === currentPage }"
        >
          <button class="page-link" @click="go(page)">{{ page }}</button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="go(currentPage + 1)" :disabled="currentPage === totalPages">次へ</button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.pagination .page-link {
  border: none;
  color: #6c757d;
  background-color: transparent;
}

.pagination .page-item.active .page-link {
  background-color: #007bff;
  color: white;
}

.pagination .page-item.disabled .page-link {
  color: #6c757d;
  opacity: 0.5;
}
</style>


