<script setup lang="ts">
// テーブル上部の検索/セレクト/リセットコントロール
// 目的: 一貫した検索/フィルタUIを提供

import { computed } from "vue";

interface SelectOption { label: string; value: string | number; }
interface SelectConfig {
  key: string;
  label: string;
  options: SelectOption[];
  modelValue?: string | number | null;
}

interface Props {
  searchable?: boolean;
  searchPlaceholder?: string;
  search: string;
  selects?: SelectConfig[];
}

const props = withDefaults(defineProps<Props>(), {
  searchable: true,
  searchPlaceholder: "検索...",
  selects: () => []
});

const emit = defineEmits<{
  'update:search': [value: string];
  'update:select': [key: string, value: string | number | null];
  'reset': [];
}>();

const modelSearch = computed({
  get: () => props.search,
  set: (v: string) => emit('update:search', v)
});

const handleSelectChange = (key: string, value: string) => {
  emit('update:select', key, value === '' ? null : value);
};

const handleReset = () => emit('reset');
</script>

<template>
  <div class="table-controls mb-3">
    <div class="row">
      <div v-if="searchable" class="col-md-6 mb-2">
        <div class="input-group">
          <span class="input-group-text">
            <i class="material-symbols-rounded">search</i>
          </span>
          <input
            type="text"
            class="form-control"
            :placeholder="searchPlaceholder"
            v-model="modelSearch"
          >
        </div>
      </div>
      <div class="col-md-6 mb-2 d-flex gap-2 align-items-start flex-wrap">
        <select 
          v-for="sel in selects" 
          :key="sel.key"
          class="form-select form-select-sm"
          :value="sel.modelValue ?? ''"
          @change="handleSelectChange(sel.key, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">すべての{{ sel.label }}</option>
          <option v-for="op in sel.options" :key="op.value" :value="op.value">{{ op.label }}</option>
        </select>
        <button class="btn btn-sm bg-gradient-secondary ms-auto" @click="handleReset">リセット</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-controls {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.375rem;
}
</style>


