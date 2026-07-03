<template>
  <container-app type="scroll" v-loading="loadingContainer.includes('detail')">
    <div v-if="!loadingContainer.includes('detail')" class="grid grid-cols-1 md:grid-cols-4 items-start gap-app">
      <el-card shadow="never">
        <template #header>
          <div class="flex justify-between items-center gap-app">
            <el-button @click="$router.back()" text class="m-0!">
              <el-icon><el-icon-arrow-left /></el-icon>
            </el-button>
            <span>{{ $t('generalInfo') }}</span>
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
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('description') }}</label>
            <span v-if="formData.description" class="block text-sm text-gray-900">{{ formData.description }}</span>
            <span v-else class="block text-sm text-gray-400">{{ $t('noDescription') }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('createdAt') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.date(formData.created_at) }}</span>
          </div>
        </div>
      </el-card>
      <div class="col-span-1 md:col-span-3 flex-1 space-y-app">
        <el-tabs v-model="tab" type="border-card">
          <el-tab-pane :label="$t('transactions')" name="transactions">
            <data-grid-app
              v-if="tab === 'transactions'"
              ref="dataGridRef"
              :config="transactionsDataGridConfig"
              :columns="transactionsDataGridConfig.columns"
              @row-click="$router.push({ name: 'transactions-detail', params: { uid: $event.data.uid } })"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="dialogRef" :account_uid="formData.uid" @submitted="getData()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { get } from '../api';
import type { Account } from '../type';

import type { DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import transactionsApi from '@/modules/transactions/api';
import { useI18n } from 'vue-i18n';
import formatter from '@/services/formatter';
import { type } from '@/modules/transactions/constant';
import type { Transaction } from '@/modules/transactions/type';
import EditDialogApp from '../components/dialogs/edit.vue';

const { t } = useI18n();

const route = useRoute();

const loadingContainer = ref<('detail')[]>([]);

const tab = ref('transactions');

const dialogRef = ref<InstanceType<typeof EditDialogApp>>();

const formData = ref<Account>({} as Account);

const getData = async () => {
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

onMounted(getData);

const transactionsDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => transactionsApi.getAll({ ...query, account_uid: route.params.uid as string })
  },
  columns: [
    { dataField: 'project.name', caption: t('project'), allowSorting: false },
    { dataField: 'employee.name', caption: t('employee'), allowSorting: false },
    {
      dataField: 'type', caption: t('type'), alignment: 'center',
      cellTemplate: (container: HTMLElement, options: { value: Transaction["type"] }) => {
        let { label, color } = type[options.value];
        container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
      }
    },
    { dataField: 'amount', caption: t('amount'), format: formatter.devextreme.currency },
    { dataField: 'note', caption: t('note') },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});
</script>
