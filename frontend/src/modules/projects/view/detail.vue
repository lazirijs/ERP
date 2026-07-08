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
          <el-tab-pane :label="$t('orders')" name="orders">
            <div v-if="tab === 'orders'" class="flex flex-col items-end gap-4">
              <el-button @click="createOrdersDialogRef?.open()" type="success">
                {{ $t('create') }}
                <el-icon class="ml-2">
                  <el-icon-plus />
                </el-icon>
              </el-button>
              <create-orders-dialog ref="createOrdersDialogRef" :project_uid="formData.uid" @submitted="ordersDataGridRef?.instance?.refresh()" />
              <data-grid-app
                ref="ordersDataGridRef"
                :config="ordersDataGridConfig"
                @row-click="$router.push({ name: 'orders-detail', params: { uid: $event.data.uid } })"
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

import ordersApi from '@/modules/orders/api';
import type { Order } from '@/modules/orders/type';
import OrderConst from '@/modules/orders/constant';

import CreateOrdersDialog from '@/modules/orders/components/dialogs/create.vue';

const { t } = useI18n();

const route = useRoute();

const loadingContainer = ref<('detail')[]>(['detail']);

const tab = ref('transactions');

const createOrdersDialogRef = ref<InstanceType<typeof CreateOrdersDialog>>();
const ordersDataGridRef = ref<DataGridAppRef>();

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
    // { dataField: 'project.name', caption: t('project') },
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

const ordersDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => ordersApi.getAll({ ...query, project_uid: route.params.uid as string })
  },
  columns: [
    { dataField: 'name', caption: t('name') },
    {
      dataField: 'status', caption: t('status'), alignment: 'center', 
      cellTemplate: (container: HTMLElement, options: { value: Order["status"] }) => {
        let { label, color } = OrderConst.status[options.value];
        container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
      } 
    },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});
</script>