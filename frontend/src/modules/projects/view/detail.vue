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
            <el-button @click="" text class="m-0!">
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
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('client') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.client.name }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('region') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.region.name }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('category') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.category.name }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('status') }}</label>
            <span :class="`badge-app-${status[formData.status]?.color}`">{{ $t(status[formData.status].label!) }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('offer') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.currency(formData.offer!) }}</span>
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
              :config="transactionsDataGridConfig"
            />
          </el-tab-pane>
          <el-tab-pane :label="$t('sales')" name="sales">
            <div v-if="tab === 'sales'" class="flex flex-col items-end gap-4">
              <el-button @click="createSalesDialogRef?.open()" type="success">
                {{ $t('create') }}
                <el-icon class="ml-2">
                  <el-icon-plus />
                </el-icon>
              </el-button>
              <create-sales-dialog ref="createSalesDialogRef" :project_uid="formData.uid" @submitted="salesDataGridRef?.instance?.refresh()" />
              <data-grid-app
                ref="salesDataGridRef"
                :config="salesDataGridConfig"
                @row-click="$router.push({ name: 'sales-detail', params: { uid: $event.data.uid } })"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane :label="$t('payouts')" name="payouts">
            <div v-if="tab === 'payouts'">Payouts</div>
          </el-tab-pane>
          <el-tab-pane :label="$t('documents')" name="documents">
            <div v-if="tab === 'documents'">Documents</div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </container-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import indexApi from '../api';
import type { Project } from '../type';
import { useI18n } from 'vue-i18n';
import formatter from '@/services/formatter';

import transactionsApi from '@/modules/transactions/api';
import type { Transaction } from '@/modules/transactions/type';
import ConstTransaction from '@/modules/transactions/constant';
import type { DataGridAppRef, DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import { status } from '../constant';

import salesApi from '@/modules/sales/api';
import type { Sale } from '@/modules/sales/type';
import SaleConst from '@/modules/sales/constant';

import CreateSalesDialog from '@/modules/sales/components/dialogs/create.vue';

const { t } = useI18n();

const route = useRoute();

const loadingContainer = ref<('detail')[]>(['detail']);

const tab = ref('transactions');

const createSalesDialogRef = ref<InstanceType<typeof CreateSalesDialog>>();
const salesDataGridRef = ref<DataGridAppRef>();

const formData = ref<Project>({} as Project);

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

const transactionsDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => transactionsApi.getAll({ ...query, project_uid: route.params.uid as string })
  },
  columns: [
    { dataField: 'account.name', caption: t('account'), allowSorting: false },
    { dataField: 'employee.name', caption: t('employee'), allowSorting: false },
    {
      dataField: 'type', caption: t('type'), alignment: 'center', 
      cellTemplate: (container: HTMLElement, options: { value: Transaction["type"] }) => {
        let { label, color } = ConstTransaction.type[options.value];
        container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
      } 
    },
    { dataField: 'amount', caption: t('amount'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'note', caption: t('note') },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});

const salesDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => salesApi.getAll({ ...query, project_uid: route.params.uid as string })
  },
  columns: [
    { dataField: 'name', caption: t('name') },
    {
      dataField: 'status', caption: t('status'), alignment: 'center', 
      cellTemplate: (container: HTMLElement, options: { value: Sale["status"] }) => {
        let { label, color } = SaleConst.status[options.value];
        container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
      } 
    },
    { dataField: 'items_count', caption: t('itemsCount') },
    { dataField: 'total_amount', caption: t('total'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});
</script>