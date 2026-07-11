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
            <el-button @click="dialogRef?.open()" text class="m-0!">
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
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalProjects') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.total_projects }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('createdAt') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.date(formData.created_at) }}</span>
          </div>
        </div>
      </el-card>
      <div class="col-span-1 md:col-span-3 flex-1 space-y-app">
        <el-tabs v-model="tab" type="border-card">
          <el-tab-pane :label="$t('projects')" name="projects">
            <data-grid-app
              v-if="tab === 'projects'"
              ref="dataGridRef"
              :config="projectsDataGridConfig"
              :columns="projectsDataGridConfig.columns"
              @row-click="$router.push({ name: 'projects-detail', params: { uid: $event.data.uid } })"
            />
          </el-tab-pane>
          <el-tab-pane :label="$t('sales')" name="sales">
            <sales-list-app v-if="tab === 'sales'" :view="{ type: 'client', data: formData }" @updated="load()" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="dialogRef" :client_uid="formData.uid" @submitted="load()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { get } from '../api';
import type { Client } from '../type';
import SalesListApp from '@/modules/sales/view/list.vue';
import type { DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import projectsApi from '@/modules/projects/api';
import { useI18n } from 'vue-i18n';
import formatter from '@/services/formatter';
import { status } from '@/modules/projects/constant';
import type { Project } from '@/modules/projects/type';
import EditDialogApp from '../components/dialogs/edit.vue';

const { t } = useI18n();

const route = useRoute();

const loadingContainer = ref<('detail')[]>([]);

const tab = ref('projects');

const dialogRef = ref<InstanceType<typeof EditDialogApp>>();

const formData = ref<Client>({} as Client);

const load = async () => {
  try {
    loadingContainer.value.push('detail');
    const response = await get(route.params.uid as string);
    formData.value = response.detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'detail');
  }
};

onMounted(load);

const projectsDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => projectsApi.getAll({ ...query, client_uid: route.params.uid as string })
  },
  columns: [
    // { dataField: 'client.name', caption: t('client') },
    { dataField: 'name', caption: t('name') },
    { dataField: 'region.name', caption: t('region'), allowSorting: false },
    { dataField: 'category.name', caption: t('category'), allowSorting: false },
    {
      dataField: 'status', caption: t('status'), dataType: 'string',
      cellTemplate: (container: HTMLElement, options: { value: Project["status"] }) => {
        let { label, color } = status[options.value];
        container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
      },
      headerFilter: {
        search: { enabled: true },
        dataSource: Object.values(status).map(item => ({ text: t(item.label), value: item.id }))
      },
      allowFiltering: true
    },
    { dataField: 'offer', caption: t('offer'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});
</script>