<template>
  <container-app type="scroll" v-loading="loadingContainer.includes('detail')">
    <div v-if="!loadingContainer.includes('detail')" class="grid grid-cols-1 md:grid-cols-4 items-start gap-app">
      <el-card shadow="never">
        <template #header>
          <div class="flex justify-between items-center gap-app">
            <el-button @click="$router.back()" text class="m-0!">
              <el-icon><el-icon-arrow-left /></el-icon>
            </el-button>
            <span class="hidden lg:block">{{ $t('generalInfo') }}</span>
            <el-button @click="dialogRef?.open()" text class="m-0!">
              <el-icon><el-icon-edit /></el-icon>
            </el-button>
          </div>
        </template>
        <div class="space-y-app">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('status') }}</label>
            <span :class="`badge-app-${ status[formData.status]?.color }`">{{ $t(status[formData.status]?.label || '-') }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('name') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.name }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ formData.project ? $t('project') : $t('client') }}</label>
            <span v-if="formData.project" class="block text-sm text-gray-900">{{ formData.project.name }}</span>
            <span v-else-if="formData.client" class="block text-sm text-gray-900">{{ formData.client.name }}</span>
            <span v-else class="block text-sm text-gray-400">{{ $t('notProvided') }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalAmountItems') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.currency(formData.total_amount) }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalAmountReceived') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.currency(formData.total_amount_received) }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalAmountExpensed') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.currency(formData.total_amount_expensed) }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('note') }}</label>
            <span v-if="formData.note" class="block text-sm text-gray-900">{{ formData.note }}</span>
            <span v-else class="block text-sm text-gray-400">{{ $t('notProvided') }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('createdAt') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.date(formData.created_at) }}</span>
          </div>
        </div>
      </el-card>
      <div class="col-span-1 md:col-span-3 flex-1 space-y-app">
        <el-tabs v-model="tab" type="border-card">
          <el-tab-pane :label="$t('items')" name="items">
            <div v-if="tab === 'items'" class="flex flex-col items-end gap-4">
              <el-button v-if="formData.status === 0" @click="batchAddDialogRef?.open()" type="success">
                {{ $t('addItems') }}
                <el-icon class="ml-2"><el-icon-plus /></el-icon>
              </el-button>
              <data-grid-app
                ref="itemsDataGridRef"
                :config="itemsDataGridConfig"
                @row-click="onItemRowClick"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane :label="$t('transactions')" name="transactions">
            <div v-if="tab === 'transactions'" class="flex flex-col items-end gap-4">
              <el-button v-if="formData.status === 0" @click="transactionCreateDialogRef?.open()" type="success">
                {{ $t('add') }}
                <el-icon class="ml-2"><el-icon-plus /></el-icon>
              </el-button>
              <data-grid-app :config="transactionsDataGridConfig" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <edit-dialog-app ref="dialogRef" :sale_uid="formData.uid" @submitted="load()" />
    <batch-add-dialog-app ref="batchAddDialogRef" :sale_uid="formData.uid" @submitted="onItemsChanged" />
    <item-edit-dialog-app ref="itemEditDialogRef" @submitted="onItemsChanged" />
    <transaction-create-dialog-app ref="transactionCreateDialogRef" :sale="formData" @submitted="load()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { get } from '../api';
import itemsApi from '../items/api';
import type { Sale } from '../type';
import { status } from '../constant';
import type { DataGridAppRef, DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';
import { previewImage } from '@/services/files';

import EditDialogApp from '../components/dialogs/edit.vue';
import BatchAddDialogApp from '../items/components/dialogs/batch-add.vue';
import ItemEditDialogApp from '../items/components/dialogs/edit.vue';

import transactionsApi from '@/modules/transactions/api';

import TransactionCreateDialogApp from '@/modules/transactions/components/dialogs/create.vue';
import type { Transaction } from '@/modules/transactions/type.ts';
import ConstTransaction from '@/modules/transactions/constant';

const { t } = useI18n();
const route = useRoute();

const loadingContainer = ref<('detail')[]>([]);
const tab = ref('items');

const dialogRef = ref<InstanceType<typeof EditDialogApp>>();
const batchAddDialogRef = ref<InstanceType<typeof BatchAddDialogApp>>();
const itemEditDialogRef = ref<InstanceType<typeof ItemEditDialogApp>>();
const itemsDataGridRef = ref<DataGridAppRef>();

const transactionCreateDialogRef = ref<InstanceType<typeof TransactionCreateDialogApp>>();

const formData = ref<Sale>({} as Sale);

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

const onItemRowClick = (event: any) => {
  if (formData.value.status !== 0) return;
  itemEditDialogRef.value?.open(event.data);
};

const onItemsChanged = () => {
  load();
  itemsDataGridRef.value?.instance?.refresh();
};

const itemsDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => itemsApi.getAll({ ...query, sale_uid: route.params.uid as string })
  },
  columns: [
    {
      dataField: 'product.image', caption: t('image'), allowSorting: false, alignment: 'center', width: 120, allowEditing: false,
      cellTemplate: (container: HTMLElement, options: { value: string }) => {
        container.innerHTML = previewImage({ type: 'image', src: options.value, format: 'html' });
      }
    },
    { dataField: 'product.name', caption: t('product'), allowSorting: false },
    { dataField: 'price', caption: t('unitPrice'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'quantity', caption: t('quantity') },
    { dataField: 'total', caption: t('total'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'note', caption: t('note') },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});

const transactionsDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => transactionsApi.getAll({ ...query, sale_uid: route.params.uid as string })
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
</script>
