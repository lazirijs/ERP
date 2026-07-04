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
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('project') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.project.name }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('name') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.name }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('status') }}</label>
            <span :class="`badge-app-${status[formData.status]?.color}`">{{ $t(status[formData.status].label!) }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalAmount') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.currency(formData.total_amount) }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('note') }}</label>
            <span v-if="formData.note" class="block text-sm text-gray-900">{{ formData.note }}</span>
            <span v-else class="block text-sm text-gray-400">{{ $t('noNote') }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('createdAt') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.date(formData.created_at) }}</span>
          </div>
        </div>
      </el-card>
      <div class="col-span-1 md:col-span-3 flex-1 space-y-app">
        <el-tabs v-model="tab" type="border-card">
          <el-tab-pane :label="$t('deliveries')" name="deliveries">
            <div v-if="tab === 'deliveries'" class="flex flex-col items-end gap-4">
              <template v-if="formData.status === 0">
                <el-button @click="createDeliveryDialogRef?.open()" type="success">
                  {{ $t('create') }}
                  <el-icon class="ml-2">
                    <el-icon-plus />
                  </el-icon>
                </el-button>
                <create-delivery-dialog-app ref="createDeliveryDialogRef" :order_uid="formData.uid" @submitted="() => {
                  getData();
                  deliveriesDataGridRef?.instance?.refresh();
                }" />
              </template>
              <data-grid-app
                ref="deliveriesDataGridRef"
                :config="deliveriesDataGridConfig"
                @row-click="$router.push({ name: 'deliveries-detail', params: { uid: $event.data.uid } })"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane :label="$t('items')" name="items">
            <div v-if="tab === 'items'" class="flex flex-col items-end gap-4">
              <template v-if="formData.status === 0">
                <el-button @click="createItemsDialogRef?.open()" type="success">
                  {{ $t('create') }}
                  <el-icon class="ml-2">
                    <el-icon-plus />
                  </el-icon>
                </el-button>
                <create-items-dialog-app ref="createItemsDialogRef" :order_uid="formData.uid" @submitted="() => {
                  getData();
                  itemsDataGridRef?.instance?.refresh();
                }" />
              </template>
              <data-grid-app
                ref="itemsDataGridRef"
                :config="itemsDataGridConfig"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane :label="$t('documents')" name="documents">Documents</el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="dialogRef" :uid="formData.uid" @submitted="getData()" />        
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import orderApi from '../api';
import type { Order } from '../type';

import type { DataGridAppRef, DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';

import { status } from '../constant';
import itemsApi from '../items/api';
import deliveriesApi from '../deliveries/api';
import DeliveryConst from '../deliveries/constant';

import EditDialogApp from '../components/dialogs/edit.vue';
import CreateItemsDialogApp from '../items/components/dialogs/create.vue';
import CreateDeliveryDialogApp from '../deliveries/components/dialogs/create.vue';
import type { Delivery } from '../deliveries/type';

const { t } = useI18n();

const route = useRoute();

const loadingContainer = ref<('detail')[]>(['detail']);

const tab = ref('deliveries');

const deliveriesDataGridRef = ref<DataGridAppRef>();
const itemsDataGridRef = ref<DataGridAppRef>();

const dialogRef = ref<InstanceType<typeof EditDialogApp>>();
const createItemsDialogRef = ref<InstanceType<typeof CreateItemsDialogApp>>();
const createDeliveryDialogRef = ref<InstanceType<typeof CreateDeliveryDialogApp>>();

const formData = ref<Order>({} as Order);

const getData = async () => {
  try {
    loadingContainer.value.push('detail');
    const response = await orderApi.get(route.params.uid as string);
    formData.value = response.detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'detail');
  }
};

onMounted(getData);

const deliveriesDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => deliveriesApi.getAll({ ...query, order_uid: route.params.uid as string })
  },
  columns: [
    { dataField: 'name', caption: t('name') },
    {
      dataField: 'status', caption: t('status'), alignment: 'center', 
      cellTemplate: (container: HTMLElement, options: { value: Delivery["status"] }) => {
        let { label, color } = DeliveryConst.status[options.value];
        container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
      } 
    },
    { dataField: 'total_items', caption: t('totalItems') },
    { dataField: 'total_amount', caption: t('totalPrice'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});

const itemsDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => itemsApi.getAll({ ...query, order_uid: route.params.uid as string })
  },
  columns: [
    { dataField: 'name', caption: t('name') },
    { dataField: 'unit', caption: t('unit') },
    { dataField: 'delivered_quantity', caption: t('deliveredQuantity') },
    { dataField: 'requested_quantity', caption: t('requestedQuantity') },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});
</script>