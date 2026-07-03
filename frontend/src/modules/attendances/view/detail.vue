<template>
  <container-app type="scroll" v-loading="loadingContainer.includes('detail')">
    <div v-if="!loadingContainer.includes('detail')" class="grid grid-cols-1 md:grid-cols-4 items-start gap-app">
      <el-card shadow="never">
        <template #header>
          <div class="flex justify-between items-center gap-app">
            <el-button @click="$router.back()" text class="m-0!">
              <el-icon><el-icon-arrow-left /></el-icon>
            </el-button>
            <span>General Info</span>
            <el-button :disabled="true" text class="m-0!">
              <el-icon><el-icon-edit /></el-icon>
            </el-button>
          </div>
        </template>
        <div class="space-y-app">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalPresent') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.total_present }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalAbsent') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.total_absent }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('createdAt') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.date(formData.created_at) }}</span>
          </div>
        </div>
      </el-card>
      <div class="col-span-1 md:col-span-3 flex-1 space-y-app">
        <el-tabs v-model="tab" type="border-card">
          <el-tab-pane :label="$t('employees')" name="employees">
            <data-grid-app
              v-if="tab === 'employees'"
              ref="dataGridRef"
              :config="employeesDataGridConfig"
              :columns="employeesDataGridConfig.columns"
              @row-click="$router.push({ name: 'employees-detail', params: { uid: $event.data.employee_uid } })"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import indexApi from '../api';
import type { Attendance, AttendanceRegister } from '../type';

import type { DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import { useI18n } from 'vue-i18n';
import formatter from '@/services/formatter';
import { status } from '../constant';

const { t } = useI18n();

const route = useRoute();

const loadingContainer = ref<('detail')[]>([]);

const tab = ref('employees');

const formData = ref<Attendance>({} as Attendance);

const getData = async () => {
  try {
    loadingContainer.value.push('detail');
    const response = await indexApi.get(route.params.uid as string);
    formData.value = response.detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'detail');
  }
};

onMounted(getData);

const employeesDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'attendance_uid',
    api: (query) => indexApi.getAllRegisters({ ...query, attendance_uid: route.params.uid as string })
  },
  columns: [
    { dataField: 'employee.name', caption: t('name') },
    { dataField: 'team.name', caption: t('team'), allowSorting: false },
    { dataField: 'project.name', caption: t('project'), allowSorting: false },
    {
      dataField: 'status', caption: t('status'), alignment: 'center', 
      cellTemplate: (container: HTMLElement, options: { value: AttendanceRegister["status"] }) => {
        let { label, color } = status[options.value];
        container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
      }
    },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});
</script>