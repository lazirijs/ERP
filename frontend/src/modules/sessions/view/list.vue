<template>
  <container-app type="fixed">
    <DxScheduler
      height="100%" width="100%"
      :views="['month']"
      current-view="month"
      :first-day-of-week="0"
      :editing="{ allowAdding: false, allowUpdating: false, allowDeleting: false, allowResizing: false, allowDragging: false }"
      :show-all-day-panel="false"
      data-cell-template="dataCell"
      @content-ready="load"
      @cell-click="onCellClick"
      @appointment-form-opening="(e: any) => (e.cancel = true)"
    >
      <template #dataCell="{ data }">
        <div class="h-full w-full p-1 flex flex-col justify-between">
          <div class="flex justify-between items-center">
            <div class="text-xs text-right">
              {{ data.startDate.getDate() }}/{{ (data.startDate.getMonth() + 1).toString().padStart(2, '0') }}
            </div>
            <div v-if="summaryFor(data.startDate)?.note" :title="summaryFor(data.startDate)?.note">
              <el-icon class="text-xs text-gray-400">
                <el-icon-user />
              </el-icon>
            </div>
          </div>
          <span v-if="summaryFor(data.startDate)" class="w-full text-xs md:text-base md:flex justify-around text-gray-400">
            <template v-if="summaryFor(data.startDate)!.total_present">
              <span :class="`text-${status[0].color}-600`">{{ summaryFor(data.startDate)!.total_present }}</span>
              /
            </template>
            <template v-if="summaryFor(data.startDate)!.total_absence">
              <span :class="`text-${status[1].color}-600`">{{ summaryFor(data.startDate)!.total_absence }}</span>
              /
            </template>
            <span>{{ summaryFor(data.startDate)!.total_employees }}</span>
          </span>
          <p v-if="summaryFor(data.startDate)?.note" class="text-xs font-normal text-gray-400 line-clamp-2">{{ summaryFor(data.startDate)!.note }}</p>
        </div>
      </template>
    </DxScheduler>
    <create-dialog-app ref="createDialogRef" />
  </container-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { DxScheduler } from 'devextreme-vue/scheduler';

import sessionsApi from '@/modules/sessions/api';
import type { Session } from '@/modules/sessions/type';
import CreateDialogApp from '@/modules/sessions/components/dialogs/create.vue';
import { status } from '@/modules/sessions/constant';

const router = useRouter();
const { t } = useI18n();

const sessionsMap = ref<Record<string, Session>>({});
const createDialogRef = ref<InstanceType<typeof CreateDialogApp>>();

const fmt = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayStr = () => fmt(new Date());

const summaryFor = (d: Date) => {
  const session = sessionsMap.value[fmt(d)];
  if (!session) return;
  return { total_present: session.total_employees - session.total_absence, ...session };
};

const load = async ({ component }: { component: DxScheduler["instance"] }) => {
  const from = fmt(component!.getStartViewDate()!);
  const to = fmt(component!.getEndViewDate()!);
  const take = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1; // Days between from and to (inclusive)
  try {
    const response = await sessionsApi.getAll({ from, to, take } as any);    
    const data = response.detail.data;
    sessionsMap.value = {};
    for (const session of data) sessionsMap.value[session.date] = session;
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('loadingFailed'));
  }
};

const onCellClick = (e: any) => {
  const date = fmt(e.cellData.startDate);
  const session = sessionsMap.value[date];
  if (session) {
    router.push({ name: 'sessions-detail', params: { uid: session.uid } });
    return;
  }
  if (date >= todayStr()) createDialogRef.value?.open(date);
  else ElMessage.error(t('cannotCreateSessionForPastDate'));
};
</script>
