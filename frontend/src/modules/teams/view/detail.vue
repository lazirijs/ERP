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
            <div v-if="tab === 'employees'" class="flex flex-col items-end gap-4">
              <!-- <el-button @click="addMemberDialogRef?.open()" type="success">
                {{ $t('add') }}
                <el-icon class="ml-2">
                  <el-icon-plus />
                </el-icon>
              </el-button>
              <add-member-dialog-app ref="addMemberDialogRef" :team_uid="formData.uid" @submitted="getData()" /> -->
              <data-grid-app :config="employeesDataGridConfig" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="editDialogRef" :uid="formData.uid" @submitted="getData()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import teamsApi from '../api';
import type { Team } from '../type';

import type { DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';

import employeesApi from '../../employees/api';
import ConstEmployee from '../../employees/constant';

import EditDialogApp from '../components/dialogs/edit.vue';
// import AddMemberDialogApp from '../members/components/dialogs/add.vue';
import type { Employee } from '@/modules/employees/type';

const { t } = useI18n();

const route = useRoute();

const loadingContainer = ref<('detail')[]>(['detail']);

const tab = ref('employees');

const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();
// const addMemberDialogRef = ref<InstanceType<typeof AddMemberDialogApp>>();

const formData = ref<Team>({} as Team);

const getData = async () => {
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

onMounted(getData);

const employeesDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => employeesApi.getAll({ ...query, team_uid: route.params.uid as string })
  },
  columns: [
    { dataField: 'name', caption: t('name') },
    {
      dataField: 'status', caption: t('status'), alignment: 'center', 
      cellTemplate: (container: HTMLElement, options: { value: Employee["status"] }) => {
        let { label, color } = ConstEmployee.status[options.value];
        container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
      } 
    },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});
</script>