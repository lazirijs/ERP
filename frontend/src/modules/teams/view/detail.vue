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
            <el-button @click="editDialogRef?.open()" text class="m-0!">
              <el-icon><el-icon-edit /></el-icon>
            </el-button>
          </div>
        </template>
        <div class="space-y-app">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('name') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.name }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('supervisor') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.supervisor.name }}</span>
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
            <div v-if="tab === 'employees'" class="grid gap-app">
              <div class="flex justify-between items-center gap-app">
                <div class="flex items-center gap-2">
                    <el-input v-model="search" @input="onSearchChange" dir="auto" :placeholder="$t('search')" class="md:w-75!">
                        <template #prefix>
                            <el-icon>
                                <el-icon-search />
                            </el-icon>
                        </template>
                    </el-input>
                    <el-button @click="dataGridRef?.instance?.refresh()" class="w-8">
                        <el-icon>
                            <el-icon-refresh />
                        </el-icon>
                    </el-button>
                    <el-button @click="toggleFilterRowVisibility()" class="w-8 m-0!">
                        <el-icon>
                            <el-icon-filter />
                        </el-icon>
                    </el-button>
                </div>
                <el-button @click="addEmployeeDialogRef?.open" type="success">
                  {{ $t('add') }}
                  <el-icon class="ml-2">
                    <el-icon-plus />
                  </el-icon>
                </el-button>
                <add-employee-dialog-app ref="addEmployeeDialogRef" :team_uid="formData.uid" @submitted="load()" />
              </div>
              <div class="flex-1 min-h-0 min-w-0">
                <data-grid-app ref="dataGridRef" :config="employeesDataGridConfig" @row-click="$router.push({ name: 'employees-detail', params: { uid: $event.data.uid } })" />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="editDialogRef" :uid="formData.uid" @submitted="load()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import teamsApi from '@/modules/teams/api';
import type { Team } from '@/modules/teams/type';

import type { DataGridAppRef, DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';

import employeesApi from '@/modules/employees/api';
import ConstEmployee from '@/modules/employees/constant';

import EditDialogApp from '@/modules/teams/components/dialogs/edit.vue';
import AddEmployeeDialogApp from '@/modules/teams/components/dialogs/add-employee.vue';
import { previewImage } from '@/services/files.ts';

const { t } = useI18n();

const route = useRoute();

const loadingContainer = ref<('detail')[]>(['detail']);

const tab = ref('employees');
const dataGridRef = ref<DataGridAppRef>();

const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();
const addEmployeeDialogRef = ref<InstanceType<typeof AddEmployeeDialogApp>>();

const formData = ref<Team>({} as Team);

const load = async () => {
  try {
    loadingContainer.value.push('detail');
    const response = await teamsApi.get(route.params.uid as string);
    formData.value = response.detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'detail');
  }
};

onMounted(load);

const search = ref('');

const onSearchChange = (value: string) => {
  value = value.trim();
  setTimeout(() => value === search.value && dataGridRef.value?.instance?.searchByText(value), 500);
};

const toggleFilterRowVisibility = () => {
  dataGridRef.value?.instance?.option('filterRow.visible', !dataGridRef.value?.instance?.option('filterRow.visible'));
};

const employeesDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => employeesApi.getAll({ ...query, team_uid: route.params.uid as string })
  },
  headerFilter: { visible: true },
  columns: [
    {
      dataField: 'image', caption: t('image'), allowSorting: false, alignment: 'center', width: 120,
      cellTemplate: (container: HTMLElement, options: { value: string }) => {
        container.innerHTML = previewImage({ type: 'avatar', src: options.value, format: 'html' });
      }
    },
    { dataField: 'name', caption: t('name') },
    {
      dataField: 'status', caption: t('status'), alignment: 'center', allowHeaderFiltering: true, allowFiltering: false,
      cellTemplate: (container: HTMLElement, options: { value: 0 | 1 }) => {
        const { label, color } = ConstEmployee.status[options.value];
        container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
      },
      headerFilter: { dataSource: Object.values(ConstEmployee.status).map(i => ({ value: i.id, text: t(i.label) })) },
    },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});
</script>