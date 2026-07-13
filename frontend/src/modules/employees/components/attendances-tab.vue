<template>
  <DxScheduler
    height="70vh" width="100%"
    :views="['month']"
    current-view="month"
    :first-day-of-week="0"
    :editing="{ allowAdding: false, allowUpdating: false, allowDeleting: false, allowResizing: false, allowDragging: false }"
    :show-all-day-panel="false"
    data-cell-template="dataCell"
    @content-ready="load"
    @appointment-form-opening="(e: any) => (e.cancel = true)"
  >
    <template #dataCell="{ data }">
      <div class="h-full w-full p-1 flex flex-col justify-between" :class="statusFor(data.startDate) !== undefined ? bgClass[status[statusFor(data.startDate)!].color] : ''">
        <div class="text-xs text-right text-gray-400">{{ data.startDate.getDate() }}</div>
        <span v-if="statusFor(data.startDate) !== undefined" class="text-xs font-medium" :class="textClass[status[statusFor(data.startDate)!].color]">
          {{ $t(status[statusFor(data.startDate)!].label) }}
        </span>
      </div>
    </template>
  </DxScheduler>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { DxScheduler } from 'devextreme-vue/scheduler';
import sessionEmployeesApi from '@/modules/sessions/employees/api';
import { status } from '@/modules/sessions/constant';

const props = defineProps<{
  employee_uid: string;
}>();

const { t } = useI18n();

const bgClass: Record<string, string> = { green: 'bg-green-100', red: 'bg-red-100' };
const textClass: Record<string, string> = { green: 'text-green-700', red: 'text-red-700' };

const fmt = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// date -> attendance status (0 present, 1 absent) for this employee
const attendanceMap = ref<Record<string, keyof typeof status>>({});

const statusFor = (d: Date): keyof typeof status | undefined => attendanceMap.value[fmt(d)];

const load = async ({ component }: { component: any }) => {
  const from = fmt(component!.getStartViewDate()!);
  const to = fmt(component!.getEndViewDate()!);
  try {
    const response = await sessionEmployeesApi.getAll({ employee_uid: props.employee_uid, from, to } as any);
    const map: Record<string, keyof typeof status> = {};
    for (const record of response.detail.data) map[record.date] = record.status;
    attendanceMap.value = map;
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('loadingFailed'));
  }
};
</script>
