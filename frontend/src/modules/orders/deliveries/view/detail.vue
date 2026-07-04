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
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('order') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.order.name }}</span>
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
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalItems') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.total_items }}</span>
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
          <el-tab-pane :label="$t('items')" name="items">
            <div v-if="tab === 'items'" class="flex flex-col items-end gap-4">
              <el-button @click="addDeliveryItemsDialogRef?.open()" type="success">
                {{ $t('add') }}
                <el-icon class="ml-2">
                  <el-icon-plus />
                </el-icon>
              </el-button>
              <add-delivery-items-dialog-app ref="addDeliveryItemsDialogRef" :order_uid="formData.order_uid" :delivery_uid="formData.uid" @submitted="getData()" />
              <data-grid-app :config="deliveriesItemsDataGridConfig" />
            </div>
          </el-tab-pane>
          <el-tab-pane :label="$t('documents')" name="documents">
            <div v-if="tab === 'documents'">Documents</div>
          </el-tab-pane>
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

import deliveriesApi from '../api';
import type { Delivery } from '../type';

import type { DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';

import { status } from '../constant';
import deliveriesItemsApi from '../items/api';

import EditDialogApp from '../components/dialogs/edit.vue';
import AddDeliveryItemsDialogApp from '../items/components/dialogs/add.vue';

const { t } = useI18n();

const route = useRoute();

const loadingContainer = ref<('detail')[]>(['detail']);

const tab = ref('items');

const dialogRef = ref<InstanceType<typeof EditDialogApp>>();
const addDeliveryItemsDialogRef = ref<InstanceType<typeof AddDeliveryItemsDialogApp>>();

const formData = ref<Delivery>({} as Delivery);

const getData = async () => {
  try {
    loadingContainer.value.push('detail');
    const response = await deliveriesApi.get(route.params.uid as string);
    formData.value = response.detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'detail');
  }
};

onMounted(getData);

const deliveriesItemsDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => deliveriesItemsApi.getAll({ ...query, delivery_uid: route.params.uid as string })
  },
  columns: [
    { dataField: 'name', caption: t('name') },
    { dataField: 'unit', caption: t('unit') },
    { dataField: 'quantity', caption: t('quantity') },
    { dataField: 'unit_price', caption: t('unitPrice'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'total_price', caption: t('totalPrice'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});
</script>