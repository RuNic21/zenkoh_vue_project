<script setup lang="ts">
// 共通フィルターフィールドコンポーネント
// 目的: フィルター入力欄の共通スタイルとロジックを提供

import { computed } from "vue";

// フィルター値の型定義（文字列、数値、null、空文字列を許容）
type FilterValue = string | number | null | "";

// Props定義
interface Props {
  label: string;               // フィールドラベル
  icon?: string;               // アイコン（Font Awesome class）
  type?: "text" | "select" | "date" | "number"; // フィールドタイプ
  modelValue: FilterValue;     // v-model値
  placeholder?: string;        // プレースホルダー
  options?: Array<{ value: FilterValue; label: string }>; // selectタイプの選択肢
  colClass?: string;           // カラムクラス（デフォルト: col-lg-3 col-md-6）
}

const props = withDefaults(defineProps<Props>(), {
  icon: "",
  type: "text",
  placeholder: "",
  options: () => [],
  colClass: "col-lg-3 col-md-6"
});

// Emits定義
const emit = defineEmits<{
  "update:modelValue": [value: FilterValue];
}>();

// v-model用のcomputed
const localValue = computed({
  get: () => props.modelValue,
  set: (value: FilterValue) => emit("update:modelValue", value)
});
</script>

<template>
  <div :class="colClass">
    <label class="form-label text-sm text-dark fw-bold ms-1 mb-1">
      <i v-if="icon" :class="`${icon} text-sm me-1`"></i>
      {{ label }}
    </label>
    
    <!-- テキスト入力 -->
    <input 
      v-if="type === 'text' || type === 'date' || type === 'number'"
      :type="type"
      class="form-control" 
      :placeholder="placeholder"
      v-model="localValue"
    />
    
    <!-- セレクト入力 -->
    <select 
      v-else-if="type === 'select'"
      class="form-select" 
      v-model="localValue"
    >
      <option 
        v-for="option in options" 
        :key="option.value" 
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
/* フォームラベルスタイル */
.form-label {
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #344767;
}

.form-label i {
  opacity: 0.7;
}

/* フォームコントロールのスタイル改善 */
.form-select,
.form-control {
  border-radius: 8px;
  border: 1px solid #d2d6da;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  transition: all 0.2s ease;
  background-color: #fff;
}

.form-select:focus,
.form-control:focus {
  border-color: #5e72e4;
  box-shadow: 0 0 0 2px rgba(94, 114, 228, 0.1);
  outline: none;
}

.form-select:hover,
.form-control:hover {
  border-color: #b8c1cc;
}

/* placeholder スタイル */
.form-control::placeholder {
  color: #adb5bd;
  font-size: 0.875rem;
  opacity: 0.7;
}

.form-control:focus::placeholder {
  opacity: 0.5;
}

/* レスポンシブ調整 */
@media (max-width: 767px) {
  .form-label {
    font-size: 0.7rem;
  }
  
  .form-select,
  .form-control {
    font-size: 0.8rem;
  }
}
</style>

