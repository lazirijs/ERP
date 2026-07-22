<template>
  <el-input
    :model-value="display"
    type="text"
    inputmode="decimal"
    :disabled="disabled"
    :placeholder="placeholder"
    @focus="onFocus"
    @input="onInput"
    @blur="onBlur"
  >
    <template #suffix>
      <span>{{ currency }}</span>
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { currency } from '@/constants';
import formatter from '@/services/formatter';

// Currency field that keeps the grouped "1 500.00" display when idle but shows a plain, freely
// editable number while focused. el-input-number can't do this: with a live formatter it re-runs
// toFixed on every keystroke, which makes decimals like 1.5 / 0.5 impossible to type.
const props = withDefaults(defineProps<{
  modelValue?: number | null;
  min?: number;
  max?: number;
  precision?: number;
  disabled?: boolean;
  placeholder?: string;
}>(), {
  modelValue: 0,
  min: 0,
  precision: 2,
});

const emit = defineEmits<{ 'update:modelValue': [number] }>();

const focused = ref(false);
const display = ref('');

// Grouped, fixed-decimal display without the currency symbol (the € rides in the suffix slot).
const format = (value: number) => formatter.currency(value, false, props.precision);

// Reflect external/programmatic model changes into the display while the user isn't editing.
watch(() => props.modelValue, value => {
  if (!focused.value) display.value = format(value ?? 0);
}, { immediate: true });

const onFocus = (event: FocusEvent) => {
  focused.value = true;
  // Drop the grouping so typing/editing is natural; 0 shows as empty for a clean start.
  const value = props.modelValue ?? 0;
  display.value = value ? String(value) : '';
  requestAnimationFrame(() => (event.target as HTMLInputElement | null)?.select());
};

const onInput = (value: string) => {
  // Keep only digits and a single decimal point.
  let cleaned = value.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot !== -1) cleaned = cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
  display.value = cleaned;
};

const onBlur = () => {
  focused.value = false;
  let value = Number(display.value);
  if (Number.isNaN(value)) value = 0;
  if (props.min !== undefined) value = Math.max(props.min, value);
  if (props.max !== undefined) value = Math.min(props.max, value);
  value = Number(value.toFixed(props.precision));
  emit('update:modelValue', value);
  display.value = format(value);
};
</script>
